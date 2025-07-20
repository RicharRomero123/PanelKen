'use client';

import { getAllClientes } from '@/services/clienteService';
import { asignarCuenta } from '@/services/cuentaService';
import { useState, useEffect, FormEvent } from 'react';
// Se importan los servicios necesarios


// --- DEFINICIONES DE TIPOS LOCALES ---
interface Cuenta {
    id: number;
    correo: string;
    // ... y el resto de las propiedades de Cuenta
}

interface Cliente {
    id: number;
    nombre: string;
    apellido: string;
    // ... y el resto de las propiedades de Cliente
}

interface VenderCuentaModalProps {
    isOpen: boolean;
    onClose: () => void;
    cuenta: Cuenta;
    onSuccess: () => void;
}

export const VenderCuentaModal: React.FC<VenderCuentaModalProps> = ({ isOpen, onClose, cuenta, onSuccess }) => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [selectedClienteId, setSelectedClienteId] = useState<string>('');
    const [precioVenta, setPrecioVenta] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const usuarioAsignadorId = 1; // Reemplazar con la lógica real

    useEffect(() => {
        if (isOpen) {
            getAllClientes().then(setClientes).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedClienteId || !precioVenta) return;
        
        setIsSubmitting(true);
        try {
            await asignarCuenta({
                cuentaId: cuenta.id,
                clienteId: Number(selectedClienteId),
                precioVenta: Number(precioVenta),
                usuarioAsignadorId: usuarioAsignadorId,
            });
            onSuccess();
        } catch (error) {
            console.error("Error al asignar la cuenta:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Vender Cuenta #{cuenta.id}</h2>
                <form onSubmit={handleSubmit}>
                    {/* El JSX del formulario sigue igual */}
                    <div className="mb-4">
                        <label htmlFor="cliente">Asignar a Cliente</label>
                        <select
                            id="cliente"
                            value={selectedClienteId}
                            onChange={(e) => setSelectedClienteId(e.target.value)}
                            className="w-full mt-1 p-2 border rounded"
                        >
                            <option value="" disabled>Selecciona un cliente</option>
                            {clientes.map(cliente => (
                                <option key={cliente.id} value={cliente.id}>
                                    {cliente.nombre} {cliente.apellido}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-6">
                        <label htmlFor="precio">Precio de Venta</label>
                        <input
                            type="number"
                            id="precio"
                            value={precioVenta}
                            onChange={(e) => setPrecioVenta(e.target.value)}
                            className="w-full mt-1 p-2 border rounded"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose}>Cancelar</button>
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Asignando...' : 'Asignar Cuenta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};