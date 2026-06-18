import django_filters

from .models import Recipe


class RecipeFilter(django_filters.FilterSet):
    difficulty = django_filters.ChoiceFilter(choices=Recipe.DIFFICULTY_CHOICES)
    category = django_filters.NumberFilter(field_name='categories__id')
    tag = django_filters.CharFilter(field_name='tags__slug', lookup_expr='exact')
    min_time = django_filters.NumberFilter(field_name='cooking_time', lookup_expr='gte')
    max_time = django_filters.NumberFilter(field_name='cooking_time', lookup_expr='lte')
    author = django_filters.NumberFilter(field_name='author__id')
    is_public = django_filters.BooleanFilter()

    class Meta:
        model = Recipe
        fields = ['difficulty', 'category', 'tag', 'author', 'is_public']
