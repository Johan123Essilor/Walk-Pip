from rest_framework import serializers
from .models import Grupo, UsuarioGrupo
from users.models import Usuario

class GrupoSerializer(serializers.ModelSerializer):
    creador_nombre = serializers.CharField(source='creador.nombre', read_only=True)
    es_creador = serializers.SerializerMethodField()
    mi_rol = serializers.SerializerMethodField()
    
    class Meta:
        model = Grupo
        fields = [
            'id', 'creador', 'creador_nombre', 'nombre', 'descripcion', 
            'fecha_creacion', 'es_creador', 'mi_rol'
        ]
        read_only_fields = ['creador', 'fecha_creacion']

    def get_es_creador(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.creador == request.user
        return False

    def get_mi_rol(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                usuario_grupo = UsuarioGrupo.objects.get(usuario=request.user, grupo=obj)
                return usuario_grupo.rol
            except UsuarioGrupo.DoesNotExist:
                return None
        return None

    def create(self, validated_data):
        validated_data['creador'] = self.context['request'].user
        return super().create(validated_data)

class UsuarioGrupoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    usuario_correo = serializers.CharField(source='usuario.correo', read_only=True)
    
    class Meta:
        model = UsuarioGrupo
        fields = ['id', 'usuario', 'usuario_nombre', 'usuario_correo', 'grupo', 'rol', 'aceptado']
        read_only_fields = ['usuario', 'grupo']

class InvitarUsuarioSerializer(serializers.Serializer):
    usuarios_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="Lista de IDs de usuarios a invitar"
    )
    rol = serializers.CharField(default='Miembro')

# Serializer para múltiples usuarios
class InvitarMultiplesUsuariosSerializer(serializers.Serializer):
    usuarios_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="Lista de IDs de usuarios a invitar"
    )
    rol = serializers.CharField(default='Miembro')

class ProgramarActividadSerializer(serializers.Serializer):
    ruta_id = serializers.IntegerField()
    fecha_actividad = serializers.DateTimeField()
    descripcion = serializers.CharField(required=False, allow_blank=True)