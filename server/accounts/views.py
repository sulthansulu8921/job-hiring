from rest_framework import permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer
from .services import google_get_or_create_user, get_tokens_for_user

User = get_user_model()

class GoogleLoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        id_token = request.data.get('id_token')
        if not id_token:
            return Response({'error': 'id_token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = google_get_or_create_user(id_token)
        if not user:
            return Response({'error': 'Invalid Google token'}, status=status.HTTP_400_BAD_REQUEST)
        
        tokens = get_tokens_for_user(user)
        user_data = UserSerializer(user).data
        return Response({
            'tokens': tokens,
            'user': user_data
        }, status=status.HTTP_200_OK)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                return Response(status=status.HTTP_205_RESET_CONTENT)
            return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class BlockUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        from django.shortcuts import get_object_or_404
        target_user = get_object_or_404(User, id=user_id)
        if target_user == request.user:
            return Response({'error': 'You cannot block yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
        if target_user in request.user.blocked_users.all():
            request.user.blocked_users.remove(target_user)
            return Response({'status': 'unblocked'}, status=status.HTTP_200_OK)
        else:
            request.user.blocked_users.add(target_user)
            return Response({'status': 'blocked'}, status=status.HTTP_200_OK)

class PublicProfileView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'

class SavedItemsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from posts.models import Post
        from jobs.models import Job
        from services.models import Service
        from posts.serializers import PostSerializer
        from jobs.serializers import JobSerializer
        from services.serializers import ServiceSerializer

        saved_posts = Post.objects.filter(saved_by=request.user).order_by('-created_at')
        saved_jobs = Job.objects.filter(saved_by=request.user).order_by('-created_at')
        saved_services = Service.objects.filter(saved_by=request.user).order_by('-created_at')

        post_data = PostSerializer(saved_posts, many=True, context={'request': request}).data
        job_data = JobSerializer(saved_jobs, many=True, context={'request': request}).data
        service_data = ServiceSerializer(saved_services, many=True, context={'request': request}).data

        for p in post_data: p['feed_type'] = 'regular'
        for j in job_data: j['feed_type'] = 'job'
        for s in service_data: s['feed_type'] = 'service'

        combined = list(post_data) + list(job_data) + list(service_data)
        combined.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        return Response(combined)
