import axios from 'axios';
import axiosClient from '../lib/axiosClient';
import { Cuenta, CreateCuentaData, UpdateCuentaData, SearchCuentasParams, AsignarCuentaData, AsignarPerfilesData, CambiarCuentaParams, PerfilAsignado, PerfilVencido } from '../types'; // Asumiendo que tienes un archivo de tipos central


// --- FUNCIONES DEL SERVICIO ---

export const getAllCuentas = async (): Promise<Cuenta[]> => {
    const response = await axiosClient.get<Cuenta[]>('/cuentas');
    return response.data;
};

export const searchCuentas = async (params: SearchCuentasParams): Promise<Cuenta[]> => {
    const response = await axiosClient.get<Cuenta[]>('/cuentas/search', { params });
    return response.data;
};


// --- ¡NUEVA FUNCIÓN! ---
/**
 * Obtiene los perfiles asignados de una cuenta específica.
 * @param cuentaId - El ID de la cuenta.
 */
export const getPerfilesByCuentaId = async (cuentaId: number): Promise<PerfilAsignado[]> => {
  const response = await axiosClient.get<PerfilAsignado[]>(`/cuentas/${cuentaId}/perfiles`);
  return response.data;
};

export const getPerfilesVencidos = async (): Promise<PerfilVencido[]> => {
  const response = await axiosClient.get<PerfilVencido[]>('/cuentas/perfiles/vencidos');
  return response.data;
};

export const createCuenta = async (data: CreateCuentaData): Promise<Cuenta> => {
    const response = await axiosClient.post<Cuenta>('/cuentas', data);
    return response.data;
};

export const updateCuenta = async (id: number, data: UpdateCuentaData): Promise<Cuenta> => {
    const response = await axiosClient.put<Cuenta>(`/cuentas/${id}`, data);
    return response.data;
};

export const deleteCuenta = async (id: number): Promise<void> => {
    await axiosClient.delete(`/cuentas/${id}`);
};

export const asignarPerfiles = async (data: AsignarPerfilesData): Promise<any> => {
    const response = await axiosClient.post('/cuentas/asignar-perfiles', data);
    return response.data;
};

export const asignarCuenta = async (data: AsignarCuentaData): Promise<any> => {
    const response = await axiosClient.post('/cuentas/asignar', data);
    return response.data;
};

export const cambiarCuenta = async (params: CambiarCuentaParams): Promise<any> => {
    const response = await axiosClient.post('/cuentas/cambiar', { params });
    return response.data;
};
export const liberarPerfil = async (perfilId: number) => {
  try {
    const response = await axiosClient.patch(`/cuentas/perfiles/${perfilId}/liberar`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const renovarPerfil = async (perfilId: number, nuevoPrecio: number, usuarioId: number): Promise<any> => {
    try {
        const response = await axiosClient.patch(`/cuentas/perfiles/${perfilId}/renovar-suscripcion`, {
            nuevoPrecioVenta: nuevoPrecio,
            usuarioId: usuarioId
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
export const renovarCuentaCompleta = async (cuentaId: number, nuevoPrecio: number, usuarioId: number): Promise<any> => {
    try {
        const response = await axiosClient.patch(`/cuentas/${cuentaId}/renovar-suscripcion`, {
            nuevoPrecioVenta: nuevoPrecio,
            usuarioId: usuarioId
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};