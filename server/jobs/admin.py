from django.contrib import admin
from .models import Job

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'company_name', 'job_type', 'is_urgent', 'created_at']
    search_fields = ['title', 'company_name', 'location']
    list_filter = ['job_type', 'is_urgent', 'created_at']
