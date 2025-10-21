from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SesionActividadViewSet

router = DefaultRouter()
router.register(r'actividades', SesionActividadViewSet, basename='sesionactividad')

urlpatterns = [
    path('', include(router.urls)),
]
