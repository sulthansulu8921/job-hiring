from rest_framework import serializers
from .models import Job

class JobSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='created_by.name', read_only=True)
    user_avatar = serializers.ImageField(source='created_by.avatar', read_only=True)

    likes_count = serializers.IntegerField(read_only=True)
    dislikes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_disliked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    is_interested = serializers.SerializerMethodField()
    is_hidden = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    connection_status = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = ['id', 'title', 'company_name', 'company_logo', 'description', 'salary_min', 'salary_max', 'location', 'job_type', 'experience', 'is_urgent', 'created_by', 'user_name', 'user_avatar', 'likes_count', 'dislikes_count', 'comments_count', 'is_liked', 'is_disliked', 'is_saved', 'is_interested', 'is_hidden', 'type', 'connection_status', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_is_liked(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return obj.likes.filter(id=user.id).exists()
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
        return 'JOB'

    def get_connection_status(self, obj):
        from profiles.models import Connection
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            target = obj.created_by
            if request.user.id == target.id:
                return 'self'
            outgoing = Connection.objects.filter(user=request.user, target=target).first()
            if outgoing:
                return outgoing.status
            incoming = Connection.objects.filter(user=target, target=request.user).first()
            if incoming:
                if incoming.status == 'accepted':
                    return 'accepted'
                return 'received'
        return 'none'
