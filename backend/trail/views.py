from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Cita, HistorialUsuarioRuta, Ruta
from users.models import HorarioRetorno
from .serializers import CitaSerializer, HistorialUsuarioRutaSerializer, RutaSerializer

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
        Crea la cita y asocia el usuario autenticado.
        """
        serializer.save(usuario=self.request.user)

#cuando se crea la cita se hace post al historial de rutas al terminar la ruta el usuario solo actualizara el resultado y satisfacccion 
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

class HistorialUsuarioRutaViewSet(viewsets.ModelViewSet):
    serializer_class = HistorialUsuarioRutaSerializer
    permission_classes = [IsAuthenticated]
    
    # Solo permitir GET y PATCH (no POST, PUT, DELETE)
    http_method_names = ['get', 'patch']

    def get_queryset(self):
        """
        Solo ver el historial del usuario autenticado
        """
        if getattr(self, 'swagger_fake_view', False):
            # Para Swagger durante la generación del schema
            return HistorialUsuarioRuta.objects.none()
        
        # Verificar que el usuario esté autenticado
        if not self.request.user.is_authenticated:
            return HistorialUsuarioRuta.objects.none()
            
        return HistorialUsuarioRuta.objects.filter(usuario=self.request.user)

    def update(self, request, *args, **kwargs):
        """
        Solo permite actualizar resultado y satisfaccion
        """
        instance = self.get_object()
        
        # Verificar que el usuario solo puede actualizar su propio historial
        if instance.usuario != request.user:
            return Response(
                {'error': 'No puedes actualizar el historial de otros usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Filtrar solo los campos permitidos para actualización
        allowed_fields = ['resultado', 'satisfaccion']
        data = {key: request.data.get(key) for key in allowed_fields if key in request.data}
        
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)

    # Endpoint específico para actualizar resultado y satisfacción
    @action(detail=True, methods=['patch'])
    def actualizar_resultado(self, request, pk=None):
        """
        Actualizar solo resultado y satisfacción de una ruta completada
        PATCH /historial/{id}/actualizar_resultado/
        """
        historial = self.get_object()
        
        if historial.usuario != request.user:
            return Response(
                {'error': 'No puedes actualizar este historial'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Solo permitir estos campos
        allowed_fields = ['resultado', 'satisfaccion']
        data = {key: request.data.get(key) for key in allowed_fields if key in request.data}
        
        serializer = self.get_serializer(historial, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)
    
class RutaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las rutas.
    Permite:
    - GET: listar o ver detalle
    - POST: crear una ruta
    - PUT/PATCH: actualizar una ruta
    - DELETE: eliminar una ruta
    """
    queryset = Ruta.objects.all()
    serializer_class = RutaSerializer
    permission_classes = [IsAuthenticated]