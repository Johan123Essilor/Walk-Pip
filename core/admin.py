from django.contrib import admin
from .models import Ruta, Mapa

@admin.register(Mapa)
class MapaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'archivo')

@admin.register(Ruta)
class RutaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'nivel_experiencia', 'lat', 'lon', 'mapa')
    search_fields = ('nombre',)
