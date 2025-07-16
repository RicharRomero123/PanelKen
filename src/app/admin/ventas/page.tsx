'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getResumenVentasMensuales, getListaVentasMensuales, getResumenVentasDiarias, getListaVentasDiarias } from '../../../services/ventaCuentaService';
import { getAllClientes } from '../../../services/clienteService';
import { getAllServicios } from '../../../services/servicioService';
import { searchCuentas } from '../../../services/cuentaService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { DollarSign, TrendingUp, Calendar, RefreshCw, ChevronLeft, ChevronRight, ShoppingCart, AlertTriangle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

enum RolUsuario {
    ADMIN = "ADMIN",
    TRABAJADOR = "TRABAJADOR",
}

interface Venta { 
    id: number; 
    cuentaId: number; 
    clienteId: number; 
    precioVenta: number; 
    fechaVenta: string; 
    tipoCliente: string; 
    usuarioAsignadorId: number; 
}

interface VentaResumen { 
    fecha: string; 
    totalVentas: number; 
    ganancia: number; 
}

interface Cliente { 
    id: number; 
    nombre: string; 
    apellido: string; 
}

interface Servicio { 
    id: number; 
    nombre: string; 
    urlImg: string; 
}

interface Cuenta { 
    id: number; 
    correo: string; 
    servicioId: number; 
}

