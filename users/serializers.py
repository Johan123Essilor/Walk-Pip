from rest_framework import serializers
from .models import Usuario, TipoUsuario, Review, TipoAlerta, Alerta, UsuarioAlerta

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
    tipo_usuario = TipoUsuarioSerializer(read_only=True)

    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'correo', 'edad', 'fecha_registro', 'tipo_usuario']

class LoginSerializer(serializers.ModelSerializer):
    correo = serializers.EmailField()
    contrasena = serializers.CharField(write_only=True)
    class Meta:
        model = Usuario
        fields = ['correo', 'contrasena']

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = "__all__"


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

