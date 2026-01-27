import client from './client'; // Tu instancia de Axios configurada

export const userService = {
    // Obtener la "Historia Clínica" completa del usuario
    getDetail: async (userId) => {
        const response = await client.get(`/users/${userId}`);
        return response.data;
    },

    // Actualizar permisos (Cirugía de acceso)
    updatePermissions: async (userId, modules, permissions) => {
        // Nota: El backend usa PUT /users/{id} para esto en la implementación actual
        const response = await client.put(`/users/${userId}`, {
            modules,
            permissions
        });
        return response.data;
    },

    // Nivel 3.1: Gestión Unificada de Acceso
    updateAccess: async (userId, roles, modules) => {
        const response = await client.put(`/users/${userId}/access`, {
            roles,
            modules
        });
        return response.data;
    },

    // Resetear contraseña (Código Rojo)
    resetPassword: async (userId, newPassword) => {
        // Nota: El backend usa /reset-password (con guion)
        const response = await client.post(`/users/${userId}/reset-password`, {
            password: newPassword
        });
        return response.data;
    },

    // Dar de baja (Soft Delete)
    deactivate: async (userId) => {
        const response = await client.delete(`/users/${userId}`);
        return response.data;
    }
};
