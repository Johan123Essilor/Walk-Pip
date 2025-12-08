// sensorService.js - Versión SIMPLIFICADA
import api from './api';

class SensorService {

    // Obtener últimas 10 métricas de corazón
    async getUltimasMetricasCorazon() {
        try {
            const response = await api.get('/metrics/metricas/corazon/ultimas/');
            return response.data || [];
        } catch (error) {
            console.error('❌ Error obteniendo métricas de corazón:', error);
            return []; // Devolver array vacío en caso de error
        }
    }

    // Obtener últimas 10 métricas de caminata
    async getUltimasMetricasCaminata() {
        try {
            const response = await api.get('/metrics/metricas/caminata/ultimas/');
            return response.data || [];
        } catch (error) {
            console.error('❌ Error obteniendo métricas de caminata:', error);
            return [];
        }
    }

    // Obtener resumen total
    async getResumenMetricas() {
        try {
            const response = await api.get('/metrics/metricas/resumen/');
            return response.data || {};
        } catch (error) {
            console.error('❌ Error obteniendo resumen:', error);
            return {
                caminata: {
                    total_pasos: 0,
                    total_km: 0,
                    total_calorias: 0,
                    promedio_velocidad: 0,
                    ultimos_pasos: 0,
                    ultimos_km: 0,
                    ultimas_calorias: 0
                },
                corazon: {
                    promedio_ritmo: 0,
                    promedio_oxigenacion: 0,
                    ultimo_ritmo: 0,
                    ultima_oxigenacion: 0
                }
            };
        }
    }

    // Obtener todo para el dashboard (simultáneo)
    async getDashboardData() {
        try {
            const [corazonData, caminataData, resumenData] = await Promise.all([
                this.getUltimasMetricasCorazon(),
                this.getUltimasMetricasCaminata(),
                this.getResumenMetricas()
            ]);

            return {
                corazon: corazonData,
                caminata: caminataData,
                resumen: resumenData,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error cargando dashboard:', error);
            return {
                corazon: [],
                caminata: [],
                resumen: {},
                timestamp: new Date().toISOString()
            };
        }
    }

    // Manejo simple de errores
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