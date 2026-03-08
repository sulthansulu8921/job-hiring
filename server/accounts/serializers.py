from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from profiles.models import Connection

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    connection_status = serializers.SerializerMethodField()
    total_connections = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'avatar', 'cover_photo', 'bio', 'location', 'skills', 'is_verified', 'is_staff', 'is_superuser', 'followers_count', 'following_count', 'connection_status', 'total_connections', 'date_joined')
        read_only_fields = ('id', 'is_verified', 'date_joined', 'is_staff', 'is_superuser')

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_connection_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Check outgoing request
            outgoing = Connection.objects.filter(user=request.user, target=obj).first()
            if outgoing:
                return outgoing.status # 'pending' or 'accepted'
            
            # Check incoming request
            incoming = Connection.objects.filter(user=obj, target=request.user).first()
            if incoming:
                if incoming.status == 'accepted':
                    return 'accepted'
                return 'received' # The profile owner sent a request to the current user
        return 'none'

    def get_total_connections(self, obj):
        from django.db.models import Q
        return Connection.objects.filter(
            (Q(user=obj) | Q(target=obj)),
            status='accepted'
        ).count()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password']
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['name'] = user.name
        token['email'] = user.email
        return token
