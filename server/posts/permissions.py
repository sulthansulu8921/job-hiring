from rest_framework import permissions

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to edit/delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Check if the user is an admin
        if request.user and (request.user.is_staff or request.user.is_superuser):
            return True

        # Ownership check
        # Posts and Services use 'user' field, Jobs use 'created_by' field
        owner = getattr(obj, 'user', None) or getattr(obj, 'created_by', None)
        return owner == request.user
