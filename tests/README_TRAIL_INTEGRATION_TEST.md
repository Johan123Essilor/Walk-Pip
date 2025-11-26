# 🧪 Prueba de Integración - Trail Directory

## 📋 Descripción

Esta prueba de integración valida los componentes principales del **TrailDirectory** utilizando Selenium:

### ✅ Funcionalidades Probadas

1. **🗺️ Carga del Mapa**
   - Verifica que el contenedor del mapa esté presente
   - Valida que Leaflet se cargó correctamente
   - Comprueba que los marcadores están disponibles

2. **🎯 Selección de Ruta**
   - Simula clic en un marcador del mapa
   - Verifica que los datos de la ruta se cargan
   - Comprueba que el panel de detalles se actualiza

3. **🌤️ Consulta de Clima**
   - Verifica la carga del clima actual
   - Simula la búsqueda de clima por fecha/hora específica
   - Valida que se muestran datos de temperatura y condiciones

4. **📝 Formulario de Agendamiento**
   - Verifica la presencia del botón "Agendar cita"
   - Valida el estado del formulario

5. **📱 Responsividad**
   - Prueba el scroll en el panel de detalles
   - Verifica la correcta visualización de componentes

---

## 🚀 Requisitos

### Dependencias Python

```bash
pip install selenium webdriver-manager
```

O instala todas las dependencias del proyecto:

```bash
pip install -r requirements.txt
```

### Requisitos del Sistema

- **Python 3.8+**
- **Chrome** o **Chromium** instalado
- **Navegador compatible** con WebDriver
- **Backend ejecutándose** en `http://localhost:8000`
- **Frontend ejecutándose** en `http://localhost:3000`

---

## 🏃 Ejecución

### Opción 1: Ejecutar desde la terminal (Recomendado)

```bash
# Desde la carpeta del proyecto
cd tests
python test_trail_directory_integration.py
```

### Opción 2: Ejecutar con pytest

```bash
# Instalar pytest si no lo tienes
pip install pytest

# Ejecutar la prueba
pytest test_trail_directory_integration.py -v
```

### Opción 3: Ejecutar desde la raíz del proyecto

```bash
python -m pytest tests/test_trail_directory_integration.py -v --tb=short
```

---

## 📊 Output Esperado

Si todas las pruebas pasan, verás:

```
============================================================
INICIANDO PRUEBAS DE INTEGRACIÓN - TRAIL DIRECTORY
============================================================

🌐 PASO 1: Abriendo TrailDirectory...
🗺️ PASO 2: Verificando carga del mapa...
✅ El contenedor del mapa está presente en el DOM
✅ El mapa está visible en la pantalla
✅ Mapa de Leaflet cargado correctamente (1 contenedor(es))

🎯 PASO 3: Seleccionando una ruta del mapa...
✅ Se encontraron 2 marcador(es) en el mapa
✅ Ruta seleccionada: 'Cerro de la Silla'
✅ Se mostraron 8 elementos de información

🌤️ PASO 4: Verificando clima actual...
✅ Box del clima encontrado
✅ Datos de clima presentes: Temperatura: 25°C, Viento: 5 km/h...

📅 PASO 5: Consultando clima por fecha/hora...
✅ Input de fecha encontrado
✅ Input de hora encontrado
   → Ingresando fecha: 2025-11-14
   → Ingresando hora: 14:00
✅ Clima seleccionado mostrado
✅ Datos del clima: Parcialmente nublado, Temp: 23°C

📝 PASO 6: Verificando formulario de agendamiento...
✅ Botón 'Agendar cita' encontrado
   → Estado del botón: Habilitado

📱 PASO 7: Verificando responsividad...
✅ Panel de detalles scrolleado sin errores

============================================================
✅ TEST COMPLETADO EXITOSAMENTE
============================================================

📋 RESUMEN DE PRUEBAS EJECUTADAS:
   ✓ Carga del mapa con Leaflet
   ✓ Selección de ruta mediante clic en marcador
   ✓ Visualización de datos de la ruta
   ✓ Carga de clima actual
   ✓ Consulta de clima por fecha/hora específica
   ✓ Verificación de componentes del formulario
   ✓ Responsividad del panel de detalles

✅ TODAS LAS PRUEBAS PASARON CORRECTAMENTE
```

