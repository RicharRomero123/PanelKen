// src/services/reporteCuentaService.ts
import axiosClient from '../lib/axiosClient';
import { ReporteCuenta, CreateReporteCuentaData } from '../types';

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
