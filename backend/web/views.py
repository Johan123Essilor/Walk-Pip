from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import Usuario
from django.contrib.auth.hashers import check_password

# Página del formulario
def login_page(request):
    return render(request, 'web/login.html')

def registro_page(request):
    return render(request, 'web/registro.html')

def main_page(request):
    return render(request, 'web/mainweb.html')
def pulsaciones_page(request):
    return render(request, 'web/pulsaciones.html')


# API de login
class LoginView(APIView):
    def post(self, request):
        correo = request.data.get('correo')
        contrasena = request.data.get('contrasena')

        try:
            usuario = Usuario.objects.get(correo=correo)
        except Usuario.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if check_password(contrasena, usuario.contrasena):
            return Response({
                "message": "Login exitoso",
                "usuario_id": usuario.ID_usuario,
                "nombre": usuario.nombre,
                "apellido": usuario.apellido
            })
        else:
            return Response({"error": "Contraseña incorrecta"}, status=status.HTTP_400_BAD_REQUEST)
