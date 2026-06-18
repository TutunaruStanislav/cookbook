from datetime import date

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.recipes.models import RecipeIngredient

from .models import MealSlot, MenuPlan
from .serializers import MealSlotSerializer, MenuPlanSerializer


def _get_or_create_plan(user, week_start):
    """Get or create a MenuPlan with 21 empty slots (7 days × 3 meals)."""
    plan, created = MenuPlan.objects.get_or_create(user=user, week_start=week_start)
    if created:
        slots = [
            MealSlot(plan=plan, day=day, meal_type=meal_type)
            for day in range(7)
            for meal_type in [MealSlot.MEAL_BREAKFAST, MealSlot.MEAL_LUNCH, MealSlot.MEAL_DINNER]
        ]
        MealSlot.objects.bulk_create(slots)
    return plan


def _parse_week_start(value):
    """Return (date, error_str). Validates YYYY-MM-DD format and Monday."""
    try:
        week_start = date.fromisoformat(value)
    except (ValueError, TypeError):
        return None, 'Неверный формат даты. Используйте YYYY-MM-DD.'
    if week_start.weekday() != 0:
        return None, 'week_start должен быть понедельником.'
    return week_start, None


class MenuPlanView(APIView):
    """GET /api/menu-plan/?week_start=YYYY-MM-DD — план недели, создаётся автоматически."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        week_start_str = request.query_params.get('week_start')
        if not week_start_str:
            return Response(
                {'error': 'Параметр week_start обязателен (YYYY-MM-DD).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        week_start, err = _parse_week_start(week_start_str)
        if err:
            return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)

        plan = _get_or_create_plan(request.user, week_start)
        plan_qs = (
            MenuPlan.objects.prefetch_related(
                'slots__recipe__author',
            )
            .get(pk=plan.pk)
        )
        return Response(MenuPlanSerializer(plan_qs, context={'request': request}).data)


class MealSlotUpdateView(generics.UpdateAPIView):
    """PATCH /api/menu-plan/slots/{id}/ — назначить или убрать рецепт в слоте."""

    serializer_class = MealSlotSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['patch', 'options']

    def get_object(self):
        slot = generics.get_object_or_404(
            MealSlot, pk=self.kwargs['pk'], plan__user=self.request.user
        )
        return slot


class ShoppingListView(APIView):
    """GET /api/menu-plan/shopping-list/?week_start=YYYY-MM-DD — список покупок."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        week_start_str = request.query_params.get('week_start')
        if not week_start_str:
            return Response(
                {'error': 'Параметр week_start обязателен (YYYY-MM-DD).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        week_start, err = _parse_week_start(week_start_str)
        if err:
            return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)

        try:
            plan = MenuPlan.objects.get(user=request.user, week_start=week_start)
        except MenuPlan.DoesNotExist:
            return Response([])

        # Count how many times each recipe appears in the week plan
        recipe_counts: dict[int, int] = {}
        for slot in plan.slots.filter(recipe__isnull=False):
            recipe_counts[slot.recipe_id] = recipe_counts.get(slot.recipe_id, 0) + 1

        if not recipe_counts:
            return Response([])

        # Aggregate ingredients in Python so same recipe used twice counts double
        totals: dict[tuple, dict] = {}
        ris = (
            RecipeIngredient.objects.filter(recipe_id__in=recipe_counts)
            .select_related('ingredient')
        )
        for ri in ris:
            count = recipe_counts[ri.recipe_id]
            key = (ri.ingredient_id, ri.unit)
            if key not in totals:
                totals[key] = {
                    'ingredient_id': ri.ingredient_id,
                    'ingredient': ri.ingredient.name,
                    'unit': ri.unit,
                    'total_amount': 0.0,
                }
            totals[key]['total_amount'] += float(ri.amount) * count

        result = sorted(totals.values(), key=lambda x: x['ingredient'])
        return Response(result)
