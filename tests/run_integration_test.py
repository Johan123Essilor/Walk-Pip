#!/usr/bin/env python3
"""
🚀 Script ejecutor para pruebas de integración de TrailDirectory
Facilita la ejecución con validaciones previas
"""

import subprocess
import sys
import os
from pathlib import Path


def check_python_version():
    """Verifica que Python >= 3.8"""
    if sys.version_info < (3, 8):
        print("❌ Se requiere Python 3.8 o superior")
        print(f"   Versión actual: {sys.version}")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} - OK")
    return True


def check_dependencies():
    """Verifica que selenium y webdriver-manager están instalados"""
    try:
        import selenium
        print(f"✅ Selenium {selenium.__version__} - OK")
    except ImportError:
        print("❌ Selenium no está instalado")
        print("   Instala con: pip install selenium")
        return False
    
    try:
        import webdriver_manager
        print(f"✅ WebDriver Manager - OK")
    except ImportError:
        print("❌ WebDriver Manager no está instalado")
        print("   Instala con: pip install webdriver-manager")
        return False
    
    return True


def check_services():
    """Verifica que backend y frontend estén disponibles"""
    import socket
    
    services = [
        ("Backend", "localhost", 8000),
        ("Frontend", "localhost", 3000),
    ]
    
    all_running = True
    for name, host, port in services:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            print(f"✅ {name} ({host}:{port}) - OK")
        else:
            print(f"⚠️ {name} ({host}:{port}) - NO DISPONIBLE")
            all_running = False
    
    return all_running


def run_test():
    """Ejecuta la prueba de integración"""
    test_file = Path(__file__).parent / "test_trail_directory_integration.py"
    
    if not test_file.exists():
        print(f"❌ Archivo de prueba no encontrado: {test_file}")
        return False
    
    print(f"\n🧪 Ejecutando prueba: {test_file.name}\n")
    print("=" * 70)
    
    try:
        result = subprocess.run(
            [sys.executable, str(test_file)],
            cwd=test_file.parent
        )
        
        print("=" * 70)
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ Error ejecutando la prueba: {e}")
        return False


def main():
    print("\n" + "=" * 70)
    print("🧪 VALIDADOR DE PRUEBAS - TRAIL DIRECTORY")
    print("=" * 70 + "\n")
    
    # Verificaciones previas
    print("📋 VERIFICACIONES PREVIAS:\n")
    
    if not check_python_version():
        sys.exit(1)
    
    if not check_dependencies():
        sys.exit(1)
    
    print("\n🔍 VERIFICANDO SERVICIOS:\n")
    
    services_ok = check_services()
    if not services_ok:
        print("\n⚠️ ADVERTENCIA: Algunos servicios no están disponibles")
        print("   Asegúrate de que:")
        print("   - Backend: python manage.py runserver (desde carpeta backend)")
        print("   - Frontend: npm start (desde carpeta Front)")
        
        response = input("\n¿Deseas continuar de todas formas? (s/n): ").strip().lower()
        if response != 's':
            print("❌ Prueba cancelada")
            sys.exit(0)
    
    # Ejecutar prueba
    if run_test():
        print("\n✅ PRUEBAS COMPLETADAS EXITOSAMENTE")
        sys.exit(0)
    else:
        print("\n❌ PRUEBAS FALLARON")
        sys.exit(1)


if __name__ == "__main__":
    main()
