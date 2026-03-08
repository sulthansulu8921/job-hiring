from rest_framework import serializers
from .models import Application
from jobs.serializers import JobSerializer

class ApplicationSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(source='job', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = Application
        fields = ['id', 'user', 'user_name', 'job', 'job_details', 'status', 'resume', 'created_at']
        read_only_fields = ['id', 'user', 'status', 'created_at']

    def validate(self, data):
        # Prevent applying to the same job multiple times implicitly handled by unique_together,
        # but let's give a friendly error.
        request = self.context.get('request')
        job = data.get('job')
        if request and request.user and job:
            if Application.objects.filter(user=request.user, job=job).exists():
                raise serializers.ValidationError("You have already applied for this job.")
        return data
