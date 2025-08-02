'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
    getResumenVentasMensuales, 
    getListaVentasMensuales, 
    getResumenVentasDiarias, 
    getListaVentasDiarias,
    getTopClientesDiarios,
    getTopClientesSemanales
} from '../../../services/ventaCuentaService';
// CORRECCIÓN: Se importa 'getClienteSuscripciones' del servicio correcto.
import { getAllClientes, getClienteSuscripciones } from '../../../services/clienteService'; 
import { getAllServicios } from '../../../services/servicioService';
import { searchCuentas } from '../../../services/cuentaService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { DollarSign, TrendingUp, Calendar, RefreshCw, ChevronLeft, ChevronRight, ShoppingCart, AlertTriangle, ArrowLeft, Crown, Tv, User as UserIcon, Tag, X, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';

// --- DEFINICIONES DE TIPOS ---

enum RolUsuario {
    ADMIN = "ADMIN",
    TRABAJADOR = "TRABAJADOR",
}

interface CuentaCompletaSuscripcion {
  cuentaId: number;
  correo: string;
  nombreServicio: string;
  urlImgServicio: string;
  fechaInicio: string;
  fechaRenovacion: string;
  status: string;
}

interface PerfilIndividualSuscripcion {
  id: number;
  nombrePerfil: string;
  clienteId: number;
  correoCuenta: string;
  nombreCliente: string;
  urlImg: string;
  numero: string;
  contraseña: string;
  pin: string;
  fechaInicio: string;
  fechaRenovacion: string;
  precioVenta: number;
}

interface SuscripcionCliente {
  clienteId: number;
  nombreCliente: string;
  numeroCliente: string;
  cuentasCompletas: CuentaCompletaSuscripcion[];
  perfilesIndividuales: PerfilIndividualSuscripcion[];
}

interface TopCliente {
  clienteId: number;
  nombreCliente: string;
  numeroCliente: string;
  totalCompras: number;
}

interface Venta { 
    id: number; 
    cuentaId: number; 
    clienteId: number; 
    perfilId: number | null;
    nombreServicio: string;
    urlImg: string;
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

// --- COMPONENTES ---

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

const TopClientsCard = ({ title, clients, onClientClick }: { title: string; clients: TopCliente[]; onClientClick: (client: TopCliente) => void; }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(clients.length / itemsPerPage);
    const paginatedClients = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return clients.slice(startIndex, startIndex + itemsPerPage);
    }, [clients, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [clients]);

    return (
        <div className="bg-slate-800/60 border border-slate-700/80 p-4 sm:p-6 rounded-xl shadow-lg flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Crown className="text-yellow-400"/> {title}</h2>
            <div className="flex-grow space-y-3 overflow-y-auto">
                {paginatedClients.length > 0 ? paginatedClients.map((client, index) => (
                    <button key={client.clienteId} onClick={() => onClientClick(client)} className="w-full text-left flex items-center justify-between bg-slate-800/70 p-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-400">{(currentPage - 1) * itemsPerPage + index + 1}.</span>
                            <div>
                                <p className="font-semibold text-white">{client.nombreCliente}</p>
                                <p className="text-xs text-slate-500">{client.numeroCliente}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-lg text-sky-400 flex items-center justify-end gap-1.5">
                                {client.totalCompras}
                                <ShoppingCart size={14} className="opacity-80"/>
                            </span>
                            <p className="text-xs text-slate-500 -mt-1">compras</p>
                        </div>
                    </button>
                )) : (
                    <div className="text-center py-10 flex-grow flex items-center justify-center">
                        <p className="text-slate-400">No hay datos de clientes.</p>
                    </div>
                )}
            </div>
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                    <span className="text-sm text-slate-400">Página {currentPage} de {totalPages}</span>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16}/></button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16}/></button>
                    </div>
                </div>
            )}
        </div>
    );
};

