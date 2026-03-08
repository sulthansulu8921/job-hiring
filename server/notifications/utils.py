from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification
from .serializers import NotificationSerializer

def create_notification(user, type, message):
    notification = Notification.objects.create(
        user=user,
        type=type,
        message=message
    )
    
    # Send via WebSocket
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"notify_{user.id}",
        {
            "type": "send_notification",
            "data": NotificationSerializer(notification).data
        }
    )
    return notification
