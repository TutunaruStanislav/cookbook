"""Tests for the weekly menu planner and shopping list generation."""
from datetime import date

import pytest

from apps.planner.models import MealSlot, MealSlotRecipe, MenuPlan
from apps.recipes.models import Ingredient, RecipeIngredient

pytestmark = pytest.mark.django_db

MONDAY = date(2025, 1, 6)   # known Monday
MONDAY2 = date(2025, 1, 13)  # next Monday (for isolated tests)


def _make_plan(alice, week):
    """Create a plan for `week` with 21 empty slots."""
    plan, created = MenuPlan.objects.get_or_create(user=alice, week_start=week)
    if created:
        MealSlot.objects.bulk_create(
            MealSlot(plan=plan, day=day, meal_type=mt)
            for day in range(7)
            for mt in ['breakfast', 'lunch', 'dinner']
        )
    return plan


def _slot(plan, day=0, meal_type='breakfast'):
    return MealSlot.objects.get(plan=plan, day=day, meal_type=meal_type)


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
    # Each slot exposes an items list (empty initially).
    assert all(slot['items'] == [] for slot in response.data['slots'])


def test_menu_plan_idempotent(api_client, alice):
    """Calling the endpoint twice must not duplicate slots."""
    api_client.force_authenticate(user=alice)
    api_client.get(f'/api/menu-plan/?week_start={MONDAY}')
    api_client.get(f'/api/menu-plan/?week_start={MONDAY}')
    assert MenuPlan.objects.filter(user=alice, week_start=MONDAY).count() == 1
    assert MealSlot.objects.filter(plan__user=alice, plan__week_start=MONDAY).count() == 21


# ── Add / move / remove dishes ──────────────────────────────────────────────────

def test_add_dish_to_slot(api_client, alice, make_recipe):
    plan = _make_plan(alice, MONDAY)
    slot = _slot(plan)
    recipe = make_recipe(alice)
    api_client.force_authenticate(user=alice)

    response = api_client.post(f'/api/menu-plan/slots/{slot.id}/items/', {'recipe': recipe.id})
    assert response.status_code == 201
    assert len(response.data['items']) == 1
    assert response.data['items'][0]['recipe'] == recipe.id
    assert response.data['items'][0]['recipe_detail']['title'] == recipe.title


def test_slot_caps_at_three_dishes(api_client, alice, make_recipe):
    plan = _make_plan(alice, MONDAY)
    slot = _slot(plan)
    api_client.force_authenticate(user=alice)
    for i in range(3):
        r = make_recipe(alice, title=f'Dish {i}')
        assert api_client.post(f'/api/menu-plan/slots/{slot.id}/items/', {'recipe': r.id}).status_code == 201

    extra = make_recipe(alice, title='Dish 4')
    response = api_client.post(f'/api/menu-plan/slots/{slot.id}/items/', {'recipe': extra.id})
    assert response.status_code == 400
    assert slot.items.count() == 3


def test_adding_same_dish_twice_is_ignored(api_client, alice, make_recipe):
    plan = _make_plan(alice, MONDAY)
    slot = _slot(plan)
    recipe = make_recipe(alice)
    api_client.force_authenticate(user=alice)

    api_client.post(f'/api/menu-plan/slots/{slot.id}/items/', {'recipe': recipe.id})
    response = api_client.post(f'/api/menu-plan/slots/{slot.id}/items/', {'recipe': recipe.id})
    assert response.status_code == 200
    assert slot.items.count() == 1


def test_cannot_add_others_private_recipe(api_client, alice, bob, make_recipe):
    plan = _make_plan(alice, MONDAY)
    slot = _slot(plan)
    private = make_recipe(bob, title='Bob secret', is_public=False)
    api_client.force_authenticate(user=alice)

    response = api_client.post(f'/api/menu-plan/slots/{slot.id}/items/', {'recipe': private.id})
    assert response.status_code == 400
    assert slot.items.count() == 0


