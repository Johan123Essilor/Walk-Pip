# views.py - VERSIÓN COMPLETA CORREGIDA
from datetime import datetime, timedelta
from django.db.models import F, ExpressionWrapper, DurationField
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.utils.timezone import now
from django.db.models import Sum, Avg, Max, Min, Count
from .models import Cita, MetricaCorazon, SesionActividad, MetricaCaminata, AlertaMonitoreo
from users.models import Usuario
from .serializers import (
    MetricaCorazonSerializer,
    ToggleSessionSerializer,
    SesionStatusSerializer,
    MetricaCaminataSerializer,
    SesionActividadSerializer
)

# ============================================================================
# FUNCIONES AUXILIARES (deben estar DEFINIDAS antes de ser usadas)
# ============================================================================


def verificar_alertas_ritmo(ultimo_ritmo, ultima_oxigenacion):
    """
    Verifica si hay condiciones para generar alertas de ritmo cardíaco y oxigenación
    """
    alertas_generadas = []

    # Umbrales para senderismo (ajusta según necesidades)
    UMBRAL_RITMO_ALTO = 160  # bpm para alerta de ritmo alto durante actividad
    UMBRAL_RITMO_ALTO_CRITICO = 180  # bpm para alerta crítica
    UMBRAL_RITMO_BAJO = 50   # bpm para alerta de ritmo bajo
    UMBRAL_OXIGENACION_BAJA = 92  # % para alerta de oxigenación baja
    UMBRAL_OXIGENACION_CRITICA = 90  # % para alerta crítica

    # Verificar si hay datos para analizar
    if ultimo_ritmo is None:
        return alertas_generadas

    # 📌 ALERTA: Ritmo cardíaco CRÍTICAMENTE ALTO
    if ultimo_ritmo > UMBRAL_RITMO_ALTO_CRITICO:
        alerta = AlertaMonitoreo.objects.create(
            tipo_alerta='ritmo_alto',
            mensaje=f"⚠️ ALERTA CRÍTICA: Ritmo cardíaco muy elevado ({ultimo_ritmo} bpm). ¡Detenga la actividad inmediatamente!",
            ritmo_cardiaco=ultimo_ritmo,
            severidad='critica'
        )
        alertas_generadas.append(alerta)

    # 📌 ALERTA: Ritmo cardíaco ALTO
    elif ultimo_ritmo > UMBRAL_RITMO_ALTO:
        alerta = AlertaMonitoreo.objects.create(
            tipo_alerta='ritmo_alto',
            mensaje=f"⚠️ Ritmo cardíaco elevado ({ultimo_ritmo} bpm). Considere disminuir el ritmo o descansar.",
            ritmo_cardiaco=ultimo_ritmo,
            severidad='alta'
        )
        alertas_generadas.append(alerta)

    # 📌 ALERTA: Ritmo cardíaco BAJO (durante actividad)
    elif ultimo_ritmo < UMBRAL_RITMO_BAJO:
        alerta = AlertaMonitoreo.objects.create(
            tipo_alerta='ritmo_bajo',
            mensaje=f"⚠️ Ritmo cardíaco bajo ({ultimo_ritmo} bpm). Verifique si hay síntomas de fatiga o deshidratación.",
            ritmo_cardiaco=ultimo_ritmo,
            severidad='media'
        )
        alertas_generadas.append(alerta)

    # 📌 ALERTA: Oxigenación CRÍTICAMENTE BAJA
    if ultima_oxigenacion and ultima_oxigenacion < UMBRAL_OXIGENACION_CRITICA:
        alerta = AlertaMonitoreo.objects.create(
            tipo_alerta='oxigenacion_baja',
            mensaje=f"🫁 ALERTA CRÍTICA: Oxigenación muy baja ({ultima_oxigenacion}%). ¡Busque aire fresco inmediatamente!",
            oxigenacion=ultima_oxigenacion,
            severidad='critica'
        )
        alertas_generadas.append(alerta)

    # 📌 ALERTA: Oxigenación BAJA
    elif ultima_oxigenacion and ultima_oxigenacion < UMBRAL_OXIGENACION_BAJA:
        alerta = AlertaMonitoreo.objects.create(
            tipo_alerta='oxigenacion_baja',
            mensaje=f"🫁 Oxigenación baja ({ultima_oxigenacion}%). Considere descansar y respirar profundamente.",
            oxigenacion=ultima_oxigenacion,
            severidad='alta'
        )
        alertas_generadas.append(alerta)

    # 📌 ALERTA INFORMATIVA: Ritmo en zona óptima para senderismo
    elif 110 <= ultimo_ritmo <= 140:
        # Solo crear alerta informativa ocasionalmente (evitar spam)
        from django.utils.timezone import now
        from datetime import timedelta

        # Verificar si ya hay una alerta similar reciente
        ultima_alerta_zona_optima = AlertaMonitoreo.objects.filter(
            tipo_alerta='info',
            mensaje__contains='zona óptima',
            fecha_hora__gte=now() - timedelta(minutes=10)
        ).exists()

        if not ultima_alerta_zona_optima:
            alerta = AlertaMonitoreo.objects.create(
                tipo_alerta='info',
                mensaje=f"✅ Ritmo cardíaco en zona óptima para senderismo ({ultimo_ritmo} bpm). ¡Buen trabajo!",
                ritmo_cardiaco=ultimo_ritmo,
                severidad='baja'
            )
            alertas_generadas.append(alerta)

    return alertas_generadas


