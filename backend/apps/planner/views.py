from datetime import date

from django.db.models import Max
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    extend_schema,
    inline_serializer,
)
from rest_framework import permissions, serializers, status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.recipes.models import RecipeIngredient

from .models import MealSlot, MealSlotRecipe, MenuPlan
from .serializers import (
    MealSlotItemWriteSerializer,
    MealSlotSerializer,
    MenuPlanSerializer,
)

# Shared query parameter so Swagger renders an input for it (these are plain
# APIViews, so drf-spectacular can't infer the query param on its own).
WEEK_START_PARAM = OpenApiParameter(
    name='week_start',
    type=OpenApiTypes.DATE,
    location=OpenApiParameter.QUERY,
    required=True,
    description='Понедельник недели в формате YYYY-MM-DD.',
    examples=[OpenApiExample('Понедельник', value='2026-06-15')],
)

SHOPPING_ITEM_SCHEMA = inline_serializer(
    name='ShoppingListItem',
    fields={
        'ingredient_id': serializers.IntegerField(),
        'ingredient': serializers.CharField(),
        'unit': serializers.CharField(),
        'total_amount': serializers.FloatField(),
    },
    many=True,
)

MOVE_SLOT_ITEM_SCHEMA = inline_serializer(
    name='MoveSlotItemRequest',
    fields={'slot': serializers.IntegerField(help_text='ID целевого слота')},
)


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


def _next_position(slot):
    """Append position for a new item in the slot (max existing + 1, else 0)."""
    current_max = slot.items.aggregate(m=Max('position'))['m']
    return 0 if current_max is None else current_max + 1


def _serialized_slot(slot, request):
    slot.refresh_from_db()
    return MealSlotSerializer(slot, context={'request': request}).data


class MenuPlanView(APIView):
    """GET /api/menu-plan/?week_start=YYYY-MM-DD — план недели, создаётся автоматически."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(parameters=[WEEK_START_PARAM], responses=MenuPlanSerializer)
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
        plan_qs = MenuPlan.objects.prefetch_related(
            'slots__items__recipe__author',
        ).get(pk=plan.pk)
        return Response(MenuPlanSerializer(plan_qs, context={'request': request}).data)


class MealSlotItemCreateView(APIView):
    """POST /api/menu-plan/slots/{slot_id}/items/ — добавить блюдо в слот (до 3)."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=MealSlotItemWriteSerializer, responses=MealSlotSerializer)
    def post(self, request, slot_id):
        slot = get_object_or_404(MealSlot, pk=slot_id, plan__user=request.user)
        serializer = MealSlotItemWriteSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        recipe = serializer.validated_data['recipe']

        # Duplicate dish in the same slot is silently ignored (idempotent).
        if slot.items.filter(recipe=recipe).exists():
            return Response(_serialized_slot(slot, request))

        if slot.items.count() >= MealSlotRecipe.MAX_PER_SLOT:
            return Response(
                {'detail': f'В слоте уже максимум {MealSlotRecipe.MAX_PER_SLOT} блюда.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        MealSlotRecipe.objects.create(slot=slot, recipe=recipe, position=_next_position(slot))
        return Response(_serialized_slot(slot, request), status=status.HTTP_201_CREATED)


class MealSlotItemView(APIView):
    """PATCH (перенос в другой слот) / DELETE (убрать) /api/menu-plan/items/{item_id}/."""

    permission_classes = [permissions.IsAuthenticated]

    def _get_item(self, request, item_id):
        return get_object_or_404(
            MealSlotRecipe, pk=item_id, slot__plan__user=request.user
        )

    @extend_schema(responses={204: None})
    def delete(self, request, item_id):
        item = self._get_item(request, item_id)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(request=MOVE_SLOT_ITEM_SCHEMA, responses=MealSlotSerializer)
    def patch(self, request, item_id):
        item = self._get_item(request, item_id)
        target_id = request.data.get('slot')
        if target_id is None:
            return Response(
                {'detail': 'Поле slot обязательно.'}, status=status.HTTP_400_BAD_REQUEST
            )

        target = get_object_or_404(MealSlot, pk=target_id, plan__user=request.user)

        # Dropping back onto the same slot — no-op.
        if target.id == item.slot_id:
            return Response(_serialized_slot(target, request))

        # No duplicate dish in the target slot.
        if target.items.filter(recipe=item.recipe).exists():
            return Response(
                {'detail': 'Это блюдо уже есть в целевом слоте.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target.items.count() >= MealSlotRecipe.MAX_PER_SLOT:
            return Response(
                {'detail': f'В целевом слоте уже максимум {MealSlotRecipe.MAX_PER_SLOT} блюда.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.position = _next_position(target)
        item.slot = target
        item.save(update_fields=['slot', 'position'])
        return Response(_serialized_slot(target, request))


class ShoppingListView(APIView):
    """GET /api/menu-plan/shopping-list/?week_start=YYYY-MM-DD — список покупок."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(parameters=[WEEK_START_PARAM], responses=SHOPPING_ITEM_SCHEMA)
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

        # Count how many times each recipe is planned across the week (all slots × dishes).
        recipe_counts: dict[int, int] = {}
        for item in MealSlotRecipe.objects.filter(slot__plan=plan):
            recipe_counts[item.recipe_id] = recipe_counts.get(item.recipe_id, 0) + 1

        if not recipe_counts:
            return Response([])

        # Aggregate ingredients in Python so a recipe used twice counts double.
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
