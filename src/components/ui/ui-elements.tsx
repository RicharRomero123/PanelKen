"use client";

// --- DEFINICIONES DE TIPOS LOCALES ---
// Se añade el nuevo estado REPORTADO
enum StatusCuenta { ACTIVO = "ACTIVO", VENCIDO = "VENCIDO", REEMPLAZADA = "REEMPLAZADA", REPORTADO = "REPORTADO", SINUSAR = "SINUSAR" }

interface TooltipProps {
    text: string;
    children: React.ReactNode;
}
export const Tooltip = ({ text }: { text: string }) => (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 bg-slate-600 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        {text}
    </div>
);

export const getStatusBadge = (status: StatusCuenta) => {
    switch(status) {
        case StatusCuenta.ACTIVO: return 'bg-green-500/20 text-green-300';
        case StatusCuenta.VENCIDO: return 'bg-yellow-500/20 text-yellow-300';
        case StatusCuenta.REEMPLAZADA: return 'bg-red-500/20 text-red-300';
        // --- NUEVO COLOR PARA EL ESTADO REPORTADO ---
        case StatusCuenta.REPORTADO: return 'bg-orange-500/20 text-orange-300';
        case StatusCuenta.SINUSAR: return 'bg-blue-500/20 text-blue-300';
        default: return 'bg-gray-500/20 text-gray-300';
    }
};

export const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" {...props}>
      <path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.8 0-66.7-9.8-95.4-28.1l-6.7-4-69.8 18.3L72 359.2l-4.5-7c-18.9-29.4-29.6-63.3-29.6-98.6 0-109.9 89.5-199.5 199.8-199.5 52.9 0 102.8 20.5 140.1 57.7 37.2 37.2 57.7 87 57.7 140.2 0 109.9-89.6 199.5-199.8 199.5zm88.8-111.9c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.8-16.2-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.4-2.3-5.1-3.7-10.6-6.4z"></path>
    </svg>
);
