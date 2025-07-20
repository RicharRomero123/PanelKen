// FILE: src/app/admin/cuentas/components/modals/ChangeAccountModal.tsx (Corregido)
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, X, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { cambiarCuenta } from '../../services/cuentaService';


// --- DEFINICIONES DE TIPOS LOCALES (CORREGIDO) ---
// Se añade el nuevo estado REPORTADO para que coincida con el componente padre.
enum StatusCuenta { ACTIVO = "ACTIVO", VENCIDO = "VENCIDO", REEMPLAZADA = "REEMPLAZADA", REPORTADO = "REPORTADO", SINUSAR = "SINUSAR" }
enum TipoCuenta { INDIVIDUAL = "INDIVIDUAL", COMPLETO = "COMPLETO" }
interface Cuenta { id: number; correo: string; contraseña: string; pin: string; perfilesOcupados: number; perfilesMaximos: number; enlace: string; fechaInicio: string; fechaRenovacion: string; status: StatusCuenta; tipoCuenta: TipoCuenta; precioVenta: number; clienteId: number | null; servicioId: number; }

interface ChangeAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    oldAccount: Cuenta | null;
    availableAccounts: Cuenta[];
    onSaveSuccess: (message: string) => void;
}

export const ChangeAccountModal = ({ isOpen, onClose, oldAccount, availableAccounts, onSaveSuccess }: ChangeAccountModalProps) => {
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
                        <div><label className="label-style">Seleccionar Nueva Cuenta Disponible</label><select onChange={(e) => setNewAccountId(Number(e.target.value))} className="input-style-dark p-3" required><option value={0} disabled selected>Elige una cuenta de reemplazo...</option>{availableAccounts.map(c => <option key={c.id} value={c.id}>{c.correo}</option>)}</select></div>
                        <div><label className="label-style">Motivo del Cambio</label><input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="input-style-dark p-3" required /></div>
                        <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-700"><button type="button" onClick={onClose} className="btn-secondary-dark">Cancelar</button><button type="submit" disabled={formLoading} className="btn-primary-dark">{formLoading ? <RefreshCw className="animate-spin" /> : <CheckCircle />}{formLoading ? 'Procesando...' : 'Confirmar Cambio'}</button></div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
