// FILE: src/app/admin/cuentas/components/modals/BulkCreateModal.tsx
"use client";

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, RefreshCw, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { createCuenta } from '../../services/cuentaService';

// --- DEFINICIONES DE TIPOS LOCALES ---
enum TipoCuenta { INDIVIDUAL = "INDIVIDUAL", COMPLETO = "COMPLETO" }
interface Servicio { id: number; nombre: string; }

interface BulkCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    services: Servicio[];
    onSaveSuccess: (message: string) => void;
}

export const BulkCreateModal = ({ isOpen, onClose, services, onSaveSuccess }: BulkCreateModalProps) => {
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
                const newAccountData: any = {
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