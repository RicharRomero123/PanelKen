// src/services/clienteService.ts
import { Cliente, CreateClienteData, UpdateClienteData } from '../types';
import axiosClient from '../lib/axiosClient';

/**
 * Obtiene todos los clientes.
 */
export const getAllClientes = async (): Promise<Cliente[]> => {
    const response = await axiosClient.get<Cliente[]>('/clientes');
    return response.data;
};

/**
 * Obtiene un cliente por su ID.
 * @param id - El ID del cliente.
 */
export const getClienteById = async (id: number): Promise<Cliente> => {
    const response = await axiosClient.get<Cliente>(`/clientes/${id}`);
    return response.data;
};

/**
 * Crea un nuevo cliente.
 * @param data - Datos del nuevo cliente.
 */
export const createCliente = async (data: CreateClienteData): Promise<Cliente> => {
    const response = await axiosClient.post<Cliente>('/clientes', data);
    return response.data;
};

/**
 * Actualiza un cliente.
 * @param id - ID del cliente a actualizar.
 * @param data - Datos a actualizar.
 */
export const updateCliente = async (id: number, data: UpdateClienteData): Promise<Cliente> => {
    const response = await axiosClient.put<Cliente>(`/clientes/${id}`, data);
    return response.data;
};

/**
 * Elimina un cliente.
 * @param id - ID del cliente a eliminar.
 */
export const deleteCliente = async (id: number): Promise<void> => {
    await axiosClient.delete(`/clientes/${id}`);
};
