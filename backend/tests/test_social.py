"""Tests for favorites, ratings and comments."""
import pytest

from apps.social.models import Comment, Favorite, Rating

pytestmark = pytest.mark.django_db


# ── Favorites ────────────────────────────────────────────────────────────────

def test_favorite_toggle_add(api_client, alice, make_recipe):
    recipe = make_recipe(alice)
    api_client.force_authenticate(user=alice)
    response = api_client.post(f'/api/recipes/{recipe.id}/favorite/')
    assert response.status_code == 200
    assert response.data['is_favorited'] is True
    assert Favorite.objects.filter(user=alice, recipe=recipe).exists()


def test_favorite_toggle_remove(api_client, alice, make_recipe):
    recipe = make_recipe(alice)
    Favorite.objects.create(user=alice, recipe=recipe)
    api_client.force_authenticate(user=alice)
    response = api_client.post(f'/api/recipes/{recipe.id}/favorite/')
    assert response.status_code == 200
    assert response.data['is_favorited'] is False
    assert not Favorite.objects.filter(user=alice, recipe=recipe).exists()


def test_favorite_requires_auth(api_client, alice, make_recipe):
    recipe = make_recipe(alice)
    response = api_client.post(f'/api/recipes/{recipe.id}/favorite/')
    assert response.status_code == 401


def test_favorites_filter(api_client, alice, bob, make_recipe):
    fav_recipe = make_recipe(alice, title='Favourite One')
    other_recipe = make_recipe(alice, title='Not Favourite')
    Favorite.objects.create(user=bob, recipe=fav_recipe)
    api_client.force_authenticate(user=bob)
    response = api_client.get('/api/recipes/?favorites=true')
    titles = [r['title'] for r in response.data['results']]
    assert 'Favourite One' in titles
    assert 'Not Favourite' not in titles


# ── Ratings ───────────────────────────────────────────────────────────────────

def test_rating_creates_and_returns_avg(api_client, alice, bob, make_recipe):
    recipe = make_recipe(alice)
    api_client.force_authenticate(user=bob)
    response = api_client.post(f'/api/recipes/{recipe.id}/rate/', {'value': 4})
    assert response.status_code == 200
    assert response.data['value'] == 4
    assert response.data['avg_rating'] == 4.0


def test_rating_upsert_replaces_previous(api_client, alice, bob, make_recipe):
    recipe = make_recipe(alice)
    Rating.objects.create(user=bob, recipe=recipe, value=3)
    api_client.force_authenticate(user=bob)
    response = api_client.post(f'/api/recipes/{recipe.id}/rate/', {'value': 5})
    assert response.status_code == 200
    assert Rating.objects.filter(user=bob, recipe=recipe).count() == 1
    assert Rating.objects.get(user=bob, recipe=recipe).value == 5


def test_rating_avg_aggregates_multiple_users(api_client, alice, bob, make_recipe):
    recipe = make_recipe(alice)
    Rating.objects.create(user=alice, recipe=recipe, value=3)
    api_client.force_authenticate(user=bob)
    response = api_client.post(f'/api/recipes/{recipe.id}/rate/', {'value': 5})
    assert response.status_code == 200
    assert response.data['avg_rating'] == 4.0


def test_rating_value_too_high_returns_400(api_client, alice, bob, make_recipe):
    recipe = make_recipe(alice)
    api_client.force_authenticate(user=bob)
    response = api_client.post(f'/api/recipes/{recipe.id}/rate/', {'value': 6})
    assert response.status_code == 400


def test_rating_value_zero_returns_400(api_client, alice, bob, make_recipe):
    recipe = make_recipe(alice)
    api_client.force_authenticate(user=bob)
    response = api_client.post(f'/api/recipes/{recipe.id}/rate/', {'value': 0})
    assert response.status_code == 400


def test_rating_requires_auth(api_client, alice, make_recipe):
    recipe = make_recipe(alice)
    response = api_client.post(f'/api/recipes/{recipe.id}/rate/', {'value': 5})
    assert response.status_code == 401


# ── Comments ─────────────────────────────────────────────────────────────────

def test_comment_create(api_client, alice, bob, make_recipe):
    recipe = make_recipe(alice)
    api_client.force_authenticate(user=bob)
    response = api_client.post(f'/api/recipes/{recipe.id}/comments/', {'text': 'Great recipe!'})
    assert response.status_code == 201
    assert Comment.objects.filter(recipe=recipe, author=bob, text='Great recipe!').exists()


def test_comment_list_is_public(api_client, alice, bob, make_recipe):
    recipe = make_recipe(alice)
    Comment.objects.create(recipe=recipe, author=alice, text='Yummy')
    response = api_client.get(f'/api/recipes/{recipe.id}/comments/')
    assert response.status_code == 200
    assert len(response.data['results']) == 1


def test_comment_delete_by_comment_author(api_client, alice, bob, make_recipe):
    recipe = make_recipe(alice)
    comment = Comment.objects.create(recipe=recipe, author=bob, text='Yummy')
    api_client.force_authenticate(user=bob)
    response = api_client.delete(f'/api/comments/{comment.id}/')
    assert response.status_code == 204
    assert not Comment.objects.filter(pk=comment.id).exists()


def test_comment_delete_by_recipe_owner(api_client, alice, bob, make_recipe):
    """Recipe owner can delete any comment on their recipe."""
    recipe = make_recipe(alice)
    comment = Comment.objects.create(recipe=recipe, author=bob, text='Spam')
    api_client.force_authenticate(user=alice)
    response = api_client.delete(f'/api/comments/{comment.id}/')
    assert response.status_code == 204


def test_comment_delete_denied_to_stranger(api_client, alice, bob, make_user, make_recipe):
    """A third user cannot delete someone else's comment."""
    stranger = make_user(username='stranger', password='pass123')
    recipe = make_recipe(alice)
    comment = Comment.objects.create(recipe=recipe, author=bob, text='Bob comment')
    api_client.force_authenticate(user=stranger)
    response = api_client.delete(f'/api/comments/{comment.id}/')
    assert response.status_code == 403
