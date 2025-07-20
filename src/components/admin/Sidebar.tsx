'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Users, Shield, Server, Briefcase, FileText, BarChart2, History, LogOut, LayoutDashboard, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers } from '../../services/userService';
import { searchCuentas } from '../../services/cuentaService';
import { getListaVentasDiarias, getListaVentasMensuales } from '../../services/ventaCuentaService';


// Import services to fetch data for badges


// --- Confirmation Modal Component ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: 20, scale: 0.95 }} 
                className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-sm mx-4"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-red-500/10 rounded-full mb-4">
                        <AlertTriangle className="text-red-400" size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                    <p className="text-sm text-slate-400 mt-2 mb-6">{message}</p>
                    <div className="flex justify-center gap-3 w-full">
                        <button onClick={onClose} className="btn-secondary-dark w-full">Cancelar</button>
                        <button onClick={onConfirm} className="btn-danger-dark w-full">Confirmar</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};


export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    
    // States for notification counts
    const [userCount, setUserCount] = useState(0);
    const [accountCount, setAccountCount] = useState(0);
    const [salesCount, setSalesCount] = useState(0);

    const fetchCounts = useCallback(async () => {
        try {
            // Fetch all data in parallel
            const [usersData, accountsData, dailySalesData, monthlySalesData] = await Promise.all([
                getAllUsers(),
                searchCuentas({}),
                getListaVentasDiarias(),
                getListaVentasMensuales()
            ]);
            setUserCount(usersData.length);
            setAccountCount(accountsData.length);
            setSalesCount(dailySalesData.length + monthlySalesData.length);
        } catch (error) {
            console.error("Error fetching sidebar counts:", error);
        }
    }, []);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    const navItems = [
        { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/admin/usuarios', icon: Users, label: 'Trabajadores', count: userCount },
        { href: '/admin/servicios', icon: Shield, label: 'Servicios' },
        { href: '/admin/proveedores', icon: Briefcase, label: 'Proveedores' },
        { href: '/admin/clientes', icon: Users, label: 'Clientes' },
        { href: '/admin/cuentas', icon: Server, label: 'Cuentas', count: accountCount },
        { href: '/admin/reportes', icon: FileText, label: 'Reportes' },
        { href: '/admin/ventas', icon: BarChart2, label: 'Ventas', count: salesCount },
        { href: '/admin/historial', icon: History, label: 'Historial' },
    ];

    const handleLogout = () => {
        setIsLogoutModalOpen(false);
        logout();
    };

    return (
        <>
            {/* Overlay para cerrar el menú en móvil */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside 
                className={`fixed top-0 left-0 z-40 w-64 h-screen bg-slate-900 border-r border-slate-700/50 flex flex-col transition-transform duration-300 ease-in-out 
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0`}
            >
                <div className="flex items-center justify-between h-20 px-6 border-b border-slate-700/50">
                    <Link href="/admin/dashboard" className="text-2xl font-bold text-white tracking-wider">
                        AdminPanel
                    </Link>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white md:hidden" aria-label="Cerrar menú">
                        <X size={24} />
                    </button>
                </div>
                
                <nav className="flex-grow px-4 py-6 overflow-y-auto">
                    <ul className="space-y-2">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={onClose} // Cierra el menú al hacer clic en un enlace en móvil
                                        className={`flex items-center p-3 rounded-lg transition-colors duration-200 relative ${
                                            isActive 
                                            ? 'bg-blue-600/20 text-white' 
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-indicator"
                                                className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r-full"
                                            />
                                        )}
                                        <item.icon className="w-5 h-5 flex-shrink-0" />
                                        <span className="ml-4 font-medium">{item.label}</span>
                                        {item.count && item.count > 0 && (
                                            <span className="ml-auto text-xs font-semibold bg-blue-600 text-white rounded-full px-2 py-0.5">
                                                {item.count}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="px-4 py-6 border-t border-slate-700/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-blue-400">
                            {user?.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-grow overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{user?.nombre}</p>
                            <p className="text-xs text-slate-400">{user?.rolUsuario}</p>
                        </div>
                        <button 
                            onClick={() => setIsLogoutModalOpen(true)} 
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors flex-shrink-0"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </aside>
            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogout}
                title="Confirmar Cierre de Sesión"
                message="¿Estás seguro que quieres cerrar sesión?"
            />
            <style jsx global>{`
                .btn-secondary-dark { background-color: #334155; color: #e2e8f0; font-weight: 500; padding: 0.625rem 1.25rem; border-radius: 0.5rem; border: 1px solid #475569; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease-in-out; justify-content: center; }
                .btn-secondary-dark:hover { background-color: #475569; }
                .btn-danger-dark { background-color: #be123c; color: white; font-weight: 600; padding: 0.625rem 1.25rem; border-radius: 0.5rem; transition: all 0.2s ease-in-out; display: flex; align-items: center; gap: 0.5rem; justify-content: center; }
                .btn-danger-dark:hover { background-color: #9f1239; }
            `}</style>
        </>
    );
}
