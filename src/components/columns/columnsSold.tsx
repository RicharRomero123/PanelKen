"use client";

import Image from 'next/image';
import { Eye, Repeat } from 'lucide-react';
import { Tooltip, getStatusBadge, WhatsAppIcon } from '../ui/ui-elements';

// --- DEFINICIONES DE TIPOS LOCALES ---
// Se definen localmente para que el componente sea autosuficiente.
enum StatusCuenta { ACTIVO = "ACTIVO", VENCIDO = "VENCIDO", REEMPLAZADA = "REEMPLAZADA", SINUSAR = "SINUSAR" }
enum TipoCuenta { INDIVIDUAL = "INDIVIDUAL", COMPLETO = "COMPLETO" }
enum TipoCliente { NORMAL = "NORMAL", RESELLER = "RESELLER" }
interface Cuenta { id: number; correo: string; contraseña: string; perfilesOcupados: number; perfilesMaximos: number; status: StatusCuenta; tipoCuenta: TipoCuenta; clienteId: number | null; servicioId: number; fechaRenovacion: string; }
interface Cliente { id: number; nombre: string; apellido: string; numero: string; linkWhatsapp?: string; tipoCliente: TipoCliente; }
interface Servicio { id: number; nombre: string; urlImg?: string; }

// La función ahora recibe la lista de clientes para poder buscar en ella.
export const getColumnsSold = (
    onOpenModal: (mode: string, account: Cuenta) => void,
    clientes: Cliente[],
    servicios: Servicio[],
    getProfileCount: (account: Cuenta) => number,
    displayDate: (date: string | null) => string
) => [
    {
        header: 'Cuenta',
        accessor: (account: Cuenta) => {
            const service = servicios.find(s => s.id === account.servicioId);
            return (
                <div className="flex items-center gap-3">
                    {service && <Image src={service.urlImg || 'https://placehold.co/40x40/1e293b/94a3b8?text=S'} alt={service.nombre} width={24} height={24} className="rounded-full object-cover" />}
                    <div>
                        <div className="font-medium text-white">{account.correo}</div>
                        <div className="text-slate-400 text-xs font-mono">Pass: {account.contraseña || 'N/A'}</div>
                    </div>
                </div>
            );
        }
    },
    {
        header: 'Estado',
        accessor: (account: Cuenta) => <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(account.status)}`}>{account.status}</span>
    },
    {
        header: 'Perfiles',
        accessor: (account: Cuenta) => {
            if (account.tipoCuenta !== TipoCuenta.INDIVIDUAL) return <span className="text-slate-400">N/A</span>;
            const profileCount = getProfileCount(account);
            return (
                <div className="text-xs w-28">
                    <p>{profileCount} de {account.perfilesMaximos} usados</p>
                    <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(profileCount / (account.perfilesMaximos || 1)) * 100}%` }}></div>
                    </div>
                </div>
            );
        }
    },
    {
        header: 'Cliente(s) y Acciones',
        accessor: (account: Cuenta) => {
            // Para cuentas completas, encontramos al cliente principal.
            const mainClient = account.tipoCuenta === TipoCuenta.COMPLETO 
                ? clientes.find(c => c.id === account.clienteId) 
                : null;

            return (
                <div className="flex items-center justify-end gap-4">
                    {/* Sección de Información del Cliente */}
                    <div className="text-left text-xs">
                        {mainClient ? (
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{mainClient.nombre} {mainClient.apellido}</span>
                                <a href={`https://wa.me/51${mainClient.numero}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 transition-colors">
                                    <WhatsAppIcon className="w-4 h-4" />
                                </a>
                            </div>
                        ) : (
                            // Para cuentas individuales, mostramos un texto genérico.
                            // La lista detallada se verá en el modal de detalles.
                            <span className="text-slate-400">Múltiples perfiles</span>
                        )}
                    </div>

                    {/* Sección de Botones de Acción */}
                    <div className="flex items-center gap-1.5">
                        <div className="relative group">
                            <button onClick={() => onOpenModal('detail', account)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md">
                                <Eye size={16} />
                            </button>
                            <Tooltip text="Ver Detalles de Venta" />
                        </div>
                        {account.status === StatusCuenta.REEMPLAZADA && (
                            <div className="relative group">
                                <button onClick={() => onOpenModal('change', account)} className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md">
                                    <Repeat size={16} />
                                </button>
                                <Tooltip text="Cambiar Cuenta (Garantía)" />
                            </div>
                        )}
                    </div>
                </div>
            );
        }
    }
];
