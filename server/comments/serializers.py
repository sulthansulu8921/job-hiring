from rest_framework import serializers
from .models import Comment

class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'user_name', 'user_avatar', 'post', 'job', 'service', 'content', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
