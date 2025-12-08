import React, { useState, useEffect } from 'react';
import { Search, Trash2, Key, Shield, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';
import { Button, FormField, Table, Modal } from '../ui';

import RoleAssignmentModal from './RoleAssignmentModal';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionType, setActionType] = useState(null); // 'delete', 'reset', 'roles'

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await api.users.getAll();
            setUsers(data);
        } catch (error) {
            console.error("Error loading users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.institution.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAction = async () => {
        if (!selectedUser || !actionType) return;

        try {
            if (actionType === 'delete') {
                await api.users.delete(selectedUser.id);
                // For mock users we can't really delete them from the array permanently unless api handles it,
                // but we'll reflect it in UI
                alert(`Usuario ${selectedUser.name} eliminado.`);
                loadUsers();
            } else if (actionType === 'reset') {
                await api.users.resetPassword(selectedUser.id);
                alert(`Contraseña de ${selectedUser.name} reseteada a '123456'.`);
            }
        } catch (error) {
            alert('Error al realizar la acción');
        } finally {
            if (actionType !== 'roles') { // Don't close for roles, let modal handle it
                setSelectedUser(null);
                setActionType(null);
            }
        }
    };

    const handleUpdateRoles = async (updatedUser) => {
        try {
            await api.users.update(updatedUser);
            alert(`Roles de ${updatedUser.name} actualizados.`);
            loadUsers();
        } catch (error) {
            console.error("Failed to update roles", error);
        } finally {
            setSelectedUser(null);
            setActionType(null);
        }
    };

    const columns = [
        { header: 'Nombre', key: 'name', sortable: true, className: 'font-medium' },
        { header: 'Email', key: 'email', sortable: true },
        { header: 'Institución', key: 'institution', sortable: true },
        {
            header: 'Rol',
            key: 'role',
            sortable: true,
            render: (user) => (
                <div className="flex flex-wrap gap-1">
                    {(user.roles || [user.role]).map((role, idx) => (
                        <span key={idx} className={`px-2 py-1 rounded-full text-[10px] font-semibold
                            ${role === 'superadmin' ? 'bg-red-100 text-red-700' :
                                role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                    role === 'jury' ? 'bg-cyan-100 text-cyan-700' :
                                        role === 'resident' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                            }`}>
                            {role}
                        </span>
                    ))}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="text-purple-600" />
                        Gestión de Usuarios
                    </h3>
                    <p className="text-gray-500 text-sm">Administración de cuentas y seguridad</p>
                </div>
                <div className="relative w-64">
                    <FormField
                        placeholder="Buscar usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-0"
                    />
                    <Search className="absolute right-3 top-3 text-gray-400" size={18} />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Table
                    columns={columns}
                    data={filteredUsers}
                    actions={(user) => (
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setSelectedUser(user); setActionType('roles'); }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Gestionar Roles"
                            >
                                <Shield size={18} />
                            </button>
                            <button
                                onClick={() => { setSelectedUser(user); setActionType('reset'); }}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Resetear Contraseña"
                            >
                                <Key size={18} />
                            </button>
                            <button
                                onClick={() => { setSelectedUser(user); setActionType('delete'); }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar Usuario"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                />
            </div>

            <RoleAssignmentModal
                isOpen={actionType === 'roles'}
                onClose={() => { setSelectedUser(null); setActionType(null); }}
                user={selectedUser}
                onSave={handleUpdateRoles}
            />

            {/* Confirmation Modal */}
            {selectedUser && (actionType === 'delete' || actionType === 'reset') && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className={`p-4 rounded-full mb-4 ${actionType === 'delete' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                <AlertTriangle size={36} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {actionType === 'delete' ? '¿Eliminar Usuario?' : '¿Resetear Contraseña?'}
                            </h3>
                            <p className="text-gray-600 mt-2">
                                {actionType === 'delete'
                                    ? `Está a punto de eliminar a ${selectedUser.name}. Esta acción no se puede deshacer.`
                                    : `La contraseña de ${selectedUser.name} será reseteada temporalmente.`}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="w-full" onClick={() => setSelectedUser(null)}>
                                Cancelar
                            </Button>
                            <Button
                                className={`w-full ${actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}
                                onClick={handleAction}
                            >
                                Confirmar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