def obtener_icono_alerta(tipo_alerta):
    iconos = {
        'ritmo_alto': '❤️‍🔥',
        'ritmo_bajo': '💙',
        'oxigenacion_baja': '🫁',
        'inactividad': '⏸️',
        'info': '✅'
    }
    return iconos.get(tipo_alerta, '🔔')


def obtener_color_severidad(severidad):
    colores = {
        'baja': 'success',
        'media': 'warning',
        'alta': 'danger',
        'critica': 'dark'
    }
    return colores.get(severidad, 'secondary')


# ============================================================================
# VIEWSETS Y VISTAS
# ============================================================================

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
        # Totales de caminata
        total_caminata = MetricaCaminata.objects.all().aggregate(
            total_pasos=Sum('pasos'),
            total_km=Sum('km_recorridos'),
            total_calorias=Sum('calorias_quemadas'),
            promedio_velocidad=Avg('velocidad_promedio')
        )

        # Estadísticas de corazón
        total_corazon = MetricaCorazon.objects.all().aggregate(
            promedio_ritmo=Avg('ritmo_cardiaco'),
            promedio_oxigenacion=Avg('oxigenacion'),
            max_ritmo=Max('ritmo_cardiaco'),
            min_ritmo=Min('ritmo_cardiaco')
        )

        # Obtener última métrica
        ultima_caminata = MetricaCaminata.objects.last()
        ultima_corazon = MetricaCorazon.objects.last()

        # Verificar alertas automáticamente
        alertas_generadas = []
        if ultima_corazon:
            alertas_generadas = verificar_alertas_ritmo(
                ultimo_ritmo=ultima_corazon.ritmo_cardiaco,
                ultima_oxigenacion=float(
                    ultima_corazon.oxigenacion) if ultima_corazon.oxigenacion else None
            )

        # Contar alertas no leídas
        alertas_no_leidas = AlertaMonitoreo.objects.filter(leida=False).count()

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
            'alertas': {
                'no_leidas': alertas_no_leidas,
                'nuevas': len(alertas_generadas)
            },
            'timestamp': datetime.now().isoformat()
        }

        return Response(resumen)

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def obtener_alertas(request):
    """
    Obtener alertas recientes (últimas 24 horas)
    """
    try:
        # Obtener alertas de las últimas 24 horas
        desde = datetime.now() - timedelta(hours=24)
        alertas = AlertaMonitoreo.objects.filter(fecha_hora__gte=desde)

        # Marcar como leídas si se especifica
        if request.GET.get('marcar_leidas') == 'true':
            alertas.update(leida=True)

        # Formatear respuesta
        data = []
        for alerta in alertas:
            data.append({
                'id': alerta.id,
                'tipo': alerta.tipo_alerta,
                'tipo_display': alerta.get_tipo_alerta_display(),
                'mensaje': alerta.mensaje,
                'ritmo': alerta.ritmo_cardiaco,
                'oxigenacion': float(alerta.oxigenacion) if alerta.oxigenacion else None,
                'severidad': alerta.severidad,
                'fecha_hora': alerta.fecha_hora.isoformat(),
                'leida': alerta.leida,
                'icono': obtener_icono_alerta(alerta.tipo_alerta),
                'color': obtener_color_severidad(alerta.severidad)
            })

        return Response({
            'alertas': data,
            'totales': {
                'no_leidas': alertas.filter(leida=False).count(),
                'totales': alertas.count()
            }
        })

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def limpiar_alertas_antiguas(request):
    """
    Limpiar alertas antiguas (más de 48 horas)
    """
    try:
        limite = datetime.now() - timedelta(hours=48)
        eliminadas = AlertaMonitoreo.objects.filter(
            fecha_hora__lt=limite).delete()

        return Response({
            'mensaje': f'Se eliminaron {eliminadas[0]} alertas antiguas',
            'eliminadas': eliminadas[0]
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def estadisticas_alertas(request):
    """
    Obtener estadísticas de alertas
    """
    try:
        desde = datetime.now() - timedelta(hours=24)
        alertas_24h = AlertaMonitoreo.objects.filter(fecha_hora__gte=desde)

        total_alertas = alertas_24h.count()

        # Alertas por tipo
        por_tipo = {}
        for tipo in AlertaMonitoreo.TIPO_ALERTA_CHOICES:
            count = alertas_24h.filter(tipo_alerta=tipo[0]).count()
            if count > 0:
                por_tipo[tipo[1]] = count

        # Alertas por severidad
        por_severidad = {}
        severidades = ['baja', 'media', 'alta', 'critica']
        for severidad in severidades:
            count = alertas_24h.filter(severidad=severidad).count()
            if count > 0:
                por_severidad[severidad] = count

        # Alertas no leídas
        no_leidas = alertas_24h.filter(leida=False).count()

        return Response({
            'total_alertas': total_alertas,
            'no_leidas': no_leidas,
            'por_tipo': por_tipo,
            'por_severidad': por_severidad,
            'periodo': '24 horas'
        })

    except Exception as e:
        return Response({'error': str(e)}, status=500)
