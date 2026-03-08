from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import GlobalSearchView, FeedView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/profiles/', include('profiles.urls')),
    path('api/jobs/', include('jobs.urls')),
    path('api/applications/', include('applications.urls')),
    path('api/posts/', include('posts.urls')),
    path('api/comments/', include('comments.urls')),
    path('api/services/', include('services.urls')),
    path('api/settings/', include('settings.urls')),
    path('api/messages/', include('messages.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/search/', GlobalSearchView.as_view(), name='global-search'),
    path('api/feed/', FeedView.as_view(), name='feed'),
    path('api/groups/', include('groups.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
