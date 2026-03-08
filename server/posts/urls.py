from django.urls import path
from .views import PostListCreateView, PostDetailView, PostLikeView, PostDislikeView, PostSaveView, PostHideView, PostInterestedView, ReportPostView

urlpatterns = [
    path('', PostListCreateView.as_view(), name='post-list'),
    path('create/', PostListCreateView.as_view(), name='post-create'),
    path('<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('<int:pk>/like/', PostLikeView.as_view(), name='post-like'),
    path('<int:pk>/dislike/', PostDislikeView.as_view(), name='post-dislike'),
    path('<int:pk>/save/', PostSaveView.as_view(), name='post-save'),
    path('<int:pk>/hide/', PostHideView.as_view(), name='post-hide'),
    path('<int:pk>/interested/', PostInterestedView.as_view(), name='post-interested'),
    path('<int:pk>/report/', ReportPostView.as_view(), name='post-report'),
]
