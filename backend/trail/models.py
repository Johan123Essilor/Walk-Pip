from django.db import models
from django.conf import settings
from groups.models import Grupo

class Mapa(models.Model):
    nombre = models.CharField(max_length=50)
    archivo = models.FileField(upload_to='../archivos/', null=True, blank=True)

    class Meta:
        db_table = 'mapa'

class Ruta(models.Model):
    nombre = models.CharField(max_length=50)
    descripcion = models.CharField(max_length=200)
    nivel_experiencia = models.CharField(max_length=100)
    lat = models.FloatField()
    lon = models.FloatField()
    mapa = models.ForeignKey(Mapa, on_delete=models.CASCADE)

    class Meta:
        db_table = 'ruta'

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
    compania = models.ForeignKey('groups.Grupo', on_delete=models.SET_NULL, null=True, blank=True)  # ✅ Ya existe
    fecha_visita = models.DateTimeField()
    clima = models.CharField(max_length=200)
    recomendaciones = models.TextField()
    creado_en = models.DateTimeField(auto_now_add=True)
    
    # ✅ Añadir campo para invitados individuales
    invitados = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        through='InvitacionCita', 
        related_name='citas_invitado',
        blank=True
    )

    class Meta:
        db_table = 'cita'

    def __str__(self):
        return f"{self.usuario} - {self.ruta}"

class InvitacionCita(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('aceptada', 'Aceptada'),
        ('rechazada', 'Rechazada'),
    ]
    
    cita = models.ForeignKey(Cita, on_delete=models.CASCADE)
    invitado = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    fecha_invitacion = models.DateTimeField(auto_now_add=True)
    fecha_respuesta = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'invitacion_cita'
        unique_together = ['cita', 'invitado']

