import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Building, Wallet, ArrowRightLeft, ArrowRight } from 'lucide-react';
import { Button, Card, FormField, Modal, ConfirmDialog, Table } from '../ui';
import { showError, showSuccess } from '../../utils/alerts';
import AccountModal from './config/AccountModal';
import { api } from '../../services/api';

const AccountsManager = ({ accounts = [], transactions = [], onTransfer, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, account: null });

    // Handle Edit Open
    const handleEdit = (account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    // Close Modal Handler
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAccount(null);
    };

    // Handle Delete
    const handleDelete = async () => {
        try {
            await api.treasuryConfig.deleteAccount(confirmDelete.account.id);
            showSuccess('Cuenta eliminada correctamente');
            if (onRefresh) onRefresh();
            setConfirmDelete({ isOpen: false, account: null });
        } catch (error) {
            showError(error.message, 'Error al eliminar cuenta');
        }
    };

    const renderAccountLogo = (account) => {
        // Adapt to new model: account.institution object
        const institution = account.institution;

        if (institution?.logo_url) {
            return (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm bg-white border border-gray-100 overflow-hidden">
                    <img src={institution.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
            );
        }

        // Fallback for legacy or missing logo
        let color = 'bg-gray-100 text-gray-600';
        let icon = <Building size={24} />;

        const type = institution?.type || 'bank';
        if (type === 'wallet') {
            color = 'bg-purple-100 text-purple-600';
            icon = <Wallet size={24} />;
        } else if (type === 'bank') {
            color = 'bg-blue-100 text-blue-600';
        }

        return (
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${color}`}>
                {icon}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Gestión de Cuentas</h3>
                    <p className="text-sm text-gray-600 mt-1">Administra las cuentas bancarias y de efectivo</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setIsTransferModalOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
                    >
                        <ArrowRightLeft size={18} className="mr-2" />
                        Transferir
                    </Button>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus size={18} className="mr-2" />
                        Nueva Cuenta
                    </Button>
                </div>
            </div>

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((account) => (
                    <Card key={account.id} className="p-5 hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-blue-500 group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                {renderAccountLogo(account)}
                                <div>
                                    <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{account.alias || account.nombre}</h4>
                                    <p className="text-xs text-gray-500 capitalize flex items-center gap-1">
                                        {account.institution?.name || 'Cuenta'}
                                        <span className="font-mono text-gray-400">[{account.currency || 'PEN'}]</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(account)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => setConfirmDelete({ isOpen: true, account })}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">
                                {account.institution?.type === 'wallet' ? 'Número de Celular' : 'Número de Cuenta'}
                            </p>
                            <p className="text-sm font-mono text-gray-700 tracking-wide">
                                {account.account_number}
                            </p>
                            {account.cci && (
                                <>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 mt-2">CCI</p>
                                    <p className="text-xs font-mono text-gray-600">{account.cci}</p>
                                </>
                            )}
                        </div>

                        <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Saldo Disponible</p>
                            <div className="flex items-baseline gap-2">
                                <p className={`text-3xl font-bold tracking-tight ${account.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                    {account.currency === 'USD' ? '$' : 'S/'} {(account.balance || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        {account.description && (
                            <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100 italic truncate">
                                {account.description}
                            </p>
                        )}
                    </Card>
                ))}
            </div>

            {accounts.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <Building className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-slate-900">No hay cuentas registradas</h3>
                    <p className="text-slate-500 mb-6">Comienza agregando tu primera cuenta bancaria o billetera digital.</p>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus size={18} className="mr-2" />
                        Crear Primera Cuenta
                    </Button>
                </div>
            )}

            {/* Transfer History Table */}
            {transactions.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Historial de Movimientos</h4>
                    <Table
                        columns={[
                            {
                                header: 'Fecha',
                                render: (tx) => (
                                    <span className="text-gray-700">
                                        {new Date(tx.date || tx.createdAt).toLocaleDateString()}
                                    </span>
                                )
                            },
                            {
                                header: 'Descripción',
                                render: (tx) => (
                                    <span className="text-gray-900 font-medium">
                                        {tx.descripcion}
                                    </span>
                                )
                            },
                            {
                                header: 'Origen / Destino', render: (tx) => {
                                    let text = tx.categoria;
                                    let colorClass = "text-gray-700";
                                    if (tx.metadata?.type === 'transfer_out') {
                                        text = '➡️ Transferencia Enviada';
                                        colorClass = "text-orange-700";
                                    }
                                    if (tx.metadata?.type === 'transfer_in') {
                                        text = '⬅️ Transferencia Recibida';
                                        colorClass = "text-blue-700";
                                    }
                                    return <span className={colorClass}>{text}</span>;
                                }
                            },
                            {
                                header: 'Monto', render: (tx) => (
                                    <span className={tx.type === 'income' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                        {tx.type === 'income' ? '+' : '-'} S/ {Math.abs(parseFloat(tx.monto)).toFixed(2)}
                                    </span>
                                )
                            }
                        ]}
                        data={transactions.filter(t => t.categoria === 'Transferencia Interna').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))}
                    />
                </div>
            )}

            {/* Create/Edit Modal - Using New Modular Component */}
            <AccountModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                accountToEdit={editingAccount}
                onSaveSuccess={() => {
                    if (onRefresh) onRefresh();
                    handleCloseModal();
                }}
            />

            {/* Transfer Modal */}
            <TransferModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                accounts={accounts}
                onTransfer={onTransfer}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, account: null })}
                onConfirm={handleDelete}
                title="Eliminar Cuenta"
                message={`¿Estás seguro de eliminar la cuenta "${confirmDelete.account?.alias || confirmDelete.account?.nombre}"? Esta acción no se puede deshacer.`}
                type="danger"
            />
        </div>
    );
};

