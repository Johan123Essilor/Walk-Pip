// services/api.js
import axios from 'axios';

// Configuración base de axios
const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor para requests
// api.interceptors.request.use(
//     (config) => {
//         // Puedes añadir tokens de autenticación aquí
//         const token = localStorage.getItem('authToken');
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );

// Interceptor para responses
// api.interceptors.response.use(
//     (response) => {
//         return response;
//     },
//     (error) => {
//         // Manejo centralizado de errores
//         if (error.response?.status === 401) {
//             // Redirigir a login si no está autorizado
//             localStorage.removeItem('authToken');
//             window.location.href = '/login';
//         }
//         return Promise.reject(error);
//     }
// );

export default api;