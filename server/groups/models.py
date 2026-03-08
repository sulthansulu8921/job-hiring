from django.db import models
from django.conf import settings

class Group(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to='group_images/', null=True, blank=True)
    banner = models.ImageField(upload_to='group_banners/', null=True, blank=True)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='joined_groups', blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_groups')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def members_count(self):
        return self.members.count()

    class Meta:
        ordering = ['-created_at']
