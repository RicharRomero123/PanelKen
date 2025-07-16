'use client';

import { Inbox, CheckCircle, AlertTriangle } from 'lucide-react';
import { Cuenta, StatusCuenta } from '@/types';

type ActiveTab = 'stock' | 'sold' | 'fallen';

interface CuentasTabsProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    cuentas: Cuenta[];
}

export const CuentasTabs = ({ activeTab, setActiveTab, cuentas }: CuentasTabsProps) => {
    const stockCount = cuentas.filter(c => c.status === StatusCuenta.SINUSAR).length;

    const getTabClass = (tabName: ActiveTab) =>
        `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tabName ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
        }`;

    return (
        <div className="mb-6 border-b border-slate-700 flex">
            <button onClick={() => setActiveTab('stock')} className={getTabClass('stock')}>
                <Inbox size={16} /> Cuentas en Stock
                <span className="bg-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">{stockCount}</span>
            </button>
            <button onClick={() => setActiveTab('sold')} className={getTabClass('sold')}>
                <CheckCircle size={16} /> Cuentas Vendidas
            </button>
            <button onClick={() => setActiveTab('fallen')} className={getTabClass('fallen')}>
                <AlertTriangle size={16} /> Cuentas Caídas
            </button>
        </div>
    );
};
