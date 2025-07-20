"use client";

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, Search, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { asignarPerfiles, asignarCuenta } from '../../services/cuentaService';
import { useAuth } from '../../context/AuthContext';

// --- DEFINICIONES DE TIPOS LOCALES ---
enum TipoCuenta { INDIVIDUAL = "INDIVIDUAL", COMPLETO = "COMPLETO" }
enum TipoCliente { NORMAL = "NORMAL", RESELLER = "RESELLER" }
interface Cuenta { id: number; correo: string; tipoCuenta: TipoCuenta; precioVenta: number; }
interface Cliente { id: number; nombre: string; apellido: string; numero: string; correo?: string; tipoCliente: TipoCliente; linkWhatsapp?: string; }

interface AssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: Cuenta | null;
    clients: Cliente[];
    onSaveSuccess: (message: string) => void;
}

export const AssignModal = ({ isOpen, onClose, account, clients, onSaveSuccess }: AssignModalProps) => {
    const { user: loggedInUser } = useAuth();
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [precioVenta, setPrecioVenta] = useState<number>(0);
    const [profileName, setProfileName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    
    // --- NUEVOS ESTADOS PARA LAS FECHAS DEL PERFIL ---
    const [fechaInicioPerfiles, setFechaInicioPerfiles] = useState('');
    const [fechaRenovacionPerfiles, setFechaRenovacionPerfiles] = useState('');
    
    const filteredClients = useMemo(() => {
        if (!searchTerm) return clients;
        const term = searchTerm.toLowerCase();
        return clients.filter(client => 
            client.nombre.toLowerCase().includes(term) ||
            client.apellido.toLowerCase().includes(term) ||
            client.numero.includes(term) ||
            (client.correo && client.correo.toLowerCase().includes(term))
        );
    }, [clients, searchTerm]);

    const handleSelectClient = (clientId: number) => {
        setSelectedClientId(clientId);
        setSearchTerm('');
    };

    const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [selectedClientId, clients]);
    
    useEffect(() => {
        if (isOpen) {
            // Resetea todos los campos del formulario al abrir
            setSelectedClientId(null);
            setProfileName('');
            setPrecioVenta(account?.precioVenta || 0);
            setFechaInicioPerfiles('');
            setFechaRenovacionPerfiles('');
        }
    }, [isOpen, account]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedClientId || !account || !loggedInUser) { toast.error("Por favor, selecciona un cliente."); return; }
        
        setFormLoading(true);
        const loadingToast = toast.loading("Asignando...");
        try {
            if (account.tipoCuenta === TipoCuenta.INDIVIDUAL) {
                if (!profileName || !fechaInicioPerfiles || !fechaRenovacionPerfiles) {
                    toast.error("El nombre del perfil y las fechas son requeridos.");
                    setFormLoading(false);
                    return;
                }
                // --- PAYLOAD ACTUALIZADO CON LAS FECHAS ---
                const payload = {
                    cuentaId: account.id,
                    clienteId: selectedClientId,
                    perfilesNuevos: [profileName],
                    usuarioAsignadorId: loggedInUser.id,
                    precioVenta,
                    fechaInicioPerfiles,
                    fechaRenovacionPerfiles,
                };
                await asignarPerfiles(payload);
                toast.dismiss(loadingToast);
                onSaveSuccess(`Perfil "${profileName}" asignado.`);
            } else { // Venta de cuenta COMPLETA
                const payload = {
                    cuentaId: account.id,
                    clienteId: selectedClientId,
                    precioVenta: precioVenta,
                    usuarioAsignadorId: loggedInUser.id,
                };
                await asignarCuenta(payload);
                toast.dismiss(loadingToast);
                onSaveSuccess(`Cuenta completa asignada.`);
            }
            onClose();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || "Error al asignar.");
        } finally {
            setFormLoading(false);
        }
    };

    if (!isOpen || !account) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-4xl mx-4">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3"><UserPlus className="text-green-400" />Vender {account.tipoCuenta === 'INDIVIDUAL' ? 'Perfil' : 'Cuenta Completa'}</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Columna Izquierda */}
                        <div className="space-y-4">
                            <div><label className="label-style">Cuenta</label><p className="input-style-dark p-3 bg-slate-700/50">{account.correo}</p></div>
                            
                            {account.tipoCuenta === TipoCuenta.INDIVIDUAL && (
                                <>
                                    <div><label className="label-style">Nombre del Perfil</label><input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Ej: Perfil Juan" className="input-style-dark p-3 w-full" required /></div>
                                    
                                    {/* --- NUEVOS CAMPOS DE FECHA --- */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label-style">Fecha Inicio Perfil</label>
                                            <input type="date" value={fechaInicioPerfiles} onChange={(e) => setFechaInicioPerfiles(e.target.value)} className="input-style-dark p-3 w-full" required />
                                        </div>
                                        <div>
                                            <label className="label-style">Fecha Renovación Perfil</label>
                                            <input type="date" value={fechaRenovacionPerfiles} onChange={(e) => setFechaRenovacionPerfiles(e.target.value)} className="input-style-dark p-3 w-full" required />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div><label className="label-style">Precio de Venta</label><input type="number" value={precioVenta} onChange={(e) => setPrecioVenta(Number(e.target.value))} className="input-style-dark p-3 w-full" min="0" step="0.01" /></div>
                        </div>

                        {/* Columna Derecha */}
                        <div className="space-y-4">
                            <div>
                                <label className="label-style">Buscar Cliente</label>
                                {!selectedClientId ? (
                                    <>
                                        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por nombre, apellido, teléfono..." className="input-style-dark pl-10 pr-4 py-3 w-full" /></div>
                                        <div className="mt-2 h-64 overflow-y-auto border border-slate-700 rounded-md">
                                            {filteredClients.length > 0 ? (
                                                filteredClients.map(client => (
                                                    <div key={client.id} onClick={() => handleSelectClient(client.id)} className="p-3 hover:bg-slate-700/50 cursor-pointer flex justify-between items-center border-b border-slate-700">
                                                        <div className="min-w-0"><p className="font-medium truncate">{client.nombre} {client.apellido}</p><p className="text-xs text-slate-400 truncate">{client.numero}</p></div>
                                                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${client.tipoCliente === 'RESELLER' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>{client.tipoCliente}</span>
                                                    </div>
                                                ))
                                            ) : (<p className="p-3 text-slate-400 text-sm">No se encontraron clientes</p>)}
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-3 bg-slate-700/50 rounded-md flex justify-between items-center">
                                        <div className="min-w-0"><p className="font-medium truncate">{selectedClient?.nombre} {selectedClient?.apellido}</p><p className="text-xs text-slate-400 truncate">{selectedClient?.numero}</p></div>
                                        <div className="flex items-center gap-2 flex-shrink-0"><span className={`text-xs px-2 py-1 rounded-full ${selectedClient?.tipoCliente === 'RESELLER' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>{selectedClient?.tipoCliente}</span><button type="button" onClick={() => setSelectedClientId(null)} className="text-slate-400 hover:text-white"><X size={16} /></button></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="lg:col-span-2 mt-4 flex justify-end gap-4 pt-4 border-t border-slate-700">
                            <button type="button" onClick={onClose} className="btn-secondary-dark">Cancelar</button>
                            <button type="submit" disabled={formLoading} className="btn-primary-dark">{formLoading ? <RefreshCw className="animate-spin" /> : <CheckCircle />}{formLoading ? 'Vendiendo...' : 'Confirmar Venta'}</button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
