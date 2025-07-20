// FILE: src/app/admin/reportes/components/modals/ReportarCuentaModal.tsx (Actualizado)
'use client';

import { useState, useMemo, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Search, RefreshCw, Plus, User, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { reportarCuenta } from '../../services/reporteCuentaService';

// --- Tipos Locales ---
interface Cuenta { id: number; correo: string; tipoCuenta: 'INDIVIDUAL' | 'COMPLETO'; }
const reportReasons = ["CUENTA CAIDA", "SE CAYO EL METODO", "SOLICITUD DE REEMBOLSO", "PIN INCORRECTO", "CUENTA VENCIDA", "OTRO"];

interface ReportarCuentaModalProps {
    isOpen: boolean;
    onClose: () => void;
    // --- ¡CORRECCIÓN! Se cambia el nombre de la prop para mayor claridad ---
    activeAccounts: Cuenta[]; 
    onSaveSuccess: (message: string) => void;
}

export const ReportarCuentaModal = ({ isOpen, onClose, activeAccounts, onSaveSuccess }: ReportarCuentaModalProps) => {
    const { user: loggedInUser } = useAuth();
    const initialFormData = { cuentaId: 0, motivo: '', detalle: '' };
    const [formData, setFormData] = useState(initialFormData);
    const [accountSearchTerm, setAccountSearchTerm] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [reportType, setReportType] = useState<'INDIVIDUAL' | 'COMPLETO' | null>(null);

    useEffect(() => { 
        if (isOpen) {
            setFormData(initialFormData);
            setAccountSearchTerm('');
            setReportType(null);
        }
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'cuentaId' ? parseInt(value, 10) : value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.cuentaId || !formData.motivo || !loggedInUser) {
            toast.error("Debes seleccionar una cuenta y un motivo.");
            return;
        }
        setFormLoading(true);
        const loadingToast = toast.loading('Reportando cuenta...');
        try {
            const payload = {
                usuarioId: loggedInUser.id,
                motivo: formData.motivo,
                detalle: formData.detalle,
                marcarComoVencida: true, // Esto ahora cambia el estado a REPORTADO en tu backend
            };
            await reportarCuenta(formData.cuentaId, payload);
            toast.dismiss(loadingToast);
            onSaveSuccess('Cuenta reportada exitosamente.');
            onClose();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || 'Error al crear el reporte.');
        } finally {
            setFormLoading(false);
        }
    };

    const filteredAccounts = useMemo(() => {
        if (!activeAccounts || !reportType) return [];
        
        let accountsByType = activeAccounts.filter(acc => acc.tipoCuenta === reportType);

        if (!accountSearchTerm) {
            return accountsByType;
        }
        return accountsByType.filter(acc => 
            acc.correo.toLowerCase().includes(accountSearchTerm.toLowerCase())
        );
    }, [activeAccounts, accountSearchTerm, reportType]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3"><FileText className="text-blue-400" />Reportar Cuenta Activa</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                    
                    {!reportType ? (
                        <div className="text-center">
                            <label className="label-style mb-4">¿Qué tipo de cuenta activa deseas reportar?</label>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={() => setReportType('INDIVIDUAL')} className="btn-secondary-dark flex-1 justify-center !py-4 hover:border-purple-400 hover:text-purple-300">
                                    <User size={18} /> Cuenta Individual
                                </button>
                                <button onClick={() => setReportType('COMPLETO')} className="btn-secondary-dark flex-1 justify-center !py-4 hover:border-orange-400 hover:text-orange-300">
                                    <Users size={18} /> Cuenta Completa
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="label-style">Cuenta Afectada ({reportType})</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                    <input type="text" placeholder="Buscar por correo..." value={accountSearchTerm} onChange={(e) => setAccountSearchTerm(e.target.value)} className="input-style-dark p-3 pl-10 w-full mb-2" />
                                </div>
                                <select name="cuentaId" value={formData.cuentaId} onChange={handleInputChange} className="input-style-dark p-3" required>
                                    <option value={0} disabled>Selecciona una cuenta...</option>
                                    {filteredAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.correo}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label-style">Motivo del Reporte</label>
                                <select name="motivo" value={formData.motivo} onChange={handleInputChange} className="input-style-dark p-3" required>
                                    <option value="" disabled>Selecciona un motivo</option>
                                    {reportReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label-style">Detalles Adicionales</label>
                                <textarea name="detalle" rows={3} value={formData.detalle} onChange={handleInputChange} className="input-style-dark p-3" placeholder="Proporciona más información si es necesario..." />
                            </div>
                            <div className="mt-8 flex justify-between items-center gap-4 pt-4 border-t border-slate-700">
                                <button type="button" onClick={() => setReportType(null)} className="text-slate-400 hover:text-white text-sm">← Volver</button>
                                <div className="flex gap-4">
                                    <button type="button" onClick={onClose} className="btn-secondary-dark">Cancelar</button>
                                    <button type="submit" disabled={formLoading} className="btn-primary-dark">
                                        {formLoading ? <RefreshCw className="animate-spin" /> : <Plus />}
                                        {formLoading ? 'Guardando...' : 'Crear Reporte'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
