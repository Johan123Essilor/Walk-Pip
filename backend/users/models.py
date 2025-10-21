from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from trail.models import Ruta
from django.conf import settings

class TipoUsuario(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)
    nivel = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'tipo_usuario'

    def __str__(self):
        return self.nombre

class CustomUserManager(BaseUserManager):
    def create_user(self, correo, nombre, contrasena=None, **extra_fields):
        if not correo:
            raise ValueError("El usuario debe tener un correo electrónico")
        correo = self.normalize_email(correo)
        user = self.model(correo=correo, nombre=nombre, **extra_fields)
        user.set_password(contrasena)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, nombre, contrasena=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(correo, nombre, contrasena, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
    nombre = models.CharField(max_length=100)
    correo = models.EmailField(unique=True)
    edad = models.IntegerField(null=True, blank=True)
    session_activa = models.BooleanField(default= False)
    fecha_registro = models.DateField(auto_now_add=True)
    tipo_usuario = models.ForeignKey(TipoUsuario, on_delete=models.SET_NULL, null=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "correo"
    REQUIRED_FIELDS = ["nombre"]

    objects = CustomUserManager()

    class Meta:
        db_table = 'usuario'

    def __str__(self):
        return self.correo

class Salud(models.Model):
    usuario = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    peso = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    altura = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    detalle = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'salud'

class Condicion(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'condicion'

class UsuarioCondicion(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    condicion = models.ForeignKey(Condicion, on_delete=models.CASCADE)

    class Meta:
        db_table = 'usuario_condicion'

class Review(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE)
    puntuacion = models.IntegerField()
    comentario = models.TextField(null=True, blank=True)
    fecha = models.DateField(auto_now_add=True)
    estado = models.CharField(max_length=50)

    class Meta:
        db_table = 'review'

class TipoAlerta(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'tipo_alerta'

class Alerta(models.Model):
    tipo_alerta = models.ForeignKey(TipoAlerta, on_delete=models.SET_NULL, null=True)
    mensaje = models.TextField()
    importancia = models.CharField(max_length=50)

    class Meta:
        db_table = 'alerta'

class UsuarioAlerta(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    alerta = models.ForeignKey(Alerta, on_delete=models.CASCADE)
    fecha_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuario_alerta'