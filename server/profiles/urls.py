from django.urls import path
from .views import (
    ProfileDetailView, 
    ProfileUpdateView, 
    UserProfileDetailView, 
    ConnectView, 
    SnoozeView,
    AcceptConnectionView,
    RejectConnectionView,
    PendingConnectionsListView
)

urlpatterns = [
    path('me/', ProfileDetailView.as_view(), name='profile-detail'),
    path('me/update/', ProfileUpdateView.as_view(), name='profile-update'),
    path('user/<int:user_id>/', UserProfileDetailView.as_view(), name='user-profile-detail'),
    path('user/<int:user_id>/connect/', ConnectView.as_view(), name='user-connect'),
    path('user/<int:user_id>/accept/', AcceptConnectionView.as_view(), name='user-accept-connection'),
    path('user/<int:user_id>/reject/', RejectConnectionView.as_view(), name='user-reject-connection'),
    path('connections/pending/', PendingConnectionsListView.as_view(), name='pending-connections'),
    path('user/<int:user_id>/snooze/', SnoozeView.as_view(), name='user-snooze'),
]
