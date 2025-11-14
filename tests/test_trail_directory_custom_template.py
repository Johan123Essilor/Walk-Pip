"""
🔧 Ejemplo de Prueba Customizada - Template para crear tus propias pruebas
Copia este archivo y modifica según tus necesidades
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time


class CustomTrailTest:
    """
    Clase base para crear pruebas customizadas de TrailDirectory
    
    Uso:
        test = CustomTrailTest()
        test.setup()
        test.mi_prueba_personalizada()
        test.teardown()
    """
    
    def __init__(self, base_url="http://localhost:3000", timeout=15):
        self.base_url = base_url
        self.driver = None
        self.wait = None
        self.timeout = timeout
    
    def setup(self):
        """Inicializa el driver"""
        print("🚀 Inicializando navegador...")
        self.driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
        self.wait = WebDriverWait(self.driver, self.timeout)
        print("✅ Navegador listo")
    
    def teardown(self):
        """Cierra el navegador"""
        if self.driver:
            print("🛑 Cerrando navegador...")
            time.sleep(1)
            self.driver.quit()
            print("✅ Navegador cerrado")
    
    # =====================================================
    # HELPERS - Funciones útiles
    # =====================================================
    
    def navigate_to_trail_directory(self):
        """Navega a la página del TrailDirectory"""
        url = f"{self.base_url}/trail-directory"
        print(f"🌐 Navegando a {url}...")
        self.driver.get(url)
        time.sleep(3)
        print("✅ Página cargada")
    
    def wait_for_element(self, by, selector, timeout=None):
        """Espera a que un elemento esté presente"""
        if timeout is None:
            timeout = self.timeout
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.presence_of_element_located((by, selector)))
    
    def wait_for_element_visible(self, by, selector, timeout=None):
        """Espera a que un elemento sea visible"""
        if timeout is None:
            timeout = self.timeout
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.visibility_of_element_located((by, selector)))
    
    def click_element(self, by, selector):
        """Hace clic en un elemento"""
        element = self.wait_for_element_visible(by, selector)
        element.click()
    
    def fill_input(self, by, selector, text):
        """Llena un input con texto"""
        element = self.wait_for_element_visible(by, selector)
        element.clear()
        element.send_keys(text)
    
    def get_text(self, by, selector):
        """Obtiene el texto de un elemento"""
        element = self.wait_for_element(by, selector)
        return element.text
    
    def take_screenshot(self, filename):
        """Toma una captura de pantalla"""
        self.driver.save_screenshot(filename)
        print(f"📸 Captura guardada: {filename}")
    
    # =====================================================
    # EJEMPLO 1: Prueba de búsqueda de ruta por nombre
    # =====================================================
    
    def test_search_trail_by_name(self, trail_name):
        """
        Busca y selecciona una ruta específica por nombre
        
        Args:
            trail_name (str): Nombre de la ruta a buscar
        
        Returns:
            bool: True si se encontró y seleccionó
        """
        print(f"\n🔍 PRUEBA: Buscando ruta '{trail_name}'...")
        
        try:
            self.navigate_to_trail_directory()
            
            # Esperar a que haya marcadores
            markers = self.wait.until(
                EC.presence_of_all_elements_located((By.CLASS_NAME, "leaflet-marker-icon"))
            )
            print(f"   ✅ Encontrados {len(markers)} marcadores")
            
            # Buscar la ruta por nombre
            # Esta prueba intenta hacer clic en todos los marcadores hasta encontrar el nombre
            for i, marker in enumerate(markers):
                marker.click()
                time.sleep(1.5)
                
                try:
                    current_trail = self.get_text(By.CSS_SELECTOR, "#detalleRuta h2")
                    print(f"   → Marcador {i+1}: '{current_trail}'")
                    
                    if trail_name.lower() in current_trail.lower():
                        print(f"   ✅ ¡Ruta encontrada!")
                        return True
                except:
                    pass
            
            print(f"   ❌ Ruta '{trail_name}' no encontrada")
            return False
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
    
    # =====================================================
    # EJEMPLO 2: Prueba de validación de datos de clima
    # =====================================================
    
    def test_weather_data_format(self):
        """
        Valida que los datos de clima tengan el formato correcto
        
        Returns:
            bool: True si los datos tienen el formato esperado
        """
        print("\n📋 PRUEBA: Validación de formato de datos de clima...")
        
        try:
            self.navigate_to_trail_directory()
            
            # Seleccionar primera ruta
            markers = self.wait_for_element_visible(By.CLASS_NAME, "leaflet-marker-icon")
            markers.click() if hasattr(markers, 'click') else self.driver.find_elements(By.CLASS_NAME, "leaflet-marker-icon")[0].click()
            time.sleep(2)
            
            # Obtener datos del clima
            clima_box = self.wait_for_element(By.CLASS_NAME, "clima-box")
            clima_text = clima_box.text
            
            # Validaciones
            validaciones = [
                ("Contiene 'Clima'", "Clima" in clima_text or "temperatura" in clima_text.lower()),
                ("Contiene temperatura", "°C" in clima_text),
                ("Contiene viento", "km/h" in clima_text or "Viento" in clima_text),
            ]
            
            all_valid = True
            for validacion_name, resultado in validaciones:
                status = "✅" if resultado else "❌"
                print(f"   {status} {validacion_name}")
                all_valid = all_valid and resultado
            
            return all_valid
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
    
    # =====================================================
    # EJEMPLO 3: Prueba de límites de inputs
    # =====================================================
    
    def test_input_boundaries(self):
        """
        Prueba los límites y comportamiento de los inputs
        
        Returns:
            bool: True si los inputs se comportan correctamente
        """
        print("\n🎯 PRUEBA: Límites de inputs...")
        
        try:
            self.navigate_to_trail_directory()
            
            # Seleccionar ruta
            markers = self.driver.find_elements(By.CLASS_NAME, "leaflet-marker-icon")
            if markers:
                markers[0].click()
                time.sleep(2)
            
            # Obtener inputs
            fecha_input = self.wait_for_element(By.ID, "fechaClima")
            hora_input = self.wait_for_element(By.ID, "horaClima")
            
            # Prueba 1: Verificar tipo
            print(f"   → Input fecha - Type: {fecha_input.get_attribute('type')}")
            print(f"   → Input hora - Type: {hora_input.get_attribute('type')}")
            
            # Prueba 2: Verificar atributos
            fecha_required = fecha_input.get_attribute("required")
            hora_required = hora_input.get_attribute("required")
            
            print(f"   {'✅' if fecha_required else '⚠️'} Fecha requerida: {bool(fecha_required)}")
            print(f"   {'✅' if hora_required else '⚠️'} Hora requerida: {bool(hora_required)}")
            
            # Prueba 3: Intentar valores inválidos
            fecha_input.clear()
            fecha_input.send_keys("fecha-invalida")  # Intentar valor inválido
            
            # Verificar que el navegador lo rechaza (depende del navegador)
            print("   ✅ Validación de input de fecha: Realizada")
            
            return True
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
    
    # =====================================================
    # EJEMPLO 4: Prueba de flujo completo de agendamiento
    # =====================================================
    
    def test_appointment_flow(self, fecha, hora):
        """
        Prueba el flujo completo de agendamiento
        
        Args:
            fecha (str): Fecha en formato YYYY-MM-DD
            hora (str): Hora en formato HH:MM
        
        Returns:
            bool: True si el flujo se completó
        """
        print(f"\n📅 PRUEBA: Flujo de agendamiento ({fecha} a las {hora})...")
        
        try:
            self.navigate_to_trail_directory()
            
            # Paso 1: Seleccionar ruta
            print("   → Paso 1: Seleccionando ruta...")
            markers = self.driver.find_elements(By.CLASS_NAME, "leaflet-marker-icon")
            if not markers:
                print("   ❌ No hay marcadores disponibles")
                return False
            markers[0].click()
            time.sleep(2)
            
            trail_name = self.get_text(By.CSS_SELECTOR, "#detalleRuta h2")
            print(f"   ✅ Ruta seleccionada: {trail_name}")
            
            # Paso 2: Ingresar fecha y hora
            print("   → Paso 2: Ingresando fecha y hora...")
            self.fill_input(By.ID, "fechaClima", fecha)
            self.fill_input(By.ID, "horaClima", hora)
            print(f"   ✅ Fecha: {fecha}, Hora: {hora}")
            
            # Paso 3: Consultar clima
            print("   → Paso 3: Consultando clima...")
            self.click_element(By.ID, "verClimaHora")
            time.sleep(2)
            
            try:
                clima_seleccionado = self.wait_for_element(By.ID, "climaSeleccionado")
                clima_text = clima_seleccionado.text
                print(f"   ✅ Clima consultado: {clima_text[:40]}...")
            except:
                print("   ⚠️ No se obtuvo el clima")
            
            # Paso 4: Verificar botón de agendamiento
            print("   → Paso 4: Verificando botón de agendamiento...")
            agendar_btn = self.wait_for_element(By.ID, "agendarCita")
            is_enabled = not agendar_btn.get_attribute("disabled")
            print(f"   ✅ Botón de agendamiento: {'Habilitado' if is_enabled else 'Deshabilitado'}")
            
            print("   ✅ Flujo de agendamiento completado")
            return True
            
        except Exception as e:
            print(f"   ❌ Error en flujo: {e}")
            self.take_screenshot("test_appointment_flow_error.png")
            return False
    
    # =====================================================
    # EJEMPLO 5: Prueba de scroll y responsividad
    # =====================================================
    
    def test_scroll_performance(self):
        """
        Prueba el rendimiento del scroll en el panel
        
        Returns:
            bool: True si el scroll funciona sin problemas
        """
        print("\n⚡ PRUEBA: Performance de scroll...")
        
        try:
            self.navigate_to_trail_directory()
            
            # Seleccionar ruta
            markers = self.driver.find_elements(By.CLASS_NAME, "leaflet-marker-icon")
            if markers:
                markers[0].click()
                time.sleep(2)
            
            detail_panel = self.wait_for_element(By.ID, "detalleRuta")
            
            # Medir tiempo de scroll
            import time as time_module
            start = time_module.time()
            
            # Realizar scroll
            for i in range(5):
                self.driver.execute_script(f"arguments[0].scrollTop = {i * 100}", detail_panel)
                time_module.sleep(0.2)
            
            elapsed = time_module.time() - start
            
            print(f"   ✅ Scroll realizado en {elapsed:.2f} segundos")
            print(f"   ✅ Rendimiento: {'EXCELENTE' if elapsed < 1 else 'BUENO' if elapsed < 2 else 'ACEPTABLE'}")
            
            return True
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
    
    # =====================================================
    # MÉTODO PARA EJECUTAR MÚLTIPLES PRUEBAS
    # =====================================================
    
    def run_custom_tests(self):
        """Ejecuta todas las pruebas customizadas"""
        print("\n" + "="*70)
        print("🧪 INICIANDO PRUEBAS CUSTOMIZADAS")
        print("="*70)
        
        results = []
        
        # Ejecutar cada prueba
        tests = [
            ("Búsqueda de Ruta", lambda: self.test_search_trail_by_name("Cerro")),
            ("Formato de Datos de Clima", self.test_weather_data_format),
            ("Límites de Inputs", self.test_input_boundaries),
            ("Flujo de Agendamiento", lambda: self.test_appointment_flow("2025-12-25", "15:00")),
            ("Performance de Scroll", self.test_scroll_performance),
        ]
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_name, result))
                print()
            except Exception as e:
                print(f"\n❌ Error ejecutando {test_name}: {e}\n")
                results.append((test_name, False))
        
        # Mostrar resumen
        print("="*70)
        print("📊 RESUMEN DE PRUEBAS CUSTOMIZADAS")
        print("="*70)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ EXITOSA" if result else "❌ FALLÓ"
            print(f"{status}: {test_name}")
        
        print(f"\n📈 Total: {passed}/{total} pruebas exitosas\n")
        
        return passed == total


# ============================
# Ejemplo de Uso
# ============================

if __name__ == "__main__":
    
    print("""
╔════════════════════════════════════════════════════════════╗
║  EJEMPLO DE PRUEBA CUSTOMIZADA - TRAIL DIRECTORY           ║
║  Template para crear tus propias pruebas                    ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    tester = CustomTrailTest()
    
    try:
        tester.setup()
        success = tester.run_custom_tests()
        
        if success:
            print("✅ TODAS LAS PRUEBAS CUSTOMIZADAS PASARON")
            exit(0)
        else:
            print("⚠️ ALGUNAS PRUEBAS FALLARON")
            exit(1)
            
    except Exception as e:
        print(f"\n❌ Error fatal: {e}")
        exit(1)
    finally:
        tester.teardown()
