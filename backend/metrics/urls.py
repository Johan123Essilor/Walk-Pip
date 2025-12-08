# app_metrics/urls.py - VERSIÓN CORREGIDA Y DEFINITIVA
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SesionActividadViewSet,
    MetricaCaminataViewSet,
    MetricaCorazonViewSet,
    ultimas_metricas_corazon,
    ultimas_metricas_caminata,
    resumen_metricas
)

router = DefaultRouter()
router.register(r'session', SesionActividadViewSet, basename='sesionactividad')
router.register(r'caminata', MetricaCaminataViewSet,
                basename='metricascaminata')
router.register(r'corazon', MetricaCorazonViewSet, basename='metricascorazon')

# URLs CORREGIDAS - exactamente como las busca tu frontend
urlpatterns = [
    # Estas son las URLs que tu frontend está buscando
    path('metricas/corazon/ultimas/', ultimas_metricas_corazon,
         name='ultimas_metricas_corazon'),
    path('metricas/caminata/ultimas/', ultimas_metricas_caminata,
         name='ultimas_metricas_caminata'),
    path('metricas/resumen/', resumen_metricas, name='resumen_metricas'),

    # El router va después para no interferir
    path('', include(router.urls)),
]

# Verifica que las URLs estén correctas
print("✅ URLs registradas:")
for url in urlpatterns:
    print(f"  - {url.pattern}")
