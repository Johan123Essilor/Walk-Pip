from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Cita, HistorialUsuarioRuta, ContactoEmergencia, HorarioRetorno
from .serializers import CitaSerializer, HistorialUsuarioRutaSerializer, ContactoEmergenciaSerializer, HorarioRetornoSerializer

class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.all()
    serializer_class = CitaSerializer

    # GET /agendar/usuario/<id_usuario>/
    @action(detail=False, methods=['get'], url_path='usuario/(?P<usuario_id>[^/.]+)')
    def citas_por_usuario(self, request, usuario_id=None):
        """
        Devuelve todas las citas de un usuario específico.
        """
        citas = Cita.objects.filter(usuario_id=usuario_id)
        serializer = self.get_serializer(citas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

     # PUT /agendar/actualizar/<id_usuario>/
    @action(detail=False, methods=['put'], url_path='usuario/actualizar/(?P<usuario_id>[^/.]+)')
    def actualizar_por_usuario(self, request, usuario_id=None):
        """
        Actualiza la cita de un usuario por su ID de usuario.
        Si el usuario tiene varias citas, se actualizará la más reciente.
        """
        try:
            cita = Cita.objects.filter(usuario_id=usuario_id).latest('creado_en')
        except Cita.DoesNotExist:
            return Response({'error': 'No se encontró ninguna cita para este usuario.'},
                            status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(cita, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)

class HistorialUsuarioRutaViewSet(viewsets.ModelViewSet):  
    queryset = HistorialUsuarioRuta.objects.all()
    serializer_class = HistorialUsuarioRutaSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()

class ContactoEmergenciaViewSet(viewsets.ModelViewSet):
    queryset = ContactoEmergencia.objects.all()
    serializer_class = ContactoEmergenciaSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()

class HorarioRetornoViewSet(viewsets.ModelViewSet):
    queryset = HorarioRetorno.objects.all()
    serializer_class = HorarioRetornoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()