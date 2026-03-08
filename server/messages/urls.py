from django.urls import path
from .views import (
    MessageListCreateView, 
    ConversationListView, 
    MessageMarkReadView,
    MessageDetailView,
    MessageClearConversationView
)

urlpatterns = [
    path('', MessageListCreateView.as_view(), name='message-list'),
    path('<int:pk>/', MessageDetailView.as_view(), name='message-detail'),
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('conversations/<int:user_id>/', MessageClearConversationView.as_view(), name='conversation-clear'),
    path('send/', MessageListCreateView.as_view(), name='message-send'),
    path('read/', MessageMarkReadView.as_view(), name='message-read'),
]
