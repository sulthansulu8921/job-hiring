from rest_framework import generics, permissions
from .models import UserSettings
from .serializers import UserSettingsSerializer

class UserSettingsDetailView(generics.RetrieveAPIView):
    serializer_class = UserSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.settings

class UserSettingsUpdateView(generics.UpdateAPIView):
    serializer_class = UserSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.settings
