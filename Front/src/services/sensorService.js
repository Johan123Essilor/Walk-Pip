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

    // Obtener alertas con filtro por tipo
    async getAlertas(tipo = null) {
        try {
            let url = '/metrics/alertas/';
            if (tipo) {
                url += `?tipo=${tipo}`;
            }
            const response = await api.get(url);
            return response.data || { alertas: [], totales: { no_leidas: 0, totales: 0 } };
        } catch (error) {
            console.error('❌ Error obteniendo alertas:', error);
            return { alertas: [], totales: { no_leidas: 0, totales: 0 } };
        }
    }

    // Obtener estadísticas de alertas
    async getEstadisticasAlertas() {
        try {
            const response = await api.get('/metrics/alertas/estadisticas/');
            return response.data || {
                total_alertas: 0,
                por_tipo: {},
                por_severidad: {},
                ultimas_24h: 0
            };
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return {};
        }
    }

    // Marcar alertas como leídas
    async marcarAlertasLeidas() {
        try {
            await api.get('/metrics/alertas/?marcar_leidas=true');
            return true;
        } catch (error) {
            console.error('❌ Error marcando alertas:', error);
            return false;
        }
    }

    // Obtener todo para el dashboard incluyendo alertas
    async getDashboardData() {
        try {
            const [corazonData, caminataData, resumenData, alertasData] = await Promise.all([
                this.getUltimasMetricasCorazon(),
                this.getUltimasMetricasCaminata(),
                this.getResumenMetricas(),
                this.getAlertas()
            ]);

            return {
                corazon: corazonData,
                caminata: caminataData,
                resumen: resumenData,
                alertas: alertasData.alertas,
                totalAlertasNoLeidas: alertasData.totales.no_leidas,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error cargando dashboard:', error);
            return {
                corazon: [],
                caminata: [],
                resumen: {},
                alertas: [],
                totalAlertasNoLeidas: 0,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Exportar una instancia del servicio (Singleton)
export default new SensorService();