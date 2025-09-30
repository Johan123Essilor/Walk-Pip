from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CitaViewSet, RegistroUsuarioView, LoginUsuarioView, SessionActividadViewSet

router = DefaultRouter()
router.register(r'agendar', CitaViewSet, basename='cita')
router.register(r'session-actividades', SessionActividadViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('registro/', RegistroUsuarioView.as_view(), name='registro'),
    path('login/', LoginUsuarioView.as_view(), name='login'),
]
