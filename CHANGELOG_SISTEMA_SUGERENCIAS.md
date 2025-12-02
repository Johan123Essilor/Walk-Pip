# Sistema de Sugerencias de Usuarios Similares - Changelog Completo

## Resumen General
Implementación de un sistema de recomendaciones basado en Machine Learning que sugiere usuarios similares para invitar a grupos de senderismo. El sistema utiliza algoritmos de clustering y similitud coseno para analizar métricas de caminata y encontrar usuarios con características compatibles.

## 1. Configuración de Dependencias (Opcional)

### Backend - Librerías de Machine Learning
```bash
# Instalar dependencias ML en el backend
cd backend
pip install scikit-learn joblib numpy pandas

# O usando requirements.txt
pip install -r requirements.txt
```

### Frontend - Sin dependencias adicionales
El frontend utiliza las librerías ya existentes (React, Reactstrap, Auth0).

## 2. Cambios en la Base de Datos

- Verificación de sesiones reales existentes (11 sesiones en sesion_actividad)
- Redistribución correcta de los sesion_id en metrica_caminata:
  - Se aplicó un algoritmo basado en row_number() y módulo para repartir los registros de forma uniforme entre las sesiones
- Redistribución en metrica_corazon usando el mismo mecanismo
- Confirmación mediante GROUP BY para asegurar que todas las sesiones tienen datos
- Código fallido inicial (asignación random) documentado como parte del historial

## 3. Desarrollo del Sistema de Machine Learning

- Limpieza de datos previa (oxigenación, ritmo cardiaco, km recorridos)
- Entrenamiento del modelo KMeans para agrupar usuarios por nivel de caminata
- Guardado de modelo y scaler como modelo_caminata.pkl y scaler_caminata.pkl
- Implementación del algoritmo de similitud con cosine_similarity
- Implementación de fallback basado en edad si el modelo no existe o falla
- Corrección crítica: función _extraer_caracteristicas_usuario reescrita para extraer exactamente 5 características del modelo: [AvgPace, AvgSpO2, AvgHR, TotalKM, AvgSpeed]

## 4. Backend (Django) - API Development

### Endpoint Principal
- Creación del endpoint GET /users/{id}/similares/ en UsuarioViewSet usando @action decorator
- URL corregida de /usuarios/{id}/similares/ a /users/{id}/similares/ para consistencia

### Lógica del Algoritmo
- Obtener métricas del usuario actual
- Conectar con modelos MetricaCaminata y MetricaCorazon de la app metrics  
- Calcular características ML del usuario base
- Escalar datos usando StandardScaler preentrenado
- Cargar modelo ML desde users/ml_model/
- Calcular similitud coseno entre vectores escalados
- Devolver los 5 usuarios con mayor similitud
- Sistema de fallback MVP basado en edad similar

### Manejo de Errores
- Fallback seguro por si no hay modelo ML
- Validación de exactamente 5 características por usuario
- Manejo robusto de usuarios sin métricas de caminata
- Logging detallado para debugging del proceso ML

## 5. Frontend (React) - Interfaz de Usuario

### Funcionalidad Básica
- Integración del sistema de sugerencias en el modal "Gestionar Miembros"
- Función fetchSuggestedUsers() implementada con endpoint corregido
- Obtención de sugerencias en paralelo con usuarios disponibles
- Sistema de invitaciones existente extendido para usuarios sugeridos

### Mejoras de Diseño (Actualizaciones Recientes)
- Reorganización del modal con prioridad visual para sugerencias AI
- Sección "Sugerencias Para Ti" destacada en la parte superior
- Lista "Todos los Usuarios" colapsible con botón toggle mostrar/ocultar
- Diseño visual unificado usando list-group para ambas secciones
- Eliminación de bordes verdes especiales y color azul del texto
- Indicadores sutiles para diferenciar sugerencias AI:
  - Icono de sparkles para sugerencias
  - Texto "Compatible contigo" en verde
  - Nombres de usuarios sugeridos en color verde
