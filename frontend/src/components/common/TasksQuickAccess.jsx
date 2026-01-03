import { useState, useEffect, useMemo } from 'react';
import { ListTodo, CheckCircle, Clock, AlertCircle, Calendar, MessageSquare, UserCheck, Users, DollarSign, Upload, CreditCard, Edit3, AlertTriangle } from 'lucide-react';
import { useTreasury } from '../../hooks/useTreasury';
import { showError, showSuccess } from '../../utils/alerts';
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
    const [activeModalTab, setActiveModalTab] = useState('tasks'); // 'tasks' or 'payments'
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [voucherUrl, setVoucherUrl] = useState('');
    const [voucherFile, setVoucherFile] = useState(null);
    const [voucherPreview, setVoucherPreview] = useState(null);
    const [isSubmittingVoucher, setIsSubmittingVoucher] = useState(false);
    const [pendingFines, setPendingFines] = useState([]);
    const [selectedFine, setSelectedFine] = useState(null);

    const {
        contributionPlan: allContributionPlan, // Renamed to indicate it contains all data
        config: treasuryConfig,
        recordContribution,
        reload
    } = useTreasury();

    // SECURITY: Filter to show only current user's contributions
    // TODO: When connecting to backend, the API should ONLY return the current user's data
    // Backend endpoint should be: GET /api/contributions/my-plan (with authentication)
    // This frontend filter is a temporary measure for development
    const contributionPlan = useMemo(() => {
        if (!user?.id || !allContributionPlan) return [];
        return allContributionPlan.filter(c => c.organizador_id === user.id);
    }, [allContributionPlan, user?.id]);

    // Simulate cloud upload - Same as in ContributionsManager
    const uploadToCloud = async (file) => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const simulatedCloudUrl = `https://storage.simr2026.com/vouchers/${Date.now()}_${file.name}`;
        console.log('📤 Uploading voucher to cloud:', file.name);
        console.log('✅ Simulated cloud URL:', simulatedCloudUrl);
        return simulatedCloudUrl;
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showError('Por favor selecciona un archivo de imagen válido.', 'Tipo de archivo inválido');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showError('El archivo es demasiado grande. Máximo 5MB.', 'Archivo muy grande');
            return;
        }

        setVoucherFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setVoucherPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

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

    // Load fines when tab is payments
    useEffect(() => {
        if (isOpen && activeModalTab === 'payments') {
            const loadFines = async () => {
                try {
                    const fines = await api.treasury.getFines(user.id);
                    setPendingFines(fines.filter(f => f.estado === 'pendiente' || f.estado === 'validando'));
                } catch (err) {
                    console.error("Error loading fines", err);
                }
            };
            loadFines();
        }
    }, [isOpen, activeModalTab, user.id]);

    const handleMarkAttendance = async (meeting) => {
        try {
            await api.planning.markAttendance(meeting.id, user.id, user.name);
            alert('✅ Asistencia marcada correctamente');
            await loadActiveMeetings(); // Reload to show updated status
        } catch (error) {
            alert(error.message || 'Error al marcar asistencia');
        }
    };

    const handleSignMeeting = async (meeting) => {
        try {
            if (!confirm(`¿Estás seguro de firmar el acta de la reunión "${meeting.title}"? Esta acción confirmará tu asistencia y salida.`)) return;

            await api.planning.signMeeting(meeting.id, user.id);
            await showSuccess('✅ Acta firmada exitosamente');
            await loadActiveMeetings();
        } catch (error) {
            showError(error.message || 'Error al firmar acta', 'Error');
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
                title={
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setActiveModalTab('tasks')}
                            className={`pb-1 border-b-2 transition-all ${activeModalTab === 'tasks' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Mis Tareas
                        </button>
                        <button
                            onClick={() => setActiveModalTab('payments')}
                            className={`pb-1 border-b-2 transition-all ${activeModalTab === 'payments' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Mis Pagos
                        </button>
                    </div>
                }
                size="xl"
            >
                {activeModalTab === 'tasks' ? (
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
                                    {(activeMeetings || []).map(meeting => {
                                        const attendance = getAttendanceStatus(meeting);
                                        const hasMarked = !!attendance;
                                        // Handle inconsistent property names (time vs startTime)
                                        const rawTime = meeting.time || meeting.startTime || '00:00';

                                        // Format to 12h AM/PM
                                        const formatTime12Hour = (timeStr) => {
                                            if (!timeStr) return '';
                                            const [hours, minutes] = timeStr.split(':');
                                            const h = parseInt(hours, 10);
                                            const ampm = h >= 12 ? 'PM' : 'AM';
                                            const h12 = h % 12 || 12;
                                            return `${h12}:${minutes} ${ampm}`;
                                        };

                                        const meetingTime = formatTime12Hour(rawTime);

                                        // Condition 4: Post-Meeting Visibility
                                        if (meeting.status === 'closed' && !hasMarked) return null;

                                        // Condition 3: Meeting Start Time Restriction
                                        const meetingDateTime = new Date(`${meeting.date}T${rawTime}`);
                                        const now = new Date();
                                        const hasStarted = now >= meetingDateTime;

                                        return (
                                            <Card key={meeting.id} className="border-l-4 border-l-blue-500">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-800 text-sm mb-1">{meeting.title}</h4>
                                                        <div className="flex items-center gap-3 text-xs text-gray-600">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={12} />
                                                                {new Date(`${meeting.date}T12:00:00`).toLocaleDateString('es-PE')}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={12} />
                                                                {meetingTime}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        {meeting.status === 'closed' ? (
                                                            // Logic for Closed Meetings (Signing)
                                                            attendance?.signedAt ? (
                                                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                                                                    <CheckCircle size={12} />
                                                                    Acta Firmada
                                                                </span>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleSignMeeting(meeting)}
                                                                    className="text-xs bg-indigo-600 hover:bg-indigo-700"
                                                                >
                                                                    <Edit3 size={14} className="mr-1" />
                                                                    Firmar Acta
                                                                </Button>
                                                            )
                                                        ) : (
                                                            // Logic for Open Meetings (Attendance)
                                                            hasMarked ? (
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
                                                                // Condition 3: Only allow marking attendance if meeting has started
                                                                hasStarted ? (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleMarkAttendance(meeting)}
                                                                        className="text-xs"
                                                                    >
                                                                        <UserCheck size={14} className="mr-1" />
                                                                        Marcar Asistencia
                                                                    </Button>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400 italic flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                                        <Clock size={12} />
                                                                        Inicia a las {meetingTime}
                                                                    </span>
                                                                )
                                                            )
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
                                                                {new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('es-PE')}
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
                ) : (
                    /* Payments Section */
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                            <h4 className="text-blue-900 font-bold flex items-center gap-2 mb-1">
                                <CreditCard size={18} />
                                Aportes Mensuales
                            </h4>
                            <p className="text-blue-700 text-xs">
                                Selecciona los meses pendientes de forma secuencial para registrar tu pago adjuntando un comprobante.
                            </p>
                        </div>

                        {/* Penalties Section */}
                        {pendingFines.length > 0 && (
                            <div className="mb-6">
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
                                    <h4 className="text-red-900 font-bold flex items-center gap-2 mb-1">
                                        <AlertTriangle size={18} />
                                        Penalidades Pendientes
                                    </h4>
                                    <p className="text-red-700 text-xs">
                                        Tienes multas por inasistencia o tardanza. Debes regularizarlas para estar al día.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {pendingFines.map(fine => (
                                        <div key={fine.id} className={`border rounded-xl p-4 flex justify-between items-center bg-white shadow-sm transition-all ${selectedFine?.id === fine.id ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'}`}>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{fine.descripcion}</p>
                                                <p className="text-xs text-red-500 font-medium mt-1">Vence: {new Date(fine.dueDate + 'T00:00:00').toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {fine.estado === 'validando' ? (
                                                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-bold animate-pulse border border-yellow-200">
                                                        Validando
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span className="font-bold text-gray-900">S/ {parseFloat(fine.monto).toFixed(2)}</span>
                                                        <Button
                                                            size="sm"
                                                            variant={selectedFine?.id === fine.id ? 'default' : 'outline'}
                                                            className={selectedFine?.id === fine.id ? 'bg-red-600 hover:bg-red-700 text-white border-transparent' : 'border-red-200 text-red-600 hover:bg-red-50'}
                                                            onClick={() => {
                                                                if (selectedFine?.id === fine.id) {
                                                                    setSelectedFine(null);
                                                                } else {
                                                                    setSelectedFine(fine);
                                                                    // Removed setSelectedMonths([]) to allow combined payment
                                                                }
                                                            }}>
                                                            {selectedFine?.id === fine.id ? 'Seleccionado' : 'Pagar'}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contribution Calendar Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {treasuryConfig?.contribution?.months?.map(month => {
                                const contrib = contributionPlan.find(c => c.organizador_id === user.id && c.mes === month.id);
                                const status = contrib?.estado || 'pendiente';
                                const isSelected = selectedMonths.includes(month.id);

                                const getStatusStyle = () => {
                                    if (isSelected) return 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-105 z-10';
                                    switch (status) {
                                        case 'pagado': return 'bg-green-50 border-green-200 text-green-700 opacity-80';
                                        case 'validando': return 'bg-yellow-50 border-yellow-300 text-yellow-700 animate-pulse';
                                        case 'pendiente': return 'bg-white border-dashed border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50';
                                        default: return 'bg-gray-50 border-gray-100 text-gray-400';
                                    }
                                };

                                const handleMonthToggle = () => {
                                    if (status !== 'pendiente') return;

                                    if (isSelected) {
                                        // Deselecting: must deselect future months in selection
                                        const monthIdx = treasuryConfig.contribution.months.findIndex(m => m.id === month.id);
                                        setSelectedMonths(prev => prev.filter(id => {
                                            const idx = treasuryConfig.contribution.months.findIndex(m => m.id === id);
                                            return idx < monthIdx;
                                        }));
                                    } else {
                                        // Selecting: must ensure sequence
                                        const monthIdx = treasuryConfig.contribution.months.findIndex(m => m.id === month.id);
                                        const pendingPrevious = treasuryConfig.contribution.months.slice(0, monthIdx).filter(m => {
                                            const c = contributionPlan.find(curr => curr.organizador_id === user.id && curr.mes === m.id);
                                            return (!c || c.estado === 'pendiente') && !selectedMonths.includes(m.id);
                                        });

                                        if (pendingPrevious.length > 0) {
                                            showError('Debes seleccionar los meses en orden secuencial.', 'Orden de Pago');
                                            return;
                                        }
                                        setSelectedMonths(prev => [...prev, month.id]);
                                        // Removed setSelectedFine(null) to allow combined payment
                                    }
                                };

                                return (
                                    <button
                                        key={month.id}
                                        onClick={handleMonthToggle}
                                        disabled={status === 'pagado' || status === 'validando'}
                                        className={`p-4 rounded-xl border-2 text-left transition-all relative ${getStatusStyle()}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-sm tracking-tight">{month.label}</span>
                                            {status === 'pagado' && <CheckCircle size={14} />}
                                            {status === 'validando' && <Clock size={14} />}
                                        </div>
                                        <div className="text-[10px] font-bold uppercase opacity-80">
                                            {status === 'pagado' ? 'Pagado' : status === 'validando' ? 'Pendiente Val.' : `S/ ${treasuryConfig.contribution.monthlyAmount}`}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Voucher Form */}
                        {(selectedMonths.length > 0 || selectedFine) && (
                            <Card className="bg-gray-50 border-blue-100 mt-6 p-4 animate-in fade-in slide-in-from-bottom-2">
                                <h5 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
                                    <Upload size={16} className="text-blue-600" />
                                    {selectedFine ? 'Registrar Pago de Penalidad' : `Registrar Pago (${selectedMonths.length} ${selectedMonths.length === 1 ? 'Periodo' : 'Periodos'})`}
                                </h5>


                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs mb-3">
                                        <span className="text-gray-500">Monto Final:</span>
                                        <span className="font-black text-gray-900 text-sm">
                                            S/ {(
                                                (selectedFine ? parseFloat(selectedFine.monto || selectedFine.amount || 0) : 0) +
                                                (selectedMonths.length * treasuryConfig.contribution.monthlyAmount)
                                            ).toFixed(2)}
                                        </span>
                                    </div>

                                    {/* File Upload */}
                                    <div className="flex items-center gap-3">
                                        <label className="flex-1 cursor-pointer">
                                            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${voucherFile
                                                ? 'border-green-300 bg-green-50'
                                                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                                }`}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    required
                                                />
                                                <div className="flex flex-col items-center gap-2">
                                                    {voucherFile ? (
                                                        <>
                                                            <CheckCircle className="text-green-600" size={24} />
                                                            <p className="text-xs font-medium text-green-700">{voucherFile.name}</p>
                                                            <p className="text-[10px] text-green-600">
                                                                {(voucherFile.size / 1024).toFixed(1)} KB
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="text-gray-400" size={24} />
                                                            <p className="text-xs text-gray-600">
                                                                <span className="font-semibold text-blue-600">Subir comprobante</span>
                                                            </p>
                                                            <p className="text-[10px] text-gray-500">PNG, JPG (máx 5MB)</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </label>

                                        {voucherPreview && (
                                            <div className="w-20 h-20 border-2 border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                <img
                                                    src={voucherPreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        className="flex-1"
                                        onClick={() => {
                                            setSelectedMonths([]);
                                            setSelectedFine(null);
                                            setVoucherUrl('');
                                            setVoucherFile(null);
                                            setVoucherPreview(null);
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        className="flex-3 bg-blue-600 hover:bg-blue-700"
                                        loading={isSubmittingVoucher}
                                        disabled={!voucherFile}
                                        onClick={async () => {
                                            if (!voucherFile) {
                                                showError('Debes subir el comprobante de pago.', 'Campo Obligatorio');
                                                return;
                                            }

                                            try {
                                                setIsSubmittingVoucher(true);

                                                // Upload file to cloud
                                                const uploadedUrl = await uploadToCloud(voucherFile);

                                                // Handle combined payment (Fine + Months) or single payment
                                                const uploadPromise = Promise.resolve(uploadedUrl); // Can be used by both if needed

                                                const promises = [];

                                                if (selectedFine) {
                                                    promises.push(api.treasury.submitFinePayment(selectedFine.id, uploadedUrl));
                                                }

                                                if (selectedMonths.length > 0) {
                                                    promises.push(recordContribution(
                                                        user.id,
                                                        selectedMonths,
                                                        null, // No account selection for organizer
                                                        selectedMonths.length * treasuryConfig.contribution.monthlyAmount,
                                                        uploadedUrl,
                                                        true // isValidationRequest
                                                    ));
                                                }

                                                await Promise.all(promises);

                                                await reload();
                                                // Refresh fines if paid fine
                                                if (selectedFine) {
                                                    const fines = await api.treasury.getFines(user.id);
                                                    setPendingFines(fines.filter(f => f.estado === 'pendiente' || f.estado === 'validando'));
                                                }

                                                setSelectedMonths([]);
                                                setSelectedFine(null);
                                                setVoucherUrl('');
                                                setVoucherFile(null);
                                                setVoucherPreview(null);
                                                await showSuccess('✅ Comprobante enviado para validación.');
                                            } catch (err) {
                                                showError(err.message, 'Error al enviar comprobante');
                                            } finally {
                                                setIsSubmittingVoucher(false);
                                            }
                                        }}
                                    >
                                        Enviar para Validación
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </Modal >

            {/* Update Task Modal */}
            < Modal
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
            </Modal >
        </>
    );
};

export default TasksQuickAccess;
