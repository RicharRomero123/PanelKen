'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { KeyRound, RefreshCw, AlertTriangle, X, UserPlus, Eye, Repeat, Edit, Trash2, DollarSign, ArchiveRestore, Inbox, CheckCircle, Clock, Flag } from 'lucide-react';
import Image from 'next/image';
import Cookies from 'js-cookie';

// --- SERVICIOS ---
import { getAllCuentas, deleteCuenta, updateCuenta, getPerfilesVencidos, renovarPerfil, renovarCuentaCompleta } from '../services/cuentaService';
import { getAllServicios } from '../services/servicioService';
import { getAllClientes } from '../services/clienteService';

// --- COMPONENTES HIJOS (Importados) ---
import { CuentasToolbar } from './CuentasToolbar';
import { CuentasTable } from './CuentasTable';
import { PerfilesVencidosTable } from './PerfilesVencidosTable';
import { AccountFormModal } from './modals/AccountFormModal';
import { AssignModal } from './modals/AssignModal';
import { BulkCreateModal } from './modals/BulkCreateModal';
import { BulkSellModal } from './modals/BulkSellModal';
import { AccountDetailModal } from './modals/AccountDetailModal';
import { ChangeAccountModal } from './modals/ChangeAccountModal';
import { Tooltip, getStatusBadge } from './ui/ui-elements';
import { getAllUsers } from '@/services/userService';
import { PerfilVencido } from '@/types';

// --- DEFINICIONES DE TIPOS ---
export enum StatusCuenta {
    ACTIVO = "ACTIVO", VENCIDO = "VENCIDO", REEMPLAZADA = "REEMPLAZADA", 
    REPORTADO = "REPORTADO", SINUSAR = "SINUSAR",
}
export enum TipoCuenta {
    INDIVIDUAL = "INDIVIDUAL", COMPLETO = "COMPLETO",
}
export enum TipoCliente {
    NORMAL = "NORMAL", RESELLER = "RESELLER",
}
export interface Cuenta {
    id: number; correo: string; contraseña: string; pin: string; 
    perfilesOcupados: number; perfilesMaximos: number; enlace: string; 
    fechaInicio: string; fechaRenovacion: string; status: StatusCuenta; 
    tipoCuenta: TipoCuenta; precioVenta: number; clienteId: number | null; 
    servicioId: number;
}
export interface Servicio {
    id: number; nombre: string; urlImg?: string;
}
export interface Cliente {
    id: number; nombre: string; apellido: string; numero: string; 
    correo?: string; tipoCliente: TipoCliente; linkWhatsapp?: string;
}

export interface User {
    id: number;
    nombre: string;
    correo: string;
    telefono: string;
    rolUsuario: string;
}

// --- COMPONENTE DE PESTAÑAS CON CONTADORES (INTEGRADO) ---
type ActiveTab = 'stock' | 'sold' | 'fallen' | 'reported' | 'vencido';

interface CuentasTabsProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    setSelectedAccounts: React.Dispatch<React.SetStateAction<number[]>>;
    counts: {
        stock: number;
        sold: number;
        fallen: number;
        reported: number;
        vencido: number;
    };
}

export const CuentasTabs = ({ activeTab, setActiveTab, setSelectedAccounts, counts }: CuentasTabsProps) => {
    
    const handleTabClick = (tab: ActiveTab) => {
        setActiveTab(tab);
        setSelectedAccounts([]);
    };

    return (
        <div className="mb-6 border-b border-slate-700 flex flex-wrap">
            <button 
                onClick={() => handleTabClick('stock')} 
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'stock' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                <Inbox size={16} /> En Stock
                <span className="ml-2 bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{counts.stock}</span>
            </button>
            <button 
                onClick={() => handleTabClick('sold')} 
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sold' ? 'border-green-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                <CheckCircle size={16} /> Vendidas
                <span className="ml-2 bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{counts.sold}</span>
            </button>
            <button 
                onClick={() => handleTabClick('vencido')} 
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'vencido' ? 'border-yellow-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                <Clock size={16} /> Vencidas
                <span className="ml-2 bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{counts.vencido}</span>
            </button>
            <button 
                onClick={() => handleTabClick('reported')} 
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'reported' ? 'border-orange-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                <Flag size={16} /> Reportadas
                <span className="ml-2 bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{counts.reported}</span>
            </button>
            <button 
                onClick={() => handleTabClick('fallen')} 
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'fallen' ? 'border-red-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                <AlertTriangle size={16} /> Reemplazadas
                <span className="ml-2 bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{counts.fallen}</span>
            </button>
        </div>
    );
};

