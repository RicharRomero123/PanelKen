'use client';

import React, { useEffect, useState, useCallback, FormEvent, useMemo, useRef } from 'react';
import { 
    getAllClientes, 
    createCliente, 
    updateCliente, 
    deleteCliente,
    getClienteSuscripciones
} from '../../../services/clienteService';
import { getAllUsers } from '../../../services/userService'; 
import { searchCuentas } from '../../../services/cuentaService'; 
import { getAllServicios } from '../../../services/servicioService';
import { 
    Plus, Edit, Trash2, X, Search, RefreshCw, AlertTriangle, CheckCircle, 
    User as UserIcon, Mail, Phone, Link as LinkIcon, Users, FileText, Eye, 
    ChevronLeft, ChevronRight, Settings, Info, Tv, Calendar, Tag, 
    ShoppingBag, Download, Send,
    ClipboardIcon,
    PhoneCall
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FcCellPhone } from 'react-icons/fc';
import { MdEmail } from 'react-icons/md';

// --- DEFINICIONES DE TIPOS ---

interface CuentaCompletaSuscripcion {
  cuentaId: number;
  correo: string;
  nombreServicio: string;
  urlImgServicio: string;
  fechaInicio: string;
  fechaRenovacion: string;
  status: string;
}

interface PerfilIndividualSuscripcion {
  id: number;
  nombrePerfil: string;
  clienteId: number;
  correoCuenta: string;
  nombreCliente: string;
  urlImg: string;
  numero: string;
  contraseña: string;
  pin: string;
  fechaInicio: string;
  fechaRenovacion: string;
  precioVenta: number;
}

interface SuscripcionCliente {
  clienteId: number;
  nombreCliente: string;
  numeroCliente: string;
  cuentasCompletas: CuentaCompletaSuscripcion[];
  perfilesIndividuales: PerfilIndividualSuscripcion[];
}

enum TipoCliente {
    NORMAL = "NORMAL",
    RESELLER = "RESELLER",
}

interface Cliente {
    id: number;
    nombre: string;
    apellido: string;
    numero: string;
    correo: string;
    idDiscord: string;
    linkWhatsapp: string;
    localidad: string;
    estadoEmocional: string;
    responsable: string;
    tipoCliente: TipoCliente;
}

interface User {
    id: number;
    nombre: string;
    telefono: string; 
}

interface Cuenta {
    id: number;
    correo: string;
    contraseña: string;
    pin: string;
    fechaRenovacion: string | null;
    clienteId: number | null;
    servicioId: number;
}

interface Servicio {
    id: number;
    nombre: string;
    urlImg?: string;
}


// --- COMPONENTES DE LA PÁGINA ---

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" {...props}><path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.8 0-66.7-9.8-95.4-28.1l-6.7-4-69.8 18.3L72 359.2l-4.5-7c-18.9-29.4-29.6-63.3-29.6-98.6 0-109.9 89.5-199.5 199.8-199.5 52.9 0 102.8 20.5 140.1 57.7 37.2 37.2 57.7 87 57.7 140.2 0 109.9-89.6 199.5-199.8 199.5zm88.8-111.9c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.8-16.2-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.4-2.3-5.1-3.7-10.6-6.4z"></path></svg>
);

