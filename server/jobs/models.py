from django.db import models
from django.conf import settings

class Job(models.Model):
    JOB_TYPES = (
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('remote', 'Remote'),
    )

    title = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    company_logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    description = models.TextField()
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    location = models.CharField(max_length=255)
    job_type = models.CharField(max_length=50, choices=JOB_TYPES, default='full_time')
    experience = models.CharField(max_length=255, blank=True, null=True)
    is_urgent = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='jobs_created')
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_jobs', blank=True)
    dislikes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='disliked_jobs', blank=True)
    saved_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='saved_jobs', blank=True)
    hidden_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='hidden_jobs', blank=True)
    interested_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='interested_jobs', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} at {self.company_name}"

    @property
    def likes_count(self):
        return self.likes.count()

    @property
    def dislikes_count(self):
        return self.dislikes.count()

    @property
    def comments_count(self):
        return self.comments.count()
