# 🎯 Guía de Ejecución - Pruebas de Integración

## 📌 Resumen Rápido

Creé **3 archivos principales** de prueba para validar el componente **TrailDirectory**:

### 1. ✅ Prueba Principal: `test_trail_directory_integration.py`
**Lo que valida:**
- Carga del mapa con Leaflet
- Selección de rutas mediante clic en marcadores
- Visualización de datos de la ruta
- Carga de clima actual
- Consulta de clima por fecha/hora específica
- Verificación del formulario de agendamiento
- Responsividad del panel

**Tiempo estimado:** 30-45 segundos

---

### 2. 🔬 Pruebas Avanzadas: `test_trail_directory_advanced.py`
**Lo que valida:**
- Múltiples clics en marcadores
- Clima en diferentes horas del día
- Presencia de elementos del mapa
- Validación de inputs
- Performance de carga
- Responsividad del panel lateral
- Estados visuales de botones

**Tiempo estimado:** 1-2 minutos

---

### 3. 🚀 Ejecutor Helper: `run_integration_test.py`
**Funcionalidades:**
- Valida Python 3.8+
- Verifica dependencias instaladas
- Comprueba que backend/frontend están activos
- Ejecuta automáticamente la prueba principal

---

## 🚀 Cómo Ejecutar

### ▶️ Opción 1: Usar el Script Ejecutor (RECOMENDADO)

```bash
# Desde la carpeta tests
cd tests
python run_integration_test.py
```

Este script:
✅ Verifica que tengas Python 3.8+
✅ Verifica que Selenium y WebDriver Manager estén instalados
✅ Comprueba que Backend esté en localhost:8000
✅ Comprueba que Frontend esté en localhost:3000
✅ Ejecuta automáticamente la prueba

---

### ▶️ Opción 2: Ejecución Directa - Prueba Principal

```bash
cd tests
python test_trail_directory_integration.py
```

---

### ▶️ Opción 3: Ejecución de Pruebas Avanzadas

```bash
cd tests
python test_trail_directory_advanced.py
```

---

### ▶️ Opción 4: Con pytest (si está instalado)

```bash
# Instalar pytest
pip install pytest

# Ejecutar prueba principal
pytest test_trail_directory_integration.py -v

# Ejecutar pruebas avanzadas
pytest test_trail_directory_advanced.py -v

# Ejecutar ambas
pytest test_trail_directory*.py -v
```

---

## ✅ Requisitos Previos

### 1️⃣ Backend Ejecutándose

```bash
# Desde la carpeta backend
cd backend
python manage.py runserver

# Esperado: Starting development server at http://127.0.0.1:8000/
```

### 2️⃣ Frontend Ejecutándose

```bash
# Desde la carpeta Front
cd Front
npm start

# Esperado: Compiled successfully! 
# En http://localhost:3000
```

### 3️⃣ Dependencias Python Instaladas

```bash
# Desde la raíz del proyecto
pip install -r requirements.txt

# O solo las necesarias para tests
pip install selenium webdriver-manager
```

---

## 📊 Output Esperado

### Si Todo va Bien ✅

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
   → Haciendo clic en el marcador #1...
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
   → Haciendo clic en botón 'Ver clima'...
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

## 🐛 Troubleshooting

### ❌ "Chrome not found"

```bash
# Solución: Actualizar webdriver-manager
pip install --upgrade webdriver-manager
```

### ❌ "Connection refused" (localhost:3000)

```bash
# Verificar que el frontend está corriendo
cd Front
npm start
```

### ❌ "Connection refused" (localhost:8000)

```bash
# Verificar que el backend está corriendo
cd backend
python manage.py runserver
```

### ❌ "Element not found: map"

**Causas:**
- URL incorrecta en el script
- La página no cargó completamente
- El selector CSS cambió en el componente

**Solución:**
```python
# Aumentar tiempo de espera en el script
wait = WebDriverWait(driver, 30)  # Cambiar de 15 a 30 segundos
```

### ❌ "ElementClickInterceptedException"

```python
# Aumentar tiempo de espera después de cargar elementos
time.sleep(3)  # Cambiar de 2 a 3 segundos
```

---

## 🎯 Flujo Completo de Pruebas

