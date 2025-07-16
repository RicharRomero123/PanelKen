// src/types/index.d.ts

// --- ENUMS ---

/**
 * Roles de usuario en el sistema.
 */
export enum RolUsuario {
    ADMIN = "ADMIN",
    TRABAJADOR = "TRABAJADOR",
}

/**
 * Estado de una cuenta.
 */
export enum StatusCuenta {
    ACTIVO = "ACTIVO",
    VENCIDO = "VENCIDO",
    REEMPLAZADA = "REEMPLAZADA",
    SINUSAR = "SINUSAR",
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
    user: User; // Asumiendo que la API devuelve el usuario al loguearse
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
    perfiles: string; // Ahora puede ser una lista de perfiles separados por comas
    perfilesMaximos: number | null; // Nuevo campo
    enlace: string | null; // Nuevo campo
    fechaInicio: string | null; // "YYYY-MM-DD" - Puede ser null si está SINUSAR
    fechaRenovacion: string | null; // "YYYY-MM-DD" - Puede ser null si está SINUSAR
    status: StatusCuenta;
    tipoCuenta: TipoCuenta;
    precioVenta: number;
    clienteId: number | null; // Puede no tener cliente asignado
    servicioId: number;
}

export type CreateCuentaData = Omit<Cuenta, 'id'>;
export type UpdateCuentaData = Partial<Omit<Cuenta, 'id' | 'perfiles'>>; // Perfiles se maneja por otro endpoint

export interface AsignarCuentaData {
    cuentaId: number;
    clienteId: number;
    precioVenta: number;
    usuarioAsignadorId: number;
}

// NUEVA INTERFAZ PARA ASIGNAR PERFILES
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
