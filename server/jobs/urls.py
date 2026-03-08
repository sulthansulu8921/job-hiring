from django.urls import path
from .views import (
    JobListCreateView, JobDetailView, UrgentJobListView,
    FullTimeJobListView, PartTimeJobListView, RemoteJobListView,
    JobLikeView, JobDislikeView,
    JobSaveView, JobHideView, JobInterestedView
)
from posts.views import ReportPostView

urlpatterns = [
    path('', JobListCreateView.as_view(), name='job-list-create'),
    path('urgent/', UrgentJobListView.as_view(), name='job-urgent'),
    path('fulltime/', FullTimeJobListView.as_view(), name='job-fulltime'),
    path('parttime/', PartTimeJobListView.as_view(), name='job-parttime'),
    path('remote/', RemoteJobListView.as_view(), name='job-remote'),
    path('<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('<int:pk>/like/', JobLikeView.as_view(), name='job-like'),
    path('<int:pk>/dislike/', JobDislikeView.as_view(), name='job-dislike'),
    path('<int:pk>/save/', JobSaveView.as_view(), name='job-save'),
    path('<int:pk>/hide/', JobHideView.as_view(), name='job-hide'),
    path('<int:pk>/interested/', JobInterestedView.as_view(), name='job-interested'),
    path('<int:pk>/report/', ReportPostView.as_view(), name='job-report'),
]