```
┌─ Iniciar Script
│
├─ Validar Python 3.8+
├─ Verificar Selenium instalado
├─ Verificar WebDriver Manager instalado
│
├─ Verificar Backend (localhost:8000)
├─ Verificar Frontend (localhost:3000)
│
├─ Abrir Navegador Chrome
├─ Navegar a localhost:3000/trail-directory
│
├─ PRUEBA 1: Cargar Mapa
│   ├─ Buscar contenedor #map
│   ├─ Buscar elemento .leaflet-container
│   └─ Verificar marcadores (.leaflet-marker-icon)
│
├─ PRUEBA 2: Seleccionar Ruta
│   ├─ Hacer clic en primer marcador
│   ├─ Esperar carga de datos
│   └─ Verificar panel de detalles
│
├─ PRUEBA 3: Cargar Clima
│   ├─ Buscar elemento .clima-box
│   ├─ Verificar datos de temperatura
│   └─ Verificar datos de viento
│
├─ PRUEBA 4: Consultar Clima por Fecha/Hora
│   ├─ Llenar input #fechaClima
│   ├─ Llenar input #horaClima
│   ├─ Clic botón #verClimaHora
│   └─ Verificar elemento #climaSeleccionado
│
├─ PRUEBA 5: Verificar Formulario
│   ├─ Buscar botón #agendarCita
│   └─ Verificar estado
│
├─ PRUEBA 6: Responsividad
│   ├─ Scroll panel #detalleRuta
│   └─ Verificar funcionamiento
│
└─ Cerrar Navegador
   └─ Mostrar Resumen
```

---

## 📈 Interpretación de Resultados

| Símbolo | Significado |
|---------|------------|
| ✅ | Test pasado correctamente |
| ⚠️ | Advertencia (elemento presente pero con comportamiento inesperado) |
| ❌ | Test fallido |
| 🔄 | Proceso en curso |

---

## 📝 Personalizar las Pruebas

### Cambiar la URL

En `test_trail_directory_integration.py`:

```python
driver.get("http://localhost:3000/trail-directory")  # ← Cambiar aquí
```

### Cambiar la fecha de consulta

```python
from datetime import datetime, timedelta
tomorrow = datetime.now() + timedelta(days=2)  # Cambiar a 2 días
fecha_str = tomorrow.strftime("%Y-%m-%d")
```

### Cambiar la hora de consulta

```python
hora_str = "18:00"  # Cambiar de 14:00 a 18:00
```

### Aumentar tiempos de espera

```python
wait = WebDriverWait(driver, 30)  # Aumentar de 15 a 30 segundos
time.sleep(5)  # Aumentar a 5 segundos
```

---

## 🔗 Archivos Relacionados

- `test_trail_directory_integration.py` - Prueba principal
- `test_trail_directory_advanced.py` - Pruebas avanzadas
- `run_integration_test.py` - Ejecutor helper
- `README_TRAIL_INTEGRATION_TEST.md` - Documentación completa
- `test_formulario.py` - Prueba de ejemplo del formulario

---

## 📞 Notas Importantes

1. **Tiempo de ejecución:** 30-45 segundos (puede variar según velocidad)
2. **Conexión a Internet:** Requerida (para Open-Meteo API)
3. **Captura de pantalla:** Se genera `test_error_screenshot.png` si falla
4. **Logs en consola:** Muy detallados para debugging
5. **Exit codes:**
   - `0` = Todas las pruebas pasaron
   - `1` = Alguna prueba falló

---

## 🎓 Referencia de Conceptos

### Elementos del DOM Verificados

```
TrailDirectory
├── id="map" (Contenedor del mapa)
│   └── .leaflet-container (Leaflet)
│       └── .leaflet-marker-icon (Marcadores)
│
└── id="detalleRuta" (Panel de detalles)
    ├── h2 (Nombre de la ruta)
    ├── .clima-box (Información del clima)
    ├── input#fechaClima (Input de fecha)
    ├── input#horaClima (Input de hora)
    ├── button#verClimaHora (Botón "Ver clima")
    ├── id="climaSeleccionado" (Resultado del clima)
    └── button#agendarCita (Botón "Agendar cita")
```

---

## 🚀 Próximos Pasos

1. Ejecutar `python run_integration_test.py`
2. Revisar el output
3. Si todo está ✅, las pruebas funcionan correctamente
4. Si hay ❌, revisar el troubleshooting
5. Para más detalle, ver `README_TRAIL_INTEGRATION_TEST.md`

---

¡Happy Testing! 🎉
