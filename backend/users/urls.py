from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, LoginView, ReviewViewSet, PerfilView, SaludViewSet, CondicionViewSet, UsuarioCondicionViewSet

router = DefaultRouter()
router.register(r'reseña', ReviewViewSet, basename='reseña')
router.register(r'salud', SaludViewSet, basename='salud')
router.register(r'condicion', CondicionViewSet, basename='condicion')
router.register(r'usuario-condicion', UsuarioCondicionViewSet, basename='usuario-condicion')
router.register(r'perfil', PerfilView, basename='perfil')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
    path('', include(router.urls)),
]
