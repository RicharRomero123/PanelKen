// src/services/authService.ts
import { LoginCredentials, RegisterData, User } from '../types';
import axiosClient from '../lib/axiosClient';

/**
 * Registra un nuevo usuario.
 * @param data - Datos para el registro.
 */
export const register = async (data: RegisterData): Promise<User> => {
    const response = await axiosClient.post<User>('/auth/register', data);
    return response.data;
};

/**
 * Inicia sesión de un usuario.
 * @param credentials - Credenciales de inicio de sesión.
 */
export const login = async (credentials: LoginCredentials): Promise<User> => {
    // La respuesta de la API es directamente el objeto User, no un objeto con token y user.
    const response = await axiosClient.post<User>('/auth/login', credentials);
    return response.data;
};

