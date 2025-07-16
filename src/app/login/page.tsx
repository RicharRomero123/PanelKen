// src/app/login/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { login } from '../../services/authService'; 

export default function LoginPage() {
    const [credentials, setCredentials] = useState({
        correo: '',
        password: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // La función 'login' del servicio ahora solo devuelve el objeto 'user'
            const user = await login(credentials);

            // Verificamos que el objeto 'user' exista y tenga un rol
            if (user && user.rolUsuario) {
                // Ya no se maneja un 'jwtToken', solo guardamos la cookie del usuario
                Cookies.set('user', JSON.stringify(user), { expires: 7, secure: true, sameSite: 'strict' });

                if (user.rolUsuario === 'ADMIN') {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/panel'); 
                }
            } else {
                // Si la API no devuelve un usuario válido, lanzamos un error
                throw new Error("La respuesta del servidor no contiene datos de usuario válidos.");
            }

        } catch (err: any) {
            console.error('Error de inicio de sesión:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Credenciales incorrectas o error en el servidor.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg dark:bg-gray-800">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Iniciar Sesión</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Bienvenido de nuevo a tu panel
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {/* El JSX del formulario sigue siendo el mismo */}
                    <div className="relative">
                         <label htmlFor="correo" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-300">Correo Electrónico</label>
                        <input id="correo" name="correo" type="email" required value={credentials.correo} onChange={handleChange} className="w-full px-4 py-3 text-gray-900 bg-transparent border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:border-gray-600" placeholder="tu@correo.com"/>
                    </div>
                    <div className="relative mt-4">
                         <label htmlFor="password" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-300">Contraseña</label>
                        <input id="password" name="password" type="password" required value={credentials.password} onChange={handleChange} className="w-full px-4 py-3 text-gray-900 bg-transparent border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:border-gray-600" placeholder="••••••••"/>
                    </div>
                    {error && (<div className="p-3 text-sm text-center text-red-800 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300">{error}</div>)}
                    <div>
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800">
                            {isLoading ? 'Cargando...' : 'Ingresar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
