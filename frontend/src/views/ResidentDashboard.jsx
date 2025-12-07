import React from 'react';
import { PlusCircle, FileText, CheckCircle, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { api } from '../services/api';

import WorkModal from '../components/academic/WorkModal';
import { useApi, useSortableData } from '../hooks';

const ResidentDashboard = ({ user, navigate }) => {
    // Modal State
    const [selectedWork, setSelectedWork] = React.useState(null);
    const [modalMode, setModalMode] = React.useState('view'); // 'view' | 'edit'
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    // Fetch all works using the API
    const { data: works, loading } = useApi(api.works.getAll);

    // Filter works by current user (using simplified name matching logic for mock)
    // In a real app, the API would filtering by userId or return only user's works
    const userWorks = works ? works.filter(w => w.author.includes(user.name.split(" ")[1])) : [];

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
                <button
                    onClick={() => { setSelectedWork(item); setModalMode('view'); setIsModalOpen(true); }}
                    className="text-left hover:text-blue-600 hover:underline focus:outline-none transition-colors"
                >
                    {item.title}
                </button>
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

    const renderActions = (item) => {
        const canEdit = item.status === 'Observado' || item.status === 'Pendiente' || item.status === 'En Evaluación';
        return (
            <Button
                variant="ghost"
                className={`text-xs p-1 h-auto ${canEdit ? 'text-blue-600 hover:text-blue-800' : 'text-gray-300 cursor-not-allowed'}`}
                disabled={!canEdit}
                onClick={() => { setSelectedWork(item); setModalMode('edit'); setIsModalOpen(true); }}
            >
                Edita
            </Button>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div className="bg-purple-100 p-3 rounded-full text-purple-700">
                        <Users />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">2</div>
                        <div className="text-sm text-gray-600">Talleres Inscritos</div>
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
                    className="border-0 rounded-none shadow-none"
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
