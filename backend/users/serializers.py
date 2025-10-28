from rest_framework import serializers
from .models import Usuario, TipoUsuario, Review, TipoAlerta, Alerta, UsuarioAlerta, Salud, Condicion, UsuarioCondicion, ContactoEmergencia, HorarioRetorno

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
        read_only_fields = ['id', 'fecha_registro', 'tipo_usuario']  # Estos no se pueden modificar

    def update(self, instance, validated_data):
        # Lógica personalizada si necesitas manejar algo específico
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
        fields = ['usuario', 'ruta', 'puntuacion', 'comentario', 'fecha', 'estado']
        read_only_fields = ['usuario', 'fecha']  # usuario se asigna automáticamente

    def create(self, validated_data):
        # Asignar automáticamente el usuario logueado
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)
    
class ContactoEmergenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactoEmergencia
        fields = "__all__"
        read_only_fields = ['usuario']  # El usuario se asigna automáticamente

    def create(self, validated_data):
        # Asegurar que el usuario se asigne desde el contexto
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)

class HorarioRetornoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioRetorno
        fields = "__all__"
        read_only_fields = ['usuario']  # El usuario se asigna automáticamente

    def create(self, validated_data):
        # Asegurar que el usuario se asigne desde el contexto
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)

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
        read_only_fields = ['usuario']  # el usuario se asigna automáticamente


class CondicionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Condicion
        fields = ['id', 'nombre', 'descripcion']


class UsuarioCondicionSerializer(serializers.ModelSerializer):
    condicion_id = serializers.PrimaryKeyRelatedField(
        queryset=Condicion.objects.all(), source='condicion', write_only=True
    )

    class Meta:
        model = UsuarioCondicion
        fields = ['id', 'usuario', 'condicion_id']
        read_only_fields = ['usuario']

