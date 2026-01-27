import React, { useState } from 'react';
import {
    Search, Filter, Download, Plus,
    MoreVertical, Shield, Eye, FileText, Printer,
    MapPin, Wifi, Monitor, Brain, Stethoscope
} from 'lucide-react';
import UserDetailModal from '../organization/UserDetailModal';
import UsersPrintView from '../organization/UsersPrintView';
import PhotocheckModal from './PhotocheckModal';
import { useSearch, useSortableData, useModal, useApi } from '../../hooks';
import { Button, StatusBadge } from '../ui';
import { api } from '../../services/api';

const AttendeeList = ({ attendees }) => {
    // --- ESTADOS Y HOOKS ---
    const {
        searchTerm,
        setSearchTerm,
        filterValue: filterRole,
        setFilterValue: setFilterRole,
        filteredItems: searchFilteredAttendees
    } = useSearch(attendees, {
        searchFields: ['name', 'specialty', 'dni', 'email'],
        filterField: 'eventRoles'
    });

    // Fetch dynamic options
    const { data: rolesData } = useApi(api.system.getRoles);
    const { data: modalitiesData } = useApi(api.system.getModalities);

    // Prepare options for selects
    const roleOptions = React.useMemo(() => {
        if (!rolesData) return [
            { value: "All", label: "Todos los Roles" },
            { value: "participante", label: "Participantes" },
            { value: "ponente", label: "Ponentes" },
            { value: "jurado", label: "Jurados" },
            { value: "organizador", label: "Organizadores" }
        ];

        const dynamicRoles = rolesData.map(r => ({
            value: r.slug || r.name.toLowerCase(), // Ensure fallback matches typical slug format
            label: r.name
        }));

        return [{ value: "All", label: "Todos los Roles" }, ...dynamicRoles];
    }, [rolesData]);

    const modalityOptions = React.useMemo(() => {
        if (!modalitiesData) return [
            { value: "All", label: "Todas" },
            { value: "Presencial", label: "Presencial" },
            { value: "Virtual", label: "Virtual" },
            { value: "Híbrido", label: "Híbrido" }
        ];

        // Ensure we handle potential "title" vs "name" API variations
        const dynamicModalities = modalitiesData.map(m => ({
            value: m.title || m.name,
            label: m.title || m.name
        }));

        return [{ value: "All", label: "Todas" }, ...dynamicModalities];
    }, [modalitiesData]);

    const [filterModality, setFilterModality] = useState('All');

    // Sub-filtro de Modalidad
    const filteredAttendees = React.useMemo(() => {
        if (filterModality === 'All') return searchFilteredAttendees;
        return searchFilteredAttendees.filter(user =>
            (user.modalityName || 'Presencial') === filterModality
        );
    }, [searchFilteredAttendees, filterModality]);

    const {
        items: sortedAttendees,
        requestSort,
        sortConfig
    } = useSortableData(filteredAttendees);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset paginación
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterRole, filterModality]);

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedAttendees.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAttendees.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Modales
    const { isOpen: isDetailOpen, data: selectedUserId, open: openDetail, close: closeDetail } = useModal();
    const { isOpen: isPhotocheckOpen, data: printUser, open: openPhotocheck, close: closePhotocheck } = useModal();

    // --- ACCIONES DE IMPRESIÓN ---
    // La impresión ahora se maneja vía CSS (@media print) y el componente oculto UsersPrintView
    const handlePrintList = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* 1. COMPONENTE DE IMPRESIÓN (Visible solo al imprimir) */}
            <UsersPrintView users={filteredAttendees} totalCount={filteredAttendees.length} />

            {/* 2. INTERFAZ NORMAL (Oculta al imprimir) */}
            <div className="no-print space-y-6">

                {/* === BLOQUE 1: BARRA DE FILTROS (Card Design) === */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

                    {/* Buscador (Más espacio) */}
                    <div className="md:col-span-4 xl:col-span-5 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, especialidad, DNI o correo..."
                            className="pl-10 w-full h-10 rounded-lg border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filtro: Rol */}
                    <div className="md:col-span-3 xl:col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1 tracking-wider">Filtrar por Rol</label>
                        <div className="relative">
                            <select
                                className="w-full h-10 pl-3 pr-8 rounded-lg border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer appearance-none bg-slate-50 hover:bg-white transition-colors"
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                {roleOptions.map((opt, i) => (
                                    <option key={i} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <Filter className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>

                    {/* Filtro: Modalidad */}
                    <div className="md:col-span-3 xl:col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1 tracking-wider">Por Modalidad</label>
                        <div className="relative">
                            <select
                                className="w-full h-10 pl-3 pr-8 rounded-lg border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer appearance-none bg-slate-50 hover:bg-white transition-colors"
                                value={filterModality}
                                onChange={(e) => setFilterModality(e.target.value)}
                            >
                                {modalityOptions.map((opt, i) => (
                                    <option key={i} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <Filter className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="md:col-span-2 xl:col-span-3 flex justify-end gap-2">
                        <button
                            onClick={handlePrintList}
                            className="h-10 px-4 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Printer size={16} /> <span className="hidden xl:inline">Imprimir</span>
                        </button>
                        <button className="h-10 px-4 border border-slate-300 bg-white text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                            <Download size={16} /> <span className="hidden xl:inline">Exportar</span>
                        </button>
                    </div>
                </div>

                {/* === BLOQUE 2: LA TABLA (Diseño Clean) === */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                                    <th className="px-6 py-4 cursor-pointer hover:text-slate-700" onClick={() => requestSort('lastName')}>Apellidos</th>
                                    <th className="px-6 py-4 cursor-pointer hover:text-slate-700" onClick={() => requestSort('firstName')}>Nombres</th>
                                    <th className="px-6 py-4">DNI</th>
                                    <th className="px-6 py-4">Ocupación</th>
                                    <th className="px-6 py-4">Rol</th>
                                    <th className="px-6 py-4">Especialidad</th>
                                    <th className="px-6 py-4">Modalidad</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentItems.map((item, idx) => (
                                    <tr
                                        key={idx}
                                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                        onClick={() => openDetail(item.id)}
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-900">{item.lastName || item.name?.split(' ').slice(0, 2).join(' ')}</td>
                                        <td className="px-6 py-4 text-slate-600">{item.firstName || item.name?.split(' ').slice(2).join(' ')}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.dni}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-[150px]">{item.occupation}</td>
                                        <td className="px-6 py-4">
                                            {(item.eventRoles || ['Asistente']).map((role, i) => {
                                                // Normalización Visual: Participante -> Asistente
                                                const displayInfo = role.toLowerCase() === 'participante'
                                                    ? { type: 'asistente', text: 'Asistente' }
                                                    : { type: role, text: role.charAt(0).toUpperCase() + role.slice(1) };

                                                return <StatusBadge key={i} type={displayInfo.type} text={displayInfo.text} />;
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.specialty === 'Neurología' ? <Brain size={16} className="text-purple-500" /> : <Stethoscope size={16} className="text-slate-400" />}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge type={item.modalityName || 'presencial'} text={item.modalityName || 'Presencial'} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openDetail(item.id)}
                                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                    title="Ver Detalles"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openPhotocheck(item)}
                                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                    title="Imprimir Credencial"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer de Paginación */}
                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 gap-4">
                        <span>
                            Mostrando <span className="font-medium text-slate-900">{filteredAttendees.length > 0 ? indexOfFirstItem + 1 : 0}</span> a <span className="font-medium text-slate-900">{Math.min(indexOfLastItem, filteredAttendees.length)}</span> de <span className="font-medium text-slate-900">{filteredAttendees.length}</span> inscritos
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                Anterior
                            </button>
                            <div className="hidden sm:flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => paginate(i + 1)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${currentPage === i + 1
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'hover:bg-slate-200 text-slate-600'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                {isDetailOpen && (
                    <UserDetailModal
                        isOpen={isDetailOpen}
                        onClose={closeDetail}
                        userId={selectedUserId}
                    />
                )}

                {isPhotocheckOpen && (
                    <PhotocheckModal
                        isOpen={isPhotocheckOpen}
                        onClose={closePhotocheck}
                        user={printUser}
                    />
                )}
            </div>
        </div>
    );
};

export default AttendeeList;
