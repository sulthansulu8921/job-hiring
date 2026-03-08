from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Post
from .serializers import PostSerializer

from .permissions import IsOwnerOrAdmin

class PostListCreateView(generics.ListCreateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrAdmin]

class PostLikeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        if request.user in post.likes.all():
            post.likes.remove(request.user)
            status_msg = 'unliked'
        else:
            post.likes.add(request.user)
            post.dislikes.remove(request.user) # Mutual exclusive
            status_msg = 'liked'
        
        return Response({
            'status': status_msg,
            'likes_count': post.likes_count,
            'dislikes_count': post.dislikes_count
        }, status=status.HTTP_200_OK)

class PostDislikeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        if request.user in post.dislikes.all():
            post.dislikes.remove(request.user)
            status_msg = 'undisliked'
        else:
            post.dislikes.add(request.user)
            post.likes.remove(request.user) # Mutual exclusive
            status_msg = 'disliked'
        
        return Response({
            'status': status_msg,
            'likes_count': post.likes_count,
            'dislikes_count': post.dislikes_count
        }, status=status.HTTP_200_OK)

class PostSaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        if request.user in post.saved_by.all():
            post.saved_by.remove(request.user)
            status_msg = 'unsaved'
        else:
            post.saved_by.add(request.user)
            status_msg = 'saved'
        
        return Response({'status': status_msg}, status=status.HTTP_200_OK)

class PostHideView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        if request.user in post.hidden_by.all():
            post.hidden_by.remove(request.user)
            status_msg = 'unhidden'
        else:
            post.hidden_by.add(request.user)
            status_msg = 'hidden'
        
        return Response({'status': status_msg}, status=status.HTTP_200_OK)

class PostInterestedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        if request.user in post.interested_by.all():
            post.interested_by.remove(request.user)
            status_msg = 'uninterested'
        else:
            post.interested_by.add(request.user)
            status_msg = 'interested'
        
        return Response({'status': status_msg}, status=status.HTTP_200_OK)

class ReportPostView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from .models import Post, Report
        from jobs.models import Job
        from services.models import Service
        from django.contrib.contenttypes.models import ContentType

        # Determine content type: accept explicit param, or fall back to path-based detection
        content_type_param = request.data.get('content_type', None)
        if content_type_param == 'job' or 'jobs' in request.path:
            obj = get_object_or_404(Job, pk=pk)
            content_type = ContentType.objects.get_for_model(Job)
        elif content_type_param == 'service' or 'services' in request.path:
            obj = get_object_or_404(Service, pk=pk)
            content_type = ContentType.objects.get_for_model(Service)
        else:
            obj = get_object_or_404(Post, pk=pk)
            content_type = ContentType.objects.get_for_model(Post)

        reason = request.data.get('reason', 'other')
        description = request.data.get('description', '')

        # Avoid duplicate reports
        existing = Report.objects.filter(
            user=request.user,
            content_type=content_type,
            object_id=obj.id
        ).first()

        if existing:
            return Response({'status': 'already_reported'}, status=status.HTTP_200_OK)

        Report.objects.create(
            user=request.user,
            content_type=content_type,
            object_id=obj.id,
            reason=reason,
            description=description
        )

        return Response({'status': 'reported'}, status=status.HTTP_201_CREATED)
