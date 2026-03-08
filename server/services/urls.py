from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceCategoryListView, ServiceViewSet
from posts.views import ReportPostView

router = DefaultRouter()
router.register(r'', ServiceViewSet)

urlpatterns = [
    path('categories/', ServiceCategoryListView.as_view(), name='service-category-list'),
    path('', include(router.urls)),
    path('<int:pk>/report/', ReportPostView.as_view(), name='service-report'),
]
