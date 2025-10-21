from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from .models import Usuario, Review
from .serializers import UserRegisterSerializer, UserSerializer, LoginSerializer, ReviewSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": str(token.access_token),
            "refresh": str(token)
        }, status=status.HTTP_201_CREATED)

class LoginView(generics.CreateAPIView):
    serializer_class = LoginSerializer

    def post(self, request):
        correo = request.data.get("correo")
        contrasena = request.data.get("contrasena")

        user = authenticate(username=correo, password=contrasena)

        if user:
            token = RefreshToken.for_user(user)
            return Response({
                "user": UserSerializer(user).data,
                "access": str(token.access_token),
                "refresh": str(token)
            }, status=status.HTTP_200_OK)
        return Response({"detail": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)
    
class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

  # GET /reviews/usuario/<usuario_id>/
    @action(detail=False, methods=['get'], url_path='usuario/(?P<usuario_id>[^/.]+)')
    def reviews_por_usuario(self, request, usuario_id=None):
        """
        Devuelve todas las reseñas de un usuario específico.
        """
        # Verificar que el usuario solo pueda ver sus propias reseñas
        if int(usuario_id) != request.user.id:
            return Response(
                {'error': 'No tienes permiso para ver las reseñas de otro usuario.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reviews = Review.objects.filter(usuario_id=usuario_id)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # PUT /reviews/usuario/actualizar/<usuario_id>/
    @action(detail=False, methods=['put'], url_path='usuario/actualizar/(?P<usuario_id>[^/.]+)')
    def actualizar_por_usuario(self, request, usuario_id=None):
        """
        Actualiza la reseña de un usuario por su ID de usuario.
        Si el usuario tiene varias reseñas, se actualizará la más reciente.
        """
        # Verificar que el usuario solo pueda actualizar sus propias reseñas
        if int(usuario_id) != request.user.id:
            return Response(
                {'error': 'No tienes permiso para actualizar las reseñas de otro usuario.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Buscar la reseña más reciente del usuario
            review = Review.objects.filter(usuario_id=usuario_id).latest('fecha')
        except Review.DoesNotExist:
            return Response(
                {'error': 'No se encontró ninguna reseña para este usuario.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)
