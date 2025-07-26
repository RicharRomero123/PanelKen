"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import { UserPlus, Eye, Repeat, Edit, Trash2, DollarSign, ArchiveRestore, RefreshCw } from 'lucide-react';
import { Tooltip, getStatusBadge } from './ui/ui-elements';
import { ReactNode } from 'react';

export interface ColumnDefinition<T> {
    header: string | ReactNode;
    accessor: keyof T | ((item: T) => ReactNode);
}

// --- DEFINICIONES DE TIPOS LOCALES ---
enum StatusCuenta { ACTIVO = "ACTIVO", VENCIDO = "VENCIDO", REEMPLAZADA = "REEMPLAZADA", REPORTADO = "REPORTADO", SINUSAR = "SINUSAR" }
enum TipoCuenta { INDIVIDUAL = "INDIVIDUAL", COMPLETO = "COMPLETO" }
enum TipoCliente { NORMAL = "NORMAL", RESELLER = "RESELLER" }
interface Cuenta { id: number; correo: string; contraseña: string; pin: string; perfilesOcupados: number; perfilesMaximos: number; enlace: string; fechaInicio: string; fechaRenovacion: string; status: StatusCuenta; tipoCuenta: TipoCuenta; precioVenta: number; clienteId: number | null; servicioId: number; }
interface Cliente { id: number; nombre: string; apellido: string; numero: string; correo?: string; tipoCliente: TipoCliente; linkWhatsapp?: string; }
interface Servicio { id: number; nombre: string; urlImg?: string; }

interface CuentasTableProps {
    cuentas: Cuenta[];
    clientes: Cliente[];
    servicios: Servicio[];
    activeTab: 'stock' | 'sold' | 'fallen' | 'reported' | 'vencido';
    selectedAccounts: number[];
    setSelectedAccounts: React.Dispatch<React.SetStateAction<number[]>>;
    onOpenModal: (mode: string, account: Cuenta | null) => void;
    getProfileCount: (account: Cuenta) => number;
}

