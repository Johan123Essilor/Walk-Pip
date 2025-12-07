# views.py - Añadir los imports que faltan
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.utils.timezone import now
from django.db.models import Sum, Avg, Max, Min, Count  # Añadir Count
from datetime import timedelta, datetime  # Añadir datetime
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
    # permission_classes = [IsAuthenticated]

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
            sesion_activa = SesionActividad.objects.filter(
                usuario=usuario, fecha_hora_fin__isnull=True).last()
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
            sesion_activa = SesionActividad.objects.filter(
                usuario=usuario, fecha_hora_fin__isnull=True).last()
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

        ultima_session = SesionActividad.objects.filter(
            usuario=usuario).order_by('-fecha_hora_inicio').first()
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

        sesiones = SesionActividad.objects.filter(
            usuario=usuario).order_by('-fecha_hora_inicio')
        serializer = self.get_serializer(sesiones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# Vistas para las métricas
class MetricaCaminataViewSet(viewsets.ModelViewSet):
    queryset = MetricaCaminata.objects.all()
    serializer_class = MetricaCaminataSerializer
    # permission_classes = [IsAuthenticated]


class MetricaCorazonViewSet(viewsets.ModelViewSet):
    queryset = MetricaCorazon.objects.all()
    serializer_class = MetricaCorazonSerializer
    # permission_classes = [IsAuthenticated]


@api_view(['GET'])
def ultimas_metricas_corazon(request):
    """
    Obtener las últimas 10 métricas de corazón
    """
    try:
        # Obtener las últimas 10 métricas, ordenadas por fecha y hora más recientes
        metricas = MetricaCorazon.objects.all().order_by(
            '-fecha', '-hora')[:10]

        # Formatear datos para el frontend
        data = []
        for metrica in metricas:
            data.append({
                'id': metrica.id,
                'fecha': metrica.fecha.strftime('%Y-%m-%d') if metrica.fecha else None,
                'hora': metrica.hora.strftime('%H:%M:%S') if metrica.hora else None,
                'ritmo_cardiaco': metrica.ritmo_cardiaco,
                'presion': metrica.presion,
                'oxigenacion': float(metrica.oxigenacion),
                'sesion': metrica.sesion.id if metrica.sesion else None
            })

        return Response(data)

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def ultimas_metricas_caminata(request):
    """
    Obtener las últimas 10 métricas de caminata
    """
    try:
        # Obtener las últimas 10 métricas, ordenadas por las más recientes
        metricas = MetricaCaminata.objects.all().order_by('-id')[:10]

        # Formatear datos para el frontend
        data = []
        for metrica in metricas:
            data.append({
                'id': metrica.id,
                'km_recorridos': float(metrica.km_recorridos),
                'pasos': metrica.pasos,
                'tiempo_actividad': str(metrica.tiempo_actividad),
                'velocidad_promedio': float(metrica.velocidad_promedio),
                'calorias_quemadas': float(metrica.calorias_quemadas),
                'sesion': metrica.sesion.id if metrica.sesion else None,
                'timestamp': metrica.sesion.fecha_hora_inicio.isoformat() if metrica.sesion and metrica.sesion.fecha_hora_inicio else None
            })

        return Response(data)

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def resumen_metricas(request):
    """
    Obtener resumen de todas las métricas (totales)
    """
    try:
        # Totales de caminata (todos los registros, no solo últimos 10)
        total_caminata = MetricaCaminata.objects.all().aggregate(
            total_pasos=Sum('pasos'),
            total_km=Sum('km_recorridos'),
            total_calorias=Sum('calorias_quemadas'),
            promedio_velocidad=Avg('velocidad_promedio')
        )

        # Estadísticas de corazón (todos los registros)
        total_corazon = MetricaCorazon.objects.all().aggregate(
            promedio_ritmo=Avg('ritmo_cardiaco'),
            promedio_oxigenacion=Avg('oxigenacion'),
            max_ritmo=Max('ritmo_cardiaco'),
            min_ritmo=Min('ritmo_cardiaco')
        )

        # Obtener última métrica de cada tipo
        ultima_caminata = MetricaCaminata.objects.last()
        ultima_corazon = MetricaCorazon.objects.last()

        resumen = {
            'caminata': {
                'total_pasos': total_caminata['total_pasos'] or 0,
                'total_km': float(total_caminata['total_km'] or 0),
                'total_calorias': float(total_caminata['total_calorias'] or 0),
                'promedio_velocidad': float(total_caminata['promedio_velocidad'] or 0),
                'ultimos_pasos': ultima_caminata.pasos if ultima_caminata else 0,
                'ultimos_km': float(ultima_caminata.km_recorridos) if ultima_caminata else 0,
                'ultimas_calorias': float(ultima_caminata.calorias_quemadas) if ultima_caminata else 0
            },
            'corazon': {
                'promedio_ritmo': float(total_corazon['promedio_ritmo'] or 0),
                'promedio_oxigenacion': float(total_corazon['promedio_oxigenacion'] or 0),
                'max_ritmo': total_corazon['max_ritmo'] or 0,
                'min_ritmo': total_corazon['min_ritmo'] or 0,
                'ultimo_ritmo': ultima_corazon.ritmo_cardiaco if ultima_corazon else 0,
                'ultima_oxigenacion': float(ultima_corazon.oxigenacion) if ultima_corazon else 0
            },
            'timestamp': datetime.now().isoformat()
        }

        return Response(resumen)

    except Exception as e:
        return Response({'error': str(e)}, status=500)
