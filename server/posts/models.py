from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Post(models.Model):
    POST_TYPES = (
        ('regular', 'Regular'),
        ('job', 'Job Related'),
        ('service', 'Service Related'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='post_images/', null=True, blank=True)
    post_type = models.CharField(max_length=50, choices=POST_TYPES, default='regular')
    group = models.ForeignKey('groups.Group', on_delete=models.SET_NULL, null=True, blank=True, related_name='posts')
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_posts', blank=True)
    dislikes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='disliked_posts', blank=True)
    saved_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='saved_posts', blank=True)
    hidden_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='hidden_posts', blank=True)
    interested_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='interested_posts', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post by {self.user.name} at {self.created_at}"

    class Meta:
        ordering = ['-created_at']

    @property
    def likes_count(self):
        return self.likes.count()

    @property
    def dislikes_count(self):
        return self.dislikes.count()

    @property
    def comments_count(self):
        return self.comments.count()

class Report(models.Model):
    REPORT_REASONS = (
        ('spam', 'Spam'),
        ('harassment', 'Harassment'),
        ('hate_speech', 'Hate Speech'),
        ('inappropriate', 'Inappropriate Content'),
        ('other', 'Other'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports_made')
    
    # Generic Foreign Key to report Post, Job, or Service
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    reason = models.CharField(max_length=50, choices=REPORT_REASONS)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report by {self.user.email} on {self.content_type} {self.object_id}"