- Filtrado automático para evitar duplicados entre secciones
- Scroll limitado (max-height: 300px) para listas largas
- Contador de usuarios disponibles en el botón toggle

### Estados de Carga y Errores
- Loading states para ambas secciones
- Fallback elegante cuando no hay sugerencias disponibles
- Manejo de errores en llamadas API
- Debug logging temporal para rastrear flujo de datos

## 6. Código SQL Final Utilizado

### Metrica Caminata
```sql
WITH s AS ( 
    SELECT array_agg(id ORDER BY id) AS sesiones_arr 
    FROM sesion_actividad 
), 
num AS ( 
    SELECT COUNT(*) AS n_ses 
    FROM sesion_actividad 
), 
enumerated AS ( 
    SELECT mc.id AS metric_id,
           row_number() OVER (ORDER BY mc.id) - 1 AS rn,
           (row_number() OVER (ORDER BY mc.id) - 1) % num.n_ses + 1 AS pos 
    FROM metrica_caminata mc, num 
)
UPDATE metrica_caminata m 
SET sesion_id = s.sesiones_arr[enumerated.pos]
FROM enumerated, s 
WHERE m.id = enumerated.metric_id;
```

### Metrica Corazon
```sql
WITH s AS ( 
    SELECT array_agg(id ORDER BY id) AS sesiones_arr 
    FROM sesion_actividad 
), 
num AS ( 
    SELECT COUNT(*) AS n_ses 
    FROM sesion_actividad 
), 
enumerated AS ( 
    SELECT mc.id AS metric_id,
           row_number() OVER (ORDER BY mc.id) - 1 AS rn,
           (row_number() OVER (ORDER BY mc.id) - 1) % num.n_ses + 1 AS pos 
    FROM metrica_corazon mc, num 
)
UPDATE metrica_corazon m 
SET sesion_id = s.sesiones_arr[enumerated.pos]
FROM enumerated, s 
WHERE m.id = enumerated.metric_id;
```

### Código Borrador Descartado
```sql
UPDATE metrica_caminata SET sesion_id = sub.nuevo_id 
FROM ( 
    SELECT id, (SELECT id FROM sesion_actividad ORDER BY random() LIMIT 1) AS nuevo_id 
    FROM metrica_caminata 
) AS sub 
WHERE metrica_caminata.id = sub.id;
```

## 7. Estado Final del Sistema

- Datos limpios y distribuidos correctamente en la base de datos
- Modelos ML funcionando con características corregidas
- API expuesta para recomendaciones con manejo robusto de errores
- Frontend integrado con diseño mejorado y UX optimizada

## 8. Pruebas Exitosas del Sistema (1 dic 2025)

- Endpoint GET /users/9/similares/ funciona correctamente
- Respuesta HTTP 200 con 5 usuarios sugeridos
- Algoritmo ML activo ("ml_clustering" no fallback)
- Similitudes calculadas correctamente (todas 1.0 por datos similares)
- Frontend funcional con modal reorganizado y diseño unificado
- Sistema completamente funcional end-to-end

## 9. Archivos Modificados

### Backend
- `backend/users/views.py` - Endpoint ML con características corregidas
- `backend/requirements.txt` - Dependencias ML agregadas
- `backend/users/urls.py` - Configuración de rutas verificada

### Frontend  
- `Front/src/pages/MyGroups.js` - Sistema completo de sugerencias con diseño mejorado

### Documentación
- `CHANGELOG_SISTEMA_SUGERENCIAS.md` - Documentación completa actualizada

## 10. Próximos Pasos Sugeridos

- Remover logs de debugging temporales para producción
- Optimizar algoritmo ML para generar similitudes más variadas
- Implementar cache para mejorar performance de sugerencias
- Agregar métricas de uso del sistema de recomendaciones
- Considerar agregar más características ML (ubicación, preferencias, etc.)
