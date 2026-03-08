import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from .models import Message, Conversation
from groups.models import Group

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if self.user.is_anonymous:
            await self.close(code=4001)
            return

        # Personal group for 1-on-1 and notifications
        self.personal_group = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.personal_group, self.channel_name)
        
        # Join joined groups' channels
        joined_groups = await self.get_joined_groups(self.user)
        for group_id in joined_groups:
            await self.channel_layer.group_add(f"group_{group_id}", self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        if not self.user.is_anonymous:
            await self.channel_layer.group_discard(self.personal_group, self.channel_name)
            joined_groups = await self.get_joined_groups(self.user)
            for group_id in joined_groups:
                await self.channel_layer.group_discard(f"group_{group_id}", self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        message_content = data.get('content')
        receiver_id = data.get('receiver_id') 
        group_id = data.get('group_id')       
        message_type = data.get('type', 'text')

        if action == 'subscribe_group' and group_id:
            await self.channel_layer.group_add(f"group_{group_id}", self.channel_name)
            return

        if not self.user.is_anonymous and message_content:
            sender_name = await self.get_user_name(self.user.id)
            
            if group_id:
                # Group Message
                message = await self.save_group_message(self.user.id, group_id, message_content, message_type)
                if message:
                    payload = {
                        'type': 'chat_message',
                        'message_id': message.id,
                        'message': message_content,
                        'sender_id': self.user.id,
                        'sender_name': sender_name,
                        'group_id': group_id,
                        'message_type': message_type,
                        'timestamp': str(message.timestamp)
                    }
                    await self.channel_layer.group_send(f"group_{group_id}", payload)
            
            elif receiver_id:
                # 1-on-1 Message
                message = await self.save_message(self.user.id, receiver_id, message_content, message_type)
                if message:
                    payload = {
                        'type': 'chat_message',
                        'message_id': message.id,
                        'message': message_content,
                        'sender_id': self.user.id,
                        'sender_name': sender_name,
                        'receiver_id': int(receiver_id),
                        'message_type': message_type,
                        'timestamp': str(message.timestamp)
                    }

                    # Send to receiver
                    await self.channel_layer.group_send(f"user_{receiver_id}", payload)
                    # Send to sender
                    await self.channel_layer.group_send(self.personal_group, payload)

                    # Notification
                    notification_payload = {
                        'type': 'notification_message',
                        'notification': {
                            'type': 'new_message',
                            'message': f'{sender_name}: {message_content[:60]}',
                            'sender_id': self.user.id,
                            'is_read': False,
                        }
                    }
                    await self.channel_layer.group_send(f"notifications_{receiver_id}", notification_payload)
                    await self.create_notification(receiver_id, self.user.id, sender_name, message_content)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_user_name(self, user_id):
        try:
            return User.objects.get(id=user_id).name
        except Exception:
            return 'Someone'

    @database_sync_to_async
    def get_joined_groups(self, user):
        return list(user.joined_groups.values_list('id', flat=True))

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, content, message_type='text'):
        try:
            sender = User.objects.get(id=sender_id)
            receiver = User.objects.get(id=receiver_id)
            return Message.objects.create(sender=sender, receiver=receiver, content=content, message_type=message_type)
        except Exception:
            return None

    @database_sync_to_async
    def save_group_message(self, sender_id, group_id, content, message_type='text'):
        try:
            sender = User.objects.get(id=sender_id)
            group = Group.objects.get(id=group_id)
            conversation, _ = Conversation.objects.get_or_create(group=group)
            return Message.objects.create(
                sender=sender, 
                conversation=conversation, 
                content=content, 
                message_type=message_type
            )
        except Exception:
            return None

    @database_sync_to_async
    def create_notification(self, receiver_id, sender_id, sender_name, message_content):
        try:
            from notifications.models import Notification
            receiver = User.objects.get(id=receiver_id)
            Notification.objects.create(
                user=receiver,
                type='new_message',
                message=f'{sender_name} sent you a message: {message_content[:80]}',
            )
        except Exception:
            pass
