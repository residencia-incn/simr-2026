import { api } from './api';
import client from '../api/client';

export const configService = {
    getConfig: async () => {
        // Intentamos usar el cliente de axios para los nuevos endpoints
        const res = await client.get('/config/');
        return res.data;
    },

    updateConfig: async (data) => {
        const res = await client.put('/config/', data);
        return res.data;
    },

    getModalities: async () => {
        const res = await client.get('/config/modalities');
        return res.data;
    },

    createModality: async (data) => {
        const res = await client.post('/config/modalities', data);
        return res.data;
    }
};
