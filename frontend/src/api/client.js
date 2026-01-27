import axios from 'axios';

// 1. Configuración Base (El "Hospital de Referencia")
// Aquí defines a dónde van todas las peticiones por defecto
const client = axios.create({
    baseURL: 'http://localhost:8000', // Tu Backend FastAPI
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Interceptor de Solicitudes (El "Triaje")
// Antes de que salga cualquier petición, este código verifica si tienes una credencial
client.interceptors.request.use(
    (config) => {
        // Buscamos el token en el almacenamiento seguro
        const token = localStorage.getItem('token');

        if (token) {
            // Si existe, lo "grapamos" a la petición como un Header de Autorización
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Interceptor de Respuestas (El "Diagnóstico")
// Si el servidor responde "401 No Autorizado", limpiamos la sesión automáticamente
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Si el token venció o es falso, cerramos sesión por seguridad
            localStorage.removeItem('token');
            // Notificar a la app que debe cerrar sesión (AuthContext escucha esto)
            window.dispatchEvent(new Event('auth:logout'));
        }
        return Promise.reject(error);
    }
);

export default client;