const SuscripcionModal = ({ isOpen, onClose, suscripciones }: {
  isOpen: boolean;
  onClose: () => void;
  suscripciones: SuscripcionCliente | null;
}) => {
  const [currentPageCuentas, setCurrentPageCuentas] = useState(1);
  const [currentPagePerfiles, setCurrentPagePerfiles] = useState(1);
  const itemsPerPage = 10;

  if (!isOpen || !suscripciones) return null;

  const totalPagesCuentas = Math.ceil(suscripciones.cuentasCompletas.length / itemsPerPage);
  const paginatedCuentas = suscripciones.cuentasCompletas.slice((currentPageCuentas - 1) * itemsPerPage, currentPageCuentas * itemsPerPage);

  const totalPagesPerfiles = Math.ceil(suscripciones.perfilesIndividuales.length / itemsPerPage);
  const paginatedPerfiles = suscripciones.perfilesIndividuales.slice((currentPagePerfiles - 1) * itemsPerPage, currentPagePerfiles * itemsPerPage);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3"><ShoppingBag className="text-blue-400"/>Compras de {suscripciones.nombreCliente}</h2>
            <p className="text-slate-400">Teléfono: {suscripciones.numeroCliente}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto pr-2 space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-blue-300 mb-3 flex items-center gap-2"><Tv size={20}/> Cuentas Completas</h3>
            {suscripciones.cuentasCompletas.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedCuentas.map(cuenta => (
                    <div key={cuenta.cuentaId} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600/50 flex flex-col justify-between">
                      <div className="flex items-center gap-4 mb-3">
                          <Image src={cuenta.urlImgServicio} alt={cuenta.nombreServicio} width={40} height={40} className="rounded-md" />
                          <div>
                              <p className="font-bold text-lg text-white">{cuenta.nombreServicio}</p>
                              <p className="text-sm text-slate-300 font-mono">{cuenta.correo}</p>
                          </div>
                      </div>
                      <div className="text-sm space-y-2">
                          <p className="flex justify-between"><span>Inicio:</span> <span>{new Date(cuenta.fechaInicio).toLocaleDateString('es-ES')}</span></p>
                          <p className="flex justify-between"><span>Vence:</span> <strong className="text-yellow-300">{new Date(cuenta.fechaRenovacion).toLocaleDateString('es-ES')}</strong></p>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPagesCuentas > 1 && (
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-slate-400">Página {currentPageCuentas} de {totalPagesCuentas}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPageCuentas(p => Math.max(1, p - 1))} disabled={currentPageCuentas === 1} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50"><ChevronLeft size={16}/></button>
                            <button onClick={() => setCurrentPageCuentas(p => Math.min(totalPagesCuentas, p + 1))} disabled={currentPageCuentas === totalPagesCuentas} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50"><ChevronRight size={16}/></button>
                        </div>
                    </div>
                )}
              </>
            ) : <p className="text-slate-400 italic text-sm">No tiene cuentas completas activas.</p>}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-purple-300 mb-3 flex items-center gap-2"><UserIcon size={20}/> Perfiles Individuales</h3>
            {suscripciones.perfilesIndividuales.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedPerfiles.map(perfil => (
                    <div key={perfil.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600/50 flex flex-col justify-between">
                      <div className="flex items-center gap-4 mb-3">
                          <Image src={perfil.urlImg} alt="Servicio" width={40} height={40} className="rounded-md" />
                          <div>
                              <p className="font-bold text-lg text-white">Perfil: {perfil.nombrePerfil}</p>
                              <p className="text-sm text-slate-300 font-mono">{perfil.correoCuenta}</p>
                          </div>
                      </div>
                      <div className="text-sm space-y-2">
                          <p className="flex justify-between"><span>Precio:</span> <span>S/. {perfil.precioVenta.toFixed(2)}</span></p>
                          <p className="flex justify-between"><span>Inicio:</span> <span>{new Date(perfil.fechaInicio).toLocaleDateString('es-ES')}</span></p>
                          <p className="flex justify-between"><span>Vence:</span> <strong className="text-yellow-300">{new Date(perfil.fechaRenovacion).toLocaleDateString('es-ES')}</strong></p>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPagesPerfiles > 1 && (
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-slate-400">Página {currentPagePerfiles} de {totalPagesPerfiles}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPagePerfiles(p => Math.max(1, p - 1))} disabled={currentPagePerfiles === 1} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50"><ChevronLeft size={16}/></button>
                            <button onClick={() => setCurrentPagePerfiles(p => Math.min(totalPagesPerfiles, p + 1))} disabled={currentPagePerfiles === totalPagesPerfiles} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50"><ChevronRight size={16}/></button>
                        </div>
                    </div>
                )}
              </>
            ) : <p className="text-slate-400 italic text-sm">No tiene perfiles individuales activos.</p>}
          </div>
        </div>
      </motion.div>
    </div>
  );
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
    const itemsPerPage = 10;
    
    const [topDailyClients, setTopDailyClients] = useState<TopCliente[]>([]);
    const [topWeeklyClients, setTopWeeklyClients] = useState<TopCliente[]>([]);

    const [suscripciones, setSuscripciones] = useState<SuscripcionCliente | null>(null);
    const [isSuscripcionModalOpen, setIsSuscripcionModalOpen] = useState(false);

    const isAuthorized = useMemo(() => {
        return isAuthenticated && user?.rolUsuario === RolUsuario.ADMIN;
    }, [isAuthenticated, user]);

    const fetchData = useCallback(async () => {
        if (!isAuthorized) return;
        
        setDataLoading(true);
        const loadingToast = toast.loading("Actualizando datos...");
        try {
            const [ds, ms, dl, ml, cl, sl, al, tdc, twc] = await Promise.all([
                getResumenVentasDiarias(),
                getResumenVentasMensuales(),
                getListaVentasDiarias(),
                getListaVentasMensuales(),
                getAllClientes(),
                getAllServicios(),
                searchCuentas({}),
                getTopClientesDiarios(),
                getTopClientesSemanales(),
            ]);
            setDailySummary(ds);
            setMonthlySummary(ms);
            setDailySales(dl as Venta[]);
            setMonthlySales(ml as Venta[]);
            setClients(cl);
            setServices(sl);
            setAccounts(al);
            setTopDailyClients(tdc);
            setTopWeeklyClients(twc);
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
        if (!authLoading && isAuthorized) {
            fetchData();
        }
    }, [fetchData, isAuthorized, authLoading]);

    const handleOpenSuscripcionesModal = async (cliente: TopCliente) => {
        const loadingToast = toast.loading("Cargando suscripciones...");
        try {
            const data = await getClienteSuscripciones(cliente.clienteId);
            setSuscripciones(data);
            setIsSuscripcionModalOpen(true);
            toast.dismiss(loadingToast);
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error("Error al cargar las suscripciones del cliente.");
        }
    };

    const handleCloseSuscripcionesModal = () => {
        setIsSuscripcionModalOpen(false);
        setSuscripciones(null);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <RefreshCw className="animate-spin text-4xl text-sky-400" />
            </div>
        );
    }

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

    const salesToShow = view === 'daily' ? dailySales : monthlySales;
    const paginatedSales = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return salesToShow.slice(startIndex, startIndex + itemsPerPage);
    }, [salesToShow, currentPage]);

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
                                        <button onClick={() => { setView('daily'); setCurrentPage(1); }} className={`px-3 py-1 text-sm rounded-md transition-colors ${view === 'daily' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:bg-slate-700/50'}`}>Diario</button>
                                        <button onClick={() => { setView('monthly'); setCurrentPage(1); }} className={`px-3 py-1 text-sm rounded-md transition-colors ${view === 'monthly' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:bg-slate-700/50'}`}>Mensual</button>
                                    </div>
                                </div>
                                <div className="flex-grow space-y-3 overflow-y-auto">
                                    <AnimatePresence>
                                        {paginatedSales.length > 0 ? paginatedSales.map((sale) => {
                                            const client = clients.find(c => c.id === sale.clienteId);
                                            return (
                                                <motion.div key={sale.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="bg-slate-800/70 border border-slate-700 rounded-lg p-3 hover:bg-slate-700/50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Image 
                                                                src={sale.urlImg || 'https://placehold.co/40x40/1e293b/94a3b8?text=S'} 
                                                                alt={sale.nombreServicio} 
                                                                width={32} 
                                                                height={32} 
                                                                className="rounded-md object-cover" 
                                                            />
                                                            <div>
                                                                <p className="font-semibold text-white text-sm">{sale.nombreServicio}</p>
                                                                <p className="text-xs text-slate-400 -mt-1">{client ? `${client.nombre} ${client.apellido}` : 'Cliente Desconocido'}</p>
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
                                            <div className="text-center py-10"><p className="text-slate-400">No hay ventas para mostrar.</p></div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                                        <span className="text-sm text-slate-400">Página {currentPage} de {totalPages}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16}/></button>
                                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16}/></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <TopClientsCard title="Top Clientes del Día" clients={topDailyClients} onClientClick={handleOpenSuscripcionesModal} />
                            <TopClientsCard title="Top Clientes de la Semana" clients={topWeeklyClients} onClientClick={handleOpenSuscripcionesModal} />
                        </div>
                    </div>
                )}
            </div>

            <SuscripcionModal 
                isOpen={isSuscripcionModalOpen}
                onClose={handleCloseSuscripcionesModal}
                suscripciones={suscripciones}
            />
        </div>
    );
}
