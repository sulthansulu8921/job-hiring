from django.urls import path
from .views import UserSettingsDetailView, UserSettingsUpdateView

urlpatterns = [
    path('', UserSettingsDetailView.as_view(), name='settings-detail'),
    path('update/', UserSettingsUpdateView.as_view(), name='settings-update'),
]
