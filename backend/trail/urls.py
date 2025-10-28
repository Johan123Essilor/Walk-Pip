from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CitaViewSet, HistorialUsuarioRutaViewSet

router = DefaultRouter()
router.register(r'agendar', CitaViewSet, basename='cita')
router.register(r'historial-rutas', HistorialUsuarioRutaViewSet, basename='historial-rutas')

urlpatterns = [
    path('', include(router.urls)),
]