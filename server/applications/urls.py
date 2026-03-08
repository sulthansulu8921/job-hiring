from django.urls import path
from .views import ApplicationListCreateView, ApplicationDetailView

urlpatterns = [
    path('', ApplicationListCreateView.as_view(), name='application-list'),
    path('apply/', ApplicationListCreateView.as_view(), name='application-create'), # Alias requested by user
    path('<int:pk>/', ApplicationDetailView.as_view(), name='application-detail'),
]
