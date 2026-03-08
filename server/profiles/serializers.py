from rest_framework import serializers
from .models import Profile, Connection

class ProfileSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.name')
    user_email = serializers.ReadOnlyField(source='user.email')
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    connection_status = serializers.SerializerMethodField()
    total_connections = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['id', 'user', 'user_name', 'user_email', 'avatar', 'user_avatar', 'cover_photo', 'bio', 'location', 'skills', 'experience', 'website', 'followers_count', 'following_count', 'connection_status', 'total_connections']
        read_only_fields = ['id', 'user']

    def get_followers_count(self, obj):
        return obj.user.followers.count()

    def get_following_count(self, obj):
        return obj.user.following.count()

    def get_connection_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Check outgoing request
            outgoing = Connection.objects.filter(user=request.user, target=obj.user).first()
            if outgoing:
                return outgoing.status # 'pending' or 'accepted'
            
            # Check incoming request
            incoming = Connection.objects.filter(user=obj.user, target=request.user).first()
            if incoming:
                if incoming.status == 'accepted':
                    return 'accepted'
                return 'received' # The profile owner sent a request to the current user
        return 'none'

    def get_total_connections(self, obj):
        from django.db.models import Q
        return Connection.objects.filter(
            (Q(user=obj.user) | Q(target=obj.user)),
            status='accepted'
        ).count()
