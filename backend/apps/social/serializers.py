from django.contrib.auth.models import User
from rest_framework import serializers

from apps.common.validators import no_html

from .models import Comment, Rating


class CommentAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


class CommentSerializer(serializers.ModelSerializer):
    author = CommentAuthorSerializer(read_only=True)
    text = serializers.CharField(
        max_length=2000, trim_whitespace=True, validators=[no_html]
    )

    class Meta:
        model = Comment
        fields = ['id', 'author', 'text', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']

    def validate_text(self, value):
        if not value.strip():
            raise serializers.ValidationError('Комментарий не может быть пустым.')
        return value


class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ['id', 'value', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_value(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Рейтинг должен быть от 1 до 5.')
        return value
