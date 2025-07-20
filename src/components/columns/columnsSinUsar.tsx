import { ColumnDefinition } from '../CuentasTable';

// --- DEFINICIONES DE TIPOS LOCALES (CORREGIDAS) ---
// Se ha copiado la definición completa de la interfaz 'Cuenta' y sus enums
// para asegurar la compatibilidad de tipos con el componente padre.
enum StatusCuenta {
    ACTIVO = "ACTIVO", VENCIDO = "VENCIDO", REEMPLAZADA = "REEMPLAZADA", SINUSAR = "SINUSAR",
}
enum TipoCuenta {
    INDIVIDUAL = "INDIVIDUAL", COMPLETO = "COMPLETO",
}
interface Cuenta {
    id: number;
    correo: string;
    contraseña: string;
    pin: string;
    perfilesMaximos: number;
    perfilesOcupados: number;
    enlace: string;
    fechaInicio: string;
    fechaRenovacion: string;
    status: StatusCuenta;
    tipoCuenta: TipoCuenta;
    precioVenta: number;
    clienteId: number | null;
    servicioId: number;
}

export const getColumnsSinUsar = (onVenderClick: (cuenta: Cuenta) => void): ColumnDefinition<Cuenta>[] => [
    { header: 'ID', accessor: 'id' },
    { header: 'Correo', accessor: 'correo' },
    { header: 'Contraseña', accessor: 'contraseña' },
    { header: 'Perfiles Máx.', accessor: 'perfilesMaximos' },
    {
        header: 'Acciones',
        accessor: (cuenta: Cuenta) => (
            <div className="flex space-x-2">
                <button 
                    onClick={() => onVenderClick(cuenta)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 transition-colors"
                >
                    Vender
                </button>
            </div>
        ),
    },
];
