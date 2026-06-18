"""Tests for the weekly menu planner and shopping list generation."""
from datetime import date

import pytest

from apps.planner.models import MealSlot, MenuPlan
from apps.recipes.models import Ingredient, RecipeIngredient

pytestmark = pytest.mark.django_db

MONDAY = date(2025, 1, 6)   # known Monday
MONDAY2 = date(2025, 1, 13)  # next Monday (for isolated tests)


# ── MenuPlan view ─────────────────────────────────────────────────────────────

def test_menu_plan_requires_auth(api_client):
    response = api_client.get(f'/api/menu-plan/?week_start={MONDAY}')
    assert response.status_code == 401


def test_menu_plan_requires_week_start_param(api_client, alice):
    api_client.force_authenticate(user=alice)
    response = api_client.get('/api/menu-plan/')
    assert response.status_code == 400


def test_menu_plan_rejects_non_monday(api_client, alice):
    api_client.force_authenticate(user=alice)
    response = api_client.get('/api/menu-plan/?week_start=2025-01-07')  # Tuesday
    assert response.status_code == 400


def test_menu_plan_auto_creates_21_slots(api_client, alice):
    api_client.force_authenticate(user=alice)
    response = api_client.get(f'/api/menu-plan/?week_start={MONDAY}')
    assert response.status_code == 200
    assert len(response.data['slots']) == 21


def test_menu_plan_idempotent(api_client, alice):
    """Calling the endpoint twice must not duplicate slots."""
    api_client.force_authenticate(user=alice)
    api_client.get(f'/api/menu-plan/?week_start={MONDAY}')
    api_client.get(f'/api/menu-plan/?week_start={MONDAY}')
    assert MenuPlan.objects.filter(user=alice, week_start=MONDAY).count() == 1
    assert MealSlot.objects.filter(plan__user=alice, plan__week_start=MONDAY).count() == 21


# ── Shopping list ─────────────────────────────────────────────────────────────

def _setup_plan_with_recipe(alice, recipe):
    """Helper: create plan for MONDAY2, assign recipe to Monday breakfast."""
    plan, created = MenuPlan.objects.get_or_create(user=alice, week_start=MONDAY2)
    if created:
        slots = [
            MealSlot(plan=plan, day=day, meal_type=mt)
            for day in range(7)
            for mt in ['breakfast', 'lunch', 'dinner']
        ]
        MealSlot.objects.bulk_create(slots)
    return plan


def test_shopping_list_empty_for_empty_plan(api_client, alice):
    api_client.force_authenticate(user=alice)
    api_client.get(f'/api/menu-plan/?week_start={MONDAY}')  # create empty plan
    response = api_client.get(f'/api/menu-plan/shopping-list/?week_start={MONDAY}')
    assert response.status_code == 200
    assert response.data == []


def test_shopping_list_aggregates_ingredients(api_client, alice, make_recipe):
    recipe = make_recipe(alice, servings=4)
    flour = Ingredient.objects.create(name='Мука_шоп')
    RecipeIngredient.objects.create(recipe=recipe, ingredient=flour, amount=200, unit='g')

    plan = _setup_plan_with_recipe(alice, recipe)
    slot = MealSlot.objects.filter(plan=plan, day=0, meal_type='breakfast').first()
    slot.recipe = recipe
    slot.save()

    api_client.force_authenticate(user=alice)
    response = api_client.get(f'/api/menu-plan/shopping-list/?week_start={MONDAY2}')
    assert response.status_code == 200
    by_name = {item['ingredient']: item for item in response.data}
    assert 'Мука_шоп' in by_name
    assert by_name['Мука_шоп']['total_amount'] == 200.0


def test_shopping_list_same_recipe_twice_doubles_amount(api_client, alice, make_recipe):
    recipe = make_recipe(alice, servings=4)
    salt = Ingredient.objects.create(name='Соль_дважды')
    RecipeIngredient.objects.create(recipe=recipe, ingredient=salt, amount=10, unit='g')

    week = date(2025, 1, 20)  # yet another Monday
    plan, created = MenuPlan.objects.get_or_create(user=alice, week_start=week)
    if created:
        slots = [
            MealSlot(plan=plan, day=day, meal_type=mt)
            for day in range(7)
            for mt in ['breakfast', 'lunch', 'dinner']
        ]
        MealSlot.objects.bulk_create(slots)

    slot1 = MealSlot.objects.filter(plan=plan, day=0, meal_type='breakfast').first()
    slot2 = MealSlot.objects.filter(plan=plan, day=0, meal_type='lunch').first()
    slot1.recipe = recipe
    slot1.save()
    slot2.recipe = recipe
    slot2.save()

    api_client.force_authenticate(user=alice)
    response = api_client.get(f'/api/menu-plan/shopping-list/?week_start={week}')
    by_name = {item['ingredient']: item for item in response.data}
    assert by_name['Соль_дважды']['total_amount'] == 20.0
