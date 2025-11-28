from rest_framework import serializers
from .models import Grupo, UsuarioGrupo
from users.models import Usuario

class GrupoSerializer(serializers.ModelSerializer):
    creador_nombre = serializers.CharField(source='creador.nombre', read_only=True)
    user_email = serializers.EmailField(write_only=True, required=False)
    usuarios = serializers.SerializerMethodField()

    
    class Meta:
        model = Grupo
        fields = [
            'id', 'creador', 'creador_nombre', 'nombre', 'descripcion', 
            'fecha_creacion', 'user_email', 'usuarios'
        ]
        read_only_fields = ['creador', 'fecha_creacion']

    def create(self, validated_data):
        # Remover user_email ya que no es parte del modelo Grupo
        validated_data.pop('user_email', None)
        return super().create(validated_data)
    
    def get_usuarios(self, obj):
        usuarios = UsuarioGrupo.objects.filter(grupo=obj)
        return [
            {
                "id": ug.usuario.id,
                "nombre": ug.usuario.nombre,
                "correo": ug.usuario.correo,
                "rol": ug.rol,
                "aceptado": ug.aceptado,
                "rechazado": ug.rechazado,
            }
            for ug in usuarios
        ]

class UsuarioGrupoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    usuario_correo = serializers.CharField(source='usuario.correo', read_only=True)
    
    #  NUEVOS CAMPOS: Información del grupo y creador
    grupo_nombre = serializers.CharField(source='grupo.nombre', read_only=True)
    grupo_descripcion = serializers.CharField(source='grupo.descripcion', read_only=True)
    creador_nombre = serializers.CharField(source='grupo.creador.nombre', read_only=True)
    creador_correo = serializers.CharField(source='grupo.creador.correo', read_only=True)
    
    class Meta:
        model = UsuarioGrupo
        fields = [
            'id', 'usuario', 'usuario_nombre', 'usuario_correo', 
            'grupo', 'grupo_nombre', 'grupo_descripcion',
            'creador_nombre', 'creador_correo',
            'rol', 'aceptado', 'rechazado', 'fecha_invitacion'
        ]
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