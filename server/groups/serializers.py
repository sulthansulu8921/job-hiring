from rest_framework import serializers
from .models import Group
from accounts.serializers import UserSerializer

class GroupSerializer(serializers.ModelSerializer):
    created_by_details = UserSerializer(source='created_by', read_only=True)
    members_count = serializers.IntegerField(read_only=True)
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'image', 'banner', 'members', 'members_count', 'is_member', 'created_by', 'created_by_details', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False
