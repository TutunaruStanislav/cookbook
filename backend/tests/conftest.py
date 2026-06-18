import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from apps.recipes.models import Recipe


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def make_user(db):
    def _make(username='testuser', password='testpass123', **kwargs):
        return User.objects.create_user(username=username, password=password, **kwargs)
    return _make


@pytest.fixture
def alice(make_user):
    return make_user(username='alice', password='alice1234')


@pytest.fixture
def bob(make_user):
    return make_user(username='bob', password='bob1234')


@pytest.fixture
def make_recipe(db):
    def _make(author, title='Test Recipe', is_public=True, servings=4, **kwargs):
        return Recipe.objects.create(
            title=title,
            description='Test description',
            cooking_time=30,
            difficulty='easy',
            servings=servings,
            author=author,
            is_public=is_public,
            **kwargs,
        )
    return _make