const StatCard = ({ title, value, unit, icon: Icon, gradient, formatAsCurrency = false }: { 
    title: string; 
    value: number; 
    unit?: string;
    icon: React.ElementType; 
    gradient: string; 
    formatAsCurrency?: boolean 
}) => (
    <div className="relative overflow-hidden rounded-xl bg-slate-800/60 p-5 shadow-lg backdrop-blur-sm border border-slate-700/80">
        <div className={`absolute top-0 right-0 -m-2 h-16 w-16 opacity-10 ${gradient}`}></div>
        <div className="flex items-center">
            <div className={`p-3 rounded-lg mr-4 ${gradient}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-400">{title}</p>
                <p className="text-2xl font-bold text-white">
                    {formatAsCurrency ? `S/ ${value.toFixed(2)}` : value}
                    {unit && <span className="text-base font-normal text-slate-300 ml-2">{unit}</span>}
                </p>
            </div>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-3 rounded-lg shadow-lg">
          <p className="label text-white font-bold">{`${label}`}</p>
          <p className="intro text-cyan-400">{`Ganancia : S/ ${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
};

export default function VentasPage() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [dailySummary, setDailySummary] = useState<VentaResumen | null>(null);
    const [monthlySummary, setMonthlySummary] = useState<VentaResumen | null>(null);
    const [dailySales, setDailySales] = useState<Venta[]>([]);
    const [monthlySales, setMonthlySales] = useState<Venta[]>([]);
    const [clients, setClients] = useState<Cliente[]>([]);
    const [services, setServices] = useState<Servicio[]>([]);
    const [accounts, setAccounts] = useState<Cuenta[]>([]);
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [view, setView] = useState<'daily' | 'monthly'>('daily');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const isAuthorized = useMemo(() => {
        return isAuthenticated && user?.rolUsuario === RolUsuario.ADMIN;
    }, [isAuthenticated, user]);

    const fetchData = useCallback(async () => {
        if (!isAuthorized) return;
        
        setDataLoading(true);
        const loadingToast = toast.loading("Actualizando datos...");
        try {
            const [ds, ms, dl, ml, cl, sl, al] = await Promise.all([
                getResumenVentasDiarias(),
                getResumenVentasMensuales(),
                getListaVentasDiarias(),
                getListaVentasMensuales(),
                getAllClientes(),
                getAllServicios(),
                searchCuentas({})
            ]);
            setDailySummary(ds);
            setMonthlySummary(ms);
            setDailySales(dl);
            setMonthlySales(ml);
            setClients(cl);
            setServices(sl);
            setAccounts(al);
            toast.dismiss(loadingToast);
            toast.success("Datos actualizados correctamente.");
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error('No se pudieron cargar los datos de ventas.');
            console.error(err);
        } finally {
            setDataLoading(false);
        }
    }, [isAuthorized]);

    useEffect(() => { 
        if (isAuthorized) {
            fetchData();
        }
    }, [fetchData, isAuthorized]);

    // Estados de carga
    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <RefreshCw className="animate-spin text-4xl text-sky-400" />
            </div>
        );
    }

    // Acceso no autorizado
    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-8 max-w-md text-center">
                    <div className="mx-auto bg-red-500/20 text-red-400 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Acceso Restringido</h2>
                    <p className="text-slate-300 mb-6">
                        Solo usuarios ADMIN pueden acceder a esta sección.
                        Contacta al administrador si necesitas acceso.
                    </p>
                    <Link 
                        href="/admin/dashboard" 
                        className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Volver al Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // Contenido autorizado
    const salesToShow = view === 'daily' ? dailySales : monthlySales;
    const paginatedSales = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return salesToShow.slice(startIndex, startIndex + itemsPerPage);
    }, [salesToShow, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(salesToShow.length / itemsPerPage);

    const chartData = useMemo(() => {
        const salesByDate = (view === 'daily' ? dailySales : monthlySales).reduce((acc, sale) => {
            const date = new Date(sale.fechaVenta).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            if (!acc[date]) {
                acc[date] = 0;
            }
            acc[date] += sale.precioVenta;
            return acc;
        }, {} as Record<string, number>);

        return Object.keys(salesByDate).map(date => ({
            name: date,
            Ganancia: salesByDate[date],
        })).reverse();
    }, [dailySales, monthlySales, view]);

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8">
            <Toaster position="top-right" toastOptions={{ 
                className: 'bg-slate-700 text-white shadow-lg border border-slate-600', 
                success: { iconTheme: { primary: '#10b981', secondary: 'white' } }, 
                error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } },
                loading: { iconTheme: { primary: '#38bdf8', secondary: 'white' } }
            }} />
            
            <div className="max-w-8xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-300">
                            <TrendingUp />Dashboard de Ventas
                        </h1>
                        <p className="mt-2 text-slate-400">Analiza el rendimiento de tu negocio en tiempo real.</p>
                    </div>
                    <button 
                        onClick={fetchData} 
                        disabled={dataLoading} 
                        className="mt-4 md:mt-0 bg-slate-800 text-white hover:bg-slate-700/80 border border-slate-700 font-bold py-2.5 px-5 rounded-lg shadow-md transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                    >
                        <RefreshCw className={dataLoading ? "animate-spin" : ""} size={16} />
                        Actualizar
                    </button>
                </div>

                {dataLoading ? (
                    <div className="text-center py-20">
                        <RefreshCw className="animate-spin text-4xl mx-auto text-sky-400" />
                        <p className="mt-4 text-slate-400">Cargando información...</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Ganancia Hoy" value={dailySummary?.ganancia || 0} icon={DollarSign} gradient="bg-gradient-to-br from-emerald-500 to-green-500" formatAsCurrency />
                            <StatCard title="Ventas Hoy" value={dailySummary?.totalVentas || 0} unit="cuentas" icon={ShoppingCart} gradient="bg-gradient-to-br from-green-500 to-lime-500" />
                            <StatCard title="Ganancia del Mes" value={monthlySummary?.ganancia || 0} icon={DollarSign} gradient="bg-gradient-to-br from-cyan-500 to-sky-500" formatAsCurrency />
                            <StatCard title="Ventas del Mes" value={monthlySummary?.totalVentas || 0} unit="cuentas" icon={Calendar} gradient="bg-gradient-to-br from-sky-500 to-indigo-500" />
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            <div className="lg:col-span-3 space-y-8">
                                <div className="bg-slate-800/60 border border-slate-700/80 p-4 sm:p-6 rounded-xl shadow-lg">
                                    <h2 className="text-xl font-bold text-white mb-4">Evolución de Ganancias ({view === 'daily' ? 'Diaria' : 'Mensual'})</h2>
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer>
                                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                <defs>
                                                    <linearGradient id="colorGanancia" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => `S/ ${value}`} />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(30, 41, 59, 0.5)' }}/>
                                                <Bar dataKey="Ganancia" fill="url(#colorGanancia)" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/80 p-4 sm:p-6 rounded-xl shadow-lg flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-white">Últimas Ventas</h2>
                                    <div className="flex items-center bg-slate-900/50 border border-slate-700 rounded-lg p-1">
                                        <button 
                                            onClick={() => { setView('daily'); setCurrentPage(1); }} 
                                            className={`px-3 py-1 text-sm rounded-md transition-colors ${view === 'daily' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:bg-slate-700/50'}`}
                                        >
                                            Diario
                                        </button>
                                        <button 
                                            onClick={() => { setView('monthly'); setCurrentPage(1); }} 
                                            className={`px-3 py-1 text-sm rounded-md transition-colors ${view === 'monthly' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:bg-slate-700/50'}`}
                                        >
                                            Mensual
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-grow space-y-3 overflow-y-auto">
                                    <AnimatePresence>
                                        {paginatedSales.length > 0 ? paginatedSales.map((sale) => {
                                            const client = clients.find(c => c.id === sale.clienteId);
                                            const account = accounts.find(a => a.id === sale.cuentaId);
                                            const service = services.find(s => s.id === account?.servicioId);
                                            return (
                                                <motion.div 
                                                    key={sale.id} 
                                                    layout 
                                                    initial={{ opacity: 0, y: 10 }} 
                                                    animate={{ opacity: 1, y: 0 }} 
                                                    exit={{ opacity: 0, y: -10 }} 
                                                    transition={{ duration: 0.2 }}
                                                    className="bg-slate-800/70 border border-slate-700 rounded-lg p-3 hover:bg-slate-700/50 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            {service && (
                                                                <Image 
                                                                    src={service.urlImg || 'https://placehold.co/40x40/1e293b/94a3b8?text=S'} 
                                                                    alt={service.nombre} 
                                                                    width={32} 
                                                                    height={32} 
                                                                    className="rounded-md object-cover" 
                                                                />
                                                            )}
                                                            <div>
                                                                <p className="font-semibold text-sm text-white">{service?.nombre || 'N/A'}</p>
                                                                <p className="text-xs text-slate-400">{client ? `${client.nombre} ${client.apellido}` : 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-green-400">S/ {sale.precioVenta.toFixed(2)}</p>
                                                            <p className="text-xs text-slate-500">{new Date(sale.fechaVenta).toLocaleDateString('es-ES')}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        }) : (
                                            <div className="text-center py-10">
                                                <p className="text-slate-400">No hay ventas para mostrar.</p>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                
                                {totalPages > 1 && (
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                                        <span className="text-sm text-slate-400">Página {currentPage} de {totalPages}</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                                disabled={currentPage === 1} 
                                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronLeft size={16}/>
                                            </button>
                                            <button 
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                                disabled={currentPage === totalPages} 
                                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronRight size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}