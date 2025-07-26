import { Repeat } from 'lucide-react';
// src/types/index.d.ts

// --- ENUMS ---

/**
 * Roles de usuario en el sistema.
 */
export enum RolUsuario {
    ADMIN = "ADMIN",
    TRABAJADOR = "TRABAJADOR",
}


// --- NUEVOS TIPOS PARA LAS SUSCRIPCIONES ---
export interface CuentaCompletaSuscripcion {
  cuentaId: number;
  correo: string;
  nombreServicio: string;
  urlImgServicio: string;
  fechaInicio: string;
  fechaRenovacion: string;
  status: string;
}

export interface PerfilIndividualSuscripcion {
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

export interface SuscripcionCliente {
  clienteId: number;
  nombreCliente: string;
  numeroCliente: string;
  cuentasCompletas: CuentaCompletaSuscripcion[];
  perfilesIndividuales: PerfilIndividualSuscripcion[];
}
export interface TopCliente {
  clienteId: number;
  nombreCliente: string;
  numeroCliente: string;
  totalCompras: number;
}
/**
 * Estado de una cuenta.
 */
export interface PerfilVencido {
  id: number;
  nombrePerfil: string;
  clienteId: number;
  correoCuenta: string;
  contraseña: string;
  nombreCliente: string;
  fechaInicio: string;
  fechaRenovacion: string;
  precioVenta: number;
  pin: string;
  urlImg: string;
  numero: string;
}

export interface renovarPerfil {
  perfilId: number;
    nuevoPrecio: number;
    usuarioId: number;
}
interface Venta {
  id: number;
  cuentaId: number;
  clienteId: number;
  precioVenta: number;
  fechaVenta: string;
  tipoCliente: string;
  usuarioAsignadorId: number;
  perfilId?: number; // Añadido para que coincida con la respuesta de la API
}

interface VentaResumen {
  fecha: string;
  totalVentas: number;
  ganancia: number;
}

export enum StatusCuenta {
    ACTIVO = "ACTIVO",
    VENCIDO = "VENCIDO",
    REEMPLAZADA = "REEMPLAZADA",
    REPORTADO = "REPORTADO",
    SINUSAR = "SINUSAR",
}
export interface PerfilAsignado {
  id: number;
  nombrePerfil: string;
  clienteId: number | null;
  nombreCliente: string | null;
  fechaInicio: string | null;
  fechaRenovacion: string | null;
  precioVenta: number | null;
}

/**
 * Tipo de cliente.
 */
export enum TipoCliente {
    NORMAL = "NORMAL",
    RESELLER = "RESELLER",
}

/**
 * Tipo de cuenta (ej. individual o completa).
 */
export enum TipoCuenta {
    INDIVIDUAL = "INDIVIDUAL",
    COMPLETO = "COMPLETO",
}


// --- INTERFACES DE CONTROLADORES ---

// Auth Controller
export interface LoginCredentials {
    correo: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

// Usuario Controller
export interface User {
    id: number;
    nombre: string;
    correo: string;
    telefono: string;
    rolUsuario: RolUsuario;
}

export interface RegisterData extends Omit<User, 'id'> {
    password: string;
}

export interface UpdateUserData {
    nombre?: string;
    correo?: string;
    telefono?: string;
    rolUsuario?: RolUsuario;
    password?: string;
}

// Servicio Controller
export interface Servicio {
    id: number;
    nombre: string;
    descripcion: string;
    urlImg: string;
    cuentasTotal: number;
    cuentasRegistradas: number;
}

export type CreateServicioData = Omit<Servicio, 'id'>;
export type UpdateServicioData = Partial<CreateServicioData>;


// Proveedor Controller
export interface Proveedor {
    id: number;
    nombre: string;
    correo: string;
    numero: string;
    linkWhatsapp: string;
    tipoServicio: string;
    tipoCuentaQueProvee: string;
    precioReferencial: number;
}

export type CreateProveedorData = Omit<Proveedor, 'id'>;
export type UpdateProveedorData = Partial<CreateProveedorData>;

// Cliente Controller
export interface Cliente {
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
export type CreateClienteData = Omit<Cliente, 'id'>;
export type UpdateClienteData = Partial<CreateClienteData>;


// Cuenta Controller
export interface Cuenta {
    id: number;
    correo: string;
    contraseña: string;
    pin: string;
    perfilesMaximos: number;
    perfilesOcupados: number;
    enlace: string;
    fechaInicio: string; // ISO Date String "YYYY-MM-DD"
    fechaRenovacion: string; // ISO Date String "YYYY-MM-DD"
    status: StatusCuenta;
    tipoCuenta: TipoCuenta;
    precioVenta: number;
    clienteId: number | null; // Puede ser nulo si no está asignada
    servicioId: number;
}

export type CreateCuentaData = Omit<Cuenta, 'id' | 'clienteId'>; // clienteId no se envía al crear
export type UpdateCuentaData = Partial<Omit<Cuenta, 'id' | 'clienteId' | 'servicioId'>>;

export interface AsignarCuentaData {
    cuentaId: number;
    clienteId: number;
    precioVenta: number;
    usuarioAsignadorId: number;
}

export interface AsignarPerfilesData {
    cuentaId: number;
    clienteId: number;
    perfilesNuevos: string[];
    usuarioAsignadorId: number;
    precioVenta: number;
}

export interface AsignarLoteData {
    clienteId: number;
    servicioId: number;
    cantidad: number;
    precioUnitario: number;
    usuarioAsignadorId: number;
}

export interface CambiarCuentaParams {
    cuentaAnteriorId: number;
    cuentaNuevaId: number;
    motivo: string;
    usuarioId: number;
}

export interface SearchCuentasParams {
    status?: StatusCuenta;
    servicioId?: number;
    clienteId?: number;
}

// ReporteCuenta Controller
export interface ReporteCuenta {
    id: number;
    cuentaId: number;
    usuarioId: number;
    fecha: string; // "YYYY-MM-DD"
    motivo: string;
    detalle: string;
}
export type CreateReporteCuentaData = Omit<ReporteCuenta, 'id'>;


// VentaCuenta Controller
export interface VentaResumen {
    fecha: string; // "YYYY-MM-DD"
    totalVentas: number;
    ganancia: number;
}

export interface Venta {
    id: number;
    cuentaId: number;
    clienteId: number;
    precioVenta: number;
    fechaVenta: string; // ISO Date String
    tipoCliente: TipoCliente;
    usuarioAsignadorId: number;
    perfilId?: number; // Es opcional, viene en la respuesta de asignar
}
interface ReportarPayload {
    usuarioId: number;
    motivo: string;
    detalle: string;
    marcarComoVencida: boolean;
}

interface ReemplazarPayload {
    cuentaNuevaId: number;
    usuarioId: number;
    motivo: string;
}
// HistorialCuenta Controller
export interface HistorialCuenta {
    id: number;
    cuentaAnteriorId: number;
    cuentaNuevaId: number;
    motivo: string;
    fechaCambio: string; // ISO Date String
    usuarioId: number;
}

// Dashboard Controller
export interface DashboardData {
    cuentasActivas: number;
    clientesActivos: number;
    cuentasPorServicio: Record<string, number>;
    serviciosMasVendidos: Record<string, number>;
}