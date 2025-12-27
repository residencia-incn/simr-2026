import React, { useState, useEffect } from 'react';
import { ListTodo, CheckCircle, Clock, AlertCircle, Calendar, MessageSquare, UserCheck, Users } from 'lucide-react';
import { Modal, Button, Card, LoadingSpinner } from '../ui';
import { api } from '../../services/api';
import { useApi } from '../../hooks';

const TasksQuickAccess = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [newProgress, setNewProgress] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [activeMeetings, setActiveMeetings] = useState([]);
    const [loadingMeetings, setLoadingMeetings] = useState(false);

    // Check if user is an organizer (Staff) - RBAC
    const isOrganizer = user?.eventRole === 'organizador' ||
        user?.eventRoles?.includes('organizador');

    // Load user's tasks
    const { data, loading, execute: loadTasks } = useApi(async () => {
        if (!isOrganizer) return [];
        return await api.planning.getMyTasks(user.id);
    });

    useEffect(() => {
        if (isOrganizer) {
            loadTasks();
        }
    }, [isOrganizer]);

    useEffect(() => {
        if (data) {
            setTasks(data);
        }
    }, [data]);

    // Load active meetings
    useEffect(() => {
        if (isOrganizer && isOpen) {
            loadActiveMeetings();
        }
    }, [isOrganizer, isOpen]);

    const loadActiveMeetings = async () => {
        try {
            setLoadingMeetings(true);
            const meetings = await api.planning.getActiveMeetings();
            setActiveMeetings(meetings);
        } catch (error) {
            console.error('Error loading active meetings:', error);
        } finally {
            setLoadingMeetings(false);
        }
    };

    const handleMarkAttendance = async (meeting) => {
        try {
            await api.planning.markAttendance(meeting.id, user.id, user.name);
            alert('✅ Asistencia marcada correctamente');
            await loadActiveMeetings(); // Reload to show updated status
        } catch (error) {
            alert(error.message || 'Error al marcar asistencia');
        }
    };

    const getAttendanceStatus = (meeting) => {
        if (!meeting.attendance) return null;
        const userAttendance = meeting.attendance.find(a => a.userId === user.id);
        return userAttendance;
    };

    const handleOpenTask = (task) => {
        setSelectedTask(task);
        setNewProgress(task.progress);
        setNewComment('');
        setIsUpdating(true);
    };

    const handleUpdateTask = async () => {
        if (newProgress !== selectedTask.progress && !newComment.trim()) {
            alert('Por favor agregue un comentario explicando el cambio de progreso');
            return;
        }

        await api.planning.updateTaskProgress(
            selectedTask.id,
            newProgress,
            newComment.trim(),
            user.id
        );

        await loadTasks();
        setIsUpdating(false);
        setSelectedTask(null);
        setNewComment('');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50 border-green-200';
            case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'pending': return 'text-gray-600 bg-gray-50 border-gray-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle size={18} className="text-green-600" />;
            case 'in_progress': return <Clock size={18} className="text-blue-600" />;
            case 'pending': return <AlertCircle size={18} className="text-gray-600" />;
            default: return <AlertCircle size={18} className="text-gray-600" />;
        }
    };

    const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;

    if (!isOrganizer) return null;

    return (
        <>
            {/* Tasks Icon Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Mis Tareas"
            >
                <ListTodo size={22} />
                {pendingTasksCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-600 text-white text-[10px] items-center justify-center font-bold">
                            {pendingTasksCount}
                        </span>
                    </span>
                )}
            </button>

            {/* Tasks Modal */}
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Mis Tareas Asignadas"
                size="xl"
            >
                <div className="space-y-6">
                    {/* Active Meetings Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar size={20} className="text-blue-600" />
                            <h3 className="font-bold text-gray-800">Reuniones Activas</h3>
                        </div>

                        {loadingMeetings ? (
                            <div className="py-4"><LoadingSpinner text="Cargando reuniones..." /></div>
                        ) : activeMeetings.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                                <Users size={32} className="mx-auto mb-2 text-gray-300" />
                                <p className="text-sm text-gray-500">No hay reuniones activas</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {activeMeetings.map(meeting => {
                                    const attendance = getAttendanceStatus(meeting);
                                    const hasMarked = !!attendance;

                                    return (
                                        <Card key={meeting.id} className="border-l-4 border-l-blue-500">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-800 text-sm mb-1">{meeting.title}</h4>
                                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {new Date(meeting.date).toLocaleDateString('es-PE')}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {meeting.time}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    {hasMarked ? (
                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${attendance.status === 'confirmed'
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : attendance.status === 'rejected'
                                                                ? 'bg-red-100 text-red-700 border border-red-200'
                                                                : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                            }`}>
                                                            {attendance.status === 'confirmed' ? '✅ Confirmada' :
                                                                attendance.status === 'rejected' ? '❌ Rechazada' :
                                                                    '⏳ Pendiente'}
                                                        </span>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleMarkAttendance(meeting)}
                                                            className="text-xs"
                                                        >
                                                            <UserCheck size={14} className="mr-1" />
                                                            Marcar Asistencia
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Tasks Section */}
                    <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <ListTodo size={20} className="text-blue-600" />
                            <h3 className="font-bold text-gray-800">Tareas Asignadas</h3>
                        </div>

                        {loading ? (
                            <div className="py-4"><LoadingSpinner text="Cargando tareas..." /></div>
                        ) : tasks.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                                <ListTodo size={32} className="mx-auto mb-2 text-gray-300" />
                                <p className="text-sm text-gray-500">No tienes tareas asignadas</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {tasks.map(task => {
                                    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

                                    return (
                                        <Card
                                            key={task.id}
                                            className={`border-l-4 cursor-pointer hover:shadow-md transition-shadow ${task.status === 'completed'
                                                ? 'border-l-green-500'
                                                : task.status === 'in_progress'
                                                    ? 'border-l-blue-500'
                                                    : isOverdue
                                                        ? 'border-l-red-500'
                                                        : 'border-l-gray-300'
                                                }`}
                                            onClick={() => handleOpenTask(task)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1">
                                                    {getStatusIcon(task.status)}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <h4 className="font-bold text-gray-800 text-sm">{task.title}</h4>
                                                        <div className="flex gap-1 flex-shrink-0">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getPriorityColor(task.priority)}`}>
                                                                {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                                                            </span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(task.status)}`}>
                                                                {task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {task.description && (
                                                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                                                    )}

                                                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {new Date(task.dueDate).toLocaleDateString('es-PE')}
                                                            {isOverdue && <span className="text-red-600 font-bold">(Vencida)</span>}
                                                        </span>
                                                        {task.comments && task.comments.length > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <MessageSquare size={12} />
                                                                {task.comments.length}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full transition-all ${task.progress === 100
                                                                    ? 'bg-green-600'
                                                                    : task.progress > 0
                                                                        ? 'bg-blue-600'
                                                                        : 'bg-gray-400'
                                                                    }`}
                                                                style={{ width: `${task.progress}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-700 min-w-[40px] text-right">
                                                            {task.progress}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Update Task Modal */}
            <Modal
                isOpen={isUpdating}
                onClose={() => setIsUpdating(false)}
                title="Actualizar Tarea"
                size="lg"
            >
                {selectedTask && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-bold text-gray-800 mb-1">{selectedTask.title}</h4>
                            {selectedTask.description && (
                                <p className="text-sm text-gray-600">{selectedTask.description}</p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getPriorityColor(selectedTask.priority)}`}>
                                Prioridad: {selectedTask.priority === 'high' ? 'Alta' : selectedTask.priority === 'medium' ? 'Media' : 'Baja'}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                                Vence: {new Date(selectedTask.dueDate).toLocaleDateString('es-PE')}
                            </span>
                        </div>

                        <div className="border-t pt-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Progreso: {newProgress}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={newProgress}
                                onChange={e => setNewProgress(parseInt(e.target.value))}
                                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>0%</span>
                                <span>25%</span>
                                <span>50%</span>
                                <span>75%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Comentario {newProgress !== selectedTask.progress && <span className="text-red-500">*</span>}
                            </label>
                            <textarea
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                className="w-full p-3 border rounded-lg text-sm"
                                rows={4}
                                placeholder="Describe el avance, obstáculos encontrados, o cualquier información relevante..."
                            />
                        </div>

                        {/* Previous Comments */}
                        {selectedTask.comments && selectedTask.comments.length > 0 && (
                            <div className="border-t pt-4">
                                <h5 className="text-sm font-bold text-gray-700 mb-3">Historial de Comentarios</h5>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {selectedTask.comments.map((comment, idx) => (
                                        <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-medium text-gray-600">
                                                    {new Date(comment.timestamp).toLocaleString('es-PE')}
                                                </span>
                                                <span className="text-xs font-bold text-blue-600">
                                                    Progreso: {comment.progress}%
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700">{comment.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 justify-end pt-4 border-t">
                            <Button variant="ghost" onClick={() => setIsUpdating(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleUpdateTask}>
                                Actualizar Tarea
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default TasksQuickAccess;
