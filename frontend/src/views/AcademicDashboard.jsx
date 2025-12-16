import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    CheckCircle,
    AlertCircle,
    Clock,
    User,
    Users,
    Calendar,
    Filter,
    Search,
    FileText
} from 'lucide-react';
import { api } from '../services/api';
import { useApi, useSortableData, useModal } from '../hooks';
import { Button, Card, Table, Badge, LoadingSpinner, EmptyState } from '../components/ui';
import WorkReviewModal from '../components/academic/WorkReviewModal';
import AssignJuryModal from '../components/academic/AssignJuryModal';
import AssignScheduleModal from '../components/academic/AssignScheduleModal';
import WorkDetailsModal from '../components/academic/WorkDetailsModal';
import AcademicConfig from '../components/academic/AcademicConfig';
import AcademicResults from '../components/academic/AcademicResults';
import AcademicRubricConfig from '../components/academic/AcademicRubricConfig';
import AcademicJurers from '../components/academic/AcademicJurers';

const AcademicDashboard = () => {
    // State
    const [activeTab, setActiveTab] = useState('pending'); // pending, approved, observation
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('all');
    const [juryCountFilter, setJuryCountFilter] = useState('all');

    // Fetch Data
    const { data: works, loading, refetch } = useApi(api.works.getAll);

    // Modals State
    const {
        isOpen: isReviewOpen,
        open: openReview,
        close: closeReview
    } = useModal();
    const {
        isOpen: isJuryOpen,
        open: openJury,
        close: closeJury
    } = useModal();
    const {
        isOpen: isScheduleOpen,
        open: openSchedule,
        close: closeSchedule
    } = useModal();

    const {
        isOpen: isDetailsOpen,
        open: openDetails,
        close: closeDetails
    } = useModal();

    const [selectedWork, setSelectedWork] = useState(null);

    const handleOpenReview = (work) => {
        setSelectedWork(work);
        openReview();
    };

    const handleOpenJury = (work) => {
        setSelectedWork(work);
        openJury();
    };

    const handleOpenSchedule = (work) => {
        setSelectedWork(work);
        openSchedule();
    };

    const handleOpenDetails = (work) => {
        setSelectedWork(work);
        openDetails();
    };

    // Derived Data
    const specialties = works ? [...new Set(works.map(w => w?.specialty).filter(Boolean))].sort() : [];

    const fileteredWorks = works ? works.filter(work => {
        if (!work) return false;

        const title = work.title || '';
        const author = work.author || '';
        const specialty = work.specialty || '';
        const lowerSearch = searchTerm.toLowerCase();

        const matchesSearch = title.toLowerCase().includes(lowerSearch) ||
            author.toLowerCase().includes(lowerSearch);
        const matchesSpecialty = selectedSpecialty === 'all' || specialty === selectedSpecialty;



        // Jury Count Filter
        let matchesJuryCount = true;
        if (juryCountFilter !== 'all') {
            const juryCount = work.jury ? (Array.isArray(work.jury) ? work.jury.length : 1) : 0;
            if (juryCountFilter === 'none') matchesJuryCount = juryCount === 0;
            else matchesJuryCount = juryCount === parseInt(juryCountFilter);
        }

        if (!matchesSearch || !matchesSpecialty || !matchesJuryCount) return false;

        if (activeTab === 'pending') return work.status === 'En Evaluación' || work.status === 'Pending' || work.status === 'Pendiente';
        if (activeTab === 'approved') return work.status === 'Aceptado';
        if (activeTab === 'observation') return work.status === 'Observado' || work.status === 'Rechazado';

        return true;
    }) : [];

    // Sorting
    const { items: sortedWorks, requestSort, sortConfig } = useSortableData(fileteredWorks);

    // Columns Configuration
    const columns = [
        { key: 'id', header: 'Código', sortable: true, className: "font-mono" },
        {
            key: 'title',
            header: 'Título del Trabajo',
            sortable: true,
            render: (item) => (
                <div className="max-w-xs">
                    <div className="font-bold text-gray-900 line-clamp-2">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.specialty} • {item.type}</div>
                    {item.jury && (Array.isArray(item.jury) ? item.jury.length > 0 : item.jury) && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-medium border border-purple-100">
                            <Users size={10} /> {Array.isArray(item.jury) && item.jury.length > 1 ? `${item.jury.length} Jurados` : 'Jurado Asignado'}
                        </span>
                    )}
                    {item.slidesUrl && (
                        <span className="inline-flex items-center gap-1 mt-1 ml-2 px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-[10px] font-medium border border-green-100">
                            <FileText size={10} /> PPT Enviado
                        </span>
                    )}
                    {item.day && (
                        <span className="inline-flex items-center gap-1 mt-1 ml-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100">
                            <Calendar size={10} /> {item.day} {item.time}
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'author',
            header: 'Autor',
            sortable: true,
            render: (item) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                        {item.author.charAt(4)}
                    </div>
                    <span className="text-sm">{item.author}</span>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Estado',
            sortable: true,
            render: (item) => {
                let type = 'warning';
                if (item.status === 'Aceptado') type = 'success';
                if (item.status === 'Rechazado' || item.status === 'Observado') type = 'error';
                return <Badge type={type}>{item.status}</Badge>;
            }
        },
        {
            key: 'submittedAt',
            header: 'Enviado',
            sortable: true,
            render: (item) => (
                <div className="text-xs text-gray-500">
                    <div>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '-'}</div>
                    <div className="text-[10px]">{item.submittedAt ? new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                </div>
            )
        },
        {
            key: 'updatedAt',
            header: 'Modificado',
            sortable: true,
            render: (item) => {
                if (!item.updatedAt || item.updatedAt === item.submittedAt) return <span className="text-xs text-gray-400">-</span>;
                return (
                    <div className="text-xs text-gray-500">
                        <div>{new Date(item.updatedAt).toLocaleDateString()}</div>
                        <div className="text-[10px]">{new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                );
            }
        },

    ];

    // Actions
    const renderActions = (item) => (
        <div className="flex flex-col gap-1 items-end">
            {(item.status === 'En Evaluación' || item.status === 'Observado' || item.status === 'Pending' || item.status === 'Pendiente') && (
                <Button size="sm" onClick={() => handleOpenReview(item)}>
                    Revisar
                </Button>
            )}

            {item.status === 'Aceptado' && (
                <>
                    <Button
                        size="xs"
                        variant="outline"
                        className="w-full justify-center"
                        onClick={() => handleOpenJury(item)}
                    >
                        <User size={12} className="mr-1" />
                        {item.jury ? 'Cambiar Jurado' : 'Asignar Jurado'}
                    </Button>
                    <Button
                        size="xs"
                        variant="outline"
                        className="w-full justify-center"
                        onClick={() => handleOpenSchedule(item)}
                    >
                        <Calendar size={12} className="mr-1" />
                        {item.day ? 'Reprogramar' : 'Programar'}
                    </Button>

                    {item.slidesUrl && (
                        <Button
                            size="xs"
                            variant="primary" // Highlight this action
                            className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            onClick={() => window.open(item.slidesUrl, '_blank')}
                        >
                            <FileText size={12} className="mr-1" />
                            Descargar PPT
                        </Button>
                    )}
                </>
            )}
        </div>
    );

    // Stats
    const stats = {
        pending: works?.filter(w => w.status === 'En Evaluación' || w.status === 'Pending' || w.status === 'Pendiente').length || 0,
        approved: works?.filter(w => w.status === 'Aceptado').length || 0,
        total: works?.length || 0
    };

    if (loading) return <LoadingSpinner text="Cargando trabajos..." className="py-20" />;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-fadeIn pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="text-blue-600" />
                        Gestión Académica
                    </h1>
                    <p className="text-gray-600">Revisión, aprobación y programación de trabajos científicos.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={activeTab === 'results' ? 'primary' : 'outline'}
                        onClick={() => setActiveTab('results')}
                        className={`h-auto flex-col items-center justify-center p-2 rounded-xl border-2 transition-all gap-1 ${activeTab === 'results'
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105'
                            : 'border-dashed hover:border-blue-500 hover:bg-blue-50 text-gray-600'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={activeTab === 'results' ? 'text-yellow-300' : 'text-yellow-500'}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                        <span className={`text-xs font-bold ${activeTab === 'results' ? 'text-white' : 'text-gray-600'}`}>Ver Resultados</span>
                    </Button>
                    <Card className="px-4 py-2 flex items-center gap-3 bg-white border-blue-100">
                        <Clock size={20} className="text-orange-500" />
                        <div>
                            <div className="text-xs text-gray-500 uppercase font-bold">Pendientes</div>
                            <div className="text-lg font-bold text-gray-900">{stats.pending}</div>
                        </div>
                    </Card>
                    <Card className="px-4 py-2 flex items-center gap-3 bg-white border-green-100">
                        <CheckCircle size={20} className="text-green-500" />
                        <div>
                            <div className="text-xs text-gray-500 uppercase font-bold">Aceptados</div>
                            <div className="text-lg font-bold text-gray-900">{stats.approved}</div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-100 flex flex-col gap-4">
                    {/* Top Row: Tabs */}
                    <div className="flex justify-between items-center w-full overflow-x-auto">
                        <div className="flex bg-gray-100 p-1 rounded-lg w-auto">
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Por Revisar
                            </button>
                            <button
                                onClick={() => setActiveTab('approved')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'approved' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Aceptados
                            </button>
                            <button
                                onClick={() => setActiveTab('observation')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'observation' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Observados
                            </button>

                            <button
                                onClick={() => setActiveTab('rubrics')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'rubrics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Rúbricas
                            </button>
                            <button
                                onClick={() => setActiveTab('juries')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'juries' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Jurados
                            </button>
                            <button
                                onClick={() => setActiveTab('config')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'config' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Configuración
                            </button>
                        </div>
                    </div>

                    {/* Bottom Row: Filters & Search */}
                    {activeTab !== 'config' && activeTab !== 'rubrics' && activeTab !== 'juries' && activeTab !== 'results' && (
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-2 border-t border-gray-50">
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Filter size={16} className="text-gray-400" />
                                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                                <select
                                    className="border border-gray-200 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                                    value={selectedSpecialty}
                                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                                >
                                    <option value="all">Todas las especialidades</option>
                                    {specialties.map(spec => (
                                        <option key={spec} value={spec}>{spec}</option>
                                    ))}
                                </select>

                                {/* New Jury Count Filter */}
                                <select
                                    className="border border-gray-200 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                                    value={juryCountFilter}
                                    onChange={(e) => setJuryCountFilter(e.target.value)}
                                >
                                    <option value="all">Todos los trabajos</option>
                                    <option value="none">Sin Jurado (0)</option>
                                    <option value="1">1 Jurado</option>
                                    <option value="2">2 Jurados</option>
                                    <option value="3">3 Jurados</option>
                                </select>
                            </div>

                            <div className="flex gap-4 items-center w-full md:w-auto">
                                <div className="text-sm text-gray-500 font-medium whitespace-nowrap bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                                    Mostrando <strong>{sortedWorks.length}</strong> trabajos
                                </div>
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar autor, título o código..."
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                {activeTab === 'config' ? (
                    <div className="p-4">
                        <AcademicConfig />
                    </div>
                ) : activeTab === 'rubrics' ? (
                    <AcademicRubricConfig />
                ) : activeTab === 'juries' ? (
                    <AcademicJurers works={works} onUpdate={refetch} />
                ) : activeTab === 'results' ? (
                    <AcademicResults works={works} />
                ) : (
                    <Table
                        columns={columns}
                        data={sortedWorks}
                        onSort={requestSort}
                        sortConfig={sortConfig}
                        actions={renderActions}
                        onRowClick={(item) => {
                            if (activeTab === 'pending' || activeTab === 'observation') handleOpenReview(item);
                            else if (activeTab === 'approved') handleOpenDetails(item);
                        }}
                        emptyMessage={
                            <EmptyState
                                icon={BookOpen}
                                title="No hay trabajos en esta sección"
                                description="Selecciona otra pestaña o cambia los filtros de búsqueda."
                            />
                        }
                        className="border-0"
                    />
                )}
            </div>

            {/* Modals */}
            <WorkReviewModal
                isOpen={isReviewOpen}
                onClose={closeReview}
                work={selectedWork}
                onUpdate={refetch}
            />
            <AssignJuryModal
                isOpen={isJuryOpen}
                onClose={closeJury}
                work={selectedWork}
                onUpdate={refetch}
            />
            <AssignScheduleModal
                isOpen={isScheduleOpen}
                onClose={closeSchedule}
                work={selectedWork}
                onUpdate={refetch}
            />
            <WorkDetailsModal
                isOpen={isDetailsOpen}
                onClose={closeDetails}
                work={selectedWork}
            />
        </div>
    );
};

export default AcademicDashboard;
