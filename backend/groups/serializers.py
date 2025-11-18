from rest_framework import serializers
from .models import Grupo, UsuarioGrupo
from users.models import Usuario

class GrupoSerializer(serializers.ModelSerializer):
    creador_nombre = serializers.CharField(source='creador.nombre', read_only=True)
    es_creador = serializers.SerializerMethodField()
    mi_rol = serializers.SerializerMethodField()
    user_email = serializers.EmailField(write_only=True, required=False)  # ← Agregado
    
    class Meta:
        model = Grupo
        fields = [
            'id', 'creador', 'creador_nombre', 'nombre', 'descripcion', 
            'fecha_creacion', 'es_creador', 'mi_rol', 'user_email'  # ← Agregado
        ]
        read_only_fields = ['creador', 'fecha_creacion']

    def get_es_creador(self, obj):
        request = self.context.get('request')
        if request:
            user_email = request.data.get('user_email') or request.query_params.get('user_email')
            if user_email:
                try:
                    usuario = Usuario.objects.get(correo=user_email)
                    return obj.creador == usuario
                except Usuario.DoesNotExist:
                    return False
        return False

    def get_mi_rol(self, obj):
        request = self.context.get('request')
        if request:
            user_email = request.data.get('user_email') or request.query_params.get('user_email')
            if user_email:
                try:
                    usuario = Usuario.objects.get(correo=user_email)
                    usuario_grupo = UsuarioGrupo.objects.get(usuario=usuario, grupo=obj)
                    return usuario_grupo.rol
                except (Usuario.DoesNotExist, UsuarioGrupo.DoesNotExist):
                    return None
        return None

    def create(self, validated_data):
        # user_email se maneja en la view, no necesitamos request.user aquí
        return super().create(validated_data)

class UsuarioGrupoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    usuario_correo = serializers.CharField(source='usuario.correo', read_only=True)
    
    class Meta:
        model = UsuarioGrupo
        fields = ['id', 'usuario', 'usuario_nombre', 'usuario_correo', 'grupo', 'rol', 'aceptado']
        read_only_fields = ['usuario', 'grupo']

# Los demás serializers se mantienen igual...
class InvitarMultiplesUsuariosSerializer(serializers.Serializer):
    usuarios_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="Lista de IDs de usuarios a invitar"
    )
    rol = serializers.CharField(default='Miembro')
    user_email = serializers.EmailField(write_only=True, required=False)  # ← Agregado

class EmptySerializer(serializers.Serializer):
    """Serializer vacío para endpoints que no requieren datos."""
    user_email = serializers.EmailField(write_only=True, required=False)  # ← Agregado

class TransferOwnershipSerializer(serializers.Serializer):
    """Serializer para transferir la propiedad de un grupo."""
    nuevo_creador_id = serializers.IntegerField(help_text="ID del nuevo creador del grupo")
    user_email = serializers.EmailField(write_only=True, required=False)  # ← Agregado
    
class ProgramarActividadSerializer(serializers.Serializer):
    ruta_id = serializers.IntegerField()
    fecha_actividad = serializers.DateTimeField()
    descripcion = serializers.CharField(required=False, allow_blank=True)
    user_email = serializers.EmailField(write_only=True, required=False)  # ← Agregado