from .models import Profile, Connection
from .serializers import ProfileSerializer
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

User = get_user_model()

class ProfileDetailView(generics.RetrieveAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

class ProfileUpdateView(generics.UpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

class UserProfileDetailView(generics.RetrieveAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'user_id'

class ConnectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        target_user = get_object_or_404(User, id=user_id)
        if target_user == request.user:
            return Response({'error': 'You cannot connect with yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if the target user has already sent a request to the current user
        incoming_connection = Connection.objects.filter(user=target_user, target=request.user).first()
        if incoming_connection:
            if incoming_connection.status == 'pending':
                # Accept it instead
                incoming_connection.status = 'accepted'
                incoming_connection.save()
                return Response({'status': 'connected'}, status=status.HTTP_200_OK)
            return Response({'status': 'already connected'}, status=status.HTTP_200_OK)

        # Handle outgoing request
        connection = Connection.objects.filter(user=request.user, target=target_user).first()
        
        if connection:
            connection.delete()
            return Response({'status': 'disconnected'}, status=status.HTTP_200_OK)
        else:
            Connection.objects.create(user=request.user, target=target_user, status='pending')
            
            # Create a notification for the target user
            from notifications.models import Notification
            Notification.objects.create(
                user=target_user,
                type='connection_request',
                message=f"{request.user.name} sent you a connection request."
            )
            
            return Response({'status': 'pending'}, status=status.HTTP_200_OK)

class AcceptConnectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        sender = get_object_or_404(User, id=user_id)
        connection = get_object_or_404(Connection, user=sender, target=request.user, status='pending')
        connection.status = 'accepted'
        connection.save()
        
        # Notify the sender that their request was accepted
        from notifications.models import Notification
        Notification.objects.create(
            user=sender,
            type='connection_accepted',
            message=f"{request.user.name} accepted your connection request."
        )
        
        return Response({'status': 'connected'}, status=status.HTTP_200_OK)

class RejectConnectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        sender = get_object_or_404(User, id=user_id)
        connection = get_object_or_404(Connection, user=sender, target=request.user, status='pending')
        connection.delete()
        return Response({'status': 'rejected'}, status=status.HTTP_200_OK)

class PendingConnectionsListView(generics.ListAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return profiles of users who have sent a pending request to the current user
        pending_requests = Connection.objects.filter(target=self.request.user, status='pending')
        sender_ids = pending_requests.values_list('user_id', flat=True)
        return Profile.objects.filter(user_id__in=sender_ids)

class SnoozeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        from .models import Snooze
        from django.utils import timezone
        from datetime import timedelta
        
        target_user = get_object_or_404(User, id=user_id)
        if target_user == request.user:
            return Response({'error': 'You cannot snooze yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
        snooze, created = Snooze.objects.get_or_create(
            user=request.user, 
            target=target_user,
            defaults={'expires_at': timezone.now() + timedelta(days=30)}
        )
        
        if not created:
            snooze.delete()
            return Response({'status': 'unsnoozed'}, status=status.HTTP_200_OK)
        
        return Response({'status': 'snoozed', 'expires_at': snooze.expires_at}, status=status.HTTP_200_OK)
