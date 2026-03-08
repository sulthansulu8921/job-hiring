from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Group
from .serializers import GroupSerializer

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        group = serializer.save(created_by=self.request.user)
        group.members.add(self.request.user)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        group = self.get_object()
        group.members.add(request.user)
        return Response({'status': 'joined'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        group = self.get_object()
        if group.created_by == request.user:
            return Response({'error': 'Owner cannot leave the group'}, status=status.HTTP_400_BAD_REQUEST)
        group.members.remove(request.user)
        return Response({'status': 'left'}, status=status.HTTP_200_OK)
