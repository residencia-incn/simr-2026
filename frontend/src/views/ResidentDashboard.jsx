import React from 'react';
import { PlusCircle, FileText, CheckCircle, Users, Clock, DollarSign } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { api } from '../services/api';
import Swal from 'sweetalert2';
import ResearchSubmission from './ResearchSubmission';
const INITIAL_ROADMAP = [];

import ResearchWorkDetailsModal from '../components/academic/ResearchWorkDetailsModal';
import UploadSlideModal from '../components/academic/UploadSlideModal';
import MyTreasuryView from '../components/treasury/MyTreasuryView';
import { useApi, useSortableData } from '../hooks';

const ResidentDashboard = ({ user, navigate }) => {
    // Modal State
    const [selectedWork, setSelectedWork] = React.useState(null);
    const [modalMode, setModalMode] = React.useState('view'); // 'view' | 'edit'
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);

    // View Mode: 'dashboard' | 'submission'
    const [viewMode, setViewMode] = React.useState('dashboard');
    const [submissionTypeId, setSubmissionTypeId] = React.useState(null);

    // Fetch all works using the Research API
    const { data, loading, refetch } = useApi(api.research.getMySubmissions);
    const userWorks = data || [];

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
        { key: 'type_name', header: 'Tipo', sortable: true },
        {
            key: 'submitted_at',
            header: 'Fecha',
            sortable: true,
            render: (item) => item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '-'
        },
        {
            key: 'status',
            header: 'Estado',
            sortable: true,
            render: (item) => (
                <Badge type={item.status?.toLowerCase() === 'aceptado' ? 'success' : item.status?.toLowerCase() === 'rechazado' ? 'error' : 'warning'}>
                    {item.status}
                </Badge>
            )
        }
    ];

    const handleNewSubmission = async () => {
        try {
            const types = await api.research.getTypes();
            const activeTypes = types.filter(t => t.is_active);

            if (activeTypes.length === 0) {
                Swal.fire('Atención', 'No hay convocatorias activas en este momento.', 'info');
                return;
            }

            // If only one, select it automatically
            if (activeTypes.length === 1) {
                setSubmissionTypeId(activeTypes[0].id);
                setViewMode('submission');
                return;
            }

            // If multiple, ask user
            const { value: typeId } = await Swal.fire({
                title: 'Selecciona el Tipo de Trabajo',
                input: 'select',
                inputOptions: activeTypes.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.name }), {}),
                inputPlaceholder: 'Selecciona una categoría',
                showCancelButton: true,
                confirmButtonText: 'Continuar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#2563eb'
            });

            if (typeId) {
                setSubmissionTypeId(parseInt(typeId));
                setViewMode('submission');
            }

        } catch (error) {
            console.error("Error fetching types:", error);
            Swal.fire('Error', 'No se pudieron cargar los tipos de trabajo.', 'error');
        }
    };

    const handleSaveWork = async (updatedWork) => {
        try {
            await api.works.update(updatedWork);
            // Refresh list (simplified for mock, in real app useApi would refetch)
            window.location.reload();
        } catch (error) {
            console.error("Error updating work", error);
        }
    };

    const handleOpenUpload = (work) => {
        setSelectedWork(work);
        setIsUploadModalOpen(true);
    };


    const renderActions = (item) => {
        const canEdit = ['BORRADOR', 'OBSERVADO', 'Pendiente', 'Pendiente', 'En Evaluación', 'Observado'].includes(item.status);
        const isAccepted = item.status?.toLowerCase() === 'aceptado';
        // Note: hasSlides check might need to be adjusted based on real backend data if files are loaded separately
        // For now we assume we check if files exist, but we might need to fetch files or check a flag
        // The endpoint create/update could return a has_slides flag. 
        // Or we just show "Subir/Gestionar Diapositivas" always

        return (
            <div className="flex flex-col gap-2 items-end">
                {canEdit && (
                    <Button
                        variant="ghost"
                        className="text-xs p-1 h-auto text-blue-600 hover:text-blue-800"
                        onClick={() => { setSelectedWork(item); setModalMode('edit'); setIsModalOpen(true); }}
                    >
                        {item.status === 'Observado' ? 'Corregir' : 'Editar'}
                    </Button>
                )}

                {isAccepted && (
                    <Button
                        variant={
                            !item.latest_slide ? "primary" :
                                item.latest_slide.status === 'APPROVED' ? 'ghost' :
                                    item.latest_slide.status === 'CORRECTION_REQUESTED' ? 'destructive' : // Keep variant but override via class
                                        'secondary'
                        }
                        className={`text-xs px-2 py-1 h-auto ${item.latest_slide?.status === 'APPROVED' ? 'text-green-600 bg-green-50 hover:bg-green-100' :
                                item.latest_slide?.status === 'CORRECTION_REQUESTED' ? '!bg-red-600 !text-white hover:!bg-red-700' : ''
                            }`}
                        onClick={() => handleOpenUpload(item)}
                    >
                        <span className="flex items-center gap-1">
                            {!item.latest_slide && <><FileText size={12} /> Subir Diapositiva</>}
                            {item.latest_slide?.status === 'PENDING' && <><Clock size={12} /> En Revisión (v{item.latest_slide.version})</>}
                            {item.latest_slide?.status === 'CORRECTION_REQUESTED' && <><CheckCircle size={12} className="rotate-45" /> Corrección Solicitada</>}
                            {item.latest_slide?.status === 'APPROVED' && <><CheckCircle size={12} /> Aprobado</>}
                        </span>
                    </Button>
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
    const acceptedCount = userWorks.filter(w => w.status?.toLowerCase() === 'aceptado').length;
    const pendingCount = userWorks.filter(w => ['enviado', 'en_revision', 'pendiente', 'en evaluación'].includes(w.status?.toLowerCase())).length;

    if (viewMode === 'submission') {
        return (
            <div className="container mx-auto max-w-7xl animate-fadeIn">
                <ResearchSubmission
                    typeId={submissionTypeId}
                    onCancel={() => setViewMode('dashboard')}
                    onSuccess={() => {
                        setViewMode('dashboard');
                        refetch(); // Reload and back to list
                    }}
                />
            </div>
        );
    }

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Hola, {user.name}</h2>
                    <p className="text-gray-600">Panel de Residente - {user.year}</p>
                </div>
                <div className="flex gap-3">
                    {user.eventRole === 'organizador' && (
                        <Button
                            variant={viewMode === 'treasury' ? 'primary' : 'outline'}
                            onClick={() => setViewMode(viewMode === 'treasury' ? 'dashboard' : 'treasury')}
                            className={viewMode === 'treasury' ? 'bg-indigo-600' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}
                        >
                            <DollarSign size={18} className="mr-2" />
                            {viewMode === 'treasury' ? 'Volver al Dashboard' : 'Mi Tesorería'}
                        </Button>
                    )}
                    <Button onClick={handleNewSubmission} className="bg-blue-600 hover:bg-blue-700 shadow-lg transform transition-all hover:-translate-y-1">
                        <PlusCircle size={18} className="mr-2" />
                        Nuevo Trabajo
                    </Button>
                </div>
            </div>



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

            {viewMode === 'treasury' ? (
                <MyTreasuryView user={user} />
            ) : (
                <>
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
                            interactiveRow={false}
                        />
                    </div>

                    <ResearchWorkDetailsModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        work={selectedWork}
                        onSuccess={() => refetch()}
                    />

                    <UploadSlideModal
                        isOpen={isUploadModalOpen}
                        onClose={() => setIsUploadModalOpen(false)}
                        work={selectedWork}
                        onSuccess={refetch}
                    />
                </>
            )}
        </div>
    );
};

export default ResidentDashboard;
