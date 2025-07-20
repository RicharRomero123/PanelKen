// FILE: src/app/admin/reportes/components/ReportesTable.tsx (Actualizado)
"use client";

import { Eye, Repeat } from 'lucide-react';

// --- Tipos Locales ---
interface Reporte { id: number; cuentaId: number; usuarioId: number; fecha: string; motivo: string; detalle: string; }
interface Cuenta { id: number; correo: string; tipoCuenta: 'INDIVIDUAL' | 'COMPLETO'; }

interface ReportesTableProps {
    cuentasReportadas: Cuenta[]; // Prop renombrada para mayor claridad
    reportes: Reporte[];
    onOpenModal: (mode: string, data: any) => void;
}

export const ReportesTable = ({ cuentasReportadas, reportes, onOpenModal }: ReportesTableProps) => {
    if (cuentasReportadas.length === 0) {
        return <p className="text-center py-10 text-slate-500">No hay cuentas reportadas de este tipo.</p>;
    }

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <table className="min-w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800">
                    <tr>
                        <th scope="col" className="px-6 py-4">Correo de Cuenta</th>
                        <th scope="col" className="px-6 py-4">Último Reporte</th>
                        <th scope="col" className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="text-slate-200">
                    {cuentasReportadas.map((cuenta) => {
                        // Encuentra el reporte más reciente para esta cuenta
                        const report = reportes.filter(r => r.cuentaId === cuenta.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
                        
                        return (
                            <tr key={cuenta.id} className="border-b border-slate-700 hover:bg-slate-800 transition-colors">
                                <td className="px-6 py-4 font-medium">{cuenta.correo}</td>
                                <td className="px-6 py-4">{report ? report.motivo : <span className="text-slate-500">Sin reporte asociado</span>}</td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center items-center gap-2">
                                        <button onClick={() => report && onOpenModal('verDetalle', report)} disabled={!report} className="p-2 text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed">
                                            <Eye size={16} />
                                        </button>
                                        <button onClick={() => onOpenModal('reemplazar', cuenta)} className="p-2 text-blue-400 hover:text-blue-300">
                                            <Repeat size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
