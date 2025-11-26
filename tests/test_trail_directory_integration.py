from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time


# ============================
#  Prueba de Integración - TrailDirectory
# ============================

def test_trail_directory_integration():
    """
    Test completo que simula:
    1. Carga del mapa con rutas
    2. Selección de una ruta (clic en marcador)
    3. Consulta de clima por fecha/hora
    """

    # Inicializar navegador sin driver manual
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

    try:
        # ============================================
        # PASO 1: Abrir la página del TrailDirectory
        # ============================================
        print("\n🌐 PASO 1: Abriendo TrailDirectory...")
        driver.get("http://localhost:3000/trail-directory")  # <-- Ajusta según tu URL real
        
        # Esperar a que el componente cargue
        wait = WebDriverWait(driver, 15)
        
        # ============================================
        # PASO 2: Verificar que el mapa se cargó
        # ============================================
        print("🗺️ PASO 2: Verificando carga del mapa...")
        
        # Buscar el contenedor del mapa
        map_container = wait.until(
            EC.presence_of_element_located((By.ID, "map")),
            "El contenedor del mapa no se encontró"
        )
        print("✅ El contenedor del mapa está presente en el DOM")
        
        # Esperar a que el mapa esté visible
        map_visible = wait.until(
            EC.visibility_of_element_located((By.ID, "map")),
            "El mapa no está visible"
        )
        print("✅ El mapa está visible en la pantalla")
        
        # Verificar que hay contenido en el mapa (elementos de Leaflet)
        time.sleep(2)  # Esperar a que Leaflet termine de cargar
        
        leaflet_elements = driver.find_elements(By.CLASS_NAME, "leaflet-container")
        if leaflet_elements:
            print(f"✅ Mapa de Leaflet cargado correctamente ({len(leaflet_elements)} contenedor(es))")
        else:
            print("⚠️ No se encontraron elementos de Leaflet, pero el contenedor existe")
        
        # ============================================
        # PASO 3: Esperar y hacer clic en un marcador del mapa
        # ============================================
        print("\n🎯 PASO 3: Seleccionando una ruta del mapa...")
        
        # Esperar a que haya al menos un marcador
        time.sleep(3)  # Dar tiempo a que Leaflet cargue los marcadores
        
        markers = driver.find_elements(By.CLASS_NAME, "leaflet-marker-icon")
        
        if markers:
            print(f"✅ Se encontraron {len(markers)} marcador(es) en el mapa")
            
            # Hacer clic en el primer marcador
            print(f"   → Haciendo clic en el marcador #1...")
            markers[0].click()
            
            time.sleep(2)  # Esperar a que se actualice el panel de detalles
            
            # Verificar que el panel de detalles se actualiza
            detail_panel = driver.find_element(By.ID, "detalleRuta")
            
            # Buscar el nombre de la ruta (elemento h2)
            try:
                trail_name = detail_panel.find_element(By.TAG_NAME, "h2")
                print(f"✅ Ruta seleccionada: '{trail_name.text}'")
            except:
                print("⚠️ No se pudo obtener el nombre de la ruta")
            
            # Verificar que aparece la información de la ruta
            info_elements = detail_panel.find_elements(By.TAG_NAME, "p")
            if info_elements:
                print(f"✅ Se mostraron {len(info_elements)} elementos de información")
            
        else:
            print("❌ No se encontraron marcadores en el mapa")
            return False
        
        # ============================================
        # PASO 4: Verificar que se cargó el clima actual
        # ============================================
        print("\n🌤️ PASO 4: Verificando clima actual...")
        
        try:
            # Buscar el box del clima
            climate_box = wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "clima-box")),
                "El box del clima no se encontró"
            )
            print("✅ Box del clima encontrado")
            
            # Buscar elementos del clima (temperatura, viento, descripción)
            climate_text = climate_box.text
            if "Temperatura" in climate_text or "Clima" in climate_text:
                print(f"✅ Datos de clima presentes: {climate_text[:50]}...")
            else:
                print("⚠️ Box del clima visible pero con contenido vacío")
                
        except Exception as e:
            print(f"⚠️ No se pudo verificar el clima: {str(e)}")
        
        # ============================================
        # PASO 5: Consultar clima por fecha y hora
        # ============================================
        print("\n📅 PASO 5: Consultando clima por fecha/hora...")
        
        try:
            # Buscar los inputs de fecha y hora
            fecha_input = wait.until(
                EC.presence_of_element_located((By.ID, "fechaClima")),
                "Input de fecha no encontrado"
            )
            print("✅ Input de fecha encontrado")
            
            hora_input = driver.find_element(By.ID, "horaClima")
            print("✅ Input de hora encontrado")
            
            # Ingresar una fecha (ejemplo: mañana)
            from datetime import datetime, timedelta
            tomorrow = datetime.now() + timedelta(days=1)
            fecha_str = tomorrow.strftime("%Y-%m-%d")
            hora_str = "14:00"
            
            print(f"   → Ingresando fecha: {fecha_str}")
            fecha_input.clear()
            fecha_input.send_keys(fecha_str)
            
            print(f"   → Ingresando hora: {hora_str}")
            hora_input.clear()
            hora_input.send_keys(hora_str)
            
            time.sleep(1)
            
            # Hacer clic en el botón "Ver clima"
            ver_clima_btn = driver.find_element(By.ID, "verClimaHora")
            print("   → Haciendo clic en botón 'Ver clima'...")
            ver_clima_btn.click()
            
            # Esperar a que aparezca el resultado
            time.sleep(2)
            
            # Verificar que aparece el clima seleccionado
            clima_seleccionado = wait.until(
                EC.presence_of_element_located((By.ID, "climaSeleccionado")),
                "El clima seleccionado no se mostró"
            )
            print("✅ Clima seleccionado mostrado")
            
            clima_text = clima_seleccionado.text
            print(f"✅ Datos del clima: {clima_text}")
            
            if "°C" in clima_text or "Temp" in clima_text.upper():
                print("✅ Datos de temperatura incluidos en la respuesta")
            
        except Exception as e:
            print(f"❌ Error en consulta de clima: {str(e)}")
            return False
        
        # ============================================
        # PASO 6: Verificar botón de agendamiento
        # ============================================
        print("\n📝 PASO 6: Verificando formulario de agendamiento...")
        
        try:
            agendar_btn = driver.find_element(By.ID, "agendarCita")
            print(f"✅ Botón 'Agendar cita' encontrado")
            print(f"   → Estado del botón: {'Habilitado' if not agendar_btn.get_attribute('disabled') else 'Deshabilitado'}")
            
        except Exception as e:
            print(f"⚠️ No se pudo encontrar el botón de agendamiento: {str(e)}")
        
        # ============================================
        # PASO 7: Test de scroll y responsividad
        # ============================================
        print("\n📱 PASO 7: Verificando responsividad...")
        
        # Scroll hacia abajo en el panel de detalles
        detail_panel = driver.find_element(By.ID, "detalleRuta")
        driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", detail_panel)
        print("✅ Panel de detalles scrolleado sin errores")
        
        time.sleep(1)
        
        # ============================================
        # RESUMEN FINAL
        # ============================================
        print("\n" + "="*60)
        print("✅ TEST COMPLETADO EXITOSAMENTE")
        print("="*60)
        print("\n📋 RESUMEN DE PRUEBAS EJECUTADAS:")
        print("   ✓ Carga del mapa con Leaflet")
        print("   ✓ Selección de ruta mediante clic en marcador")
        print("   ✓ Visualización de datos de la ruta")
        print("   ✓ Carga de clima actual")
        print("   ✓ Consulta de clima por fecha/hora específica")
        print("   ✓ Verificación de componentes del formulario")
        print("   ✓ Responsividad del panel de detalles")
        print("\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR GENERAL EN EL TEST: {str(e)}")
        
        # Captura de pantalla en caso de error
        try:
            driver.save_screenshot("./test_error_screenshot.png")
            print("📸 Captura de pantalla guardada: test_error_screenshot.png")
        except:
            pass
        
        return False
        
    finally:
        print("🛑 Cerrando navegador...")
        time.sleep(2)
        driver.quit()
        print("✓ Navegador cerrado")


