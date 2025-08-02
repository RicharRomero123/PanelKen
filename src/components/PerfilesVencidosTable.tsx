'use client';

import { WhatsAppIcon, getStatusBadge } from './ui/ui-elements';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Eye, X, User as UserIcon, KeyRound, Info, Calendar, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { getAllReportes } from '@/services/reporteCuentaService';

// --- Tipos Locales ---
enum StatusCuenta { 
    ACTIVO = "ACTIVO", 
    VENCIDO = "VENCIDO", 
    REEMPLAZADA = "REEMPLAZADA", 
    REPORTADO = "REPORTADO", 
    SINUSAR = "SINUSAR" 
}

interface ReporteCuenta {
    id: number;
    cuentaId: number;
    correoCuenta: string;
}

interface PerfilVencido {
    id: number;
    nombrePerfil: string;
    clienteId: number;
    nombreCliente: string;
    fechaInicio: string;
    fechaRenovacion: string;
    precioVenta: number;
    correoCuenta: string;
    urlImg: string;
    numero: string;
    pin: string;
    status?: StatusCuenta;
    nombreServicio?: string;
}
interface Cliente {
    id: number;
    nombre: string;
    apellido: string;
    numero: string;
    linkWhatsapp?: string;
}

interface PerfilesVencidosTableProps {
    perfiles: PerfilVencido[];
    clientes: Cliente[];
    onRenewProfile: (perfilId: number, nuevoPrecio: number) => Promise<void>;
}

