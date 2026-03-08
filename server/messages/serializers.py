from rest_framework import serializers
from .models import Conversation, Message

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.name', read_only=True)
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    receiver_id = serializers.IntegerField(source='receiver.id', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_id', 'sender_name', 'receiver', 'receiver_id', 'receiver_name', 'content', 'message_type', 'attachment', 'timestamp']
        read_only_fields = ['id', 'sender', 'sender_id', 'timestamp']
        extra_kwargs = {
            'receiver': {'required': False, 'allow_null': True},
            'conversation': {'required': False, 'allow_null': True}
        }

class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'created_at', 'messages']
        read_only_fields = ['id', 'created_at']
