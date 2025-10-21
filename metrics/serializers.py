from rest_framework import serializers
from .models import SesionActividad, MetricaCaminata, MetricaCorazon

class ToggleSessionSerializer(serializers.Serializer):
    activo = serializers.BooleanField()

class SesionStatusSerializer(serializers.Serializer):
    session_activa = serializers.BooleanField()
    ultima_session = serializers.SerializerMethodField()

    def get_ultima_session(self, obj):
        session = obj.get('ultima_session', None)
        if not session:
            return None
        return {
            "id": session.id,
            "fecha_hora_inicio": session.fecha_hora_inicio,
            "fecha_hora_fin": session.fecha_hora_fin,
            "ubicacion_inicial": session.ubicacion_inicial,
            "ubicacion_final": session.ubicacion_final,
            "ruta": session.ruta.id if session.ruta else None
        }

class MetricaCaminataSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricaCaminata
        fields = "__all__"


class MetricaCorazonSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricaCorazon
        fields = "__all__"


class SesionActividadSerializer(serializers.ModelSerializer):
    metricas_caminata = MetricaCaminataSerializer(many=True, read_only=True, source='metricacaminata_set')
    metricas_corazon = MetricaCorazonSerializer(many=True, read_only=True, source='metricacorazon_set')

    class Meta:
        model = SesionActividad
        fields = [
            'id', 'usuario', 'cita', 'ruta',
            'fecha_hora_inicio', 'fecha_hora_fin',
            'ubicacion_inicial', 'ubicacion_final',
            'metricas_caminata', 'metricas_corazon'
        ]