export const CuentasTable = ({ cuentas, clientes, servicios, activeTab, selectedAccounts, setSelectedAccounts, onOpenModal, getProfileCount }: CuentasTableProps) => {
    
    const handleSelectAccount = (accountId: number) => {
        setSelectedAccounts(prev => prev.includes(accountId) ? prev.filter(id => id !== accountId) : [...prev, accountId]);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const accountsToSelect = cuentas.filter(acc => acc.tipoCuenta === TipoCuenta.COMPLETO).map(acc => acc.id);
            setSelectedAccounts(accountsToSelect);
        } else {
            setSelectedAccounts([]);
        }
    };

    const isAccountReadyToSell = (account: Cuenta) => {
        return account.correo && account.contraseña;
    }

    const canSellMoreProfiles = (account: Cuenta, profileCount: number) => {
        return account.tipoCuenta === TipoCuenta.INDIVIDUAL && 
               account.status === StatusCuenta.ACTIVO && 
               profileCount < account.perfilesMaximos;
    }

    const displayDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString.replace(/-/g, '/'));
        return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Lima' });
    };

    if (cuentas.length === 0) {
        return <p className="text-center py-10 text-slate-500">No se encontraron cuentas para esta vista.</p>;
    }

    return (
        <div>
            {selectedAccounts.length > 0 && activeTab === 'stock' && (
                <motion.div initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -20}} className="mb-4 bg-slate-700 p-3 rounded-lg flex justify-between items-center">
                    <span className="font-semibold">{selectedAccounts.length} cuenta(s) completa(s) seleccionada(s)</span>
                    <button onClick={() => onOpenModal('bulk-sell', null)} className="btn-primary-dark !bg-green-600 hover:!bg-green-700 !py-2 !px-4">
                        <DollarSign size={16}/> Vender Seleccionadas
                    </button>
                </motion.div>
            )}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-800">
                        <tr>
                            {activeTab === 'stock' && <th scope="col" className="p-4"><input type="checkbox" className="form-checkbox" onChange={handleSelectAll} /></th>}
                            <th scope="col" className="px-4 py-3 text-center">#</th> {/* ✓ CAMBIO 1 */}
                            <th scope="col" className="px-4 py-3">Cuenta</th>
                            <th scope="col" className="px-4 py-3">Estado</th>
                            <th scope="col" className="px-4 py-3">Tipo</th>
                            <th scope="col" className="px-4 py-3">Perfiles</th>
                            <th scope="col" className="px-4 py-3">Renovación</th>
                            <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-200">
                        {cuentas.map((account, index) => { // ✓ CAMBIO 2 (añadir index)
                            const client = clientes.find(c => c.id === account.clienteId);
                            const service = servicios.find(s => s.id === account.servicioId);
                            const profileCount = getProfileCount(account);
                            const showSellProfileButton = activeTab === 'sold' && canSellMoreProfiles(account, profileCount);
                            
                            return (
                                <tr key={account.id} className={`border-b border-slate-700 transition-colors ${selectedAccounts.includes(account.id) ? 'bg-blue-900/50' : 'hover:bg-slate-800'}`}>
                                    {activeTab === 'stock' && <td className="p-4"><input type="checkbox" className="form-checkbox" disabled={account.tipoCuenta !== TipoCuenta.COMPLETO} checked={selectedAccounts.includes(account.id)} onChange={() => handleSelectAccount(account.id)} /></td>}
                                    
                                    <td className="px-4 py-4 text-center font-medium text-slate-400">{index + 1}</td> {/* ✓ CAMBIO 3 (añadir celda) */}
                                    
<td className="px-4 py-4">
    <div className="flex items-center gap-3">
        {service && <Image src={service.urlImg || 'https://placehold.co/40x40/1e293b/94a3b8?text=S'} alt={service.nombre} width={24} height={24} className="rounded-full object-cover" />}
        <div>
            <div className="font-medium text-white">{account.correo}</div>
            <div className="text-slate-400 text-xs font-mono">Pass: {account.contraseña || 'N/A'}</div>

            {/* BLOQUE AÑADIDO PARA MOSTRAR EL CLIENTE */}
            {client && (
                <div className="text-sky-400 text-xs font-semibold mt-1 flex items-center gap-1.5">
                    <UserPlus size={12} />
                    <span>{client.nombre} {client.apellido}</span>
                </div>
            )}
        </div>
    </div>
</td>                                    <td className="px-4 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(account.status)}`}>{account.status}</span></td>
                                    <td className="px-4 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${account.tipoCuenta === 'INDIVIDUAL' ? 'bg-purple-500/20 text-purple-300' : 'bg-orange-500/20 text-orange-300'}`}>{account.tipoCuenta}</span></td>
                                    <td className="px-4 py-4">{account.tipoCuenta === TipoCuenta.INDIVIDUAL ? (<div className="text-xs w-28"><p>{profileCount} de {account.perfilesMaximos} usados</p><div className="w-full bg-slate-700 rounded-full h-1.5 mt-1"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(profileCount / (account.perfilesMaximos || 1)) * 100}%` }}></div></div></div>) : (<span className="text-slate-400">N/A</span>)}</td>
                                    <td className="px-4 py-4">{displayDate(account.fechaRenovacion)}</td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-center items-center gap-1.5">
                                            {activeTab === 'stock' && (
                                                <div className="relative group">
                                                    <button onClick={() => onOpenModal('sell', account)} disabled={!isAccountReadyToSell(account)} className="btn-primary-dark text-xs !py-1 !px-2 disabled:!bg-slate-600 disabled:cursor-not-allowed"><UserPlus size={14}/> Vender</button>
                                                    {!isAccountReadyToSell(account) && <Tooltip text="Editar y completar datos para poder vender" />}
                                                </div>
                                            )}
                                            {activeTab === 'sold' && (
                                                <div className="relative group">
                                                    <button onClick={() => onOpenModal('detail', account)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"><Eye size={16} /></button>
                                                    <Tooltip text="Ver Detalles" />
                                                </div>
                                            )}
                                            {activeTab === 'vencido' && account.tipoCuenta === TipoCuenta.COMPLETO && (
                                                <div className="relative group">
                                                    <button onClick={() => onOpenModal('renew-account', account)} className="p-2 text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-md">
                                                        <RefreshCw size={16} />
                                                    </button>
                                                    <Tooltip text="Renovar Cuenta Completa" />
                                                </div>
                                            )}
                                            {showSellProfileButton && (
                                                <div className="relative group">
                                                    <button onClick={() => onOpenModal('sell', account)} className="btn-primary-dark text-xs !py-1 !px-2">
                                                        <UserPlus size={14}/> Vender Perfil
                                                    </button>
                                                    <Tooltip text="Vender un perfil adicional" />
                                                </div>
                                            )}
                                            {activeTab !== 'sold' && (
                                                <>
                                                    {(account.status === 'SINUSAR' || account.status === 'VENCIDO') && (
                                                        <div className="relative group">
                                                            <button onClick={() => onOpenModal('edit', account)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md">
                                                                <Edit size={16} />
                                                            </button>
                                                            <Tooltip text="Editar" />
                                                        </div>
                                                    )}
                                                    {account.status === 'SINUSAR' && (
                                                        <div className="relative group">
                                                            <button onClick={() => onOpenModal('delete', account)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md">
                                                                <Trash2 size={16} />
                                                            </button>
                                                            <Tooltip text="Eliminar" />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};