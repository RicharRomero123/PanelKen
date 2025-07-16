// src/services/dashboardService.ts
import axiosClient from '../lib/axiosClient';
import { DashboardData } from '../types';

/**
 * Obtiene los datos agregados para el panel de dashboard.
 * Llama al endpoint /dashboard de la API.
 * @returns Una promesa que se resuelve con los datos del dashboard.
 */
export const getDashboardData = async (): Promise<DashboardData> => {
    try {
        const response = await axiosClient.get<DashboardData>('/dashboard');
        return response.data;
    } catch (error) {
        console.error('Error al obtener los datos del dashboard:', error);
        // En un caso real, podrías manejar el error de una forma más específica
        // o lanzar un error personalizado.
        throw new Error('No se pudieron obtener los datos para el dashboard.');
    }
};
