from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils.timezone import now
from django.db.models import Sum
from datetime import timedelta
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
    #permission_classes = [IsAuthenticated]

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


# Vistas para las métricas
class MetricaCaminataViewSet(viewsets.ModelViewSet):
    queryset = MetricaCaminata.objects.all()
    serializer_class = MetricaCaminataSerializer
    #permission_classes = [IsAuthenticated]
    def perform_create(self, serializer):
        serializer.save()

    # Sobrescribir list para aceptar ?time_range=1h|6h|24h y devolver datos formateados para gráficas
    def list(self, request, *args, **kwargs):
        time_range = request.query_params.get('time_range')
        qs = self.queryset

        if time_range:
            mapping = {'1h': 1, '6h': 6, '24h': 24}
            hours = mapping.get(time_range.lower())
            if hours:
                cutoff = now() - timedelta(hours=hours)
                qs = qs.filter(sesion__fecha_hora_inicio__gte=cutoff)

        qs = qs.select_related('sesion').order_by('-sesion__fecha_hora_inicio')  # Más recientes primero

        data = []
        for item in qs:
            hora = None
            try:
                hora = item.sesion.fecha_hora_inicio.isoformat()
            except Exception:
                hora = None

            data.append({
                'id': item.id,
                'hora': hora,
                'km_recorridos': float(item.km_recorridos),
                'pasos': item.pasos,
                'tiempo_actividad': str(item.tiempo_actividad),
                'velocidad_promedio': float(item.velocidad_promedio),
                'calorias_quemadas': float(item.calorias_quemadas),
                'sesion': item.sesion.id if item.sesion else None
            })

        return Response(data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        Obtener el último registro de caminata
        """
        try:
            latest_metric = self.get_queryset().last()
            if not latest_metric:
                return Response({"error": "No hay datos disponibles"}, status=status.HTTP_404_NOT_FOUND)
            
            data = {
                'id': latest_metric.id,
                'km_recorridos': float(latest_metric.km_recorridos),
                'pasos': latest_metric.pasos,
                'tiempo_actividad': str(latest_metric.tiempo_actividad),
                'velocidad_promedio': float(latest_metric.velocidad_promedio),
                'calorias_quemadas': float(latest_metric.calorias_quemadas),
                'sesion': latest_metric.sesion.id if latest_metric.sesion else None
            }
            return Response(data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def session_stats(self, request):
        """
        Obtener estadísticas de la sesión actual
        """
        try:
            # Obtener la sesión activa del usuario
            usuario = request.user
            if not usuario.is_authenticated:
                return Response({"detalle": "Usuario no autenticado."}, status=status.HTTP_401_UNAUTHORIZED)

            sesion_activa = SesionActividad.objects.filter(
                usuario=usuario, 
                fecha_hora_fin__isnull=True
            ).first()

            if not sesion_activa:
                return Response({"error": "No hay sesión activa"}, status=status.HTTP_404_NOT_FOUND)

            # Métricas de la sesión activa
            metricas_caminata = self.get_queryset().filter(sesion=sesion_activa)
            metricas_corazon = MetricaCorazon.objects.filter(sesion=sesion_activa)

            # Calcular estadísticas
            total_pasos = metricas_caminata.aggregate(Sum('pasos'))['pasos__sum'] or 0
            total_calorias = metricas_caminata.aggregate(Sum('calorias_quemadas'))['calorias_quemadas__sum'] or 0
            total_km = metricas_caminata.aggregate(Sum('km_recorridos'))['km_recorridos__sum'] or 0

            # Duración de la sesión
            duracion_segundos = 0
            if sesion_activa.fecha_hora_inicio:
                tiempo_transcurrido = now() - sesion_activa.fecha_hora_inicio
                duracion_segundos = int(tiempo_transcurrido.total_seconds())

            # Estadísticas de corazón
            ritmos = metricas_corazon.values_list('ritmo_cardiaco', flat=True)
            oxigenaciones = metricas_corazon.values_list('oxigenacion', flat=True)

            stats = {
                'session_duration': duracion_segundos,
                'data_count': metricas_caminata.count() + metricas_corazon.count(),
                'total_pasos': total_pasos,
                'total_calorias': total_calorias,
                'total_km': total_km,
                'max_ritmo': max(ritmos) if ritmos else 0,
                'min_ritmo': min(ritmos) if ritmos else 0,
                'max_oxigenacion': float(max(oxigenaciones)) if oxigenaciones else 0,
                'min_oxigenacion': float(min(oxigenaciones)) if oxigenaciones else 0,
                'sesion_id': sesion_activa.id,
                'inicio_sesion': sesion_activa.fecha_hora_inicio.isoformat() if sesion_activa.fecha_hora_inicio else None
            }

            return Response(stats)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MetricaCorazonViewSet(viewsets.ModelViewSet):
    queryset = MetricaCorazon.objects.all()
    serializer_class = MetricaCorazonSerializer
    #permission_classes = [IsAuthenticated]
    def perform_create(self, serializer):
        serializer.save()

    # Sobrescribir list para aceptar ?time_range=1h|6h|24h y devolver datos formateados para gráficas
    def list(self, request, *args, **kwargs):
        time_range = request.query_params.get('time_range')
        qs = self.queryset

        if time_range:
            mapping = {'1h': 1, '6h': 6, '24h': 24}
            hours = mapping.get(time_range.lower())
            if hours:
                cutoff = now() - timedelta(hours=hours)
                qs = qs.filter(sesion__fecha_hora_inicio__gte=cutoff)

        qs = qs.select_related('sesion').order_by('-fecha', '-hora')  # Más recientes primero

        data = []
        for item in qs:
            data.append({
                'id': item.id,
                'fecha': item.fecha.isoformat() if item.fecha else None,
                'hora': item.hora.strftime('%H:%M:%S') if item.hora else None,
                'ritmo_cardiaco': item.ritmo_cardiaco,
                'presion': item.presion,
                'oxigenacion': float(item.oxigenacion),
                'sesion': item.sesion.id if item.sesion else None
            })

        return Response(data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        Obtener el último registro de corazón
        """
        try:
            latest_metric = self.get_queryset().last()
            if not latest_metric:
                return Response({"error": "No hay datos disponibles"}, status=status.HTTP_404_NOT_FOUND)
            
            data = {
                'id': latest_metric.id,
                'fecha': latest_metric.fecha.isoformat() if latest_metric.fecha else None,
                'hora': latest_metric.hora.strftime('%H:%M:%S') if latest_metric.hora else None,
                'ritmo_cardiaco': latest_metric.ritmo_cardiaco,
                'presion': latest_metric.presion,
                'oxigenacion': float(latest_metric.oxigenacion),
                'sesion': latest_metric.sesion.id if latest_metric.sesion else None
            }
            return Response(data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
