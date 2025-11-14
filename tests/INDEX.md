# 📚 Índice de Pruebas de Integración - TrailDirectory

## 📌 Descripción General

Este directorio contiene una **suite completa de pruebas de integración** para validar el componente React **TrailDirectory** usando Selenium. Las pruebas verifican:

- ✅ Carga del mapa con Leaflet
- ✅ Selección de rutas mediante clics en marcadores
- ✅ Visualización de datos de las rutas
- ✅ Consulta de clima por fecha/hora
- ✅ Funcionalidad del formulario de agendamiento
- ✅ Responsividad y performance

---

## 📁 Archivos de Prueba

### 1. **test_trail_directory_integration.py** 🎯
**Tipo:** Prueba Principal (Recomendada para CI/CD)

**Qué valida:**
- Carga del mapa con Leaflet
- Presencia de marcadores
- Selección de rutas (clic en marcador)
- Carga de datos de la ruta
- Información del clima actual
- Consulta de clima por fecha/hora
- Estado del formulario de agendamiento
- Responsividad del panel

**Tiempo:** 30-45 segundos
**Entrada:** URL de TrailDirectory
**Salida:** 
- ✅ Todas las pruebas pasaron
- ❌ Alguna prueba falló + descripción del error
- 📸 Captura de pantalla si falla: `test_error_screenshot.png`

**Uso:**
```bash
python test_trail_directory_integration.py
```

---

### 2. **test_trail_directory_advanced.py** 🔬
**Tipo:** Pruebas Avanzadas (Casos más complejos)

**Qué valida:**
- Múltiples clics secuenciales en marcadores
- Consulta de clima a diferentes horas del día
- Presencia de todos los elementos del mapa
- Validación de inputs (tipo, atributos, etc.)
- Performance de carga de página
- Responsividad del panel lateral
- Estados visuales de botones (hover, disabled, etc.)

**Tiempo:** 1-2 minutos
**Estructura:** Clase `TrailDirectoryAdvancedTests` con métodos individuales
**Uso:**
```bash
python test_trail_directory_advanced.py
```

---

### 3. **test_trail_directory_custom_template.py** 🔧
**Tipo:** Template para Pruebas Personalizadas

**Contenido:**
- Clase `CustomTrailTest` con helpers reutilizables
- 5 ejemplos de pruebas customizadas
- Métodos auxiliares para operaciones comunes

**Ejemplos Incluidos:**
1. `test_search_trail_by_name()` - Buscar ruta por nombre
2. `test_weather_data_format()` - Validar formato de datos climáticos
3. `test_input_boundaries()` - Probar límites de inputs
4. `test_appointment_flow()` - Flujo completo de agendamiento
5. `test_scroll_performance()` - Performance de scroll

**Uso:**
```bash
python test_trail_directory_custom_template.py
```

**Cómo usarlo:**
```python
# Crear tu propia prueba
tester = CustomTrailTest()
tester.setup()
tester.test_search_trail_by_name("Cerro de la Silla")
tester.teardown()
```

---

### 4. **run_integration_test.py** 🚀
**Tipo:** Ejecutor Inteligente con Validaciones

**Funcionalidades:**
- ✅ Valida Python 3.8+
- ✅ Verifica dependencias (selenium, webdriver-manager)
- ✅ Comprueba que Backend esté en localhost:8000
- ✅ Comprueba que Frontend esté en localhost:3000
- ✅ Ejecuta automáticamente la prueba principal

**Uso:**
```bash
python run_integration_test.py
```

**Output:**
```
📋 VERIFICACIONES PREVIAS:
✅ Python 3.9 - OK
✅ Selenium 4.38.0 - OK
✅ WebDriver Manager - OK

🔍 VERIFICANDO SERVICIOS:
✅ Backend (localhost:8000) - OK
✅ Frontend (localhost:3000) - OK

🧪 Ejecutando prueba...
[Output de las pruebas]

✅ TODAS LAS PRUEBAS PASARON CORRECTAMENTE
```

---

## 📄 Documentación

### GUIA_RAPIDA.md
Guía rápida de inicio con:
- Resumen de archivos
- Instrucciones de ejecución (4 opciones)
- Requisitos previos
- Troubleshooting
- Personalización

### README_TRAIL_INTEGRATION_TEST.md
Documentación completa con:
- Descripción detallada de pruebas
- Requisitos del sistema
- Instrucciones de instalación
- Output esperado
- Solución de problemas
- Casos de prueba cubiertos

