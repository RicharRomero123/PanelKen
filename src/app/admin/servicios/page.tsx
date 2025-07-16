'use client';

import { useEffect, useState, useCallback, FormEvent, useMemo } from 'react';
// Usamos rutas relativas para máxima compatibilidad
import { getAllServicios, createServicio, updateServicio, deleteServicio } from '../../../services/servicioService';
import { Plus, Edit, Trash2, X, Search, RefreshCw, Package, AlertTriangle, CheckCircle, Image as ImageIcon, Hash, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image'; // Importar el componente Image de Next.js

// --- Tipos definidos localmente ---
interface Servicio {
    id: number;
    nombre: string;
    descripcion: string;
    urlImg: string;
    cuentasTotal: number;
    cuentasRegistradas: number;
}

// --- Componente para subir imágenes a Cloudinary ---
const ImageUploader = ({ initialImageUrl, onUploadSuccess }: { initialImageUrl: string; onUploadSuccess: (url: string) => void; }) => {
    const [image, setImage] = useState(initialImageUrl);
    const [loading, setLoading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // --- IMPORTANTE: Reemplaza estos valores con los de tu cuenta de Cloudinary ---
    const presetName = 'Presenten_react'; // El nombre de tu Upload Preset
    const cloudName = 'daassyisd';   // Tu Cloud Name de Cloudinary

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setUploadError(null);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', presetName);

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.secure_url) {
                setImage(data.secure_url);
                onUploadSuccess(data.secure_url);
                toast.success('Imagen subida correctamente.');
            } else {
                throw new Error(data.error?.message || 'No se pudo obtener la URL de la imagen.');
            }
        } catch (err: any) {
            console.error(err);
            setUploadError(err.message || 'Error al subir la imagen.');
            toast.error(err.message || 'Error al subir la imagen.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="col-span-1 md:col-span-2">
            <label className="label-style">Imagen del Servicio</label>
            <div className="flex items-center gap-4 mt-2">
                <div className="w-24 h-24 bg-slate-700/50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-600">
                    {loading ? (
                        <RefreshCw className="animate-spin text-2xl text-blue-400" />
                    ) : image ? (
                        <Image src={image} alt="Vista previa" width={96} height={96} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        <ImageIcon className="text-3xl text-slate-500" />
                    )}
                </div>
                <div className="flex-grow">
                    <label htmlFor="file-upload" className="cursor-pointer bg-slate-700 text-slate-200 hover:bg-slate-600 font-semibold py-2 px-4 rounded-lg shadow-sm border border-slate-600 transition duration-300 flex items-center justify-center gap-2">
                        <UploadCloud size={18} />
                        <span>{image ? 'Cambiar Imagen' : 'Subir Imagen'}</span>
                    </label>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                    <p className="text-xs text-slate-500 mt-2">Recomendado: 500x280px</p>
                    {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
                </div>
            </div>
        </div>
    );
};


// --- Componente del Modal del Formulario ---
const ServiceFormModal = ({ isOpen, onClose, mode, service, onSaveSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    service: Servicio | null;
    onSaveSuccess: (message: string) => void;
}) => {
    const initialFormData = useMemo(() => ({
        nombre: service?.nombre || '',
        descripcion: service?.descripcion || '',
        urlImg: service?.urlImg || '',
    }), [service]);

    const [formData, setFormData] = useState(initialFormData);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormData);
        }
    }, [isOpen, initialFormData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUploadSuccess = (url: string) => {
        setFormData(prev => ({ ...prev, urlImg: url }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        const loadingToast = toast.loading(mode === 'add' ? 'Creando servicio...' : 'Actualizando servicio...');
        try {
            if (mode === 'add') {
                const dataToCreate = { 
                    ...formData, 
                    cuentasTotal: 0, 
                    cuentasRegistradas: 0 
                };
                await createServicio(dataToCreate);
            } else if (mode === 'edit' && service) {
                const dataToUpdate = {
                    ...formData,
                    cuentasTotal: service.cuentasTotal,
                    cuentasRegistradas: service.cuentasRegistradas,
                };
                await updateServicio(service.id, dataToUpdate);
            }
            toast.dismiss(loadingToast);
            onSaveSuccess(mode === 'add' ? 'Servicio creado exitosamente' : 'Servicio actualizado exitosamente');
            onClose();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || `Error al ${mode === 'add' ? 'crear' : 'actualizar'} el servicio.`);
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Package className="text-blue-400" />{mode === 'add' ? 'Crear Nuevo Servicio' : 'Editar Servicio'}</h2>
                            <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="label-style">Nombre del Servicio</label>
                                    <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className="input-style-dark p-3" required />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="label-style">Descripción</label>
                                    <textarea name="descripcion" rows={3} value={formData.descripcion} onChange={handleInputChange} className="input-style-dark p-3" required />
                                </div>
                                <ImageUploader initialImageUrl={formData.urlImg} onUploadSuccess={handleUploadSuccess} />
                            </div>
                            <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-700">
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

export default function ServiciosPage() {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | null>(null);
    const [currentService, setCurrentService] = useState<Servicio | null>(null);

    const fetchServicios = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllServicios();
            setServicios(data);
        } catch (err) {
            toast.error('No se pudieron cargar los servicios.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchServicios(); }, [fetchServicios]);

    const filteredServicios = useMemo(() => {
        return servicios.filter(service =>
            service.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [servicios, searchTerm]);

    const handleOpenModal = (mode: 'add' | 'edit' | 'delete', service: Servicio | null = null) => {
        setModalMode(mode);
        setCurrentService(service);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalMode(null);
        setCurrentService(null);
    };
    
    const handleSaveSuccess = (message: string) => {
        toast.success(message);
        fetchServicios();
        handleCloseModal();
    };

    const handleDelete = async () => {
        if (!currentService) return;
        const loadingToast = toast.loading("Eliminando servicio...");
        try {
            await deleteServicio(currentService.id);
            toast.dismiss(loadingToast);
            handleSaveSuccess("Servicio eliminado correctamente.");
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || "Error al eliminar el servicio.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">
            <Toaster position="top-right" toastOptions={{ className: 'bg-slate-700 text-white shadow-lg', success: { iconTheme: { primary: '#10b981', secondary: 'white' } }, error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } } }} />
            
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><Package />Gestión de Servicios</h1>
                        <p className="mt-2 text-slate-400">Añade, edita y administra los servicios de la plataforma.</p>
                    </div>
                    <button onClick={() => handleOpenModal('add')} className="mt-4 md:mt-0 bg-blue-600 text-white hover:bg-blue-700 font-bold py-2.5 px-5 rounded-lg shadow-md transition duration-300 flex items-center gap-2">
                        <Plus />Nuevo Servicio
                    </button>
                </div>

                <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Buscar por nombre de servicio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-style-dark pl-10 pr-4 py-3 w-full" />
                    </div>
                </div>

                {loading ? <div className="text-center py-10"><RefreshCw className="animate-spin text-3xl mx-auto text-blue-400" /></div> : (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                        {filteredServicios.map((service) => (
                            <motion.div layout key={service.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg flex flex-col justify-between transition-all duration-300 hover:border-blue-500 hover:bg-slate-800 hover:-translate-y-1">
                                <div className="p-5">
                                    <div className="h-32 bg-slate-700/50 rounded-lg mb-4 flex items-center justify-center">
                                        <Image src={service.urlImg || 'https://placehold.co/500x280/1e293b/94a3b8?text=Imagen'} alt={service.nombre} width={500} height={280} className="w-full h-full object-cover rounded-lg" onError={(e) => { e.currentTarget.src = 'https://placehold.co/500x280/1e293b/94a3b8?text=Error'; }} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white truncate">{service.nombre}</h3>
                                    <p className="text-slate-400 text-sm my-3 h-12 overflow-hidden">{service.descripcion}</p>
                                    <div className="mt-4 grid  gap-3 text-sm">
                                        <div className="flex items-center gap-2 bg-slate-700/50 p-2 rounded-lg"><Hash className="text-cyan-400 h-4 w-4" /><div><span className="text-xs text-slate-400">Registradas</span><p className="font-bold text-white">{service.cuentasRegistradas}</p></div></div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-900/50 border-t border-slate-700 flex gap-2">
                                    <button onClick={() => handleOpenModal('edit', service)} className="w-full flex items-center justify-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors"><Edit size={16}/>Editar</button>
                                    <button onClick={() => handleOpenModal('delete', service)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                </div>
                            </motion.div>
                        ))}
                        </AnimatePresence>
                    </motion.div>
                )}
                {!loading && filteredServicios.length === 0 && <p className="text-center py-10 text-slate-500">No se encontraron servicios que coincidan con la búsqueda.</p>}

                {isModalOpen && (modalMode === 'add' || modalMode === 'edit') && (
                    <ServiceFormModal isOpen={isModalOpen} onClose={handleCloseModal} mode={modalMode} service={currentService} onSaveSuccess={handleSaveSuccess} />
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
                                <p className="text-slate-300">¿Estás seguro de que quieres eliminar el servicio <strong className="text-white">{currentService?.nombre}</strong>? Esta acción es irreversible.</p>
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
