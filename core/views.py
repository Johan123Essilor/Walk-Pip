from rest_framework.response import Response
from rest_framework import status, viewsets, generics
from .models import Cita, Usuario, SessionActividad
from .serializers import CitaSerializer, UsuarioSerializer, SessionActividadSerializer
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import action
from django.utils.timezone import now
# Registro
class RegistroUsuarioView(generics.CreateAPIView):
    serializer_class = UsuarioSerializer


@method_decorator(csrf_exempt, name='dispatch')
class LoginUsuarioView(APIView):
    def post(self, request):
        correo = request.data.get("email")      # coincide con tu HTML
        contrasena = request.data.get("password")

        usuario = authenticate(request, username=correo, password=contrasena)
        if usuario is not None:
            login(request, usuario)
            return Response({"message": "Login exitoso", "usuario_id": usuario.id})
        else:
            return Response({"error": "Credenciales inválidas"}, status=status.HTTP_400_BAD_REQUEST)

# Citas
class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.all()
    serializer_class = CitaSerializer

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)
from rest_framework.decorators import action

from django.utils.timezone import now
class SessionActividadViewSet(viewsets.ModelViewSet):
    queryset = SessionActividad.objects.all()
    serializer_class = SessionActividadSerializer

    @action(detail=True, methods=['patch'], url_path='terminar')
    def terminar_sesion(self, request, pk=None):
        session = self.get_object()
        session.fecha_hora_fin = now()
        session.save()
        return Response(SessionActividadSerializer(session).data, status=status.HTTP_200_OK)
