from django_filters import rest_framework as filters
from .models import Job

class JobFilter(filters.FilterSet):
    location = filters.CharFilter(field_name="location", lookup_expr='icontains')
    salary_min = filters.NumberFilter(field_name="salary_min", lookup_expr='gte')
    salary_max = filters.NumberFilter(field_name="salary_max", lookup_expr='lte')
    
    class Meta:
        model = Job
        fields = ['job_type', 'is_urgent', 'experience', 'created_by_id']
