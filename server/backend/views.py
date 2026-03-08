from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.contrib.auth import get_user_model
from jobs.models import Job
from posts.models import Post
from services.models import Service
from jobs.serializers import JobSerializer
from posts.serializers import PostSerializer
from services.serializers import ServiceSerializer
from accounts.serializers import UserSerializer
from profiles.models import Snooze
from django.utils import timezone

User = get_user_model()

class GlobalSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '')
        
        users = User.objects.filter(name__icontains=query) if query else User.objects.none()
        jobs = Job.objects.filter(title__icontains=query) | Job.objects.filter(company_name__icontains=query) | Job.objects.filter(location__icontains=query) if query else Job.objects.none()
        posts = Post.objects.filter(content__icontains=query) if query else Post.objects.none()
        services = Service.objects.filter(title__icontains=query) | Service.objects.filter(description__icontains=query) | Service.objects.filter(location__icontains=query) if query else Service.objects.none()

        if request.user.is_authenticated:
            # Exclude hidden
            jobs = jobs.exclude(hidden_by=request.user)
            posts = posts.exclude(hidden_by=request.user)
            services = services.exclude(hidden_by=request.user)
            
            # Exclude blocked
            blocked_ids = request.user.blocked_users.values_list('id', flat=True)
            jobs = jobs.exclude(created_by_id__in=blocked_ids)
            posts = posts.exclude(user_id__in=blocked_ids)
            services = services.exclude(user_id__in=blocked_ids)
            users = users.exclude(id__in=blocked_ids)
            
            # Exclude snoozed
            snoozed_ids = Snooze.objects.filter(user=request.user, expires_at__gt=timezone.now()).values_list('target_id', flat=True)
            jobs = jobs.exclude(created_by_id__in=snoozed_ids)
            posts = posts.exclude(user_id__in=snoozed_ids)
            services = services.exclude(user_id__in=snoozed_ids)
            users = users.exclude(id__in=snoozed_ids)
        
        user_serializer = UserSerializer(users, many=True, context={'request': request})
        job_serializer = JobSerializer(jobs, many=True, context={'request': request})
        post_serializer = PostSerializer(posts, many=True, context={'request': request})
        service_serializer = ServiceSerializer(services, many=True, context={'request': request})
        
        return Response({
            'users': user_serializer.data,
            'jobs': job_serializer.data,
            'posts': post_serializer.data,
            'services': service_serializer.data
        })

class FeedView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # A simple aggregation for the mixed feed
        # In a real app, this might be a single table or a union query
        user_id = request.query_params.get('user_id')
        group_id = request.query_params.get('group_id')
        
        posts = Post.objects.all()
        jobs = Job.objects.all()
        services = Service.objects.all()

        if user_id:
            posts = posts.filter(user_id=user_id)
            jobs = jobs.filter(created_by_id=user_id)
            services = services.filter(user_id=user_id)
        
        if group_id:
            posts = posts.filter(group_id=group_id)
            # Jobs and Services don't have group_id yet, so we return empty for them in group context
            # or we could decide not to show them.
            jobs = Job.objects.none()
            services = Service.objects.none()

        if request.user.is_authenticated:
            posts = posts.exclude(hidden_by=request.user)
            jobs = jobs.exclude(hidden_by=request.user)
            services = services.exclude(hidden_by=request.user)
            
            # Blocked & Snoozed
            blocked_ids = request.user.blocked_users.values_list('id', flat=True)
            snoozed_ids = Snooze.objects.filter(user=request.user, expires_at__gt=timezone.now()).values_list('target_id', flat=True)
            exclude_ids = list(blocked_ids) + list(snoozed_ids)
            
            posts = posts.exclude(user_id__in=exclude_ids)
            jobs = jobs.exclude(created_by_id__in=exclude_ids)
            services = services.exclude(user_id__in=exclude_ids)

        # Increase buffer to ensure a truly global sort for the first few pages
        posts = posts.order_by('-created_at')[:100]
        jobs = jobs.order_by('-created_at')[:100]
        services = services.order_by('-created_at')[:100]
        
        post_data = PostSerializer(posts, many=True, context={'request': request}).data
        job_data = JobSerializer(jobs, many=True, context={'request': request}).data
        service_data = ServiceSerializer(services, many=True, context={'request': request}).data
        
        # Mark types for frontend
        for p in post_data: p['feed_type'] = 'regular'
        for j in job_data: j['feed_type'] = 'job'
        for s in service_data: s['feed_type'] = 'service'
        
        combined_feed = post_data + job_data + service_data
        # Sort by created_at
        combined_feed.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        # Slice to return a reasonable first page (e.g., 50 items)
        return Response(combined_feed[:50])