const SuscripcionModal = ({ isOpen, onClose, suscripciones }: {
  isOpen: boolean;
  onClose: () => void;
  suscripciones: SuscripcionCliente | null;
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !suscripciones) return null;

  const handleDownloadPDF = () => {
    const receiptElement = receiptRef.current;
    if (!receiptElement) return;

    toast.loading('Generando PDF...', { id: 'pdf-toast' });

    html2canvas(receiptElement, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`estado_cuenta_${suscripciones.nombreCliente.replace(' ', '_')}.pdf`);
      toast.success('PDF descargado exitosamente.', { id: 'pdf-toast' });
    });
  };

  const handleSendWhatsApp = () => {
    let message = `🧾 *ESTADO DE CUENTA - SISTEMASVIP.SHOP* 🧾\n\n`;
    message += `*Cliente:* ${suscripciones.nombreCliente}\n`;
    message += `*Fecha:* ${new Date().toLocaleDateString('es-ES')}\n`;
    message += `--------------------------------------\n\n`;

    if (suscripciones.cuentasCompletas.length > 0) {
      message += `*CUENTAS COMPLETAS ACTIVAS*\n`;
      suscripciones.cuentasCompletas.forEach(c => {
        message += `✅ *Servicio:* ${c.nombreServicio}\n`;
        message += `   \`Correo: ${c.correo}\`\n`;
        message += `   *Vence:* ${new Date(c.fechaRenovacion).toLocaleDateString('es-ES')}\n\n`;
      });
    }

    if (suscripciones.perfilesIndividuales.length > 0) {
      message += `*PERFILES INDIVIDUALES ACTIVOS*\n`;
      suscripciones.perfilesIndividuales.forEach(p => {
        message += `👤 *Perfil:* ${p.nombrePerfil} (${p.correoCuenta})\n`;
        message += `   *Vence:* ${new Date(p.fechaRenovacion).toLocaleDateString('es-ES')}\n\n`;
      });
    }
    
    message += `--------------------------------------\n`;
    message += `Gracias por su preferencia.`;

    const encodedMessage = encodeURIComponent(message);
    const phone = suscripciones.numeroCliente.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank', 'noopener,noreferrer');
  };

  const DetailRow = ({ label, value }: { label: string, value: string | React.ReactNode }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-200">
        <p className="text-sm text-slate-600">{label}</p>
        <p className="text-sm font-semibold text-slate-800 text-right">{value}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3"><ShoppingBag className="text-blue-400"/>Detalle de Compras</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-shrink-0">
            <button onClick={handleDownloadPDF} className="btn-secondary-dark w-full sm:w-auto !bg-red-500/20 !border-red-500/30 !text-red-300 hover:!bg-red-500/30"><Download size={16}/> Descargar PDF</button>
            <button onClick={handleSendWhatsApp} className="btn-secondary-dark w-full sm:w-auto !bg-green-500/20 !border-green-500/30 !text-green-300 hover:!bg-green-500/30"><Send size={16}/> Enviar por WhatsApp</button>
        </div>
        <div className="overflow-y-auto pr-2">
            <div ref={receiptRef} className="bg-white text-black p-8 rounded-lg font-sans">
                <header className="flex justify-between items-center pb-4 border-b-2 border-slate-200">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">SISTEMASVIP.SHOP</h1>
                        <p className="text-slate-500">Estado de Cuenta</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">{suscripciones.nombreCliente}</p>
                        <p className="text-sm text-slate-600">{suscripciones.numeroCliente}</p>
                        <p className="text-sm text-slate-600">Fecha: {new Date().toLocaleDateString('es-ES')}</p>
                    </div>
                </header>
                <main className="mt-6">
                    {suscripciones.cuentasCompletas.length > 0 && (
                        <section className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-300 pb-2 mb-3">Cuentas Completas</h3>
                            {suscripciones.cuentasCompletas.map(c => (
                                <div key={c.cuentaId} className="mb-4 p-4 bg-slate-50 rounded-md border border-slate-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Image src={c.urlImgServicio} alt={c.nombreServicio} width={32} height={32} className="rounded-md"/>
                                        <p className="font-bold text-lg">{c.nombreServicio}</p>
                                    </div>
                                    <DetailRow label="Correo" value={<code className="text-sm bg-slate-200 px-1 rounded">{c.correo}</code>} />
                                    <DetailRow label="Fecha de Inicio" value={new Date(c.fechaInicio).toLocaleDateString('es-ES')} />
                                    <DetailRow label="Próxima Renovación" value={<strong className="text-blue-600">{new Date(c.fechaRenovacion).toLocaleDateString('es-ES')}</strong>} />
                                </div>
                            ))}
                        </section>
                    )}
                    {suscripciones.perfilesIndividuales.length > 0 && (
                        <section>
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-300 pb-2 mb-3">Perfiles Individuales</h3>
                            {suscripciones.perfilesIndividuales.map(p => (
                                <div key={p.id} className="mb-4 p-4 bg-slate-50 rounded-md border border-slate-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Image src={p.urlImg} alt="Servicio" width={32} height={32} className="rounded-md"/>
                                        <p className="font-bold text-lg">Perfil: {p.nombrePerfil}</p>
                                    </div>
                                    <DetailRow label="Cuenta Asociada" value={<code className="text-sm bg-slate-200 px-1 rounded">{p.correoCuenta}</code>} />
                                    <DetailRow label="Precio" value={`S/. ${p.precioVenta.toFixed(2)}`} />
                                    <DetailRow label="Fecha de Inicio" value={new Date(p.fechaInicio).toLocaleDateString('es-ES')} />
                                    <DetailRow label="Próxima Renovación" value={<strong className="text-blue-600">{new Date(p.fechaRenovacion).toLocaleDateString('es-ES')}</strong>} />
                                </div>
                            ))}
                        </section>
                    )}
                </main>
                <footer className="mt-8 pt-4 border-t-2 border-slate-200 text-center text-xs text-slate-500">
                    <p>Gracias por su preferencia.</p>
                    <p>SISTEMASVIP.SHOP - Todos los derechos reservados.</p>
                </footer>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

const ClientFormModal = ({ isOpen, onClose, mode, client, users, onSaveSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    client: Cliente | null;
    users: User[];
    onSaveSuccess: (message: string) => void;
}) => {
    const initialFormData = useMemo(() => ({
        nombre: client?.nombre || '',
        apellido: client?.apellido || '',
        numero: client?.numero || '',
        correo: client?.correo || '',
        idDiscord: client?.idDiscord || '',
        linkWhatsapp: client?.linkWhatsapp || '',
        localidad: client?.localidad || '',
        estadoEmocional: client?.estadoEmocional || '',
        responsable: client?.responsable || '',
        tipoCliente: client?.tipoCliente || TipoCliente.NORMAL,
    }), [client]);

    const [formData, setFormData] = useState(initialFormData);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        if (isOpen) setFormData(initialFormData);
    }, [isOpen, initialFormData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerateWhatsAppLink = () => {
        if (formData.numero && /^\d{7,}$/.test(formData.numero.replace(/\D/g, ''))) {
            const phone = formData.numero.replace(/\D/g, '');
            const countryCode = phone.startsWith('51') ? '' : '51';
            setFormData(prev => ({ ...prev, linkWhatsapp: `https://wa.me/${countryCode}${phone}` }));
            toast.success("Link de WhatsApp generado.");
        } else {
            toast.error("Por favor, introduce un número de teléfono válido.");
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        const loadingToast = toast.loading(mode === 'add' ? 'Creando cliente...' : 'Actualizando cliente...');
        try {
            if (mode === 'add') {
                await createCliente(formData);
            } else if (mode === 'edit' && client) {
                await updateCliente(client.id, formData);
            }
            toast.dismiss(loadingToast);
            onSaveSuccess(mode === 'add' ? 'Cliente creado exitosamente' : 'Cliente actualizado exitosamente');
            onClose();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || `Error al ${mode === 'add' ? 'crear' : 'actualizar'} el cliente.`);
        } finally {
            setFormLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Users className="text-blue-400" />{mode === 'add' ? 'Crear Nuevo Cliente' : 'Editar Cliente'}</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 max-h-[80vh] overflow-y-auto p-1">
                        <div><label className="label-style">Nombre</label><input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className="input-style-dark p-3" required /></div>
                        <div><label className="label-style">Apellido</label><input type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} className="input-style-dark p-3" /></div>
                        <div><label className="label-style">Correo</label><input type="email" name="correo" value={formData.correo} onChange={handleInputChange} className="input-style-dark p-3" /></div>
                        <div><label className="label-style">Número de Teléfono</label><div className="flex gap-2"><input type="tel" name="numero" value={formData.numero} onChange={handleInputChange} className="input-style-dark p-3 flex-grow" /><button type="button" onClick={handleGenerateWhatsAppLink} className="btn-secondary-dark !ml-0 px-3" title="Generar Link de WhatsApp"><LinkIcon size={18}/></button></div></div>
                        <div><label className="label-style">Link de WhatsApp</label><input type="text" name="linkWhatsapp" value={formData.linkWhatsapp} onChange={handleInputChange} className="input-style-dark p-3" /></div>
                        <div><label className="label-style">ID de Discord</label><input type="text" name="idDiscord" value={formData.idDiscord} onChange={handleInputChange} className="input-style-dark p-3" /></div>
                        <div><label className="label-style">Localidad</label><input type="text" name="localidad" value={formData.localidad} onChange={handleInputChange} className="input-style-dark p-3" /></div>
                        <div><label className="label-style">Estado Emocional</label><input type="text" name="estadoEmocional" value={formData.estadoEmocional} onChange={handleInputChange} className="input-style-dark p-3" /></div>
                        <div><label className="label-style">Responsable</label><select name="responsable" value={formData.responsable} onChange={handleInputChange} className="input-style-dark p-3"><option value="">Sin asignar</option>{users.map(user => <option key={user.id} value={user.nombre}>{user.nombre}</option>)}</select></div>
                        <div><label className="label-style">Tipo de Cliente</label><select name="tipoCliente" value={formData.tipoCliente} onChange={handleInputChange} className="input-style-dark p-3"><option value={TipoCliente.NORMAL}>Normal</option><option value={TipoCliente.RESELLER}>Reseller</option></select></div>
                        <div className="lg:col-span-3 mt-4 flex justify-end gap-4 pt-4 border-t border-slate-700">
                            <button type="button" onClick={onClose} className="btn-secondary-dark">Cancelar</button>
                            <button type="submit" disabled={formLoading} className="btn-primary-dark">{formLoading ? <RefreshCw className="animate-spin" /> : (mode === 'add' ? <Plus/> : <CheckCircle/>)}{formLoading ? 'Guardando...' : 'Guardar'}</button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const BulkCreateClientsModal = ({ isOpen, onClose, onSaveSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: (message: string) => void;
}) => {
    const [namesData, setNamesData] = useState('');
    const [phonesData, setPhonesData] = useState('');
    const [tipoCliente, setTipoCliente] = useState(TipoCliente.NORMAL);
    const [responsable, setResponsable] = useState('No');
    const [formLoading, setFormLoading] = useState(false);
    const [validationError, setValidationError] = useState('');

    const namesLineCount = useMemo(() => namesData.split('\n').filter(line => line.trim() !== '').length, [namesData]);
    const phonesLineCount = useMemo(() => phonesData.split('\n').filter(line => line.trim() !== '').length, [phonesData]);

    const generateWhatsAppLink = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length > 0) {
            return `https://wa.me/${cleaned}`;
        }
        return '';
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setValidationError('');

        const namesLines = namesData.split('\n').map(name => name.trim()).filter(name => name !== '');
        const phonesLines = phonesData.split('\n').map(phone => phone.trim()).filter(phone => phone !== '');

        if (namesLines.length === 0 || phonesLines.length === 0) {
            setValidationError("Ambos campos deben tener al menos una línea de datos.");
            return;
        }

        if (namesLines.length !== phonesLines.length) {
            setValidationError(`¡Error en el número de líneas!\nNombres: ${namesLines.length} líneas\nTeléfonos: ${phonesLines.length} líneas\nDeben tener la misma cantidad.`);
            return;
        }

        const phoneErrors: string[] = [];
        phonesLines.forEach((phone, index) => {
            if (!/^\d+$/.test(phone.replace(/\D/g, ''))) {
                phoneErrors.push(`Línea ${index + 1}: Número inválido "${phone}" - debe contener solo dígitos.`);
            }
        });

        if (phoneErrors.length > 0) {
            setValidationError(phoneErrors.join('\n'));
            return;
        }

        setFormLoading(true);
        const loadingToast = toast.loading(`Creando ${namesLines.length} cliente(s)...`);
        
        try {
            const creationPromises = namesLines.map((nameLine, index) => {
                const nameParts = nameLine.trim().split(/\s+/);
                const nombre = nameParts[0];
                const apellido = nameParts.slice(1).join(' ') || '';
                const phone = phonesLines[index];
                
                return createCliente({
                    nombre, apellido, numero: phone, correo: '',
                    linkWhatsapp: generateWhatsAppLink(phone), idDiscord: '',
                    localidad: '', estadoEmocional: '', responsable, tipoCliente,
                });
            });

            await Promise.all(creationPromises);
            toast.dismiss(loadingToast);
            onSaveSuccess(`${namesLines.length} cliente(s) creado(s) exitosamente.`);
            onClose();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || "Error al crear los clientes en lote.");
        } finally {
            setFormLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-5xl mx-4">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3"><FileText className="text-blue-400" /> Crear Clientes por Lote</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="label-style !text-lg font-semibold">Nombres Completos</label>
                                            <span className={`text-sm font-medium px-2 py-1 rounded ${namesLineCount === phonesLineCount ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{namesLineCount} nombres</span>
                                        </div>
                                        <p className="text-slate-400 text-sm mb-3">Un nombre completo por línea (nombre y apellido)</p>
                                        <textarea name="names" rows={10} value={namesData} onChange={(e) => setNamesData(e.target.value)} className="input-style-dark p-3 w-full font-mono text-base" placeholder="Juan Perez&#10;Maria Gomez&#10;Carlos Rodriguez" />
                                    </div>
                                    <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="label-style !text-lg font-semibold">Nro. Teléfono</label>
                                            <span className={`text-sm font-medium px-2 py-1 rounded ${phonesLineCount === namesLineCount ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{phonesLineCount} teléfonos</span>
                                        </div>
                                        <p className="text-slate-400 text-sm mb-3">Un número por línea (solo dígitos)</p>
                                        <textarea name="phones" rows={10} value={phonesData} onChange={(e) => setPhonesData(e.target.value)} className="input-style-dark p-3 w-full font-mono text-base" placeholder="987654321&#10;912345678&#10;998877665" />
                                    </div>
                                </div>
                                {validationError && (
                                    <div className="mt-4 p-3 bg-red-500/20 text-red-300 text-sm rounded-md whitespace-pre-line border border-red-500/30">
                                        <div className="flex gap-2 items-start"><AlertTriangle className="flex-shrink-0 mt-0.5" /><div>{validationError}</div></div>
                                    </div>
                                )}
                            </div>
                            <div className="lg:w-80 space-y-6">
                                <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Settings className="text-blue-400" size={18} /> Opciones Adicionales</h3>
                                    <div className="space-y-4">
                                        <div><label className="label-style">Tipo de Cliente</label><select value={tipoCliente} onChange={(e) => setTipoCliente(e.target.value as TipoCliente)} className="input-style-dark p-3 w-full"><option value={TipoCliente.NORMAL}>Normal</option><option value={TipoCliente.RESELLER}>Reseller</option></select></div>
                                        <div><label className="label-style">¿Son Responsables?</label><select value={responsable} onChange={(e) => setResponsable(e.target.value)} className="input-style-dark p-3 w-full"><option value="No">No</option><option value="Sí">Sí</option></select></div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button type="button" onClick={onClose} className="btn-secondary-dark w-full">Cancelar</button>
                                    <button type="submit" disabled={formLoading || namesLineCount !== phonesLineCount || namesLineCount === 0} className="btn-primary-dark w-full" >{formLoading ? <RefreshCw className="animate-spin" /> : <Plus />}{formLoading ? 'Creando...' : `Crear ${namesLineCount > 0 ? namesLineCount : ''} Clientes`}</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const ClientHistoryModal = ({ isOpen, onClose, client, accounts, services }: {
    isOpen: boolean;
    onClose: () => void;
    client: Cliente | null;
    accounts: Cuenta[];
    services: Servicio[];
}) => {
    if (!isOpen || !client) return null;

    const clientAccounts = accounts.filter(acc => acc.clienteId === client.id);

    const handleSendSummary = () => {
        if (!client.linkWhatsapp && !client.numero) {
            toast.error("Este cliente no tiene un link de WhatsApp o número registrado.");
            return;
        }

        let message: string;
        if (clientAccounts.length > 0) {
            const accountsDetails = clientAccounts.map(acc => {
                const service = services.find(s => s.id === acc.servicioId);
                return `\n\n*Servicio:* ${service?.nombre || 'N/A'}\n*Correo:* \`${acc.correo}\`\n*Contraseña:* \`${acc.contraseña}\`\n*Vence:* ${new Date(acc.fechaRenovacion || '').toLocaleDateString('es-ES')}`;
            }).join('');
            message = `👋 Hola *${client.nombre}*, aquí tienes un resumen de tus cuentas activas:${accountsDetails}`;
        } else {
            message = `👋 Hola ${client.nombre}, ¿cómo estás? Te escribo de parte de SISTEMASVIP.SHOP para saludarte. No hemos encontrado cuentas activas a tu nombre.`;
        }
        
        const encodedMessage = encodeURIComponent(message);
        const finalLink = client.linkWhatsapp || `https://wa.me/${client.numero}`;
        window.open(`${finalLink}?text=${encodedMessage}`, '_blank', 'noopener,noreferrer');
        toast.success("Abriendo WhatsApp para enviar resumen...");
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-lg mx-4">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Eye className="text-blue-400" />Historial de Compras</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                    <div className="space-y-4">
                        <p className="font-semibold text-lg text-center">{client.nombre} {client.apellido}</p>
                        <div className="space-y-3 max-h-80 overflow-y-auto p-1">
                            {clientAccounts.length > 0 ? clientAccounts.map(acc => {
                                const service = services.find(s => s.id === acc.servicioId);
                                return (
                                    <div key={acc.id} className="bg-slate-700/50 p-4 rounded-lg">
                                        <div className="flex items-center gap-3 mb-3">
                                            {service && <Image src={service.urlImg || 'https://placehold.co/40x40/1e293b/94a3b8?text=S'} alt={service.nombre} width={28} height={28} className="rounded-md object-cover" />}
                                            <h4 className="font-bold text-white">{service?.nombre || 'Servicio Desconocido'}</h4>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <p><strong className="text-slate-400">Correo:</strong> {acc.correo}</p>
                                            <p><strong className="text-slate-400">Contraseña:</strong> {acc.contraseña}</p>
                                            <p><strong className="text-slate-400">Vence:</strong> {new Date(acc.fechaRenovacion || '').toLocaleDateString('es-ES')}</p>
                                        </div>
                                    </div>
                                )
                            }) : <p className="text-slate-400 text-sm text-center py-4">Este cliente no tiene cuentas activas.</p>}
                        </div>
                        <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-700">
                            <button type="button" onClick={onClose} className="btn-secondary-dark">Cerrar</button>
                            <button onClick={handleSendSummary} disabled={!client.numero && !client.linkWhatsapp} className="btn-primary-dark !bg-green-600 hover:!bg-green-700 disabled:!bg-slate-600">
                                <WhatsAppIcon className="w-4 h-4" /> Enviar Resumen
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};


export default function ClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [users, setUsers] = useState<User[]>([]); 
    const [cuentas, setCuentas] = useState<Cuenta[]>([]); 
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | 'bulk-create' | 'history' | null>(null);
    const [currentClient, setCurrentClient] = useState<Cliente | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const [suscripciones, setSuscripciones] = useState<SuscripcionCliente | null>(null);
    const [isSuscripcionModalOpen, setIsSuscripcionModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [clientsData, usersData, accountsData, servicesData] = await Promise.all([
                getAllClientes(),
                getAllUsers(),
                searchCuentas({}),
                getAllServicios()
            ]);
            setClientes(clientsData);
            setUsers(usersData);
            setCuentas(accountsData);
            setServicios(servicesData);
        } catch (err) {
            toast.error('No se pudieron cargar los datos iniciales.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredClientes = useMemo(() => {
        return clientes.filter(client =>
            (client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
             (client.correo && client.correo.toLowerCase().includes(searchTerm.toLowerCase())) ||
             (client.numero && client.numero.includes(searchTerm))) &&
            (typeFilter === 'all' || client.tipoCliente === typeFilter)
        );
    }, [clientes, searchTerm, typeFilter]);

    const paginatedClientes = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredClientes.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredClientes, currentPage]);

    const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);

    const handleOpenModal = (mode: 'add' | 'edit' | 'delete' | 'bulk-create' | 'history', client: Cliente | null = null) => {
        setModalMode(mode);
        setCurrentClient(client);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalMode(null);
        setCurrentClient(null);
    };
    
    const handleOpenSuscripcionesModal = async (cliente: Cliente) => {
        const loadingToast = toast.loading("Cargando suscripciones...");
        try {
            const data = await getClienteSuscripciones(cliente.id);
            setSuscripciones(data);
            setIsSuscripcionModalOpen(true);
            toast.dismiss(loadingToast);
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error("Error al cargar las suscripciones del cliente.");
        }
    };

    const handleCloseSuscripcionesModal = () => {
        setIsSuscripcionModalOpen(false);
        setSuscripciones(null);
    };

    const handleSaveSuccess = (message: string) => {
        toast.success(message);
        fetchData(); 
        handleCloseModal();
    };






const SuscripcionModal = ({ isOpen, onClose, suscripciones }: {
  isOpen: boolean;
  onClose: () => void;
  suscripciones: SuscripcionCliente | null;
}) => {
  const handleSendWhatsApp = (data: CuentaCompletaSuscripcion | PerfilIndividualSuscripcion) => {
    // Verificación robusta de número de teléfono
    if (!suscripciones?.numeroCliente || suscripciones.numeroCliente.trim() === '') {
      toast.error('Este cliente no tiene un número de teléfono válido registrado.');
      return;
    }

    // Limpiar y formatear el número
    let phone = suscripciones.numeroCliente.replace(/\D/g, '');
    
    // Verificar si ya tiene código de país
    if (!phone.startsWith('51') && phone.length === 9) {
      phone = `51${phone}`; // Agregar código de país para Perú
    }
    
    // Validar longitud del número
    if (phone.length < 10 || phone.length > 15) {
      toast.error(`Número inválido: ${phone} (longitud: ${phone.length} dígitos)`);
      return;
    }

    // Construir mensaje
    let message = `👋 Hola *${suscripciones.nombreCliente}*, aquí tienes los detalles de tu compra:\n\n`;

    if ('nombreServicio' in data) {
      message += `*Servicio:* ${data.nombreServicio}\n`;
      message += `*Correo:* \`${data.correo}\`\n`;
      message += `*Contraseña:* \`${(data as any).contraseña || 'No disponible'}\`\n`;
      message += `*Vence:* ${new Date(data.fechaRenovacion).toLocaleDateString('es-ES')}\n`;
    } else {
      message += `*Servicio:* Perfil Individual\n`;
      message += `*Perfil:* ${data.nombrePerfil}\n`;
      message += `*Cuenta:* \`${data.correoCuenta}\`\n`;
      message += `*Contraseña:* \`${data.contraseña}\`\n`;
      message += `*PIN:* \`${data.pin}\`\n`;
      message += `*Vence:* ${new Date(data.fechaRenovacion).toLocaleDateString('es-ES')}\n`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success('Mensaje copiado al portapapeles');
};

<button onClick={() => copyToClipboard(message)} 
        className="btn-secondary-dark mt-2">
  <ClipboardIcon /> Copiar mensaje
</button>
    // SOLUCIÓN PRINCIPAL: Abrir en la misma pestaña
    window.location.href = whatsappUrl;
    
   
  };

  if (!isOpen || !suscripciones) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.9 }} 
        className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700 flex-shrink-0">

          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <ShoppingBag className="text-blue-400"/>Compras de {suscripciones.nombreCliente}
            </h2>
            <p className="text-slate-400 flex items-center gap-2">
             <PhoneCall className="text-blue-400"/> Teléfono: {suscripciones.numeroCliente || 'No registrado'}
            </p>
            
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 space-y-6">
          {/* Sección de cuentas completas */}
          <div>
            <h3 className="text-xl font-semibold text-blue-300 mb-3 flex items-center gap-2">
              <Tv size={20}/> Cuentas Completas
            </h3>
            {suscripciones.cuentasCompletas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suscripciones.cuentasCompletas.map(cuenta => (
                  <div key={cuenta.cuentaId} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        <Image 
                          src={cuenta.urlImgServicio} 
                          alt={cuenta.nombreServicio} 
                          width={40} 
                          height={40} 
                          className="rounded-md" 
                        />
                        <div>
                          <p className="font-bold text-lg text-white">{cuenta.nombreServicio}</p>
                          <div className="flex items-center gap-2">
                          <MdEmail className="text-blue-400 flex items-center"/> <p className="flex text-sm text-slate-300 font-mono">{cuenta.correo}</p>
                       </div>
                        </div>
                      </div>
                      <div className="text-sm space-y-2">
                        <p className="flex justify-between">
                          <span>Inicio:</span> 
                          <span>{new Date(cuenta.fechaInicio).toLocaleDateString('es-ES')}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Vence:</span> 
                          <strong className="text-yellow-300">
                            {new Date(cuenta.fechaRenovacion).toLocaleDateString('es-ES')}
                          </strong>
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSendWhatsApp(cuenta)} 
                      className="btn-secondary-dark w-full mt-4 !bg-green-500/10 hover:!bg-green-500/20 !text-green-300"
                    >
                      <WhatsAppIcon className="w-4 h-4" /> Enviar Datos
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic text-sm">No tiene cuentas completas activas.</p>
            )}
          </div>

          {/* Sección de perfiles individuales */}
          <div>
            <h3 className="text-xl font-semibold text-purple-300 mb-3 flex items-center gap-2">
              <UserIcon size={20}/> Perfiles Individuales
            </h3>
            {suscripciones.perfilesIndividuales.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suscripciones.perfilesIndividuales.map(perfil => (
                  <div key={perfil.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        <Image 
                          src={perfil.urlImg} 
                          alt="Servicio" 
                          width={40} 
                          height={40} 
                          className="rounded-md" 
                        />
                        <div>
                          <p className="font-bold text-lg text-white">Perfil: {perfil.nombrePerfil}</p>
                          <p className="text-sm text-slate-300 font-mono">{perfil.correoCuenta}</p>
                        </div>
                      </div>
                      <div className="text-sm space-y-2">
                        <p className="flex justify-between">
                          <span>Precio:</span> 
                          <span>S/. {perfil.precioVenta.toFixed(2)}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Inicio:</span> 
                          <span>{new Date(perfil.fechaInicio).toLocaleDateString('es-ES')}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Vence:</span> 
                          <strong className="text-yellow-300">
                            {new Date(perfil.fechaRenovacion).toLocaleDateString('es-ES')}
                          </strong>
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSendWhatsApp(perfil)} 
                      className="btn-secondary-dark w-full mt-4 !bg-green-500/10 hover:!bg-green-500/20 !text-green-300"
                    >
                      <WhatsAppIcon className="w-4 h-4" /> Enviar Datos
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic text-sm">No tiene perfiles individuales activos.</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};











    const handleResponsibleWhatsAppClick = (client: Cliente, responsibleUser: User | undefined) => {
        if (!responsibleUser || !responsibleUser.telefono) {
            toast.error("El responsable no tiene un número de teléfono registrado.");
            return;
        }
        const message = `Hola ${responsibleUser.nombre}, te escribo para consultarte sobre tu cliente asignado: *${client.nombre} ${client.apellido}* (Contacto: ${client.numero || client.correo}).`;
        const encodedMessage = encodeURIComponent(message);
        const phone = responsibleUser.telefono.startsWith('51') ? responsibleUser.telefono : `51${responsibleUser.telefono}`;
        const finalLink = `https://wa.me/${phone}?text=${encodedMessage}`;
        window.open(finalLink, '_blank', 'noopener,noreferrer');
        toast.success("Abriendo WhatsApp para contactar al responsable...");
    };

    const handleDelete = async () => {
        if (!currentClient) return;
        const loadingToast = toast.loading("Eliminando cliente...");
        try {
            await deleteCliente(currentClient.id);
            toast.dismiss(loadingToast);
            handleSaveSuccess("Cliente eliminado correctamente.");
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || "Error al eliminar el cliente.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">
            <Toaster position="top-right" toastOptions={{ className: 'bg-slate-700 text-white shadow-lg', success: { iconTheme: { primary: '#10b981', secondary: 'white' } }, error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } } }} />
            
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold flex items-center gap-3"><Users />Gestión de Clientes</h1>
                            {!loading && <span className="bg-blue-500/20 text-blue-300 text-sm font-semibold px-3 py-1 rounded-full">{filteredClientes.length} clientes</span>}
                        </div>
                        <p className="mt-2 text-slate-400">Administra la información y el estado de tus clientes.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
                         <button onClick={() => handleOpenModal('bulk-create')} className="btn-secondary-dark !bg-indigo-600/20 !border-indigo-500/30 !text-indigo-300 hover:!bg-indigo-500/30 justify-center">
                            <FileText size={16} />Crear por Lote
                        </button>
                        <button onClick={() => handleOpenModal('add')} className="btn-primary-dark">
                            <Plus />Nuevo Cliente
                        </button>
                    </div>
                </div>

                <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Buscar por nombre, correo o teléfono..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-style-dark pl-10 pr-4 py-3 w-full" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-style-dark w-full sm:w-48 px-4 py-3">
                            <option value="all">Todos los Tipos</option>
                            <option value={TipoCliente.NORMAL}>Normal</option>
                            <option value={TipoCliente.RESELLER}>Reseller</option>
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
                                            <th scope="col" className="px-6 py-4 w-12 text-center">#</th>
                                            <th scope="col" className="px-6 py-4">Cliente</th>
                                            <th scope="col" className="px-6 py-4">Correo</th>
                                            <th scope="col" className="px-6 py-4">Teléfono</th>
                                            <th scope="col" className="px-6 py-4">Responsable</th>
                                            <th scope="col" className="px-6 py-4">Tipo</th>
                                            <th scope="col" className="px-6 py-4 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-200">
                                        {paginatedClientes.map((client, index) => {
                                            const responsibleUser = users.find(u => u.nombre === client.responsable);
                                            return (
                                                <tr key={client.id} className="border-b border-slate-700 hover:bg-slate-800 transition-colors">
                                                    <td className="px-6 py-4 text-center text-slate-400">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                    <td className="px-6 py-4 font-medium">{client.nombre} {client.apellido}</td>
                                                    <td className="px-6 py-4">{client.correo || 'N/A'}</td>
                                                    <td className="px-6 py-4">{client.numero || 'N/A'}</td>
                                                    <td className="px-6 py-4 flex items-center gap-2">
                                                        {client.responsable || 'N/A'}
                                                        {responsibleUser && <button onClick={() => handleResponsibleWhatsAppClick(client, responsibleUser)} className="text-green-400 hover:text-green-300"><WhatsAppIcon className="w-4 h-4" /></button>}
                                                    </td>
                                                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${client.tipoCliente === 'RESELLER' ? 'bg-purple-500/20 text-purple-300' : 'bg-sky-500/20 text-sky-300'}`}>{client.tipoCliente}</span></td>
                                                    <td className="px-6 py-4 flex justify-center items-center gap-2">
                                                        <button onClick={() => handleOpenSuscripcionesModal(client)} className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-md" title="Ver Compras"><ShoppingBag size={16} /></button>
                                                        <button onClick={() => handleOpenModal('edit', client)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md" title="Editar"><Edit size={16} /></button>
                                                        <button onClick={() => handleOpenModal('delete', client)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md" title="Eliminar"><Trash2 size={16} /></button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:hidden">
                            <AnimatePresence>
                            {paginatedClientes.map((client, index) => {
                                const responsibleUser = users.find(u => u.nombre === client.responsable);
                                return (
                                <motion.div key={client.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg p-4 space-y-4 flex flex-col">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-lg text-white">{client.nombre} {client.apellido}</p>
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${client.tipoCliente === 'RESELLER' ? 'bg-purple-500/20 text-purple-300' : 'bg-sky-500/20 text-sky-300'}`}>{client.tipoCliente}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-bold text-slate-500">#{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                            <button onClick={() => handleOpenModal('edit', client)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"><Edit size={16} /></button>
                                            <button onClick={() => handleOpenModal('delete', client)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-700 pt-3 space-y-2 text-sm flex-grow">
                                        <p className="flex items-center gap-2 text-slate-300"><Mail size={14} /> {client.correo || 'N/A'}</p>
                                        <p className="flex items-center gap-2 text-slate-300"><Phone size={14} /> {client.numero || 'N/A'}</p>
                                        <p className="flex items-center gap-2 text-slate-300"><UserIcon size={14} /> Resp: {client.responsable || 'N/A'} {responsibleUser && <button onClick={() => handleResponsibleWhatsAppClick(client, responsibleUser)} className="text-green-400 hover:text-green-300"><WhatsAppIcon className="w-4 h-4" /></button>}</p>
                                    </div>
                                    <div className="pt-3 border-t border-slate-700">
                                         <button onClick={() => handleOpenSuscripcionesModal(client)} className="w-full btn-primary-dark justify-center"><ShoppingBag size={16} /> Ver Compras</button>
                                    </div>
                                </motion.div>
                                )})}
                            </AnimatePresence>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
                                <span className="text-sm text-slate-400">Página {currentPage} de {totalPages}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-slate-700 rounded-md disabled:opacity-50"><ChevronLeft size={16}/></button>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-slate-700 rounded-md disabled:opacity-50"><ChevronRight size={16}/></button>
                                </div>
                            </div>
                        )}
                    </>
                )}
                {!loading && filteredClientes.length === 0 && <p className="text-center py-10 text-slate-500">No se encontraron clientes.</p>}

                <SuscripcionModal isOpen={isSuscripcionModalOpen} onClose={handleCloseSuscripcionesModal} suscripciones={suscripciones} />

                {isModalOpen && (modalMode === 'add' || modalMode === 'edit') && (
                    <ClientFormModal isOpen={isModalOpen} onClose={handleCloseModal} mode={modalMode} client={currentClient} users={users} onSaveSuccess={handleSaveSuccess} />
                )}
                {isModalOpen && modalMode === 'bulk-create' && (
                    <BulkCreateClientsModal isOpen={isModalOpen} onClose={handleCloseModal} onSaveSuccess={handleSaveSuccess} />
                )}
               
                <AnimatePresence>
                {isModalOpen && modalMode === 'delete' && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3"><AlertTriangle className="text-red-400"/>Confirmar Eliminación</h2>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <p className="text-slate-300">¿Estás seguro de que quieres eliminar al cliente <strong className="text-white">{currentClient?.nombre} {currentClient?.apellido}</strong>? Esta acción es irreversible.</p>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button onClick={handleCloseModal} className="btn-secondary-dark">Cancelar</button>
                                    <button onClick={handleDelete} className="btn-danger-dark">Sí, eliminar</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                </AnimatePresence>
            </div>
            <style jsx global>{`
                .label-style { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #cbd5e1; }
                .input-style-dark { background-color: rgb(30 41 59 / 0.5); border: 1px solid #334155; color: #e2e8f0; font-size: 0.875rem; border-radius: 0.5rem; display: block; width: 100%; transition: all 0.2s ease-in-out; }
                .input-style-dark:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4); }
                .btn-primary-dark { background-color: #2563eb; color: white; font-weight: 600; padding: 0.625rem 1.25rem; border-radius: 0.5rem; text-align: center; transition: all 0.2s ease-in-out; display: flex; align-items: center; gap: 0.5rem; justify-content: center; }
                .btn-primary-dark:hover { background-color: #1d4ed8; }
                .btn-primary-dark:disabled { background-color: #1e40af; cursor: not-allowed; opacity: 0.7; }
                .btn-secondary-dark { background-color: #334155; color: #e2e8f0; font-weight: 500; padding: 0.625rem 1.25rem; border-radius: 0.5rem; border: 1px solid #475569; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease-in-out; justify-content: center; }
                .btn-secondary-dark:hover { background-color: #475569; }
                .btn-danger-dark { background-color: #be123c; color: white; font-weight: 600; padding: 0.625rem 1.25rem; border-radius: 0.5rem; transition: all 0.2s ease-in-out; }
                .btn-danger-dark:hover { background-color: #9f1239; }
            `}</style>
        </div>
    )
}