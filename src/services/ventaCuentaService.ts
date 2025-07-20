// src/services/ventaCuentaService.ts
import { Venta, VentaResumen } from '../types';
import axiosClient from '../lib/axiosClient';

/**
 * Obtiene el resumen de ventas mensuales.
 */
export const getResumenVentasMensuales = async (): Promise<VentaResumen> => {
    const response = await axiosClient.get<VentaResumen>('/ventas/mensuales/resumen');
    return response.data;
};

/**
 * Obtiene la lista de ventas mensuales.
 */
export const getListaVentasMensuales = async (): Promise<Venta[]> => {
    const response = await axiosClient.get<Venta[]>('/ventas/mensuales/lista');
    return response.data;
};

/**
 * Obtiene el resumen de ventas diarias.
 */
export const getResumenVentasDiarias = async (): Promise<VentaResumen> => {
    const response = await axiosClient.get<VentaResumen>('/ventas/diarias/resumen');
    return response.data;
};

/**
 * Obtiene la lista de ventas diarias.
 */
export const getListaVentasDiarias = async (): Promise<Venta[]> => {
    const response = await axiosClient.get<Venta[]>('/ventas/diarias/lista');
    return response.data;
};