### test_formulario.py
Prueba de ejemplo (formulario) - Referencia para entender patrón Selenium

---

## 🚀 Inicio Rápido

### Paso 1: Instalar dependencias
```bash
pip install -r ../requirements.txt
# O solo lo necesario
pip install selenium webdriver-manager
```

### Paso 2: Ejecutar Backend
```bash
cd ../backend
python manage.py runserver
```

### Paso 3: Ejecutar Frontend
```bash
cd ../Front
npm start
```

### Paso 4: Ejecutar Pruebas
```bash
cd ../tests

# Opción 1: Usar ejecutor inteligente
python run_integration_test.py

# Opción 2: Ejecutar prueba principal directo
python test_trail_directory_integration.py

# Opción 3: Ejecutar pruebas avanzadas
python test_trail_directory_advanced.py

# Opción 4: Con pytest
pytest test_trail_directory*.py -v
```

---

## 🎯 Matriz de Pruebas

| Prueba | Archivo | Tiempo | Complejidad | Propósito |
|--------|---------|--------|-------------|----------|
| Principal | `test_trail_directory_integration.py` | 30-45s | ⭐⭐ | Validación básica |
| Avanzadas | `test_trail_directory_advanced.py` | 1-2m | ⭐⭐⭐⭐ | Casos complejos |
| Custom | `test_trail_directory_custom_template.py` | Variable | ⭐⭐⭐ | Ejemplos extensibles |
| Ejecutor | `run_integration_test.py` | - | ⭐⭐ | Pre-validaciones + ejecución |

---

## 📊 Elementos del DOM Validados

```
TrailDirectory (http://localhost:3000/trail-directory)
│
├── id="map" ✅
│   ├── .leaflet-container ✅
│   │   ├── .leaflet-marker-icon (múltiples) ✅
│   │   ├── .leaflet-popup ✅
│   │   └── .leaflet-tile ✅
│   │
│   └── L.map() (Instancia de Leaflet) ✅
│
└── id="detalleRuta" ✅
    ├── h2 (Nombre de ruta) ✅
    ├── img (Fotos de ruta) ✅
    ├── .clima-box ✅
    │   ├── img (Icono de clima) ✅
    │   ├── Temperatura ✅
    │   ├── Condición ✅
    │   └── Velocidad del viento ✅
    │
    ├── input#fechaClima (type="date") ✅
    ├── input#horaClima (type="time") ✅
    ├── button#verClimaHora ✅
    │
    ├── id="climaSeleccionado" ✅
    │   └── Información climática por fecha/hora ✅
    │
    ├── Sección de amigos (selección de compañeros) ✅
    └── button#agendarCita ✅
```

---

## 🔄 Flujo de Pruebas

```
┌─ Iniciar Navegador Chrome
│
├─ Navegar a TrailDirectory
│
├─ FASE 1: Validar Mapa
│  ├─ Buscar contenedor del mapa
│  ├─ Buscar Leaflet container
│  └─ Contar marcadores
│
├─ FASE 2: Seleccionar Ruta
│  ├─ Hacer clic en primer marcador
│  ├─ Esperar actualización de datos
│  └─ Verificar panel de detalles
│
├─ FASE 3: Cargar Clima
│  ├─ Buscar elemento .clima-box
│  ├─ Verificar datos de temperatura
│  └─ Verificar datos de viento
│
├─ FASE 4: Consultar Clima por Fecha/Hora
│  ├─ Llenar fecha con valor futuro
│  ├─ Llenar hora con valor válido
│  ├─ Hacer clic "Ver clima"
│  └─ Verificar resultado en "climaSeleccionado"
│
├─ FASE 5: Verificar Formulario
│  ├─ Buscar botón "Agendar cita"
│  └─ Validar estado (enabled/disabled)
│
├─ FASE 6: Responsividad
│  ├─ Scroll del panel
│  └─ Redimensionamiento (opcional)
│
└─ Cerrar Navegador
   └─ Mostrar Resumen
```

---

## ✅ Checks de Integración

### ✅ Mapa
- [ ] Contenedor `#map` existe
- [ ] Leaflet se carga correctamente
- [ ] Marcadores están presentes
- [ ] Clic en marcador funciona

### ✅ Datos de Ruta
- [ ] Nombre de ruta se muestra
- [ ] Descripción se muestra
- [ ] Fotos se cargan
- [ ] Nivel de experiencia se muestra

