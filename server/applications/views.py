from rest_framework import generics, permissions
from .models import Application
from .serializers import ApplicationSerializer, ApplicationStatusUpdateSerializer

class EmployerApplicationListView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Employers see applications for the jobs they created
        return Application.objects.filter(job__created_by=self.request.user)

class ApplicationStatusUpdateView(generics.UpdateAPIView):
    serializer_class = ApplicationStatusUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only the job creator can update the status
        return Application.objects.filter(job__created_by=self.request.user)

class ApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users see their own applications, job creators might need to see applications for their jobs (if added later)
        return Application.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ApplicationDetailView(generics.RetrieveAPIView):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(user=self.request.user)
