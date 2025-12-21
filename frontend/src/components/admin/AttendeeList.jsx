import React from 'react';
import { Search, Printer, Download, Brain, Stethoscope, Baby, Activity, Wifi, MapPin, Monitor } from 'lucide-react';
import AttendeeDetailsModal from './AttendeeDetailsModal';
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
        searchFields: ['name', 'specialty', 'dni', 'email'],
        filterField: 'eventRoles'
    });

    // Use custom hook for sorting
    const {
        items: sortedAttendees,
        requestSort,
        sortConfig
    } = useSortableData(filteredAttendees);

    // Modal for Photocheck
    const {
        isOpen: isPhotocheckOpen,
        data: photocheckAttendee,
        open: openPhotocheck,
        close: closePhotocheck
    } = useModal();

    // Modal for Details
    const {
        isOpen: isDetailsOpen,
        data: detailsAttendee,
        open: openDetails,
        close: closeDetails
    } = useModal();

    // Pagination State
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    // Reset pagination when search or filter changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterRole]);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedAttendees.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedAttendees.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const columns = [
        { header: 'Apellidos', key: 'lastName', sortable: true, className: 'font-medium text-gray-900', render: (item) => item.lastName || item.name.split(' ').slice(0, 2).join(' ') },
        { header: 'Nombres', key: 'firstName', sortable: true, render: (item) => item.firstName || item.name.split(' ').slice(2).join(' ') },
        { header: 'DNI', key: 'dni', sortable: true },
        { header: 'Ocupación', key: 'occupation' },
        {
            header: 'Rol',
            key: 'eventRoles',
            sortable: true,
            render: (item) => {
                // Support for array eventRoles or legacy single role
                const roles = item.eventRoles || (item.role ? [item.role] : ['asistente']);

                return (
                    <div className="flex flex-wrap gap-1">
                        {roles.map((role, idx) => {
                            let variant = 'gray'; // default 'asistente'
                            let label = role;

                            // Normalize for display and color
                            const lowerRole = String(role).toLowerCase();

                            if (lowerRole.includes('organizador') || lowerRole.includes('comité')) {
                                variant = 'purple';
                                label = 'Comité';
                            } else if (lowerRole.includes('ponente')) {
                                variant = 'amber';
                                label = 'Ponente';
                            } else if (lowerRole.includes('jurado')) {
                                variant = 'cyan';
                                label = 'Jurado';
                            } else if (lowerRole.includes('asistente')) {
                                variant = 'gray';
                                label = 'Asistente';
                            }

                            return <Badge key={idx} variant={variant}>{label}</Badge>;
                        })}
                    </div>
                );
            }
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
        { header: 'Fecha Reg.', key: 'registrationDate', sortable: true, render: (item) => item.registrationDate || item.date }
    ];

    return (
        <div className="space-y-4">
            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-end">
                <div className="relative flex-grow max-w-md w-full">
                    <FormField
                        placeholder="Buscar por nombre, especialidad, DNI o correo..."
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
                            { value: "asistente", label: "Asistentes" },
                            { value: "ponente", label: "Ponentes" },
                            { value: "jurado", label: "Jurados" },
                            { value: "organizador", label: "Comité" }
                        ]}
                        className="mb-0 min-w-[180px]"
                    />
                    <Button variant="outline" className="flex items-center gap-2 h-[42px]"><Download size={16} /> Exportar</Button>
                </div>
            </div>

            {/* Table */}
            <Table
                columns={columns}
                data={currentItems}
                onSort={requestSort}
                sortConfig={{ key: sortedAttendees.sortKey, direction: sortedAttendees.sortDirection }}
                emptyMessage="No se encontraron asistentes."
                onRowClick={openDetails} // Open details modal on row click
                actions={(item) => (
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent opening the details modal
                            openPhotocheck(item);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Imprimir Fotocheck"
                    >
                        <Printer size={18} />
                    </button>
                )}
            />

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="text-sm text-gray-500">
                    Mostrando {filteredAttendees.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredAttendees.length)} de {filteredAttendees.length} asistentes
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
                                    ? 'bg-blue-600 text-white shadow-sm'
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

            {/* Modals */}
            <PhotocheckModal
                isOpen={isPhotocheckOpen}
                onClose={closePhotocheck}
                attendee={photocheckAttendee}
            />

            <AttendeeDetailsModal
                isOpen={isDetailsOpen}
                onClose={closeDetails}
                attendee={detailsAttendee}
            />
        </div>
    );
};

export default AttendeeList;
