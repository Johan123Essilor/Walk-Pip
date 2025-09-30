from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class TipoUsuario(models.Model):
    ID = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=20)
    nivel = models.IntegerField()
    descripcion = models.CharField(max_length=128)

    def __str__(self):
        return self.nombre


class ContactoEmergencia(models.Model):
    ID_usuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    correo = models.CharField(max_length=50)
    telefono = models.CharField(max_length=20)

    def __str__(self):
        return self.nombre




class Usuario(AbstractUser):
    telefono = models.CharField(max_length=20, blank=True, null=True)
    edad = models.IntegerField(blank=True, null=True)
    tipo_usuario = models.ForeignKey("TipoUsuario", on_delete=models.CASCADE, null=True)
    contacto = models.ForeignKey("ContactoEmergencia", on_delete=models.CASCADE, null=True)

    email = models.EmailField(unique=True)  # ✅ correo único

    USERNAME_FIELD = "email"   # ahora se loguea con email
    REQUIRED_FIELDS = ["username"]  # Django aún pedirá username si lo dejas

    def __str__(self):
        return self.email

class TipoAlerta(models.Model):
    ID = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    descripcion = models.CharField(max_length=128)
    importancia = models.CharField(max_length=50)

    def __str__(self):
        return self.nombre


class UsuarioAlerta(models.Model):
    ID = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    alerta = models.ForeignKey(TipoAlerta, on_delete=models.CASCADE)
    fecha_hora = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.usuario} - {self.alerta}"


class SaludUsuario(models.Model):
    ID = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    peso = models.FloatField()
    condicion = models.IntegerField()
    altura = models.FloatField()
    imc = models.FloatField()

    def __str__(self):
        return f"{self.usuario} {self.imc}"


class Mapa(models.Model):
    ID = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    archivo = models.FileField(upload_to='archivos/')

    def __str__(self):
        return self.nombre


class Ruta(models.Model):
    ID = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    descripcion = models.CharField(max_length=200)
    nivel_experiencia = models.CharField(max_length=100)
    lat = models.FloatField()
    lon = models.FloatField()
    mapa = models.ForeignKey(Mapa, on_delete=models.CASCADE)

    def __str__(self):
        return self.nombre




class Cita(models.Model):
    ID = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE)
    fecha_visita = models.DateTimeField()
    hora_retorno = models.DateTimeField()
    clima = models.CharField(max_length=200)
    recomendaciones = models.TextField()
    compania = models.CharField(max_length=100)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.ruta} {self.fecha_visita}"


class SessionActividad(models.Model):
    ID = models.AutoField(primary_key=True)
    cita = models.ForeignKey(Cita, on_delete=models.CASCADE, null=True, blank=True)  # opcional si quieres
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    fecha_hora_inicio = models.DateTimeField(auto_now_add=True)
    fecha_hora_fin = models.DateTimeField(null=True, blank=True)  # ahora sí puede guardarse al terminar
    ubicacion_inicial = models.FloatField()
    ubicacion_final = models.FloatField()
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.usuario} {self.ruta}"



class MetricaCaminata(models.Model):
    ID = models.AutoField(primary_key=True)
    km_recorridos = models.CharField(max_length=50)
    pasos = models.IntegerField()
    tiempo_actividad = models.CharField(max_length=50)
    velocidad_promedio = models.CharField(max_length=50)
    calorias_quemadas = models.CharField(max_length=50)
    session = models.ForeignKey(Usuario, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.km_recorridos} {self.calorias_quemadas}"


class MetricaCorazon(models.Model):
    ID = models.AutoField(primary_key=True)
    session = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    ritmo_cardiaco = models.FloatField()
    presion = models.FloatField()
    oxigenacion = models.FloatField()
    fecha_hora = models.DateTimeField()
