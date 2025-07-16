// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
// Usamos una ruta relativa para máxima compatibilidad
import { User } from '../types'; 

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        try {
            const userCookie = Cookies.get('user');

            // --- SOLUCIÓN AL ERROR ---
            // Se añade una comprobación para asegurar que la cookie no solo exista,
            // sino que tampoco sea el string "undefined" antes de parsearla.
            if (userCookie && userCookie !== 'undefined') {
                setUser(JSON.parse(userCookie));
            } else if (userCookie === 'undefined') {
                // Si la cookie es "undefined", la limpiamos para evitar futuros errores.
                Cookies.remove('user');
                Cookies.remove('jwtToken');
            }
        } catch (error) {
            console.error("No se pudo parsear la cookie de usuario:", error);
            // Si hay un error de parseo (ej. cookie malformada), es mejor limpiar.
            Cookies.remove('user');
            Cookies.remove('jwtToken');
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = () => {
        Cookies.remove('user');
        Cookies.remove('jwtToken');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
