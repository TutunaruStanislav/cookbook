from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    # Health
    path("api/health/", health_check, name="health-check"),
    # Auth
    path("api/auth/", include("apps.users.urls")),
    # Domain APIs (routes defined per-app)
    path("api/", include("apps.recipes.urls")),
    path("api/", include("apps.social.urls")),
    path("api/", include("apps.planner.urls")),
    path("api/", include("apps.dashboard.urls")),
    # OpenAPI schema
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    # Swagger / ReDoc — under /api/ and also at the root, so the docs are
    # reachable at /docs, /redoc, /api-docs (common conventions).
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui-root"),
    path("api-docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui-apidocs"),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc-root"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
