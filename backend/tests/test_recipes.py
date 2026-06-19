"""Tests for recipe CRUD, permissions, search and portion scaling."""
import pytest

from apps.recipes.models import Ingredient, RecipeIngredient

pytestmark = pytest.mark.django_db


# ── Visibility ────────────────────────────────────────────────────────────────

def test_anon_sees_only_public_recipes(api_client, alice, make_recipe):
    make_recipe(alice, title='Public Recipe', is_public=True)
    make_recipe(alice, title='Private Recipe', is_public=False)
    response = api_client.get('/api/recipes/')
    assert response.status_code == 200
    titles = [r['title'] for r in response.data['results']]
    assert 'Public Recipe' in titles
    assert 'Private Recipe' not in titles


def test_authenticated_user_sees_own_private_but_not_others(api_client, alice, bob, make_recipe):
    make_recipe(alice, title='Alice Private', is_public=False)
    make_recipe(bob, title='Bob Private', is_public=False)
    api_client.force_authenticate(user=alice)
    response = api_client.get('/api/recipes/')
    titles = [r['title'] for r in response.data['results']]
    assert 'Alice Private' in titles
    assert 'Bob Private' not in titles


# ── CRUD ──────────────────────────────────────────────────────────────────────

def test_create_recipe_requires_auth(api_client):
    payload = {
        'title': 'Soup', 'description': 'desc', 'cooking_time': 20,
        'difficulty': 'easy', 'servings': 2, 'is_public': True,
        'categories': [], 'tags': [], 'ingredients': [], 'steps': [],
    }
    response = api_client.post('/api/recipes/', payload, format='json')
    assert response.status_code == 401


def test_create_recipe(api_client, alice):
    api_client.force_authenticate(user=alice)
    payload = {
        'title': 'My Soup', 'description': 'A great soup', 'cooking_time': 30,
        'difficulty': 'easy', 'servings': 4, 'is_public': True,
        'categories': [], 'tags': [], 'ingredients': [], 'steps': [],
    }
    response = api_client.post('/api/recipes/', payload, format='json')
    assert response.status_code == 201
    assert response.data['title'] == 'My Soup'


def test_author_can_update_own_recipe(api_client, alice, make_recipe):
    recipe = make_recipe(alice, title='Original Title')
    api_client.force_authenticate(user=alice)
    response = api_client.patch(
        f'/api/recipes/{recipe.id}/', {'title': 'Updated Title'}, format='json'
    )
    assert response.status_code == 200
    assert response.data['title'] == 'Updated Title'


def test_non_author_cannot_update(api_client, alice, bob, make_recipe):
    recipe = make_recipe(alice, title='Alice Recipe')
    api_client.force_authenticate(user=bob)
    response = api_client.patch(
        f'/api/recipes/{recipe.id}/', {'title': 'Hacked'}, format='json'
    )
    assert response.status_code == 403


def test_non_author_cannot_delete(api_client, alice, bob, make_recipe):
    recipe = make_recipe(alice)
    api_client.force_authenticate(user=bob)
    response = api_client.delete(f'/api/recipes/{recipe.id}/')
    assert response.status_code == 403


def test_author_can_delete_own_recipe(api_client, alice, make_recipe):
    recipe = make_recipe(alice)
    api_client.force_authenticate(user=alice)
    response = api_client.delete(f'/api/recipes/{recipe.id}/')
    assert response.status_code == 204


# ── Search / filter ───────────────────────────────────────────────────────────

def test_ingredient_search_returns_matching_recipes(api_client, alice, make_recipe):
    soup = make_recipe(alice, title='Chicken Soup')
    bread = make_recipe(alice, title='Bread')

    chicken = Ingredient.objects.create(name='Курица_test')
    flour = Ingredient.objects.create(name='Мука_test')
    RecipeIngredient.objects.create(recipe=soup, ingredient=chicken, amount=300, unit='g')
    RecipeIngredient.objects.create(recipe=bread, ingredient=flour, amount=500, unit='g')

    response = api_client.get('/api/recipes/?ingredients=Курица_test')
    titles = [r['title'] for r in response.data['results']]
    assert 'Chicken Soup' in titles
    assert 'Bread' not in titles


def test_search_by_title(api_client, alice, make_recipe):
    make_recipe(alice, title='Борщ со свёклой')
    make_recipe(alice, title='Омлет с сыром')
    response = api_client.get('/api/recipes/?search=Борщ')
    titles = [r['title'] for r in response.data['results']]
    assert 'Борщ со свёклой' in titles
    assert 'Омлет с сыром' not in titles


# ── Portion scaling ───────────────────────────────────────────────────────────

def test_portion_scaling_halves_amount(api_client, alice, make_recipe):
    recipe = make_recipe(alice, servings=4)
    ing = Ingredient.objects.create(name='Мука_scaling')
    RecipeIngredient.objects.create(recipe=recipe, ingredient=ing, amount=200, unit='g')

    response = api_client.get(f'/api/recipes/{recipe.id}/?servings=2')
    assert response.status_code == 200
    scaled = response.data['ingredients'][0]['scaled_amount']
    assert abs(scaled - 100.0) < 0.01


def test_portion_scaling_doubles_amount(api_client, alice, make_recipe):
    recipe = make_recipe(alice, servings=4)
    ing = Ingredient.objects.create(name='Соль_scaling')
    RecipeIngredient.objects.create(recipe=recipe, ingredient=ing, amount=10, unit='g')

    response = api_client.get(f'/api/recipes/{recipe.id}/?servings=8')
    assert response.status_code == 200
    scaled = response.data['ingredients'][0]['scaled_amount']
    assert abs(scaled - 20.0) < 0.01


def test_retrieve_without_scaling_returns_original_amount(api_client, alice, make_recipe):
    recipe = make_recipe(alice, servings=4)
    ing = Ingredient.objects.create(name='Масло_scaling')
    RecipeIngredient.objects.create(recipe=recipe, ingredient=ing, amount=50, unit='g')

    response = api_client.get(f'/api/recipes/{recipe.id}/')
    assert response.status_code == 200
    scaled = response.data['ingredients'][0]['scaled_amount']
    assert abs(scaled - 50.0) < 0.01


# ── Ordering by average rating ──────────────────────────────────────────────────

def test_ordering_by_avg_rating_keeps_unrated_last(api_client, alice, bob, make_recipe):
    """Sorting by rating must never float unrated recipes (avg IS NULL) to the
    top — they belong at the bottom in both directions."""
    from apps.social.models import Rating

    high = make_recipe(alice, title='High rated')
    low = make_recipe(alice, title='Low rated')
    make_recipe(alice, title='Unrated')

    Rating.objects.create(user=alice, recipe=high, value=5)
    Rating.objects.create(user=bob, recipe=high, value=5)
    Rating.objects.create(user=alice, recipe=low, value=2)

    desc = api_client.get('/api/recipes/?ordering=-avg_rating')
    desc_titles = [r['title'] for r in desc.data['results']]
    assert desc_titles[0] == 'High rated'   # best first, not an unrated one
    assert desc_titles[-1] == 'Unrated'     # unrated dead last
    assert desc_titles.index('High rated') < desc_titles.index('Low rated')

    asc = api_client.get('/api/recipes/?ordering=avg_rating')
    asc_titles = [r['title'] for r in asc.data['results']]
    assert asc_titles[0] == 'Low rated'     # lowest rated first
    assert asc_titles[-1] == 'Unrated'      # still last
