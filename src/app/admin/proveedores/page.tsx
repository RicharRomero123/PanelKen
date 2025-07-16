'use client';

import { useEffect, useState, useCallback, FormEvent, useMemo } from 'react';
// Usamos rutas relativas para máxima compatibilidad
import { getAllProveedores, createProveedor, updateProveedor, deleteProveedor } from '../../../services/proveedorService';
import { Plus, Edit, Trash2, X, Search, RefreshCw, AlertTriangle, CheckCircle, Briefcase, User, Mail, Phone, Link as LinkIcon, DollarSign, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import { FaWhatsapp } from 'react-icons/fa';

// --- Tipos definidos localmente ---
interface Proveedor {
    id: number;
    nombre: string;
    correo: string;
    numero: string;
    linkWhatsapp: string;
    tipoServicio: string;
    tipoCuentaQueProvee: string;
    precioReferencial: number;
}

// --- Opciones para los selectores del formulario ---
const serviceTypes = ["Streaming", "VPN", "Música", "Juegos", "Otro"];
const accountTypes = ["Netflix", "Disney+", "Crunchyroll", "Vix", "Spotify", "Otro"];

// --- Componente del Modal del Formulario ---
const ProviderFormModal = ({ isOpen, onClose, mode, provider, onSaveSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    provider: Proveedor | null;
    onSaveSuccess: (message: string) => void;
}) => {
    const initialFormData = useMemo(() => ({
        nombre: provider?.nombre || '',
        correo: provider?.correo || '',
        numero: provider?.numero || '',
        linkWhatsapp: provider?.linkWhatsapp || '',
        tipoServicio: provider?.tipoServicio || '',
        tipoCuentaQueProvee: provider?.tipoCuentaQueProvee || '',
        precioReferencial: provider?.precioReferencial || 0,
    }), [provider]);

    const [formData, setFormData] = useState(initialFormData);
    const [formLoading, setFormLoading] = useState(false);
    
    const [isOtherService, setIsOtherService] = useState(false);
    const [isOtherAccount, setIsOtherAccount] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormData);
            setIsOtherService(!!provider && !serviceTypes.includes(provider.tipoServicio));
            setIsOtherAccount(!!provider && !accountTypes.includes(provider.tipoCuentaQueProvee));
        }
    }, [isOpen, initialFormData, provider]);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isOther = value === 'Otro';
        
        if (name === 'tipoServicio') {
            setIsOtherService(isOther);
            setFormData(prev => ({ ...prev, tipoServicio: isOther ? '' : value }));
        } else if (name === 'tipoCuentaQueProvee') {
            setIsOtherAccount(isOther);
            setFormData(prev => ({ ...prev, tipoCuentaQueProvee: isOther ? '' : value }));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'precioReferencial' ? parseFloat(value) || 0 : value }));
    };
    
    const handleGenerateWhatsAppLink = () => {
        if (formData.numero && /^\d{9,}$/.test(formData.numero)) {
            const phone = formData.numero.startsWith('51') ? formData.numero : `51${formData.numero}`;
            setFormData(prev => ({ ...prev, linkWhatsapp: `https://wa.me/${phone}` }));
            toast.success("Link de WhatsApp generado.");
        } else {
            toast.error("Por favor, introduce un número de teléfono válido de 9 dígitos.");
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        const loadingToast = toast.loading(mode === 'add' ? 'Creando proveedor...' : 'Actualizando proveedor...');
        try {
            if (mode === 'add') {
                await createProveedor(formData);
            } else if (mode === 'edit' && provider) {
                await updateProveedor(provider.id, formData);
            }
            toast.dismiss(loadingToast);
            onSaveSuccess(mode === 'add' ? 'Proveedor creado exitosamente' : 'Proveedor actualizado exitosamente');
            onClose();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || `Error al ${mode === 'add' ? 'crear' : 'actualizar'} el proveedor.`);
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Briefcase className="text-blue-400" />{mode === 'add' ? 'Crear Nuevo Proveedor' : 'Editar Proveedor'}</h2>
                            <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-h-[80vh] overflow-y-auto p-1">
                            <div>
                                <label className="label-style">Nombre</label>
                                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className="input-style-dark p-3" required />
                            </div>
                            <div>
                                <label className="label-style">Correo</label>
                                <input type="email" name="correo" value={formData.correo} onChange={handleInputChange} className="input-style-dark p-3" />
                            </div>
                            <div>
                                <label className="label-style">Número de Teléfono</label>
                                <div className="flex gap-2">
                                    <input type="tel" name="numero" value={formData.numero} onChange={handleInputChange} className="input-style-dark p-3 flex-grow" />
                                    <button type="button" onClick={handleGenerateWhatsAppLink} className="btn-secondary-dark !ml-0 px-3" title="Generar Link de WhatsApp"><LinkIcon size={18}/></button>
                                </div>
                            </div>
                             <div>
                                <label className="label-style">Link de WhatsApp</label>
                                <input type="text" name="linkWhatsapp" value={formData.linkWhatsapp} onChange={handleInputChange} className="input-style-dark p-3" />
                            </div>
                            <div>
                                <label className="label-style">Tipo de Servicio</label>
                                <select name="tipoServicio" value={isOtherService ? 'Otro' : formData.tipoServicio} onChange={handleSelectChange} className="input-style-dark p-3" required>
                                    <option value="" disabled>Selecciona un tipo</option>
                                    {serviceTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                                {isOtherService && (
                                    <input type="text" name="tipoServicio" placeholder="Especifica el servicio" value={formData.tipoServicio} onChange={handleInputChange} className="input-style-dark p-3 mt-2" required />
                                )}
                            </div>
                            <div>
                                <label className="label-style">Tipo de Cuenta que Provee</label>
                                <select name="tipoCuentaQueProvee" value={isOtherAccount ? 'Otro' : formData.tipoCuentaQueProvee} onChange={handleSelectChange} className="input-style-dark p-3" required>
                                    <option value="" disabled>Selecciona una cuenta</option>
                                    {accountTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                                {isOtherAccount && (
                                    <input type="text" name="tipoCuentaQueProvee" placeholder="Especifica la cuenta" value={formData.tipoCuentaQueProvee} onChange={handleInputChange} className="input-style-dark p-3 mt-2" required />
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="label-style">Precio Referencial</label>
                                <input type="number" name="precioReferencial" value={formData.precioReferencial} onChange={handleInputChange} className="input-style-dark p-3" min="0" step="0.01" />
                            </div>
                            <div className="md:col-span-2 mt-4 flex justify-end gap-4 pt-4 border-t border-slate-700">
                                <button type="button" onClick={onClose} className="btn-secondary-dark">Cancelar</button>
                                <button type="submit" disabled={formLoading} className="btn-primary-dark">
                                    {formLoading ? <RefreshCw className="animate-spin" /> : (mode === 'add' ? <Plus/> : <CheckCircle/>)}
                                    {formLoading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default function ProveedoresPage() {
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
    const [accountTypeFilter, setAccountTypeFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | null>(null);
    const [currentProvider, setCurrentProvider] = useState<Proveedor | null>(null);

    const fetchProveedores = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllProveedores();
            setProveedores(data);
        } catch (err) {
            toast.error('No se pudieron cargar los proveedores.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProveedores(); }, [fetchProveedores]);

    const filteredProveedores = useMemo(() => {
        return proveedores.filter(provider => {
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = 
                provider.nombre.toLowerCase().includes(searchTermLower) ||
                (provider.numero && provider.numero.includes(searchTerm));
            const matchesServiceType = serviceTypeFilter === 'all' || provider.tipoServicio === serviceTypeFilter;
            const matchesAccountType = accountTypeFilter === 'all' || provider.tipoCuentaQueProvee === accountTypeFilter;
            return matchesSearch && matchesServiceType && matchesAccountType;
        });
    }, [proveedores, searchTerm, serviceTypeFilter, accountTypeFilter]);

    const handleOpenModal = (mode: 'add' | 'edit' | 'delete', provider: Proveedor | null = null) => {
        setModalMode(mode);
        setCurrentProvider(provider);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalMode(null);
        setCurrentProvider(null);
    };
    
    const handleSaveSuccess = (message: string) => {
        toast.success(message);
        fetchProveedores();
        handleCloseModal();
    };
    
    const generateWhatsAppMessageLink = (provider: Proveedor) => {
        const message = `👋 Hola ${provider.nombre}, te contacto por el servicio de 📺 ${provider.tipoCuentaQueProvee}.`;
        const encodedMessage = encodeURIComponent(message);
        return provider.linkWhatsapp ? `${provider.linkWhatsapp}?text=${encodedMessage}` : `https://wa.me/51${provider.numero}?text=${encodedMessage}`;
    };

    const handleDelete = async () => {
        if (!currentProvider) return;
        const loadingToast = toast.loading("Eliminando proveedor...");
        try {
            await deleteProveedor(currentProvider.id);
            toast.dismiss(loadingToast);
            handleSaveSuccess("Proveedor eliminado correctamente.");
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || "Error al eliminar el proveedor.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">
            <Toaster position="top-right" toastOptions={{ className: 'bg-slate-700 text-white shadow-lg', success: { iconTheme: { primary: '#10b981', secondary: 'white' } }, error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } } }} />
            
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><Briefcase />Gestión de Proveedores</h1>
                        <p className="mt-2 text-slate-400">Administra los proveedores de servicios.</p>
                    </div>
                    <button onClick={() => handleOpenModal('add')} className="mt-4 md:mt-0 bg-blue-600 text-white hover:bg-blue-700 font-bold py-2.5 px-5 rounded-lg shadow-md transition duration-300 flex items-center gap-2">
                        <Plus />Nuevo Proveedor
                    </button>
                </div>

                <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Buscar por nombre o número..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-style-dark pl-10 pr-4 py-3 w-full" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <select value={serviceTypeFilter} onChange={(e) => setServiceTypeFilter(e.target.value)} className="input-style-dark w-full sm:w-48 px-4 py-3">
                            <option value="all">Todos los Servicios</option>
                            {serviceTypes.filter(t => t !== 'Otro').map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                         <select value={accountTypeFilter} onChange={(e) => setAccountTypeFilter(e.target.value)} className="input-style-dark w-full sm:w-48 px-4 py-3">
                            <option value="all">Todas las Cuentas</option>
                            {accountTypes.filter(t => t !== 'Otro').map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? <div className="text-center py-10"><RefreshCw className="animate-spin text-3xl mx-auto text-blue-400" /></div> : (
                    <>
                        <div className="hidden md:block bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left">
                                    <thead className="text-xs text-slate-400 uppercase bg-slate-800">
                                        <tr>
                                            <th scope="col" className="px-6 py-4">Proveedor</th>
                                            <th scope="col" className="px-6 py-4">Número</th>
                                            <th scope="col" className="px-6 py-4">Servicio</th>
                                            <th scope="col" className="px-6 py-4">Tipo de Cuenta</th>
                                            <th scope="col" className="px-6 py-4">Precio Ref.</th>
                                            <th scope="col" className="px-6 py-4 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-200">
                                        {filteredProveedores.map((provider) => (
                                            <tr key={provider.id} className="border-b border-slate-700 hover:bg-slate-800 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium">{provider.nombre}</div>
                                                    <div className="text-slate-400">{provider.correo || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4">{provider.numero || 'N/A'}</td>
                                                <td className="px-6 py-4">{provider.tipoServicio}</td>
                                                <td className="px-6 py-4">{provider.tipoCuentaQueProvee}</td>
                                                <td className="px-6 py-4">S/ {provider.precioReferencial.toFixed(2)}</td>
                                                <td className="px-6 py-4 flex justify-center items-center gap-2">
                                                    <a href={generateWhatsAppMessageLink(provider)} target="_blank" rel="noopener noreferrer" className="p-2 text-green-400 hover:text-white hover:bg-green-500/20 rounded-md" title="Enviar Mensaje"><FaWhatsapp className="w-4 h-4" /></a>
                                                    <button onClick={() => handleOpenModal('edit', provider)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"><Edit size={16} /></button>
                                                    <button onClick={() => handleOpenModal('delete', provider)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:hidden">
                            <AnimatePresence>
                            {filteredProveedores.map((provider) => (
                                <motion.div key={provider.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-lg text-white">{provider.nombre}</p>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleOpenModal('edit', provider)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"><Edit size={16} /></button>
                                            <button onClick={() => handleOpenModal('delete', provider)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-700 pt-3 space-y-2 text-sm">
                                        <p className="flex items-center gap-2 text-slate-300"><Mail size={14} /> {provider.correo || 'N/A'}</p>
                                        <p className="flex items-center gap-2 text-slate-300"><Phone size={14} /> {provider.numero || 'N/A'}</p>
                                        <p className="flex items-center gap-2 text-slate-300"><Tag size={14} /> {provider.tipoServicio}</p>
                                        <p className="flex items-center gap-2 text-slate-300"><DollarSign size={14} /> S/ {provider.precioReferencial.toFixed(2)}</p>
                                    </div>
                                    <div className="pt-3 border-t border-slate-700">
                                         <a href={generateWhatsAppMessageLink(provider)} target="_blank" rel="noopener noreferrer" className="w-full btn-primary-dark !bg-green-600 hover:!bg-green-700"><FaWhatsapp className="w-4 h-4" /> Enviar Mensaje</a>
                                    </div>
                                </motion.div>
                            ))}
                            </AnimatePresence>
                        </div>
                    </>
                )}
                {!loading && filteredProveedores.length === 0 && <p className="text-center py-10 text-slate-500">No se encontraron proveedores.</p>}

                {isModalOpen && (modalMode === 'add' || modalMode === 'edit') && (
                    <ProviderFormModal isOpen={isModalOpen} onClose={handleCloseModal} mode={modalMode} provider={currentProvider} onSaveSuccess={handleSaveSuccess} />
                )}

                <AnimatePresence>
                {isModalOpen && modalMode === 'delete' && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3"><AlertTriangle className="text-red-400"/>Confirmar Eliminación</h2>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <p className="text-slate-300">¿Estás seguro de que quieres eliminar al proveedor <strong className="text-white">{currentProvider?.nombre}</strong>? Esta acción es irreversible.</p>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button onClick={handleCloseModal} className="btn-secondary-dark">Cancelar</button>
                                    <button onClick={handleDelete} className="btn-danger-dark">Sí, eliminar</button>
                                </div>
                            </div>
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
            `}</style>
        </div>
    );
}
