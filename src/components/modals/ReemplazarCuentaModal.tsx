// FILE: src/app/admin/reportes/components/modals/ReemplazarCuentaModal.tsx (Actualizado)
'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, X, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { reemplazarCuentaIndividual, reemplazarCuentaCompleta } from '../../services/reporteCuentaService';

// --- Tipos Locales ---
interface Cuenta { id: number; correo: string; tipoCuenta: 'INDIVIDUAL' | 'COMPLETO'; }

interface ReemplazarCuentaModalProps {
    isOpen: boolean;
    onClose: () => void;
    oldAccount: Cuenta | null;
    availableAccounts: Cuenta[];
    onSaveSuccess: (message: string) => void;
}

export const ReemplazarCuentaModal = ({ isOpen, onClose, oldAccount, availableAccounts, onSaveSuccess }: ReemplazarCuentaModalProps) => {
    const { user: loggedInUser } = useAuth();
    const [newAccountId, setNewAccountId] = useState<number | null>(null);
    const [motivo, setMotivo] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    
    useEffect(() => { if (!isOpen) { setNewAccountId(null); setMotivo(''); } }, [isOpen]);
    
    // --- ¡NUEVO! Lógica para filtrar las cuentas de reemplazo ---
    const filteredAvailableAccounts = useMemo(() => {
        if (!oldAccount) return [];
        // Filtra las cuentas disponibles para que coincidan con el tipo de la cuenta vencida.
        return availableAccounts.filter(acc => acc.tipoCuenta === oldAccount.tipoCuenta);
    }, [availableAccounts, oldAccount]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!newAccountId || !motivo || !oldAccount || !loggedInUser) {
            toast.error("Por favor, selecciona una cuenta nueva y escribe un motivo.");
            return;
        }
        setFormLoading(true);
        const loadingToast = toast.loading("Realizando reemplazo...");
        try {
            const payload = {
                cuentaNuevaId: newAccountId,
                usuarioId: loggedInUser.id,
                motivo,
            };
            if (oldAccount.tipoCuenta === 'INDIVIDUAL') {
                await reemplazarCuentaIndividual(oldAccount.id, payload);
            } else {
                await reemplazarCuentaCompleta(oldAccount.id, payload);
            }
            toast.dismiss(loadingToast);
            onSaveSuccess("El reemplazo se ha realizado exitosamente.");
            onClose();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || "Error al reemplazar la cuenta.");
        } finally {
            setFormLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-lg mx-4">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700"><h2 className="text-2xl font-bold text-white flex items-center gap-3"><Repeat className="text-blue-400" />Reemplazar Cuenta Vencida</h2><button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button></div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><label className="label-style">Cuenta Vencida</label><p className="input-style-dark p-3 bg-slate-700/50">{oldAccount?.correo}</p></div>
                        <div>
                            <label className="label-style">Seleccionar Nueva Cuenta (de Stock)</label>
                            <select onChange={(e) => setNewAccountId(Number(e.target.value))} className="input-style-dark p-3" required>
                                <option value={0} disabled selected>Elige una cuenta de reemplazo...</option>
                                {/* --- ¡CORREGIDO! Se mapea la lista filtrada --- */}
                                {filteredAvailableAccounts.map(c => <option key={c.id} value={c.id}>{c.correo}</option>)}
                            </select>
                            {filteredAvailableAccounts.length === 0 && (
                                <p className="text-xs text-yellow-400 mt-2">No hay cuentas de tipo '{oldAccount?.tipoCuenta}' disponibles en stock para el reemplazo.</p>
                            )}
                        </div>
                        <div><label className="label-style">Motivo del Reemplazo</label><input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="input-style-dark p-3" placeholder="Ej: Garantía por cuenta caída" required /></div>
                        <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-700"><button type="button" onClick={onClose} className="btn-secondary-dark">Cancelar</button><button type="submit" disabled={formLoading} className="btn-primary-dark">{formLoading ? <RefreshCw className="animate-spin" /> : <CheckCircle />}{formLoading ? 'Procesando...' : 'Confirmar Reemplazo'}</button></div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};