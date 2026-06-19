"""Input validation: HTML/tag rejection (anti-XSS) and type hardening."""
import pytest

pytestmark = pytest.mark.django_db


def _recipe_payload(**over):
    payload = {
        'title': 'Тестовый суп',
        'description': 'Хорошее описание рецепта для теста.',
        'cooking_time': 30,
        'difficulty': 'easy',
        'servings': 4,
        'is_public': True,
        'categories': [], 'tags': [], 'ingredients': [], 'steps': [],
    }
    payload.update(over)
    return payload


# ── HTML / tag rejection ───────────────────────────────────────────────────────

def test_recipe_title_rejects_html(api_client, alice):
    api_client.force_authenticate(user=alice)
    r = api_client.post(
        '/api/recipes/',
        _recipe_payload(title='<script>alert(1)</script>'),
        format='json',
    )
    assert r.status_code == 400
    assert 'title' in r.data


def test_recipe_description_rejects_html(api_client, alice):
    api_client.force_authenticate(user=alice)
    r = api_client.post(
        '/api/recipes/',
        _recipe_payload(description='<b>жирный</b> текст описания'),
        format='json',
    )
    assert r.status_code == 400
    assert 'description' in r.data


def test_recipe_step_rejects_html(api_client, alice):
    api_client.force_authenticate(user=alice)
    r = api_client.post(
        '/api/recipes/',
        _recipe_payload(steps=[{'order': 1, 'text': 'Налить <img src=x onerror=alert(1)> воды'}]),
        format='json',
    )
    assert r.status_code == 400


def test_comment_rejects_html(api_client, alice, make_recipe):
    recipe = make_recipe(author=alice)
    api_client.force_authenticate(user=alice)
    r = api_client.post(
        f'/api/recipes/{recipe.id}/comments/',
        {'text': '<a href="http://evil">spam</a>'},
        format='json',
    )
    assert r.status_code == 400


def test_register_rejects_html_in_name(api_client):
    r = api_client.post('/api/auth/register/', {
        'username': 'htmluser',
        'password': 'strongpass1',
        'first_name': '<script>x</script>',
    }, format='json')
    assert r.status_code == 400
    assert 'first_name' in r.data


def test_recipe_allows_lone_comparison_signs(api_client, alice):
    """'< 5 минут' / '> 1' are not tags and must be accepted."""
    api_client.force_authenticate(user=alice)
    r = api_client.post(
        '/api/recipes/',
        _recipe_payload(description='Готовится меньше < 5 минут, но больше > 1 минуты.'),
        format='json',
    )
    assert r.status_code == 201, r.data


# ── Type / content hardening ────────────────────────────────────────────────────

def test_recipe_title_too_short(api_client, alice):
    api_client.force_authenticate(user=alice)
    r = api_client.post('/api/recipes/', _recipe_payload(title='ab'), format='json')
    assert r.status_code == 400
    assert 'title' in r.data


def test_recipe_servings_must_be_positive(api_client, alice):
    api_client.force_authenticate(user=alice)
    r = api_client.post('/api/recipes/', _recipe_payload(servings=0), format='json')
    assert r.status_code == 400
    assert 'servings' in r.data


def test_recipe_cooking_time_must_be_positive(api_client, alice):
    api_client.force_authenticate(user=alice)
    r = api_client.post('/api/recipes/', _recipe_payload(cooking_time=0), format='json')
    assert r.status_code == 400


def test_recipe_cooking_time_must_be_integer(api_client, alice):
    api_client.force_authenticate(user=alice)
    r = api_client.post('/api/recipes/', _recipe_payload(cooking_time='abc'), format='json')
    assert r.status_code == 400


def test_recipe_ingredient_amount_must_be_positive(api_client, alice):
    from apps.recipes.models import Ingredient
    ing = Ingredient.objects.create(name='Соль_validation')
    api_client.force_authenticate(user=alice)
    r = api_client.post(
        '/api/recipes/',
        _recipe_payload(ingredients=[{'ingredient': ing.id, 'amount': '-5', 'unit': 'g'}]),
        format='json',
    )
    assert r.status_code == 400


def test_comment_rejects_blank(api_client, alice, make_recipe):
    recipe = make_recipe(author=alice)
    api_client.force_authenticate(user=alice)
    r = api_client.post(
        f'/api/recipes/{recipe.id}/comments/', {'text': '   '}, format='json'
    )
    assert r.status_code == 400


# ── Valid input still passes ────────────────────────────────────────────────────

def test_valid_recipe_create(api_client, alice):
    api_client.force_authenticate(user=alice)
    r = api_client.post('/api/recipes/', _recipe_payload(), format='json')
    assert r.status_code == 201, r.data


def test_valid_comment_create(api_client, alice, make_recipe):
    recipe = make_recipe(author=alice)
    api_client.force_authenticate(user=alice)
    r = api_client.post(
        f'/api/recipes/{recipe.id}/comments/',
        {'text': 'Отличный рецепт, спасибо!'},
        format='json',
    )
    assert r.status_code == 201
