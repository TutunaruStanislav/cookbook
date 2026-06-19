"""API docs must be reachable both under /api/ and at the root (/docs, /redoc,
/api-docs) so they can be opened directly in a browser."""
import pytest

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize(
    'path',
    [
        '/api/schema/',
        '/api/docs/',
        '/api/redoc/',
        '/docs/',
        '/redoc/',
        '/api-docs/',
    ],
)
def test_docs_endpoints_accessible(api_client, path):
    response = api_client.get(path)
    assert response.status_code == 200
