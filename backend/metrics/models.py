from django.db import models
from users.models import Usuario
from django.conf import settings
from trail.models import Ruta, Cita

class SesionActividad(models.Model):
    cita = models.ForeignKey(Cita, on_delete=models.CASCADE, null=True, blank=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    fecha_hora_inicio = models.DateTimeField(auto_now_add=True)
    fecha_hora_fin = models.DateTimeField(null=True, blank=True)
    ubicacion_inicial = models.FloatField(null=True, blank=True)
    ubicacion_final = models.FloatField(null=True, blank=True)
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        db_table = 'sesion_actividad'

    def __str__(self):
        return f"Sesión de {self.usuario} ({self.ruta})"

class MetricaCaminata(models.Model):
    sesion = models.ForeignKey(SesionActividad, on_delete=models.CASCADE)
    km_recorridos = models.DecimalField(max_digits=6, decimal_places=2)
    pasos = models.IntegerField()
    tiempo_actividad = models.DurationField()
    velocidad_promedio = models.DecimalField(max_digits=5, decimal_places=2)
    calorias_quemadas = models.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        db_table = 'metrica_caminata'

    def __str__(self):
        return f"{self.session.usuario} - {self.km_recorridos} km"

class MetricaCorazon(models.Model):
    sesion = models.ForeignKey(SesionActividad, on_delete=models.CASCADE)
    ritmo_cardiaco = models.IntegerField()
    presion = models.CharField(max_length=50)
    oxigenacion = models.DecimalField(max_digits=5, decimal_places=2)
    fecha = models.DateField()
    hora = models.TimeField()

    class Meta:
        db_table = 'metrica_corazon'

    def __str__(self):
        return f"{self.session.usuario} - {self.ritmo_cardiaco} bpm"

