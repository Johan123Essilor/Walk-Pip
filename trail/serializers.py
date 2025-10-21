from rest_framework import serializers
from .models import Ruta, Mapa, HistorialUsuarioRuta, Cita, ContactoEmergencia, HorarioRetorno


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
    usuario = serializers.ReadOnlyField(source='usuario.id')

    class Meta:
        model = Cita
        fields = "__all__"

class ContactoEmergenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactoEmergencia
        fields = "__all__"


class HorarioRetornoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioRetorno
        fields = "__all__"