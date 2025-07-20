"use client";

import { Inbox, CheckCircle, AlertTriangle, Flag, Clock } from 'lucide-react';

// --- DEFINICIONES DE TIPOS LOCALES ---
type ActiveTab = 'stock' | 'sold' | 'fallen' | 'reported' | 'vencido';

interface CuentasTabsProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    setSelectedAccounts: React.Dispatch<React.SetStateAction<number[]>>;
}

export const CuentasTabs = ({ activeTab, setActiveTab, setSelectedAccounts }: CuentasTabsProps) => {
    
    const handleTabClick = (tab: ActiveTab) => {
        setActiveTab(tab);
        setSelectedAccounts([]); // Limpia la selección al cambiar de pestaña
    };

    return (
        <div className="mb-6 border-b border-slate-700 flex">
            <button 
                onClick={() => handleTabClick('stock')} 
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'stock' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                <Inbox size={16} /> En Stock
            </button>
            <button 
                onClick={() => handleTabClick('sold')} 
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sold' ? 'border-green-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                <CheckCircle size={16} /> Vendidas
            </button>
            {/* --- NUEVA PESTAÑA --- */}
            <button 
                onClick={() => handleTabClick('vencido')} 
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'vencido' ? 'border-yellow-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                <Clock size={16} /> Vencidas
            </button>
            <button 
                onClick={() => handleTabClick('reported')} 
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'reported' ? 'border-orange-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                <Flag size={16} /> Reportadas
            </button>
            <button 
                onClick={() => handleTabClick('fallen')} 
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'fallen' ? 'border-red-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                <AlertTriangle size={16} /> Reemplazadas
            </button>
        </div>
    );
};
