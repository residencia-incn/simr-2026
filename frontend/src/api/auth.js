import client from './client';

export const authService = {
    // Función para Iniciar Sesión
    login: async ({ email, password }) => {
        // FastAPI espera los datos de login usualmente como form-data o json
        // Según tu esquema UserLogin, enviaremos JSON
        // Enviar 'email' en lugar de 'username' para coincidir con backend Pydantic
        const response = await client.post('/auth/login', {
            email,
            password
        });

        // Si el login es exitoso, guardamos el token
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            // Guardamos también los datos del usuario (roles, permisos)
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // Función para Cerrar Sesión
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Obtener usuario actual
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        if (userStr) return JSON.parse(userStr);
        return null;
    },

    // Validar identidad (Paso 1)
    validateIdentity: async (data) => {
        const response = await client.post('/auth/validate-identity', data);
        return response.data;
    },

    // Registro con Archivo (Paso 3) - Ahora va a "Sala de Espera"
    registerWithFile: async (formData) => {
        const response = await client.post('/auth/register-request', formData, {
            headers: {
                'Content-Type': undefined
            }
        });
        return response.data;
    }
};
