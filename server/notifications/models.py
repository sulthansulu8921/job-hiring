from django.db import models
from django.conf import settings

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('job_alert', 'Job Alert'),
        ('new_message', 'New Message'),
        ('application_update', 'Application Update'),
        ('profile_reminder', 'Profile Reminder'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_display()} for {self.user.name}"

    class Meta:
        ordering = ['-created_at']
