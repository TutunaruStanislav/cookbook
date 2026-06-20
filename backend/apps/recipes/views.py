from django.db.models import Avg, BooleanField, Count, Exists, F, OuterRef, Q, Value
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .filters import RecipeFilter
from .models import Category, Ingredient, Recipe, Tag
from .permissions import IsAuthorOrReadOnly
from .serializers import (
    CategorySerializer,
    IngredientSerializer,
    RecipeDetailSerializer,
    RecipeListSerializer,
    RecipeWriteSerializer,
    TagSerializer,
)


class NullsLastOrderingFilter(filters.OrderingFilter):
    """OrderingFilter that always puts NULLs last, in both directions.

    Without this, PostgreSQL sorts NULLs FIRST on DESC, so unrated recipes
    (avg_rating IS NULL) float to the top of `ordering=-avg_rating` instead of
    the highest-rated ones. A stable id tiebreaker keeps pagination
    deterministic when several recipes share the same average.
    """

    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)
        if not ordering:
            return queryset
        order_by = []
        for term in ordering:
            field = term[1:] if term.startswith('-') else term
            expr = F(field).desc(nulls_last=True) if term.startswith('-') else F(field).asc(nulls_last=True)
            order_by.append(expr)
        order_by.append(F('id').desc())
        return queryset.order_by(*order_by)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = None


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = None


class IngredientViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class RecipeViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, NullsLastOrderingFilter]
    filterset_class = RecipeFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'cooking_time', 'avg_rating']
    ordering = ['-created_at']

    def get_queryset(self):
        from apps.social.models import Favorite  # lazy import — social depends on recipes
        user = self.request.user
        qs = (
            Recipe.objects.select_related('author')
            .prefetch_related(
                'categories', 'tags', 'recipe_ingredients__ingredient', 'steps'
            )
            .annotate(
                avg_rating=Avg('ratings__value'),
                ratings_count=Count('ratings', distinct=True),
            )
        )

        if user.is_authenticated:
            qs = qs.filter(Q(is_public=True) | Q(author=user)).annotate(
                is_favorited=Exists(
                    Favorite.objects.filter(recipe=OuterRef('pk'), user=user)
                )
            )
        else:
            qs = qs.filter(is_public=True).annotate(
                is_favorited=Value(False, output_field=BooleanField())
            )

        # «Что приготовить из…»: ?ingredients=курица,рис
        ingredients_param = self.request.query_params.get('ingredients', '').strip()
        if ingredients_param:
            for name in ingredients_param.split(','):
                name = name.strip()
                if name:
                    qs = qs.filter(
                        recipe_ingredients__ingredient__name__icontains=name
                    )

        # Только избранное текущего пользователя: ?favorites=true
        if (
            self.request.query_params.get('favorites') == 'true'
            and user.is_authenticated
        ):
            qs = qs.filter(favorites__user=user)

        return qs.distinct()

    def get_serializer_class(self):
        if self.action == 'list':
            return RecipeListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return RecipeWriteSerializer
        return RecipeDetailSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAuthorOrReadOnly()]
        return [IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        ctx = self.get_serializer_context()
        target_servings = request.query_params.get('servings')
        if target_servings:
            try:
                ctx['target_servings'] = int(target_servings)
                ctx['base_servings'] = instance.servings
            except (ValueError, TypeError):
                pass
        return Response(RecipeDetailSerializer(instance, context=ctx).data)
