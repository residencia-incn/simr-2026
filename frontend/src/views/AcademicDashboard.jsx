import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    CheckCircle,
    AlertCircle,
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
import AcademicResults from '../components/academic/AcademicResults';
import AcademicRubricConfig from '../components/academic/AcademicRubricConfig';
import AcademicJurers from '../components/academic/AcademicJurers';
import AcademicSpeakers from '../components/academic/AcademicSpeakers';
import AcademicConfiguration from '../components/academic/AcademicConfiguration';

const AcademicDashboard = () => {
    // Academic Committee always sees 'approved' as default and manages them
    const [activeTab, setActiveTab] = useState('approved');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('all');
    const [juryCountFilter, setJuryCountFilter] = useState('all');

    // Fetch Data
    const { data: works, loading, refetch } = useApi(api.works.getAll);
    const { data: settings } = useApi(api.academic.getSettings);

    const juryLimit = parseInt(settings?.find(s => s.key === 'jurados_por_trabajo')?.value || '3');

    // Modals State
    const { isOpen: isReviewOpen, open: openReview, close: closeReview } = useModal();
    const { isOpen: isJuryOpen, open: openJury, close: closeJury } = useModal();
    const { isOpen: isScheduleOpen, open: openSchedule, close: closeSchedule } = useModal();
    const { isOpen: isDetailsOpen, open: openDetails, close: closeDetails } = useModal();

    const [selectedWork, setSelectedWork] = useState(null);
    const [isReadOnlyReview, setIsReadOnlyReview] = useState(false);

    const handleOpenReview = (work, readOnly = false) => {
        setSelectedWork(work);
        setIsReadOnlyReview(readOnly);
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
        if (work.status?.toLowerCase() !== 'aceptado') return false; // Committee primarily manages accepted works in this dashboard

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

        return matchesSearch && matchesSpecialty && matchesJuryCount;
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
                    <span className="text-sm">{item.author}</span>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Estado',
            sortable: true,
            render: (item) => <Badge type="success">{item.status}</Badge>
        },
        {
            key: 'final_score',
            header: 'Calificación',
            sortable: true,
            className: "text-center",
            render: (item) => {
                const evaluations = item.evaluations || [];
                const avgScore = item.final_score || 0;

                if (evaluations.length === 0) {
                    return <span className="text-gray-400 text-xs italic">Pendiente</span>;
                }

                return (
                    <div className="flex flex-col items-center">
                        <div className="text-lg font-bold text-blue-700 leading-none">{(avgScore || 0).toFixed(2)}</div>
                        <div className="text-[9px] text-gray-500 uppercase font-bold mt-1">Promedio ({evaluations.length})</div>
                        <div className="flex gap-1 mt-1.5">
                            {evaluations.map((e, idx) => (
                                <div key={idx} className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white shadow-sm" title={`${e.jurorName}: ${e.totalScore} pts`}></div>
                            ))}
                        </div>
                    </div>
                );
            }
        }
    ];

    const renderActions = (item) => {
        const juryCount = item.jury ? (Array.isArray(item.jury) ? item.jury.length : 1) : 0;
        const pendingCount = Math.max(0, juryLimit - juryCount);
        const isFull = juryCount >= juryLimit;

        return (
            <div className="flex flex-col gap-1 items-end">
                <Button
                    size="xs"
                    variant={isFull ? "outline" : "primary"}
                    className={`w-full justify-center relative ${!isFull ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' : ''}`}
                    onClick={() => handleOpenJury(item)}
                >
                    <User size={12} className="mr-1" />
                    {isFull ? 'Cambiar Jurado' : 'Asignar Jurado'}

                    {!isFull && pendingCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center border border-white font-bold shadow-sm">
                            {pendingCount}
                        </span>
                    )}
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
                        variant="primary"
                        className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white border-blue-600 mt-1"
                        onClick={() => window.open(item.slidesUrl, '_blank')}
                    >
                        <FileText size={12} className="mr-1" />
                        Descargar PPT
                    </Button>
                )}
            </div>
        );
    };

    if (loading) return <LoadingSpinner text="Cargando panel académico..." className="py-20" />;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-fadeIn pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="text-blue-600" />
                        Gestión Académica
                    </h1>
                    <p className="text-gray-600">
                        Asignación, Revisión y Gestión programa del evento.
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                    <Card className="px-3 py-2 flex items-center gap-2 bg-white border-red-100 min-w-[120px]">
                        <AlertCircle size={18} className="text-red-500" />
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold">Sin Jurado</div>
                            <div className="text-lg font-bold text-gray-900">
                                {works?.filter(w => w.status?.toLowerCase() === 'aceptado' && (!w.jury || w.jury.length === 0)).length || 0}
                            </div>
                        </div>
                    </Card>
                    <Card className="px-3 py-2 flex items-center gap-2 bg-emerald-50 border-emerald-100 min-w-[140px]">
                        <BookOpen size={18} className="text-emerald-600" />
                        <div>
                            <div className="text-[10px] text-emerald-800 uppercase font-bold">Total Aceptados</div>
                            <div className="text-lg font-bold text-emerald-900">
                                {works?.filter(w => w.status?.toLowerCase() === 'aceptado').length || 0}
                            </div>
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
                                onClick={() => setActiveTab('approved')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'approved' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Aceptados
                            </button>
                            <button
                                onClick={() => setActiveTab('speakers')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'speakers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Ponentes
                            </button>
                            <button
                                onClick={() => setActiveTab('juries')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'juries' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Jurados
                            </button>
                            <button
                                onClick={() => setActiveTab('rubrics')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'rubrics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Rúbricas
                            </button>
                            <button
                                onClick={() => setActiveTab('results')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'results' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Resultados
                            </button>
                            <button
                                onClick={() => setActiveTab('config')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'config' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Configuración
                            </button>
                        </div>
                    </div>

                    {activeTab === 'approved' && (
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

                {activeTab === 'rubrics' ? (
                    <AcademicRubricConfig />
                ) : activeTab === 'juries' ? (
                    <AcademicJurers works={works} onUpdate={refetch} />
                ) : activeTab === 'speakers' ? (
                    <AcademicSpeakers />
                ) : activeTab === 'results' ? (
                    <AcademicResults works={works} />
                ) : activeTab === 'config' ? (
                    <AcademicConfiguration />
                ) : (
                    <Table
                        columns={columns}
                        data={sortedWorks}
                        onSort={requestSort}
                        sortConfig={sortConfig}
                        actions={renderActions}
                        onRowClick={(item) => handleOpenDetails(item)}
                        emptyMessage={
                            <EmptyState
                                icon={BookOpen}
                                title="No hay trabajos aceptados"
                                description="Los trabajos deben ser aceptados primero por el comité de investigación."
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
            <AssignJuryModal isOpen={isJuryOpen} onClose={closeJury} work={selectedWork} onUpdate={refetch} />
            <AssignScheduleModal isOpen={isScheduleOpen} onClose={closeSchedule} work={selectedWork} onUpdate={refetch} />
            <WorkDetailsModal isOpen={isDetailsOpen} onClose={closeDetails} work={selectedWork} />
        </div>
    );
};

export default AcademicDashboard;
