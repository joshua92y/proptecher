# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

url = [
    path("admin/", admin.site.urls),
    # path("api/locations/", include("locations.urls")),  # 임시 비활성화
    # path("api/topojson/", include("locations.urls")),  # TopoJSON API (임시 비활성화)
    path("api/", include("properties.urls")),  # Properties API (매물 관리)
    path("api/", include("inspections.urls")),  # Inspections API
    path("api/", include("notices.urls")),  # Notices API
]

swagger_ui = [
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),  # OpenAPI 3.0 스키마
    path("api/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

urlpatterns=swagger_ui+url