---

## ⚠️ Solución de Problemas

### Error: "Chrome not found"

**Solución:** `webdriver-manager` debería descargar automáticamente. Si falla:

```bash
pip install --upgrade webdriver-manager
```

### Error: "Connection refused" en localhost:3000

**Verificar que el frontend está ejecutándose:**

```bash
# Desde la carpeta Front
npm start
```

### Error: "Connection refused" en localhost:8000

**Verificar que el backend está ejecutándose:**

```bash
# Desde la carpeta backend
python manage.py runserver
```

### Error: "Element not found: map"

**Posibles causas:**
- La URL es incorrecta
- El selector CSS cambió en el componente
- La página no cargó completamente

**Solución:** Aumenta el tiempo de espera:

```python
wait = WebDriverWait(driver, 30)  # Aumenta de 15 a 30 segundos
```

### Error: "ElementClickInterceptedException"

**Solución:** Aumenta el `time.sleep()` después de que los elementos cargan:

```python
time.sleep(3)  # En lugar de time.sleep(2)
```

---

## 🔧 Personalización de la Prueba

### Cambiar la URL de conexión

Edita esta línea en el archivo:

```python
driver.get("http://localhost:3000/trail-directory")  # Cambia la URL aquí
```

### Cambiar la fecha de prueba

```python
from datetime import datetime, timedelta
tomorrow = datetime.now() + timedelta(days=2)  # Cambia a 2 días en lugar de 1
```

### Cambiar la hora de consulta

```python
hora_str = "18:00"  # Cambiar de 14:00 a 18:00
```

### Agregar esperas más largas

```python
wait = WebDriverWait(driver, 20)  # Aumentar timeout
```

---

## 🎯 Casos de Prueba Cubiertos

| #  | Caso de Prueba | Estado |
|----|----------------|--------|
| 1  | Mapa carga correctamente | ✅ |
| 2  | Leaflet se inicializa | ✅ |
| 3  | Marcadores están visibles | ✅ |
| 4  | Clic en marcador selecciona ruta | ✅ |
| 5  | Panel de detalles se actualiza | ✅ |
| 6  | Clima actual se muestra | ✅ |
| 7  | Input de fecha funciona | ✅ |
| 8  | Input de hora funciona | ✅ |
| 9  | Botón "Ver clima" responde | ✅ |
| 10 | Clima por fecha/hora se muestra | ✅ |
| 11 | Botón "Agendar cita" existe | ✅ |
| 12 | Panel scrollea correctamente | ✅ |

---

## 📝 Notas Importantes

- ⏱️ La prueba toma aproximadamente **30-45 segundos** en ejecutarse
- 🖼️ Si falla, se genera una captura de pantalla: `test_error_screenshot.png`
- 🔄 Los tiempos de espera son configurables según tu conexión
- 🌐 Requiere conexión a Internet para obtener datos del clima desde OpenMeteo

---

## 🐛 Debug Mode

Para ver más detalles durante la ejecución, puedes añadir logs:

```python
# Agregar antes de cada prueba importante
print(f"DEBUG: {driver.current_url}")
print(f"DEBUG: {driver.page_source[:500]}")
```

---

## 📞 Contacto y Soporte

Si encuentras problemas, verifica:

1. ✅ Backend ejecutándose en puerto 8000
2. ✅ Frontend ejecutándose en puerto 3000
3. ✅ Chrome/Chromium disponible en el sistema
4. ✅ Conexión a Internet disponible
5. ✅ Python 3.8 o superior

---

## 📄 Referencias

- [Selenium Documentation](https://www.selenium.dev/documentation/)
- [WebDriver Manager](https://github.com/SergeyPirogov/webdriver_manager)
- [Leaflet.js](https://leafletjs.com/)
- [Open-Meteo API](https://open-meteo.com/)
