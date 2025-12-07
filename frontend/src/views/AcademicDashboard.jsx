import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    CheckCircle,
    AlertCircle,
    Clock,
    User,
    Calendar,
    Filter,
    Search
} from 'lucide-react';
import { api } from '../services/api';
import { useApi, useSortableData, useModal } from '../hooks';
import { Button, Card, Table, Badge, LoadingSpinner, EmptyState } from '../components/ui';
import WorkReviewModal from '../components/academic/WorkReviewModal';
import AssignJuryModal from '../components/academic/AssignJuryModal';
import AssignScheduleModal from '../components/academic/AssignScheduleModal';
import AcademicConfig from '../components/academic/AcademicConfig';

const AcademicDashboard = () => {
    // State
    const [activeTab, setActiveTab] = useState('pending'); // pending, approved, observation
    const [searchTerm, setSearchTerm] = useState('');

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

    // Derived Data
    const fileteredWorks = works ? works.filter(work => {
        const matchesSearch = work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            work.author.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab === 'pending') return work.status === 'En Evaluación' || work.status === 'Pending';
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
                    {item.jury && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-medium border border-purple-100">
                            <User size={10} /> Jurado Asignado
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
            key: 'scores',
            header: 'Puntaje',
            sortable: true,
            render: (item) => {
                if (!item.scores || item.scores.length === 0) return <span className="text-gray-400 text-sm">-</span>;
                const avg = item.scores.reduce((a, b) => a + b, 0) / item.scores.length;
                return <span className="font-bold text-sm">{avg.toFixed(1)}</span>;
            }
        }
    ];

    // Actions
    const renderActions = (item) => (
        <div className="flex flex-col gap-1 items-end">
            {(item.status === 'En Evaluación' || item.status === 'Observado' || item.status === 'Pending') && (
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
                </>
            )}
        </div>
    );

    // Stats
    const stats = {
        pending: works?.filter(w => w.status === 'En Evaluación' || w.status === 'Pending').length || 0,
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
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 items-center">
                    <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Por Revisar
                        </button>
                        <button
                            onClick={() => setActiveTab('approved')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'approved' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Aceptados
                        </button>
                        <button
                            onClick={() => setActiveTab('observation')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'observation' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Observados
                        </button>
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'config' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Configuración
                        </button>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar autor o título..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'config' ? (
                    <div className="p-4">
                        <AcademicConfig />
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        data={sortedWorks}
                        onSort={requestSort}
                        sortConfig={sortConfig}
                        actions={renderActions}
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
        </div>
    );
};

export default AcademicDashboard;
