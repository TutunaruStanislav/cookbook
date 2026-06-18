from rest_framework import permissions


class CanDeleteComment(permissions.BasePermission):
    """Comment author OR recipe owner can delete a comment."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user or obj.recipe.author == request.user
