from rest_framework import generics, permissions
from .models import Job
from .serializers import JobSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .filters import JobFilter
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

class JobListCreateView(generics.ListCreateAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = JobFilter
    search_fields = ['title', 'company_name', 'location']
    ordering_fields = ['created_at', 'salary_max']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

from posts.permissions import IsOwnerOrAdmin

class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrAdmin]

class UrgentJobListView(generics.ListAPIView):
    queryset = Job.objects.filter(is_urgent=True)
    serializer_class = JobSerializer
    permission_classes = [permissions.AllowAny]

class FullTimeJobListView(generics.ListAPIView):
    queryset = Job.objects.filter(job_type='full_time')
    serializer_class = JobSerializer
    permission_classes = [permissions.AllowAny]

class PartTimeJobListView(generics.ListAPIView):
    queryset = Job.objects.filter(job_type='part_time')
    serializer_class = JobSerializer
    permission_classes = [permissions.AllowAny]

class RemoteJobListView(generics.ListAPIView):
    queryset = Job.objects.filter(job_type='remote')
    serializer_class = JobSerializer
    permission_classes = [permissions.AllowAny]

class JobLikeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        job = get_object_or_404(Job, pk=pk)
        if request.user in job.likes.all():
            job.likes.remove(request.user)
            status_msg = 'unliked'
        else:
            job.likes.add(request.user)
            job.dislikes.remove(request.user)
            status_msg = 'liked'
        
        return Response({
            'status': status_msg,
            'likes_count': job.likes_count,
            'dislikes_count': job.dislikes_count
        }, status=status.HTTP_200_OK)

class JobDislikeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        job = get_object_or_404(Job, pk=pk)
        if request.user in job.dislikes.all():
            job.dislikes.remove(request.user)
            status_msg = 'undisliked'
        else:
            job.dislikes.add(request.user)
            job.likes.remove(request.user)
            status_msg = 'disliked'
        
        return Response({
            'status': status_msg,
            'likes_count': job.likes_count,
            'dislikes_count': job.dislikes_count
        }, status=status.HTTP_200_OK)

class JobSaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        job = get_object_or_404(Job, pk=pk)
        if request.user in job.saved_by.all():
            job.saved_by.remove(request.user)
            status_msg = 'unsaved'
        else:
            job.saved_by.add(request.user)
            status_msg = 'saved'
        
        return Response({'status': status_msg}, status=status.HTTP_200_OK)

class JobHideView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        job = get_object_or_404(Job, pk=pk)
        if request.user in job.hidden_by.all():
            job.hidden_by.remove(request.user)
            status_msg = 'unhidden'
        else:
            job.hidden_by.add(request.user)
            status_msg = 'hidden'
        
        return Response({'status': status_msg}, status=status.HTTP_200_OK)

class JobInterestedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        job = get_object_or_404(Job, pk=pk)
        if request.user in job.interested_by.all():
            job.interested_by.remove(request.user)
            status_msg = 'uninterested'
        else:
            job.interested_by.add(request.user)
            status_msg = 'interested'
        
        return Response({'status': status_msg}, status=status.HTTP_200_OK)
