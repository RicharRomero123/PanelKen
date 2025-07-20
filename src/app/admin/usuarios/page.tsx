// src/app/admin/usuarios/page.tsx
'use client';

import { useEffect, useState, useCallback, FormEvent, useMemo } from 'react';
// Usamos rutas relativas para máxima compatibilidad
import { getAllUsers, updateUser, deleteUser } from '../../../services/userService';
import { register } from '../../../services/authService';
import { Plus, Edit, Trash2, X, Search, FileDown, Eye, EyeOff, RefreshCw, User as UserIcon, Mail, Phone, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
// --- Librerías para exportar ---
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Tipos definidos localmente ---
enum RolUsuario {
    ADMIN = "ADMIN",
    TRABAJADOR = "TRABAJADOR",
}

interface User {
    id: number;
    nombre: string;
    correo: string;
    telefono: string;
    rolUsuario: RolUsuario;
}

// --- Componente del Modal del Formulario (Refactorizado con nuevo diseño) ---
const UserFormModal = ({ isOpen, onClose, mode, user, onSaveSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    user: User | null;
    onSaveSuccess: (message: string) => void;
}) => {
    const initialFormData = useMemo(() => ({
        nombre: user?.nombre || '',
        correo: user?.correo || '',
        telefono: user?.telefono || '',
        rolUsuario: user?.rolUsuario || RolUsuario.TRABAJADOR,
        password: '',
        confirmPassword: '',
    }), [user]);

    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Débil', color: 'bg-red-500' });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormData);
            setErrors({});
            setShowPassword(false);
            setPasswordStrength({ score: 0, label: 'Débil', color: 'bg-red-500' });
        }
    }, [isOpen, initialFormData]);

    const validateField = (name: string, value: string) => {
        let error = '';
        switch (name) {
            case 'correo':
                if (!/^\S+@\S+\.\S+$/.test(value)) error = 'Formato de correo inválido.';
                break;
            case 'telefono':
                if (value && !/^\d{9}$/.test(value)) error = 'El teléfono debe tener 9 dígitos.';
                break;
            case 'password':
                checkPasswordStrength(value);
                if (formData.confirmPassword && value !== formData.confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden.' }));
                } else {
                    setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }
                break;
            case 'confirmPassword':
                if (value !== formData.password) error = 'Las contraseñas no coinciden.';
                break;
        }
        setErrors(prev => ({ ...prev, [name]: error }));
    };
    
    const checkPasswordStrength = (password: string) => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        let label = 'Débil';
        let color = 'bg-red-500';
        if (score > 1) { label = 'Media'; color = 'bg-yellow-500'; }
        if (score > 2) { label = 'Fuerte'; color = 'bg-green-500'; }
        setPasswordStrength({ score, label, color });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        validateField(name, value);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        Object.keys(formData).forEach(key => validateField(key, (formData as any)[key]));
        if (Object.values(errors).some(error => error)) {
            toast.error("Por favor, corrige los errores en el formulario.");
            return;
        }
        if (mode === 'add' && !formData.password) {
            setErrors(prev => ({...prev, password: 'La contraseña es requerida.'}));
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setErrors(prev => ({...prev, confirmPassword: 'Las contraseñas no coinciden.'}));
            return;
        }

        setFormLoading(true);
        const loadingToast = toast.loading(mode === 'add' ? 'Creando usuario...' : 'Actualizando usuario...');
        try {
            const { confirmPassword, ...dataToSend } = formData;
            if (mode === 'add') {
                await register(dataToSend);
            } else if (mode === 'edit' && user) {
                const updateData: any = { ...dataToSend };
                if (!updateData.password) delete updateData.password;
                await updateUser(user.id, updateData);
            }
            toast.dismiss(loadingToast);
            onSaveSuccess(mode === 'add' ? 'Usuario creado exitosamente' : 'Usuario actualizado exitosamente');
            onClose();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || `Error al ${mode === 'add' ? 'crear' : 'actualizar'} el usuario.`);
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3"><UserIcon className="text-blue-400" />{mode === 'add' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}</h2>
                            <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-1">
                                <div>
                                    <label className="label-style">Nombre</label>
                                    <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className="input-style-dark p-3" required />
                                </div>
                                <div>
                                    <label className="label-style">Correo</label>
                                    <input type="email" name="correo" value={formData.correo} onChange={handleInputChange} className="input-style-dark p-3" required />
                                    {errors.correo && <p className="error-style">{errors.correo}</p>}
                                </div>
                                <div>
                                    <label className="label-style">Teléfono</label>
                                    <input type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} className="input-style-dark p-3" />
                                    {errors.telefono && <p className="error-style">{errors.telefono}</p>}
                                </div>
                                <div>
                                    <label className="label-style">Rol</label>
                                    <select name="rolUsuario" value={formData.rolUsuario} onChange={handleInputChange} className="input-style-dark p-3">
                                        <option value={RolUsuario.TRABAJADOR}>Trabajador</option>
                                        <option value={RolUsuario.ADMIN}>Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label-style">Contraseña</label>
                                    <div className="relative">
                                        <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} className="input-style-dark p-3" placeholder={mode === 'edit' ? 'Dejar en blanco para no cambiar' : ''} required={mode === 'add'} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                    </div>
                                    {errors.password && <p className="error-style">{errors.password}</p>}
                                    {formData.password && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="w-full bg-slate-700 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${passwordStrength.color}`} style={{ width: `${(passwordStrength.score / 4) * 100}%` }}></div></div>
                                            <span className="text-xs font-medium text-slate-400">{passwordStrength.label}</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="label-style">Confirmar Contraseña</label>
                                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className="input-style-dark p-3" required={!!formData.password} />
                                    {errors.confirmPassword && <p className="error-style">{errors.confirmPassword}</p>}
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-700">
                                <button type="button" onClick={onClose} className="btn-secondary-dark">Cancelar</button>
                                <button type="submit" disabled={formLoading} className="btn-primary-dark">
                                    {formLoading ? <RefreshCw className="animate-spin" /> : (mode === 'add' ? <Plus/> : <CheckCircle/>)}
                                    {formLoading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default function UsuariosPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | RolUsuario>('all');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | 'export' | null>(null);
    const [exportType, setExportType] = useState<'excel' | 'pdf' | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (err) {
            toast.error('No se pudieron cargar los usuarios.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            (user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || user.correo.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (roleFilter === 'all' || user.rolUsuario === roleFilter)
        );
    }, [users, searchTerm, roleFilter]);

    const handleExportClick = (type: 'excel' | 'pdf') => {
        setExportType(type);
        setModalMode('export');
        setIsModalOpen(true);
    };
    
    const handleConfirmExport = () => {
        const loadingToast = toast.loading(`Exportando a ${exportType?.toUpperCase()}...`);
        try {
            if (exportType === 'excel') {
                const dataToExport = filteredUsers.map(user => ({ Nombre: user.nombre, Correo: user.correo, Teléfono: user.telefono, Rol: user.rolUsuario }));
                const worksheet = XLSX.utils.json_to_sheet(dataToExport);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
                XLSX.writeFile(workbook, `usuarios_${new Date().toISOString().slice(0,10)}.xlsx`);
            } else if (exportType === 'pdf') {
                const doc = new jsPDF();
                const tableColumn = ["ID", "Nombre", "Correo", "Teléfono", "Rol"];
                const tableRows = filteredUsers.map(user => [user.id, user.nombre, user.correo, user.telefono, user.rolUsuario]);
                doc.text("Reporte de Usuarios", 14, 15);
                autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
                doc.save(`reporte_usuarios_${new Date().toISOString().slice(0,10)}.pdf`);
            }
            toast.dismiss(loadingToast);
            toast.success(`Reporte exportado a ${exportType?.toUpperCase()} correctamente.`);
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error("Error al exportar el reporte.");
        }
        handleCloseModal();
    };

    const handleOpenModal = (mode: 'add' | 'edit' | 'delete', user: User | null = null) => {
        setModalMode(mode);
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalMode(null);
        setCurrentUser(null);
        setExportType(null);
    };
    
    const handleSaveSuccess = (message: string) => {
        toast.success(message);
        fetchUsers();
    };

    const handleDelete = async () => {
        if (!currentUser) return;
        const loadingToast = toast.loading("Eliminando usuario...");
        try {
            await deleteUser(currentUser.id);
            toast.dismiss(loadingToast);
            handleSaveSuccess("Usuario eliminado correctamente.");
            handleCloseModal();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || "Error al eliminar el usuario.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">
            <Toaster position="top-right" toastOptions={{ className: 'bg-slate-700 text-white shadow-lg', success: { iconTheme: { primary: '#10b981', secondary: 'white' } }, error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } } }} />
            
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><UserIcon />Gestión de Trabajadores</h1>
                        <p className="mt-2 text-slate-400">Añade, edita o elimina trabajadores del sistema.</p>
                    </div>
                    <button onClick={() => handleOpenModal('add')} className="mt-4 md:mt-0 bg-blue-600 text-white hover:bg-blue-700 font-bold py-2.5 px-5 rounded-lg shadow-md transition duration-300 flex items-center gap-2">
                        <Plus />Nuevo Usuario
                    </button>
                </div>

                <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                        {/* CORRECCIÓN: Se añade padding izquierdo (pl-10) para dejar espacio al icono */}
                        <input type="text" placeholder="Buscar por nombre o correo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-style-dark pl-10 pr-4 py-3 w-full" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)} className="input-style-dark w-full sm:w-48 px-4 py-3">
                            <option value="all">Todos los Roles</option>
                            <option value={RolUsuario.ADMIN}>Admin</option>
                            <option value={RolUsuario.TRABAJADOR}>Trabajador</option>
                        </select>
                        <div className="flex gap-2">
                            <button onClick={() => handleExportClick('pdf')} className="btn-secondary-dark flex-1 justify-center"><FileDown size={18} /> PDF</button>
                        </div>
                    </div>
                </div>

                {loading ? <div className="text-center py-10"><RefreshCw className="animate-spin text-3xl mx-auto text-blue-400" /></div> : (
                    <>
                        <div className="hidden md:block bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left">
                                    <thead className="text-xs text-slate-400 uppercase bg-slate-800">
                                        <tr>
                                            <th scope="col" className="px-6 py-4">Nombre</th>
                                            <th scope="col" className="px-6 py-4">Contacto</th>
                                            <th scope="col" className="px-6 py-4">Rol</th>
                                            <th scope="col" className="px-6 py-4 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-200">
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-800 transition-colors">
                                                <td className="px-6 py-4 font-medium">{user.nombre}</td>
                                                <td className="px-6 py-4"><div className="flex flex-col"><span className="font-medium">{user.correo}</span><span className="text-slate-400">{user.telefono}</span></div></td>
                                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.rolUsuario === 'ADMIN' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>{user.rolUsuario}</span></td>
                                                <td className="px-6 py-4 flex justify-center items-center gap-2">
                                                    <button onClick={() => handleOpenModal('edit', user)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"><Edit size={16} /></button>
                                                    <button onClick={() => handleOpenModal('delete', user)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            <AnimatePresence>
                            {filteredUsers.map((user) => (
                                <motion.div key={user.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-lg text-white">{user.nombre}</p>
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.rolUsuario === 'ADMIN' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>{user.rolUsuario}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleOpenModal('edit', user)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"><Edit size={16} /></button>
                                            <button onClick={() => handleOpenModal('delete', user)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-700 pt-3 space-y-2 text-sm">
                                        <p className="flex items-center gap-2 text-slate-300"><Mail size={14} /> {user.correo}</p>
                                        <p className="flex items-center gap-2 text-slate-300"><Phone size={14} /> {user.telefono || 'No especificado'}</p>
                                    </div>
                                </motion.div>
                            ))}
                            </AnimatePresence>
                        </div>
                    </>
                )}

                {isModalOpen && (modalMode === 'add' || modalMode === 'edit') && (
                    <UserFormModal isOpen={isModalOpen} onClose={handleCloseModal} mode={modalMode} user={currentUser} onSaveSuccess={handleSaveSuccess} />
                )}

                <AnimatePresence>
                {isModalOpen && (modalMode === 'delete' || modalMode === 'export') && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    {modalMode === 'delete' && <><AlertTriangle className="text-red-400"/>Confirmar Eliminación</>}
                                    {modalMode === 'export' && <><FileDown className="text-blue-400"/>Confirmar Exportación</>}
                                </h2>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                            </div>
                            {modalMode === 'delete' && (
                                <div className="space-y-4">
                                    <p className="text-slate-300">¿Estás seguro de que quieres eliminar al usuario <strong className="text-white">{currentUser?.nombre}</strong>? Esta acción es irreversible.</p>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button onClick={handleCloseModal} className="btn-secondary-dark">Cancelar</button>
                                        <button onClick={handleDelete} className="btn-danger-dark">Sí, eliminar</button>
                                    </div>
                                </div>
                            )}
                            {modalMode === 'export' && (
                                <div className="space-y-4">
                                    <p className="text-slate-300">Se exportarán {filteredUsers.length} registros a un archivo <strong className="text-white uppercase">{exportType}</strong>. ¿Deseas continuar?</p>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button onClick={handleCloseModal} className="btn-secondary-dark">Cancelar</button>
                                        <button onClick={handleConfirmExport} className="btn-primary-dark">Sí, Exportar</button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
                </AnimatePresence>
                <style jsx global>{`
                    .label-style { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #cbd5e1; }
                    .error-style { font-size: 0.75rem; color: #f87171; margin-top: 0.5rem; }
                    .input-style-dark { background-color: rgb(30 41 59 / 0.5); border: 1px solid #334155; color: #e2e8f0; font-size: 0.875rem; border-radius: 0.5rem; display: block; width: 100%; transition: all 0.2s ease-in-out; }
                    .input-style-dark:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4); }
                    .btn-primary-dark { background-color: #2563eb; color: white; font-weight: 600; padding: 0.625rem 1.25rem; border-radius: 0.5rem; text-align: center; transition: all 0.2s ease-in-out; display: flex; align-items: center; gap: 0.5rem; justify-content: center; }
                    .btn-primary-dark:hover { background-color: #1d4ed8; }
                    .btn-primary-dark:disabled { background-color: #1e40af; cursor: not-allowed; opacity: 0.7; }
                    .btn-secondary-dark { background-color: #334155; color: #e2e8f0; font-weight: 500; padding: 0.625rem 1.25rem; border-radius: 0.5rem; border: 1px solid #475569; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease-in-out; }
                    .btn-secondary-dark:hover { background-color: #475569; }
                    .btn-danger-dark { background-color: #be123c; color: white; font-weight: 600; padding: 0.625rem 1.25rem; border-radius: 0.5rem; transition: all 0.2s ease-in-out; }
                    .btn-danger-dark:hover { background-color: #9f1239; }
                `}</style>
            </div>
        </div>
    );
}
