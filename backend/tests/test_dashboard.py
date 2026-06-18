"""Tests for the dashboard stats endpoint."""
import pytest

from apps.recipes.models import Category, Ingredient, Recipe
from apps.social.models import Comment, Favorite, Rating

pytestmark = pytest.mark.django_db

STATS_URL = '/api/dashboard/stats/'
REQUIRED_KEYS = [
    'totals', 'by_category', 'by_difficulty',
    'by_cooking_time', 'top_by_rating', 'top_by_favorites', 'top_tags',
]


def test_dashboard_accessible_by_anonymous(api_client):
    response = api_client.get(STATS_URL)
    assert response.status_code == 200


def test_dashboard_has_all_required_keys(api_client):
    response = api_client.get(STATS_URL)
    for key in REQUIRED_KEYS:
        assert key in response.data, f'Missing key: {key}'


def test_dashboard_totals_structure(api_client):
    response = api_client.get(STATS_URL)
    totals = response.data['totals']
    for key in ['recipes', 'ingredients', 'comments', 'users']:
        assert key in totals
        assert isinstance(totals[key], int)


def test_dashboard_counts_public_recipes_only(api_client, alice, make_recipe):
    make_recipe(alice, title='Public 1', is_public=True)
    make_recipe(alice, title='Private 1', is_public=False)
    response = api_client.get(STATS_URL)
    assert response.data['totals']['recipes'] == 1


def test_dashboard_by_cooking_time_has_four_ranges(api_client):
    response = api_client.get(STATS_URL)
    ranges = [item['range'] for item in response.data['by_cooking_time']]
    assert len(ranges) == 4


def test_dashboard_top_by_rating_reflects_ratings(api_client, alice, bob, make_recipe):
    recipe = make_recipe(alice, title='Top Rated')
    Rating.objects.create(user=bob, recipe=recipe, value=5)
    response = api_client.get(STATS_URL)
    top_ids = [r['id'] for r in response.data['top_by_rating']]
    assert recipe.id in top_ids


def test_dashboard_top_by_favorites_reflects_favorites(api_client, alice, bob, make_recipe):
    recipe = make_recipe(alice, title='Most Faved')
    Favorite.objects.create(user=bob, recipe=recipe)
    response = api_client.get(STATS_URL)
    top_ids = [r['id'] for r in response.data['top_by_favorites']]
    assert recipe.id in top_ids
