from django.db.models import Avg
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.recipes.models import Recipe

from .models import Comment, Favorite, Rating
from .permissions import CanDeleteComment
from .serializers import CommentSerializer, RatingSerializer


class FavoriteToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, recipe_pk):
        recipe = get_object_or_404(Recipe, pk=recipe_pk)
        favorite, created = Favorite.objects.get_or_create(
            user=request.user, recipe=recipe
        )
        if not created:
            favorite.delete()
        return Response(
            {'is_favorited': created, 'recipe_id': recipe_pk},
            status=status.HTTP_200_OK,
        )


class RatingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, recipe_pk):
        recipe = get_object_or_404(Recipe, pk=recipe_pk)
        serializer = RatingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        rating, _ = Rating.objects.update_or_create(
            user=request.user,
            recipe=recipe,
            defaults={'value': serializer.validated_data['value']},
        )
        avg = Recipe.objects.filter(pk=recipe_pk).aggregate(
            avg=Avg('ratings__value')
        )['avg']
        return Response({
            'value': rating.value,
            'avg_rating': round(avg, 2) if avg else None,
            'recipe_id': recipe_pk,
        })


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        get_object_or_404(Recipe, pk=self.kwargs['recipe_pk'])
        return Comment.objects.filter(
            recipe_id=self.kwargs['recipe_pk']
        ).select_related('author')

    def perform_create(self, serializer):
        recipe = get_object_or_404(Recipe, pk=self.kwargs['recipe_pk'])
        serializer.save(author=self.request.user, recipe=recipe)


class CommentDeleteView(generics.DestroyAPIView):
    queryset = Comment.objects.select_related('author', 'recipe__author')
    permission_classes = [permissions.IsAuthenticated, CanDeleteComment]
