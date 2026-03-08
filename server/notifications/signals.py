from django.db.models.signals import post_save
from django.dispatch import receiver
from messages.models import Message
from .utils import create_notification

@receiver(post_save, sender=Message)
def message_notification(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=instance.receiver,
            type='new_message',
            message=f"New message from {instance.sender.name}: {instance.content[:50]}..."
        )
