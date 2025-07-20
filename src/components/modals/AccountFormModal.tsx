// FILE: src/app/admin/cuentas/components/modals/AccountFormModal.tsx (Corregido)
"use client";

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, X, RefreshCw, Plus, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { createCuenta, updateCuenta } from '../../services/cuentaService';

// --- DEFINICIONES DE TIPOS LOCALES (CORREGIDO) ---
// Se añade el nuevo estado REPORTADO para que coincida con el componente padre.
enum StatusCuenta { ACTIVO = "ACTIVO", VENCIDO = "VENCIDO", REEMPLAZADA = "REEMPLAZADA", REPORTADO = "REPORTADO", SINUSAR = "SINUSAR" }
enum TipoCuenta { INDIVIDUAL = "INDIVIDUAL", COMPLETO = "COMPLETO" }
interface Cuenta { id: number; correo: string; contraseña: string; pin: string; perfilesOcupados: number; perfilesMaximos: number; enlace: string; fechaInicio: string; fechaRenovacion: string; status: StatusCuenta; tipoCuenta: TipoCuenta; precioVenta: number; clienteId: number | null; servicioId: number; }
interface Servicio { id: number; nombre: string; }

interface AccountFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    account: Cuenta | null;
    services: Servicio[];
    onSaveSuccess: (message: string) => void;
}

export const AccountFormModal = ({ isOpen, onClose, mode, account, services, onSaveSuccess }: AccountFormModalProps) => {
    const initialFormData = useMemo(() => ({
        correo: account?.correo || '',
        contraseña: account?.contraseña || '',
        pin: account?.pin || '',
        tipoCuenta: account?.tipoCuenta || TipoCuenta.INDIVIDUAL,
        perfilesMaximos: account?.perfilesMaximos || 0,
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
            const dataToSend: any = { ...formData, perfilesMaximos: Number(formData.perfilesMaximos) };
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

    if (!isOpen) return null;

    return (
        <AnimatePresence>
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
                
                        <div className="lg:col-span-3 mt-4 flex justify-end gap-4 pt-4 border-t border-slate-700">
                            <button type="button" onClick={onClose} className="btn-secondary-dark">Cancelar</button>
                            <button type="submit" disabled={formLoading} className="btn-primary-dark">{formLoading ? <RefreshCw className="animate-spin" /> : (mode === 'add' ? <Plus/> : <CheckCircle/>)}{formLoading ? 'Guardando...' : 'Guardar'}</button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};