'use client';
import { useEffect, useState, useCallback, FormEvent, useMemo } from 'react';
// Usamos rutas relativas para máxima compatibilidad
import { searchCuentas, createCuenta, updateCuenta, deleteCuenta, asignarPerfiles, asignarCuenta, cambiarCuenta } from '../../../services/cuentaService';
import { getAllServicios } from '../../../services/servicioService';
import { getAllClientes } from '../../../services/clienteService';
import { getAllReportes } from '../../../services/reporteCuentaService';
import { useAuth } from '@/context/AuthContext';
import { Plus, Edit, Trash2, X, Search, RefreshCw, AlertTriangle, CheckCircle, KeyRound, User as UserIcon, Mail, Calendar, DollarSign, UserPlus, Layers, Repeat, Inbox, FileText, MoreVertical, Eye, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
// --- Tipos definidos localmente ---
enum StatusCuenta {
    ACTIVO = "ACTIVO",
    VENCIDO = "VENCIDO",
    REEMPLAZADA = "REEMPLAZADA",
    SINUSAR = "SINUSAR",
}
enum TipoCuenta {
    INDIVIDUAL = "INDIVIDUAL", // Se vende por perfiles a clientes NORMAL
    COMPLETO = "COMPLETO",   // Se vende como una unidad a clientes RESELLER
}
const getStatusBadge = (status: StatusCuenta) => {
    switch(status) {
        case StatusCuenta.ACTIVO:
            return 'bg-green-500/20 text-green-300';
        case StatusCuenta.VENCIDO:
            return 'bg-yellow-500/20 text-yellow-300';
        case StatusCuenta.REEMPLAZADA:
            return 'bg-red-500/20 text-red-300';
        case StatusCuenta.SINUSAR:
            return 'bg-blue-500/20 text-blue-300';
        default:
            return 'bg-gray-500/20 text-gray-300';
    }
};

interface Cuenta {
    id: number;
    correo: string;
    contraseña: string;
    pin: string;
    perfiles: string; 
    perfilesMaximos: number | null;
    enlace: string | null;
    descripcion: string | null;
    fechaInicio: string | null;
    fechaRenovacion: string | null;
    status: StatusCuenta;
    tipoCuenta: TipoCuenta;
    precioVenta: number;
    clienteId: number | null;
    servicioId: number;
}
interface Servicio {
    id: number;
    nombre: string;
    urlImg?: string;
}
interface Cliente {
    id: number;
    nombre: string;
    apellido: string;
    numero: string;
    email?: string;
    tipo: 'NORMAL' | 'RESELLER'; // <- Añadir este campo
    linkWhatsapp?: string;
}
interface Reporte {
    id: number;
    cuentaId: number;
}
// --- Componentes UI Auxiliares ---
const Tooltip = ({ text }: { text: string }) => (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 bg-slate-600 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        {text}
    </div>
);
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" {...props}>
      <path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.8 0-66.7-9.8-95.4-28.1l-6.7-4-69.8 18.3L72 359.2l-4.5-7c-18.9-29.4-29.6-63.3-29.6-98.6 0-109.9 89.5-199.5 199.8-199.5 52.9 0 102.8 20.5 140.1 57.7 37.2 37.2 57.7 87 57.7 140.2 0 109.9-89.6 199.5-199.8 199.5zm88.8-111.9c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.8-16.2-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.4-2.3-5.1-3.7-10.6-6.4z"></path>
    </svg>
);
// --- MODALS ---
const AccountFormModal = ({ isOpen, onClose, mode, account, services, onSaveSuccess }: { isOpen: boolean; onClose: () => void; mode: 'add' | 'edit'; account: Cuenta | null; services: Servicio[]; onSaveSuccess: (message: string) => void; }) => {
    const initialFormData = useMemo(() => ({
        correo: account?.correo || '',
        contraseña: account?.contraseña || '',
        pin: account?.pin || '',
        tipoCuenta: account?.tipoCuenta || TipoCuenta.INDIVIDUAL,
        perfilesMaximos: account?.perfilesMaximos || null,
        servicioId: account?.servicioId || '',
        enlace: account?.enlace || '',
        precioVenta: account?.precioVenta || 0,
        status: account?.status || StatusCuenta.SINUSAR,
        fechaInicio: account?.fechaInicio ? account.fechaInicio.split('T')[0] : '',
        fechaRenovacion: account?.fechaRenovacion ? account.fechaRenovacion.split('T')[0] : '',
    }), [account]);
    const [formData, setFormData] = useState(initialFormData);
    const [formLoading, setFormLoading] = useState(false);
    useEffect(() => { if (isOpen) setFormData(initialFormData) }, [isOpen, initialFormData]);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? (value ? Number(value) : null) : value }));
    };
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        const loadingToast = toast.loading(mode === 'add' ? 'Creando cuenta...' : 'Actualizando cuenta...');
        
        try {
            const dataToSend: any = { ...formData };
            if (mode === 'add') {
                await createCuenta(dataToSend);
            } else if (mode === 'edit' && account) {
                await updateCuenta(account.id, dataToSend);
            }
            
            toast.dismiss(loadingToast);
            onSaveSuccess(mode === 'add' ? 'Cuenta creada.' : 'Cuenta actualizada.');
            onClose();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || `Error al ${mode === 'add' ? 'crear' : 'actualizar'}.`);
        } finally {
            setFormLoading(false);
        }
    };
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3"><KeyRound className="text-blue-400" />{mode === 'add' ? 'Crear Nueva Cuenta' : 'Editar Cuenta'}</h2>
                            <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 max-h-[80vh] overflow-y-auto p-1">
                            <div><label className="label-style">Servicio</label><select name="servicioId" value={formData.servicioId || ''} onChange={handleInputChange} className="input-style-dark p-3" required><option value="" disabled>Selecciona un servicio</option>{services.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></div>
                            <div><label className="label-style">Correo</label><input type="email" name="correo" value={formData.correo} onChange={handleInputChange} className="input-style-dark p-3" required /></div>
                            <div><label className="label-style">Contraseña</label><input type="text" name="contraseña" value={formData.contraseña} onChange={handleInputChange} className="input-style-dark p-3" /></div>
                            <div><label className="label-style">PIN</label><input type="text" name="pin" value={formData.pin} onChange={handleInputChange} className="input-style-dark p-3" /></div>
                            <div><label className="label-style">Tipo de Venta</label><select name="tipoCuenta" value={formData.tipoCuenta} onChange={handleInputChange} className="input-style-dark p-3">{Object.values(TipoCuenta).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                            {formData.tipoCuenta === TipoCuenta.INDIVIDUAL && (
                                <div><label className="label-style">Capacidad de Perfiles</label><input type="number" name="perfilesMaximos" value={formData.perfilesMaximos || ''} onChange={handleInputChange} className="input-style-dark p-3" min="1" placeholder="Ej: 5" /></div>
                            )}
                            <div><label className="label-style">Enlace</label><input type="text" name="enlace" value={formData.enlace || ''} onChange={handleInputChange} className="input-style-dark p-3" /></div>
                            <div><label className="label-style">Precio de Venta</label><input type="number" name="precioVenta" value={formData.precioVenta || ''} onChange={handleInputChange} className="input-style-dark p-3" /></div>
                            <div><label className="label-style">Fecha Inicio</label><input type="date" name="fechaInicio" value={formData.fechaInicio} onChange={handleInputChange} className="input-style-dark p-3" /></div>
                            <div><label className="label-style">Fecha Renovación</label><input type="date" name="fechaRenovacion" value={formData.fechaRenovacion} onChange={handleInputChange} className="input-style-dark p-3" /></div>
                            <div className="lg:col-span-3 mt-4 flex justify-end gap-4 pt-4 border-t border-slate-700">
                                <button type="button" onClick={onClose} className="btn-secondary-dark">Cancelar</button>
                                <button type="submit" disabled={formLoading} className="btn-primary-dark">{formLoading ? <RefreshCw className="animate-spin" /> : (mode === 'add' ? <Plus/> : <CheckCircle/>)}{formLoading ? 'Guardando...' : 'Guardar'}</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
const AssignModal = ({ isOpen, onClose, account, clients, onSaveSuccess }: { 
    isOpen: boolean; 
    onClose: () => void; 
    account: Cuenta | null; 
    clients: Cliente[]; 
    onSaveSuccess: (message: string) => void; 
}) => {
    const { user: loggedInUser } = useAuth();
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [precioVenta, setPrecioVenta] = useState<number>(0);
    const [profileName, setProfileName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    
    // Filtrar clientes basado en el término de búsqueda
    const filteredClients = useMemo(() => {
        if (!searchTerm) return clients;
        const term = searchTerm.toLowerCase();
        return clients.filter(client => 
            client.nombre.toLowerCase().includes(term) ||
            client.apellido.toLowerCase().includes(term) ||
            client.numero.includes(term) ||
            (client.email && client.email.toLowerCase().includes(term))
        );
    }, [clients, searchTerm]);

    // Seleccionar cliente
    const handleSelectClient = (clientId: number) => {
        setSelectedClientId(clientId);
        setSearchTerm(''); // Limpiar búsqueda después de seleccionar
    };

    // Obtener cliente seleccionado
    const selectedClient = useMemo(() => 
        clients.find(c => c.id === selectedClientId),
        [selectedClientId, clients]
    );
    
    useEffect(() => {
        if (isOpen) {
            setSelectedClientId(null);
            setProfileName('');
            setPrecioVenta(account?.precioVenta || 0);
        }
    }, [isOpen, account]);
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedClientId || !account || !loggedInUser) { toast.error("Por favor, selecciona un cliente."); return; }
        
        setFormLoading(true);
        const loadingToast = toast.loading("Asignando...");
        try {
            if (account.tipoCuenta === TipoCuenta.INDIVIDUAL) {
                if (!profileName) {
                    toast.error("El nombre del perfil es requerido.");
                    setFormLoading(false);
                    return;
                }
                const payload = {
                    cuentaId: account.id,
                    clienteId: selectedClientId,
                    perfilesNuevos: [profileName],
                    usuarioAsignadorId: loggedInUser.id,
                    precioVenta,
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
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.9 }} 
            className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-4xl mx-4"
        >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <UserPlus className="text-green-400" />
                    Vender {account.tipoCuenta === 'INDIVIDUAL' ? 'Perfil' : 'Cuenta Completa'}
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna izquierda - Información de la cuenta */}
                <div className="space-y-4">
                    <div>
                        <label className="label-style">Cuenta</label>
                        <p className="input-style-dark p-3 bg-slate-700/50">{account.correo}</p>
                    </div>

                    {account.tipoCuenta === TipoCuenta.INDIVIDUAL && (
                        <div>
                            <label className="label-style">Nombre del Perfil</label>
                            <input 
                                type="text" 
                                value={profileName} 
                                onChange={(e) => setProfileName(e.target.value)} 
                                placeholder="Ej: Perfil Juan" 
                                className="input-style-dark p-3 w-full" 
                                required 
                            />
                        </div>
                    )}

                    <div>
                        <label className="label-style">Precio de Venta</label>
                        <input 
                            type="number" 
                            value={precioVenta} 
                            onChange={(e) => setPrecioVenta(Number(e.target.value))} 
                            className="input-style-dark p-3 w-full" 
                            min="0" 
                            step="0.01" 
                        />
                    </div>
                </div>

                {/* Columna derecha - Buscador de clientes */}
                <div className="space-y-4">
                    <div>
                        <label className="label-style">Buscar Cliente</label>
                        {!selectedClientId ? (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar por nombre, apellido, teléfono o email..."
                                        className="input-style-dark pl-10 pr-4 py-3 w-full"
                                    />
                                </div>
                                
                                <div className="mt-2 h-64 overflow-y-auto border border-slate-700 rounded-md">
                                    {filteredClients.length > 0 ? (
                                        filteredClients.map(client => (
                                            <div 
                                                key={client.id} 
                                                onClick={() => handleSelectClient(client.id)}
                                                className="p-3 hover:bg-slate-700/50 cursor-pointer flex justify-between items-center border-b border-slate-700"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{client.nombre} {client.apellido}</p>
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {client.numero} {client.email && `| ${client.email}`}
                                                    </p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                                                    client.tipo === 'RESELLER' 
                                                        ? 'bg-purple-500/20 text-purple-300' 
                                                        : 'bg-blue-500/20 text-blue-300'
                                                }`}>
                                                    {client.tipo}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="p-3 text-slate-400 text-sm">No se encontraron clientes</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="p-3 bg-slate-700/50 rounded-md flex justify-between items-center">
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{selectedClient?.nombre} {selectedClient?.apellido}</p>
                                    <p className="text-xs text-slate-400 truncate">
                                        {selectedClient?.numero} {selectedClient?.email && `| ${selectedClient.email}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        selectedClient?.tipo === 'RESELLER' 
                                            ? 'bg-purple-500/20 text-purple-300' 
                                            : 'bg-blue-500/20 text-blue-300'
                                    }`}>
                                        {selectedClient?.tipo}
                                    </span>
                                    <button 
                                        type="button" 
                                        onClick={() => setSelectedClientId(null)}
                                        className="text-slate-400 hover:text-white"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Botones de acción (full width) */}
                <div className="lg:col-span-2 mt-4 flex justify-end gap-4 pt-4 border-t border-slate-700">
                    <button type="button" onClick={onClose} className="btn-secondary-dark">
                        Cancelar
                    </button>
                    <button type="submit" disabled={formLoading} className="btn-primary-dark">
                        {formLoading ? <RefreshCw className="animate-spin" /> : <CheckCircle />}
                        {formLoading ? 'Vendiendo...' : 'Confirmar Venta'}
                    </button>
                </div>
            </form>
        </motion.div>
    </div>
</AnimatePresence>
    );
};
const BulkCreateModal = ({ isOpen, onClose, services, onSaveSuccess }: { isOpen: boolean; onClose: () => void; services: Servicio[]; onSaveSuccess: (message: string) => void; }) => {
    const [formData, setFormData] = useState({ 
        servicioId: '', 
        correos: '', 
        tipoCuenta: TipoCuenta.INDIVIDUAL, 
        perfilesMaximos: null as number | null 
    });
    const [formLoading, setFormLoading] = useState(false);
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? (value ? Number(value) : null) : value }));
    };
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const emails = formData.correos.split('\n').map(email => email.trim()).filter(email => email);
        if (emails.length === 0 || !formData.servicioId) {
            toast.error("Por favor, selecciona un servicio y añade al menos un correo.");
            return;
        }
        setFormLoading(true);
        const loadingToast = toast.loading(`Creando ${emails.length} cuenta(s)...`);
        try {
            const creationPromises = emails.map(correo => {
                const newAccountData = {
                    correo,
                    servicioId: Number(formData.servicioId),
                    tipoCuenta: formData.tipoCuenta,
                    perfilesMaximos: formData.tipoCuenta === TipoCuenta.INDIVIDUAL ? formData.perfilesMaximos : 1,
                };
                return createCuenta(newAccountData);
            });
            await Promise.all(creationPromises);
            toast.dismiss(loadingToast);
            onSaveSuccess(`${emails.length} cuenta(s) creada(s) exitosamente.`);
            onClose();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || "Error al crear las cuentas en lote.");
        } finally {
            setFormLoading(false);
        }
    };
    if (!isOpen) return null;
    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700"><h2 className="text-2xl font-bold text-white flex items-center gap-3"><FileText className="text-blue-400" />Crear Cuentas por Lote</h2><button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button></div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="label-style">Servicio</label><select name="servicioId" value={formData.servicioId} onChange={handleInputChange} className="input-style-dark p-3" required><option value="" disabled>Selecciona un servicio</option>{services.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></div>
                            <div><label className="label-style">Tipo de Cuenta</label><select name="tipoCuenta" value={formData.tipoCuenta} onChange={handleInputChange} className="input-style-dark p-3">{Object.values(TipoCuenta).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        </div>
                        {formData.tipoCuenta === TipoCuenta.INDIVIDUAL && (
                            <div><label className="label-style">Número de Perfiles para cada cuenta</label><input type="number" name="perfilesMaximos" value={formData.perfilesMaximos || ''} onChange={handleInputChange} className="input-style-dark p-3" min="1" placeholder="Ej: 5" /></div>
                        )}
                        <div><label className="label-style">Lista de Correos (uno por línea)</label><textarea name="correos" rows={8} value={formData.correos} onChange={handleInputChange} className="input-style-dark p-3 font-mono" placeholder="ejemplo1@mail.com&#10;ejemplo2@mail.com&#10;ejemplo3@mail.com" required /></div>
                        <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-700"><button type="button" onClick={onClose} className="btn-secondary-dark">Cancelar</button><button type="submit" disabled={formLoading} className="btn-primary-dark">{formLoading ? <RefreshCw className="animate-spin" /> : <Plus />}{formLoading ? 'Creando...' : 'Crear Lote'}</button></div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
const BulkSellModal = ({ isOpen, onClose, accounts, clients, onSaveSuccess }: { isOpen: boolean; onClose: () => void; accounts: Cuenta[]; clients: Cliente[]; onSaveSuccess: (message: string) => void; }) => {
    const { user: loggedInUser } = useAuth();
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedClientId || !loggedInUser) { toast.error("Por favor, selecciona un cliente."); return; }
        setFormLoading(true);
        const loadingToast = toast.loading(`Vendiendo ${accounts.length} cuenta(s)...`);
        try {
            const salePromises = accounts.map(account => 
                asignarCuenta({
                    cuentaId: account.id,
                    clienteId: selectedClientId,
                    precioVenta: account.precioVenta, 
                    usuarioAsignadorId: loggedInUser.id,
                })
            );
            await Promise.all(salePromises);
            toast.dismiss(loadingToast);
            onSaveSuccess(`${accounts.length} cuenta(s) vendida(s) exitosamente.`);
            onClose();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || "Error al vender las cuentas en lote.");
        } finally {
            setFormLoading(false);
        }
    };
    if (!isOpen) return null;
    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-lg mx-4">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700"><h2 className="text-2xl font-bold text-white flex items-center gap-3"><Layers className="text-green-400" />Vender Cuentas Completas</h2><button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button></div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-slate-300">Vas a vender <strong className="text-white">{accounts.length}</strong> cuenta(s) completa(s).</p>
                        <div><label className="label-style">Asignar al Cliente</label><select onChange={(e) => setSelectedClientId(Number(e.target.value))} className="input-style-dark p-3" required><option value="" disabled selected>Elige un cliente...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}</select></div>
                        <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-700"><button type="button" onClick={onClose} className="btn-secondary-dark">Cancelar</button><button type="submit" disabled={formLoading} className="btn-primary-dark">{formLoading ? <RefreshCw className="animate-spin" /> : <CheckCircle />}{formLoading ? 'Vendiendo...' : 'Confirmar Venta'}</button></div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
const AccountDetailModal = ({ isOpen, onClose, account, clients, service }: { isOpen: boolean; onClose: () => void; account: Cuenta | null; clients: Cliente[]; service: Servicio | undefined }) => {
    if (!isOpen || !account) return null;
    
    const parsedProfiles = useMemo(() => {
        if (!account.perfiles) return [];
        try {
            const profiles = JSON.parse(account.perfiles);
            if (Array.isArray(profiles)) {
                return profiles.map(p => {
                    const client = clients.find(c => c.id === p.clienteId);
                    return { name: p.perfilNombre, client: client };
                });
            }
        } catch (e) {
            const client = clients.find(c => c.id === account.clienteId);
            return [{ name: account.perfiles, client: client }];
        }
        return [];
    }, [account, clients]);

    const generateWhatsAppLink = (client: Cliente, message: string) => {
        const encodedMessage = encodeURIComponent(message);
        const baseLink = client.linkWhatsapp || (client.numero ? `https://wa.me/51${client.numero}` : '');
        if (!baseLink) return '#';
        const separator = baseLink.includes('?') ? '&' : '?';
        return `${baseLink}${separator}text=${encodedMessage}`;
    };

    const getAccountDetailsMessage = () => {
        const messageLines = [
            `🎉 ¡Hola !`, "",
            `Aquí tienes los detalles de tu ${account.tipoCuenta === 'INDIVIDUAL' ? 'perfil' : 'cuenta completa'} para el servicio de *${service?.nombre}*:`, "",
            `📧 *Correo:* \`${account.correo}\``,
            `🔑 *Contraseña:* \`${account.contraseña}\``,
            `📍 *PIN:* ${account.pin || 'No aplica'}`, "",
            `▶️ *Fecha de Activación:* ${displayDate(account.fechaInicio)}`,
            `🗓️ *Fecha de Vencimiento:* ${displayDate(account.fechaRenovacion)}`, "",
        ];

        if (account.tipoCuenta === 'COMPLETO') {
            if (account.enlace) {
                messageLines.push(`🔗 *Enlace:* ${account.enlace}`);
            }
            if (account.descripcion) {
                messageLines.push(`📝 *Descripción:* ${account.descripcion}`);
            }
        }

        messageLines.push("", "¡Que disfrutes del servicio! ✨");
        return messageLines.join('\n');
    };

    const displayDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString.replace(/-/g, '/'));
        return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Lima' });
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Eye className="text-blue-400" />
                            Detalles de {account.tipoCuenta === 'INDIVIDUAL' ? 'Perfiles' : 'Cuenta Completa'}
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            {service?.urlImg && (
                                <Image 
                                    src={service.urlImg} 
                                    alt={service.nombre} 
                                    width={40} 
                                    height={40} 
                                    className="rounded-full object-cover"
                                />
                            )}
                            <div>
                                <p className="font-mono text-lg font-semibold">{account.correo}</p>
                                <p className="text-sm text-slate-400">{service?.nombre}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-400">Contraseña</p>
                                <p className="font-mono">{account.contraseña || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400">PIN</p>
                                <p className="font-mono">{account.pin || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Fecha Inicio</p>
                                <p>{displayDate(account.fechaInicio)}</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Fecha Renovación</p>
                                <p>{displayDate(account.fechaRenovacion)}</p>
                            </div>
                        </div>

                        {account.tipoCuenta === 'COMPLETO' && (
                            <>
                                {account.enlace && (
                                    <div>
                                        <p className="text-slate-400">Enlace</p>
                                        <a href={account.enlace} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                                            <LinkIcon size={14} /> {account.enlace}
                                        </a>
                                    </div>
                                )}
                                {account.descripcion && (
                                    <div>
                                        <p className="text-slate-400">Descripción</p>
                                        <p className="text-slate-300">{account.descripcion}</p>
                                    </div>
                                )}
                            </>
                        )}

                        {account.tipoCuenta === 'INDIVIDUAL' && (
                            <>
                                <h3 className="font-semibold text-slate-300 border-t border-slate-700 pt-4">
                                    Perfiles Asignados
                                </h3>
                                <ul className="space-y-2 max-h-60 overflow-y-auto">
                                    {parsedProfiles.length > 0 ? (
                                        parsedProfiles.map((profile, index) => {
                                            const message = getAccountDetailsMessage();
                                            const whatsappLink = profile.client ? 
                                                generateWhatsAppLink(profile.client, message) : '#';
                                            
                                            return (
                                                <li key={index} className="bg-slate-700/50 p-3 rounded-md flex justify-between items-center text-sm">
                                                    <div>
                                                        <span className='font-semibold'>{profile.name}</span>
                                                        <span className="text-xs text-slate-400 block">
                                                            {profile.client ? `${profile.client.nombre} ${profile.client.apellido}` : 'Desconocido'}
                                                        </span>
                                                    </div>
                                                    {profile.client && (
                                                        <a 
                                                            href={whatsappLink} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="p-2 text-green-400 hover:bg-green-500/20 rounded-md"
                                                        >
                                                            <WhatsAppIcon className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </li>
                                            );
                                        })
                                    ) : (
                                        <p className="text-slate-400 text-sm">No hay perfiles asignados todavía.</p>
                                    )}
                                </ul>
                            </>
                        )}

                        {account.tipoCuenta === 'COMPLETO' && account.clienteId && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-slate-400">Cliente</p>
                                        <p className="font-medium">
                                            {clients.find(c => c.id === account.clienteId)?.nombre || 'Desconocido'}
                                        </p>
                                    </div>
                                    <a 
                                        href={generateWhatsAppLink(
                                            clients.find(c => c.id === account.clienteId)!, 
                                            getAccountDetailsMessage()
                                        )} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="btn-primary-dark !bg-green-600 hover:!bg-green-700 !py-2 !px-4"
                                    >
                                        <WhatsAppIcon className="w-4 h-4" /> Enviar por WhatsApp
                                    </a>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-700">
                            <button type="button" onClick={onClose} className="btn-secondary-dark">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
const ChangeAccountModal = ({ isOpen, onClose, oldAccount, availableAccounts, onSaveSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    oldAccount: Cuenta | null;
    availableAccounts: Cuenta[];
    onSaveSuccess: (message: string) => void;
}) => {
    const { user: loggedInUser } = useAuth();
    const [newAccountId, setNewAccountId] = useState<number | null>(null);
    const [motivo, setMotivo] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    
    useEffect(() => {
        if (!isOpen) {
            setNewAccountId(null);
            setMotivo('');
        }
    }, [isOpen]);
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!newAccountId || !motivo || !oldAccount || !loggedInUser) {
            toast.error("Por favor, selecciona una cuenta nueva y escribe un motivo.");
            return;
        }
        setFormLoading(true);
        const loadingToast = toast.loading("Realizando cambio de cuenta...");
        try {
            await cambiarCuenta({
                cuentaAnteriorId: oldAccount.id,
                cuentaNuevaId: newAccountId,
                motivo,
                usuarioId: loggedInUser.id,
            });
            toast.dismiss(loadingToast);
            onSaveSuccess("El cambio de cuenta se ha realizado exitosamente.");
            onClose();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || "Error al cambiar la cuenta.");
        } finally {
            setFormLoading(false);
        }
    };
    if (!isOpen) return null;
    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-lg mx-4">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700"><h2 className="text-2xl font-bold text-white flex items-center gap-3"><Repeat className="text-blue-400" />Cambiar Cuenta</h2><button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button></div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><label className="label-style">Cuenta Anterior (a reemplazar)</label><p className="input-style-dark p-3 bg-slate-700/50">{oldAccount?.correo}</p></div>
                        <div><label className="label-style">Seleccionar Nueva Cuenta Disponible</label><select onChange={(e) => setNewAccountId(Number(e.target.value))} className="input-style-dark p-3" required><option value="" disabled selected>Elige una cuenta de reemplazo...</option>{availableAccounts.map(c => <option key={c.id} value={c.id}>{c.correo}</option>)}</select></div>
                        <div><label className="label-style">Motivo del Cambio</label><input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="input-style-dark p-3" required /></div>
                        <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-700"><button type="button" onClick={onClose} className="btn-secondary-dark">Cancelar</button><button type="submit" disabled={formLoading} className="btn-primary-dark">{formLoading ? <RefreshCw className="animate-spin" /> : <CheckCircle />}{formLoading ? 'Procesando...' : 'Confirmar Cambio'}</button></div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
// --- MAIN PAGE COMPONENT ---
export default function CuentasPage() {
    const { user: loggedInUser } = useAuth();
    const [cuentas, setCuentas] = useState<Cuenta[]>([]);
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [reportes, setReportes] = useState<Reporte[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filters, setFilters] = useState({ searchTerm: '', serviceId: 'all' });
    const [activeTab, setActiveTab] = useState<'stock' | 'sold' | 'fallen'>('stock');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | 'sell-profile' | 'bulk-create' | 'bulk-sell' | 'change' | 'detail' | null>(null);
    const [currentAccount, setCurrentAccount] = useState<Cuenta | null>(null);
    const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
    const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const [accountsData, servicesData, clientsData, reportsData] = await Promise.all([
            searchCuentas({}), 
            getAllServicios(), 
            getAllClientes(),
            getAllReportes()
        ]);
        
        setCuentas(accountsData.map((acc: any) => ({ ...acc, precioVenta: Number(acc.precioVenta) || 0 })));
        setServicios(servicesData);
        setClientes(clientsData.map(client => ({
            ...client,
            tipo: client.tipoCliente || 'NORMAL' // Valor por defecto
        })));
        setReportes(reportsData);
    } catch (err) {
        toast.error('No se pudieron cargar los datos iniciales.');
    } finally {
        setLoading(false);
    }
}, []);
    useEffect(() => { fetchData(); }, [fetchData]);
    const getProfileCount = (account: Cuenta): number => {
        if (account.tipoCuenta !== TipoCuenta.INDIVIDUAL || !account.perfiles) {
            return 0;
        }
        try {
            const parsed = JSON.parse(account.perfiles);
            return Array.isArray(parsed) ? parsed.length : 0;
        } catch (e) {
            return account.perfiles.trim() ? 1 : 0;
        }
    };
    const filteredCuentas = useMemo(() => {
        let sourceData: Cuenta[];
        if (activeTab === 'stock') {
            sourceData = cuentas.filter(acc => {
                if (acc.status === StatusCuenta.SINUSAR) return true;
                if (acc.tipoCuenta === TipoCuenta.INDIVIDUAL && acc.status === StatusCuenta.ACTIVO) {
                    const profileCount = getProfileCount(acc);
                    return profileCount < (acc.perfilesMaximos || 0);
                }
                return false;
            });
        } else if (activeTab === 'sold') {
            sourceData = cuentas.filter(acc => acc.status === StatusCuenta.ACTIVO || acc.status === StatusCuenta.VENCIDO);
        } else { // fallen
            sourceData = cuentas.filter(acc => acc.status === StatusCuenta.REEMPLAZADA);
        }
        
        return sourceData.filter(account =>
            (account.correo.toLowerCase().includes(filters.searchTerm.toLowerCase())) &&
            (filters.serviceId === 'all' || account.servicioId === parseInt(filters.serviceId))
        );
    }, [cuentas, filters, activeTab]);
    
    const handleOpenModal = (mode: 'add' | 'edit' | 'delete' | 'sell-profile' | 'bulk-create' | 'bulk-sell' | 'change' | 'detail' | null, account: Cuenta | null = null) => {
        setModalMode(mode);
        setCurrentAccount(account);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalMode(null);
        setCurrentAccount(null);
    };
    
    const handleSaveSuccess = (message: string) => {
        toast.success(message);
        setSelectedAccounts([]);
        handleCloseModal();
        fetchData();
    };
    
    const handleSelectAccount = (accountId: number) => {
        setSelectedAccounts(prev => 
            prev.includes(accountId) 
                ? prev.filter(id => id !== accountId) 
                : [...prev, accountId]
        );
    };
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const accountsToSelect = filteredCuentas
                .filter(acc => acc.tipoCuenta === TipoCuenta.COMPLETO)
                .map(acc => acc.id);
            setSelectedAccounts(accountsToSelect);
        } else {
            setSelectedAccounts([]);
        }
    };
    const handleDelete = async () => {
        if (!currentAccount) return;
        const loadingToast = toast.loading("Eliminando cuenta...");
        try {
            await deleteCuenta(currentAccount.id);
            toast.dismiss(loadingToast);
            handleSaveSuccess("Cuenta eliminada correctamente.");
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || "Error al eliminar la cuenta.");
        }
    };
    
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
    const isAccountReadyToSell = (account: Cuenta) => {
        return account.correo && account.contraseña && account.pin;
    }
    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8">
            <Toaster position="top-right" toastOptions={{ className: 'bg-slate-700 text-white shadow-lg', success: { iconTheme: { primary: '#10b981', secondary: 'white' } }, error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } } }} />
            
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><KeyRound />Gestión de Cuentas</h1>
                        <p className="mt-2 text-slate-400">Administra, asigna y vende perfiles de cuentas de forma sencilla.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
                        <button onClick={() => handleOpenModal('bulk-create')} className="btn-secondary-dark !bg-indigo-600/20 !border-indigo-500/30 !text-indigo-300 hover:!bg-indigo-500/30 justify-center">
                            <FileText size={16} />Crear por Lote
                        </button>
                        <button onClick={() => handleOpenModal('add')} className="btn-primary-dark">
                            <Plus size={16} />Nueva Cuenta
                        </button>
                    </div>
                </div>
                <div className="mb-6 border-b border-slate-700 flex">
                    <button onClick={() => { setActiveTab('stock'); setSelectedAccounts([]); }} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'stock' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
                        <Inbox size={16} /> En Stock
                    </button>
                    <button onClick={() => { setActiveTab('sold'); setSelectedAccounts([]); }} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sold' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
                        <CheckCircle size={16} /> Vendidas
                    </button>
                    <button onClick={() => { setActiveTab('fallen'); setSelectedAccounts([]); }} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'fallen' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
                        <AlertTriangle size={16} /> Caídas
                    </button>
                </div>
                
                <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative lg:col-span-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" name="searchTerm" placeholder="Buscar por correo..." value={filters.searchTerm} onChange={(e) => setFilters(prev => ({...prev, searchTerm: e.target.value}))} className="input-style-dark pl-10 pr-4 py-3 w-full" /></div>
                    <select name="serviceId" value={filters.serviceId} onChange={(e) => setFilters(prev => ({...prev, serviceId: e.target.value}))} className="input-style-dark w-full px-4 py-3"><option value="all">Todos los Servicios</option>{servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select>
                </div>
                {loading ? <div className="text-center py-10"><RefreshCw className="animate-spin text-3xl mx-auto text-blue-400" /></div> : (
                    <div>
                        <AnimatePresence>
                            {selectedAccounts.length > 0 && activeTab === 'stock' && (
                                <motion.div initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -20}} className="mb-4 bg-slate-700 p-3 rounded-lg flex justify-between items-center">
                                    <span className="font-semibold">{selectedAccounts.length} cuenta(s) completa(s) seleccionada(s)</span>
                                    <button onClick={() => handleOpenModal('bulk-sell')} className="btn-primary-dark !bg-green-600 hover:!bg-green-700 !py-2 !px-4">
                                        <DollarSign size={16}/> Vender Seleccionadas
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-x-auto">
                            <table className="min-w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-800">
    <tr>
        {activeTab === 'stock' && <th scope="col" className="p-4"><input type="checkbox" className="form-checkbox" onChange={handleSelectAll} checked={selectedAccounts.length === filteredCuentas.filter(a => a.tipoCuenta === 'COMPLETO').length && filteredCuentas.length > 0 && filteredCuentas.filter(a => a.tipoCuenta === 'COMPLETO').length > 0} /></th>}
        <th scope="col" className="px-4 py-3">Cuenta</th>
        <th scope="col" className="px-4 py-3">Estado</th>
        <th scope="col" className="px-4 py-3">Tipo</th>
        <th scope="col" className="px-4 py-3">Perfiles</th>
        <th scope="col" className="px-4 py-3">Cliente Principal</th>
        <th scope="col" className="px-4 py-3">Renovación</th>
        <th scope="col" className="px-4 py-3 text-center">Acciones</th>
    </tr>
</thead>
                                <tbody className="text-slate-200">
                                    {filteredCuentas.map((account) => {
                                        const client = clientes.find(c => c.id === account.clienteId);
                                        const service = servicios.find(s => s.id === account.servicioId);
                                        const profileCount = getProfileCount(account);
                                        const hasReport = reportes.some(r => r.cuentaId === account.id);
                                        return (
                                            <tr key={account.id} className={`border-b border-slate-700 transition-colors ${selectedAccounts.includes(account.id) ? 'bg-blue-900/50' : 'hover:bg-slate-800'}`}>
                                                {activeTab === 'stock' && <td className="p-4"><input type="checkbox" className="form-checkbox" disabled={account.tipoCuenta !== TipoCuenta.COMPLETO} checked={selectedAccounts.includes(account.id)} onChange={() => handleSelectAccount(account.id)} /></td>}
                                                <td className="px-4 py-4"><div className="flex items-center gap-3">{service && <Image src={service.urlImg || 'https://placehold.co/40x40/1e293b/94a3b8?text=S'} alt={service.nombre} width={24} height={24} className="rounded-full object-cover" />}<div><div className="font-medium text-white">{account.correo}</div><div className="text-slate-400 text-xs font-mono">Pass: {account.contraseña || 'N/A'}</div></div></div></td>
                                                <td className="px-4 py-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(account.status)}`}>
                    {account.status}
                </span>
            </td>
                                                <td className="px-4 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${account.tipoCuenta === 'INDIVIDUAL' ? 'bg-purple-500/20 text-purple-300' : 'bg-orange-500/20 text-orange-300'}`}>{account.tipoCuenta}</span></td>
                                                <td className="px-4 py-4">{account.tipoCuenta === TipoCuenta.INDIVIDUAL ? (<div className="text-xs w-28"><p>{profileCount} de {account.perfilesMaximos} usados</p><div className="w-full bg-slate-700 rounded-full h-1.5 mt-1"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(profileCount / (account.perfilesMaximos || 1)) * 100}%` }}></div></div></div>) : (<span className="text-slate-400">N/A</span>)}</td>
                                                <td className="px-4 py-4">{client ? `${client.nombre} ${client.apellido}` : <span className="text-slate-400">N/A</span>}</td>
                                                <td className="px-4 py-4">{displayDate(account.fechaRenovacion)}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex justify-center items-center gap-1.5">
                                                        {activeTab === 'stock' && (
                                                            <div className="relative group">
                                                                <button onClick={() => handleOpenModal('sell-profile', account)} disabled={!isAccountReadyToSell(account)} className="btn-primary-dark text-xs !py-1 !px-2 disabled:!bg-slate-600 disabled:cursor-not-allowed"><UserPlus size={14}/> Vender</button>
                                                                {!isAccountReadyToSell(account) && <Tooltip text="Editar y completar datos para poder vender" />}
                                                            </div>
                                                            
                                                        )}
                                                        {activeTab === 'sold' && (
                                                            <div className="relative group">
                                                                <button onClick={() => handleOpenModal('detail', account)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"><Eye size={16} /></button>
                                                                <Tooltip text="Ver Detalles" />
                                                            </div>
                                                        )}
                                                        {hasReport && (
                                                            <div className="relative group">
                                                                <button onClick={() => handleOpenModal('change', account)} className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md"><Repeat size={16} /></button>
                                                                <Tooltip text="Cambiar Cuenta (Garantía)" />
                                                            </div>
                                                        )}
                                                        {/* Mostrar editar y eliminar solo en stock */}
                                                        {activeTab === 'stock' && (
                                                            <>
                                                                <div className="relative group">
                                                                    <button onClick={() => handleOpenModal('edit', account)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"><Edit size={16} /></button>
                                                                    <Tooltip text="Editar" />
                                                                </div>
                                                                <div className="relative group">
                                                                    <button onClick={() => handleOpenModal('delete', account)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><Trash2 size={16} /></button>
                                                                    <Tooltip text="Eliminar" />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {!loading && filteredCuentas.length === 0 && <p className="text-center py-10 text-slate-500">No se encontraron cuentas.</p>}
                {/* --- Modals --- */}
                {isModalOpen && (modalMode === 'add' || modalMode === 'edit') && (<AccountFormModal isOpen={isModalOpen} onClose={handleCloseModal} mode={modalMode} account={currentAccount} services={servicios} onSaveSuccess={handleSaveSuccess} />)}
                {isModalOpen && modalMode === 'sell-profile' && (<AssignModal isOpen={isModalOpen} onClose={handleCloseModal} account={currentAccount} clients={clientes} onSaveSuccess={handleSaveSuccess} />)}
                {isModalOpen && modalMode === 'bulk-create' && (<BulkCreateModal isOpen={isModalOpen} onClose={handleCloseModal} services={servicios} onSaveSuccess={handleSaveSuccess} />)}
                {isModalOpen && modalMode === 'bulk-sell' && (<BulkSellModal isOpen={isModalOpen} onClose={handleCloseModal} accounts={cuentas.filter(c => selectedAccounts.includes(c.id))} clients={clientes} onSaveSuccess={handleSaveSuccess} />)}
                {isModalOpen && modalMode === 'detail' && (<AccountDetailModal isOpen={isModalOpen} onClose={handleCloseModal} account={currentAccount} clients={clientes} service={servicios.find(s => s.id === currentAccount?.servicioId)} />)}
                {isModalOpen && modalMode === 'change' && (<ChangeAccountModal isOpen={isModalOpen} onClose={handleCloseModal} oldAccount={currentAccount} availableAccounts={cuentas.filter(c => c.servicioId === currentAccount?.servicioId && c.status === 'SINUSAR')} onSaveSuccess={handleSaveSuccess} />)}
                
                <AnimatePresence>
                {isModalOpen && modalMode === 'delete' && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700"><h2 className="text-xl font-bold text-white flex items-center gap-3"><AlertTriangle className="text-red-400"/>Confirmar Eliminación</h2><button onClick={handleCloseModal} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button></div>
                            <div className="space-y-4"><p className="text-slate-300">¿Estás seguro de que quieres eliminar la cuenta <strong className="text-white">{currentAccount?.correo}</strong>? Esta acción es irreversible.</p><div className="flex justify-end gap-3 pt-4"><button onClick={handleCloseModal} className="btn-secondary-dark">Cancelar</button><button onClick={handleDelete} className="btn-danger-dark">Sí, eliminar</button></div></div>
                        </motion.div>
                    </div>
                )}
                </AnimatePresence>
            </div>
            <style jsx global>{`
                .label-style { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #cbd5e1; }
                .input-style-dark { background-color: rgb(30 41 59 / 0.5); border: 1px solid #334155; color: #e2e8f0; font-size: 0.875rem; border-radius: 0.5rem; display: block; width: 100%; transition: all 0.2s ease-in-out; }
                .input-style-dark:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4); }
                .btn-primary-dark { background-color: #2563eb; color: white; font-weight: 600; padding: 0.625rem 1.25rem; border-radius: 0.5rem; text-align: center; transition: all 0.2s ease-in-out; display: flex; align-items: center; gap: 0.5rem; justify-content: center; }
                .btn-primary-dark:hover { background-color: #1d4ed8; }
                .btn-primary-dark:disabled { background-color: #1e40af; cursor: not-allowed; opacity: 0.7; }
                .btn-secondary-dark { background-color: #334155; color: #e2e8f0; font-weight: 500; padding: 0.625rem 1.25rem; border-radius: 0.5rem; border: 1px solid #475569; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease-in-out; }
                .btn-secondary-dark:hover { background-color: #475569; }
                .btn-danger-dark { background-color: #be123c; color: white; font-weight: 600; padding: 0.625rem 1.25rem; border-radius: 0.5rem; transition: all 0.2s ease-in-out; }
                .btn-danger-dark:hover { background-color: #9f1239; }
                .form-checkbox {
                    appearance: none;
                    background-color: #475569;
                    border: 1px solid #64748b;
                    padding: 0.5rem;
                    border-radius: 0.25rem;
                    display: inline-block;
                    position: relative;
                    cursor: pointer;
                }
                .form-checkbox:checked {
                    background-color: #2563eb;
                    border-color: #3b82f6;
                }
                .form-checkbox:checked::after {
                    content: '✔';
                    font-size: 0.8rem;
                    color: white;
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                }
                .form-checkbox:disabled {
                    background-color: #334155;
                    border-color: #475569;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}