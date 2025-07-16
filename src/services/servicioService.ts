// src/services/servicioService.ts
import axiosClient from '../lib/axiosClient';
import { Servicio, CreateServicioData, UpdateServicioData } from '../types';

/**
 * Obtiene todos los servicios.
 */
export const getAllServicios = async (): Promise<Servicio[]> => {
    const response = await axiosClient.get<Servicio[]>('/servicios');
    return response.data;
};

/**
 * Obtiene un servicio por su ID.
 * @param id - El ID del servicio.
 */
export const getServicioById = async (id: number): Promise<Servicio> => {
    const response = await axiosClient.get<Servicio>(`/servicios/${id}`);
    return response.data;
};

/**
 * Crea un nuevo servicio.
 * @param data - Datos del nuevo servicio.
 */
export const createServicio = async (data: CreateServicioData): Promise<Servicio> => {
    const response = await axiosClient.post<Servicio>('/servicios', data);
    return response.data;
};

/**
 * Actualiza un servicio.
 * @param id - ID del servicio a actualizar.
 * @param data - Datos a actualizar.
 */
export const updateServicio = async (id: number, data: UpdateServicioData): Promise<Servicio> => {
    const response = await axiosClient.put<Servicio>(`/servicios/${id}`, data);
    return response.data;
};

/**
 * Elimina un servicio.
 * @param id - ID del servicio a eliminar.
 */
export const deleteServicio = async (id: number): Promise<void> => {
    await axiosClient.delete(`/servicios/${id}`);
};
