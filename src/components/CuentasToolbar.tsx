"use client";

import { Plus, FileText, Search } from 'lucide-react';

// --- DEFINICIONES DE TIPOS LOCALES ---
interface Servicio { id: number; nombre: string; }
interface Filters { searchTerm: string; serviceId: string; }

// --- COMPONENTE DE LA BARRA DE HERRAMIENTAS PRINCIPAL ---
export const CuentasToolbar = ({ onOpenModal }: { onOpenModal: (mode: string) => void }) => {
    return (
        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
            <button onClick={() => onOpenModal('bulk-create')} className="btn-secondary-dark !bg-indigo-600/20 !border-indigo-500/30 !text-indigo-300 hover:!bg-indigo-500/30 justify-center">
                <FileText size={16} />Crear por Lote
            </button>
            <button onClick={() => onOpenModal('add')} className="btn-primary-dark">
                <Plus size={16} />Nueva Cuenta
            </button>
        </div>
    );
};

// --- SUB-COMPONENTE PARA LOS FILTROS ---
// Se adjunta como una propiedad del componente principal
CuentasToolbar.Filters = ({ filters, setFilters, services }: { filters: Filters; setFilters: React.Dispatch<React.SetStateAction<Filters>>; services: Servicio[] }) => {
    return (
        <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    name="searchTerm" 
                    placeholder="Buscar por correo..." 
                    value={filters.searchTerm} 
                    onChange={(e) => setFilters(prev => ({...prev, searchTerm: e.target.value}))} 
                    className="input-style-dark pl-10 pr-4 py-3 w-full" 
                />
            </div>
            <select 
                name="serviceId" 
                value={filters.serviceId} 
                onChange={(e) => setFilters(prev => ({...prev, serviceId: e.target.value}))} 
                className="input-style-dark w-full px-4 py-3"
            >
                <option value="all">Todos los Servicios</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
        </div>
    );
};