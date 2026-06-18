from django.contrib.auth.models import User
from django.db.models import Avg, Count, Q
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.recipes.models import Category, Ingredient, Recipe, Tag
from apps.social.models import Comment


class DashboardStatsView(APIView):
    """GET /api/dashboard/stats/ — aggregated stats for charts."""

    permission_classes = [AllowAny]

    def get(self, request):
        public_qs = Recipe.objects.filter(is_public=True)

        # ── Totals ────────────────────────────────────────────────────────────
        totals = {
            'recipes': public_qs.count(),
            'ingredients': Ingredient.objects.count(),
            'comments': Comment.objects.filter(recipe__is_public=True).count(),
            'users': User.objects.filter(is_active=True).count(),
        }

        # ── By category ───────────────────────────────────────────────────────
        by_category = list(
            Category.objects.annotate(
                count=Count('recipes', filter=Q(recipes__is_public=True))
            )
            .filter(count__gt=0)
            .values('name', 'count')
            .order_by('-count')
        )

        # ── By difficulty ─────────────────────────────────────────────────────
        _diff_labels = {'easy': 'Лёгкий', 'medium': 'Средний', 'hard': 'Сложный'}
        by_difficulty = [
            {
                'difficulty': item['difficulty'],
                'label': _diff_labels.get(item['difficulty'], item['difficulty']),
                'count': item['count'],
            }
            for item in (
                public_qs.values('difficulty')
                .annotate(count=Count('id'))
                .order_by('difficulty')
            )
        ]

        # ── By cooking time (4 ranges) ────────────────────────────────────────
        by_cooking_time = [
            {'range': '< 15 мин',   'count': public_qs.filter(cooking_time__lt=15).count()},
            {'range': '15–30 мин',  'count': public_qs.filter(cooking_time__gte=15, cooking_time__lt=30).count()},
            {'range': '30–60 мин',  'count': public_qs.filter(cooking_time__gte=30, cooking_time__lt=60).count()},
            {'range': '> 60 мин',   'count': public_qs.filter(cooking_time__gte=60).count()},
        ]

        # ── Top 5 by average rating ───────────────────────────────────────────
        top_by_rating = list(
            public_qs.annotate(
                avg_rating=Avg('ratings__value'),
                ratings_count=Count('ratings', distinct=True),
            )
            .filter(ratings_count__gt=0)
            .order_by('-avg_rating', '-ratings_count')[:5]
            .values('id', 'title', 'avg_rating', 'ratings_count')
        )

        # ── Top 5 by favorites ────────────────────────────────────────────────
        top_by_favorites = list(
            public_qs.annotate(favorites_count=Count('favorites', distinct=True))
            .filter(favorites_count__gt=0)
            .order_by('-favorites_count')[:5]
            .values('id', 'title', 'favorites_count')
        )

        # ── Top 10 tags ───────────────────────────────────────────────────────
        top_tags = list(
            Tag.objects.annotate(
                count=Count('recipes', filter=Q(recipes__is_public=True))
            )
            .filter(count__gt=0)
            .values('name', 'count')
            .order_by('-count')[:10]
        )

        return Response({
            'totals': totals,
            'by_category': by_category,
            'by_difficulty': by_difficulty,
            'by_cooking_time': by_cooking_time,
            'top_by_rating': top_by_rating,
            'top_by_favorites': top_by_favorites,
            'top_tags': top_tags,
        })