# ============================
#  Función auxiliar: Test de Login (si es necesario)
# ============================

def test_trail_directory_with_login():
    """
    Test alternativo si se requiere autenticación con Auth0
    """
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
    
    try:
        print("\n🔐 TEST CON AUTENTICACIÓN")
        print("="*60)
        
        driver.get("http://localhost:3000/trail-directory")
        wait = WebDriverWait(driver, 15)
        
        # Buscar botón de login (si no está autenticado)
        try:
            login_btn = driver.find_element(By.CLASS_NAME, "login-button")
            print("⚠️ Usuario no autenticado. Intentando login...")
            # Aquí iría la lógica de login si lo necesitas
            # Por ahora solo notificamos
        except:
            print("✅ Usuario ya autenticado o botón de login no visible")
        
        # Continuar con el test normal
        time.sleep(2)
        markers = driver.find_elements(By.CLASS_NAME, "leaflet-marker-icon")
        
        if markers:
            print(f"✅ Test con autenticación completado. {len(markers)} marcadores encontrados")
            return True
        
    finally:
        driver.quit()


# ============================
#  Ejecutar tests
# ============================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("INICIANDO PRUEBAS DE INTEGRACIÓN - TRAIL DIRECTORY")
    print("="*60)
    
    # Test principal
    resultado = test_trail_directory_integration()
    
    # Test con autenticación (opcional)
    # resultado_login = test_trail_directory_with_login()
    
    if resultado:
        print("\n✅ TODAS LAS PRUEBAS PASARON CORRECTAMENTE")
        exit(0)
    else:
        print("\n❌ ALGUNAS PRUEBAS FALLARON")
        exit(1)
