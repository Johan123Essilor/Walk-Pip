from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny  # ← Cambiado
from django.db.models import Q
from .models import Grupo, UsuarioGrupo
from .serializers import (
    GrupoSerializer, UsuarioGrupoSerializer, ProgramarActividadSerializer, 
    InvitarMultiplesUsuariosSerializer, EmptySerializer, TransferOwnershipSerializer
)
from users.models import Usuario


class GrupoViewSet(viewsets.ModelViewSet):
    """
    ViewSet principal para la gestión de grupos e interacciones entre usuarios.
    """
    serializer_class = GrupoSerializer
    permission_classes = [AllowAny]  # ← Cambiado

    # --------------------------
    # SERIALIZADOR DINÁMICO
    # --------------------------
    def get_serializer_class(self):
        """
        Permite usar un serializer distinto según la acción.
        """
        if self.action in ['invite_multiple']:
            return InvitarMultiplesUsuariosSerializer
        elif self.action in ['members', 'pending_invitations', 'group_pending_invitations']:
            return UsuarioGrupoSerializer
        elif self.action in ['schedule_activity']:
            return ProgramarActividadSerializer
        elif self.action in ['accept_invitation', 'join', 'leave']:
            return EmptySerializer
        elif self.action == 'transfer_ownership':
            return TransferOwnershipSerializer
        return GrupoSerializer

    # --------------------------
    # QUERYSET BASE
    # --------------------------
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Grupo.objects.none()
        
        user_email = self.request.data.get('user_email') or self.request.query_params.get('user_email')
        if not user_email:
            return Grupo.objects.none()

        try:
            usuario = Usuario.objects.get(correo=user_email)
            # Usuario puede ver grupos donde es miembro o creador
            return Grupo.objects.filter(
                Q(creador=usuario) |
                Q(usuariogrupo__usuario=usuario)
            ).distinct()
        except Usuario.DoesNotExist:
            return Grupo.objects.none()

    # --------------------------
    # OBTENER USUARIO POR EMAIL
    # --------------------------
    def get_usuario_from_request(self):
        """Obtiene el usuario basado en user_email"""
        user_email = self.request.data.get('user_email') or self.request.query_params.get('user_email')
        if not user_email:
            return None
        try:
            return Usuario.objects.get(correo=user_email)
        except Usuario.DoesNotExist:
            return None

    # --------------------------
    # CREACIÓN DE GRUPO
    # --------------------------
    def perform_create(self, serializer):
        usuario = self.get_usuario_from_request()
        if not usuario:
            raise ValidationError({"error": "user_email es requerido"})
        
        grupo = serializer.save(creador=usuario)
        # El creador se agrega automáticamente como administrador
        UsuarioGrupo.objects.create(
            usuario=usuario,
            grupo=grupo,
            rol='Creador',
            aceptado=True
        )

    # --------------------------
    # ACTUALIZAR / ELIMINAR
    # --------------------------
    def update(self, request, *args, **kwargs):
        usuario = self.get_usuario_from_request()
        if not usuario:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        instance = self.get_object()
        if instance.creador != usuario:
            return Response(
                {'error': 'Solo el creador del grupo puede actualizarlo'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        usuario = self.get_usuario_from_request()
        if not usuario:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        instance = self.get_object()
        if instance.creador != usuario:
            return Response(
                {'error': 'Solo el creador del grupo puede eliminarlo'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    # --------------------------
    # ENDPOINTS PERSONALIZADOS
    # --------------------------

    @action(detail=False, methods=['post'])
    def all(self, request):
        """Listar grupos del usuario"""
        usuario = self.get_usuario_from_request()
        if not usuario:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        grupos = Grupo.objects.filter(
            Q(creador=usuario) | Q(usuariogrupo__usuario=usuario)
        ).distinct()
        
        serializer = self.get_serializer(grupos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='invite-multiple')
    def invite_multiple(self, request, pk=None):
        """
        Invitar múltiples usuarios al grupo.
        """
        usuario = self.get_usuario_from_request()
        if not usuario:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        grupo = self.get_object()

        # Solo administradores o creadores pueden invitar
        if not UsuarioGrupo.objects.filter(
            usuario=usuario, grupo=grupo, rol__in=['Administrador', 'Creador']
        ).exists():
            return Response(
                {'error': 'Solo los administradores pueden invitar usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuarios_ids = serializer.validated_data['usuarios_ids']
        rol = serializer.validated_data['rol']

        resultados = {
            'invitados_exitosos': [],
            'ya_eran_miembros': [],
            'usuarios_no_encontrados': []
        }

        for usuario_id in usuarios_ids:
            try:
                usuario_invitado = Usuario.objects.get(id=usuario_id)

                if UsuarioGrupo.objects.filter(usuario=usuario_invitado, grupo=grupo).exists():
                    resultados['ya_eran_miembros'].append(usuario_id)
                    continue

                UsuarioGrupo.objects.create(
                    usuario=usuario_invitado,
                    grupo=grupo,
                    rol=rol,
                    aceptado=False
                )

                resultados['invitados_exitosos'].append({
                    'id': usuario_invitado.id,
                    'nombre': usuario_invitado.nombre,
                    'correo': usuario_invitado.correo
                })

            except Usuario.DoesNotExist:
                resultados['usuarios_no_encontrados'].append(usuario_id)

        return Response(resultados)

    @action(detail=True, methods=['post'])
    def members(self, request, pk=None):
        """Obtener miembros aceptados de un grupo"""
        grupo = self.get_object()
        miembros = UsuarioGrupo.objects.filter(grupo=grupo, aceptado=True)
        serializer = UsuarioGrupoSerializer(miembros, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def schedule_activity(self, request, pk=None):
        """Programar una actividad grupal"""
        usuario = self.get_usuario_from_request()
        if not usuario:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        grupo = self.get_object()

        if not UsuarioGrupo.objects.filter(
            usuario=usuario, grupo=grupo, aceptado=True
        ).exists():
            return Response(
                {'error': 'Debes ser miembro del grupo para programar actividades'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        return Response({
            'mensaje': 'Actividad programada exitosamente',
            'grupo': grupo.nombre,
            'datos': serializer.validated_data
        })

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Abandonar grupo"""
        usuario = self.get_usuario_from_request()
        if not usuario:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        grupo = self.get_object()
        try:
            usuario_grupo = UsuarioGrupo.objects.get(usuario=usuario, grupo=grupo)
            if grupo.creador == usuario:
                return Response(
                    {'error': 'El creador no puede abandonar el grupo.'},
                    status=400
                )
            usuario_grupo.delete()
            return Response({'mensaje': 'Has abandonado el grupo'})
        except UsuarioGrupo.DoesNotExist:
            return Response({'error': 'No eres miembro de este grupo'}, status=400)

    @action(detail=True, methods=['post'])
    def accept_invitation(self, request, pk=None):
        """Aceptar invitación a grupo"""
        usuario = self.get_usuario_from_request()
        if not usuario:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        grupo = self.get_object()
        try:
            usuario_grupo = UsuarioGrupo.objects.get(
                usuario=usuario, grupo=grupo, aceptado=False
            )
            usuario_grupo.aceptado = True
            usuario_grupo.save()
            return Response({'mensaje': 'Invitación aceptada exitosamente'})
        except UsuarioGrupo.DoesNotExist:
            return Response({'error': 'No tienes invitación pendiente'}, status=404)

    @action(detail=False, methods=['post'])
    def pending_invitations(self, request):
        """Invitaciones pendientes del usuario"""
        usuario = self.get_usuario_from_request()
        if not usuario:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        invitaciones = UsuarioGrupo.objects.filter(usuario=usuario, aceptado=False)
        serializer = UsuarioGrupoSerializer(invitaciones, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def group_pending_invitations(self, request, pk=None):
        """Invitaciones pendientes de un grupo (solo administradores)"""
        usuario = self.get_usuario_from_request()
        if not usuario:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        grupo = self.get_object()
        if not UsuarioGrupo.objects.filter(
            usuario=usuario, grupo=grupo, rol__in=['Administrador', 'Creador']
        ).exists():
            return Response(
                {'error': 'No tienes permisos para ver las invitaciones'},
                status=403
            )

        invitaciones = UsuarioGrupo.objects.filter(grupo=grupo, aceptado=False)
        serializer = UsuarioGrupoSerializer(invitaciones, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def search_users(self, request):
        """Buscar usuarios (para invitar o mostrar)"""
        usuario = self.get_usuario_from_request()
        if not usuario:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        q = request.data.get('q', '')
        exclude_group = request.data.get('exclude_group')

        if not q:
            return Response({'error': 'Parámetro q requerido'}, status=400)

        usuarios = Usuario.objects.filter(
            Q(nombre__icontains=q) | Q(correo__icontains=q)
        ).exclude(id=usuario.id)

        if exclude_group:
            miembros_ids = UsuarioGrupo.objects.filter(
                grupo_id=exclude_group
            ).values_list('usuario_id', flat=True)
            usuarios = usuarios.exclude(id__in=miembros_ids)

        data = [
            {
                'id': u.id,
                'nombre': u.nombre,
                'correo': u.correo,
                'tipo_usuario': u.tipo_usuario.nombre if u.tipo_usuario else None
            }
            for u in usuarios[:10]
        ]
        return Response(data)

    @action(detail=True, methods=['post'])
    def transfer_ownership(self, request, pk=None):
        """Transferir propiedad del grupo"""
        usuario = self.get_usuario_from_request()
        if not usuario:
            return Response(
                {"error": "user_email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        grupo = self.get_object()
        if grupo.creador != usuario:
            return Response({'error': 'Solo el creador puede transferir'}, status=403)

        nuevo_id = request.data.get('nuevo_creador_id')
        if not nuevo_id:
            return Response({'error': 'nuevo_creador_id es requerido'}, status=400)

        try:
            nuevo_creador = Usuario.objects.get(id=nuevo_id)
            rel = UsuarioGrupo.objects.get(usuario=nuevo_creador, grupo=grupo)

            grupo.creador = nuevo_creador
            grupo.save()

            rel.rol = 'Creador'
            rel.save()

            antiguo = UsuarioGrupo.objects.get(usuario=usuario, grupo=grupo)
            antiguo.rol = 'Administrador'
            antiguo.save()

            return Response({'mensaje': 'Propiedad transferida exitosamente'})
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)
        except UsuarioGrupo.DoesNotExist:
            return Response({'error': 'El usuario no pertenece al grupo'}, status=400)