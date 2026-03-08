from django.db import models
from django.conf import settings
from posts.models import Post
from jobs.models import Job
from services.models import Service

class Comment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments', null=True, blank=True)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='comments', null=True, blank=True)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='comments', null=True, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        target = self.post or self.job or self.service
        return f"Comment by {self.user.name} on {target}"

    class Meta:
        ordering = ['created_at']
