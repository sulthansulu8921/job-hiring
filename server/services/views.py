from rest_framework import generics, permissions, viewsets
from .models import ServiceCategory, Service
from .serializers import ServiceCategorySerializer, ServiceSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

class ServiceCategoryListView(generics.ListAPIView):
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.AllowAny]

    @method_decorator(cache_page(60 * 60)) 
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

from posts.permissions import IsOwnerOrAdmin

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user', 'category', 'location']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['created_at', 'price_min']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        category_data = self.request.data.get('category')
        category = None
        if category_data:
            if isinstance(category_data, int) or (isinstance(category_data, str) and category_data.isdigit()):
                category = ServiceCategory.objects.filter(id=int(category_data)).first()
            else:
                category, _ = ServiceCategory.objects.get_or_create(name=category_data)
        
        serializer.save(user=self.request.user, category=category)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        service = self.get_object()
        if request.user in service.likes.all():
            service.likes.remove(request.user)
            status_msg = 'unliked'
        else:
            service.likes.add(request.user)
            service.dislikes.remove(request.user)
            status_msg = 'liked'
        
        return Response({
            'status': status_msg,
            'likes_count': service.likes_count,
            'dislikes_count': service.dislikes_count
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def dislike(self, request, pk=None):
        service = self.get_object()
        if request.user in service.dislikes.all():
            service.dislikes.remove(request.user)
            status_msg = 'undisliked'
        else:
            service.dislikes.add(request.user)
            service.likes.remove(request.user)
            status_msg = 'disliked'
        
        return Response({
            'status': status_msg,
            'likes_count': service.likes_count,
            'dislikes_count': service.dislikes_count
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def save(self, request, pk=None):
        service = self.get_object()
        if request.user in service.saved_by.all():
            service.saved_by.remove(request.user)
            status_msg = 'unsaved'
        else:
            service.saved_by.add(request.user)
            status_msg = 'saved'
        
        return Response({'status': status_msg}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def hide(self, request, pk=None):
        service = self.get_object()
        if request.user in service.hidden_by.all():
            service.hidden_by.remove(request.user)
            status_msg = 'unhidden'
        else:
            service.hidden_by.add(request.user)
            status_msg = 'hidden'
        
        return Response({'status': status_msg}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def interested(self, request, pk=None):
        service = self.get_object()
        if request.user in service.interested_by.all():
            service.interested_by.remove(request.user)
            status_msg = 'uninterested'
        else:
            service.interested_by.add(request.user)
            status_msg = 'interested'
        
        return Response({'status': status_msg}, status=status.HTTP_200_OK)
