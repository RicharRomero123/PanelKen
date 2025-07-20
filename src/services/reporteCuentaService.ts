// src/services/reporteCuentaService.ts
import { CreateReporteCuentaData, ReemplazarPayload, ReportarPayload, ReporteCuenta } from '../types';
import axiosClient from '../lib/axiosClient';

/**
 * Obtiene todos los reportes.
 */
export const getAllReportes = async (): Promise<ReporteCuenta[]> => {
    const response = await axiosClient.get<ReporteCuenta[]>('/reportes');
    return response.data;
};

/**
 * Obtiene un reporte por su ID.
 * @param id - El ID del reporte.
 */
export const getReporteById = async (id: number): Promise<ReporteCuenta> => {
    const response = await axiosClient.get<ReporteCuenta>(`/reportes/${id}`);
    return response.data;
};

/**
 * Crea un nuevo reporte.
 * @param data - Datos del nuevo reporte.
 */
export const createReporte = async (data: CreateReporteCuentaData): Promise<ReporteCuenta> => {
    const response = await axiosClient.post<ReporteCuenta>('/reportes', data);
    return response.data;
};


export const reportarCuenta = async (cuentaId: number, data: ReportarPayload): Promise<any> => {
    const response = await axiosClient.post(`/cuentas/${cuentaId}/reportar`, data);
    return response.data;
};

export const reemplazarCuentaIndividual = async (cuentaId: number, data: ReemplazarPayload): Promise<any> => {
    const response = await axiosClient.post(`/cuentas/${cuentaId}/reemplazar-individual`, data);
    return response.data;
};

export const reemplazarCuentaCompleta = async (cuentaId: number, data: ReemplazarPayload): Promise<any> => {
    const response = await axiosClient.post(`/cuentas/${cuentaId}/reemplazar-completa`, data);
    return response.data;
};

