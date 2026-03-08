from django.contrib import admin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['email', 'name', 'is_verified', 'is_staff']
    search_fields = ['email', 'name']
    list_filter = ['is_verified', 'is_staff', 'is_active']
