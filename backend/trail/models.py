from django.db import models
from django.conf import settings
from groups.models import Grupo

class Ruta(models.Model):
    nombre_ruta = models.CharField(max_length=150)
    descripcion = models.TextField(null=True, blank=True)
    nivel_experiencia = models.CharField(max_length=50)
    mapa_url = models.TextField(null=True, blank=True)
    creador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'ruta'

class Mapa(models.Model):
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE)
    archivo_mapa = models.TextField()
    disponible_offline = models.BooleanField(default=False)

    class Meta:
        db_table = 'mapa'

class HistorialUsuarioRuta(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE)
    fecha = models.DateField(auto_now_add=True)
    tiempo_duracion = models.DurationField(null=True, blank=True)
    resultado = models.CharField(max_length=50)
    satisfaccion = models.CharField(max_length=50)

    class Meta:
        db_table = 'historial_usuario_ruta'
        

class Cita(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE)
    compania = models.ForeignKey(Grupo, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_visita = models.DateTimeField()
    clima = models.CharField(max_length=200)
    recomendaciones = models.TextField()
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cita'

    def __str__(self):
        return f"{self.usuario} - {self.ruta}"
    
class ContactoEmergencia(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    nombre_contacto = models.CharField(max_length=100)
    correo = models.EmailField()
    parentesco = models.CharField(max_length=50)

    class Meta:
        db_table = 'contacto_emergencia'

class HorarioRetorno(models.Model):
    cita = models.ForeignKey(Cita, on_delete=models.CASCADE, related_name='horarios')
    contacto = models.ForeignKey(ContactoEmergencia, on_delete=models.SET_NULL, null=True)
    hora_retorno = models.TimeField()
    enviado = models.BooleanField(default=False)

    class Meta:
        db_table = 'horario_retorno'

