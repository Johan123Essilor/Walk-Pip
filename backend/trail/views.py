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


    # NUEVO: Endpoint para obtener citas del usuario
    @action(detail=False, methods=['get'], url_path='mis-citas')
    def mis_citas(self, request):
        """Obtener todas las citas del usuario"""
        from users.models import Usuario
        
        user_email = request.query_params.get('user_email')
        
        if not user_email:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            usuario = Usuario.objects.get(correo=user_email)
            citas = Cita.objects.filter(usuario=usuario).order_by('-fecha_visita')
            
            # Serializar con información adicional
            citas_data = []
            for cita in citas:
                cita_data = CitaSerializer(cita).data
                
                # Agregar información de la ruta
                if cita.ruta:
                    cita_data['ruta_nombre'] = cita.ruta.nombre
                    cita_data['ruta_dificultad'] = cita.ruta.nivel_experiencia
                
                # Buscar horario de retorno si existe
                try:
                    horario_retorno = HorarioRetorno.objects.get(cita=cita)
                    cita_data['horario_retorno'] = {
                        'id': horario_retorno.id,
                        'hora_inicio': horario_retorno.hora_inicio,
                        'hora_retorno': horario_retorno.hora_retorno
                    }
                except HorarioRetorno.DoesNotExist:
                    cita_data['horario_retorno'] = None
                
                citas_data.append(cita_data)
            
            return Response(citas_data)
            
        except Usuario.DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

    # Endpoint para obtener amigos del usuario
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
    permission_classes = [AllowAny]
    
    # Solo permitir GET y PATCH (no POST, PUT, DELETE)
    http_method_names = ['get', 'patch']

    def get_queryset(self):
        """
        Filtrar historial por email del usuario
        """
        if getattr(self, 'swagger_fake_view', False):
            return HistorialUsuarioRuta.objects.none()
        
        # Obtener usuario por email (igual que en CitaViewSet)
        user_email = self.request.query_params.get('user_email') or self.request.data.get('user_email')
        
        if not user_email:
            return HistorialUsuarioRuta.objects.none()
        
        try:
            from users.models import Usuario
            usuario = Usuario.objects.get(correo=user_email)
            return HistorialUsuarioRuta.objects.filter(usuario=usuario)
        except Usuario.DoesNotExist:
            return HistorialUsuarioRuta.objects.none()

    def update(self, request, *args, **kwargs):
        """
        Solo permite actualizar resultado y satisfaccion
        """
        instance = self.get_object()
        
        # Verificar que el usuario solo puede actualizar su propio historial por email
        user_email = request.data.get('user_email')
        if not user_email:
            return Response(
                {'error': 'user_email es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from users.models import Usuario
            usuario = Usuario.objects.get(correo=user_email)
            if instance.usuario != usuario:
                return Response(
                    {'error': 'No puedes actualizar el historial de otros usuarios'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Usuario.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Filtrar solo los campos permitidos para actualización
        allowed_fields = ['resultado', 'satisfaccion', 'tiempo_duracion']
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
        
        user_email = request.data.get('user_email')
        if not user_email:
            return Response(
                {'error': 'user_email es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from users.models import Usuario
            usuario = Usuario.objects.get(correo=user_email)
            if historial.usuario != usuario:
                return Response(
                    {'error': 'No puedes actualizar este historial'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Usuario.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Solo permitir estos campos
        allowed_fields = ['resultado', 'satisfaccion']
        data = {key: request.data.get(key) for key in allowed_fields if key in request.data}
        
        serializer = self.get_serializer(historial, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)

    # NUEVO: Endpoint para obtener historial del usuario por email
    @action(detail=False, methods=['get'], url_path='mi-historial')
    def mi_historial(self, request):
        """Obtener todo el historial del usuario"""
        from users.models import Usuario
        
        user_email = request.query_params.get('user_email')
        
        if not user_email:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            usuario = Usuario.objects.get(correo=user_email)
            historial = HistorialUsuarioRuta.objects.filter(usuario=usuario).order_by('-fecha')
            
            serializer = self.get_serializer(historial, many=True)
            return Response(serializer.data)
            
        except Usuario.DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
    
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