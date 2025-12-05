from rest_framework import serializers
from .models import Usuario, TipoUsuario, Review, TipoAlerta, Alerta, UsuarioAlerta, Salud, Condicion, UsuarioCondicion, ContactoEmergencia, HorarioRetorno, UsuarioCondicion

class TipoUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoUsuario
        fields = '__all__'

class UserRegisterSerializer(serializers.ModelSerializer):
    contrasena = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'correo', 'contrasena', 'edad', 'tipo_usuario']

    def create(self, validated_data):
        contrasena = validated_data.pop('contrasena')
        user = Usuario.objects.create(**validated_data)
        user.set_password(contrasena)
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'correo', 'edad', 'fecha_registro', 'picture', 'tipo_usuario']
        read_only_fields = ['id', 'fecha_registro', 'tipo_usuario']  # Campos que no se pueden modificar
        
    def update(self, instance, validated_data):
        instance.edad = validated_data.get('edad', instance.edad)
        instance.nombre = validated_data.get('nombre', instance.nombre)
        instance.save()
        # Validar que no se intente modificar el correo (opcional)
        if 'correo' in validated_data and validated_data['correo'] != instance.correo:
            raise serializers.ValidationError({"correo": "No puedes cambiar tu correo electrónico"})
        
        return super().update(instance, validated_data)

class LoginSerializer(serializers.ModelSerializer):
    correo = serializers.EmailField()
    contrasena = serializers.CharField(write_only=True)
    class Meta:
        model = Usuario
        fields = ['correo', 'contrasena']

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'ruta', 'puntuacion', 'comentario', 'estado', 'fecha']
        read_only_fields = ['fecha']
    
class ContactoEmergenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactoEmergencia
        fields = "__all__"
        # read_only_fields = ['usuario']

class HorarioRetornoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioRetorno
        fields = ['id', 'cita', 'contacto', 'hora_inicio', 'hora_retorno', 'enviado']
        read_only_fields = ['id', 'enviado']

class TipoAlertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoAlerta
        fields = "__all__"


class AlertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alerta
        fields = "__all__"


class UsuarioAlertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsuarioAlerta
        fields = "__all__"

class SaludSerializer(serializers.ModelSerializer):
    class Meta:
        model = Salud
        fields = ['id', 'usuario', 'peso', 'altura', 'detalle']
       # read_only_fields = ['usuario']  # el usuario se asigna automáticamente


class CondicionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Condicion
        fields = ['id', 'nombre', 'descripcion']


class UsuarioCondicionSerializer(serializers.ModelSerializer):
    # GET
    usuario_id = serializers.IntegerField(source='usuario.id', read_only=True)
    condicion_id = serializers.IntegerField(source='condicion.id', read_only=True)

    # POST
    user_email = serializers.EmailField(write_only=True)
    condicion = serializers.PrimaryKeyRelatedField(
        queryset=Condicion.objects.all(),
        write_only=True
    )

    class Meta:
        model = UsuarioCondicion
        fields = ['id', 'user_email', 'usuario_id', 'condicion_id', 'condicion']

    def create(self, validated_data):
        user_email = validated_data.pop('user_email')
        condicion = validated_data.pop('condicion')

        try:
            usuario = Usuario.objects.get(correo=user_email)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError({"error": "Usuario no encontrado"})

        return UsuarioCondicion.objects.create(
            usuario=usuario,
            condicion=condicion
        )
