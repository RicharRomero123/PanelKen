// src/components/admin/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Calendar, Clock, Menu } from 'lucide-react';

// Se definen las props que el componente espera recibir.
interface HeaderProps {
    toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
    const { user, logout, loading } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    const formattedDate = currentTime.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const formattedTime = currentTime.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <header className="bg-slate-900 border-b border-slate-700/50 p-4 flex justify-between items-center sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <button 
                    onClick={toggleSidebar} 
                    className="p-2 rounded-full text-slate-400 hover:bg-slate-700/50 hover:text-white md:hidden"
                    aria-label="Abrir menú"
                >
                    <Menu className="w-6 h-6" />
                </button>
                
                <div className="hidden md:flex items-center gap-4 text-slate-400">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} />
                        <span className="text-sm font-medium capitalize">{formattedDate}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <div className="flex items-center gap-2">
                        <Clock size={18} />
                        <span className="text-sm font-medium">{formattedTime}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {loading ? (
                     <div className="w-32 h-10 bg-slate-700 rounded-md animate-pulse"></div>
                ) : user ? (
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-white">{user.nombre}</p>
                            <p className="text-xs text-slate-400">{user.rolUsuario}</p>
                        </div>
                         <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-blue-400">
                            {user.nombre.charAt(0).toUpperCase()}
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 rounded-full text-slate-400 hover:bg-slate-700/50 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-slate-600 transition-colors"
                            aria-label="Cerrar sesión"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                     <div className="w-24 h-8 bg-slate-700 rounded-md animate-pulse"></div>
                )}
            </div>
        </header>
    );
}
