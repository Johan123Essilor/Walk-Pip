from django.shortcuts import render
from rest_framework import generics, status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated, AllowAny  # ✅ Asegúrate de tener AllowAny
from django.contrib.auth import authenticate
from trail.models import HistorialUsuarioRuta, Cita
from datetime import datetime, date

# ✅ AÑADE TipoUsuario A ESTA IMPORTACIÓN:
from .models import Usuario, Review, Condicion, UsuarioCondicion, Salud, ContactoEmergencia, HorarioRetorno, TipoUsuario

from .serializers import UserRegisterSerializer, UserSerializer, LoginSerializer, ReviewSerializer, SaludSerializer, CondicionSerializer, UsuarioCondicionSerializer, ContactoEmergenciaSerializer, HorarioRetornoSerializer

from rest_framework.decorators import api_view, permission_classes
from django.db import transaction

@api_view(['POST'])
@permission_classes([AllowAny])
def sync_auth0_user(request):
    """
    Sincroniza usuario de Auth0 con la base de datos Django
    """
    try:
        # Obtener datos del request de Auth0
        auth0_id = request.data.get('sub')
        email = request.data.get('email')
        name = request.data.get('name')
        picture = request.data.get('picture')
        
        print(f"Recibiendo datos de Auth0: {email}, {auth0_id}")

        if not auth0_id or not email:
            return Response(
                {'error': 'sub and email are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # VERIFICACIÓN ALTERNATIVA: Podemos validar otros datos en lugar del token
        # Por ahora, confiamos en los datos mientras estamos en desarrollo
        
        with transaction.atomic():
            try:
                user = Usuario.objects.get(correo=email)
                created = False
                
                if name and user.nombre != name:
                    user.nombre = name
                
                user.auth0_id = auth0_id
                
                if picture:
                    user.picture = picture
                    
                user.save()
                print(f"Usuario actualizado: {user.correo}")
                
            except Usuario.DoesNotExist:
                from .models import TipoUsuario
                
                # # tipo_default = TipoUsuario.objects.first()
                # if not tipo_default:
                #     tipo_default = TipoUsuario.objects.create(
                #         nombre="usuario",
                #         descripcion="Usuario regular",
                #         nivel="basic"
                #     )
                
                user = Usuario.objects.create(
                    nombre=name or email.split('@')[0],
                    correo=email,
                    tipo_usuario=2,
                    auth0_id=auth0_id,
                    picture=picture
                )
                
                # Contraseña simple temporal
                user.set_password("auth0_temp_password_123")
                user.save()
                created = True
                print(f"✅ Nuevo usuario creado: {user.correo}")
        
        user_data = {
            'id': user.id,
            'nombre': user.nombre,
            'correo': user.correo,
            'edad': user.edad,
            'fecha_registro': user.fecha_registro,
            'auth0_id': user.auth0_id,
            'picture': user.picture,
            'tipo_usuario': {
                'id': user.tipo_usuario.id,
                'nombre': user.tipo_usuario.nombre
            } if user.tipo_usuario else None,
        }
        
        return Response({
            'user': user_data,
            'created': created,
            'message': 'Usuario creado exitosamente' if created else 'Usuario actualizado'
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error en sync_auth0_user: {str(e)}")
        return Response(
            {'error': f'Error del servidor: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
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
    permission_classes = [AllowAny]

    http_method_names = ['get', 'post', 'put', 'patch']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Review.objects.none()
        return Review.objects.all()

    def perform_create(self, serializer):
        from users.models import Usuario
        try:
            # Buscar usuario por email de Auth0 o usar uno por defecto
            user_email = self.request.data.get('user_email')
            if user_email:
                user = Usuario.objects.get(correo=user_email)
            else:
                # Usuario por defecto si no se proporciona email
                user = Usuario.objects.get(correo="johanlozoya14@gmail.com")
        except Usuario.DoesNotExist:
            # Fallback: usar el primer usuario disponible
            user = Usuario.objects.first()
        
        serializer.save(usuario=user)

    def update(self, request, *args, **kwargs):
        """
        Solo permitir actualizar reseñas propias (validación por email)
        """
        instance = self.get_object()

        user_email = request.data.get('user_email')
        if not user_email:
            return Response({"error": "user_email requerido."}, status=400)

        if instance.usuario.correo != user_email:
            return Response(
                {'error': 'Solo puedes actualizar tus propias reseñas.'},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().update(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def mis_reviews(self, request):
        """
        Obtener reseñas propias (validación por email)
        """
        user_email = request.data.get('user_email')

        if not user_email:
            return Response({"error": "user_email requerido."}, status=400)

        try:
            usuario = Usuario.objects.get(correo=user_email)
        except Usuario.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=404)

        reviews = Review.objects.filter(usuario=usuario)
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