// src/lib/axiosClient.ts
import axios from 'axios';

const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para añadir el token de autenticación a las cabeceras
axiosClient.interceptors.request.use(
    (config) => {
        // --- LÓGICA DE TOKEN JWT (COMENTADA PARA DESARROLLO INICIAL) ---
        // Cuando estés listo para implementar la autenticación con JWT,
        // puedes descomentar este bloque.
        /*
        const token = Cookies.get('jwtToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        */
        return config;
    },
    (error) => {
        // Manejo de errores en la petición
        return Promise.reject(error);
    }
);

export default axiosClient;