def test_move_dish_to_another_slot(api_client, alice, make_recipe):
    plan = _make_plan(alice, MONDAY)
    src = _slot(plan, day=0, meal_type='breakfast')
    dst = _slot(plan, day=1, meal_type='breakfast')
    recipe = make_recipe(alice)
    item = MealSlotRecipe.objects.create(slot=src, recipe=recipe, position=0)
    api_client.force_authenticate(user=alice)

    response = api_client.patch(f'/api/menu-plan/items/{item.id}/', {'slot': dst.id})
    assert response.status_code == 200
    item.refresh_from_db()
    assert item.slot_id == dst.id
    assert src.items.count() == 0
    assert dst.items.count() == 1


def test_move_into_full_slot_rejected(api_client, alice, make_recipe):
    plan = _make_plan(alice, MONDAY)
    src = _slot(plan, day=0, meal_type='breakfast')
    dst = _slot(plan, day=1, meal_type='breakfast')
    moving = MealSlotRecipe.objects.create(slot=src, recipe=make_recipe(alice, title='Moving'), position=0)
    for i in range(3):
        MealSlotRecipe.objects.create(slot=dst, recipe=make_recipe(alice, title=f'Full {i}'), position=i)
    api_client.force_authenticate(user=alice)

    response = api_client.patch(f'/api/menu-plan/items/{moving.id}/', {'slot': dst.id})
    assert response.status_code == 400
    moving.refresh_from_db()
    assert moving.slot_id == src.id  # unchanged


def test_move_duplicate_into_target_rejected(api_client, alice, make_recipe):
    plan = _make_plan(alice, MONDAY)
    src = _slot(plan, day=0, meal_type='breakfast')
    dst = _slot(plan, day=1, meal_type='breakfast')
    recipe = make_recipe(alice)
    moving = MealSlotRecipe.objects.create(slot=src, recipe=recipe, position=0)
    MealSlotRecipe.objects.create(slot=dst, recipe=recipe, position=0)
    api_client.force_authenticate(user=alice)

    response = api_client.patch(f'/api/menu-plan/items/{moving.id}/', {'slot': dst.id})
    assert response.status_code == 400
    moving.refresh_from_db()
    assert moving.slot_id == src.id


def test_remove_dish(api_client, alice, make_recipe):
    plan = _make_plan(alice, MONDAY)
    slot = _slot(plan)
    item = MealSlotRecipe.objects.create(slot=slot, recipe=make_recipe(alice), position=0)
    api_client.force_authenticate(user=alice)

    response = api_client.delete(f'/api/menu-plan/items/{item.id}/')
    assert response.status_code == 204
    assert slot.items.count() == 0


def test_cannot_touch_others_items(api_client, alice, bob, make_recipe):
    plan = _make_plan(bob, MONDAY)
    slot = _slot(plan)
    item = MealSlotRecipe.objects.create(slot=slot, recipe=make_recipe(bob), position=0)
    api_client.force_authenticate(user=alice)

    assert api_client.delete(f'/api/menu-plan/items/{item.id}/').status_code == 404


# ── Shopping list ─────────────────────────────────────────────────────────────

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

    plan = _make_plan(alice, MONDAY2)
    MealSlotRecipe.objects.create(slot=_slot(plan), recipe=recipe, position=0)

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
    plan = _make_plan(alice, week)
    # Same recipe in two different slots → counted twice.
    MealSlotRecipe.objects.create(slot=_slot(plan, 0, 'breakfast'), recipe=recipe, position=0)
    MealSlotRecipe.objects.create(slot=_slot(plan, 0, 'lunch'), recipe=recipe, position=0)

    api_client.force_authenticate(user=alice)
    response = api_client.get(f'/api/menu-plan/shopping-list/?week_start={week}')
    by_name = {item['ingredient']: item for item in response.data}
    assert by_name['Соль_дважды']['total_amount'] == 20.0
