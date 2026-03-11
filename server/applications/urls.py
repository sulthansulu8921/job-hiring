from django.urls import path
from .views import ApplicationListCreateView, ApplicationDetailView, EmployerApplicationListView, ApplicationStatusUpdateView

urlpatterns = [
    path('', ApplicationListCreateView.as_view(), name='application-list'),
    path('apply/', ApplicationListCreateView.as_view(), name='application-create'), # Alias requested by user
    path('employer/', EmployerApplicationListView.as_view(), name='employer-application-list'),
    path('<int:pk>/', ApplicationDetailView.as_view(), name='application-detail'),
    path('<int:pk>/status/', ApplicationStatusUpdateView.as_view(), name='application-status-update'),
]
