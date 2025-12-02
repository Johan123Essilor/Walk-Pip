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
from rest_framework.exceptions import ValidationError

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
                    tipo_usuario_id=2,
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

class UsuarioViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    ViewSet para obtener lista de usuarios disponibles.
    Solo permite GET (lista) para agregar miembros a grupos.
    """
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Devuelve todos los usuarios activos ordenados
        return Usuario.objects.filter(is_active=True).order_by('nombre', 'correo')

    @action(detail=True, methods=['get'], url_path='similares')
    def usuarios_similares(self, request, pk=None):
        """
        Devuelve usuarios similares basados en clustering ML.
        """
        try:
            import os
            import joblib
            from sklearn.metrics.pairwise import cosine_similarity

            usuario_actual = self.get_object()

            BASE_DIR = os.path.dirname(os.path.abspath(__file__))
            ML_MODELS_DIR = os.path.join(BASE_DIR, 'ml_model')

            modelo_path = os.path.join(ML_MODELS_DIR, 'modelo_caminata.pkl')
            scaler_path = os.path.join(ML_MODELS_DIR, 'scaler_caminata.pkl')

            try:
                modelo = joblib.load(modelo_path)
                scaler = joblib.load(scaler_path)

                usuarios_candidatos = Usuario.objects.filter(is_active=True).exclude(id=usuario_actual.id)

                if not usuarios_candidatos.exists():
                    return Response({
                        'usuarios': [],
                        'algoritmo': 'ml_clustering',
                        'total': 0,
                        'mensaje': 'No hay usuarios disponibles para comparar'
                    })

                caracteristicas_actual = self._extraer_caracteristicas_usuario(usuario_actual)

                usuarios_con_similitud = []

                for usuario in usuarios_candidatos:
                    try:
                        caracteristicas_candidato = self._extraer_caracteristicas_usuario(usuario)

                        f_actual = scaler.transform([caracteristicas_actual])
                        f_cand = scaler.transform([caracteristicas_candidato])

                        similitud = cosine_similarity(f_actual, f_cand)[0][0]

                        usuarios_con_similitud.append({
                            'usuario': usuario,
                            'similitud': float(similitud)
                        })

                    except:
                        continue

                usuarios_con_similitud.sort(key=lambda x: x['similitud'], reverse=True)
                usuarios_similares = [u['usuario'] for u in usuarios_con_similitud[:5]]

                serializer = self.get_serializer(usuarios_similares, many=True)

                return Response({
                    'usuarios': serializer.data,
                    'algoritmo': 'ml_clustering',
                    'total': len(serializer.data),
                    'similitudes': [round(u['similitud'], 3) for u in usuarios_con_similitud[:5]]
                })

            except FileNotFoundError:
                return self._algoritmo_mvp_fallback(usuario_actual)

        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)
        except Exception as e:
            return Response({'error': f'Error interno: {str(e)}'}, status=500)

    def _extraer_caracteristicas_usuario(self, usuario):
        """
        Extrae características para el modelo ML.
        """
        from trail.models import HistorialUsuarioRuta

        historial = HistorialUsuarioRuta.objects.filter(usuario=usuario)

        edad = usuario.edad or 25
        total_rutas = historial.count()
        rutas_completadas = historial.filter(resultado='completado').count()

        satisfaccion_promedio = 3.0
        if historial.exists():
            valores = {
                'muy_satisfecho': 5,
                'satisfecho': 4,
                'neutral': 3,
                'insatisfecho': 2,
                'muy_insatisfecho': 1,
            }
            nums = [valores.get(h.satisfaccion, 3) for h in historial]
            satisfaccion_promedio = sum(nums) / len(nums)

        nivel_actividad = 3.0
        salud = usuario.salud_set.first()
        if salud and salud.nivel_actividad:
            nivel_actividad = float(salud.nivel_actividad)

        return [
            edad,
            total_rutas,
            rutas_completadas,
            satisfaccion_promedio,
            nivel_actividad,
        ]

    def _algoritmo_mvp_fallback(self, usuario_actual):
        """
        Fallback si no hay modelo ML.
        """
        edad_min = max(18, (usuario_actual.edad or 25) - 5)
        edad_max = min(80, (usuario_actual.edad or 25) + 5)

        usuarios_similares = Usuario.objects.filter(
            is_active=True,
            edad__gte=edad_min,
            edad__lte=edad_max
        ).exclude(id=usuario_actual.id).order_by('?')[:5]

        serializer = self.get_serializer(usuarios_similares, many=True)

        return Response({
            'usuarios': serializer.data,
            'algoritmo': 'edad_similar_mvp_fallback',
            'total': len(serializer.data)
        })
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
    ViewSet para gestionar el perfil del usuario - VERSIÓN PÚBLICA
    """
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # ← Cambiado de [IsAuthenticated] a [AllowAny]
    
    # Agrega esto para Swagger
    queryset = Usuario.objects.all()

    def get_object(self):
        """
        Obtiene el usuario por email en lugar de por autenticación JWT
        """
        user_email = self.request.data.get('user_email') or self.request.query_params.get('user_email')
        
        if not user_email:
            return Response(
                {"error": "user_email es requerido"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            return Usuario.objects.get(correo=user_email)
        except Usuario.DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def retrieve(self, request, *args, **kwargs):
        """
        Obtener perfil por email
        """
        instance = self.get_object()
        
        # Si get_object retorna un Response (error), lo retornamos directamente
        if isinstance(instance, Response):
            return instance
            
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        """
        Redirige a retrieve para obtener el perfil
        Requiere user_email en query params
        """
        return self.retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """
        Actualizar perfil - validación por email
        """
        instance = self.get_object()
        
        if isinstance(instance, Response):
            return instance

        # Validar que el email del perfil coincida con el user_email enviado
        user_email = request.data.get('user_email')
        if not user_email:
            return Response(
                {"error": "user_email es requerido"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if instance.correo != user_email:
            return Response(
                {"error": "Solo puedes actualizar tu propio perfil"},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """
        Actualización parcial - misma validación que update
        """
        return self.update(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def mi_perfil(self, request):
        """
        Endpoint alternativo para obtener perfil por email
        """
        user_email = request.data.get('user_email')
        
        if not user_email:
            return Response(
                {"error": "user_email es requerido"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            usuario = Usuario.objects.get(correo=user_email)
            serializer = self.get_serializer(usuario)
            return Response(serializer.data)
        except Usuario.DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"}, 
                status=status.HTTP_404_NOT_FOUND
            )

# --- VIEWSET PARA CONDICIONES (CATÁLOGO) ---
class CondicionViewSet(mixins.ListModelMixin, 
                       mixins.RetrieveModelMixin,
                       mixins.CreateModelMixin,
                       viewsets.GenericViewSet):
    """
    Catálogo de condiciones médicas disponibles.
    GET: Lista todas las condiciones
    POST: Crear nueva condición (asigna automáticamente al usuario por email)
    """
    queryset = Condicion.objects.all()
    serializer_class = CondicionSerializer
    permission_classes = [AllowAny]  # ← Cambiado

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Condicion.objects.none()
        return Condicion.objects.all()

    def perform_create(self, serializer):
        user_email = self.request.data.get('user_email')
        if not user_email:
            raise ValidationError({"error": "user_email es requerido"})
        
        try:
            usuario = Usuario.objects.get(correo=user_email)
        except Usuario.DoesNotExist:
            raise ValidationError({"error": "Usuario no encontrado"})
        
        condicion = serializer.save()
        # 🔹 Crear automáticamente la relación con el usuario por email
        UsuarioCondicion.objects.create(usuario=usuario, condicion=condicion)

# En tu views.py
class UsuarioCondicionViewSet(viewsets.ModelViewSet):
    serializer_class = UsuarioCondicionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return UsuarioCondicion.objects.none()
        return UsuarioCondicion.objects.all()

    # Ya no necesitamos perform_create porque el serializer maneja la creación

# --- VIEWSET PARA SALUD ---
class SaludViewSet(viewsets.ModelViewSet):
    """
    Permite que el usuario registre y consulte sus datos de salud.
    """
    serializer_class = SaludSerializer
    permission_classes = [AllowAny]  # ← Cambiado

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Salud.objects.none()

        user_email = self.request.data.get('user_email') or self.request.query_params.get('user_email')
        if not user_email:
            return Salud.objects.none()

        try:
            usuario = Usuario.objects.get(correo=user_email)
            return Salud.objects.filter(usuario=usuario)
        except Usuario.DoesNotExist:
            return Salud.objects.none()

    def perform_create(self, serializer):
        user_email = self.request.data.get('user_email')
        if not user_email:
            raise ValidationError({"error": "user_email es requerido"})
        
        try:
            usuario = Usuario.objects.get(correo=user_email)
        except Usuario.DoesNotExist:
            raise ValidationError({"error": "Usuario no encontrado"})
        
        # Asocia el registro al usuario por email
        serializer.save(usuario=usuario)

    # GET /salud/mis_datos/
    @action(detail=False, methods=['post'])
    def mis_datos(self, request):
        """
        Retorna los datos de salud del usuario por email
        """
        user_email = request.data.get('user_email')
        if not user_email:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            usuario = Usuario.objects.get(correo=user_email)
            salud = Salud.objects.filter(usuario=usuario).first()
            
            if not salud:
                return Response(
                    {"detalle": "No hay datos de salud registrados."},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = self.get_serializer(salud)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Usuario.DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )


class ContactoEmergenciaViewSet(viewsets.ModelViewSet):
    serializer_class = ContactoEmergenciaSerializer
    permission_classes = [AllowAny]  # ← Cambiado
    
    # Solo permitir estos métodos
    http_method_names = ['get', 'post', 'put', 'patch']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ContactoEmergencia.objects.none()

        user_email = self.request.data.get('user_email') or self.request.query_params.get('user_email')
        if not user_email:
            return ContactoEmergencia.objects.none()

        try:
            usuario = Usuario.objects.get(correo=user_email)
            return ContactoEmergencia.objects.filter(usuario=usuario)
        except Usuario.DoesNotExist:
            return ContactoEmergencia.objects.none()

    def perform_create(self, serializer):
        user_email = self.request.data.get('user_email')
        if not user_email:
            raise ValidationError({"error": "user_email es requerido"})
        
        try:
            usuario = Usuario.objects.get(correo=user_email)
        except Usuario.DoesNotExist:
            raise ValidationError({"error": "Usuario no encontrado"})
        
        serializer.save(usuario=usuario)

    def update(self, request, *args, **kwargs):
        user_email = request.data.get('user_email')
        if not user_email:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        instance = self.get_object()
        
        try:
            usuario = Usuario.objects.get(correo=user_email)
            if instance.usuario != usuario:
                return Response(
                    {'error': 'No puedes actualizar contactos de otros usuarios'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Usuario.DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        return super().update(request, *args, **kwargs)


class HorarioRetornoViewSet(viewsets.ModelViewSet):
    serializer_class = HorarioRetornoSerializer
    permission_classes = [AllowAny]  # ← Cambiado

    def get_queryset(self):
        """
        Retorna los horarios del usuario por email
        """
        if getattr(self, 'swagger_fake_view', False):
            return HorarioRetorno.objects.none()

        user_email = self.request.data.get('user_email') or self.request.query_params.get('user_email')
        if not user_email:
            return HorarioRetorno.objects.none()

        try:
            usuario = Usuario.objects.get(correo=user_email)
            return HorarioRetorno.objects.filter(cita__usuario=usuario)
        except Usuario.DoesNotExist:
            return HorarioRetorno.objects.none()

    def perform_create(self, serializer):
        user_email = self.request.data.get('user_email')
        if not user_email:
            raise ValidationError({"error": "user_email es requerido"})
        
        try:
            usuario = Usuario.objects.get(correo=user_email)
        except Usuario.DoesNotExist:
            raise ValidationError({"error": "Usuario no encontrado"})
        
        horario = serializer.save()

        # Calcular duración estimada
        duracion_estimada = None
        if horario.hora_inicio and horario.hora_retorno:
            from datetime import datetime, date
            inicio = datetime.combine(date.today(), horario.hora_inicio)
            fin = datetime.combine(date.today(), horario.hora_retorno)
            duracion_estimada = fin - inicio

            fecha_cita = horario.cita.fecha_visita.date() 
        
        historial, created = HistorialUsuarioRuta.objects.get_or_create(
        usuario=usuario,
        ruta=horario.cita.ruta,
        fecha=fecha_cita,
        defaults={
            'tiempo_duracion': duracion_estimada,
            'resultado': 'en proceso',      # ← Estado real
            'satisfaccion': 'por evaluar',      # ← Valor por defecto rea
        }
    )
    
        # # Si ya existía, actualizar la duración
        # if not created:
        #     historial.tiempo_duracion = duracion_estimada
        #     historial.save()
        
        # print(f" Historial {'creado' if created else 'actualizado'}: {historial.id}")

    def update(self, request, *args, **kwargs):
        """
        Solo permite actualizar horarios del usuario por email
        """
        user_email = request.data.get('user_email')
        if not user_email:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        instance = self.get_object()
        
        try:
            usuario = Usuario.objects.get(correo=user_email)
            if instance.cita.usuario != usuario:
                return Response(
                    {'error': 'No puedes actualizar horarios de otros usuarios'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Usuario.DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        return super().update(request, *args, **kwargs)