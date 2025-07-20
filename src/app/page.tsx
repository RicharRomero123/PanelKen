// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
// CORRECCIÓN: Se elimina la importación de 'RolUsuario' para evitar el error de compilación.

/**
 * Página raíz de la aplicación.
 * Actúa como un enrutador principal basado en el estado de autenticación y el rol del usuario.
 * Muestra una pantalla de carga mientras se verifica la sesión.
 */
const HomePage: React.FC = () => {
  const router = useRouter();
  // Obtenemos el usuario y el estado de carga del contexto.
  const { user, loading } = useAuth();

  useEffect(() => {
    // Solo actuamos cuando el estado de carga del contexto haya finalizado.
    if (!loading) {
      if (!user) {
        // Si no hay un usuario autenticado, lo redirigimos a la página de login.
        router.push('/login');
      } else {
        // Si hay un usuario, lo redirigimos según su rol.
        // CORRECCIÓN: Se compara directamente con un string en lugar de usar el enum.
        if (user.rolUsuario === 'ADMIN') {
          // Los administradores son dirigidos al dashboard principal del panel.
          router.push('/admin/dashboard');
        } else if (user.rolUsuario === 'TRABAJADOR') {
          // Los trabajadores son dirigidos a su propio panel.
          router.push('/panel');
        } else {
          // Como caso por defecto, si un usuario tiene un rol no reconocido,
          // lo enviamos de vuelta al login.
          router.push('/login');
        }
      }
    }
  }, [user, loading, router]);

  // Muestra un indicador de carga visualmente atractivo mientras se procesa la redirección.
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
            <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-6 text-xl font-semibold text-gray-700 dark:text-gray-300">Cargando su sesión...</p>
        </div>
    </div>
  );
};

export default HomePage;
