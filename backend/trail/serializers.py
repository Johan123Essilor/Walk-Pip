from rest_framework import serializers
from .models import Ruta, Mapa, HistorialUsuarioRuta, Cita, InvitacionCita # ✅ Añadir InvitacionCita aquí
from users.models import Usuario  # Asegúrate de importar el modelo Usuario

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

class InvitacionCitaSerializer(serializers.ModelSerializer):
    invitado_nombre = serializers.CharField(source='invitado.nombre', read_only=True)
    invitado_email = serializers.CharField(source='invitado.correo', read_only=True)
    invitado_picture = serializers.CharField(source='invitado.picture', read_only=True)
    
    class Meta:
        model = InvitacionCita  # ✅ Ahora está definido
        fields = [
            'id', 'invitado', 'invitado_nombre', 'invitado_email', 
            'invitado_picture', 'estado', 'fecha_invitacion', 'fecha_respuesta'
        ]

class InvitarAmigosSerializer(serializers.Serializer):
    amigos_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="Lista de IDs de amigos a invitar"
    )

class InvitarGrupoSerializer(serializers.Serializer):
    grupo_id = serializers.IntegerField(help_text="ID del grupo a invitar")

class CitaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)
    grupo_nombre = serializers.CharField(source='compania.nombre', read_only=True)
    
    # ✅ Incluir invitados
    invitados = InvitacionCitaSerializer(
        many=True, 
        read_only=True, 
        source='invitacioncita_set'
    )
    
    # ✅ Campo para recibir IDs de amigos al crear
    amigos_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="Lista de IDs de amigos a invitar"
    )
    
    class Meta:
        model = Cita
        fields = [
            'id', 'usuario', 'usuario_nombre', 'ruta', 'ruta_nombre', 
            'compania', 'grupo_nombre', 'fecha_visita', 'clima', 
            'recomendaciones', 'creado_en', 'invitados', 'amigos_ids'
        ]
        read_only_fields = ['usuario', 'creado_en']

    def create(self, validated_data):
        # Extraer los IDs de amigos si vienen en la data
        amigos_ids = validated_data.pop('amigos_ids', [])
        
        # Crear la cita
        cita = super().create(validated_data)
        
        # Crear invitaciones para los amigos
        from users.models import Usuario
        
        for amigo_id in amigos_ids:
            try:
                amigo = Usuario.objects.get(id=amigo_id)
                InvitacionCita.objects.create(
                    cita=cita,
                    invitado=amigo,
                    estado='pendiente'
                )
            except Usuario.DoesNotExist:
                # Si el amigo no existe, continuar con los demás
                continue
        
        return cita
class UsuarioAmigoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario  # Asegúrate de importar el modelo Usuario
        fields = ['id', 'nombre', 'correo', 'picture']