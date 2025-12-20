import React, { useState, useEffect } from 'react';
import { Search, Trash2, Key, Shield, AlertTriangle, Printer, Download, Brain, Stethoscope, Baby, Activity, Wifi, MapPin, Monitor } from 'lucide-react';
import { api } from '../../services/api';
import { Button, FormField, Table, Modal, Badge } from '../ui';
import { showSuccess, showError } from '../../utils/alerts';

import { useModal, useSearch, useSortableData } from '../../hooks';
import AttendeeDetailsModal from './AttendeeDetailsModal';

import RoleAssignmentModal from './RoleAssignmentModal';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionType, setActionType] = useState(null); // 'delete', 'reset', 'roles'

    // Modal for Details
    const {
        isOpen: isDetailsOpen,
        data: detailsAttendee,
        open: openDetails,
        close: closeDetails
    } = useModal();

    const loadUsers = async () => {
        setLoading(true);
        try {
            const [usersData, attendeesData] = await Promise.all([
                api.users.getAll(),
                api.attendees.getAll()
            ]);

            // Merge strategies:
            // We primarily want the "Attendees" list visual, but augmented with User data (roles).
            // Or we want Users list, augmented with Attendees data (specialty, dni).
            // User requirement: "The list ... must be the same as attendance".
            // So we treat Attendees as the base list.

            // Map attendees to include user data if email matches
            const merged = attendeesData.map(att => {
                const user = usersData.find(u => u.email === att.email);
                return {
                    ...att,
                    ...(user || {}), // User properties overwrite attendee if overlap, but we want to keep attendee visuals
                    // Ensure we have both IDs if needed. 
                    attendeeId: att.id,
                    userId: user?.id,
                    // Prefer attendee name for the split logic if it's formatted well, or keep as is.
                    // IMPORTANT: columns use lastName/firstName.
                };
            });

            // Also include users who are NOT in attendees? 
            // The prompt implies "all attendees have an account". 
            // If we include non-attendee users, they might have missing fields (DNI, Specialty).
            // For now, let's stick to the merged list based on attendees to ensure the "Look" is 1:1.

            setUsers(merged);
        } catch (error) {
            console.error("Error loading users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // Use custom hooks for search/filter
    const {
        searchTerm,
        setSearchTerm,
        filterValue: filterRole,
        setFilterValue: setFilterRole,
        filteredItems: filteredUsers
    } = useSearch(users, {
        searchFields: ['name', 'firstName', 'lastName', 'email', 'specialty', 'dni'],
        filterField: 'role'
    });

    // Use custom hook for sorting
    const {
        items: sortedUsers,
        requestSort,
        sortConfig
    } = useSortableData(filteredUsers);

    // Pagination State
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    // Reset pagination when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterRole]);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleAction = async () => {
        if (!selectedUser || !actionType) return;

        try {
            if (actionType === 'delete') {
                // Delete from Users (Account)
                if (selectedUser.userId) {
                    await api.users.delete(selectedUser.userId);
                }

                // Delete from Attendees (Registration Record)
                if (selectedUser.attendeeId) {
                    await api.attendees.delete(selectedUser.attendeeId);
                }

                // NOTE: Treasury records are intentionally PRESERVED per requirements.

                showSuccess(`Los registros de tesorería ("Contabilidad") se mantienen intactos.`, `Usuario ${selectedUser.name} eliminado`);
                loadUsers();
            } else if (actionType === 'reset') {
                await api.users.resetPassword(selectedUser.id);
                showSuccess(`Nueva contraseña: 123456`, `Contraseña de ${selectedUser.name} reseteada`);
            }
        } catch (error) {
            showError('No se pudo completar la acción', 'Error');
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
            showSuccess(`Los cambios han sido guardados correctamente.`, `Roles de ${updatedUser.name} actualizados`);
            loadUsers();
        } catch (error) {
            console.error("Failed to update roles", error);
        } finally {
            setSelectedUser(null);
            setActionType(null);
        }
    };

    const columns = [
        { header: 'Apellidos', key: 'lastName', sortable: true, className: 'font-medium text-gray-900', render: (item) => item.lastName || (item.name || '').split(' ').slice(0, 2).join(' ') },
        { header: 'Nombres', key: 'firstName', sortable: true, render: (item) => item.firstName || (item.name || '').split(' ').slice(2).join(' ') },
        { header: 'DNI', key: 'dni', sortable: true },
        { header: 'Ocupación', key: 'occupation' },
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
        },
        {
            header: 'Especialidad',
            key: 'specialty',
            sortable: true,
            className: 'text-center w-16',
            render: (item) => {
                const spec = item.specialty || '';
                let Icon = Stethoscope;
                let color = 'text-gray-400';

                if (spec.toLowerCase().includes('neurología')) { Icon = Brain; color = 'text-purple-600'; }
                else if (spec.toLowerCase().includes('pediatría')) { Icon = Baby; color = 'text-pink-500'; }
                else if (spec.toLowerCase().includes('cirugía')) { Icon = Activity; color = 'text-red-500'; }
                else if (spec.toLowerCase().includes('medicina')) { Icon = Stethoscope; color = 'text-blue-500'; }

                return (
                    <div className="flex justify-center group relative cursor-help">
                        <Icon size={20} className={color} strokeWidth={1.5} />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 mb-2">
                            {spec}
                        </span>
                    </div>
                );
            }
        },
        {
            header: 'Modalidad',
            key: 'modality',
            className: 'text-center w-16',
            render: (item) => {
                const mod = item.modality || 'Presencial';
                let Icon = MapPin;
                let color = 'text-green-600';

                if (mod === 'Virtual') { Icon = Wifi; color = 'text-blue-500'; }
                else if (mod === 'Híbrido') { Icon = Monitor; color = 'text-purple-600'; }

                return (
                    <div className="flex justify-center group relative cursor-help">
                        <Icon size={18} className={color} strokeWidth={2} />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 mb-2">
                            {mod}
                        </span>
                    </div>
                );
            }
        },
        { header: 'Fecha Reg.', key: 'date', sortable: true }
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
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                    <div className="relative w-64">
                        <FormField
                            placeholder="Buscar usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mb-0"
                        />
                        <Search className="absolute right-3 top-3 text-gray-400" size={18} />
                    </div>
                    <FormField
                        type="select"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        options={[
                            { value: "All", label: "Todos los Roles" },
                            { value: "Asistente", label: "Asistentes" },
                            { value: "Ponente", label: "Ponentes" },
                            { value: "Jurado", label: "Jurados" },
                            { value: "Comité Organizador", label: "Comité" },
                            { value: "admin", label: "Administradores" }
                        ]}
                        className="mb-0 min-w-[180px]"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Table
                    columns={columns}
                    data={currentItems}
                    onSort={requestSort}
                    sortConfig={{ key: sortedUsers.sortKey, direction: sortedUsers.sortDirection }}
                    onRowClick={openDetails}
                    actions={(user) => (
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setActionType('roles'); }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Gestionar Roles"
                            >
                                <Shield size={18} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setActionType('reset'); }}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Resetear Contraseña"
                            >
                                <Key size={18} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setActionType('delete'); }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar Usuario"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                />
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="text-sm text-gray-500">
                    Mostrando {filteredUsers.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredUsers.length)} de {filteredUsers.length} usuarios
                </div>
                {totalPages > 1 && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0 flex items-center justify-center"
                        >
                            &lt;
                        </Button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => paginate(i + 1)}
                                className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0 flex items-center justify-center"
                        >
                            &gt;
                        </Button>
                    </div>
                )}
            </div>

            <RoleAssignmentModal
                isOpen={actionType === 'roles'}
                onClose={() => { setSelectedUser(null); setActionType(null); }}
                user={selectedUser}
                onSave={handleUpdateRoles}
            />

            <AttendeeDetailsModal
                isOpen={isDetailsOpen}
                onClose={closeDetails}
                attendee={detailsAttendee}
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
