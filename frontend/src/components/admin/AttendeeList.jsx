import React from 'react';
import { Search, Printer, Download } from 'lucide-react';
import PhotocheckModal from './PhotocheckModal';
import { useSearch, useSortableData, useModal } from '../../hooks';
import { Button, Table, FormField, Badge } from '../ui';

const AttendeeList = ({ attendees }) => {
    // Use custom hooks for search/filter
    const {
        searchTerm,
        setSearchTerm,
        filterValue: filterRole,
        setFilterValue: setFilterRole,
        filteredItems: filteredAttendees
    } = useSearch(attendees, {
        searchFields: ['name', 'specialty'],
        filterField: 'role'
    });

    // Use custom hook for sorting
    const {
        items: sortedAttendees,
        requestSort,
        sortConfig
    } = useSortableData(filteredAttendees);

    // Use custom hook for modal
    const {
        isOpen: isModalOpen,
        data: selectedAttendee,
        open: openPrintModal,
        onClose: closeModal
    } = useModal();

    const columns = [
        { header: 'Nombre', key: 'name', sortable: true, className: 'font-medium text-gray-900' },
        { header: 'DNI', key: 'dni', sortable: true },
        { header: 'CMP', key: 'cmp', sortable: true },
        {
            header: 'Rol',
            key: 'role',
            sortable: true,
            render: (item) => {
                const colors = {
                    'Comité Organizador': 'purple',
                    'Ponente': 'amber',
                    'Residente': 'blue',
                    'default': 'gray'
                };
                return <Badge variant={colors[item.role] || colors.default}>{item.role}</Badge>;
            }
        },
        { header: 'Especialidad', key: 'specialty', sortable: true },
        { header: 'Email', key: 'email', sortable: true },
        { header: 'Modalidad', key: 'modality' },
        { header: 'Fecha Reg.', key: 'date', sortable: true }
    ];


    return (
        <div className="space-y-4">
            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-end">
                <div className="relative flex-grow max-w-md w-full">
                    <FormField
                        placeholder="Buscar por nombre o especialidad..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-0"
                    />
                    <Search className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={18} />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <FormField
                        type="select"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        options={[
                            { value: "All", label: "Todos los Roles" },
                            { value: "Residente", label: "Residentes" },
                            { value: "Especialista", label: "Especialistas" },
                            { value: "Estudiante", label: "Estudiantes" },
                            { value: "Ponente", label: "Ponentes" },
                            { value: "Comité Organizador", label: "Comité" }
                        ]}
                        className="mb-0 min-w-[180px]"
                    />
                    <Button variant="outline" className="flex items-center gap-2 h-[42px]"><Download size={16} /> Exportar</Button>
                </div>
            </div>

            {/* Table */}
            <Table
                columns={columns}
                data={sortedAttendees}
                onSort={requestSort}
                sortConfig={{ key: sortedAttendees.sortKey, direction: sortedAttendees.sortDirection }} // useSortableData might not return sortConfig directly, check implementation
                emptyMessage="No se encontraron asistentes."
                actions={(item) => (
                    <button
                        onClick={() => openPrintModal(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Imprimir Fotocheck"
                    >
                        <Printer size={18} />
                    </button>
                )}
            />
            <div className="text-xs text-gray-500 text-right px-2">
                Mostrando {filteredAttendees.length} de {attendees.length} asistentes
            </div>

            {/* Modal */}
            <PhotocheckModal
                isOpen={isModalOpen}
                onClose={closeModal}
                attendee={selectedAttendee}
            />
        </div>
    );
};

export default AttendeeList;
