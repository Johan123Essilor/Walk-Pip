from rest_framework import serializers
from .models import Grupo, UsuarioGrupo


class GrupoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grupo
        fields = "__all__"


class UsuarioGrupoSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsuarioGrupo
        fields = "__all__"

