from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.db.models import Q
from .models import Message, Conversation
from .serializers import MessageSerializer, ConversationSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        other_user_id = self.request.query_params.get('user_id')
        group_id = self.request.query_params.get('group_id')
        
        if group_id:
            return Message.objects.filter(conversation__group_id=group_id).order_by('timestamp')
            
        if other_user_id:
            return Message.objects.filter(
                (Q(sender=user) & Q(receiver_id=other_user_id)) |
                (Q(sender_id=other_user_id) & Q(receiver=user))
            ).order_by('timestamp')
        return Message.objects.filter(Q(sender=user) | Q(receiver=user))

    def perform_create(self, serializer):
        group_id = self.request.data.get('group_id')
        conversation = None
        
        if group_id:
            conversation, created = Conversation.objects.get_or_create(group_id=group_id)
        
        message = serializer.save(sender=self.request.user, conversation=conversation)
        
        # Broadcast the new message via WebSocket
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        attachment_url = self.request.build_absolute_uri(message.attachment.url) if message.attachment else None
        
        payload = {
            'type': 'chat_message',
            'message_id': message.id,
            'message': message.content or '',
            'sender_id': message.sender.id,
            'sender_name': message.sender.name,
            'message_type': message.message_type,
            'attachment': attachment_url,
            'timestamp': str(message.timestamp)
        }
        
        if message.receiver:
            payload['receiver_id'] = message.receiver.id
            # Send to receiver's group
            async_to_sync(channel_layer.group_send)(f"user_{message.receiver.id}", payload)
            # Send to sender's group
            async_to_sync(channel_layer.group_send)(f"user_{message.sender.id}", payload)
            
            # Send notification
            notification_payload = {
                'type': 'notification_message',
                'notification': {
                    'type': 'new_message',
                    'message': f'{message.sender.name}: {message.content[:60]}',
                    'sender_id': message.sender.id,
                    'is_read': False,
                }
            }
            async_to_sync(channel_layer.group_send)(f"notifications_{message.receiver.id}", notification_payload)
        elif message.conversation and message.conversation.group:
            gid = message.conversation.group.id
            payload['group_id'] = gid
            # Send to group channel
            async_to_sync(channel_layer.group_send)(f"group_{gid}", payload)
        elif group_id:
            # Fallback if conversation.group relation missing but group_id was provided
            payload['group_id'] = int(group_id)
            async_to_sync(channel_layer.group_send)(f"group_{group_id}", payload)

class ConversationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        # Get unique users who have messaged with the current user
        sent_to = Message.objects.filter(sender=user).values_list('receiver', flat=True)
        received_from = Message.objects.filter(receiver=user).values_list('sender', flat=True)
        user_ids = set(list(sent_to) + list(received_from))

        users = User.objects.filter(id__in=user_ids)
        conversations = []
        for other_user in users:
            last_msg = Message.objects.filter(
                (Q(sender=user) & Q(receiver=other_user)) |
                (Q(sender=other_user) & Q(receiver=user))
            ).order_by('-timestamp').first()

            # Build avatar URL properly — ImageField gives a file object, not a URL string
            avatar_field = getattr(other_user, 'avatar', None)
            if avatar_field and hasattr(avatar_field, 'url'):
                try:
                    avatar_url = request.build_absolute_uri(avatar_field.url)
                except Exception:
                    avatar_url = f"https://ui-avatars.com/api/?name={other_user.name}&background=random"
            else:
                avatar_url = f"https://ui-avatars.com/api/?name={other_user.name}&background=random"

            # Count unread messages *from* the other user *to* the current user
            unread_count = Message.objects.filter(
                sender=other_user,
                receiver=user,
                is_read=False
            ).count()

            conversations.append({
                'id': other_user.id,
                'user': {
                    'id': other_user.id,
                    'name': other_user.name,
                    'avatar': avatar_url,
                    'role': getattr(other_user, 'title', '') or 'Member',
                    'online': False,  # Real-time presence tracking not yet implemented
                },
                'lastMessage': last_msg.content if last_msg else "",
                'time': last_msg.timestamp.strftime("%I:%M %p") if last_msg else "",
                'unread': unread_count,
            })

        # Sort conversations by last message time, newest first
        conversations.sort(
            key=lambda c: last_msg.timestamp if last_msg else user.date_joined, 
            reverse=True
        )

        return Response(conversations)

class MessageMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_id = request.data.get('user_id')
        if user_id:
            # Mark all messages sent by `user_id` to current user as read
            Message.objects.filter(
                sender_id=user_id,
                receiver=request.user,
                is_read=False
            ).update(is_read=True)
            return Response({'status': 'marked as read'})
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

class MessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only edit or delete messages they sent
        return Message.objects.filter(sender=self.request.user)

    def perform_update(self, serializer):
        message = serializer.save()
        
        # Broadcast the update via WebSocket
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        payload = {
            'type': 'chat_message',
            'event_type': 'message_edited',
            'message_id': message.id,
            'message': message.content,
            'receiver_id': message.receiver.id,
            'sender_id': message.sender.id,
        }
        
        async_to_sync(channel_layer.group_send)(f"user_{message.receiver.id}", payload)
        async_to_sync(channel_layer.group_send)(f"user_{message.sender.id}", payload)

    def perform_destroy(self, instance):
        message_id = instance.id
        receiver_id = instance.receiver.id
        sender_id = instance.sender.id
        
        instance.delete()
        
        # Broadcast the deletion via WebSocket
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        payload = {
            'type': 'chat_message',
            'event_type': 'message_deleted',
            'message_id': message_id,
            'receiver_id': receiver_id,
            'sender_id': sender_id,
        }
        
        async_to_sync(channel_layer.group_send)(f"user_{receiver_id}", payload)
        async_to_sync(channel_layer.group_send)(f"user_{sender_id}", payload)

class MessageClearConversationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, user_id):
        user = request.user
        
        # Delete all messages between the current user and user_id
        deleted_count, _ = Message.objects.filter(
            (Q(sender=user) & Q(receiver_id=user_id)) |
            (Q(sender_id=user_id) & Q(receiver=user))
        ).delete()
        
        return Response({'status': 'conversation cleared', 'deleted_count': deleted_count})

