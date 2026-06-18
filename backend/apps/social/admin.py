from django.contrib import admin

from .models import Comment, Favorite, Rating


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['author', 'recipe', 'created_at']
    list_filter = ['recipe']
    search_fields = ['author__username', 'text']


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ['user', 'recipe', 'value', 'created_at']
    list_filter = ['value']


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'recipe', 'created_at']
