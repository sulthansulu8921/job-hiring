from django.contrib import admin
from .models import Post

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['user', 'post_type', 'created_at']
    list_filter = ['post_type', 'created_at']
    search_fields = ['user__name', 'content']
