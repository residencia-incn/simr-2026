import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    CheckCircle,
    Clock,
    FileText,
    Filter,
    Search
} from 'lucide-react';
import { api } from '../services/api';
import { useApi, useSortableData, useModal } from '../hooks';
import { Button, Card, Table, Badge, LoadingSpinner, EmptyState } from '../components/ui';
import WorkReviewModal from '../components/academic/WorkReviewModal';
import ResearchWorkDetailsModal from '../components/academic/ResearchWorkDetailsModal';
import ResearchConfig from './ResearchConfig';
import ResearchSubmission from './ResearchSubmission';
import ResearchFilesView from './ResearchFilesView';
import Swal from 'sweetalert2';

const ResearchDashboard = () => {
    // Research Dashboard only uses research-related tabs
    const [activeTab, setActiveTab] = useState('pending'); // default to pending view
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('all');

    // View Mode: 'dashboard' | 'submission'
    const [viewMode, setViewMode] = useState('dashboard');
    const [submissionTypeId, setSubmissionTypeId] = useState(null);

    // Fetch Data (using research submissions API)
    const { data, loading, refetch } = useApi(api.research.getSubmissions);
    const works = data || [];

    // Modals State
    const {
        isOpen: isReviewOpen,
        open: openReview,
        close: closeReview
    } = useModal();

    const {
        isOpen: isDetailsOpen,
        open: openDetails,
        close: closeDetails
    } = useModal();

    const [selectedWork, setSelectedWork] = useState(null);
    const [isReadOnlyReview, setIsReadOnlyReview] = useState(false);

    const handleOpenReview = (work, readOnly = false) => {
        setSelectedWork(work);
        setIsReadOnlyReview(readOnly);
        openReview();
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
        const author = work.author_name || '';
        const specialty = work.specialty || '';
        const lowerSearch = searchTerm.toLowerCase();

        const matchesSearch = title.toLowerCase().includes(lowerSearch) ||
            author.toLowerCase().includes(lowerSearch);
        const matchesSpecialty = selectedSpecialty === 'all' || specialty === selectedSpecialty;

        if (!matchesSearch || !matchesSpecialty) return false;

        if (activeTab === 'pending') return ['enviado', 'en_revision', 'pending', 'pendiente'].includes(work.status?.toLowerCase());
        if (activeTab === 'approved') return work.status?.toLowerCase() === 'aceptado';
        if (activeTab === 'observation') return ['observado', 'rechazado'].includes(work.status?.toLowerCase());

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
                    <div className="text-xs text-gray-500 mt-1">{item.specialty} • {item.type_name}</div>
                </div>
            )
        },
        {
            key: 'author_name',
            header: 'Autor',
            sortable: true,
            render: (item) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                        {(item.author_name || 'U').charAt(0)}
                    </div>
                    <span className="text-sm">{item.author_name || 'Sin nombre'}</span>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Estado',
            sortable: true,
            render: (item) => {
                let type = 'warning';
                if (item.status?.toLowerCase() === 'aceptado') type = 'success';
                if (['observado', 'rechazado'].includes(item.status?.toLowerCase())) type = 'error';
                return <Badge type={type}>{item.status}</Badge>;
            }
        },
        {
            key: 'submitted_at',
            header: 'Enviado',
            sortable: true,
            render: (item) => (
                <div className="text-xs text-gray-500">
                    <div>{item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '-'}</div>
                    <div className="text-[10px]">{item.submitted_at ? new Date(item.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
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
        }
    ];

    const renderActions = (item) => {
        const isPending = ['enviado', 'en_revision', 'pending', 'pendiente', 'en evaluación'].includes(item.status?.toLowerCase());
        const isReviewed = ['observado', 'rechazado', 'aceptado'].includes(item.status?.toLowerCase());

        return (
            <div className="flex flex-col gap-1 items-end">
                {isPending && (
                    <Button size="sm" onClick={() => handleOpenReview(item)}>
                        Revisar
                    </Button>
                )}

                {isReviewed && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetails(item)}
                    >
                        <FileText size={14} className="mr-1" />
                        {item.status?.toLowerCase() === 'aceptado' ? 'Ver Trabajo' : 'Ver Detalles'}
                    </Button>
                )}
            </div>
        );
    };

    // Stats
    const stats = {
        pending: works?.filter(w => ['enviado', 'en_revision', 'pending', 'pendiente'].includes(w.status?.toLowerCase())).length || 0,
        approved: works?.filter(w => w.status?.toLowerCase() === 'aceptado').length || 0
    };

    if (loading) return <LoadingSpinner text="Cargando trabajos..." className="py-20" />;

    // --- VIEW MODE: SUBMISSION ---
    if (viewMode === 'submission') {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl animate-fadeIn">
                <ResearchSubmission
                    typeId={submissionTypeId}
                    onCancel={() => setViewMode('dashboard')}
                    onSuccess={() => {
                        setViewMode('dashboard');
                        refetch(); // Reload works list
                    }}
                />
            </div>
        );
    }

    // --- VIEW MODE: DASHBOARD ---
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-fadeIn pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="text-blue-600" />
                        Gestión en Trabajos de Investigación
                    </h1>
                    <p className="text-gray-600">
                        Revisión, aprobación y programación de trabajos científicos.
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
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
                                onClick={() => setActiveTab('files')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'files' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Archivos
                            </button>
                            <button
                                onClick={() => setActiveTab('config')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'config' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Configuración
                            </button>
                        </div>
                    </div>

                    {activeTab !== 'config' && activeTab !== 'files' && (
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

                {activeTab === 'config' ? (
                    <div className="p-4">
                        <ResearchConfig />
                    </div>
                ) : activeTab === 'files' ? (
                    <div className="p-4">
                        <ResearchFilesView />
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        data={sortedWorks}
                        onSort={requestSort}
                        sortConfig={sortConfig}
                        actions={renderActions}
                        onRowClick={(item) => {
                            if (activeTab === 'pending') {
                                handleOpenReview(item, false);
                            } else {
                                handleOpenDetails(item);
                            }
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

            <WorkReviewModal
                isOpen={isReviewOpen}
                onClose={closeReview}
                work={selectedWork}
                onUpdate={refetch}
                readOnly={isReadOnlyReview}
            />

            <ResearchWorkDetailsModal
                isOpen={isDetailsOpen}
                onClose={closeDetails}
                work={selectedWork}
            />
        </div>
    );
};

export default ResearchDashboard;
