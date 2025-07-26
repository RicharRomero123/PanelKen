"use client";

import { Inbox, CheckCircle, AlertTriangle, Flag, Clock } from 'lucide-react';

// --- DEFINICIONES DE TIPOS LOCALES ---
type ActiveTab = 'stock' | 'sold' | 'fallen' | 'reported' | 'vencido';

interface CuentasTabsProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    setSelectedAccounts: React.Dispatch<React.SetStateAction<number[]>>;
    // AÑADE ESTA LÍNEA
    counts: {
        stock: number;
        sold: number;
        fallen: number;
        reported: number;
        vencido: number;
    };
}

export const CuentasTabs = ({ activeTab, setActiveTab, setSelectedAccounts, counts }: CuentasTabsProps) => { // Añade 'counts' aquí
    
    const handleTabClick = (tab: ActiveTab) => {
        setActiveTab(tab);
        setSelectedAccounts([]);
    };

    return (
        <div className="mb-6 border-b border-slate-700 flex flex-wrap"> {/* Se añade flex-wrap para responsividad */}
            <button 
                onClick={() => handleTabClick('stock')} 
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'stock' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                <Inbox size={16} /> En Stock
                {/* Muestra el conteo */}
                <span className="ml-2 bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{counts.stock}</span>
            </button>
            <button 
                onClick={() => handleTabClick('sold')} 
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sold' ? 'border-green-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                <CheckCircle size={16} /> Vendidas
                {/* Muestra el conteo */}
                <span className="ml-2 bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{counts.sold}</span>
            </button>
            <button 
                onClick={() => handleTabClick('vencido')} 
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'vencido' ? 'border-yellow-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                <Clock size={16} /> Vencidas
                {/* Muestra el conteo */}
                <span className="ml-2 bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{counts.vencido}</span>
            </button>
            <button 
                onClick={() => handleTabClick('reported')} 
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'reported' ? 'border-orange-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                <Flag size={16} /> Reportadas
                {/* Muestra el conteo */}
                <span className="ml-2 bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{counts.reported}</span>
            </button>
            <button 
                onClick={() => handleTabClick('fallen')} 
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'fallen' ? 'border-red-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                <AlertTriangle size={16} /> Reemplazadas
                {/* Muestra el conteo */}
                <span className="ml-2 bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{counts.fallen}</span>
            </button>
        </div>
    );
};