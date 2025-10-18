from rest_framework import serializers
from .models import Usuario, TipoUsuario, ContactoEmergencia, Cita, SessionActividad, MetricaCaminata, MetricaCorazon

class ContactoEmergenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactoEmergencia
        fields = ['ID_usuario', 'nombre', 'correo', 'telefono']


class MetricaCaminataSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricaCaminata
        fields = '__all__'

class MetricaCorazonSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricaCorazon
        fields = '__all__'

class ToggleSessionSerializer(serializers.Serializer):
    activo = serializers.BooleanField(required=True)

class SessionStatusSerializer(serializers.Serializer):
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

class UsuarioSerializer(serializers.ModelSerializer):
    tipo_usuario = serializers.PrimaryKeyRelatedField(queryset=TipoUsuario.objects.all(), required=False)
    contacto = ContactoEmergenciaSerializer(required=False)

    # Definir campos explícitamente para que Swagger los muestre
    username = serializers.CharField(required=True, max_length=150)
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=30)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    telefono = serializers.CharField(required=False, allow_blank=True, max_length=20)
    edad = serializers.IntegerField(required=False, allow_null=True, min_value=0, max_value=150)
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'},
        min_length=1
    )
    session_activa = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = Usuario
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'telefono', 'edad', 'password', 'tipo_usuario', 'contacto','session_activa']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        contacto_data = validated_data.pop('contacto', None)
        contacto = None
        if contacto_data:
            contacto = ContactoEmergencia.objects.create(**contacto_data)

        password = validated_data.pop('password')
        usuario = Usuario(**validated_data, contacto=contacto)
        usuario.set_password(password)
        usuario.save()
        return usuario

class CitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cita
        fields = '__all__'
        read_only_fields = ['usuario', 'creado_en']

class SessionActividadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionActividad
        fields = '__all__'
        extra_kwargs = {
            "fecha_hora_fin": {"required": False, "allow_null": True},
            "ubicacion_inicial": {"required": False, "allow_null": True},
            "ubicacion_final": {"required": False, "allow_null": True},
            "ruta": {"required": False, "allow_null": True},
            "cita": {"required": False, "allow_null": True},
        }
