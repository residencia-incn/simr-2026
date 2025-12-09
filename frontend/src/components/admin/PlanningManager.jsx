import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Edit2, Users, CheckCircle, Clock, AlertCircle, Target, TrendingUp, MessageSquare, Eye } from 'lucide-react';
import { Button, Card, Modal, FormField, LoadingSpinner, EmptyState, ConfirmDialog } from '../ui';
import { api } from '../../services/api';
import { useApi } from '../../hooks';

const PlanningManager = ({ currentUser }) => {
    const [meetings, setMeetings] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [isEditingMeeting, setIsEditingMeeting] = useState(false);
    const [isEditingTask, setIsEditingTask] = useState(false);
    const [currentMeeting, setCurrentMeeting] = useState(null);
    const [currentTask, setCurrentTask] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewingMeetingDetails, setViewingMeetingDetails] = useState(null);

    // Load data
    const { data, loading, execute: loadData } = useApi(async () => {
        const [meetingsData, tasksData, usersData] = await Promise.all([
            api.planning.getMeetings(),
            api.planning.getTasks(),
            api.users.getAll()
        ]);
        return { meetings: meetingsData, tasks: tasksData, users: usersData };
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (data) {
            setMeetings(data.meetings);
            setTasks(data.tasks);
            setUsers(data.users);
        }
    }, [data]);

    // Calculate overall progress
    const overallProgress = tasks.length > 0
        ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
        : 0;

    const taskStats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        pending: tasks.filter(t => t.status === 'pending').length
    };

    // Meeting handlers
    const handleAddMeeting = () => {
        setCurrentMeeting({
            id: null,
            date: new Date().toISOString().split('T')[0],
            title: '',
            agreements: [''],
            attendees: [],
            createdBy: currentUser.id
        });
        setIsEditingMeeting(true);
    };

    const handleEditMeeting = (meeting) => {
        setCurrentMeeting({ ...meeting });
        setIsEditingMeeting(true);
    };

    const handleSaveMeeting = async () => {
        if (!currentMeeting.title || !currentMeeting.date) {
            alert('Por favor complete los campos requeridos');
            return;
        }

        await api.planning.saveMeeting(currentMeeting);
        await loadData();
        setIsEditingMeeting(false);
        setCurrentMeeting(null);
    };

    const handleDeleteMeeting = (id) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Eliminar Reunión',
            message: '¿Está seguro de eliminar esta reunión y todas sus tareas asociadas?',
            type: 'danger',
            onConfirm: async () => {
                await api.planning.deleteMeeting(id);
                await loadData();
                setConfirmDialog({ isOpen: false });
            }
        });
    };

    // Task handlers
    const handleAddTask = (meetingId) => {
        setCurrentTask({
            id: null,
            meetingId,
            title: '',
            description: '',
            assignedTo: '',
            assignedBy: currentUser.id,
            dueDate: new Date().toISOString().split('T')[0],
            priority: 'medium',
            progress: 0,
            status: 'pending',
            comments: []
        });
        setIsEditingTask(true);
    };

    const handleEditTask = (task) => {
        setCurrentTask({ ...task });
        setIsEditingTask(true);
    };

    const handleSaveTask = async () => {
        if (!currentTask.title || !currentTask.assignedTo) {
            alert('Por favor complete los campos requeridos');
            return;
        }

        await api.planning.saveTask(currentTask);
        await loadData();
        setIsEditingTask(false);
        setCurrentTask(null);
    };

    const handleDeleteTask = (id) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Eliminar Tarea',
            message: '¿Está seguro de eliminar esta tarea?',
            type: 'danger',
            onConfirm: async () => {
                await api.planning.deleteTask(id);
                await loadData();
                setConfirmDialog({ isOpen: false });
            }
        });
    };

    const getUserName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? user.name : 'Usuario desconocido';
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50';
            case 'in_progress': return 'text-blue-600 bg-blue-50';
            case 'pending': return 'text-gray-600 bg-gray-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const filteredTasks = filterStatus === 'all'
        ? tasks
        : tasks.filter(t => t.status === filterStatus);

    if (loading && !meetings.length) {
        return <div className="p-8 flex justify-center"><LoadingSpinner text="Cargando planificación..." /></div>;
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header with Progress Dashboard */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Target size={20} className="text-blue-600" />
                        Planificación del Evento
                    </h3>
                    <Button onClick={handleAddMeeting}>
                        <Plus size={18} className="mr-2" />
                        Nueva Reunión
                    </Button>
                </div>

                {/* Progress Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Progreso General</p>
                                <p className="text-3xl font-bold mt-1">{overallProgress}%</p>
                            </div>
                            <TrendingUp size={40} className="text-blue-200" />
                        </div>
                        <div className="mt-4 bg-blue-400/30 rounded-full h-2">
                            <div
                                className="bg-white rounded-full h-2 transition-all"
                                style={{ width: `${overallProgress}%` }}
                            />
                        </div>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                        <div className="flex items-center gap-3">
                            <CheckCircle size={24} className="text-green-600" />
                            <div>
                                <p className="text-xs text-green-600 font-medium">Completadas</p>
                                <p className="text-2xl font-bold text-green-700">{taskStats.completed}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-3">
                            <Clock size={24} className="text-blue-600" />
                            <div>
                                <p className="text-xs text-blue-600 font-medium">En Progreso</p>
                                <p className="text-2xl font-bold text-blue-700">{taskStats.inProgress}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gray-50 border-gray-200">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={24} className="text-gray-600" />
                            <div>
                                <p className="text-xs text-gray-600 font-medium">Pendientes</p>
                                <p className="text-2xl font-bold text-gray-700">{taskStats.pending}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Meetings and Tasks List */}
            <div className="flex-1 overflow-y-auto space-y-6">
                {meetings.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title="No hay reuniones registradas"
                        description="Comience creando una nueva reunión para gestionar acuerdos y tareas"
                        action={
                            <Button onClick={handleAddMeeting}>
                                <Plus size={18} className="mr-2" />
                                Nueva Reunión
                            </Button>
                        }
                    />
                ) : (
                    meetings.map(meeting => {
                        const meetingTasks = tasks.filter(t => t.meetingId === meeting.id);
                        const meetingProgress = meetingTasks.length > 0
                            ? Math.round(meetingTasks.reduce((sum, t) => sum + t.progress, 0) / meetingTasks.length)
                            : 0;

                        return (
                            <Card key={meeting.id} className="border-l-4 border-l-blue-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Calendar size={20} className="text-blue-600" />
                                            <h4 className="text-lg font-bold text-gray-800">{meeting.title}</h4>
                                            <span className="text-sm text-gray-500">
                                                {new Date(meeting.date).toLocaleDateString('es-PE', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>

                                        {meeting.agreements && meeting.agreements.length > 0 && (
                                            <div className="ml-8 mb-3">
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Acuerdos:</p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    {meeting.agreements.map((agreement, idx) => (
                                                        <li key={idx} className="text-sm text-gray-700">{agreement}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Meeting Progress */}
                                        <div className="ml-8 flex items-center gap-3">
                                            <span className="text-xs text-gray-500">Progreso de tareas:</span>
                                            <div
                                                className="flex-1 max-w-xs bg-gray-200 rounded-full h-2 cursor-pointer hover:bg-gray-300 transition-colors"
                                                onClick={() => setViewingMeetingDetails(meeting)}
                                                title="Click para ver detalles"
                                            >
                                                <div
                                                    className="bg-blue-600 rounded-full h-2 transition-all"
                                                    style={{ width: `${meetingProgress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-gray-700">{meetingProgress}%</span>
                                            <button
                                                onClick={() => setViewingMeetingDetails(meeting)}
                                                className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors"
                                                title="Ver detalles"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditMeeting(meeting)}>
                                            <Edit2 size={16} />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteMeeting(meeting.id)}>
                                            <Trash2 size={16} className="text-red-500" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Tasks for this meeting */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <h5 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Users size={16} />
                                            Tareas Asignadas ({meetingTasks.length})
                                        </h5>
                                        <Button size="sm" variant="outline" onClick={() => handleAddTask(meeting.id)}>
                                            <Plus size={14} className="mr-1" />
                                            Asignar Tarea
                                        </Button>
                                    </div>

                                    {meetingTasks.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic text-center py-2">
                                            No hay tareas asignadas para esta reunión
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {meetingTasks.map(task => (
                                                <div
                                                    key={task.id}
                                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium text-gray-800">{task.title}</span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                                                                {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                                                            </span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>
                                                                {task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-gray-600">
                                                            <span>Asignado a: <strong>{getUserName(task.assignedTo)}</strong></span>
                                                            <span>Vence: {new Date(task.dueDate).toLocaleDateString('es-PE')}</span>
                                                            <span>Progreso: <strong>{task.progress}%</strong></span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => handleEditTask(task)}>
                                                            <Edit2 size={14} />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)}>
                                                            <Trash2 size={14} className="text-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Meeting Edit Modal */}
            <Modal
                isOpen={isEditingMeeting}
                onClose={() => setIsEditingMeeting(false)}
                title={currentMeeting?.id ? 'Editar Reunión' : 'Nueva Reunión'}
                size="lg"
            >
                {currentMeeting && (
                    <div className="space-y-4">
                        <FormField
                            label="Título de la Reunión"
                            value={currentMeeting.title}
                            onChange={e => setCurrentMeeting({ ...currentMeeting, title: e.target.value })}
                            placeholder="Ej: Reunión de Coordinación General"
                            required
                        />
                        <FormField
                            label="Fecha"
                            type="date"
                            value={currentMeeting.date}
                            onChange={e => setCurrentMeeting({ ...currentMeeting, date: e.target.value })}
                            required
                        />

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Acuerdos Tomados</label>
                            {currentMeeting.agreements.map((agreement, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={agreement}
                                        onChange={e => {
                                            const newAgreements = [...currentMeeting.agreements];
                                            newAgreements[idx] = e.target.value;
                                            setCurrentMeeting({ ...currentMeeting, agreements: newAgreements });
                                        }}
                                        className="flex-1 p-2 border rounded-lg text-sm"
                                        placeholder={`Acuerdo ${idx + 1}`}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const newAgreements = currentMeeting.agreements.filter((_, i) => i !== idx);
                                            setCurrentMeeting({ ...currentMeeting, agreements: newAgreements });
                                        }}
                                    >
                                        <Trash2 size={16} className="text-red-500" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentMeeting({
                                    ...currentMeeting,
                                    agreements: [...currentMeeting.agreements, '']
                                })}
                            >
                                <Plus size={14} className="mr-1" />
                                Agregar Acuerdo
                            </Button>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t">
                            <Button variant="ghost" onClick={() => setIsEditingMeeting(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSaveMeeting}>
                                Guardar Reunión
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Task Edit Modal */}
            <Modal
                isOpen={isEditingTask}
                onClose={() => setIsEditingTask(false)}
                title={currentTask?.id ? 'Editar Tarea' : 'Nueva Tarea'}
                size="lg"
            >
                {currentTask && (
                    <div className="space-y-4">
                        <FormField
                            label="Título de la Tarea"
                            value={currentTask.title}
                            onChange={e => setCurrentTask({ ...currentTask, title: e.target.value })}
                            placeholder="Ej: Coordinar con proveedores de catering"
                            required
                        />
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                            <textarea
                                value={currentTask.description}
                                onChange={e => setCurrentTask({ ...currentTask, description: e.target.value })}
                                className="w-full p-2 border rounded-lg text-sm"
                                rows={3}
                                placeholder="Descripción detallada de la tarea..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Asignar a</label>
                                <select
                                    value={currentTask.assignedTo}
                                    onChange={e => setCurrentTask({ ...currentTask, assignedTo: e.target.value })}
                                    className="w-full p-2 border rounded-lg text-sm"
                                    required
                                >
                                    <option value="">Seleccionar usuario...</option>
                                    {users
                                        .filter(u => ['admin', 'academic', 'treasurer'].some(role => u.roles?.includes(role)))
                                        .map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.roles?.join(', ')})
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <FormField
                                label="Fecha de Vencimiento"
                                type="date"
                                value={currentTask.dueDate}
                                onChange={e => setCurrentTask({ ...currentTask, dueDate: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Prioridad</label>
                            <div className="flex gap-2">
                                {['low', 'medium', 'high'].map(priority => (
                                    <button
                                        key={priority}
                                        onClick={() => setCurrentTask({ ...currentTask, priority })}
                                        className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${currentTask.priority === priority
                                            ? priority === 'high'
                                                ? 'bg-red-100 border-red-500 text-red-700'
                                                : priority === 'medium'
                                                    ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                                                    : 'bg-green-100 border-green-500 text-green-700'
                                            : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                                            }`}
                                    >
                                        {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t">
                            <Button variant="ghost" onClick={() => setIsEditingTask(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSaveTask}>
                                Guardar Tarea
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
            />

            {/* Meeting Details Modal */}
            <Modal
                isOpen={viewingMeetingDetails !== null}
                onClose={() => setViewingMeetingDetails(null)}
                title="Detalles de la Reunión"
                size="xl"
            >
                {viewingMeetingDetails && (() => {
                    const meetingTasks = tasks.filter(t => t.meetingId === viewingMeetingDetails.id);
                    const meetingProgress = meetingTasks.length > 0
                        ? Math.round(meetingTasks.reduce((sum, t) => sum + t.progress, 0) / meetingTasks.length)
                        : 0;

                    return (
                        <div className="space-y-4">
                            {/* Meeting Header */}
                            <div className="pb-4 border-b">
                                <div className="flex items-center gap-3 mb-2">
                                    <Calendar size={20} className="text-blue-600" />
                                    <h3 className="text-xl font-bold text-gray-800">{viewingMeetingDetails.title}</h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {new Date(viewingMeetingDetails.date).toLocaleDateString('es-PE', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>

                                {/* Overall Progress */}
                                <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-blue-900">Progreso General</span>
                                        <span className="text-2xl font-bold text-blue-700">{meetingProgress}%</span>
                                    </div>
                                    <div className="bg-blue-200 rounded-full h-3">
                                        <div
                                            className="bg-blue-600 rounded-full h-3 transition-all"
                                            style={{ width: `${meetingProgress}%` }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                                        <div className="text-center">
                                            <span className="text-green-600 font-bold">{meetingTasks.filter(t => t.status === 'completed').length}</span>
                                            <span className="text-gray-600"> Completadas</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-blue-600 font-bold">{meetingTasks.filter(t => t.status === 'in_progress').length}</span>
                                            <span className="text-gray-600"> En Progreso</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-gray-600 font-bold">{meetingTasks.filter(t => t.status === 'pending').length}</span>
                                            <span className="text-gray-600"> Pendientes</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tasks List */}
                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                {meetingTasks.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No hay tareas asignadas para esta reunión</p>
                                ) : (
                                    meetingTasks.map(task => {
                                        const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

                                        return (
                                            <Card
                                                key={task.id}
                                                className={`border-l-4 ${task.status === 'completed'
                                                        ? 'border-l-green-500'
                                                        : task.status === 'in_progress'
                                                            ? 'border-l-blue-500'
                                                            : isOverdue
                                                                ? 'border-l-red-500'
                                                                : 'border-l-gray-300'
                                                    }`}
                                            >
                                                <div className="space-y-3">
                                                    {/* Task Header */}
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-gray-800 mb-1">{task.title}</h4>
                                                            {task.description && (
                                                                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2 ml-4">
                                                            <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getPriorityColor(task.priority)}`}>
                                                                {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                                                            </span>
                                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                                                                {task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Task Info */}
                                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <Users size={12} />
                                                            <strong>{getUserName(task.assignedTo)}</strong>
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            Vence: {new Date(task.dueDate).toLocaleDateString('es-PE')}
                                                            {isOverdue && <span className="text-red-600 font-bold ml-1">(Vencida)</span>}
                                                        </span>
                                                        {task.comments && task.comments.length > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <MessageSquare size={12} />
                                                                {task.comments.length} comentario{task.comments.length !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                                            <div
                                                                className={`h-2.5 rounded-full transition-all ${task.progress === 100
                                                                        ? 'bg-green-600'
                                                                        : task.progress > 0
                                                                            ? 'bg-blue-600'
                                                                            : 'bg-gray-400'
                                                                    }`}
                                                                style={{ width: `${task.progress}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-700 min-w-[45px] text-right">
                                                            {task.progress}%
                                                        </span>
                                                    </div>

                                                    {/* Comments */}
                                                    {task.comments && task.comments.length > 0 && (
                                                        <div className="pt-3 border-t border-gray-100">
                                                            <h5 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                                                                <MessageSquare size={12} />
                                                                Comentarios ({task.comments.length})
                                                            </h5>
                                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                                {task.comments.map((comment, idx) => (
                                                                    <div key={idx} className="bg-gray-50 p-2 rounded border border-gray-200">
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <span className="text-xs font-medium text-gray-600">
                                                                                {new Date(comment.timestamp).toLocaleString('es-PE')}
                                                                            </span>
                                                                            <span className="text-xs font-bold text-blue-600">
                                                                                {comment.progress}%
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-700">{comment.text}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
};

export default PlanningManager;
