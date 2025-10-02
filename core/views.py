from rest_framework.response import Response
from rest_framework import status, viewsets, generics
from .models import Cita, Usuario, SessionActividad, MetricaCaminata
from .serializers import CitaSerializer, UsuarioSerializer, SessionActividadSerializer, ToggleSessionSerializer, SessionStatusSerializer, MetricaCaminataSerializer
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import action
from django.utils.timezone import now
from rest_framework.permissions import IsAuthenticated

# Registro
class RegistroUsuarioView(generics.CreateAPIView):
    serializer_class = UsuarioSerializer

@method_decorator(csrf_exempt, name='dispatch')
class LoginUsuarioView(APIView):
    def post(self, request):
        correo = request.data.get("email")
        contrasena = request.data.get("password")

        usuario = authenticate(request, username=correo, password=contrasena)
        if usuario is not None:
            login(request, usuario)
            return Response({"message": "Login exitoso", "usuario_id": usuario.id})
        return Response({"error": "Credenciales inválidas"}, status=status.HTTP_400_BAD_REQUEST)

# Citas
class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.all()
    serializer_class = CitaSerializer

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class SessionActividadViewSet(viewsets.ModelViewSet):
    queryset = SessionActividad.objects.all()
    serializer_class = SessionActividadSerializer

    @action(detail=True, methods=['patch'], url_path='terminar')
    def terminar_sesion(self, request, pk=None):
        session = self.get_object()
        session.fecha_hora_fin = now()
        session.save()

        # Actualizar session_activa del usuario a False
        usuario = session.usuario
        usuario.session_activa = False
        usuario.save()

        return Response(SessionActividadSerializer(session).data, status=status.HTTP_200_OK)

# Usuario
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], serializer_class=ToggleSessionSerializer)
    def toggle_session(self, request):
        serializer = ToggleSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)  # <-- valida el body
        activo = serializer.validated_data['activo']

        usuario = request.user

        # Activar sesión
        if activo and not usuario.session_activa:
            SessionActividad.objects.create(
                usuario=usuario,
                fecha_hora_inicio=now(),
                ubicacion_inicial=0.0,
                ubicacion_final=0.0,
                ruta=None
            )

        # Desactivar sesión
        if not activo and usuario.session_activa:
            ultima_session = SessionActividad.objects.filter(
                usuario=usuario, fecha_hora_fin__isnull=True
            ).last()
            if ultima_session:
                ultima_session.fecha_hora_fin = now()
                ultima_session.save()

        usuario.session_activa = activo
        usuario.save()

        return Response({
            "usuario_id": usuario.id,
            "session_activa": usuario.session_activa
        })


    @action(detail=False, methods=['get'])
    def session_status(self, request):
        usuario = request.user
        ultima_session = SessionActividad.objects.filter(usuario=usuario, fecha_hora_fin__isnull=True).order_by('-fecha_hora_inicio').first()
        serializer_data = {
            "session_activa": usuario.session_activa,
            "ultima_session": {
                "ID": ultima_session.ID,
                "fecha_hora_inicio": ultima_session.fecha_hora_inicio,
                "fecha_hora_fin": ultima_session.fecha_hora_fin
            } if ultima_session else None
        }
        return Response(serializer_data)
    

class MetricaCaminataViewSet(viewsets.ModelViewSet):
    queryset = MetricaCaminata.objects.all()
    serializer_class = MetricaCaminataSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # opcional: asociar la sesión que viene del body
        serializer.save()
