from rest_framework import serializers
from .models import Ruta, Mapa, HistorialUsuarioRuta, Cita


class RutaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ruta
        fields = "__all__"

class MapaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mapa
        fields = "__all__"


class HistorialUsuarioRutaSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialUsuarioRuta
        fields = "__all__"


class CitaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)
    
    class Meta:
        model = Cita
        fields = [
            'id', 'usuario', 'usuario_nombre', 'ruta', 'ruta_nombre', 
            'compania', 'fecha_visita', 'clima', 'recomendaciones', 'creado_en'
        ]
        read_only_fields = ['usuario', 'creado_en']  # usuario se asigna automáticamente

    def create(self, validated_data):
        # Asegurar que el usuario se asigne desde el contexto
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)
