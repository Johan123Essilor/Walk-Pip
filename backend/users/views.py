from django.shortcuts import render
from rest_framework import generics, status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from .models import Usuario, Review, Condicion, UsuarioCondicion, Salud
from .serializers import UserRegisterSerializer, UserSerializer, LoginSerializer, ReviewSerializer, SaludSerializer, CondicionSerializer, UsuarioCondicionSerializer


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
    GET: Lista todas las condiciones (solo autenticado)
    POST: Crear nueva condición (solo autenticado)
    """
    queryset = Condicion.objects.all()
    serializer_class = CondicionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Condicion.objects.none()
        return Condicion.objects.all()
    
    def perform_create(self, serializer):
        serializer.save()

# --- VIEWSET PARA USUARIO-CONDICIÓN ---
class UsuarioCondicionViewSet(mixins.CreateModelMixin,
                              viewsets.GenericViewSet):
    """
    Gestiona las condiciones asignadas al usuario autenticado.
    SOLO POST: Agregar condición al usuario
    """
    serializer_class = UsuarioCondicionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Como no permitimos GET, este método no se usará mucho
        if getattr(self, 'swagger_fake_view', False) or not self.request.user.is_authenticated:
            return UsuarioCondicion.objects.none()
        return UsuarioCondicion.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        # Asocia automáticamente al usuario actual
        serializer.save(usuario=self.request.user)

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
