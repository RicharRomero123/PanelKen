
"use client";

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, X, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { asignarCuenta } from '../../services/cuentaService';

// --- DEFINICIONES DE TIPOS LOCALES ---
interface Cuenta { id: number; precioVenta: number; }
interface Cliente { id: number; nombre: string; apellido: string; }

interface BulkSellModalProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: Cuenta[];
    clients: Cliente[];
    onSaveSuccess: (message: string) => void;
}

export const BulkSellModal = ({ isOpen, onClose, accounts, clients, onSaveSuccess }: BulkSellModalProps) => {
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