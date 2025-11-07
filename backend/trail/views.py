from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from rest_framework.permissions import AllowAny
from users.models import Usuario

from .models import Cita, HistorialUsuarioRuta, Ruta, InvitacionCita
from users.models import HorarioRetorno
from .serializers import (
    CitaSerializer, 
    HistorialUsuarioRutaSerializer, 
    RutaSerializer,
    InvitarAmigosSerializer,
    InvitarGrupoSerializer,
    UsuarioAmigoSerializer
    
)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioAmigoSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def todos(self, request):
        """
        Endpoint para obtener todos los usuarios
        """
        usuarios = Usuario.objects.all()
        serializer = self.get_serializer(usuarios, many=True)
        return Response(serializer.data)
class CitaViewSet(viewsets.ModelViewSet):
    serializer_class = CitaSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Cita.objects.none()
        return Cita.objects.all()

    def perform_create(self, serializer):
        from users.models import Usuario
        try:
            # Buscar usuario por email de Auth0 o usar uno por defecto
            user_email = self.request.data.get('user_email')
            if user_email:
                user = Usuario.objects.get(correo=user_email)
            else:
                user = Usuario.objects.get(correo="johanlozoya14@gmail.com")
        except Usuario.DoesNotExist:
            user = Usuario.objects.first()
        
        serializer.save(usuario=user)

    # ✅ Endpoint para obtener amigos del usuario
    @action(detail=False, methods=['get'], url_path='mis-amigos')
    def mis_amigos(self, request):
        """Obtener lista de amigos del usuario"""
        from users.models import Usuario
        
        # Por ahora, devolver todos los usuarios excepto el actual
        # En una implementación real, aquí iría la lógica de amistades
        user_email = request.query_params.get('user_email')
        
        if user_email:
            try:
                usuario_actual = Usuario.objects.get(correo=user_email)
                amigos = Usuario.objects.exclude(id=usuario_actual.id)[:50]  # Limitar resultados
            except Usuario.DoesNotExist:
                amigos = Usuario.objects.all()[:50]
        else:
            amigos = Usuario.objects.all()[:50]
        
        serializer = UsuarioAmigoSerializer(amigos, many=True)
        return Response(serializer.data)
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
    permission_classes = [AllowAny]