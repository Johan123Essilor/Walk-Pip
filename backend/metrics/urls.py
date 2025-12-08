# urls.py - Añadir las nuevas rutas de alertas
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SesionActividadViewSet,
    MetricaCaminataViewSet,
    MetricaCorazonViewSet,
    ultimas_metricas_corazon,
    ultimas_metricas_caminata,
    resumen_metricas,
    obtener_alertas,
    limpiar_alertas_antiguas,
    estadisticas_alertas
)

router = DefaultRouter()
router.register(r'session', SesionActividadViewSet, basename='sesionactividad')
router.register(r'caminata', MetricaCaminataViewSet,
                basename='metricascaminata')
router.register(r'corazon', MetricaCorazonViewSet, basename='metricascorazon')

urlpatterns = [
    # URLs para métricas
    path('metricas/corazon/ultimas/', ultimas_metricas_corazon,
         name='ultimas_metricas_corazon'),
    path('metricas/caminata/ultimas/', ultimas_metricas_caminata,
         name='ultimas_metricas_caminata'),
    path('metricas/resumen/', resumen_metricas, name='resumen_metricas'),

    # URLs para alertas
    path('alertas/', obtener_alertas, name='obtener_alertas'),
    path('alertas/limpiar/', limpiar_alertas_antiguas,
         name='limpiar_alertas_antiguas'),
    path('alertas/estadisticas/', estadisticas_alertas,
         name='estadisticas_alertas'),

    # El router va después
    path('', include(router.urls)),
]
