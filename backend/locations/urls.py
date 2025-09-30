# backend/locations/urls.py
from rest_framework.routers import DefaultRouter
from .views import SidoViewSet

router = DefaultRouter()
router.register(r'sido', SidoViewSet, basename='sido')

urlpatterns = router.urls
