# En tu urls.py actual - AÑADE la nueva ruta
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, LoginView, ReviewViewSet, PerfilView, SaludViewSet, CondicionViewSet, ContactoEmergenciaViewSet, HorarioRetornoViewSet, sync_auth0_user  # AÑADE sync_auth0_user

router = DefaultRouter()
router.register(r'reseña', ReviewViewSet, basename='reseña')
router.register(r'salud', SaludViewSet, basename='salud')
router.register(r'condicion', CondicionViewSet, basename='condicion')
router.register(r'perfil', PerfilView, basename='perfil')
router.register(r'contacto-emergencia', ContactoEmergenciaViewSet, basename='contacto-emergencia')
router.register(r'horario-retorno', HorarioRetornoViewSet, basename='horario-retorno')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
    path('auth0/sync/', sync_auth0_user, name='auth0-sync'),  # NUEVA RUTA
    path('', include(router.urls)),
]