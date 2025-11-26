from rest_framework import serializers
from .models import Grupo, UsuarioGrupo
from users.models import Usuario

class GrupoSerializer(serializers.ModelSerializer):
    creador_nombre = serializers.CharField(source='creador.nombre', read_only=True)
    user_email = serializers.EmailField(write_only=True, required=False)
    
    class Meta:
        model = Grupo
        fields = [
            'id', 'creador', 'creador_nombre', 'nombre', 'descripcion', 
            'fecha_creacion', 'user_email'
        ]
        read_only_fields = ['creador', 'fecha_creacion']

    def validate(self, data):
        """Validar y limpiar los datos antes de la creación"""
        # Eliminar user_email de los datos validados ya que no es parte del modelo
        data.pop('user_email', None)
        return data

    def create(self, validated_data):
        """Crear grupo con solo los campos del modelo"""
        # Asegurar que solo se pasen los campos del modelo Grupo
        group_data = {
            'nombre': validated_data.get('nombre'),
            'descripcion': validated_data.get('descripcion', ''),
        }
        # El creador se asigna en perform_create del ViewSet
        if 'creador' in validated_data:
            group_data['creador'] = validated_data['creador']
        
        return Grupo.objects.create(**group_data)

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