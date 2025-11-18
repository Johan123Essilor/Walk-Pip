// services/rutasService.js
import api from './api';

class RutasService {
    // Obtener todas las rutas
    async getRutas(filtros = {}) {
        try {
            const response = await api.get('/trail/rutas/', { params: filtros });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Obtener una ruta por ID
    async getRutaById(id) {
        try {
            const response = await api.get(`/trail/rutas//${id}/`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Crear una nueva ruta
    async createRuta(rutaData) {
        try {
            const response = await api.post('/trail/rutas/', rutaData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Actualizar una ruta
    async updateRuta(id, rutaData) {
        try {
            const response = await api.put(`/trail/rutas/${id}`, rutaData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Eliminar una ruta
    async deleteRuta(id) {
        try {
            const response = await api.delete(`/trail/rutas/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Buscar rutas por criterios
    async searchRutas(query, filtros = {}) {
        try {
            const response = await api.get('/trail/rutas/search', {
                params: { q: query, ...filtros }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Manejo centralizado de errores
    handleError(error) {
        if (error.response) {
            // Error del servidor
            const message = error.response.data?.message || 'Error del servidor';
            return new Error(message);
        } else if (error.request) {
            // Error de conexión
            return new Error('Error de conexión con el servidor');
        } else {
            // Error inesperado
            return new Error('Error inesperado');
        }
    }
}

// Exportar una instancia del servicio (Singleton)
export default new RutasService();