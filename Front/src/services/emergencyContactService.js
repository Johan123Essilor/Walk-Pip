// services/emergencyContactService.js
import api from './api';

class EmergencyContactService {

    // Obtener todos los contactos de emergencia
    async getEmergencyContacts(userId = null) {
        try {
            const params = userId ? { userId } : {};
            console.log('Fetching contacts for user:', userId);
            const response = await api.get(`/users/contacto-emergencia/?user_email=${userId}`, { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Obtener un contacto específico por ID
    async getContactById(contactId) {
        try {
            const response = await api.get(`/emergency-contacts/${contactId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Crear un nuevo contacto de emergencia
    async createContact(contactData, userEmail = null) {
        try {
            console.log('Creating contact with data:', contactData);
            // Validación básica
            this.validateContactData(contactData);

            const response = await api.post(`/users/contacto-emergencia/?user_email=${userEmail}`, contactData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Actualizar un contacto existente
    async updateContact(contactId, contactData, userEmail) {
        try {
            this.validateContactData(contactData);

            const response = await api.put(`/users/contacto-emergencia/?user_email=${userEmail}`, contactData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Eliminar un contacto
    async deleteContact(contactId) {
        try {
            const response = await api.delete(`/emergency-contacts/${contactId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Buscar contactos por criterios
    async searchContacts(searchCriteria) {
        try {
            const response = await api.get('/emergency-contacts/search', {
                params: searchCriteria
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Validar datos del contacto
    validateContactData(contactData) {
        const errors = [];

        if (!contactData.nombre_contacto || contactData.nombre_contacto.trim() === '') {
            errors.push('El nombre es obligatorio');
        }

        if (!contactData.telefono || contactData.telefono.trim() === '') {
            errors.push('El teléfono es obligatorio');
        } else if (!this.isValidPhone(contactData.telefono)) {
            errors.push('El formato del teléfono no es válido');
        }

        if (contactData.correo && !this.isValidEmail(contactData.correo)) {
            errors.push('El formato del email no es válido');
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }

    // Validar formato de teléfono
    isValidPhone(phone) {
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
        return phoneRegex.test(phone);
    }

    // Validar formato de email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Formatear número de teléfono
    formatPhone(phone) {
        // Eliminar todos los caracteres no numéricos excepto el +
        return phone.replace(/[^\d+]/g, '');
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
            return new Error(error.message || 'Error inesperado');
        }
    }

    // Simulación de datos para desarrollo (opcional)
    getMockContacts() {
        return [
            {
                id: 1,
                nombre_contacto: 'Juan Pérez',
                telefono: '+1234567890',
                parentesco: 'Padre',
                correo: 'juan@example.com',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 2,
                nombre_contacto: 'María García',
                telefono: '+0987654321',
                parentesco: 'Madre',
                correo: 'maria@example.com',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
    }
}

// Exportar una instancia del servicio (Singleton)
export default new EmergencyContactService();