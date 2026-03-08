import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def validate_google_id_token(id_token):
    # In a real app, use google-auth library
    # Here we use the tokeninfo endpoint for simplicity
    response = requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={id_token}')
    if response.status_code == 200:
        return response.json()
    return None

def google_get_or_create_user(id_token):
    payload = validate_google_id_token(id_token)
    if not payload:
        return None
    
    email = payload.get('email')
    name = payload.get('name', '')
    avatar = payload.get('picture', '')

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'name': name,
            'avatar': avatar,
            'is_verified': True
        }
    )
    return user
