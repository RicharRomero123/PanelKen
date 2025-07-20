// src/services/proveedorService.ts
import { CreateProveedorData, Proveedor, UpdateProveedorData } from '../types';
import axiosClient from '../lib/axiosClient';

/**
 * Obtiene todos los proveedores.
 */
export const getAllProveedores = async (): Promise<Proveedor[]> => {
    const response = await axiosClient.get<Proveedor[]>('/proveedores');
    return response.data;
};

/**
 * Obtiene un proveedor por su ID.
 * @param id - El ID del proveedor.
 */
export const getProveedorById = async (id: number): Promise<Proveedor> => {
    const response = await axiosClient.get<Proveedor>(`/proveedores/${id}`);
    return response.data;
};

/**
 * Crea un nuevo proveedor.
 * @param data - Datos del nuevo proveedor.
 */
export const createProveedor = async (data: CreateProveedorData): Promise<Proveedor> => {
    const response = await axiosClient.post<Proveedor>('/proveedores', data);
    return response.data;
};

/**
 * Actualiza un proveedor.
 * @param id - ID del proveedor a actualizar.
 * @param data - Datos a actualizar.
 */
export const updateProveedor = async (id: number, data: UpdateProveedorData): Promise<Proveedor> => {
    const response = await axiosClient.put<Proveedor>(`/proveedores/${id}`, data);
    return response.data;
};

/**
 * Elimina un proveedor.
 * @param id - ID del proveedor a eliminar.
 */
export const deleteProveedor = async (id: number): Promise<void> => {
    await axiosClient.delete(`/proveedores/${id}`);
};
