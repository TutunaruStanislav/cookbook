"""Tests for authentication endpoints: register / login / refresh / me."""
import pytest

pytestmark = pytest.mark.django_db


def test_register_creates_user(api_client):
    response = api_client.post('/api/auth/register/', {
        'username': 'newuser',
        'password': 'newpass123',
        'email': 'new@example.com',
    })
    assert response.status_code == 201
    assert response.data['username'] == 'newuser'
    assert 'password' not in response.data


def test_login_returns_tokens_and_user(api_client, alice):
    response = api_client.post('/api/auth/login/', {
        'username': 'alice',
        'password': 'alice1234',
    })
    assert response.status_code == 200
    assert 'access' in response.data
    assert 'refresh' in response.data
    assert response.data['user']['username'] == 'alice'


def test_login_invalid_credentials(api_client):
    response = api_client.post('/api/auth/login/', {
        'username': 'nobody',
        'password': 'wrongpass',
    })
    assert response.status_code == 401


def test_me_returns_current_user(api_client, alice):
    api_client.force_authenticate(user=alice)
    response = api_client.get('/api/auth/me/')
    assert response.status_code == 200
    assert response.data['username'] == 'alice'


def test_me_requires_auth(api_client):
    response = api_client.get('/api/auth/me/')
    assert response.status_code == 401


def test_me_patch_updates_first_name(api_client, alice):
    api_client.force_authenticate(user=alice)
    response = api_client.patch('/api/auth/me/', {'first_name': 'Алиса'})
    assert response.status_code == 200
    assert response.data['first_name'] == 'Алиса'


def test_change_password_success(api_client, alice):
    api_client.force_authenticate(user=alice)
    response = api_client.post('/api/auth/change-password/', {
        'current_password': 'alice1234',
        'new_password': 'brand-new-pass-99',
    })
    assert response.status_code == 200
    alice.refresh_from_db()
    assert alice.check_password('brand-new-pass-99')


def test_change_password_wrong_current(api_client, alice):
    api_client.force_authenticate(user=alice)
    response = api_client.post('/api/auth/change-password/', {
        'current_password': 'wrong-password',
        'new_password': 'brand-new-pass-99',
    })
    assert response.status_code == 400
    alice.refresh_from_db()
    assert alice.check_password('alice1234')  # unchanged


def test_change_password_too_short(api_client, alice):
    api_client.force_authenticate(user=alice)
    response = api_client.post('/api/auth/change-password/', {
        'current_password': 'alice1234',
        'new_password': 'short',
    })
    assert response.status_code == 400


def test_change_password_requires_auth(api_client):
    response = api_client.post('/api/auth/change-password/', {
        'current_password': 'whatever',
        'new_password': 'brand-new-pass-99',
    })
    assert response.status_code == 401
