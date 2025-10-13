# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

url = [
    path("admin/", admin.site.urls),
    path("api/locations/", include("locations.urls")),
    path("api/topojson/", include("locations.urls")),  # TopoJSON API
]

swagger_ui = [
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),  # OpenAPI 3.0 스키마
    path("api/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

urlpatterns=swagger_ui+url