// --- MODAL DE DETALLES ---
const ProfileDetailModal = ({ perfil, onClose }: { perfil: PerfilVencido | null; onClose: () => void; }) => {
    if (!perfil) return null;

    const DetailItem = ({ label, value, className = '' }: { label: string; value: React.ReactNode; className?: string }) => (
        <div className={className}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="font-medium text-white">{value}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full"
            >
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-700">
                    <div className="flex items-center gap-4">
                        <Image src={perfil.urlImg || '/default-profile.png'} alt={perfil.nombreServicio || 'Servicio'} width={56} height={56} className="rounded-lg object-cover" />
                        <div>
                            <h3 className="text-xl font-bold text-white">{perfil.nombreServicio || 'Servicio'} - Perfil "{perfil.nombrePerfil}"</h3>
                            <span className={`px-2 py-1 mt-1 inline-block text-xs font-semibold rounded-full ${getStatusBadge(perfil.status || StatusCuenta.VENCIDO)}`}>
                                {perfil.status || 'VENCIDO'}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="space-y-6 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
                            <h4 className="font-semibold text-blue-300 flex items-center gap-2"><UserIcon size={16}/> Datos del Cliente</h4>
                            <DetailItem label="ID Cliente" value={perfil.clienteId} />
                            <DetailItem label="Nombre" value={perfil.nombreCliente} />
                            <DetailItem label="Número" value={perfil.numero || 'No registrado'} />
                        </div>
                        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
                            <h4 className="font-semibold text-purple-300 flex items-center gap-2"><KeyRound size={16}/> Datos de la Cuenta</h4>
                            <DetailItem label="Correo de la Cuenta" value={perfil.correoCuenta} />
                            <DetailItem label="PIN del Perfil" value={perfil.pin || 'N/A'} />
                        </div>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                        <h4 className="font-semibold text-yellow-300 mb-2 flex items-center gap-2"><Calendar size={16}/> Detalles de Suscripción</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <DetailItem label="ID Perfil" value={perfil.id} />
                            <DetailItem label="Precio Venta" value={`S/ ${perfil.precioVenta.toFixed(2)}`} />
                            <DetailItem label="Fecha Inicio" value={new Date(perfil.fechaInicio).toLocaleDateString('es-ES')} />
                            <DetailItem label="Fecha Vencimiento" value={<strong className="text-red-400">{new Date(perfil.fechaRenovacion).toLocaleDateString('es-ES')}</strong>} />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};


export const PerfilesVencidosTable = ({ 
    perfiles, 
    clientes, 
    onRenewProfile 
}: PerfilesVencidosTableProps) => {
    const [isRenewing, setIsRenewing] = useState<number | null>(null);
    const [newPrice, setNewPrice] = useState<number | ''>('');
    const [renewingProfileId, setRenewingProfileId] = useState<number | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState<PerfilVencido | null>(null);
    
    const displayDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString.replace(/-/g, '/'));
        return date.toLocaleDateString('es-PE', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            timeZone: 'America/Lima' 
        });
    };

    const generateWhatsAppLink = (client: Cliente | undefined, perfil: PerfilVencido) => {
        if (!client) return '#';
        const message = `👋 Hola ${client.nombre}, te recordamos que tu perfil "${perfil.nombrePerfil}" ha vencido. ¿Deseas renovarlo?`;
        const encodedMessage = encodeURIComponent(message);
        const baseLink = client.linkWhatsapp || (client.numero ? `https://wa.me/51${client.numero}` : '#');
        if (baseLink === '#') return '#';
        const separator = baseLink.includes('?') ? '&' : '?';
        return `${baseLink}${separator}text=${encodedMessage}`;
    };

    const handleAttemptRenew = async (perfil: PerfilVencido) => {
        const loadingToast = toast.loading('Verificando estado de la cuenta...');
        try {
            // CORRECCIÓN: Se añade 'as unknown as ReporteCuenta[]' para resolver el conflicto de tipos estricto.
            const allReports = await getAllReportes() as unknown as ReporteCuenta[];
            const hasReport = allReports.some(report => report.correoCuenta === perfil.correoCuenta);
            
            toast.dismiss(loadingToast);

            if (hasReport) {
                toast.error('Esta cuenta tiene un reporte activo y no puede ser renovada.', {
                    icon: <AlertTriangle className="text-yellow-400" />,
                });
            } else {
                setRenewingProfileId(perfil.id);
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('No se pudo verificar el estado de la cuenta.');
            console.error("Error fetching reports:", error);
        }
    };

    const handleRenewClick = async (perfilId: number, nuevoPrecio: number) => {
        if (!nuevoPrecio || nuevoPrecio <= 0) {
            toast.error("Ingrese un precio válido");
            return;
        }
        
        setIsRenewing(perfilId);
        try {
            await onRenewProfile(perfilId, nuevoPrecio);
            setRenewingProfileId(null);
            setNewPrice('');
        } catch (error) {
            console.error("Error renovando perfil:", error);
        } finally {
            setIsRenewing(null);
        }
    };

    if (perfiles.length === 0) {
        return <p className="text-center py-10 text-slate-500">No hay perfiles individuales vencidos.</p>;
    }

    return (
        <div>
            <AnimatePresence>
                {detailModalOpen && <ProfileDetailModal perfil={detailModalOpen} onClose={() => setDetailModalOpen(null)} />}
            </AnimatePresence>

            {renewingProfileId !== null && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full"
                    >
                        <h3 className="text-xl font-bold mb-4">Renovar Perfil</h3>
                        <p className="mb-4">Ingresa el nuevo precio de venta para la renovación:</p>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-slate-400">S/.</span>
                            <input
                                type="number"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value ? Number(e.target.value) : '')}
                                className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 w-full"
                                placeholder="Precio de renovación"
                                min="0"
                                step="0.01"
                                autoFocus
                            />
                        </div>
                        
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setRenewingProfileId(null)}
                                className="px-4 py-2 rounded-lg border border-slate-600 hover:bg-slate-700"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={() => handleRenewClick(renewingProfileId, Number(newPrice))}
                                disabled={!newPrice || isRenewing !== null}
                                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 flex items-center gap-2"
                            >
                                <DollarSign size={16} />
                                {isRenewing === renewingProfileId ? 'Renovando...' : 'Confirmar Renovación'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
            
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-800">
                        <tr>
                            <th scope="col" className="px-6 py-4">Cuenta</th>
                            <th scope="col" className="px-6 py-4">Cliente</th>
                            <th scope="col" className="px-6 py-4">Estado</th>
                            <th scope="col" className="px-6 py-4">Fecha de Renovación</th>
                            <th scope="col" className="px-6 py-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-200">
                        {perfiles.map((perfil) => {
                            const client = clientes.find(c => c.id === perfil.clienteId);
                            return (
                                <tr key={perfil.id} className="border-b border-slate-700 hover:bg-slate-800 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Image src={perfil.urlImg || '/default-profile.png'} width={24} height={24} className="w-6 h-6 rounded-full object-cover" alt="Service" />
                                            <div className="flex flex-col gap-1 font-medium">
                                                <div>{perfil.correoCuenta || 'N/A'}</div>
                                                <div className='text-slate-400 text-xs font-mono'>Nombre Perfil: {perfil.nombrePerfil || 'N/A'}</div>
                                                <div className='text-slate-400 text-xs font-mono'>PIN: {perfil.pin || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">                                    
                                            <div className="flex flex-col gap-1 font-medium">
                                                <div>{perfil.nombreCliente || 'N/A'}</div>
                                                <div className='text-slate-400 text-xs font-mono'>Número: {perfil.numero || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(perfil.status || StatusCuenta.VENCIDO)}`}>
                                            {perfil.status || 'VENCIDO'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-yellow-400">{displayDate(perfil.fechaRenovacion)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center items-center gap-3">
                                            <button onClick={() => setDetailModalOpen(perfil)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md" title="Ver Detalles">
                                                <Eye size={16} />
                                            </button>
                                            <a href={generateWhatsAppLink(client, perfil)} target="_blank" rel="noopener noreferrer" className={`p-2 rounded-md transition-colors ${client ? 'text-green-400 hover:bg-green-500/20' : 'text-slate-600 cursor-not-allowed'}`} onClick={(e) => !client && e.preventDefault()}>
                                                <WhatsAppIcon className="w-5 h-5" />
                                            </a>
                                            <button onClick={() => handleAttemptRenew(perfil)} disabled={isRenewing === perfil.id} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-md disabled:opacity-50">
                                                {isRenewing === perfil.id ? 'Renovando...' : 'Renovar'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
