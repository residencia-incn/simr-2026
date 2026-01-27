import React, { useEffect, useState } from 'react';
import { X, Building2, Wallet, Banknote } from 'lucide-react';
import { api } from '../../../services/api';
import { Modal, Button, FormField } from '../../ui';
import { showError, showSuccess } from '../../../utils/alerts';

const AccountModal = ({ isOpen, onClose, accountToEdit = null, onSaveSuccess }) => {
    const [institutions, setInstitutions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estado del formulario
    const [formData, setFormData] = useState({
        institution_id: '',
        alias: '',
        holder_name: '',
        account_number: '',
        cci: '',
        currency: 'PEN',
        description: '',
        is_active: true
    });

    // Cargar lista de bancos/billeteras al abrir
    useEffect(() => {
        if (isOpen) {
            loadInstitutions();
            if (accountToEdit) {
                setFormData({
                    institution_id: accountToEdit.institution_id?.toString() || '',
                    alias: accountToEdit.alias || '',
                    holder_name: accountToEdit.holder_name || '',
                    account_number: accountToEdit.account_number || '',
                    cci: accountToEdit.cci || '',
                    currency: accountToEdit.currency || 'PEN',
                    description: accountToEdit.description || '',
                    is_active: accountToEdit.is_active ?? true
                });
            } else {
                resetForm();
            }
        } else {
            // Cleanup state when closed to avoid data leakage between edits
            resetForm();
        }
    }, [isOpen, accountToEdit]);

    const loadInstitutions = async () => {
        try {
            setIsLoading(true);
            const data = await api.treasuryConfig.getInstitutions();
            setInstitutions(data);
        } catch (error) {
            console.error("Error cargando instituciones", error);
            showError("No se pudieron cargar los bancos disponibles");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            institution_id: '', alias: '', holder_name: '', account_number: '', cci: '', currency: 'PEN', description: '', is_active: true
        });
    };

    // Detectar tipo de institución seleccionada (Banco o Billetera)
    const selectedInstitution = institutions.find(i => i.id === parseInt(formData.institution_id));
    const isWallet = selectedInstitution?.type === 'wallet';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Si es billetera, el CCI debe ir nulo aunque el input tenga texto
            const payload = { ...formData, cci: isWallet ? null : (formData.cci || null) };

            if (accountToEdit) {
                await api.treasuryConfig.updateAccount(accountToEdit.id, payload);
                showSuccess("Cuenta actualizada correctamente");
            } else {
                await api.treasuryConfig.createAccount(payload);
                showSuccess("Cuenta creada exitosamente");
            }
            if (onSaveSuccess) onSaveSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            showError("Error al guardar la cuenta");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    {isWallet ? <Wallet className="text-blue-500" size={24} /> : <Building2 className="text-emerald-500" size={24} />}
                    <span>{accountToEdit ? 'Editar Cuenta' : 'Nueva Cuenta de Tesorería'}</span>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 1. SELECCIÓN DE INSTITUCIÓN Y MONEDA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Banco o Billetera</label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.institution_id}
                            onChange={e => setFormData({ ...formData, institution_id: e.target.value })}
                            required
                            disabled={isLoading}
                        >
                            <option value="">Seleccione...</option>
                            <optgroup label="Bancos">
                                {institutions.filter(i => i.type === 'bank').map(i => (
                                    <option key={i.id} value={i.id}>🏦 {i.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Billeteras">
                                {institutions.filter(i => i.type === 'wallet').map(i => (
                                    <option key={i.id} value={i.id}>📱 {i.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                        <div className="flex gap-2">
                            <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${formData.currency === 'PEN' ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200'}`}>
                                <input type="radio" name="currency" value="PEN" checked={formData.currency === 'PEN'} onChange={e => setFormData({ ...formData, currency: e.target.value })} className="hidden" />
                                <span className="text-sm">Soles (S/)</span>
                            </label>
                            {/* Billeteras suelen ser solo soles, podemos deshabilitar USD si es billetera */}
                            <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${formData.currency === 'USD' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' : 'border-gray-200'} ${isWallet ? 'opacity-50 pointer-events-none bg-gray-50' : ''}`}>
                                <input type="radio" name="currency" value="USD" checked={formData.currency === 'USD'} onChange={e => setFormData({ ...formData, currency: e.target.value })} className="hidden" disabled={isWallet} />
                                <span className="text-sm">Dólares ($)</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* 2. DATOS DE LA CUENTA (Dinámicos según tipo) */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label="Alias (Nombre Corto)"
                            value={formData.alias}
                            onChange={e => setFormData({ ...formData, alias: e.target.value })}
                            placeholder="Ej: BCP Soles Principal"
                            required
                        />
                        <FormField
                            label="Titular de la Cuenta"
                            value={formData.holder_name}
                            onChange={e => setFormData({ ...formData, holder_name: e.target.value })}
                            placeholder="Nombre completo"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label={isWallet ? 'Número de Celular' : 'Número de Cuenta'}
                            value={formData.account_number}
                            onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                            required
                            className="font-mono"
                        />
                        {/* CCI solo si es BANCO */}
                        {!isWallet && (
                            <FormField
                                label="CCI (Opcional)"
                                value={formData.cci}
                                onChange={e => setFormData({ ...formData, cci: e.target.value })}
                                className="font-mono"
                                placeholder="002..."
                            />
                        )}
                    </div>
                </div>

                {/* 3. DESCRIPCIÓN Y ESTADO */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales</label>
                    <textarea
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="3"
                        placeholder="Instrucciones especiales para depósitos..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                </div>

                {/* FOOTER BOTONES */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={isSubmitting || !formData.institution_id}>
                        {isSubmitting ? 'Guardando...' : (accountToEdit ? 'Actualizar Cuenta' : 'Crear Cuenta')}
                    </Button>
                </div>

            </form>
        </Modal>
    );
};

export default AccountModal;
