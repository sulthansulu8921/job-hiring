from django.contrib import admin
from .models import UserSettings

@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_notifications', 'profile_visibility', 'two_factor_auth']
    search_fields = ['user__email', 'user__name']
