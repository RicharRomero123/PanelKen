// src/app/admin/historial/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
// Usamos rutas relativas para máxima compatibilidad
import { getAllHistorial, getHistorialByCuentaId } from '../../../services/historialCuentaService';
import { searchCuentas } from '../../../services/cuentaService';
import { getAllUsers } from '../../../services/userService';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { History, RefreshCw, Search, X, Eye, User, Mail, Calendar } from 'lucide-react';

// --- Tipos definidos localmente ---
interface Historial { id: number; cuentaAnteriorId: number; cuentaNuevaId: number; motivo: string; fechaCambio: string; usuarioId: number; }
interface Cuenta { id: number; correo: string; }
interface User { id: number; nombre: string; }

// --- Componente del Modal para Ver Detalles ---
const ViewHistoryModal = ({ isOpen, onClose, history, accounts, users }: {
    isOpen: boolean;
    onClose: () => void;
    history: Historial | null;
    accounts: Cuenta[];
    users: User[];
}) => {
    if (!isOpen || !history) return null;

    const cuentaAnterior = accounts.find(c => c.id === history.cuentaAnteriorId);
    const cuentaNueva = accounts.find(c => c.id === history.cuentaNuevaId);
    const usuario = users.find(u => u.id === history.usuarioId);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3"><History className="text-blue-400" />Detalles del Cambio</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                    <div className="space-y-4 text-slate-300">
                        <p><strong>Motivo del Cambio:</strong> <span className="text-white">{history.motivo}</span></p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700 pt-4 mt-4">
                            <div>
                                <h4 className="font-semibold text-white mb-2">Cuenta Anterior</h4>
                                <p className="flex items-center gap-2"><Mail size={14}/> {cuentaAnterior?.correo || `ID: ${history.cuentaAnteriorId}`}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white mb-2">Cuenta Nueva</h4>
                                <p className="flex items-center gap-2"><Mail size={14}/> {cuentaNueva?.correo || `ID: ${history.cuentaNuevaId}`}</p>
                            </div>
                        </div>
                        <div className="border-t border-slate-700 pt-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <p><strong className="flex items-center gap-2"><User size={16}/> Realizado por:</strong> <span className="text-white">{usuario?.nombre || `ID: ${history.usuarioId}`}</span></p>
                            <p><strong className="flex items-center gap-2"><Calendar size={16}/> Fecha:</strong> <span className="text-white">{new Date(history.fechaCambio).toLocaleString('es-ES')}</span></p>
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

export default function HistorialPage() {
    const [historial, setHistorial] = useState<Historial[]>([]);
    const [cuentas, setCuentas] = useState<Cuenta[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchAccountId, setSearchAccountId] = useState<string>('all');
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [selectedHistory, setSelectedHistory] = useState<Historial | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [historyData, accountsData, usersData] = await Promise.all([
                getAllHistorial(),
                searchCuentas({}),
                getAllUsers()
            ]);
            setHistorial(historyData);
            setCuentas(accountsData);
            setUsers(usersData);
        } catch (err) {
            toast.error('No se pudieron cargar los datos iniciales.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHistoryByAccount = useCallback(async (accountId: number) => {
        setLoading(true);
        const loadingToast = toast.loading("Buscando historial...");
        try {
            const historyData = await getHistorialByCuentaId(accountId);
            setHistorial(historyData);
            toast.dismiss(loadingToast);
            toast.success(`Mostrando historial para la cuenta seleccionada.`);
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error("No se pudo encontrar el historial para esa cuenta.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const accountId = e.target.value;
        setSearchAccountId(accountId);
        if (accountId === 'all') {
            fetchData();
        } else {
            fetchHistoryByAccount(parseInt(accountId, 10));
        }
    };

    const handleOpenViewModal = (history: Historial) => {
        setSelectedHistory(history);
        setIsViewModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">
            <Toaster position="top-right" toastOptions={{ className: 'bg-slate-700 text-white shadow-lg', success: { iconTheme: { primary: '#10b981', secondary: 'white' } }, error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } } }} />
            
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><History />Historial de Cambios</h1>
                        <p className="mt-2 text-slate-400">Audita todos los cambios y reemplazos de cuentas.</p>
                    </div>
                </div>

                <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select value={searchAccountId} onChange={handleSearchChange} className="input-style-dark pl-10 pr-4 py-3 w-full">
                            <option value="all">Mostrar todo el historial</option>
                            {cuentas.map(acc => <option key={acc.id} value={acc.id}>{acc.correo}</option>)}
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
                                            <th scope="col" className="px-6 py-4">Fecha</th>
                                            <th scope="col" className="px-6 py-4">Cuenta Anterior</th>
                                            <th scope="col" className="px-6 py-4">Cuenta Nueva</th>
                                            <th scope="col" className="px-6 py-4">Motivo</th>
                                            <th scope="col" className="px-6 py-4">Realizado por</th>
                                            <th scope="col" className="px-6 py-4 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-200">
                                        {historial.map((item) => {
                                            const cuentaAnterior = cuentas.find(c => c.id === item.cuentaAnteriorId);
                                            const cuentaNueva = cuentas.find(c => c.id === item.cuentaNuevaId);
                                            const usuario = users.find(u => u.id === item.usuarioId);
                                            return (
                                            <tr key={item.id} className="border-b border-slate-700 hover:bg-slate-800 transition-colors">
                                                <td className="px-6 py-4">{new Date(item.fechaCambio).toLocaleDateString('es-ES')}</td>
                                                <td className="px-6 py-4 font-mono">{cuentaAnterior?.correo || 'N/A'}</td>
                                                <td className="px-6 py-4 font-mono">{cuentaNueva?.correo || 'N/A'}</td>
                                                <td className="px-6 py-4">{item.motivo}</td>
                                                <td className="px-6 py-4">{usuario?.nombre || 'N/A'}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleOpenViewModal(item)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"><Eye size={16} /></button>
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:hidden">
                            <AnimatePresence>
                            {historial.map((item) => {
                                const cuentaAnterior = cuentas.find(c => c.id === item.cuentaAnteriorId);
                                const cuentaNueva = cuentas.find(c => c.id === item.cuentaNuevaId);
                                const usuario = users.find(u => u.id === item.usuarioId);
                                return (
                                <motion.div key={item.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg p-4 space-y-4">
                                    <div>
                                        <p className="font-bold text-lg text-white">{item.motivo}</p>
                                        <p className="text-xs text-slate-400">{new Date(item.fechaCambio).toLocaleString('es-ES')}</p>
                                    </div>
                                    <div className="border-t border-slate-700 pt-3 space-y-2 text-sm">
                                        <p className="flex items-center gap-2 text-slate-300">De: {cuentaAnterior?.correo || 'N/A'}</p>
                                        <p className="flex items-center gap-2 text-slate-300">A: {cuentaNueva?.correo || 'N/A'}</p>
                                        <p className="flex items-center gap-2 text-slate-300"><User size={14} /> Por: {usuario?.nombre || 'N/A'}</p>
                                    </div>
                                    <div className="pt-3 border-t border-slate-700">
                                        <button onClick={() => handleOpenViewModal(item)} className="w-full btn-secondary-dark justify-center"><Eye size={16}/> Ver Detalles</button>
                                    </div>
                                </motion.div>
                            )})}
                            </AnimatePresence>
                        </div>
                    </>
                )}
                {!loading && historial.length === 0 && <p className="text-center py-10 text-slate-500">No se encontraron registros en el historial.</p>}
                
                <ViewHistoryModal 
                    isOpen={isViewModalOpen} 
                    onClose={() => setIsViewModalOpen(false)} 
                    history={selectedHistory}
                    accounts={cuentas}
                    users={users}
                />
            </div>
            <style jsx global>{`
                .label-style { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #cbd5e1; }
                .input-style-dark { background-color: rgb(30 41 59 / 0.5); border: 1px solid #334155; color: #e2e8f0; font-size: 0.875rem; border-radius: 0.5rem; display: block; width: 100%; transition: all 0.2s ease-in-out; }
                .input-style-dark:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4); }
                .btn-secondary-dark { background-color: #334155; color: #e2e8f0; font-weight: 500; padding: 0.625rem 1.25rem; border-radius: 0.5rem; border: 1px solid #475569; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease-in-out; }
                .btn-secondary-dark:hover { background-color: #475569; }
            `}</style>
        </div>
    );
}
