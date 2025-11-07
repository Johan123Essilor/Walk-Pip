import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'APIREEST.settings')
django.setup()

from users.models import TipoUsuario, Usuario

def create_initial_data():
    # Crear tipos de usuario
    tipos_data = [
        {'nombre': 'admin', 'descripcion': 'Administrador del sistema'},
        {'nombre': 'usuario', 'descripcion': 'Usuario regular'},
        {'nombre': 'guia', 'descripcion': 'Guía de rutas'},
    ]
    
    for tipo_data in tipos_data:
        tipo, created = TipoUsuario.objects.get_or_create(
            nombre=tipo_data['nombre'],
            defaults={'descripcion': tipo_data['descripcion']}
        )
        if created:
            print(f"✅ Tipo de usuario creado: {tipo.nombre}")
    
    # Crear superusuario
    tipo_admin = TipoUsuario.objects.get(nombre='admin')
    usuario, created = Usuario.objects.get_or_create(
        correo='walkpip@gmail.com',
        defaults={
            'nombre': 'walkpip',
            'tipo_usuario': tipo_admin,
            'is_staff': True,
            'is_superuser': True
        }
    )
    
    if created:
        usuario.set_password('UnaContraseñaSegura123!')
        usuario.save()
        print(f"✅ Superusuario creado: {usuario.correo}")
    else:
        print(f"ℹ️  Superusuario ya existe: {usuario.correo}")

if __name__ == '__main__':
    create_initial_data()