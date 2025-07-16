'use client';

import { useEffect, useState, useCallback, FormEvent, useMemo } from 'react';
// Usamos rutas relativas para máxima compatibilidad
import { getAllReportes, createReporte } from '../../../services/reporteCuentaService';
import { searchCuentas, cambiarCuenta } from '../../../services/cuentaService';
import { getAllUsers } from '../../../services/userService';
import { getAllClientes } from '../../../services/clienteService';
import { getAllServicios } from '../../../services/servicioService';
import { useAuth } from '@/context/AuthContext';
import { Plus, X, Search, RefreshCw, AlertTriangle, CheckCircle, FileText, User, Mail, Calendar, MessageSquare, Eye, DollarSign, Package, UserIcon, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';

// --- Tipos definidos localmente ---
interface Reporte { id: number; cuentaId: number; usuarioId: number; fecha: string; motivo: string; detalle: string; }
interface Cuenta { id: number; correo: string; clienteId: number | null; servicioId: number; precioVenta: number; status: string; }
interface User { id: number; nombre: string; }
interface Cliente { id: number; nombre: string; apellido: string; linkWhatsapp: string; numero: string; }
interface Servicio { id: number; nombre: string; }

// --- Motivos de Reporte Predefinidos ---
const reportReasons = [
    "CUENTA CAIDA",
    "SE CAYO EL METODO",
    "SOLICITUD DE REEMBOLSO",
    "PIN INCORRECTO",
    "CUENTA VENCIDA",
    "OTRO"
];

// --- Componente del Modal para Crear Reporte ---
const ReportFormModal = ({ isOpen, onClose, accounts, users, onSaveSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    accounts: Cuenta[];
    users: User[];
    onSaveSuccess: (message: string) => void;
}) => {
    const initialFormData = { cuentaId: 0, usuarioId: 0, motivo: '', detalle: '' };
    const [formData, setFormData] = useState(initialFormData);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => { if (isOpen) setFormData(initialFormData); }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name.includes('Id') ? parseInt(value, 10) : value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.cuentaId || !formData.usuarioId || !formData.motivo) {
            toast.error("Debes seleccionar una cuenta, un usuario y un motivo.");
            return;
        }
        setFormLoading(true);
        const loadingToast = toast.loading('Creando reporte...');
        try {
            const dataToCreate = { ...formData, fecha: new Date().toISOString().slice(0, 10) };
            await createReporte(dataToCreate as any);
            toast.dismiss(loadingToast);
            onSaveSuccess('Reporte creado exitosamente');
            onClose();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || 'Error al crear el reporte.');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3"><FileText className="text-blue-400" />Crear Nuevo Reporte</h2>
                            <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label-style">Cuenta Afectada</label>
                                    <select name="cuentaId" value={formData.cuentaId} onChange={handleInputChange} className="input-style-dark p-3" required>
                                        <option value={0} disabled>Selecciona una cuenta</option>
                                        {accounts.filter(a => a.status === 'ACTIVO').map(acc => <option key={acc.id} value={acc.id}>{acc.correo}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label-style">Usuario que Reporta</label>
                                    <select name="usuarioId" value={formData.usuarioId} onChange={handleInputChange} className="input-style-dark p-3" required>
                                        <option value={0} disabled>Selecciona un usuario</option>
                                        {users.map(user => <option key={user.id} value={user.id}>{user.nombre}</option>)}
                                    </select>
                                </div>
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
                                <textarea name="detalle" rows={4} value={formData.detalle} onChange={handleInputChange} className="input-style-dark p-3" placeholder="Proporciona más información si es necesario..." />
                            </div>
                            <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-700">
                                <button type="button" onClick={onClose} className="btn-secondary-dark">Cancelar</button>
                                <button type="submit" disabled={formLoading} className="btn-primary-dark">
                                    {formLoading ? <RefreshCw className="animate-spin" /> : <Plus />}
                                    {formLoading ? 'Guardando...' : 'Crear Reporte'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- Componente del Modal para Ver Detalles ---
const ViewReportModal = ({ isOpen, onClose, report, account, user, client, service, onOpenChangeModal }: {
    isOpen: boolean;
    onClose: () => void;
    report: Reporte | null;
    account: Cuenta | null;
    user: User | null;
    client: Cliente | null;
    service: Servicio | null;
    onOpenChangeModal: (account: Cuenta) => void;
}) => {
    if (!isOpen || !report) return null;
    
    const handleWhatsAppClick = () => {
        if (!client) {
            toast.error("No se encontró cliente asociado a esta cuenta.");
            return;
        }
        if (!client.linkWhatsapp && !client.numero) {
            toast.error("Este cliente no tiene un link de WhatsApp o número registrado.");
            return;
        }

        const message = `👋 Hola *${client.nombre}*, te contacto sobre el reporte de tu cuenta de *${service?.nombre || 'un servicio'}*.\n\n*Motivo:* ${report.motivo}\n\nNos pondremos en contacto para solucionarlo.`;
        const encodedMessage = encodeURIComponent(message);
        const finalLink = client.linkWhatsapp || `https://wa.me/51${client.numero}`;
        window.open(`${finalLink}?text=${encodedMessage}`, '_blank', 'noopener,noreferrer');
        toast.success("Abriendo WhatsApp para contactar al cliente...");
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Eye className="text-blue-400" />Detalles del Reporte</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                    <div className="space-y-4 text-slate-300">
                        <p><strong>Motivo:</strong> <span className="text-white font-semibold">{report.motivo}</span></p>
                        <p><strong>Detalle:</strong> <span className="text-white">{report.detalle || 'No se proporcionaron detalles.'}</span></p>
                        <div className="border-t border-slate-700 pt-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <p><strong className="flex items-center gap-2"><Mail size={16}/> Cuenta:</strong> <span className="text-white">{account?.correo || 'N/A'}</span></p>
                            <p><strong className="flex items-center gap-2"><Package size={16}/> Servicio:</strong> <span className="text-white">{service?.nombre || 'N/A'}</span></p>
                            <p><strong className="flex items-center gap-2"><User size={16}/> Cliente:</strong> <span className="text-white">{client ? `${client.nombre} ${client.apellido}` : 'N/A'}</span></p>
                            <p><strong className="flex items-center gap-2"><DollarSign size={16}/> Precio Venta:</strong> <span className="text-white">${account?.precioVenta?.toFixed(2) || '0.00'}</span></p>
                            <p><strong className="flex items-center gap-2"><UserIcon size={16}/> Reportado por:</strong> <span className="text-white">{user?.nombre || 'N/A'}</span></p>
                            <p><strong className="flex items-center gap-2"><Calendar size={16}/> Fecha:</strong> <span className="text-white">{new Date(report.fecha.replace(/-/g, '/')).toLocaleDateString('es-PE')}</span></p>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-700">
                        <button type="button" onClick={() => account && onOpenChangeModal(account)} disabled={!account} className="btn-secondary-dark !bg-orange-600/20 !text-orange-300 hover:!bg-orange-500/30 disabled:!bg-slate-600 disabled:!text-slate-400 disabled:cursor-not-allowed"><Repeat size={16}/>Cambiar Cuenta</button>
                        <button onClick={handleWhatsAppClick} disabled={!client} className="btn-primary-dark !bg-green-600 hover:!bg-green-700 disabled:!bg-slate-600"><MessageSquare size={16}/>Contactar Cliente</button>
                        <button type="button" onClick={onClose} className="btn-secondary-dark">Cerrar</button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const ChangeAccountModal = ({ isOpen, onClose, oldAccount, availableAccounts, onSaveSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    oldAccount: Cuenta | null;
    availableAccounts: Cuenta[];
    onSaveSuccess: (message: string) => void;
}) => {
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
                        <div><label className="label-style">Seleccionar Nueva Cuenta Disponible</label><select onChange={(e) => setNewAccountId(Number(e.target.value))} className="input-style-dark p-3" required><option value="" disabled selected>Elige una cuenta de reemplazo...</option>{availableAccounts.map(c => <option key={c.id} value={c.id}>{c.correo}</option>)}</select></div>
                        <div><label className="label-style">Motivo del Cambio</label><input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="input-style-dark p-3" required /></div>
                        <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-700"><button type="button" onClick={onClose} className="btn-secondary-dark">Cancelar</button><button type="submit" disabled={formLoading} className="btn-primary-dark">{formLoading ? <RefreshCw className="animate-spin" /> : <CheckCircle />}{formLoading ? 'Procesando...' : 'Confirmar Cambio'}</button></div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default function ReportesPage() {
    const [reportes, setReportes] = useState<Reporte[]>([]);
    const [cuentas, setCuentas] = useState<Cuenta[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [isChangeModalOpen, setIsChangeModalOpen] = useState<boolean>(false);
    const [selectedReport, setSelectedReport] = useState<Reporte | null>(null);
    const [accountToChange, setAccountToChange] = useState<Cuenta | null>(null);
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [reportsData, accountsData, usersData, clientsData, servicesData] = await Promise.all([
                getAllReportes(),
                searchCuentas({}),
                getAllUsers(),
                getAllClientes(),
                getAllServicios()
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

    const filteredReportes = useMemo(() => {
        return reportes.filter(report => {
            const account = cuentas.find(c => c.id === report.cuentaId);
            const user = users.find(u => u.id === report.usuarioId);
            return (
                report.motivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (account && account.correo.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user && user.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        });
    }, [reportes, cuentas, users, searchTerm]);

    const handleOpenViewModal = (report: Reporte) => {
        setSelectedReport(report);
        setIsViewModalOpen(true);
    };

    const handleOpenChangeModal = (account: Cuenta) => {
        setAccountToChange(account);
        setIsViewModalOpen(false); // Cierra el modal de detalles
        setIsChangeModalOpen(true); // Abre el modal de cambio
    };

    const handleSaveSuccess = (message: string) => {
        toast.success(message);
        fetchData();
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">
            <Toaster position="top-right" toastOptions={{ className: 'bg-slate-700 text-white shadow-lg', success: { iconTheme: { primary: '#10b981', secondary: 'white' } }, error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } } }} />
            
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><FileText />Gestión de Reportes</h1>
                        <p className="mt-2 text-slate-400">Visualiza y crea reportes de incidencias con las cuentas.</p>
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className="mt-4 md:mt-0 bg-blue-600 text-white hover:bg-blue-700 font-bold py-2.5 px-5 rounded-lg shadow-md transition duration-300 flex items-center gap-2">
                        <Plus />Nuevo Reporte
                    </button>
                </div>

                <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Buscar por motivo, correo o usuario..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-style-dark pl-10 pr-4 py-3 w-full" />
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
                                            <th scope="col" className="px-6 py-4">Cuenta Afectada</th>
                                            <th scope="col" className="px-6 py-4">Motivo</th>
                                            <th scope="col" className="px-6 py-4">Reportado por</th>
                                            <th scope="col" className="px-6 py-4 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-200">
                                        {filteredReportes.map((report) => {
                                            const account = cuentas.find(c => c.id === report.cuentaId);
                                            const user = users.find(u => u.id === report.usuarioId);
                                            return (
                                            <tr key={report.id} className="border-b border-slate-700 hover:bg-slate-800 transition-colors">
                                                <td className="px-6 py-4">{new Date(report.fecha.replace(/-/g, '/')).toLocaleDateString('es-PE')}</td>
                                                <td className="px-6 py-4 font-medium">{account?.correo || `ID: ${report.cuentaId}`}</td>
                                                <td className="px-6 py-4">{report.motivo}</td>
                                                <td className="px-6 py-4">{user?.nombre || `ID: ${report.usuarioId}`}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleOpenViewModal(report)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"><Eye size={16} /></button>
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:hidden">
                            <AnimatePresence>
                            {filteredReportes.map((report) => {
                                const account = cuentas.find(c => c.id === report.cuentaId);
                                const user = users.find(u => u.id === report.usuarioId);
                                return (
                                <motion.div key={report.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg p-4 space-y-4">
                                    <div>
                                        <p className="font-bold text-lg text-white">{report.motivo}</p>
                                        <p className="text-xs text-slate-400">{new Date(report.fecha.replace(/-/g, '/')).toLocaleDateString('es-PE')}</p>
                                    </div>
                                    <div className="border-t border-slate-700 pt-3 space-y-2 text-sm">
                                        <p className="flex items-center gap-2 text-slate-300"><Mail size={14} /> Cuenta: {account?.correo || `ID: ${report.cuentaId}`}</p>
                                        <p className="flex items-center gap-2 text-slate-300"><User size={14} /> Reportado por: {user?.nombre || `ID: ${report.usuarioId}`}</p>
                                    </div>
                                    <div className="pt-3 border-t border-slate-700">
                                        <button onClick={() => handleOpenViewModal(report)} className="w-full btn-secondary-dark justify-center"><Eye size={16}/> Ver Detalles</button>
                                    </div>
                                </motion.div>
                            )})}
                            </AnimatePresence>
                        </div>
                    </>
                )}
                {!loading && filteredReportes.length === 0 && <p className="text-center py-10 text-slate-500">No se encontraron reportes.</p>}

                <ReportFormModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} accounts={cuentas} users={users} onSaveSuccess={handleSaveSuccess} />
                
                {selectedReport && (
                    <ViewReportModal 
                        isOpen={isViewModalOpen} 
                        onClose={() => setIsViewModalOpen(false)} 
                        report={selectedReport}
                        account={cuentas.find(c => c.id === selectedReport.cuentaId) || null}
                        user={users.find(u => u.id === selectedReport.usuarioId) || null}
                        client={clientes.find(cli => cli.id === (cuentas.find(c => c.id === selectedReport.cuentaId)?.clienteId)) || null}
                        service={servicios.find(s => s.id === (cuentas.find(c => c.id === selectedReport.cuentaId)?.servicioId)) || null}
                        onOpenChangeModal={handleOpenChangeModal}
                    />
                )}
                
                {accountToChange && (
                    <ChangeAccountModal
                        isOpen={isChangeModalOpen}
                        onClose={() => setIsChangeModalOpen(false)}
                        oldAccount={accountToChange}
                        availableAccounts={cuentas.filter(c => c.servicioId === accountToChange.servicioId && c.status === 'SINUSAR')}
                        onSaveSuccess={handleSaveSuccess}
                    />
                )}
            </div>
            <style jsx global>{`
                .label-style { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #cbd5e1; }
                .input-style-dark { background-color: rgb(30 41 59 / 0.5); border: 1px solid #334155; color: #e2e8f0; font-size: 0.875rem; border-radius: 0.5rem; display: block; width: 100%; transition: all 0.2s ease-in-out; }
                .input-style-dark:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4); }
                .btn-primary-dark { background-color: #2563eb; color: white; font-weight: 600; padding: 0.625rem 1.25rem; border-radius: 0.5rem; text-align: center; transition: all 0.2s ease-in-out; display: flex; align-items: center; gap: 0.5rem; justify-content: center; }
                .btn-primary-dark:hover { background-color: #1d4ed8; }
                .btn-primary-dark:disabled { background-color: #1e40af; cursor: not-allowed; opacity: 0.7; }
                .btn-secondary-dark { background-color: #334155; color: #e2e8f0; font-weight: 500; padding: 0.625rem 1.25rem; border-radius: 0.5rem; border: 1px solid #475569; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease-in-out; }
                .btn-secondary-dark:hover { background-color: #475569; }
            `}</style>
        </div>
    );
}
