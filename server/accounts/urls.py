from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LogoutView, CustomTokenObtainPairView, UserProfileView, GoogleLoginView, BlockUserView, PublicProfileView, SavedItemsView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', UserProfileView.as_view(), name='me'),
    path('google/', GoogleLoginView.as_view(), name='google-login'),
    path('user/<int:user_id>/', PublicProfileView.as_view(), name='public-profile'),
    path('user/<int:user_id>/block/', BlockUserView.as_view(), name='user-block'),
    path('user/saved/', SavedItemsView.as_view(), name='saved-items'),
]
