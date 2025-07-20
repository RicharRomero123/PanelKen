// FILE: src/app/admin/cuentas/components/modals/AccountDetailModal.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, X, Link as LinkIcon, RefreshCw, UserX, Users, Calendar, DollarSign, BarChart2, AlertCircle, Clock } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { WhatsAppIcon } from '../ui/ui-elements';
import { getPerfilesByCuentaId, liberarPerfil } from '../../services/cuentaService';

// --- DEFINICIONES DE TIPOS LOCALES ---
enum TipoCuenta { INDIVIDUAL = "INDIVIDUAL", COMPLETO = "COMPLETO" }
enum TipoCliente { NORMAL = "NORMAL", RESELLER = "RESELLER" }
interface Cuenta { 
  id: number; 
  correo: string; 
  contraseña: string; 
  pin: string; 
  enlace: string; 
  fechaInicio: string; 
  fechaRenovacion: string; 
  tipoCuenta: TipoCuenta; 
  clienteId: number | null; 
  perfilesOcupados: number;
  perfilesMaximos: number;
  precioVenta: number;
}
interface Cliente { 
  id: number; 
  nombre: string; 
  apellido: string; 
  numero: string; 
  linkWhatsapp?: string; 
  tipoCliente: TipoCliente; 
}
interface Servicio { 
  id: number; 
  nombre: string; 
  urlImg?: string; 
}

interface PerfilAsignado {
    id: number;
    nombrePerfil: string;
    clienteId: number | null;
    nombreCliente: string | null;
    fechaInicio: string | null;
    fechaRenovacion: string | null;
    precioVenta: number | null;
}

interface AccountDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: Cuenta | null;
    clients: Cliente[];
    service: Servicio | undefined;
    onProfileLiberated?: () => void;
}

