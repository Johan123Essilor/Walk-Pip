from django.contrib import admin
from .models import Mapa, Ruta, HistorialUsuarioRuta, Cita, InvitacionCita

@admin.register(Mapa)
class MapaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'archivo')
    list_filter = ('nombre',)
    search_fields = ('nombre',)
    ordering = ('nombre',)

@admin.register(Ruta)
class RutaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion', 'nivel_experiencia', 'lat', 'lon', 'mapa')
    list_filter = ('nivel_experiencia', 'mapa')
    search_fields = ('nombre', 'descripcion', 'nivel_experiencia')
    ordering = ('nombre',)
    raw_id_fields = ('mapa',)

@admin.register(HistorialUsuarioRuta)
class HistorialUsuarioRutaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'ruta', 'fecha', 'tiempo_duracion', 'resultado', 'satisfaccion')
    list_filter = ('fecha', 'resultado', 'satisfaccion')
    search_fields = ('usuario__email', 'ruta__nombre', 'resultado')
    ordering = ('-fecha',)
    raw_id_fields = ('usuario', 'ruta')
    date_hierarchy = 'fecha'

@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'ruta', 'compania', 'fecha_visita', 'clima', 'creado_en')
    list_filter = ('fecha_visita', 'creado_en', 'clima')
    search_fields = ('usuario__email', 'ruta__nombre', 'clima', 'recomendaciones')
    ordering = ('-fecha_visita',)
    raw_id_fields = ('usuario', 'ruta', 'compania')
    date_hierarchy = 'fecha_visita'
    # REMOVED: filter_horizontal = ('invitados',)  # Esto causa el error

@admin.register(InvitacionCita)
class InvitacionCitaAdmin(admin.ModelAdmin):
    list_display = ('cita', 'invitado', 'estado', 'fecha_invitacion', 'fecha_respuesta')
    list_filter = ('estado', 'fecha_invitacion', 'fecha_respuesta')
    search_fields = ('cita__ruta__nombre', 'invitado__email')
    ordering = ('-fecha_invitacion',)
    raw_id_fields = ('cita', 'invitado')
    date_hierarchy = 'fecha_invitacion'