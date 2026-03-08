from django.urls import path
from .views import NotificationListView, NotificationMarkReadView, NotificationClearAllView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('read/', NotificationMarkReadView.as_view(), name='notification-read'),
    path('clear/', NotificationClearAllView.as_view(), name='notification-clear'),
]
