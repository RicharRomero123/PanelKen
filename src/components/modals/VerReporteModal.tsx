// FILE: src/app/admin/reportes/components/modals/VerReporteModal.tsx (NUEVO)
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Eye, X, User as UserIcon, Calendar } from 'lucide-react';

// --- Tipos Locales ---
interface Reporte { id: number; cuentaId: number; usuarioId: number; fecha: string; motivo: string; detalle: string; }
interface User { id: number; nombre: string; }

interface VerReporteModalProps {
    isOpen: boolean;
    onClose: () => void;
    reporte: Reporte | null;
    users: User[];
}

export const VerReporteModal = ({ isOpen, onClose, reporte, users }: VerReporteModalProps) => {
    if (!isOpen || !reporte) return null;

    const reportingUser = users.find(u => u.id === reporte.usuarioId);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-lg mx-4">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Eye className="text-blue-400" />Detalles del Reporte</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                    <div className="space-y-4 text-slate-300">
                        <p><strong>Motivo:</strong> <span className="text-white font-semibold">{reporte.motivo}</span></p>
                        <div>
                            <p><strong>Detalle:</strong></p>
                            <p className="text-white mt-1 p-3 bg-slate-700/50 rounded-md whitespace-pre-wrap">{reporte.detalle || 'No se proporcionaron detalles.'}</p>
                        </div>
                        <div className="border-t border-slate-700 pt-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <p><strong className="flex items-center gap-2"><UserIcon size={16}/> Reportado por:</strong> <span className="text-white">{reportingUser?.nombre || 'Desconocido'}</span></p>
                            <p><strong className="flex items-center gap-2"><Calendar size={16}/> Fecha:</strong> <span className="text-white">{new Date(reporte.fecha.replace(/-/g, '/')).toLocaleDateString('es-PE')}</span></p>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-700">
                        <button type="button" onClick={onClose} className="btn-secondary-dark">Cerrar</button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};