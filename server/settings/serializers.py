from rest_framework import serializers
from .models import UserSettings

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ['id', 'user', 'email_notifications', 'profile_visibility', 'two_factor_auth']
        read_only_fields = ['id', 'user']