export const AccountDetailModal = ({ 
  isOpen, 
  onClose, 
  account, 
  clients, 
  service,
  onProfileLiberated
}: AccountDetailModalProps) => {
    const [profiles, setProfiles] = useState<PerfilAsignado[]>([]);
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    const [isFreeingProfile, setIsFreeingProfile] = useState<number | null>(null);

    // Cargar perfiles cuando el modal se abre
    useEffect(() => {
        if (isOpen && account && account.tipoCuenta === TipoCuenta.INDIVIDUAL) {
            loadProfiles();
        }
    }, [isOpen, account]);

    const loadProfiles = async () => {
        setLoadingProfiles(true);
        try {
            const perfiles = await getPerfilesByCuentaId(account!.id);
            setProfiles(perfiles);
        } catch (err) {
            console.error("Error al cargar perfiles:", err);
            toast.error("Error al cargar los perfiles");
        } finally {
            setLoadingProfiles(false);
        }
    };

    const mainClient = useMemo(() => {
        return account?.tipoCuenta === TipoCuenta.COMPLETO 
            ? clients.find(c => c.id === account.clienteId)
            : null;
    }, [account, clients]);

    // Función para calcular días restantes con estado
    const calcularDiasRestantes = (fechaRenovacion: string | null): { dias: number | string, estado: 'vencido' | 'por-vencer' | 'activo' } => {
      if (!fechaRenovacion) return { dias: 'N/A', estado: 'activo' };
      try {
        const fechaRenov = new Date(fechaRenovacion.replace(/-/g, ' '));
        const hoy = new Date();
        const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const fechaRenovMidnight = new Date(fechaRenov.getFullYear(), fechaRenov.getMonth(), fechaRenov.getDate());
        
        const diffTime = fechaRenovMidnight.getTime() - hoyMidnight.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) {
          return { dias: 0, estado: 'vencido' };
        } else if (diffDays <= 7) {
          return { dias: diffDays, estado: 'por-vencer' };
        } else {
          return { dias: diffDays, estado: 'activo' };
        }
      } catch (e) {
        return { dias: 'N/A', estado: 'activo' };
      }
    };

    // Calcular estadísticas para la cuenta
    const stats = useMemo(() => {
      if (!account) return null;
      //puede ser null o undefined
      let totalIngresos = 0 ; //puede s
      let diasRestantesPromedio = 0 ;
      let perfilesConFechaValida = 0;
      let perfilesVencidos = 0 ;
      let perfilesPorVencer = 0;
      
      if (account.tipoCuenta === TipoCuenta.INDIVIDUAL) {
        profiles.forEach(profile => {
          if (profile.precioVenta) totalIngresos += profile.precioVenta;
          
          if (profile.fechaRenovacion) {
            const { dias, estado } = calcularDiasRestantes(profile.fechaRenovacion);
            if (typeof dias === 'number') {
              diasRestantesPromedio += dias;
              perfilesConFechaValida++;
              
              if (estado === 'vencido') perfilesVencidos++;
              else if (estado === 'por-vencer') perfilesPorVencer++;
            }
          }
        });
        
        if (perfilesConFechaValida > 0) {
          diasRestantesPromedio = Math.round(diasRestantesPromedio / perfilesConFechaValida);
        }
      } else {
        if (account.precioVenta) totalIngresos = account.precioVenta;
        if (account.fechaRenovacion) {
          const { dias } = calcularDiasRestantes(account.fechaRenovacion);
          if (typeof dias === 'number') diasRestantesPromedio = dias;
        }
      }
      
      return {
        totalIngresos,
        diasRestantesPromedio,
        perfilesRestantes: account.perfilesMaximos - account.perfilesOcupados,
        perfilesVendidos: account.perfilesOcupados,
        perfilesMaximos: account.perfilesMaximos,
        perfilesVencidos,
        perfilesPorVencer
      };
    }, [account, profiles]);

    const generateWhatsAppLink = (client: Cliente, message: string) => {
        const encodedMessage = encodeURIComponent(message);
        const baseLink = client.linkWhatsapp || (client.numero ? `https://wa.me/51${client.numero}` : '');
        if (!baseLink) return '#';
        const separator = baseLink.includes('?') ? '&' : '?';
        return `${baseLink}${separator}text=${encodedMessage}`;
    };

    // Función para liberar un perfil
    const handleLiberarPerfil = async (perfilId: number) => {
        if (!account) return;
        
        setIsFreeingProfile(perfilId);
        const loadingToast = toast.loading("Liberando perfil...");
        
        try {
            await liberarPerfil(perfilId);
            
            // Actualizar lista de perfiles
            setProfiles(prev => prev.filter(p => p.id !== perfilId));
            
            // Actualizar cuenta en el contenedor principal
            if (onProfileLiberated) onProfileLiberated();
            
            toast.dismiss(loadingToast);
            toast.success("Perfil liberado correctamente");
        } catch (error) {
            console.error("Error al liberar perfil:", error);
            toast.dismiss(loadingToast);
            toast.error("Error al liberar el perfil");
        } finally {
            setIsFreeingProfile(null);
        }
    };

    // Función para formatear fechas
    const formatDateForMessage = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString.replace(/-/g, ' '));
        return date.toLocaleDateString('es-PE', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            timeZone: 'America/Lima'
        });
    };

    const getAccountDetailsMessage = (profileName?: string) => {
        if (!account) return '';
        
        const activationDate = formatDateForMessage(account.fechaInicio);
        const expirationDate = formatDateForMessage(account.fechaRenovacion);
        const { dias: diasRestantes } = calcularDiasRestantes(account.fechaRenovacion);
        
        const messageLines = [
            `🎉 ¡Hola!`, "",
            `Aquí tienes los detalles de tu ${profileName ? `perfil *${profileName}*` : 'cuenta completa'} para el servicio de *${service?.nombre}*:`, "",
            `📧 *Correo:* \`${account.correo}\``,
            `🔑 *Contraseña:* \`${account.contraseña}\``,
            `📍 *PIN:* ${account.pin || 'No aplica'}`,
            `📅 *Fecha de Activación:* ${activationDate}`,
            `📅 *Fecha de Finalización:* ${expirationDate}`,
            `⏳ *Días restantes:* ${diasRestantes} días`,
            "",
        ];
        
        if (account.enlace) messageLines.push(`🔗 *Enlace:* ${account.enlace}`);
        messageLines.push("", "¡Que disfrutes del servicio! ✨");
        return messageLines.join('\n');
    };

    const getProfileDetailsMessage = (profile: PerfilAsignado) => {
        if (!account) return '';
        
        const activationDate = formatDateForMessage(profile.fechaInicio);
        const expirationDate = formatDateForMessage(profile.fechaRenovacion);
        const { dias: diasRestantes } = calcularDiasRestantes(profile.fechaRenovacion);
        
        const messageLines = [
            `🎉 ¡Hola!`, "",
            `Aquí tienes los detalles de tu perfil *${profile.nombrePerfil}* para el servicio de *${service?.nombre}*:`, "",
            `📧 *Correo:* \`${account.correo}\``,
            `🔑 *Contraseña:* \`${account.contraseña}\``,
            `📍 *PIN:* ${account.pin || 'No aplica'}`,
            `📅 *Fecha de Activación:* ${activationDate}`,
            `📅 *Fecha de Finalización:* ${expirationDate}`,
            `⏳ *Días restantes:* ${diasRestantes} días`,
            "",
        ];
        
        if (account.enlace) messageLines.push(`🔗 *Enlace:* ${account.enlace}`);
        messageLines.push("", "¡Que disfrutes del servicio! ✨");
        return messageLines.join('\n');
    };

    const displayDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString.replace(/-/g, ' '));
        return date.toLocaleDateString('es-PE', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            timeZone: 'America/Lima'
        });
    };

    if (!isOpen || !account) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.9 }} 
                    className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-6xl mx-4"
                >
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Eye className="text-blue-400" />Detalles de Venta
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
                        {/* Header con información de la cuenta */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Columna 1: Información de servicio y cuenta */}
                            <div className="lg:col-span-2 bg-slate-800/50 p-5 rounded-xl">
                                <div className="flex items-start gap-4">
                                    {service?.urlImg && (
                                        <div className="bg-slate-700 p-2 rounded-lg">
                                            <Image 
                                                src={service.urlImg} 
                                                alt={service.nombre} 
                                                width={80} 
                                                height={80} 
                                                className="rounded-lg object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold">{service?.nombre}</h3>
                                        <p className="font-mono text-lg text-blue-300 mt-1">{account.correo}</p>
                                        <div className="flex flex-wrap gap-3 mt-3">
                                            <div className="bg-slate-700/50 px-3 py-1.5 rounded-md text-sm">
                                                <span className="text-slate-400">Tipo: </span>
                                                <span className="font-medium">
                                                    {account.tipoCuenta === TipoCuenta.COMPLETO ? 'Cuenta Completa' : 'Perfil Individual'}
                                                </span>
                                            </div>
                                            <div className="bg-slate-700/50 px-3 py-1.5 rounded-md text-sm">
                                                <span className="text-slate-400">Activación: </span>
                                                <span className="font-medium">{displayDate(account.fechaInicio)}</span>
                                            </div>
                                            <div className="bg-slate-700/50 px-3 py-1.5 rounded-md text-sm">
                                                <span className="text-slate-400">Renovación: </span>
                                                <span className="font-medium">{displayDate(account.fechaRenovacion)}</span>
                                            </div>
                                            {account.tipoCuenta === TipoCuenta.INDIVIDUAL && (
                                              <div className="bg-slate-700/50 px-3 py-1.5 rounded-md text-sm">
                                                <span className="text-slate-400">Perfiles: </span>
                                                <span className="font-medium">
                                                  {account.perfilesOcupados} / {account.perfilesMaximos}
                                                </span>
                                              </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Columna 2: Acciones y cliente principal */}
                            <div className="bg-slate-800/50 p-5 rounded-xl">
                                {mainClient ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-500/20 p-2 rounded-full">
                                                <Users className="text-indigo-300" size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-lg">{mainClient.nombre} {mainClient.apellido}</h4>
                                                <p className="text-sm text-slate-300">{mainClient.numero}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-3">
                                            <a 
                                                href={generateWhatsAppLink(mainClient, getAccountDetailsMessage())} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="btn-primary-dark !bg-green-600 hover:!bg-green-700 !py-2 !px-4 flex-1 flex items-center justify-center gap-2"
                                            >
                                                <WhatsAppIcon className="w-4 h-4" /> 
                                                Enviar Datos
                                            </a>
                                            <a 
                                                href={`https://wa.me/51${mainClient.numero}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="btn-secondary-dark !py-2 !px-4 flex-1 flex items-center justify-center gap-2"
                                            >
                                                <LinkIcon size={16} /> 
                                                Contactar
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-slate-400">
                                        No hay cliente asignado
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Estadísticas de la cuenta */}
                        {stats && (
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-blue-600/30 to-blue-800/50 p-4 rounded-xl border border-blue-500/30">
                              <div className="flex items-center gap-3">
                                <DollarSign className="text-blue-300" size={20} />
                                <div>
                                  <p className="text-slate-400 text-sm">Ingresos totales</p>
                                  <p className="text-xl font-bold">S/ {stats.totalIngresos.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-amber-600/30 to-amber-800/50 p-4 rounded-xl border border-amber-500/30">
                              <div className="flex items-center gap-3">
                                <Calendar className="text-amber-300" size={20} />
                                <div>
                                  <p className="text-slate-400 text-sm">Días promedio</p>
                                  <p className="text-xl font-bold">
                                    {typeof stats.diasRestantesPromedio === 'number' 
                                      ? `${stats.diasRestantesPromedio} días` 
                                      : 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {account.tipoCuenta === TipoCuenta.INDIVIDUAL && (
                              <>
                                <div className="bg-gradient-to-br from-emerald-600/30 to-emerald-800/50 p-4 rounded-xl border border-emerald-500/30">
                                  <div className="flex items-center gap-3">
                                    <Users className="text-emerald-300" size={20} />
                                    <div>
                                      <p className="text-slate-400 text-sm">Perfiles restantes</p>
                                      <p className="text-xl font-bold">{stats.perfilesRestantes}</p>
                                      <p className="text-xs text-emerald-300 mt-1">
                                        Meta: Vender {stats.perfilesRestantes} de {stats.perfilesMaximos}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-purple-600/30 to-purple-800/50 p-4 rounded-xl border border-purple-500/30">
                                  <div className="flex items-center gap-3">
                                    <BarChart2 className="text-purple-300" size={20} />
                                    <div>
                                      <p className="text-slate-400 text-sm">Perfiles vendidos</p>
                                      <p className="text-xl font-bold">{stats.perfilesVendidos}</p>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        
                        {/* Sección de alertas */}
                       {(stats && (stats.perfilesVencidos > 0 || stats.perfilesPorVencer > 0)) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {stats.perfilesVencidos > 0 && (
                              <div className="bg-gradient-to-br from-red-600/30 to-red-800/50 p-4 rounded-xl border border-red-500/30">
                                <div className="flex items-center gap-3">
                                  <AlertCircle className="text-red-300" size={20} />
                                  <div>
                                    <p className="text-slate-400 text-sm">Perfiles vencidos</p>
                                    <p className="text-xl font-bold">{stats.perfilesVencidos}</p>
                                    <p className="text-xs text-red-300 mt-1">
                                      ¡Necesitan renovación inmediata!
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                             {stats.perfilesPorVencer > 0 && (
                              <div className="bg-gradient-to-br from-orange-600/30 to-orange-800/50 p-4 rounded-xl border border-orange-500/30">
                                <div className="flex items-center gap-3">
                                  <Clock className="text-orange-300" size={20} />
                                  <div>
                                    <p className="text-slate-400 text-sm">Perfiles por vencer</p>
                                    <p className="text-xl font-bold">{stats.perfilesPorVencer}</p>
                                    <p className="text-xs text-orange-300 mt-1">
                                      Renovación pendiente en menos de 7 días
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Sección de perfiles asignados */}
                        <div className="mt-6 pt-4 border-t border-slate-700">
                            <h3 className="text-lg font-semibold mb-4">
                                {account.tipoCuenta === TipoCuenta.COMPLETO 
                                    ? "Cliente Asignado" 
                                    : "Perfiles Asignados"}
                            </h3>
                            
                            {account.tipoCuenta === TipoCuenta.INDIVIDUAL && (
                                <div>
                                    {loadingProfiles ? (
                                        <div className="flex justify-center items-center h-24">
                                            <RefreshCw className="animate-spin text-blue-400" />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {profiles.length > 0 ? (
                                                profiles.map((profile) => {
                                                    const client = clients.find(c => c.id === profile.clienteId);
                                                    const { dias: diasRestantes, estado } = calcularDiasRestantes(profile.fechaRenovacion);
                                                    
                                                    // Determinar clases según estado
                                                    let estadoClases = "";
                                                    let estadoTexto = "";
                                                    if (estado === 'vencido') {
                                                        estadoClases = "bg-red-500/20 text-red-400 border-red-500/30";
                                                        estadoTexto = "VENCIDO - Necesita renovación";
                                                    } else if (estado === 'por-vencer') {
                                                        estadoClases = "bg-amber-500/20 text-amber-400 border-amber-500/30";
                                                        estadoTexto = "Por vencer";
                                                    } else {
                                                        estadoClases = "bg-green-500/20 text-green-400 border-green-500/30";
                                                        estadoTexto = "Activo";
                                                    }
                                                    
                                                    return (
                                                        <div key={profile.id} className="bg-slate-800/50 p-4 rounded-xl relative group hover:bg-slate-700/50 transition-colors">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                      <div className="bg-indigo-500/20 p-1.5 rounded-full">
                                                                        <Users className="text-indigo-300 w-4 h-4" />
                                                                      </div>
                                                                      <h4 className="font-semibold">{profile.nombrePerfil}</h4>
                                                                    </div>
                                                                    <div className={`mt-2 px-2 py-1 rounded text-xs font-medium inline-block ${estadoClases}`}>
                                                                        {estadoTexto}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    {client && (
                                                                        <a 
                                                                            href={generateWhatsAppLink(client, getProfileDetailsMessage(profile))} 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer" 
                                                                            className="p-2 text-green-400 hover:bg-green-500/20 rounded-md"
                                                                            title="Enviar datos por WhatsApp"
                                                                        >
                                                                            <WhatsAppIcon className="w-5 h-5" />
                                                                        </a>
                                                                    )}
                                                                    
                                                                    <button
                                                                        onClick={() => handleLiberarPerfil(profile.id)}
                                                                        disabled={isFreeingProfile === profile.id}
                                                                        className="p-2 text-amber-500 hover:bg-amber-500/20 rounded-md disabled:opacity-50"
                                                                        title="Liberar perfil"
                                                                    >
                                                                        {isFreeingProfile === profile.id ? (
                                                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                                                        ) : (
                                                                            <UserX className="w-5 h-5" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            
                                                            {client && (
                                                                <div className="mb-3">
                                                                    <p className="text-sm font-medium">{client.nombre} {client.apellido}</p>
                                                                    <p className="text-xs text-slate-400">{client.numero}</p>
                                                                </div>
                                                            )}
                                                            
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between items-center bg-slate-700/50 p-2 rounded">
                                                                    <span className="text-slate-400">Inicio:</span>
                                                                    <span className="font-medium">{displayDate(profile.fechaInicio)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center bg-slate-700/50 p-2 rounded">
                                                                    <span className="text-slate-400">Renovación:</span>
                                                                    <span className="font-medium">{displayDate(profile.fechaRenovacion)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center bg-slate-700/50 p-2 rounded">
                                                                    <span className="text-slate-400">Días restantes:</span>
                                                                    <span className={`font-medium ${
                                                                        estado === 'vencido' ? 'text-red-400' : 
                                                                        estado === 'por-vencer' ? 'text-amber-400' : 
                                                                        'text-green-400'
                                                                    }`}>
                                                                        {diasRestantes} días
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center bg-slate-700/50 p-2 rounded">
                                                                    <span className="text-slate-400">Precio:</span>
                                                                    <span className="font-medium text-green-400">S/ {profile.precioVenta?.toFixed(2) || '0.00'}</span>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Overlay de carga */}
                                                            {isFreeingProfile === profile.id && (
                                                                <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center rounded-xl">
                                                                    <p className="text-sm text-center px-4">
                                                                        Liberando perfil...
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="col-span-full text-center py-6">
                                                    <p className="text-slate-400">No hay perfiles asignados todavía</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-700">
                            <button type="button" onClick={onClose} className="btn-secondary-dark">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};