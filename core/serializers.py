from rest_framework import serializers
from .models import Usuario, TipoUsuario, ContactoEmergencia, Cita,SessionActividad

class ContactoEmergenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactoEmergencia
        fields = ['ID_usuario', 'nombre', 'correo', 'telefono']


class UsuarioSerializer(serializers.ModelSerializer):
    tipo_usuario = serializers.PrimaryKeyRelatedField(queryset=TipoUsuario.objects.all(), required=False)
    contacto = ContactoEmergenciaSerializer(required=False)

    class Meta:
        model = Usuario
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'telefono', 'edad', 'password', 'tipo_usuario', 'contacto']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        contacto_data = validated_data.pop('contacto', None)
        contacto = None
        if contacto_data:
            contacto = ContactoEmergencia.objects.create(**contacto_data)

        password = validated_data.pop('password')
        usuario = Usuario(**validated_data, contacto=contacto)
        usuario.set_password(password)  # 🔑 Maneja hashing seguro
        usuario.save()
        return usuario



class CitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cita
        fields = '__all__'
        read_only_fields = ['usuario', 'creado_en']


# web/serializers.py

class SessionActividadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionActividad
        fields = '__all__'
        extra_kwargs = {
            "fecha_hora_fin": {"required": False, "allow_null": True}
        }
