from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Cita, HistorialUsuarioRuta
from .serializers import CitaSerializer, HistorialUsuarioRutaSerializer

class CitaViewSet(viewsets.ModelViewSet):
    serializer_class = CitaSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch']

    def get_queryset(self):
        """
        Solo retorna las citas del usuario autenticado
        """
        if getattr(self, 'swagger_fake_view', False):
            return Cita.objects.none()
        return Cita.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        """
        Asigna automáticamente el usuario autenticado al crear una cita
        """
        serializer.save(usuario=self.request.user)

    def update(self, request, *args, **kwargs):
        """
        Solo permite actualizar citas del usuario autenticado
        """
        instance = self.get_object()
        if instance.usuario != request.user:
            return Response(
                {'error': 'No puedes actualizar citas de otros usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    # Eliminar los endpoints personalizados duplicados ya que 
    # la funcionalidad está cubierta por los métodos base

class HistorialUsuarioRutaViewSet(viewsets.ModelViewSet):  
    queryset = HistorialUsuarioRuta.objects.all()
    serializer_class = HistorialUsuarioRutaSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()
