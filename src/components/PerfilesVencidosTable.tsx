'use client';

import { WhatsAppIcon } from './ui/ui-elements';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

// --- Tipos Locales ---
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
    onRenewProfile: (perfilId: number, nuevoPrecio: number) => Promise<void>; // Nueva prop
}

export const PerfilesVencidosTable = ({ 
    perfiles, 
    clientes, 
    onRenewProfile 
}: PerfilesVencidosTableProps) => {
    const [isRenewing, setIsRenewing] = useState<number | null>(null);
    const [newPrice, setNewPrice] = useState<number | ''>('');
    const [renewingProfileId, setRenewingProfileId] = useState<number | null>(null);
    
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

    const handleRenewClick = async (perfilId: number, nuevoPrecio: number) => {
        if (!nuevoPrecio || nuevoPrecio <= 0) {
            toast.error("Ingrese un precio válido");
            return;
        }
        
        try {
            await onRenewProfile(perfilId, nuevoPrecio);
            setRenewingProfileId(null);
        } catch (error) {
            console.error("Error renovando perfil:", error);
        }
    };

    const confirmRenew = async () => {
        if (renewingProfileId === null || newPrice === '') {
            toast.error('Por favor ingresa un precio válido');
            return;
        }
        
        try {
            setIsRenewing(renewingProfileId);
            await onRenewProfile(renewingProfileId, Number(newPrice));
            toast.success('Perfil renovado correctamente');
        } catch (error) {
            toast.error('Error al renovar el perfil');
        } finally {
            setRenewingProfileId(null);
            setIsRenewing(null);
            setNewPrice('');
        }
    };

    if (perfiles.length === 0) {
        return <p className="text-center py-10 text-slate-500">No hay perfiles individuales vencidos.</p>;
    }

    return (
        <div>
            {/* Modal de renovación */}
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
                        disabled={!newPrice}
                        className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 flex items-center gap-2"
                    >
                        <DollarSign size={16} />
                        Confirmar Renovación
                    </button>
                </div>
            </motion.div>
        </div>
    )}
    
            
            {/* Tabla */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-800">
                        <tr>
                            <th scope="col" className="px-6 py-4">Cuenta</th>
                            <th scope="col" className="px-6 py-4">Cliente</th>
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
                                            <img 
                                                src={perfil.urlImg || '/default-profile.png'} 
                                                className="w-6 h-6 rounded-full object-cover"
                                            />
                                            <div className="flex flex-col gap-1 font-medium">
                                                <div>{perfil.correoCuenta || 'N/A'}</div>
                                                <div className='text-slate-400 text-xs font-mono'>
                                                    Nombre Perfil: {perfil.nombrePerfil || 'N/A'}
                                                </div>
                                                <div className='text-slate-400 text-xs font-mono'>
                                                    PIN: {perfil.pin || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">            
                                            <div className="flex flex-col gap-1 font-medium">
                                                <div>{perfil.nombreCliente || 'N/A'}</div>
                                                <div className='text-slate-400 text-xs font-mono'>
                                                    Número: {perfil.numero || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-yellow-400">{displayDate(perfil.fechaRenovacion)}</td>
                                     <td className="px-6 py-4">
        <div className="flex justify-center items-center gap-3">
            <a 
                href={generateWhatsAppLink(client, perfil)}
                target="_blank" 
                rel="noopener noreferrer"
                className={`p-2 rounded-md transition-colors ${client ? 'text-green-400 hover:bg-green-500/20' : 'text-slate-600 cursor-not-allowed'}`}
                onClick={(e) => !client && e.preventDefault()}
            >
                <WhatsAppIcon className="w-5 h-5" />
            </a>
            <button 
                onClick={() => setRenewingProfileId(perfil.id)}
                disabled={isRenewing === perfil.id}
                className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-md disabled:opacity-50"
            >
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