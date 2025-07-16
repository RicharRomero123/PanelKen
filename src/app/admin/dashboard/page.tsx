// src/app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
// Usamos rutas relativas para máxima compatibilidad
import { getDashboardData } from '../../../services/dashboardService';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {   RefreshCw, Users, ShieldCheck, Package, Activity } from 'lucide-react';

// --- Tipos definidos localmente ---
interface DashboardData {
    cuentasActivas: number;
    clientesActivos: number;
    cuentasPorServicio: Record<string, number>;
    serviciosMasVendidos: Record<string, number>;
}

// --- Componentes de la UI ---
const StatCard = ({ title, value, icon: Icon, color, formatAsCurrency = false }: { title: string; value: number; icon: React.ElementType; color: string; formatAsCurrency?: boolean }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl shadow-lg flex items-center justify-between"
    >
        <div>
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className="text-3xl font-bold text-white">
                {formatAsCurrency ? `$${value.toFixed(2)}` : value}
            </p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
    </motion.div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-3 rounded-lg shadow-lg">
          <p className="label text-white font-bold">{`${label}`}</p>
          <p className="intro text-cyan-400">{`${payload[0].name} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
};

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const loadingToast = toast.loading("Cargando datos del dashboard...");
        try {
            const result = await getDashboardData();
            setData(result);
            toast.dismiss(loadingToast);
            toast.success("Dashboard actualizado.");
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error("No se pudieron cargar los datos del dashboard.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const cuentasPorServicioData = data ? Object.entries(data.cuentasPorServicio).map(([name, value]) => ({ name, Cuentas: value })) : [];
    const serviciosMasVendidosData = data ? Object.entries(data.serviciosMasVendidos).map(([name, value]) => ({ name, Ventas: value })) : [];

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">
            <Toaster position="top-right" toastOptions={{ className: 'bg-slate-700 text-white shadow-lg', success: { iconTheme: { primary: '#10b981', secondary: 'white' } }, error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } } }} />
            
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><Activity />Dashboard Principal</h1>
                        <p className="mt-2 text-slate-400">Un resumen general del estado de tu negocio.</p>
                    </div>
                    <button onClick={fetchData} disabled={loading} className="mt-4 md:mt-0 bg-slate-800 text-white hover:bg-slate-700 font-bold py-2.5 px-5 rounded-lg shadow-md transition duration-300 flex items-center gap-2 disabled:opacity-50">
                        <RefreshCw className={loading ? "animate-spin" : ""} size={16} />Actualizar
                    </button>
                </div>

                {loading && !data ? <div className="text-center py-10"><RefreshCw className="animate-spin text-3xl mx-auto text-blue-400" /></div> : (
                    <AnimatePresence>
                        <motion.div layout className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <StatCard title="Cuentas Activas" value={data?.cuentasActivas || 0} icon={ShieldCheck} color="bg-green-500" />
                                <StatCard title="Clientes Activos" value={data?.clientesActivos || 0} icon={Users} color="bg-sky-500" />
                                <StatCard title="Servicios Populares" value={serviciosMasVendidosData.length} icon={Package} color="bg-purple-500" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl shadow-lg">
                                    <h2 className="text-xl font-semibold mb-4 text-white">Cuentas por Servicio</h2>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={cuentasPorServicioData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14, 165, 233, 0.1)' }} />
                                                <Legend iconType="circle" />
                                                <Bar dataKey="Cuentas" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl shadow-lg">
                                    <h2 className="text-xl font-semibold mb-4 text-white">Servicios Más Vendidos</h2>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={serviciosMasVendidosData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                <defs>
                                                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }} />
                                                <Legend iconType="circle" />
                                                <Area type="monotone" dataKey="Ventas" stroke="#22c55e" fillOpacity={1} fill="url(#colorVentas)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
