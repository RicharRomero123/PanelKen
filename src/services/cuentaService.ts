import axiosClient from '../lib/axiosClient';
import { Cuenta, CreateCuentaData, UpdateCuentaData, AsignarCuentaData, AsignarLoteData, CambiarCuentaParams, SearchCuentasParams, HistorialCuenta, Venta, AsignarPerfilesData } from '../types';

/**
 * Obtiene todas las cuentas.
 */
export const getAllCuentas = async (): Promise<Cuenta[]> => {
    const response = await axiosClient.get<Cuenta[]>('/cuentas');
    return response.data;
};

/**
 * Busca cuentas según parámetros.
 * @param params - Parámetros de búsqueda (status, servicioId, clienteId).
 */
export const searchCuentas = async (params: SearchCuentasParams): Promise<Cuenta[]> => {
    const response = await axiosClient.get<Cuenta[]>('/cuentas/search', { params });
    return response.data;
};

/**
 * Obtiene una cuenta por su ID.
 * @param id - El ID de la cuenta.
 */
export const getCuentaById = async (id: number): Promise<Cuenta> => {
    const response = await axiosClient.get<Cuenta>(`/cuentas/${id}`);
    return response.data;
};

/**
 * Crea una nueva cuenta.
 * @param data - Datos de la nueva cuenta.
 */
export const createCuenta = async (data: Partial<CreateCuentaData>): Promise<Cuenta> => {
    const response = await axiosClient.post<Cuenta>('/cuentas', data);
    return response.data;
};

/**
 * Actualiza una cuenta.
 * @param id - ID de la cuenta a actualizar.
 * @param data - Datos a actualizar.
 */
export const updateCuenta = async (id: number, data: UpdateCuentaData): Promise<Cuenta> => {
    const response = await axiosClient.put<Cuenta>(`/cuentas/${id}`, data);
    return response.data;
};

/**
 * Elimina una cuenta.
 * @param id - ID de la cuenta a eliminar.
 */
export const deleteCuenta = async (id: number): Promise<void> => {
    await axiosClient.delete(`/cuentas/${id}`);
};

/**
 * Marca las cuentas vencidas automáticamente.
 */
export const vencerCuentasAutomatico = async (): Promise<Cuenta[]> => {
    const response = await axiosClient.post<Cuenta[]>('/cuentas/vencer-automatico');
    return response.data;
};

/**
 * Cambia una cuenta por otra.
 * @param params - Parámetros para el cambio de cuenta.
 */
export const cambiarCuenta = async (params: CambiarCuentaParams): Promise<HistorialCuenta> => {
    const response = await axiosClient.post<HistorialCuenta>('/cuentas/cambiar', null, { params });
    return response.data;
};

/**
 * Asigna una cuenta INDIVIDUAL a un cliente.
 * @param data - Datos de la asignación.
 */
export const asignarCuenta = async (data: AsignarCuentaData): Promise<Venta> => {
    const response = await axiosClient.post<Venta>('/cuentas/asignar', data);
    return response.data;
};

/**
 * NUEVA FUNCIÓN: Asigna perfiles de una cuenta COMPLETA a un cliente.
 * @param data - Datos de la asignación de perfiles.
 */
export const asignarPerfiles = async (data: AsignarPerfilesData): Promise<Cuenta> => {
    const response = await axiosClient.post<Cuenta>('/cuentas/asignar-perfiles', data);
    return response.data;
};

/**
 * Asigna un lote de cuentas a un cliente.
 * @param data - Datos de la asignación en lote.
 */
export const asignarLoteCuentas = async (data: AsignarLoteData): Promise<Venta[]> => {
    const response = await axiosClient.post<Venta[]>('/cuentas/asignar-lote', data);
    return response.data;
};
