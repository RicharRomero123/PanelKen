// FILE: src/app/admin/reportes/components/ReportesContainer.tsx (Actualizado)
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { FileText, Plus, RefreshCw } from 'lucide-react';


// --- Componentes Hijos ---
import { ReportarCuentaModal } from './modals/ReportarCuentaModal';
import { ReemplazarCuentaModal } from './modals/ReemplazarCuentaModal';
import { VerReporteModal } from './modals/VerReporteModal';
import { ReportesTable } from './ReportesTable';
import { useAuth } from '../context/AuthContext';
import { getAllReportes } from '../services/reporteCuentaService';
import { getAllCuentas } from '../services/cuentaService';
import { getAllUsers } from '../services/userService';
import { getAllClientes } from '../services/clienteService';
import { getAllServicios } from '../services/servicioService';

// --- Tipos Locales ---
export interface Reporte { id: number; cuentaId: number; usuarioId: number; fecha: string; motivo: string; detalle: string; }
export interface Cuenta { id: number; correo: string; clienteId: number | null; servicioId: number; status: string; tipoCuenta: 'INDIVIDUAL' | 'COMPLETO'; }
export interface User { id: number; nombre: string; }
export interface Cliente { id: number; nombre: string; apellido: string; }
export interface Servicio { id: number; nombre: string; }

export function ReportesContainer() {
    const { user: loggedInUser } = useAuth();
    const [reportes, setReportes] = useState<Reporte[]>([]);
    const [cuentas, setCuentas] = useState<Cuenta[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'individual' | 'completa'>('individual');
    const [modalState, setModalState] = useState<{ mode: string | null; data: any }>({ mode: null, data: null });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [reportsData, accountsData, usersData, clientsData, servicesData] = await Promise.all([
                getAllReportes(), getAllCuentas(), getAllUsers(), getAllClientes(), getAllServicios()
            ]);
            setReportes(reportsData);
            setCuentas(accountsData);
            setUsers(usersData);
            setClientes(clientsData);
            setServicios(servicesData);
        } catch (err) {
            toast.error('No se pudieron cargar los datos iniciales.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const cuentasReportadasIndividuales = useMemo(() => cuentas.filter(c => c.status === 'REPORTADO' && c.tipoCuenta === 'INDIVIDUAL'), [cuentas]);
    const cuentasReportadasCompletas = useMemo(() => cuentas.filter(c => c.status === 'REPORTADO' && c.tipoCuenta === 'COMPLETO'), [cuentas]);
    
    // --- ¡LÓGICA CORREGIDA! ---
    // Ahora se pasa la lista de cuentas ACTIVAS al modal de reportar.
    const cuentasActivas = useMemo(() => cuentas.filter(c => c.status === 'ACTIVO'), [cuentas]);
    const cuentasEnStock = useMemo(() => cuentas.filter(c => c.status === 'SINUSAR'), [cuentas]);

    const handleOpenModal = (mode: string, data: any) => setModalState({ mode, data });
    const handleCloseModal = () => setModalState({ mode: null, data: null });
    const handleSaveSuccess = (message: string) => {
        toast.success(message);
        fetchData();
        handleCloseModal();
    };

    return (
        <>
            <Toaster position="top-right" toastOptions={{ className: 'bg-slate-700 text-white shadow-lg' }} />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3"><FileText />Gestión de Reportes</h1>
                    <p className="mt-2 text-slate-400">Reporta cuentas activas y gestiona las cuentas reportadas.</p>
                </div>
                <button onClick={() => handleOpenModal('reportar', null)} className="btn-primary-dark mt-4 md:mt-0">
                    <Plus />Nuevo Reporte
                </button>
            </div>

            <div className="mb-8 border-b border-gray-200 dark:border-gray-700 flex">
                <button
                    onClick={() => setActiveTab('individual')}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                        activeTab === 'individual'
                        ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                    Reportadas - Individual
                </button>
                <button
                    onClick={() => setActiveTab('completa')}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                        activeTab === 'completa'
                        ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                    Reportadas - Completa
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10"><RefreshCw className="animate-spin text-3xl mx-auto text-blue-400" /></div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        {activeTab === 'individual' ? (
                            <ReportesTable
                                cuentasReportadas={cuentasReportadasIndividuales}
                                reportes={reportes}
                                onOpenModal={handleOpenModal}
                            />
                        ) : (
                            <ReportesTable
                                cuentasReportadas={cuentasReportadasCompletas}
                                reportes={reportes}
                                onOpenModal={handleOpenModal}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* --- Modales --- */}
            {modalState.mode === 'reportar' && (
                <ReportarCuentaModal isOpen={true} onClose={handleCloseModal} activeAccounts={cuentasActivas} onSaveSuccess={handleSaveSuccess} />
            )}
            {modalState.mode === 'reemplazar' && (
                <ReemplazarCuentaModal isOpen={true} onClose={handleCloseModal} oldAccount={modalState.data} availableAccounts={cuentasEnStock} onSaveSuccess={handleSaveSuccess} />
            )}
            {modalState.mode === 'verDetalle' && (
                <VerReporteModal isOpen={true} onClose={handleCloseModal} reporte={modalState.data} users={users} />
            )}

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
              .form-checkbox { appearance: none; background-color: #475569; border: 1px solid #64748b; padding: 0.5rem; border-radius: 0.25rem; display: inline-block; position: relative; cursor: pointer; }
              .form-checkbox:checked { background-color: #2563eb; border-color: #3b82f6; }
              .form-checkbox:checked::after { content: '✔'; font-size: 0.8rem; color: white; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
              .form-checkbox:disabled { background-color: #334155; border-color: #475569; cursor: not-allowed; }
            `}</style>
        </>
    );
}
