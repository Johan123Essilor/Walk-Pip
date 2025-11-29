from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SesionActividadViewSet, MetricaCaminataViewSet, MetricaCorazonViewSet

router = DefaultRouter()
router.register(r'session', SesionActividadViewSet, basename='sesionactividad')
router.register(r'caminata', MetricaCaminataViewSet, basename='metricascaminata')
router.register(r'corazon', MetricaCorazonViewSet, basename='metricascorazon')

urlpatterns = [
    path('', include(router.urls)),
]