### ✅ Clima
- [ ] Clima actual se carga
- [ ] Temperatura se muestra
- [ ] Velocidad del viento se muestra
- [ ] Icono de clima se muestra

### ✅ Consulta de Clima
- [ ] Input de fecha acepta valores
- [ ] Input de hora acepta valores
- [ ] Botón "Ver clima" responde
- [ ] Resultado se muestra en `#climaSeleccionado`

### ✅ Formulario
- [ ] Botón "Agendar cita" existe
- [ ] Botón se habilita con datos completos
- [ ] Panel de selección de amigos funciona

---

## 📈 Interpretación de Resultados

### ✅ EXITOSA
```
✅ TODAS LAS PRUEBAS PASARON CORRECTAMENTE
   Exit code: 0
```
→ Componente funcionando correctamente

### ⚠️ ADVERTENCIA
```
⚠️ ALGUNAS PRUEBAS FALLARON
   Exit code: 1
```
→ Revisar descripción del error
→ Consultar `test_error_screenshot.png`

### ❌ ERROR CRÍTICO
```
❌ Error conectando a localhost:3000
   ❌ Error conectando a localhost:8000
```
→ Verificar que Backend y Frontend estén ejecutándose

---

## 🛠️ Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "Chrome not found" | `pip install --upgrade webdriver-manager` |
| "Connection refused:3000" | `cd Front && npm start` |
| "Connection refused:8000" | `cd backend && python manage.py runserver` |
| "Element not found" | Aumentar tiempo de espera a 30 segundos |
| "ElementClickInterceptedException" | Aumentar `time.sleep()` a 3 segundos |

---

## 📝 Archivos de Referencia

- `test_formulario.py` - Ejemplo básico de Selenium
- `test_components.py` - Plantilla de pruebas (vacío)
- `GUIA_RAPIDA.md` - Guía rápida de inicio
- `README_TRAIL_INTEGRATION_TEST.md` - Documentación completa

---

## 🎓 Ejemplos de Uso

### Ejecutar solo la prueba principal
```bash
python test_trail_directory_integration.py
```

### Ejecutar solo las pruebas avanzadas
```bash
python test_trail_directory_advanced.py
```

### Ejecutar con pytest y generar reporte
```bash
pytest test_trail_directory*.py -v --tb=short
```

### Ejecutar una prueba específica
```bash
pytest test_trail_directory_advanced.py::TrailDirectoryAdvancedTests::test_map_elements_presence -v
```

### Ejecutar con opciones de pytest
```bash
pytest test_trail_directory*.py -v -s --tb=long --maxfail=3
```

---

## 🔗 URLs Utilizadas

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000
- **TrailDirectory:** http://localhost:3000/trail-directory
- **API Rutas:** http://localhost:8000/trail/rutas/
- **API Clima:** https://api.open-meteo.com/v1/forecast (Externa)

---

## 📞 Notas Importantes

1. **Tiempo de ejecución:** Varía según velocidad de conexión
2. **Conexión a Internet:** Requerida para Open-Meteo API
3. **Captura de pantalla:** Se genera automáticamente si falla
4. **Logs:** Muy detallados en consola para debugging
5. **Exit codes:** 
   - `0` = Éxito
   - `1` = Fallo

---

## 📚 Referencia Adicional

- [Selenium Documentation](https://www.selenium.dev/documentation/)
- [WebDriver Manager](https://github.com/SergeyPirogov/webdriver_manager)
- [Leaflet.js](https://leafletjs.com/)
- [Open-Meteo API](https://open-meteo.com/)
- [Pytest](https://docs.pytest.org/)

---

## 🎯 Próximos Pasos

1. ✅ Leer `GUIA_RAPIDA.md`
2. ✅ Ejecutar `python run_integration_test.py`
3. ✅ Revisar output y captura de pantalla si falla
4. ✅ Ejecutar pruebas avanzadas: `python test_trail_directory_advanced.py`
5. ✅ Crear tus propias pruebas basándote en `test_trail_directory_custom_template.py`

---

## 📝 Licencia

Estos archivos de prueba son parte del proyecto Walk-Pip y están disponibles bajo la misma licencia del proyecto.

---

**Última actualización:** Noviembre 2025
**Versión:** 1.0
**Autor:** Test Suite - Walk-Pip Project

¡Happy Testing! 🧪🚀
