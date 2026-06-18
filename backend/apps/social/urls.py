from django.urls import path

from .views import (
    CommentDeleteView,
    CommentListCreateView,
    FavoriteToggleView,
    RatingView,
)

app_name = 'social'

urlpatterns = [
    path('recipes/<int:recipe_pk>/favorite/', FavoriteToggleView.as_view(), name='recipe-favorite'),
    path('recipes/<int:recipe_pk>/rate/', RatingView.as_view(), name='recipe-rate'),
    path('recipes/<int:recipe_pk>/comments/', CommentListCreateView.as_view(), name='recipe-comments'),
    path('comments/<int:pk>/', CommentDeleteView.as_view(), name='comment-delete'),
]
