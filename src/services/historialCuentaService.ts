// src/services/historialCuentaService.ts
import axiosClient from '../lib/axiosClient';
import { HistorialCuenta } from '../types';

/**
 * Obtiene todo el historial de cambios de cuentas.
 */
export const getAllHistorial = async (): Promise<HistorialCuenta[]> => {
    const response = await axiosClient.get<HistorialCuenta[]>('/historial');
    return response.data;
};

/**
 * Obtiene un registro del historial por su ID.
 * @param id - El ID del registro del historial.
 */
export const getHistorialById = async (id: number): Promise<HistorialCuenta> => {
    const response = await axiosClient.get<HistorialCuenta>(`/historial/${id}`);
    return response.data;
};

/**
 * Obtiene el historial de una cuenta específica.
 * @param cuentaId - El ID de la cuenta.
 */
export const getHistorialByCuentaId = async (cuentaId: number): Promise<HistorialCuenta[]> => {
    const response = await axiosClient.get<HistorialCuenta[]>(`/historial/cuenta/${cuentaId}`);
    return response.data;
};
