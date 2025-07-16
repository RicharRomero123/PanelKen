// src/services/userService.ts
import axiosClient from '../lib/axiosClient';
import { User, UpdateUserData } from '../types';

/**
 * Obtiene todos los usuarios.
 */
export const getAllUsers = async (): Promise<User[]> => {
    const response = await axiosClient.get<User[]>('/usuarios');
    return response.data;
};

/**
 * Obtiene un usuario por su ID.
 * @param id - El ID del usuario.
 */
export const getUserById = async (id: number): Promise<User> => {
    const response = await axiosClient.get<User>(`/usuarios/${id}`);
    return response.data;
};

/**
 * Actualiza un usuario.
 * @param id - El ID del usuario a actualizar.
 * @param data - Los datos a actualizar.
 */
export const updateUser = async (id: number, data: UpdateUserData): Promise<User> => {
    const response = await axiosClient.put<User>(`/usuarios/${id}`, data);
    return response.data;
};

/**
 * Elimina un usuario.
 * @param id - El ID del usuario a eliminar.
 */
export const deleteUser = async (id: number): Promise<void> => {
    await axiosClient.delete(`/usuarios/${id}`);
};
