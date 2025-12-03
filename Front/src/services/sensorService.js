import api from './api';

class SensorService {

    // Obtener último registro de corazón
    async getHeartMetrics() {
        try {
            const response = await api.get('/metrics/corazon/latest/');
            return response.data;
        } catch (error) {
            // Si falla, intentar con el list normal y tomar el último
            try {
                const response = await api.get('/metrics/corazon/');
                if (response.data && response.data.length > 0) {
                    return response.data[response.data.length - 1];
                }
                throw new Error('No hay datos de corazón');
            } catch (fallbackError) {
                throw this.handleError(error);
            }
        }
    }

    // Obtener último registro de caminata
    async getWalkMetrics() {
        try {
            const response = await api.get('/metrics/caminata/latest/');
            return response.data;
        } catch (error) {
            // Si falla, intentar con el list normal y tomar el último
            try {
                const response = await api.get('/metrics/caminata/');
                if (response.data && response.data.length > 0) {
                    return response.data[response.data.length - 1];
                }
                throw new Error('No hay datos de caminata');
            } catch (fallbackError) {
                throw this.handleError(error);
            }
        }
    }

    // Obtener todos los datos combinados para el dashboard
    async getLatestSensorData() {
        try {
            const [heartData, walkData] = await Promise.all([
                this.getHeartMetrics(),
                this.getWalkMetrics()
            ]);

            return {
                heart: heartData,
                walk: walkData,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Obtener historial para gráficas (usa los endpoints base sin `latest` ni `session`)
    // Si se pasa un timeRange se lo añade como query param, pero por defecto llama al endpoint sin filtros
    async getHeartHistory(timeRange = null) {
        try {
            const url = timeRange ? `/metrics/corazon/?time_range=${timeRange}` : `/metrics/corazon/`;
            console.log(`📊 Obteniendo historial corazón desde ${url} ...`);
            const response = await api.get(url);
            console.log('❤️ Datos corazón recibidos:', (response.data && response.data.length) || 0, 'registros');
            return response.data || [];
        } catch (error) {
            console.error('❌ Error obteniendo historial corazón:', error);
            throw this.handleError(error);
        }
    }

    async getWalkHistory(timeRange = null) {
        try {
            const url = timeRange ? `/metrics/caminata/?time_range=${timeRange}` : `/metrics/caminata/`;
            console.log(`📊 Obteniendo historial caminata desde ${url} ...`);
            const response = await api.get(url);
            console.log('🚶 Datos caminata recibidos:', (response.data && response.data.length) || 0, 'registros');
            return response.data || [];
        } catch (error) {
            console.error('❌ Error obteniendo historial caminata:', error);
            throw this.handleError(error);
        }
    }

    // Obtener estadísticas de sesión
    async getSessionStats() {
        try {
            const response = await api.get('/metrics/caminata/session_stats/');
            return response.data;
        } catch (error) {
            // Fallback: calcular estadísticas básicas desde los endpoints normales
            try {
                const [heartResponse, walkResponse] = await Promise.all([
                    api.get('/metrics/corazon/'),
                    api.get('/metrics/caminata/')
                ]);

                const heartData = heartResponse.data;
                const walkData = walkResponse.data;

                const stats = {
                    data_count: heartData.length + walkData.length,
                    session_duration: this.calculateSessionDuration(walkData),
                    total_pasos: walkData.reduce((sum, item) => sum + item.pasos, 0),
                    total_calorias: walkData.reduce((sum, item) => sum + parseFloat(item.calorias_quemadas), 0),
                    total_km: walkData.reduce((sum, item) => sum + parseFloat(item.km_recorridos), 0),
                    max_ritmo: Math.max(...heartData.map(item => item.ritmo_cardiaco)),
                    min_ritmo: Math.min(...heartData.map(item => item.ritmo_cardiaco)),
                    max_oxigenacion: Math.max(...heartData.map(item => parseFloat(item.oxigenacion))),
                    min_oxigenacion: Math.min(...heartData.map(item => parseFloat(item.oxigenacion)))
                };

                return stats;
            } catch (fallbackError) {
                throw this.handleError(error);
            }
        }
    }

    // Calcular duración de sesión basada en tiempo_actividad
    calculateSessionDuration(walkData) {
        if (walkData.length === 0) return 0;

        let totalSeconds = 0;
        walkData.forEach(item => {
            if (item.tiempo_actividad) {
                const timeParts = item.tiempo_actividad.split(':');
                if (timeParts.length === 3) {
                    totalSeconds += (+timeParts[0]) * 3600 + (+timeParts[1]) * 60 + (+timeParts[2]);
                }
            }
        });

        return totalSeconds;
    }

    // Manejo de errores
    handleError(error) {
        console.error('Sensor Service Error:', error);
        if (error.response) {
            throw new Error(error.response.data.message || 'Error del servidor');
        } else if (error.request) {
            throw new Error('No se pudo conectar al servidor');
        } else {
            throw new Error('Error inesperado');
        }
    }
}

// Exportar una instancia del servicio (Singleton)
export default new SensorService();