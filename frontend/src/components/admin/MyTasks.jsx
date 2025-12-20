import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, MessageSquare, TrendingUp, Calendar, User } from 'lucide-react';
import { Button, Card, Modal, LoadingSpinner, EmptyState } from '../ui';
import { api } from '../../services/api';
import { useApi } from '../../hooks';
import { showWarning } from '../../utils/alerts';

const MyTasks = ({ currentUser }) => {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [newProgress, setNewProgress] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Load user's tasks
    const { data, loading, execute: loadTasks } = useApi(async () => {
        return await api.planning.getMyTasks(currentUser.id);
    });

    useEffect(() => {
        loadTasks();
    }, []);

    useEffect(() => {
        if (data) {
            setTasks(data);
        }
    }, [data]);

    const handleOpenTask = (task) => {
        setSelectedTask(task);
        setNewProgress(task.progress);
        setNewComment('');
        setIsUpdating(true);
    };

    const handleUpdateTask = async () => {
        if (newProgress !== selectedTask.progress && !newComment.trim()) {
            showWarning('Agregue un comentario explicando el cambio.', 'Comentario requerido');
            return;
        }

        await api.planning.updateTaskProgress(
            selectedTask.id,
            newProgress,
            newComment.trim(),
            currentUser.id
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
            case 'completed': return <CheckCircle size={20} className="text-green-600" />;
            case 'in_progress': return <Clock size={20} className="text-blue-600" />;
            case 'pending': return <AlertCircle size={20} className="text-gray-600" />;
            default: return <AlertCircle size={20} className="text-gray-600" />;
        }
    };

    const filteredTasks = filterStatus === 'all'
        ? tasks
        : tasks.filter(t => t.status === filterStatus);

    const myProgress = tasks.length > 0
        ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
        : 0;

    const taskStats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        pending: tasks.filter(t => t.status === 'pending').length
    };

    if (loading && !tasks.length) {
        return <div className="p-8 flex justify-center"><LoadingSpinner text="Cargando tareas..." /></div>;
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <User size={20} className="text-blue-600" />
                    Mis Tareas Asignadas
                </h3>

                {/* Progress Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Mi Progreso</p>
                                <p className="text-3xl font-bold mt-1">{myProgress}%</p>
                            </div>
                            <TrendingUp size={32} className="text-blue-200" />
                        </div>
                        <div className="mt-3 bg-blue-400/30 rounded-full h-2">
                            <div
                                className="bg-white rounded-full h-2 transition-all"
                                style={{ width: `${myProgress}%` }}
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

                {/* Filters */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Todas ({tasks.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'pending'
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Pendientes ({taskStats.pending})
                    </button>
                    <button
                        onClick={() => setFilterStatus('in_progress')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'in_progress'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        En Progreso ({taskStats.inProgress})
                    </button>
                    <button
                        onClick={() => setFilterStatus('completed')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'completed'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Completadas ({taskStats.completed})
                    </button>
                </div>
            </div>

            {/* Tasks List */}
            <div className="flex-1 overflow-y-auto space-y-3">
                {filteredTasks.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle}
                        title={filterStatus === 'all' ? 'No tienes tareas asignadas' : `No hay tareas ${filterStatus === 'completed' ? 'completadas' : filterStatus === 'in_progress' ? 'en progreso' : 'pendientes'}`}
                        description={filterStatus === 'all' ? 'Cuando te asignen tareas, aparecerán aquí' : 'Cambia el filtro para ver otras tareas'}
                    />
                ) : (
                    filteredTasks.map(task => {
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
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {getStatusIcon(task.status)}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
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

                                        <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                Vence: {new Date(task.dueDate).toLocaleDateString('es-PE')}
                                                {isOverdue && <span className="text-red-600 font-bold ml-1">(Vencida)</span>}
                                            </span>
                                            {task.comments && task.comments.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <MessageSquare size={14} />
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
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

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
                                <div className="space-y-2 max-h-60 overflow-y-auto">
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
        </div>
    );
};

export default MyTasks;
