from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils.timezone import now
from .models import Cita, MetricaCorazon, SesionActividad, MetricaCaminata
from users.models import Usuario
from .serializers import (
    MetricaCorazonSerializer,
    ToggleSessionSerializer,
    SesionStatusSerializer,
    MetricaCaminataSerializer,
    SesionActividadSerializer
)


class SesionActividadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar sesiones de actividad (iniciar, detener, listar).
    """
    serializer_class = SesionActividadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            # evita error si swagger prueba sin token
            return SesionActividad.objects.none()
        return SesionActividad.objects.filter(usuario=user)

    # ✅ POST /actividad/toggle_session/
    @action(detail=False, methods=['post'], serializer_class=ToggleSessionSerializer)
    def toggle_session(self, request):
        """
        Inicia o finaliza la sesión activa del usuario.
        """
        serializer = ToggleSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        activo = serializer.validated_data['activo']
        usuario = request.user

        if not usuario.is_authenticated:
            return Response({"detalle": "Usuario no autenticado."}, status=status.HTTP_401_UNAUTHORIZED)

        # 🔹 Iniciar sesión
        if activo:
            # verificar si ya hay una sesión activa
            sesion_activa = SesionActividad.objects.filter(usuario=usuario, fecha_hora_fin__isnull=True).last()
            if sesion_activa:
                return Response({"detalle": "Ya hay una sesión activa."}, status=status.HTTP_400_BAD_REQUEST)

            SesionActividad.objects.create(
                usuario=usuario,
                fecha_hora_inicio=now(),
                ubicacion_inicial=0.0,
                ruta=None
            )
            usuario.session_activa = True
            usuario.save()
            return Response({"mensaje": "Sesión iniciada correctamente."}, status=status.HTTP_201_CREATED)

        # 🔹 Finalizar sesión
        else:
            sesion_activa = SesionActividad.objects.filter(usuario=usuario, fecha_hora_fin__isnull=True).last()
            if not sesion_activa:
                return Response({"detalle": "No hay una sesión activa."}, status=status.HTTP_400_BAD_REQUEST)

            sesion_activa.fecha_hora_fin = now()
            sesion_activa.save()

            usuario.session_activa = False
            usuario.save()
            return Response({"mensaje": "Sesión finalizada correctamente."}, status=status.HTTP_200_OK)

    # ✅ GET /actividad/session_status/
    @action(detail=False, methods=['get'], serializer_class=SesionStatusSerializer)
    def session_status(self, request):
        """
        Devuelve el estado actual de la sesión del usuario.
        """
        usuario = request.user
        if not usuario.is_authenticated:
            return Response({"detalle": "Usuario no autenticado."}, status=status.HTTP_401_UNAUTHORIZED)

        ultima_session = SesionActividad.objects.filter(usuario=usuario).order_by('-fecha_hora_inicio').first()
        data = {
            "session_activa": usuario.session_activa,
            "ultima_session": ultima_session
        }
        serializer = SesionStatusSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ✅ GET /actividad/historial/
    @action(detail=False, methods=['get'])
    def historial(self, request):
        """
        Devuelve el historial de todas las sesiones del usuario autenticado.
        """
        usuario = request.user
        if not usuario.is_authenticated:
            return Response({"detalle": "Usuario no autenticado."}, status=status.HTTP_401_UNAUTHORIZED)

        sesiones = SesionActividad.objects.filter(usuario=usuario).order_by('-fecha_hora_inicio')
        serializer = self.get_serializer(sesiones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ✅ Vistas para las métricas
class MetricaCaminataViewSet(viewsets.ModelViewSet):
    queryset = MetricaCaminata.objects.all()
    serializer_class = MetricaCaminataSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()


class MetricaCorazonViewSet(viewsets.ModelViewSet):
    queryset = MetricaCorazon.objects.all()
    serializer_class = MetricaCorazonSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()