export function CuentasContainer() {
    const [cuentas, setCuentas] = useState<Cuenta[]>([]);
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [perfilesVencidos, setPerfilesVencidos] = useState<PerfilVencido[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filters, setFilters] = useState({ searchTerm: '', serviceId: 'all' });
    const [activeTab, setActiveTab] = useState<'stock' | 'sold' | 'fallen' | 'reported' | 'vencido'>('stock');
    const [modalState, setModalState] = useState<{ mode: string | null; account: Cuenta | null }>({ mode: null, account: null });
    const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [usuarios, setUsuarios] = useState<User[]>([]);
    const [newRenewPrice, setNewRenewPrice] = useState<number | ''>('');

    
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [accountsData, servicesData, clientsData, perfilesData, usersData] = await Promise.all([
                getAllCuentas(), 
                getAllServicios(), 
                getAllClientes(),
                getPerfilesVencidos(),
                getAllUsers()
            ]);
            
            const sanitizedAccounts = accountsData.map(account => ({
                ...account,
                correo: account.correo || '',
                contraseña: account.contraseña || ''
            }));
            
            setCuentas(sanitizedAccounts);
            setServicios(servicesData);
            setClientes(clientsData);
            setPerfilesVencidos(perfilesData);
            setUsuarios(usersData);
            if (usersData.length > 0 && !selectedUserId) {
                setSelectedUserId(usersData[0].id);
            }
        } catch (err) {
            toast.error('No se pudieron cargar los datos iniciales.');
        } finally {
            setLoading(false);
        }
    }, [selectedUserId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenModal = (mode: string, account: Cuenta | null = null) => {
        setModalState({ mode, account });
        if (mode === 'renew-account') {
            setNewRenewPrice('');
        }
    };

    const handleRenewAccount = async (cuentaId: number, nuevoPrecio: number) => {
        if (!selectedUserId) {
            toast.error('Por favor selecciona un usuario para realizar la renovación.');
            return;
        }
        
        const loadingToast = toast.loading("Renovando cuenta...");
        try {
            // **CORRECCIÓN:** Se envía el `selectedUserId` que es el ID del usuario que realiza la acción.
            await renovarCuentaCompleta(cuentaId, nuevoPrecio, selectedUserId);
            toast.dismiss(loadingToast);
            toast.success("Cuenta renovada correctamente");
            fetchData();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || "Error al renovar la cuenta");
        }
    };
    
    const handleRenewProfile = async (perfilId: number, nuevoPrecio: number) => {
        if (!selectedUserId) {
            toast.error('Por favor selecciona un usuario para realizar la renovación.');
            return;
        }
        
        const loadingToast = toast.loading("Renovando perfil...");
        try {
            // **CORRECCIÓN:** Se envía el `selectedUserId` que es el ID del usuario que realiza la acción.
            await renovarPerfil(perfilId, nuevoPrecio, selectedUserId);
            
            toast.dismiss(loadingToast);
            toast.success("Perfil renovado correctamente");
            
            setPerfilesVencidos(prev => prev.filter(p => p.id !== perfilId));
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || "Error al renovar el perfil");
        }
    };

    const getProfileCount = (account: Cuenta): number => {
        return account.perfilesOcupados || 0;
    };

    const filteredCuentas = useMemo(() => {
        let sourceData: Cuenta[];
        if (activeTab === 'stock') {
            sourceData = cuentas.filter(acc => acc.status === StatusCuenta.SINUSAR);
        } else if (activeTab === 'sold') {
            sourceData = cuentas.filter(acc => acc.status === StatusCuenta.ACTIVO);
        } else if (activeTab === 'vencido') {
            sourceData = cuentas.filter(acc => 
                acc.status === StatusCuenta.VENCIDO && acc.tipoCuenta === TipoCuenta.COMPLETO
            );
        } else if (activeTab === 'reported') {
            sourceData = cuentas.filter(acc => acc.status === StatusCuenta.REPORTADO);
        } else { // fallen (reemplazadas)
            sourceData = cuentas.filter(acc => acc.status === StatusCuenta.REEMPLAZADA);
        }
        
        return sourceData.filter(account => {
            const emailMatch = account.correo.toLowerCase().includes(filters.searchTerm.toLowerCase());
            const serviceMatch = filters.serviceId === 'all' || account.servicioId === parseInt(filters.serviceId);
            return emailMatch && serviceMatch;
        });
    }, [cuentas, filters, activeTab]);

    const handleCloseModal = () => setModalState({ mode: null, account: null });

    const handleSaveSuccess = (message: string) => {
        toast.success(message);
        setSelectedAccounts([]);
        handleCloseModal();
        fetchData();
    };

    const handleDelete = async () => {
        if (!modalState.account) return;
        const loadingToast = toast.loading("Eliminando cuenta...");
        try {
            await deleteCuenta(modalState.account.id);
            toast.dismiss(loadingToast);
            handleSaveSuccess("Cuenta eliminada correctamente.");
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || "Error al eliminar la cuenta.");
        }
    };
    
    const tabCounts = useMemo(() => {
        return {
            stock: cuentas.filter(c => c.status === StatusCuenta.SINUSAR).length,
            sold: cuentas.filter(c => c.status === StatusCuenta.ACTIVO).length,
            vencido: perfilesVencidos.length + cuentas.filter(c => c.status === StatusCuenta.VENCIDO && c.tipoCuenta === TipoCuenta.COMPLETO).length,
            reported: cuentas.filter(c => c.status === StatusCuenta.REPORTADO).length,
            fallen: cuentas.filter(c => c.status === StatusCuenta.REEMPLAZADA).length,
        };
    }, [cuentas, perfilesVencidos]);

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8">
            <Toaster 
                position="top-right" 
                toastOptions={{ 
                    className: 'bg-slate-700 text-white shadow-lg', 
                    success: { iconTheme: { primary: '#10b981', secondary: 'white' } }, 
                    error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } } 
                }} 
            />
            
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <KeyRound />Gestión de Cuentas
                        </h1>
                        <p className="mt-2 text-slate-400">
                            Administra, asigna y vende perfiles y cuentas completas.
                        </p>
                    </div>
                    <CuentasToolbar onOpenModal={handleOpenModal} />
                </div>
                <div className="mb-4 bg-slate-800/50 p-3 rounded-lg flex flex-col md:flex-row gap-3 items-start md:items-center">
                    <span className="font-semibold">Usuario que renueva:</span>
                    <select 
                        value={selectedUserId || ''}
                        onChange={(e) => setSelectedUserId(Number(e.target.value) || null)}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 min-w-[200px]"
                    >
                        {usuarios.length === 0 && (
                            <option value="">Cargando usuarios...</option>
                        )}
                        {usuarios.map(usuario => (
                            <option key={usuario.id} value={usuario.id}>
                                {usuario.nombre} ({usuario.rolUsuario})
                            </option>
                        ))}
                    </select>
                    <p className="text-sm text-slate-400 mt-1 md:mt-0">
                        Selecciona el usuario que realizará las renovaciones
                    </p>
                </div>

                <CuentasTabs 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    setSelectedAccounts={setSelectedAccounts} 
                    counts={tabCounts}
                />
                
                <CuentasToolbar.Filters 
                    filters={filters} 
                    setFilters={setFilters} 
                    services={servicios} 
                />

                {loading ? (
                    <div className="text-center py-10">
                        <RefreshCw className="animate-spin text-3xl mx-auto text-blue-400" />
                    </div>
                ) : activeTab === 'vencido' ? (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-slate-300">
                                Cuentas Completas Vencidas
                            </h2>
                            <CuentasTable
                                cuentas={cuentas.filter(acc => acc.status === StatusCuenta.VENCIDO && acc.tipoCuenta === TipoCuenta.COMPLETO)}
                                clientes={clientes}
                                servicios={servicios}
                                activeTab={activeTab}
                                selectedAccounts={selectedAccounts}
                                setSelectedAccounts={setSelectedAccounts}
                                onOpenModal={handleOpenModal}
                                getProfileCount={getProfileCount}
                            />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-slate-300">
                                Perfiles Individuales Vencidos
                            </h2>
                             <PerfilesVencidosTable 
                                perfiles={perfilesVencidos} 
                                clientes={clientes} 
                                onRenewProfile={handleRenewProfile}
                            />
                        </div>
                    </div>
                ) : (
                    <CuentasTable
                        cuentas={filteredCuentas}
                        clientes={clientes}
                        servicios={servicios}
                        activeTab={activeTab}
                        selectedAccounts={selectedAccounts}
                        setSelectedAccounts={setSelectedAccounts}
                        onOpenModal={handleOpenModal}
                        getProfileCount={getProfileCount}
                    />
                )}

                {/* --- MODALES --- */}
                {modalState.mode && (
                    <>
                        {(modalState.mode === 'add' || modalState.mode === 'edit') && (
                            <AccountFormModal 
                                isOpen={true} 
                                onClose={handleCloseModal} 
                                mode={modalState.mode} 
                                account={modalState.account} 
                                services={servicios} 
                                onSaveSuccess={handleSaveSuccess} 
                            />
                        )}
                        
                        {modalState.mode === 'sell' && (
                            <AssignModal 
                                isOpen={true} 
                                onClose={handleCloseModal} 
                                account={modalState.account} 
                                clients={clientes} 
                                onSaveSuccess={handleSaveSuccess} 
                            />
                        )}
                        
                        {modalState.mode === 'bulk-create' && (
                            <BulkCreateModal 
                                isOpen={true} 
                                onClose={handleCloseModal} 
                                services={servicios} 
                                onSaveSuccess={handleSaveSuccess} 
                            />
                        )}
                        
                        {modalState.mode === 'bulk-sell' && (
                            <BulkSellModal 
                                isOpen={true} 
                                onClose={handleCloseModal} 
                                accounts={cuentas.filter(c => selectedAccounts.includes(c.id))} 
                                clients={clientes} 
                                onSaveSuccess={handleSaveSuccess} 
                            />
                        )}
                        
                        {modalState.mode === 'detail' && (
                            <AccountDetailModal 
                                isOpen={true} 
                                onClose={handleCloseModal} 
                                account={modalState.account} 
                                clients={clientes} 
                                service={servicios.find(s => s.id === modalState.account?.servicioId)} 
                                onProfileLiberated={fetchData} 
                            />
                        )}
                        
                        {modalState.mode === 'change' && (
                            <ChangeAccountModal 
                                isOpen={true} 
                                onClose={handleCloseModal} 
                                oldAccount={modalState.account} 
                                availableAccounts={cuentas.filter(c => 
                                    c.servicioId === modalState.account?.servicioId && 
                                    c.status === 'SINUSAR'
                                )} 
                                onSaveSuccess={handleSaveSuccess} 
                            />
                        )}
                        
                        {modalState.mode === 'delete' && (
                            <AnimatePresence>
                                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                                        exit={{ opacity: 0, y: 20, scale: 0.95 }} 
                                        className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4"
                                    >
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                                <AlertTriangle className="text-red-400"/>
                                                Confirmar Eliminación
                                            </h2>
                                            <button 
                                                onClick={handleCloseModal} 
                                                className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-slate-300">
                                                ¿Estás seguro de que quieres eliminar la cuenta <strong className="text-white">{modalState.account?.correo}</strong>? 
                                                Esta acción es irreversible.
                                            </p>
                                            <div className="flex justify-end gap-3 pt-4">
                                                <button 
                                                    onClick={handleCloseModal} 
                                                    className="btn-secondary-dark"
                                                >
                                                    Cancelar
                                                </button>
                                                <button 
                                                    onClick={handleDelete} 
                                                    className="btn-danger-dark"
                                                >
                                                    Sí, eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </AnimatePresence>
                        )}
                        {modalState.mode === 'renew-account' && modalState.account && (
                            <AnimatePresence>
                                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full"
                                    >
                                        <h3 className="text-xl font-bold mb-4">Renovar Cuenta Completa</h3>
                                        <p className="mb-4">Ingresa el nuevo precio de venta para la renovación:</p>
                                        
                                        <div className="flex items-center gap-3 mb-6">
                                            <span className="text-slate-400">S/.</span>
                                            <input
                                                type="number"
                                                value={newRenewPrice}
                                                onChange={(e) => setNewRenewPrice(e.target.value ? Number(e.target.value) : '')}
                                                className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 w-full"
                                                placeholder="Precio de renovación"
                                                min="0"
                                                step="0.01"
                                                autoFocus
                                            />
                                        </div>
                                        
                                        <div className="flex justify-end gap-3">
                                            <button 
                                                onClick={() => {
                                                    setNewRenewPrice('');
                                                    handleCloseModal();
                                                }} 
                                                className="px-4 py-2 rounded-lg border border-slate-600 hover:bg-slate-700"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (!newRenewPrice) {
                                                        toast.error('Ingresa un precio válido');
                                                        return;
                                                    }
                                                    handleRenewAccount(modalState.account!.id, newRenewPrice);
                                                    setNewRenewPrice('');
                                                    handleCloseModal();
                                                }}
                                                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 flex items-center gap-2"
                                            >
                                                <DollarSign size={16} />
                                                Confirmar Renovación
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            </AnimatePresence>
                        )}
                    </>
                )}
            </div>
              {/* Estilos globales */}
            <style jsx global>{`
                .label-style { 
                    display: block; 
                    margin-bottom: 0.5rem; 
                    font-size: 0.875rem; 
                    font-weight: 500; 
                    color: #cbd5e1; 
                }
                .input-style-dark { 
                    background-color: rgb(30 41 59 / 0.5); 
                    border: 1px solid #334155; 
                    color: #e2e8f0; 
                    font-size: 0.875rem; 
                    border-radius: 0.5rem; 
                    display: block; 
                    width: 100%; 
                    transition: all 0.2s ease-in-out; 
                }
                .input-style-dark:focus { 
                    outline: 2px solid transparent; 
                    outline-offset: 2px; 
                    border-color: #38bdf8; 
                    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4); 
                }
                .btn-primary-dark { 
                    background-color: #2563eb; 
                    color: white; 
                    font-weight: 600; 
                    padding: 0.625rem 1.25rem; 
                    border-radius: 0.5rem; 
                    text-align: center; 
                    transition: all 0.2s ease-in-out; 
                    display: flex; 
                    align-items: center; 
                    gap: 0.5rem; 
                    justify-content: center; 
                }
                .btn-primary-dark:hover { 
                    background-color: #1d4ed8; 
                }
                .btn-primary-dark:disabled { 
                    background-color: #1e40af; 
                    cursor: not-allowed; 
                    opacity: 0.7; 
                }
                .btn-secondary-dark { 
                    background-color: #334155; 
                    color: #e2e8f0; 
                    font-weight: 500; 
                    padding: 0.625rem 1.25rem; 
                    border-radius: 0.5rem; 
                    border: 1px solid #475569; 
                    display: flex; 
                    align-items: center; 
                    gap: 0.5rem; 
                    transition: all 0.2s ease-in-out; 
                }
                .btn-secondary-dark:hover { 
                    background-color: #475569; 
                }
                .btn-danger-dark { 
                    background-color: #be123c; 
                    color: white; 
                    font-weight: 600; 
                    padding: 0.625rem 1.25rem; 
                    border-radius: 0.5rem; 
                    transition: all 0.2s ease-in-out; 
                }
                .btn-danger-dark:hover { 
                    background-color: #9f1239; 
                }
                .form-checkbox { 
                    appearance: none; 
                    background-color: #475569; 
                    border: 1px solid #64748b; 
                    padding: 0.5rem; 
                    border-radius: 0.25rem; 
                    display: inline-block; 
                    position: relative; 
                    cursor: pointer; 
                }
                .form-checkbox:checked { 
                    background-color: #2563eb; 
                    border-color: #3b82f6; 
                }
                .form-checkbox:checked::after { 
                    content: '✔'; 
                    font-size: 0.8rem; 
                    color: white; 
                    position: absolute; 
                    left: 50%; 
                    top: 50%; 
                    transform: translate(-50%, -50%); 
                }
                .form-checkbox:disabled { 
                    background-color: #334155; 
                    border-color: #475569; 
                    cursor: not-allowed; 
                }
            `}</style>
        </div>
    );
}
