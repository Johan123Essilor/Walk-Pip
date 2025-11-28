from django.db import models
from django.conf import settings

class Grupo(models.Model):
    creador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)
    fecha_creacion = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'grupo'

class UsuarioGrupo(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE)
    rol = models.CharField(max_length=50)
    aceptado = models.BooleanField(default=False)
    rechazado = models.BooleanField(default=False)  # ← NUEVO CAMPO
    fecha_invitacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuario_grupo'

