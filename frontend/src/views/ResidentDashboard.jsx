import React from 'react';
import { PlusCircle, FileText, CheckCircle, Users, Clock } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { api } from '../services/api';
import { INITIAL_ROADMAP } from '../data/mockData';

import WorkModal from '../components/academic/WorkModal';
import { useApi, useSortableData } from '../hooks';

const ResidentDashboard = ({ user, navigate }) => {
    // Modal State
    const [selectedWork, setSelectedWork] = React.useState(null);
    const [modalMode, setModalMode] = React.useState('view'); // 'view' | 'edit'
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    // Fetch all works using the API
    const { data: works, loading } = useApi(api.works.getAll);

    // Filter works by current user
    // Now using robust ID matching, falling back to name for legacy mock data support
    const userWorks = works ? works.filter(w => {
        if (w.authorId && user.id) {
            return w.authorId === user.id;
        }
        // Fallback for legacy mock data without authorId
        return w.author.includes(user.name.split(" ")[1]);
    }) : [];

    // Use custom hook for sorting
    const { items: sortedWorks, requestSort, sortConfig } = useSortableData(userWorks);

    const columns = [
        { key: 'id', header: 'Código', sortable: true, className: 'font-mono text-gray-600' },
        {
            key: 'title',
            header: 'Título',
            sortable: true,
            className: 'font-medium text-gray-900',
            render: (item) => (
                <span className="font-medium text-gray-900">
                    {item.title}
                </span>
            )
        },
        { key: 'type', header: 'Tipo', sortable: true },
        {
            key: 'status',
            header: 'Estado',
            sortable: true,
            render: (item) => (
                <Badge type={item.status === 'Aceptado' ? 'success' : item.status === 'Rechazado' ? 'error' : 'warning'}>
                    {item.status}
                </Badge>
            )
        }
    ];

    const handleSaveWork = async (updatedWork) => {
        try {
            await api.works.update(updatedWork);
            // Refresh list (simplified for mock, in real app useApi would refetch)
            window.location.reload();
        } catch (error) {
            console.error("Error updating work", error);
        }
    };

    // File Upload handling
    const fileInputRef = React.useRef(null);
    const [uploadingId, setUploadingId] = React.useState(null);

    const handleFileSelect = async (event, workId) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadingId(workId);

        // Simulate upload delay
        setTimeout(async () => {
            // In a real app, we would upload to storage here and get a URL back
            // For now, we simulate a URL
            const slidesUrl = `https://storage.googleapis.com/simr-2026/slides/${workId}_${Date.now()}.pdf`;

            try {
                // Find work to update
                const workToUpdate = works.find(w => w.id === workId);
                if (workToUpdate) {
                    const updatedWork = {
                        ...workToUpdate,
                        slidesUrl: slidesUrl,
                        slidesUpdatedAt: new Date().toISOString()
                    };
                    await api.works.update(updatedWork);
                    window.location.reload(); // Refresh to see changes
                }
            } catch (error) {
                console.error("Error updating slides", error);
            } finally {
                setUploadingId(null);
                // Clear input
                event.target.value = '';
            }
        }, 1500);
    };

    const triggerFileUpload = (workId) => {
        // Store the workId we are uploading for
        fileInputRef.current.setAttribute('data-work-id', workId);
        fileInputRef.current.click();
    };


    const renderActions = (item) => {
        const canEdit = item.status === 'Observado' || item.status === 'Pendiente' || item.status === 'En Evaluación';
        const isAccepted = item.status === 'Aceptado';
        const isUploading = uploadingId === item.id;
        const hasSlides = !!item.slidesUrl;

        return (
            <div className="flex flex-col gap-2 items-end">
                {canEdit && (
                    <Button
                        variant="ghost"
                        className="text-xs p-1 h-auto text-blue-600 hover:text-blue-800"
                        onClick={() => { setSelectedWork(item); setModalMode('edit'); setIsModalOpen(true); }}
                    >
                        Editar
                    </Button>
                )}

                {isAccepted && (
                    <>
                        <Button
                            variant={hasSlides ? "outline" : "primary"}
                            className={`text-xs px-2 py-1 h-auto ${hasSlides ? 'text-green-600 border-green-200 bg-green-50' : ''}`}
                            disabled={isUploading}
                            onClick={() => triggerFileUpload(item.id)}
                        >
                            {isUploading ? (
                                <span className="flex items-center gap-1">
                                    <LoadingSpinner size="sm" /> Subiendo...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    {hasSlides ? <CheckCircle size={12} /> : <FileText size={12} />}
                                    {hasSlides ? 'Actualizar Diapositivas' : 'Subir Diapositivas'}
                                </span>
                            )}
                        </Button>
                        {hasSlides && (
                            <div className="text-[10px] text-green-600">
                                Enviado: {new Date(item.slidesUpdatedAt).toLocaleDateString()}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" message="Cargando tus trabajos..." />
            </div>
        );
    }

    // Stats calculation
    const acceptedCount = userWorks.filter(w => w.status === 'Aceptado').length;
    const pendingCount = userWorks.filter(w => w.status === 'En Evaluación' || w.status === 'Pendiente').length;

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Hola, {user.name}</h2>
                    <p className="text-gray-600">Panel de Residente - {user.year}</p>
                </div>
                <Button onClick={() => navigate('submit-work')}>
                    <PlusCircle size={18} className="mr-2" />
                    Nuevo Trabajo
                </Button>
            </div>

            {/* Hidden File Input for Slides */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.ppt,.pptx"
                onChange={(e) => {
                    const workId = fileInputRef.current.getAttribute('data-work-id');
                    handleFileSelect(e, workId);
                }}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-700">
                        <FileText />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{userWorks.length}</div>
                        <div className="text-sm text-gray-600">Trabajos Enviados</div>
                    </div>
                </Card>
                <Card className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full text-green-700">
                        <CheckCircle />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{acceptedCount}</div>
                        <div className="text-sm text-gray-600">Aceptados</div>
                    </div>
                </Card>
                <Card className="flex items-center gap-4">
                    <div className="bg-orange-100 p-3 rounded-full text-orange-700">
                        <Users />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{pendingCount}</div>
                        <div className="text-sm text-gray-600">En revisión</div>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 border-l-4 border-l-purple-500 bg-purple-50">
                    <div className="bg-purple-100 p-3 rounded-full text-purple-700">
                        <Clock />
                    </div>
                    <div>
                        <div className="text-sm text-purple-800 font-bold uppercase">Próximo Evento</div>
                        {(() => {
                            const now = new Date();
                            const nextEvent = INITIAL_ROADMAP
                                .filter(e => new Date(e.date) >= now)
                                .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

                            if (nextEvent) {
                                return (
                                    <>
                                        <div className="text-sm font-bold text-gray-900 truncate max-w-[150px]" title={nextEvent.title}>{nextEvent.title}</div>
                                        <div className="text-xs text-gray-600">Vence: {new Date(nextEvent.date).toLocaleDateString()}</div>
                                    </>
                                );
                            }
                            return <div className="text-sm text-gray-500">No hay eventos próximos</div>;
                        })()}
                    </div>
                </Card>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-white">
                    <h3 className="font-bold text-gray-900 text-lg">Mis Trabajos</h3>
                </div>

                <Table
                    columns={columns}
                    data={sortedWorks}
                    onSort={requestSort}
                    sortConfig={sortConfig}
                    actions={renderActions}
                    emptyMessage="No has enviado trabajos aún."
                    onRowClick={(item) => { setSelectedWork(item); setModalMode('view'); setIsModalOpen(true); }}
                    className="border-0 rounded-none shadow-none"
                    interactiveRow={false} // Disable row click to avoid conflict with buttons if needed, or handle carefuly
                />
            </div>

            <WorkModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                work={selectedWork}
                mode={modalMode}
                onSave={modalMode === 'edit' ? handleSaveWork : undefined}
            />
        </div>
    );
};

export default ResidentDashboard;
