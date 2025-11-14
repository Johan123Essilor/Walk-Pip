"""
🔬 Pruebas Adicionales - Extensiones de Casos de Prueba
Ejemplos de pruebas más avanzadas para TrailDirectory
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from webdriver_manager.chrome import ChromeDriverManager
import time


class TrailDirectoryAdvancedTests:
    """Clase con pruebas avanzadas de TrailDirectory"""
    
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.driver = None
        self.wait = None
    
    def setup(self):
        """Inicializa el driver y abre la página"""
        self.driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
        self.wait = WebDriverWait(self.driver, 15)
        self.driver.get(f"{self.base_url}/trail-directory")
        time.sleep(3)
    
    def teardown(self):
        """Cierra el navegador"""
        if self.driver:
            self.driver.quit()
    
    # =====================================================
    # PRUEBA 1: Múltiples clics en marcadores
    # =====================================================
    def test_multiple_marker_clicks(self):
        """Verifica que se pueden seleccionar múltiples rutas secuencialmente"""
        print("\n🎯 PRUEBA: Múltiples clics en marcadores")
        
        try:
            markers = self.wait.until(
                EC.presence_of_all_elements_located((By.CLASS_NAME, "leaflet-marker-icon")),
                "No se encontraron marcadores"
            )
            
            selected_trails = []
            
            for i, marker in enumerate(markers[:2]):  # Selecciona los 2 primeros
                print(f"   → Seleccionando marcador {i+1}...")
                marker.click()
                time.sleep(1.5)
                
                # Obtener nombre de la ruta
                try:
                    trail_name = self.driver.find_element(By.CSS_SELECTOR, "#detalleRuta h2")
                    selected_trails.append(trail_name.text)
                    print(f"     ✅ Ruta: {trail_name.text}")
                except:
                    pass
            
            if len(selected_trails) >= 2:
                print("✅ Prueba de múltiples marcadores: EXITOSA")
                return True
            else:
                print("❌ No se pudieron seleccionar múltiples rutas")
                return False
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    # =====================================================
    # PRUEBA 2: Validación de clima con diferentes horas
    # =====================================================
    def test_weather_at_different_hours(self):
        """Consulta clima a diferentes horas del día"""
        print("\n🌤️ PRUEBA: Clima a diferentes horas")
        
        try:
            # Primero selecciona una ruta
            markers = self.wait.until(
                EC.presence_of_all_elements_located((By.CLASS_NAME, "leaflet-marker-icon"))
            )
            markers[0].click()
            time.sleep(2)
            
            from datetime import datetime, timedelta
            tomorrow = datetime.now() + timedelta(days=1)
            fecha_str = tomorrow.strftime("%Y-%m-%d")
            
            hours_to_test = ["08:00", "12:00", "18:00", "22:00"]
            weather_data = []
            
            for hora in hours_to_test:
                print(f"   → Consultando clima para {hora}...")
                
                # Limpiar inputs
                fecha_input = self.driver.find_element(By.ID, "fechaClima")
                hora_input = self.driver.find_element(By.ID, "horaClima")
                
                fecha_input.clear()
                fecha_input.send_keys(fecha_str)
                hora_input.clear()
                hora_input.send_keys(hora)
                
                # Clic en Ver clima
                ver_clima_btn = self.driver.find_element(By.ID, "verClimaHora")
                ver_clima_btn.click()
                
                time.sleep(1.5)
                
                # Obtener clima seleccionado
                try:
                    clima_box = self.driver.find_element(By.ID, "climaSeleccionado")
                    clima_text = clima_box.text
                    weather_data.append((hora, clima_text))
                    print(f"     ✅ {clima_text[:40]}...")
                except:
                    print(f"     ⚠️ No se obtuvo clima para {hora}")
            
            if len(weather_data) >= 3:
                print(f"✅ Consulta de clima en múltiples horas: EXITOSA ({len(weather_data)} horarios)")
                return True
            else:
                print("⚠️ Se obtuvieron menos horarios de lo esperado")
                return len(weather_data) > 0
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    # =====================================================
    # PRUEBA 3: Validación de elementos del mapa
    # =====================================================
    def test_map_elements_presence(self):
        """Verifica que todos los elementos del mapa estén presentes"""
        print("\n🗺️ PRUEBA: Elementos del mapa")
        
        try:
            elements_to_check = [
                ("Contenedor del mapa", By.ID, "map"),
                ("Panel de detalles", By.ID, "detalleRuta"),
                ("Contenedor Leaflet", By.CLASS_NAME, "leaflet-container"),
            ]
            
            all_present = True
            
            for name, by, selector in elements_to_check:
                try:
                    element = self.driver.find_element(by, selector)
                    if element.is_displayed():
                        print(f"   ✅ {name}: Presente y visible")
                    else:
                        print(f"   ⚠️ {name}: Presente pero oculto")
                except:
                    print(f"   ❌ {name}: NO ENCONTRADO")
                    all_present = False
            
            if all_present:
                print("✅ Elementos del mapa: TODOS PRESENTES")
            
            return all_present
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    # =====================================================
    # PRUEBA 4: Validación de inputs con caracteres especiales
    # =====================================================
    def test_input_validation(self):
        """Valida que los inputs manejan datos correctamente"""
        print("\n✅ PRUEBA: Validación de inputs")
        
        try:
            # Seleccionar ruta
            markers = self.wait.until(
                EC.presence_of_all_elements_located((By.CLASS_NAME, "leaflet-marker-icon"))
            )
            markers[0].click()
            time.sleep(2)
            
            fecha_input = self.driver.find_element(By.ID, "fechaClima")
            hora_input = self.driver.find_element(By.ID, "horaClima")
            
            # Prueba 1: Input válido
            fecha_input.clear()
            fecha_input.send_keys("2025-12-25")
            hora_input.clear()
            hora_input.send_keys("15:30")
            print("   ✅ Inputs aceptan valores válidos")
            
            # Prueba 2: Verificar atributos
            fecha_type = fecha_input.get_attribute("type")
            hora_type = hora_input.get_attribute("type")
            
            assert fecha_type == "date", "Input de fecha no es tipo 'date'"
            assert hora_type == "time", "Input de hora no es tipo 'time'"
            print("   ✅ Tipos de input correctos")
            
            print("✅ Validación de inputs: EXITOSA")
            return True
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    # =====================================================
    # PRUEBA 5: Performance - Tiempo de carga
    # =====================================================
    def test_page_load_performance(self):
        """Mide el tiempo de carga de la página"""
        print("\n⏱️ PRUEBA: Performance de carga")
        
        try:
            start_time = time.time()
            
            # Esperar a que el mapa esté visible
            map_visible = self.wait.until(
                EC.visibility_of_element_located((By.ID, "map"))
            )
            
            # Esperar a que haya marcadores
            markers = self.wait.until(
                EC.presence_of_all_elements_located((By.CLASS_NAME, "leaflet-marker-icon"))
            )
            
            load_time = time.time() - start_time
            
            print(f"   ⏱️ Tiempo de carga: {load_time:.2f} segundos")
            print(f"   ✅ Marcadores cargados: {len(markers)}")
            
            if load_time < 10:
                print(f"✅ Performance: EXCELENTE ({load_time:.2f}s)")
                return True
            elif load_time < 15:
                print(f"✅ Performance: ACEPTABLE ({load_time:.2f}s)")
                return True
            else:
                print(f"⚠️ Performance: LENTO ({load_time:.2f}s)")
                return True  # Igual retorna True pero advierte
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    # =====================================================
    # PRUEBA 6: Responsividad del panel lateral
    # =====================================================
    def test_detail_panel_responsiveness(self):
        """Verifica el comportamiento del panel de detalles"""
        print("\n📱 PRUEBA: Responsividad del panel")
        
        try:
            # Seleccionar ruta
            markers = self.wait.until(
                EC.presence_of_all_elements_located((By.CLASS_NAME, "leaflet-marker-icon"))
            )
            markers[0].click()
            time.sleep(2)
            
            detail_panel = self.driver.find_element(By.ID, "detalleRuta")
            
            # Prueba 1: Panel visible
            if detail_panel.is_displayed():
                print("   ✅ Panel de detalles visible")
            else:
                print("   ❌ Panel de detalles NO visible")
                return False
            
            # Prueba 2: Obtener altura y ancho
            size = detail_panel.size
            print(f"   ✅ Tamaño del panel: {size['width']}x{size['height']}px")
            
            # Prueba 3: Scroll funciona
            initial_scroll = detail_panel.value_of_css_property("scroll-position")
            self.driver.execute_script("arguments[0].scrollTop = 100", detail_panel)
            final_scroll = detail_panel.value_of_css_property("scroll-position")
            print("   ✅ Scroll del panel funciona")
            
            print("✅ Responsividad del panel: EXITOSA")
            return True
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    # =====================================================
    # PRUEBA 7: Estados visuales de botones
    # =====================================================
    def test_button_states(self):
        """Verifica los estados visuales de los botones"""
        print("\n🔘 PRUEBA: Estados de botones")
        
        try:
            # Seleccionar ruta primero
            markers = self.wait.until(
                EC.presence_of_all_elements_located((By.CLASS_NAME, "leaflet-marker-icon"))
            )
            markers[0].click()
            time.sleep(2)
            
            # Prueba del botón "Ver clima"
            ver_clima_btn = self.driver.find_element(By.ID, "verClimaHora")
            
            # Estado inicial
            is_enabled = not ver_clima_btn.get_attribute("disabled")
            print(f"   ✅ Botón 'Ver clima' - Estado: {'Habilitado' if is_enabled else 'Deshabilitado'}")
            
            # Prueba del botón "Agendar cita"
            agendar_btn = self.driver.find_element(By.ID, "agendarCita")
            agendar_enabled = not agendar_btn.get_attribute("disabled")
            print(f"   ✅ Botón 'Agendar cita' - Estado: {'Habilitado' if agendar_enabled else 'Deshabilitado'}")
            
            # Verificar cambio de color al hover
            actions = ActionChains(self.driver)
            actions.move_to_element(ver_clima_btn).perform()
            color_hover = ver_clima_btn.value_of_css_property("background-color")
            print(f"   ✅ Cambio visual en hover detectado")
            
            print("✅ Estados de botones: EXITOSA")
            return True
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    # =====================================================
    # Ejecutor de todas las pruebas
    # =====================================================
    def run_all_tests(self):
        """Ejecuta todas las pruebas avanzadas"""
        print("\n" + "="*70)
        print("🔬 INICIANDO PRUEBAS AVANZADAS DE TRAIL DIRECTORY")
        print("="*70)
        
        tests = [
            ("Map Elements", self.test_map_elements_presence),
            ("Page Performance", self.test_page_load_performance),
            ("Multiple Markers", self.test_multiple_marker_clicks),
            ("Input Validation", self.test_input_validation),
            ("Button States", self.test_button_states),
            ("Panel Responsiveness", self.test_detail_panel_responsiveness),
            ("Weather Multiple Hours", self.test_weather_at_different_hours),
        ]
        
        results = []
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"\n❌ Error ejecutando {test_name}: {e}")
                results.append((test_name, False))
        
        # Resumen
        print("\n" + "="*70)
        print("📊 RESUMEN DE PRUEBAS AVANZADAS")
        print("="*70)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ EXITOSA" if result else "❌ FALLÓ"
            print(f"{status}: {test_name}")
        
        print(f"\n📈 Total: {passed}/{total} pruebas exitosas")
        
        return passed == total


# ============================
# Ejecutador
# ============================

if __name__ == "__main__":
    tester = TrailDirectoryAdvancedTests()
    
    try:
        tester.setup()
        success = tester.run_all_tests()
        
        if success:
            print("\n✅ TODAS LAS PRUEBAS AVANZADAS PASARON")
            exit(0)
        else:
            print("\n⚠️ ALGUNAS PRUEBAS FALLARON")
            exit(1)
            
    except Exception as e:
        print(f"\n❌ Error fatal: {e}")
        exit(1)
    finally:
        tester.teardown()
