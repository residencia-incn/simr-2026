import React, { useState } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Building, Wallet } from 'lucide-react';
import { Button, Card, FormField, Modal, ConfirmDialog } from '../ui';
import { showError } from '../../utils/alerts';

const AccountsManager = ({ accounts, onCreateAccount, onUpdateAccount, onDeleteAccount }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        tipo: 'banco',
        numero_cuenta: '',
        descripcion: ''
    });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, account: null });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAccount) {
                await onUpdateAccount(editingAccount.id, formData);
            } else {
                await onCreateAccount(formData);
            }
            handleCloseModal();
        } catch (error) {
            showError(error.message, 'Error al guardar cuenta');
        }
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setFormData({
            nombre: account.nombre,
            tipo: account.tipo,
            numero_cuenta: account.numero_cuenta || '',
            descripcion: account.descripcion || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            await onDeleteAccount(confirmDelete.account.id);
            setConfirmDelete({ isOpen: false, account: null });
        } catch (error) {
            showError(error.message, 'Error al eliminar cuenta');
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAccount(null);
        setFormData({
            nombre: '',
            tipo: 'banco',
            numero_cuenta: '',
            descripcion: ''
        });
    };

    const getAccountIcon = (tipo) => {
        return tipo === 'banco' ? Building : Wallet;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Gestión de Cuentas</h3>
                    <p className="text-sm text-gray-600 mt-1">Administra las cuentas bancarias y de efectivo</p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus size={18} className="mr-2" />
                    Nueva Cuenta
                </Button>
            </div>

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map((account) => {
                    const Icon = getAccountIcon(account.tipo);
                    return (
                        <Card key={account.id} className="p-5 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-lg ${account.tipo === 'banco' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{account.nombre}</h4>
                                        <p className="text-xs text-gray-500 capitalize">{account.tipo}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(account)}
                                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete({ isOpen: true, account })}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {account.numero_cuenta && (
                                <div className="mb-3 pb-3 border-b border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">Número de Cuenta</p>
                                    <p className="text-sm font-mono text-gray-700">{account.numero_cuenta}</p>
                                </div>
                            )}

                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Saldo Actual</p>
                                <div className="flex items-baseline gap-2">
                                    <DollarSign size={20} className="text-gray-400" />
                                    <p className={`text-2xl font-bold ${account.saldo_actual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        S/ {(account.saldo_actual || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {account.descripcion && (
                                <p className="text-xs text-gray-600 mt-3">{account.descripcion}</p>
                            )}
                        </Card>
                    );
                })}
            </div>

            {accounts.length === 0 && (
                <Card className="p-12 text-center">
                    <Building size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay cuentas registradas</h3>
                    <p className="text-gray-600 mb-4">Comienza agregando tu primera cuenta bancaria o de efectivo</p>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus size={18} className="mr-2" />
                        Crear Primera Cuenta
                    </Button>
                </Card>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="Nombre de la Cuenta"
                        name="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: BCP Principal"
                        required
                    />

                    <FormField
                        label="Tipo de Cuenta"
                        name="tipo"
                        type="select"
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        options={[
                            { value: 'banco', label: 'Cuenta Bancaria' },
                            { value: 'efectivo', label: 'Efectivo / Caja' }
                        ]}
                        required
                    />

                    {formData.tipo === 'banco' && (
                        <FormField
                            label="Número de Cuenta"
                            name="numero_cuenta"
                            value={formData.numero_cuenta}
                            onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
                            placeholder="Ej: 191-XXXXXXXX-X-XX"
                        />
                    )}

                    <FormField
                        label="Descripción"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Ej: Cuenta principal para ingresos"
                    />

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseModal}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {editingAccount ? 'Actualizar' : 'Crear'} Cuenta
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, account: null })}
                onConfirm={handleDelete}
                title="Eliminar Cuenta"
                message={`¿Estás seguro de eliminar la cuenta "${confirmDelete.account?.nombre}"? Esta acción no se puede deshacer.`}
                type="danger"
            />
        </div>
    );
};

export default AccountsManager;
