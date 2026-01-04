import React, { useState } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Building, Wallet, ArrowRightLeft, ArrowRight } from 'lucide-react';
import { Button, Card, FormField, Modal, ConfirmDialog, Table } from '../ui';
import { showError } from '../../utils/alerts';

const AccountsManager = ({ accounts, financialAssets = [], transactions = [], onCreateAccount, onUpdateAccount, onDeleteAccount, onTransfer }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        tipo: 'banco', // Legacy default
        numero_cuenta: '',
        descripcion: '',
        financialAssetId: ''
    });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, account: null });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Find selected asset details to save snapshot/derived values
            const selectedAsset = financialAssets.find(a => a.id === formData.financialAssetId);

            const accountData = {
                ...formData,
                // Ensure derived values are consistent if asset is selected
                tipo: selectedAsset ? selectedAsset.type : formData.tipo,
                numero_cuenta: selectedAsset ? (selectedAsset.number || selectedAsset.phone || '') : formData.numero_cuenta,
                // If using backend, ensure these fields are expected.
            };

            if (editingAccount) {
                await onUpdateAccount(editingAccount.id, accountData);
            } else {
                await onCreateAccount(accountData);
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
            descripcion: account.descripcion || '',
            financialAssetId: account.financialAssetId || ''
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
            descripcion: '',
            financialAssetId: ''
        });
    };

    const handleAssetChange = (assetId) => {
        const asset = financialAssets.find(a => a.id === assetId);
        if (asset) {
            // Determine account number based on type or availability
            const accountNumber = asset.number || asset.phone || '';

            setFormData(prev => ({
                ...prev,
                financialAssetId: assetId,
                nombre: asset.name, // Auto-fill name
                tipo: asset.type,
                numero_cuenta: accountNumber,
                descripcion: `Cuenta basada en ${asset.subtype || asset.type}`
            }));
        } else {
            setFormData(prev => ({ ...prev, financialAssetId: '' }));
        }
    };

    const getAccountIcon = (tipo) => {
        return tipo === 'banco' ? Building : Wallet;
    };

    // Helper to render logo/icon for a given account
    const renderAccountLogo = (account) => {
        const asset = financialAssets.find(a => a.id === account.financialAssetId);
        const subtype = asset ? asset.subtype : (account.descripcion?.includes('BCP') ? 'BCP' : ''); // Fallback guessing

        let color = 'bg-gray-100 text-gray-600';
        let text = <Building size={24} />;

        // Match logic from Settings (could be shared in utils)
        if (subtype === 'BCP') { color = 'bg-orange-500 text-white'; text = 'BCP'; }
        else if (subtype === 'Interbank') { color = 'bg-green-600 text-white'; text = 'IB'; }
        else if (subtype === 'BBVA') { color = 'bg-blue-600 text-white'; text = 'BBVA'; }
        else if (subtype === 'Yape') { color = 'bg-purple-600 text-white'; text = 'Y'; }
        else if (subtype === 'Plin') { color = 'bg-cyan-500 text-white'; text = 'Plin'; }
        else if (account.tipo === 'efectivo') { color = 'bg-green-100 text-green-700'; text = <DollarSign size={24} />; }

        return (
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${color}`}>
                {typeof text === 'string' ? text : text}
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
                                    <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{account.nombre}</h4>
                                    <p className="text-xs text-gray-500 capitalize flex items-center gap-1">
                                        {account.tipo}
                                        {account.financialAssetId && <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full ml-1">Vinculada</span>}
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

                        {account.numero_cuenta && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Número de Cuenta / Teléfono</p>
                                <p className="text-sm font-mono text-gray-700 tracking-wide">{account.numero_cuenta}</p>
                            </div>
                        )}

                        <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Saldo Disponible</p>
                            <div className="flex items-baseline gap-2">
                                <p className={`text-3xl font-bold tracking-tight ${account.saldo_actual < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                    S/ {(account.saldo_actual || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        {account.descripcion && (
                            <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100 italic truncate">
                                {account.descripcion}
                            </p>
                        )}
                    </Card>
                ))}
            </div>

            {accounts.length === 0 && (
                <EmptyState
                    icon={Building}
                    title="No hay cuentas registradas"
                    description="Comienza agregando tu primera cuenta bancaria o de efectivo."
                    action={
                        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white mt-4">
                            <Plus size={18} className="mr-2" />
                            Crear Primera Cuenta
                        </Button>
                    }
                />
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
                                    // Try to determine direction based on metadata or category
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
                                header: 'Cuenta', render: (tx) => {
                                    const acc = accounts.find(a => a.id === tx.cuenta_id);
                                    return <span className="text-gray-600">{acc ? acc.nombre : 'Cuenta eliminada'}</span>;
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

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ... (existing form content) ... */}
                    {/* Simplified for brevity in replacement, but I must match exact target content to keep it safe. */}
                    {/* Actually I'll use the existing 'Create/Edit Modal' block as target to append the TransferModal after it */}

                    {/* 1. Asset Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Institución / Activo Financiero <span className="text-red-500">*</span>
                        </label>
                        {financialAssets.length > 0 ? (
                            <select
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                value={formData.financialAssetId}
                                onChange={(e) => handleAssetChange(e.target.value)}
                                required
                            >
                                <option value="">Seleccionar Institución...</option>
                                {financialAssets.map(asset => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.subtype || asset.type} - {asset.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200">
                                No tienes cuentas financieras configuradas.
                                <br />
                                <span className="text-xs">Ve a <strong>Configuración {'>'} Cuentas Financieras</strong> para agregar bancos o billeteras.</span>
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Elige la entidad financiera base para esta cuenta.</p>
                    </div>

                    {/* 2. Account Name (Auto-filled but editable) */}
                    <FormField
                        label="Nombre Personalizado"
                        name="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: BCP Principal Soles"
                        required
                        helpText="Un nombre para identificar esta cuenta en el sistema."
                    />

                    {/* 3. Read-only Details */}
                    {formData.financialAssetId && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                                <p className="text-sm font-medium capitalize">{formData.tipo}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Número / Cuenta</label>
                                <p className="text-sm font-mono">{formData.numero_cuenta || 'No especificado'}</p>
                            </div>
                        </div>
                    )}

                    {/* 4. Description */}
                    <FormField
                        label="Descripción (Opcional)"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Ej: Cuenta principal para ingresos de inscripciones"
                    />

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
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
                message={`¿Estás seguro de eliminar la cuenta "${confirmDelete.account?.nombre}"? Esta acción no se puede deshacer.`}
                type="danger"
            />
        </div>
    );
};

export default AccountsManager;

const TransferModal = ({ isOpen, onClose, accounts, onTransfer }) => {
    // Need to use useState here, but TransferModal is outside AccountsManager so it's a separate component.
    // However, I need to import useState. AccountsManager imports React, { useState }.
    // If I move it out, it still has access to React imports if they are at top of file.
    // But I must ensure internal logic is correct.
    const [fromAccount, setFromAccount] = React.useState('');
    const [toAccount, setToAccount] = React.useState('');
    const [amount, setAmount] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (fromAccount === toAccount) return alert('La cuenta de destino debe ser diferente a la de origen');

        const source = accounts.find(a => a.id === fromAccount);
        if (source && parseFloat(amount) > source.saldo_actual) {
            return alert('Saldo insuficiente en la cuenta de origen');
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
                            ...accounts.map(a => ({ value: a.id, label: `${a.nombre} (S/ ${a.saldo_actual?.toFixed(2)})` }))
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
                            ...accounts.filter(a => a.id !== fromAccount).map(a => ({ value: a.id, label: a.nombre }))
                        ]}
                        required
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Monto a Transferir (S/) <span className="text-red-500">*</span>
                        </label>
                        {fromAccount && (
                            <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span>Disponible:</span>
                                <span className="font-bold">
                                    S/ {accounts.find(a => a.id === fromAccount)?.saldo_actual?.toFixed(2) || '0.00'}
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
                                    if (acc) setAmount(acc.saldo_actual);
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
