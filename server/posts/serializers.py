from rest_framework import serializers
from .models import Post
from groups.serializers import GroupSerializer

class PostSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    group_details = GroupSerializer(source='group', read_only=True)
    is_liked = serializers.SerializerMethodField()
    connection_status = serializers.SerializerMethodField()

    likes_count = serializers.IntegerField(read_only=True)
    dislikes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    is_disliked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    is_interested = serializers.SerializerMethodField()
    is_hidden = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'user', 'user_name', 'user_avatar', 'content', 'image', 'post_type', 'type', 'group', 'group_details', 'likes_count', 'dislikes_count', 'comments_count', 'is_liked', 'is_disliked', 'is_saved', 'is_interested', 'is_hidden', 'connection_status', 'created_at']
        read_only_fields = ['id', 'user', 'created_at', 'likes_count', 'dislikes_count', 'comments_count']

    def get_connection_status(self, obj):
        from profiles.models import Connection
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            target = obj.user
            if request.user.id == target.id:
                return 'self'
            outgoing = Connection.objects.filter(user=request.user, target=target).first()
            if outgoing:
                return outgoing.status  # 'pending' or 'accepted'
            incoming = Connection.objects.filter(user=target, target=request.user).first()
            if incoming:
                if incoming.status == 'accepted':
                    return 'accepted'
                return 'received'
        return 'none'

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def get_is_disliked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.dislikes.filter(id=request.user.id).exists()
        return False

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saved_by.filter(id=request.user.id).exists()
        return False

    def get_is_interested(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.interested_by.filter(id=request.user.id).exists()
        return False

    def get_is_hidden(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.hidden_by.filter(id=request.user.id).exists()
        return False

    def get_type(self, obj):
        mapping = {
            'regular': 'NORMAL',
            'job': 'JOB',
            'service': 'SERVICE'
        }
        return mapping.get(obj.post_type, 'NORMAL')
