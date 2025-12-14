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
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

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

    // Sort meetings by date descending
    const sortedMeetings = [...meetings].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentMeetings = sortedMeetings.slice(0, 4);
    const previousMeetings = sortedMeetings.slice(4);

    // Meeting handlers
    const handleAddMeeting = () => {
        setCurrentMeeting({
            id: null,
            date: new Date().toISOString().split('T')[0],
            startTime: '', // New field
            title: '',
            startTime: '',
            status: 'open', // New: Meetings start as open
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

    const handlePrintMeeting = (meeting) => {
        const meetingTasks = tasks.filter(t => t.meetingId === meeting.id);
        const meetingContent = `
            <html>
            <head>
                <title>Acta de Reunión - ${meeting.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                    h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
                    h2 { color: #374151; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
                    .header { margin-bottom: 30px; }
                    .meta { color: #666; font-style: italic; margin-bottom: 20px; }
                    ul { margin-top: 10px; }
                    li { margin-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f3f4f6; color: #374151; }
                    .footer { margin-top: 50px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Acta de Reunión</h1>
                    <div class="meta">
                        <strong>Título:</strong> ${meeting.title}<br>
                        <strong>Fecha:</strong> ${new Date(meeting.date).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}<br>
                        ${meeting.startTime ? `<strong>Hora de Inicio:</strong> ${meeting.startTime}<br>` : ''}
                    </div>
                </div>

                <h2>Acuerdos</h2>
                ${meeting.agreements && meeting.agreements.length > 0
                ? `<ul>${meeting.agreements.map(a => `<li>${a}</li>`).join('')}</ul>`
                : '<p>No se registraron acuerdos específicos.</p>'
            }

                <h2>Tareas Asignadas</h2>
                ${meetingTasks.length > 0
                ? `<table>
                            <thead>
                                <tr>
                                    <th>Tarea</th>
                                    <th>Asignado a</th>
                                    <th>Vence</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${meetingTasks.map(t => `
                                    <tr>
                                        <td>${t.title}</td>
                                        <td>${getUserName(t.assignedTo)}</td>
                                        <td>${new Date(t.dueDate).toLocaleDateString('es-PE')}</td>
                                        <td>${t.status === 'completed' ? 'Completada' : t.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                       </table>`
                : '<p>No se asignaron tareas en esta reunión.</p>'
            }

                <div class="footer">
                    Generado por SIMR 2026 Platform - ${new Date().toLocaleString('es-PE')}
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(meetingContent);
        printWindow.document.close();
        printWindow.print();
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

    const MeetingItem = ({ meeting, isRecent }) => {
        const meetingTasks = tasks.filter(t => t.meetingId === meeting.id);
        const meetingProgress = meetingTasks.length > 0
            ? Math.round(meetingTasks.reduce((sum, t) => sum + t.progress, 0) / meetingTasks.length)
            : 0;

        return (
            <div
                className={`bg-white rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group ${!isRecent ? 'opacity-80 hover:opacity-100' : ''}`}
                onClick={() => setViewingMeetingDetails(meeting)}
            >
                <div className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">{meeting.title}</h4>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(meeting.date).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                    {meeting.startTime && (
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {meeting.startTime}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Progress */}
                        <div className="hidden md:block w-32">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">Progreso</span>
                                <span className="font-bold text-gray-700">{meetingProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className="bg-blue-600 rounded-full h-1.5 transition-all"
                                    style={{ width: `${meetingProgress}%` }}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => handleEditMeeting(meeting)}>
                                <Edit2 size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteMeeting(meeting.id)}>
                                <Trash2 size={16} className="text-red-500" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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

                {/* Progress Dashboard - Same as before */}
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

            {/* Meetings List */}
            <div className="flex-1 overflow-y-auto space-y-8 pr-2">
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
                    <>
                        {/* Recent Meetings */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2 mb-2">
                                <Clock size={16} /> Recientes
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {recentMeetings.map(meeting => (
                                    <MeetingItem key={meeting.id} meeting={meeting} isRecent={true} />
                                ))}
                            </div>
                        </div>

                        {/* Previous Meetings */}
                        {previousMeetings.length > 0 && (() => {
                            const totalPages = Math.ceil(previousMeetings.length / ITEMS_PER_PAGE);
                            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                            const currentPreviousMeetings = previousMeetings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                            return (
                                <div className="space-y-3 pt-4 border-t">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2 mb-2">
                                        <Calendar size={16} /> Reuniones Anteriores
                                    </h4>

                                    <div className="space-y-3">
                                        {currentPreviousMeetings.map(meeting => (
                                            <MeetingItem key={meeting.id} meeting={meeting} isRecent={false} />
                                        ))}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center items-center gap-4 mt-4 text-sm text-gray-600">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className={`px-3 py-1 rounded-md border ${currentPage === 1 ? 'bg-gray-50 text-gray-300' : 'bg-white hover:bg-gray-50'}`}
                                            >
                                                Anterior
                                            </button>
                                            <span>Página {currentPage} de {totalPages}</span>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className={`px-3 py-1 rounded-md border ${currentPage === totalPages ? 'bg-gray-50 text-gray-300' : 'bg-white hover:bg-gray-50'}`}
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </>
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
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Fecha"
                                type="date"
                                value={currentMeeting.date}
                                onChange={e => setCurrentMeeting({ ...currentMeeting, date: e.target.value })}
                                required
                            />
                            <FormField
                                label="Hora de Inicio"
                                type="time"
                                value={currentMeeting.startTime || ''}
                                onChange={e => setCurrentMeeting({ ...currentMeeting, startTime: e.target.value })}
                                placeholder="--:--"
                            />
                        </div>

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

            {/* Task Edit Modal -- Same as before, keeping as is */}
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



            {/* Meeting Details Modal (Enhanced) */}
            <Modal
                isOpen={viewingMeetingDetails !== null}
                onClose={() => setViewingMeetingDetails(null)}
                title="Detalles de la Reunión"
                size="3xl"
            >
                {viewingMeetingDetails && (() => {
                    const meetingTasks = tasks.filter(t => t.meetingId === viewingMeetingDetails.id);
                    const meetingProgress = meetingTasks.length > 0
                        ? Math.round(meetingTasks.reduce((sum, t) => sum + t.progress, 0) / meetingTasks.length)
                        : 0;

                    // Ensure status exists (default to 'open' if undefined)
                    const isClosed = viewingMeetingDetails.status === 'closed';

                    const handleEndMeeting = async () => {
                        setConfirmDialog({
                            isOpen: true,
                            title: 'Terminar Reunión',
                            message: '¿Está seguro de terminar la reunión? No podrá realizar más modificaciones.',
                            type: 'warning',
                            onConfirm: async () => {
                                const updatedMeeting = { ...viewingMeetingDetails, status: 'closed' };
                                await api.planning.saveMeeting(updatedMeeting);
                                await loadData();
                                setViewingMeetingDetails(updatedMeeting);
                                setConfirmDialog({ isOpen: false });
                            }
                        });
                    };

                    const handleToggleAttendance = async (userId, newStatus) => {
                        if (isClosed) return;

                        // Parse existing attendees or default to []
                        // Assuming attendees store: { userId, status: 'verified' | 'pending' | 'absent' }
                        // Or simplifying: if in array, verified.

                        // Let's implement robust object structure for attendees
                        const currentAttendees = Array.isArray(viewingMeetingDetails.attendees)
                            ? viewingMeetingDetails.attendees
                            : [];

                        let newAttendees;
                        const existingIdx = currentAttendees.findIndex(a => (a.userId || a) === userId);

                        if (existingIdx >= 0) {
                            // Update existing
                            newAttendees = [...currentAttendees];
                            if (typeof newAttendees[existingIdx] === 'object') {
                                newAttendees[existingIdx] = { ...newAttendees[existingIdx], status: newStatus };
                            } else {
                                // Convert string ID to object
                                newAttendees[existingIdx] = { userId, status: newStatus };
                            }
                        } else {
                            // Add new
                            newAttendees = [...currentAttendees, { userId, status: newStatus }];
                        }

                        const updatedMeeting = { ...viewingMeetingDetails, attendees: newAttendees };
                        await api.planning.saveMeeting(updatedMeeting);
                        await loadData();
                        setViewingMeetingDetails(updatedMeeting);
                    };

                    // Filter relevant users (e.g., committee members) or just show all for now to filter
                    const relevantUsers = users.filter(u =>
                        ['admin', 'academic', 'treasurer', 'secretary'].some(r => u.roles?.includes(r)) ||
                        ['admin', 'academic', 'treasurer'].includes(u.role)
                    );

                    return (
                        <div className="space-y-6">
                            {/* Meeting Header */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{viewingMeetingDetails.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <span>
                                                {new Date(viewingMeetingDetails.date).toLocaleDateString('es-PE', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            {viewingMeetingDetails.startTime && (
                                                <>
                                                    <span>•</span>
                                                    <span className="font-medium text-gray-700">{viewingMeetingDetails.startTime}</span>
                                                </>
                                            )}
                                            {isClosed && (
                                                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold ml-2">
                                                    FINALIZADA
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {!isClosed && (
                                        <Button
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={handleEndMeeting}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                                            Terminar Reunión
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        onClick={() => handlePrintMeeting(viewingMeetingDetails)}
                                        className="gap-2"
                                    >
                                        <div className="w-4 h-4 rounded-sm border-2 border-current" />
                                        Imprimir Acta
                                    </Button>
                                </div>
                            </div>

                            {/* Main Grid: Agreements & Participants */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Agreements Column */}
                                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                                    <div className="flex items-center gap-2 mb-4 text-blue-800">
                                        <MessageSquare size={18} />
                                        <h4 className="font-bold">Acuerdos Tomados</h4>
                                    </div>

                                    {viewingMeetingDetails.agreements && viewingMeetingDetails.agreements.length > 0 ? (
                                        <ul className="space-y-3">
                                            {viewingMeetingDetails.agreements.map((agreement, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                                    <span>{agreement}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400 text-sm italic">
                                            No hay acuerdos registrados
                                        </div>
                                    )}
                                </div>

                                {/* Participants Column */}
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                    <div className="flex items-center gap-2 mb-4 text-gray-800">
                                        <Users size={18} />
                                        <h4 className="font-bold">Participantes</h4>
                                    </div>

                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                        {relevantUsers.length === 0 ? (
                                            <div className="text-center py-8 text-gray-400 text-sm italic">
                                                No hay usuarios disponibles
                                            </div>
                                        ) : (
                                            relevantUsers.map(user => {
                                                // Find status
                                                const att = Array.isArray(viewingMeetingDetails.attendees)
                                                    ? viewingMeetingDetails.attendees.find(a => (a.userId || a) === user.id)
                                                    : null;
                                                const isVerified = att && (typeof att === 'object' ? att.status === 'verified' : true); // Legacy string supp

                                                return (
                                                    <div key={user.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-200">
                                                        <span className="text-gray-700 truncate max-w-[150px]" title={user.name}>
                                                            {user.name}
                                                        </span>

                                                        {isClosed ? (
                                                            isVerified ? (
                                                                <span className="text-green-600 text-xs font-bold flex items-center gap-1">
                                                                    <CheckCircle size={12} /> Asistió
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">Ausente</span>
                                                            )
                                                        ) : (
                                                            <button
                                                                onClick={() => handleToggleAttendance(user.id, isVerified ? 'absent' : 'verified')}
                                                                className={`p-1.5 rounded-full transition-all ${isVerified
                                                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                                                                    }`}
                                                                title={isVerified ? "Confirmado (Click para deshacer)" : "Validar asistencia"}
                                                            >
                                                                {isVerified ? <CheckCircle size={18} /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-current" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 italic text-center">
                                        La secretaria debe validar manualmente la asistencia de cada miembro.
                                    </p>
                                </div>
                            </div>

                            {/* Tasks Section (Full Width) */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-gray-900">Progreso de Tareas</h4>
                                    <span className="font-bold text-blue-600 text-sm">{meetingProgress}%</span>
                                </div>
                                <div className="bg-gray-100 rounded-full h-2 mb-6">
                                    <div
                                        className="bg-blue-600 rounded-full h-2 transition-all"
                                        style={{ width: `${meetingProgress}%` }}
                                    />
                                </div>

                                <div className="border rounded-xl overflow-hidden">
                                    <div className="bg-white p-3 border-b flex justify-between items-center">
                                        <span className="font-bold text-sm text-gray-700">Tareas Asignadas ({meetingTasks.length})</span>
                                        {!isClosed && (
                                            <button
                                                onClick={() => {
                                                    setViewingMeetingDetails(null);
                                                    handleAddTask(viewingMeetingDetails.id);
                                                }}
                                                className="text-gray-600 hover:text-blue-600 text-sm flex items-center gap-1 font-medium transition-colors"
                                            >
                                                <Plus size={16} /> Nueva Tarea
                                            </button>
                                        )}
                                    </div>

                                    <div className="bg-white min-h-[100px] max-h-[300px] overflow-y-auto">
                                        {meetingTasks.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                                <p className="text-sm">No hay tareas asignadas</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-100">
                                                {meetingTasks.map(task => (
                                                    <div key={task.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium text-gray-800 text-sm">{task.title}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                                    {getUserName(task.assignedTo)}
                                                                </span>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${task.status === 'completed' ? 'border-green-200 text-green-700 bg-green-50' :
                                                                    task.status === 'in_progress' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                                                                        'border-gray-200 text-gray-600 bg-gray-50'
                                                                    }`}>
                                                                    {task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* View Task Button? Or maybe simple status toggle if we had space. For now simple view */}
                                                        {/* Only allow editing if meeting is open? Usually tasks live beyond meeting closing potentially. 
                                                            Let's assume tasks can still be updated status-wise, but maybe not added/deleted if meeting closed?
                                                            The user requirement said "no se podra modificar" referring to agreements/tasks assignment.
                                                            So we hide edit buttons if closed? Or just Add button which we did. 
                                                        */}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    );
                })()}
            </Modal>

            {/* Confirm Dialog - Placed last to ensure it renders on top */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
            />
        </div>

    );
};

export default PlanningManager;
