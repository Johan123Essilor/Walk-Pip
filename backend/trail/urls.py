from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CitaViewSet, HistorialUsuarioRutaViewSet, ContactoEmergenciaViewSet, HorarioRetornoViewSet

router = DefaultRouter()
router.register(r'agendar', CitaViewSet, basename='cita')
router.register(r'historial-rutas', HistorialUsuarioRutaViewSet, basename='historial-rutas')
router.register(r'contactos-emergencia', ContactoEmergenciaViewSet, basename='contactos-emergencia')
router.register(r'horarios-retorno', HorarioRetornoViewSet, basename='horarios-retorno')

urlpatterns = [
    path('', include(router.urls)),
]