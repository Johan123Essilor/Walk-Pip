from django.shortcuts import render
from rest_framework import generics, status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from trail.models import HistorialUsuarioRuta, Cita
from datetime import datetime, date
from .models import Usuario, Review, Condicion, UsuarioCondicion, Salud, ContactoEmergencia, HorarioRetorno
from .serializers import UserRegisterSerializer, UserSerializer, LoginSerializer, ReviewSerializer, SaludSerializer, CondicionSerializer, UsuarioCondicionSerializer, ContactoEmergenciaSerializer, HorarioRetornoSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": str(token.access_token),
            "refresh": str(token)
        }, status=status.HTTP_201_CREATED)

class LoginView(generics.CreateAPIView):
    serializer_class = LoginSerializer

    def post(self, request):
        correo = request.data.get("correo")
        contrasena = request.data.get("contrasena")

        user = authenticate(username=correo, password=contrasena)

        if user:
            token = RefreshToken.for_user(user)
            return Response({
                "user": UserSerializer(user).data,
                "access": str(token.access_token),
                "refresh": str(token)
            }, status=status.HTTP_200_OK)
        return Response({"detail": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)
    
class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    # Permitir solo GET, POST, PUT, PATCH, DELETE
    http_method_names = ['get', 'post', 'put', 'patch']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Review.objects.none()
        return Review.objects.all()

    def perform_create(self, serializer):
        # Asignar automáticamente el usuario logueado
        serializer.save(usuario=self.request.user)

    def update(self, request, *args, **kwargs):
        """Solo permitir actualizar reseñas propias"""
        instance = self.get_object()
        if instance.usuario != request.user:
            return Response(
                {'error': 'No puedes actualizar reseñas de otros usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    # Solo este endpoint personalizado que agrega valor
    @action(detail=False, methods=['get'])
    def mis_reviews(self, request):
        """
        Endpoint específico para obtener solo las reseñas del usuario logueado
        """
        reviews = Review.objects.filter(usuario=request.user)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

class PerfilView(mixins.RetrieveModelMixin,
                 mixins.UpdateModelMixin,
                 mixins.ListModelMixin,
                 viewsets.GenericViewSet):
    """
    ViewSet para gestionar el perfil del usuario autenticado.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    # Agrega esto para Swagger
    queryset = Usuario.objects.all()

    def get_object(self):
        # Siempre retorna el usuario autenticado, ignora el pk
        return self.request.user

    def list(self, request, *args, **kwargs):
        # Redirige a retrieve para obtener el perfil
        return self.retrieve(request, *args, **kwargs)

# --- VIEWSET PARA CONDICIONES (CATÁLOGO) ---
class CondicionViewSet(mixins.ListModelMixin, 
                       mixins.RetrieveModelMixin,
                       mixins.CreateModelMixin,
                       viewsets.GenericViewSet):
    """
    Catálogo de condiciones médicas disponibles.
    GET: Lista todas las condiciones
    POST: Crear nueva condición (asigna automáticamente al usuario autenticado)
    """
    queryset = Condicion.objects.all()
    serializer_class = CondicionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Condicion.objects.none()
        return Condicion.objects.all()

    def perform_create(self, serializer):
        condicion = serializer.save()
        # 🔹 Crear automáticamente la relación con el usuario autenticado
        UsuarioCondicion.objects.create(usuario=self.request.user, condicion=condicion)


# --- VIEWSET PARA SALUD ---
class SaludViewSet(viewsets.ModelViewSet):
    """
    Permite que el usuario registre y consulte sus datos de salud.
    """
    serializer_class = SaludSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False) or not self.request.user.is_authenticated:
            return Salud.objects.none()

        #  Solo el registro del usuario autenticado
        return Salud.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        #  Asocia el registro al usuario autenticado
        serializer.save(usuario=self.request.user)

    # GET /salud/mis_datos/
    @action(detail=False, methods=['get'])
    def mis_datos(self, request):
        """
        Retorna los datos de salud del usuario autenticado.
        """
        salud = Salud.objects.filter(usuario=request.user).first()
        if not salud:
            return Response(
                {"detalle": "No hay datos de salud registrados."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(salud)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ContactoEmergenciaViewSet(viewsets.ModelViewSet):
    serializer_class = ContactoEmergenciaSerializer
    permission_classes = [IsAuthenticated]
    
    # Solo permitir estos métodos
    http_method_names = ['get', 'post', 'put', 'patch']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ContactoEmergencia.objects.none()
        return ContactoEmergencia.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.usuario != request.user:
            return Response(
                {'error': 'No puedes actualizar contactos de otros usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

class HorarioRetornoViewSet(viewsets.ModelViewSet):
    serializer_class = HorarioRetornoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Retorna los horarios del usuario autenticado,
        filtrando a través de las citas que le pertenecen.
        """
        if getattr(self, 'swagger_fake_view', False):
            return HorarioRetorno.objects.none()
        return HorarioRetorno.objects.filter(cita__usuario=self.request.user)

    def perform_create(self, serializer):
        """
        Crea el horario y genera el historial automáticamente.
        """
        horario = serializer.save()

        # Calcular duración estimada
        duracion_estimada = None
        if horario.hora_inicio and horario.hora_retorno:
            inicio = datetime.combine(date.today(), horario.hora_inicio)
            fin = datetime.combine(date.today(), horario.hora_retorno)
            duracion_estimada = fin - inicio

       # Buscar si hay historiales previos de esa ruta y usuario
            historial = HistorialUsuarioRuta.objects.filter(
                usuario=horario.cita.usuario,
                ruta=horario.cita.ruta
            ).last()  # el más reciente, por ejemplo

            # Si no hay historial previo, lo creas
            if not historial:
                historial = HistorialUsuarioRuta.objects.create(
                    usuario=horario.cita.usuario,
                    ruta=horario.cita.ruta,
                    tiempo_duracion=duracion_estimada,
                    resultado="Pendiente",
                    satisfaccion="Por evaluar"
                )
            else:
                historial.tiempo_duracion = duracion_estimada
                historial.save()


    def update(self, request, *args, **kwargs):
        """
        Solo permite actualizar horarios del usuario autenticado
        """
        instance = self.get_object()
        if instance.cita.usuario != request.user:
            return Response(
                {'error': 'No puedes actualizar horarios de otros usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)