import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if self.user.is_anonymous:
            await self.close()
        else:
            # Use "notifications_{id}" to match what ChatConsumer publishes to
            self.room_group_name = f"notifications_{self.user.id}"
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def send_notification(self, event):
        """Generic notification (from signals/other sources)"""
        await self.send(text_data=json.dumps(event.get("data", {})))

    async def notification_message(self, event):
        """New message notification pushed from ChatConsumer"""
        await self.send(text_data=json.dumps(event.get("notification", {})))

