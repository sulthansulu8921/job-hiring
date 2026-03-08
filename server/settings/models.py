from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserSettings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='settings')
    email_notifications = models.BooleanField(default=True)
    profile_visibility = models.CharField(max_length=50, choices=(('public', 'Public'), ('private', 'Private')), default='public')
    two_factor_auth = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.name}'s Settings"

    class Meta:
        verbose_name_plural = "User Settings"

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_settings(sender, instance, created, **kwargs):
    if created:
        UserSettings.objects.create(user=instance)

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_settings(sender, instance, **kwargs):
    instance.settings.save()