export default AccountsManager;

const TransferModal = ({ isOpen, onClose, accounts, onTransfer }) => {
    const [fromAccount, setFromAccount] = useState('');
    const [toAccount, setToAccount] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (fromAccount === toAccount) return showWarning('La cuenta de destino debe ser diferente a la de origen', 'Cuenta Inválida');

        const source = accounts.find(a => a.id === fromAccount);
        if (source && parseFloat(amount) > source.balance) { // Updated to source.balance
            return showWarning('Saldo insuficiente en la cuenta de origen', 'Saldo Insuficiente');
        }

        setSubmitting(true);
        try {
            await onTransfer(fromAccount, toAccount, parseFloat(amount), description);
            onClose();
            setFromAccount('');
            setToAccount('');
            setAmount('');
            setDescription('');
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Transferencia entre Cuentas">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <ArrowRightLeft size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-blue-800 font-bold">Mover Dinero</p>
                        <p className="text-xs text-blue-600">Transfiere fondos entre tus cuentas registradas. Se creará un registro de salida y uno de entrada vinculados.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                    <FormField
                        label="Desde (Origen)"
                        type="select"
                        value={fromAccount}
                        onChange={(e) => setFromAccount(e.target.value)}
                        options={[
                            { value: "", label: "Seleccionar..." },
                            ...accounts.map(a => ({ value: a.id, label: `${a.alias || a.nombre} (${a.currency} ${(a.balance || 0).toFixed(2)})` }))
                        ]}
                        required
                    />
                    <div className="flex justify-center pt-6">
                        <ArrowRight className="text-gray-400" />
                    </div>
                    <FormField
                        label="Hacia (Destino)"
                        type="select"
                        value={toAccount}
                        onChange={(e) => setToAccount(e.target.value)}
                        options={[
                            { value: "", label: "Seleccionar..." },
                            ...accounts.filter(a => a.id !== fromAccount).map(a => ({ value: a.id, label: a.alias || a.nombre }))
                        ]}
                        required
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Monto a Transferir <span className="text-red-500">*</span>
                        </label>
                        {fromAccount && (
                            <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span>Disponible:</span>
                                <span className="font-bold">
                                    {accounts.find(a => a.id === fromAccount)?.currency} {accounts.find(a => a.id === fromAccount)?.balance?.toFixed(2) || '0.00'}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-16"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                            required
                        />
                        {fromAccount && (
                            <button
                                type="button"
                                onClick={() => {
                                    const acc = accounts.find(a => a.id === fromAccount);
                                    if (acc) setAmount(acc.balance);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold px-2 py-1 rounded transition-colors"
                            >
                                MAX
                            </button>
                        )}
                    </div>
                </div>

                <FormField
                    label="Descripción / Motivo"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej. Cierre de caja del día, Consolidación de fondos"
                    required
                />

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" className="bg-blue-600 text-white" disabled={submitting || !fromAccount || !toAccount || !amount}>
                        {submitting ? 'Procesando...' : 'Transferir Fondos'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
