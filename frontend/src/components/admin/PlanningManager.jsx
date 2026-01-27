import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Trash2, Edit2, Users, CheckCircle, Clock, AlertCircle, Target, TrendingUp, MessageSquare, Eye, Printer, Check, PenTool, Lock, X, ChevronDown, ChevronUp, Wrench, EyeOff, XCircle, FileText } from 'lucide-react';
import { Button, Card, Modal, FormField, LoadingSpinner, EmptyState, ConfirmDialog } from '../ui';
import { api } from '../../services/api';
import { useApi } from '../../hooks';
import { showWarning, showError, showConfirm, showDeleteConfirm, showInput } from '../../utils/alerts';
import AgreementEditor from './AgreementEditor';
import { flattenAgreements } from '../../utils/agreementUtils';
import TaskAssignmentModal from './TaskAssignmentModal';
import ToolsManager from './ToolsManager';
import { MeetingWSProvider, useMeetingWS } from '../../context/MeetingWSContext';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

const MeetingRealTimeUpdater = ({ onUpdate }) => {
    const { lastJsonMessage } = useMeetingWS();
    useEffect(() => {
        if (lastJsonMessage) onUpdate(lastJsonMessage);
    }, [lastJsonMessage, onUpdate]);
    return null;
};

const PlanningManager = ({ currentUser }) => {
    const [meetings, setMeetings] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [isEditingMeeting, setIsEditingMeeting] = useState(false);
    const [isEditingTask, setIsEditingTask] = useState(false);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [currentMeeting, setCurrentMeeting] = useState(null);
    const [currentTask, setCurrentTask] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewingMeetingDetails, setViewingMeetingDetails] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewingPreviousMeetings, setViewingPreviousMeetings] = useState(false);
    const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
    const [viewingTaskDetails, setViewingTaskDetails] = useState(null);
    const [openedFromPreviousMeetings, setOpenedFromPreviousMeetings] = useState(false);
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [showNextMeetingModal, setShowNextMeetingModal] = useState(false);
    const [isSigningActa, setIsSigningActa] = useState(false);
    const [signingPassword, setSigningPassword] = useState('');
    const [nextMeeting, setNextMeeting] = useState({ title: '', date: '', startTime: '', agreements: [] });
    const [now, setNow] = useState(new Date());
    const [participantOptions, setParticipantOptions] = useState({ users: [], committees: [] });
    const [selectedCommittees, setSelectedCommittees] = useState([]);
    const [activeTab, setActiveTab] = useState('acuerdos');
    const [saveStatus, setSaveStatus] = useState('saved'); // 'saving' | 'saved'
    const [openAccordion, setOpenAccordion] = useState('agreements'); // 'agreements' | 'agenda'

    const isSuperAdmin = currentUser?.isSuperAdmin;

    // Helper helper for case-insensitive role checking
    const checkRole = (roleStr) => {
        if (!roleStr) return false;
        const normalized = roleStr.toLowerCase();
        return ['organizador', 'organizacion', 'organización', 'secretaria', 'admin'].includes(normalized);
    };

    const isOrganizer = isSuperAdmin ||
        checkRole(currentUser?.role) ||
        checkRole(currentUser?.eventRole) ||
        currentUser?.modules?.includes('organizacion') ||
        currentUser?.modules?.includes('secretaria') ||
        (currentUser?.roles && currentUser.roles.some(r => checkRole(r)));

    // Ensure isSecretary is defined (using isOrganizer as base for permissions in this context)
    const isSecretary = isOrganizer;

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Handle real-time updates from WebSocket
    const handleRealTimeUpdate = useCallback((data) => {
        if (data.type === 'MEETING_UPDATED' && data.attendances) {
            setViewingMeetingDetails(prev => {
                if (!prev || prev.id !== data.meeting_id) return prev;

                const newAttendances = [...(prev.attendances || [])];
                let hasChanges = false;

                data.attendances.forEach(updated => {
                    const idx = newAttendances.findIndex(a => a.user_id === updated.user_id);
                    if (idx !== -1) {
                        // Update if ANY relevant field changed (status, time, justification, signature)
                        if (newAttendances[idx].signed_at !== updated.signed_at ||
                            newAttendances[idx].signature_hash !== updated.signature_hash ||
                            newAttendances[idx].status !== updated.status ||
                            newAttendances[idx].check_in_time !== updated.check_in_time ||
                            newAttendances[idx].is_justified !== updated.is_justified ||
                            newAttendances[idx].justification_reason !== updated.justification_reason) {

                            newAttendances[idx] = {
                                ...newAttendances[idx],
                                ...updated
                            };
                            hasChanges = true;
                        }
                    }
                });

                if (hasChanges) {
                    return { ...prev, attendances: newAttendances };
                }
                return prev;
            });

            // Mostramos el toast fuera del setViewingMeetingDetails para evitar efectos secundarios en el renderizado
            toast.success('Lista de participantes actualizada', { position: 'bottom-right', id: 'realtime-update' });
        }
    }, [setViewingMeetingDetails]);

    const ITEMS_PER_PAGE = 5;

    // Load data
    const { data, loading, error, execute: loadData } = useApi(async () => {
        const [meetingsData, tasksData, usersData, pOptions] = await Promise.all([
            api.planning.getMeetings(),
            api.planning.getTasks(),
            api.users.getAll(),
            api.planning.getParticipantOptions()
        ]);
        setParticipantOptions(pOptions);
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

    // Polling para actualizaciones en tiempo real cuando la modal de participantes está abierta
    // Polling para actualizaciones en tiempo real cuando se ven los detalles de una reunión en curso
    useEffect(() => {
        let interval;
        if (viewingMeetingDetails?.id && viewingMeetingDetails?.status === 'EN_CURSO') {
            interval = setInterval(async () => {
                await refreshCurrentMeeting();
            }, 3000); // 3 segundos para feedback más rápido
        }
        return () => clearInterval(interval);
    }, [viewingMeetingDetails?.id, viewingMeetingDetails?.status]);

    // Manual refresh helper
    const refreshCurrentMeeting = async () => {
        if (!viewingMeetingDetails?.id) return;
        try {
            const freshMeeting = await api.planning.getMeeting(viewingMeetingDetails.id);
            // CRITICAL: Preserve agreements to avoid overwriting during editing
            // Only update attendance, participants, and status-related fields
            const { agreements: _, ...freshDataWithoutAgreements } = freshMeeting;

            setViewingMeetingDetails(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    ...freshDataWithoutAgreements,
                    // Keep current agreements to prevent input clearing
                    agreements: prev.agreements
                };
            });

            setMeetings(prev => prev.map(m => m.id === freshMeeting.id ? freshMeeting : m));
        } catch (error) {
            console.error("Error refreshing meeting details:", error);
        }
    };

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                if (showParticipantsModal) setShowParticipantsModal(false);
                else if (showNextMeetingModal) setShowNextMeetingModal(false);
                else if (viewingTaskDetails) setViewingTaskDetails(null);
                else if (viewingMeetingDetails) setViewingMeetingDetails(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [showParticipantsModal, showNextMeetingModal, viewingTaskDetails, viewingMeetingDetails]);

    const handlePrintMeeting = () => {
        if (!viewingMeetingDetails) return;
        api.planning.downloadMeetingPDF(viewingMeetingDetails.id);
    };

    // Calculate meeting progress for each meeting
    const getMeetingProgress = (meeting) => {
        const meetingTasks = tasks.filter(t => t.meeting_id === meeting.id);

        // Auto-finalize check for progress
        const meetingStart = new Date(meeting.scheduled_start || `${meeting.date}T${meeting.startTime || '00:00'}`);
        const meetingEnd = new Date(meetingStart.getTime() + 4 * 60 * 60 * 1000);
        const isImplicitlyFinalized = now > meetingEnd && meeting.status !== 'ACTA_CERRADA' && meeting.status !== 'FINALIZADA';

        return meetingTasks.length > 0
            ? Math.round(meetingTasks.reduce((sum, t) => sum + t.progress, 0) / meetingTasks.length)
            : (meeting.status === 'ACTA_CERRADA' || meeting.status === 'FINALIZADA' || meeting.status === 'CERRADA' || isImplicitlyFinalized) ? 100 : 0;
    };

    if (loading && !meetings.length) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <LoadingSpinner text="Cargando planificación..." />
                <p className="mt-4 text-sm text-slate-500 animate-pulse">Sincronizando con el servidor...</p>
            </div>
        );
    }

    if (error && !meetings.length) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <AlertCircle size={40} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Error al cargar datos</h3>
                <p className="text-sm text-slate-500 max-w-md mb-6">
                    {error || "No pudimos conectar con el servidor. Por favor, verifica tu conexión o intenta más tarde."}
                </p>
                <Button
                    variant="primary"
                    icon={Clock}
                    onClick={() => loadData()}
                >
                    REINTENTAR CARGA
                </Button>
            </div>
        );
    }

    // Calculate overall progress based on meetings
    const overallProgress = meetings.length > 0
        ? Math.round(meetings.reduce((sum, meeting) => sum + getMeetingProgress(meeting), 0) / meetings.length)
        : 0;

    // Meeting statistics
    const meetingStats = {
        total: meetings.length,
        completed: meetings.filter(m => m.status === 'ACTA_CERRADA' || m.status === 'FINALIZADA').length,
        inProgress: meetings.filter(m => m.status === 'EN_CURSO').length,
        pending: meetings.filter(m => m.status === 'PROGRAMADA').length
    };

    // Sort meetings by date and time descending (most recent first)
    const sortedMeetings = [...meetings].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`);
        return dateB - dateA;
    });
    const recentMeetings = sortedMeetings.slice(0, 4);

    // Filter previous meetings by date range
    let filteredPreviousMeetings = sortedMeetings.slice(4);
    if (dateFilter.startDate || dateFilter.endDate) {
        filteredPreviousMeetings = filteredPreviousMeetings.filter(meeting => {
            const meetingDate = new Date(meeting.date);
            const start = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
            const end = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

            if (start && end) {
                return meetingDate >= start && meetingDate <= end;
            } else if (start) {
                return meetingDate >= start;
            } else if (end) {
                return meetingDate <= end;
            }
            return true;
        });
    }

    const handleClearFilters = () => {
        setDateFilter({ startDate: '', endDate: '' });
        setCurrentPage(1);
    };

    const handleOpenPreviousMeetings = () => {
        setViewingPreviousMeetings(true);
        setCurrentPage(1);
        setDateFilter({ startDate: '', endDate: '' });
    };

    // Meeting handlers
    const handleAddMeeting = () => {
        setCurrentMeeting({
            id: null,
            date: new Date().toISOString().split('T')[0],
            startTime: '09:00',
            title: '',
            status: 'PROGRAMADA',
            agreements: [],
            invited_user_ids: participantOptions.users.map(u => u.id),
            createdBy: currentUser.id
        });
        setSelectedCommittees([]);
        setIsEditingMeeting(true);
    };

    const handleToggleAllParticipants = (selectAll) => {
        if (selectAll) {
            setCurrentMeeting({
                ...currentMeeting,
                invited_user_ids: participantOptions.users.map(u => u.id)
            });
        } else {
            setCurrentMeeting({
                ...currentMeeting,
                invited_user_ids: []
            });
            setSelectedCommittees([]);
        }
    };

    const handleToggleCommittee = (committeeId) => {
        const committee = participantOptions.committees.find(c => c.id === committeeId);
        if (!committee) return;

        const isCurrentlySelected = selectedCommittees.includes(committeeId);
        let newParticipantIds = [...(currentMeeting.invited_user_ids || [])];
        let newSelectedCommittees = [...selectedCommittees];

        if (isCurrentlySelected) {
            // Remove committee members
            newParticipantIds = newParticipantIds.filter(id => !committee.member_ids.includes(id));
            newSelectedCommittees = newSelectedCommittees.filter(id => id !== committeeId);
        } else {
            // Add committee members (avoid duplicates)
            const membersToAdd = committee.member_ids.filter(id => !newParticipantIds.includes(id));
            newParticipantIds = [...newParticipantIds, ...membersToAdd];
            newSelectedCommittees.push(committeeId);
        }

        setCurrentMeeting({
            ...currentMeeting,
            invited_user_ids: newParticipantIds
        });
        setSelectedCommittees(newSelectedCommittees);
    };

    const handleToggleParticipant = (userId) => {
        let newParticipantIds = [...(currentMeeting.invited_user_ids || [])];
        if (newParticipantIds.includes(userId)) {
            newParticipantIds = newParticipantIds.filter(id => id !== userId);
        } else {
            newParticipantIds.push(userId);
        }
        setCurrentMeeting({
            ...currentMeeting,
            invited_user_ids: newParticipantIds
        });
    };

    const handleTogglePreview = async () => {
        if (!viewingMeetingDetails) return;

        try {
            const updatedMeeting = {
                ...viewingMeetingDetails,
                is_preview_active: !viewingMeetingDetails.is_preview_active
            };

            // Optimistic update
            setViewingMeetingDetails(updatedMeeting);

            // Persist
            await api.planning.saveMeeting(updatedMeeting);

            // Update in list
            setMeetings(prev => prev.map(m => m.id === updatedMeeting.id ? updatedMeeting : m));

            toast.success(updatedMeeting.is_preview_active
                ? 'Vista previa activada para residentes'
                : 'Vista previa desactivada');

        } catch (error) {
            console.error(error);
            showError('Error al cambiar estado de vista previa');
            // Revert on error
            setViewingMeetingDetails(prev => ({ ...prev, is_preview_active: !prev.is_preview_active }));
        }
    };

    const handleEditMeeting = (meeting) => {
        if (['FINALIZADA', 'CERRADA', 'ACTA_CERRADA'].includes(meeting.status)) {
            showWarning('Esta reunión ya ha sido finalizada o cerrada.', 'No se puede editar');
            return;
        }

        // Parse scheduled_start to extract date and time for form fields
        const scheduledDate = new Date(meeting.scheduled_start);
        const date = scheduledDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const time = scheduledDate.toTimeString().slice(0, 5); // HH:MM

        setCurrentMeeting({
            ...meeting,
            date: date,
            startTime: time,
            invited_user_ids: (meeting.attendances || []).map(a => a.user_id)
        });
        setIsEditingMeeting(true);
    };

    const handleSaveMeeting = async () => {
        if (!currentMeeting.title || !currentMeeting.date) {
            showWarning('Complete todos los campos requeridos.', 'Campos incompletos');
            return;
        }

        try {
            // Prepare payload for backend compatibility
            // Combine date and time into scheduled_start ISO string
            const scheduledStart = `${currentMeeting.date}T${currentMeeting.startTime || '00:00'}:00`;

            const payload = {
                ...currentMeeting,
                scheduled_start: scheduledStart
            };

            await api.planning.saveMeeting(payload);
            await loadData();
            setIsEditingMeeting(false);
            setCurrentMeeting(null);
            showWarning('Reunión guardada exitosamente.', 'Éxito');
        } catch (error) {
            showError('Error al guardar la reunión. Verifique los campos.', 'Error');
            console.error(error);
        }
    };

    const handleStartMeeting = async (meetingId) => {
        const confirmed = await showConfirm('¿Deseas iniciar la reunión ahora? Esto activará el marcador de asistencia.', 'Iniciar Reunión');
        if (confirmed) {
            await api.planning.startMeeting(meetingId);
            await loadData();
        }
    };

    const handleCheckIn = async (meetingId) => {
        try {
            await api.planning.checkIn(meetingId);
            showWarning('Asistencia registrada correctamente.', 'Éxito');
            await loadData();
        } catch (error) {
            showError(error.response?.data?.detail || 'Error al marcar asistencia');
        }
    };

    const handleSignActa = async (meetingId) => {
        if (!signingPassword) {
            showWarning('Debes ingresar tu contraseña para firmar.', 'Seguridad Requerida');
            return;
        }
        try {
            await api.planning.signActa(meetingId, signingPassword);
            showWarning('Acta firmada digitalmente con éxito (Hash SHA-256 generado).', 'Firma Exitosa');
            setIsSigningActa(false);
            setSigningPassword('');
            await loadData();
        } catch (error) {
            showError(error.response?.data?.detail || 'Error al firmar acta. Valida tu contraseña.');
        }
    };

    const handleTerminateMeeting = async (meetingId) => {
        const confirmed = await showConfirm(
            '¿Deseas terminar la reunión? Se abrirá la ventana de 15 minutos para firmas digitales.',
            'Terminar Reunión'
        );
        if (confirmed) {
            await api.planning.terminateMeeting(meetingId);
            showWarning('Reunión finalizada. Los participantes tienen 15 min para firmar.', 'Éxito');
            await loadData();
            // If in modal, update local state
            if (viewingMeetingDetails?.id === meetingId) {
                const refreshed = await api.planning.getMeetings();
                setViewingMeetingDetails(refreshed.find(m => m.id === meetingId));
            }
        }
    };

    const handleCloseAct = async (meetingId) => {
        const confirmed = await showConfirm(
            '¿Cerrar acta definitivamente? Se ejecutarán los barridos de faltas y multas automáticas.',
            'Cierre Definitivo'
        );
        if (confirmed) {
            await api.planning.closeAct(meetingId);
            showWarning('Acta cerrada definitivamente. Multas enviadas a Tesorería.', 'Éxito');
            await loadData();
            if (viewingMeetingDetails?.id === meetingId) {
                const refreshed = await api.planning.getMeetings();
                setViewingMeetingDetails(refreshed.find(m => m.id === meetingId));
            }
        }
    };

    const handleDeleteMeeting = async (id) => {
        const confirmed = await showDeleteConfirm(
            '¿Está seguro de eliminar esta reunión y todas sus tareas asociadas?',
            'Eliminar Reunión'
        );
        if (confirmed) {
            try {
                await api.planning.deleteMeeting(id);
                await loadData();
                showWarning('Reunión eliminada exitosamente.', 'Éxito');
            } catch (error) {
                // Backend devuelve 403 si la reunión no está en PROGRAMADA
                const errorMsg = error.response?.data?.detail || 'Error al eliminar la reunión.';
                showError(errorMsg, 'No se puede eliminar');
            }
        }
    };



    // Task handlers
    const handleAddTask = (meetingId) => {
        setIsAddingTask(true);
    };

    const handleEditTask = (task) => {
        setCurrentTask({ ...task });
        setIsEditingTask(true);
    };

    const handleSaveTask = async () => {
        if (!currentTask.title || !currentTask.assigned_to) {
            showWarning('Complete todos los campos requeridos.', 'Campos incompletos');
            return;
        }

        await api.planning.saveTask(currentTask);
        await loadData();
        setIsEditingTask(false);
        setCurrentTask(null);
    };

    const handleDeleteTask = async (id) => {
        const confirmed = await showDeleteConfirm(
            '¿Está seguro de eliminar esta tarea?',
            'Eliminar Tarea'
        );
        if (confirmed) {
            await api.planning.deleteTask(id);
            await loadData();
        }
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
        const meetingTasks = tasks.filter(t => t.meeting_id === meeting.id);

        // Check if meeting is in the future
        const meetingDateTime = new Date(meeting.scheduled_start || `${meeting.date}T${meeting.startTime || '00:00'} `);
        const isFuture = meeting.status === 'PROGRAMADA' && meetingDateTime > now;

        // Heuristic: If 4 hours have passed since start, consider it implicitly finalized
        const meetingEndTime = new Date(meetingDateTime.getTime() + 4 * 60 * 60 * 1000); // 4 hours duration
        const isImplicitlyFinalized = !isFuture && now > meetingEndTime && meeting.status !== 'ACTA_CERRADA' && meeting.status !== 'FINALIZADA' && meeting.status !== 'EN_CURSO';

        const meetingProgress = meetingTasks.length > 0
            ? Math.round(meetingTasks.reduce((sum, t) => sum + t.progress, 0) / meetingTasks.length)
            : (meeting.status === 'closed' || meeting.status === 'FINALIZADA' || meeting.status === 'CERRADA' || meeting.status === 'ACTA_CERRADA' || isImplicitlyFinalized) ? 100 : 0;

        // Countdown Logic
        const diff = meetingDateTime - now;
        const diffMinutes = Math.floor(diff / (1000 * 60));
        const diffSeconds = Math.floor((diff / 1000) % 60);
        const showCountdown = isFuture && diffMinutes >= 0 && diffMinutes < 60;

        return (
            <div
                className={`bg-white rounded-xl border border-gray-100 transition-all group 
                    ${isFuture
                        ? 'opacity-70 cursor-not-allowed bg-gray-50'
                        : 'hover:border-blue-300 hover:shadow-md cursor-pointer'
                    } 
                    ${!isRecent && !isFuture ? 'opacity-80 hover:opacity-100' : ''} `}
                onClick={() => {
                    if (isFuture) {
                        showWarning(
                            `Esta reunión está programada para el ${meetingDateTime.toLocaleDateString('es-PE')} `,
                            'Reunión Programada'
                        );
                        return;
                    }

                    setViewingMeetingDetails(meeting);
                    if (!isRecent) {
                        setOpenedFromPreviousMeetings(true);
                        setViewingPreviousMeetings(false); // Close to avoid z-index issues
                    } else {
                        setOpenedFromPreviousMeetings(false);
                        setViewingPreviousMeetings(false);
                    }
                }}
            >
                <div className="p-4 space-y-3">
                    {/* Row 1: Icon + Title + Status Badge */}
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isFuture ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'} `}>
                            <Calendar size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`font-bold truncate ${isFuture ? 'text-gray-500' : 'text-gray-800'} `}>{meeting.title}</h4>
                                {showCountdown && (
                                    <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                                        <Clock size={10} />
                                        {diffMinutes}:{diffSeconds.toString().padStart(2, '0')}
                                    </span>
                                )}
                                {isFuture && !showCountdown && (
                                    <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                        PROGRAMADA
                                    </span>
                                )}
                                {meeting.status === 'ACTA_CERRADA' && (
                                    <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                                        ACTA CERRADA
                                    </span>
                                )}
                                {(meeting.status === 'EN_CURSO' || (meeting.status === 'PROGRAMADA' && !isFuture)) && (
                                    <span className="bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse flex-shrink-0">
                                        EN CURSO
                                    </span>
                                )}
                                {['FINALIZADA', 'CERRADA'].includes(meeting.status) && (
                                    <span className="bg-amber-100 text-amber-600 text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                                        FINALIZADA
                                    </span>
                                )}
                                {(isImplicitlyFinalized && meeting.status !== 'FINALIZADA') && (
                                    <span className="bg-amber-100 text-amber-600 text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0" title="Finalizada automáticamente por tiempo (4h)">
                                        FINALIZADA (AUTO)
                                    </span>
                                )}
                            </div>
                            {/* Date and Time */}
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                                <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {new Date(meeting.scheduled_start).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {new Date(meeting.scheduled_start).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Progress Bar */}
                    <div className="w-full">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Progreso</span>
                            <span className="font-bold text-gray-700">{meetingProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                                className="bg-blue-600 rounded-full h-1.5 transition-all"
                                style={{ width: `${meetingProgress}% ` }}
                            />
                        </div>
                    </div>

                    {/* Row 3: Action Buttons */}
                    <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        {meeting.status !== 'ACTA_CERRADA' && !['FINALIZADA', 'CERRADA'].includes(meeting.status) && (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => handleEditMeeting(meeting)}>
                                    <Edit2 size={16} />
                                </Button>
                                {/* 🚨 SOLO PROGRAMADAS pueden eliminarse */}
                                {meeting.status === 'PROGRAMADA' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteMeeting(meeting.id)}
                                        className="hover:bg-red-50"
                                    >
                                        <Trash2 size={16} className="text-red-500" />
                                    </Button>
                                )}
                            </>
                        )}
                        {/* El botón de Iniciar solo aparece si es PROGRAMADA y es FUTURA (antes de la hora de inicio) */}
                        {meeting.status === 'PROGRAMADA' && isFuture && (
                            <Button variant="primary" size="sm" onClick={() => handleStartMeeting(meeting.id)} className="bg-green-600 hover:bg-green-700">
                                Iniciar
                            </Button>
                        )}
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

                {/* Progress Dashboard-Same as before */}
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
                                style={{ width: `${overallProgress}% ` }}
                            />
                        </div>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                        <div className="flex items-center gap-3">
                            <CheckCircle size={24} className="text-green-600" />
                            <div>
                                <p className="text-xs text-green-600 font-medium">Completadas</p>
                                <p className="text-2xl font-bold text-green-700">{meetingStats.completed}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-3">
                            <Clock size={24} className="text-blue-600" />
                            <div>
                                <p className="text-xs text-blue-600 font-medium">En Progreso</p>
                                <p className="text-2xl font-bold text-blue-700">{meetingStats.inProgress}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gray-50 border-gray-200">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={24} className="text-gray-600" />
                            <div>
                                <p className="text-xs text-gray-600 font-medium">Pendientes</p>
                                <p className="text-2xl font-bold text-gray-700">{meetingStats.pending}</p>
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
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                                    <Clock size={16} /> Reuniones Recientes
                                </h4>
                                {filteredPreviousMeetings.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleOpenPreviousMeetings}
                                        className="text-xs"
                                    >
                                        <Calendar size={14} className="mr-1" />
                                        Ver Reuniones Anteriores ({filteredPreviousMeetings.length})
                                    </Button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {recentMeetings.map(meeting => (
                                    <MeetingItem key={meeting.id} meeting={meeting} isRecent={true} />
                                ))}
                            </div>
                        </div>
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

                        {/* Participantes Selection Section */}
                        {!currentMeeting.id && (
                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-sm font-bold text-gray-700">Participantes</label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleAllParticipants(true)}
                                            className="text-blue-600 hover:text-blue-700 h-8 text-xs"
                                        >
                                            Seleccionar Todos
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleAllParticipants(false)}
                                            className="text-gray-500 hover:text-gray-600 h-8 text-xs"
                                        >
                                            Limpiar
                                        </Button>
                                    </div>
                                </div>

                                {/* Committees Selection */}
                                {participantOptions.committees.length > 0 && (
                                    <div className="mb-4">
                                        <span className="text-[10px] text-gray-500 block mb-2 font-bold uppercase tracking-wider">Por Comisiones:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {participantOptions.committees.map(committee => (
                                                <button
                                                    key={committee.id}
                                                    onClick={() => handleToggleCommittee(committee.id)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${selectedCommittees.includes(committee.id)
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                                                        } `}
                                                >
                                                    {committee.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Individual Selection */}
                                <div className="max-h-60 overflow-y-auto border rounded-xl bg-gray-50 p-2 space-y-1 custom-scrollbar">
                                    {(participantOptions.users || []).map(user => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group"
                                            onClick={() => handleToggleParticipant(user.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${(currentMeeting.invited_user_ids || []).includes(user.id)
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'
                                                    } `}>
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-700">{user.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-gray-400">DNI: {user.dni}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 font-medium">
                                                            {user.committee_name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${(currentMeeting.invited_user_ids || []).includes(user.id)
                                                ? 'bg-blue-600 border-blue-600 shadow-sm'
                                                : 'bg-white border-gray-300 group-hover:border-blue-400'
                                                } `}>
                                                {(currentMeeting.invited_user_ids || []).includes(user.id) && (
                                                    <Check size={14} className="text-white" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 text-[10px] text-gray-400 text-right italic font-medium">
                                    {(currentMeeting.invited_user_ids || []).length} participantes seleccionados
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Acuerdos Tomados</label>
                            <AgreementEditor
                                agreements={currentMeeting.agreements}
                                onChange={(newAgreements) => setCurrentMeeting({ ...currentMeeting, agreements: newAgreements })}
                                readOnly={false}
                            />
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
                                    {(() => {
                                        // Get meeting for this task (if it exists)
                                        const taskMeeting = currentTask.meetingId
                                            ? meetings.find(m => m.id === currentTask.meetingId)
                                            : null;

                                        // If task has a meeting, show only confirmed attendees
                                        if (taskMeeting && taskMeeting.attendance) {
                                            const confirmedAttendees = taskMeeting.attendance
                                                .filter(a => a.status === 'confirmed')
                                                .map(a => users.find(u => u.id === a.userId))
                                                .filter(u => u); // Remove nulls

                                            return confirmedAttendees.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name}
                                                </option>
                                            ));
                                        }

                                        // Fallback: show all organizers
                                        return users
                                            .filter(u => u.eventRole === 'organizador' || u.eventRoles?.includes('organizador'))
                                            .map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name}
                                                </option>
                                            ));
                                    })()}
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
                                            } `}
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



            {/* Meeting Details Modal (Redesigned) */}
            {viewingMeetingDetails && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4"
                    onClick={() => {
                        setViewingMeetingDetails(null);
                        if (openedFromPreviousMeetings) {
                            setViewingPreviousMeetings(true);
                            setOpenedFromPreviousMeetings(false);
                        }
                    }}
                >
                    <div
                        className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MeetingWSProvider meetingId={viewingMeetingDetails.id}>
                            {(() => {
                                const meetingTasks = tasks.filter(t => t.meeting_id === viewingMeetingDetails.id);
                                const completedTasks = meetingTasks.filter(t => t.status === 'COMPLETADA').length;

                                const isFinalized = viewingMeetingDetails.status === 'FINALIZADA';
                                const isClosed = viewingMeetingDetails.status === 'CERRADA';
                                const isRunning = viewingMeetingDetails.status === 'EN_CURSO';

                                // Heuristic for Modal
                                const meetingStart = new Date(viewingMeetingDetails.scheduled_start);
                                const meetingEnd = new Date(meetingStart.getTime() + 4 * 60 * 60 * 1000);
                                const isImplicitlyFinalized = !isFinalized && !isClosed && now > meetingEnd && !isRunning;

                                const meetingProgress = meetingTasks.length > 0
                                    ? Math.round((meetingTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / (meetingTasks.length * 100)) * 100)
                                    : (isClosed || isFinalized || isImplicitlyFinalized) ? 100 : 0;


                                const handleTerminate = () => handleTerminateMeeting(viewingMeetingDetails.id);
                                const handleClose = () => handleCloseAct(viewingMeetingDetails.id);




                                return (
                                    <>
                                        {/* === HEADER === */}
                                        <div className="bg-slate-900 text-white p-6 flex justify-between items-start shrink-0">
                                            <div className="flex gap-4">
                                                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-blue-500">
                                                    <Calendar size={32} className="text-blue-400" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                                        {viewingMeetingDetails.title}
                                                        {isClosed ? (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500">
                                                                CERRADA
                                                            </span>
                                                        ) : isFinalized ? (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500">
                                                                FINALIZADA
                                                            </span>
                                                        ) : isImplicitlyFinalized ? (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500" title="Finalizada automáticamente por tiempo">
                                                                FINALIZADA
                                                            </span>
                                                        ) : isRunning ? (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500">
                                                                EN CURSO
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500">
                                                                PROGRAMADA
                                                            </span>
                                                        )}
                                                        {/* Save Status Indicator */}
                                                        {!isClosed && (
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 0 24 24"
                                                                fill="currentColor"
                                                                className={`w-5 h-5 transition-colors duration-300 ${saveStatus === 'saving'
                                                                    ? 'text-gray-400 animate-pulse'
                                                                    : 'text-green-400'
                                                                    } `}
                                                            >
                                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                                                <polyline points="17 21 17 13 7 13 7 21" />
                                                                <polyline points="7 3 7 8 15 8" />
                                                            </svg>
                                                        )}
                                                    </h2>
                                                    <div className="text-slate-400 text-sm flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            📅 {viewingMeetingDetails.scheduled_start
                                                                ? new Date(viewingMeetingDetails.scheduled_start).toLocaleDateString('es-PE', {
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    year: 'numeric'
                                                                })
                                                                : 'Fecha no disponible'
                                                            }
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            🕐 {viewingMeetingDetails.scheduled_start
                                                                ? new Date(viewingMeetingDetails.scheduled_start).toLocaleTimeString('es-PE', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })
                                                                : '--:--'
                                                            }
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            👥 {viewingMeetingDetails.attendances?.length || 0} participantes
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setViewingMeetingDetails(null);
                                                    if (openedFromPreviousMeetings) {
                                                        setViewingPreviousMeetings(true);
                                                        setOpenedFromPreviousMeetings(false);
                                                    }
                                                }}
                                                className="text-slate-400 hover:text-white transition-colors p-1"
                                            >
                                                <X size={28} />
                                            </button>
                                        </div>

                                        {/* === NAVEGACIÓN: PESTAÑAS === */}
                                        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
                                            <button
                                                onClick={() => setActiveTab('acuerdos')}
                                                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'acuerdos'
                                                    ? 'border-blue-600 text-blue-600 bg-white'
                                                    : 'border-transparent text-slate-600 hover:text-slate-900'
                                                    } `}
                                            >
                                                <MessageSquare size={18} />
                                                Acuerdos Tomados
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('participantes')}
                                                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'participantes'
                                                    ? 'border-blue-600 text-blue-600 bg-white'
                                                    : 'border-transparent text-slate-600 hover:text-slate-900'
                                                    } `}
                                            >
                                                <Users size={18} />
                                                Participantes
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('tareas')}
                                                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'tareas'
                                                    ? 'border-blue-600 text-blue-600 bg-white'
                                                    : 'border-transparent text-slate-600 hover:text-slate-900'
                                                    } `}
                                            >
                                                <Target size={18} />
                                                Progreso de Tareas
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('tools')}
                                                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'tools'
                                                    ? 'border-blue-600 text-blue-600 bg-white'
                                                    : 'border-transparent text-slate-600 hover:text-slate-900'
                                                    } `}
                                            >
                                                <Wrench size={18} />
                                                Herramientas
                                            </button>
                                        </div>

                                        {/* === CUERPO (CONTENIDO) === */}
                                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">

                                            {/* --- TAB 1: ACUERDOS --- */}
                                            {activeTab === 'acuerdos' && (
                                                <div className="flex flex-col gap-4 animate-in slide-in-from-left-4 duration-300">
                                                    {/* Accordion: Acuerdos Tomados */}
                                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                                        <button
                                                            onClick={() => setOpenAccordion(openAccordion === 'agreements' ? null : 'agreements')}
                                                            className="w-full flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3 text-blue-800">
                                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                                    <MessageSquare size={20} />
                                                                </div>
                                                                <h4 className="font-bold text-lg">Acuerdos Tomados</h4>
                                                            </div>
                                                            {openAccordion === 'agreements' ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                                        </button>

                                                        {openAccordion === 'agreements' && (
                                                            <div className="p-5 animate-in slide-in-from-top-2 duration-200">
                                                                <AgreementEditor
                                                                    agreements={viewingMeetingDetails.agreements || []}
                                                                    onChange={(newAgreements) => {
                                                                        if (isClosed || isFinalized) return;
                                                                        const updatedMeeting = { ...viewingMeetingDetails, agreements: newAgreements };
                                                                        setViewingMeetingDetails(updatedMeeting);
                                                                        setSaveStatus('saving');
                                                                        if (window.agreementSaveTimeout) clearTimeout(window.agreementSaveTimeout);
                                                                        window.agreementSaveTimeout = setTimeout(async () => {
                                                                            try {
                                                                                const transform = (agr) => ({
                                                                                    id: agr.id, // Preserve ID
                                                                                    content: agr.content || '',
                                                                                    level: agr.level || 1,
                                                                                    children: agr.children ? agr.children.map(transform) : []
                                                                                });
                                                                                const backendPayload = {
                                                                                    ...updatedMeeting,
                                                                                    agreements: newAgreements.map(transform),
                                                                                    next_meeting_agenda: updatedMeeting.next_meeting_agenda || []
                                                                                };
                                                                                await api.planning.saveMeeting(backendPayload);
                                                                                setSaveStatus('saved');
                                                                            } catch (error) {
                                                                                console.error('Save error:', error);
                                                                                setSaveStatus('error'); // Better feedback
                                                                            } finally {
                                                                                window.agreementSaveTimeout = null;
                                                                            }
                                                                        }, 1000);
                                                                    }}
                                                                    readOnly={isClosed || isFinalized}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Accordion: Agenda Siguiente Reunión */}
                                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                                        <button
                                                            onClick={() => setOpenAccordion(openAccordion === 'agenda' ? null : 'agenda')}
                                                            className="w-full flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3 text-emerald-800">
                                                                <div className="p-2 bg-emerald-100 rounded-lg">
                                                                    <Calendar size={20} />
                                                                </div>
                                                                <h4 className="font-bold text-lg">Agenda de Siguiente Reunión</h4>
                                                            </div>
                                                            {openAccordion === 'agenda' ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                                        </button>

                                                        {openAccordion === 'agenda' && (
                                                            <div className="p-5 animate-in slide-in-from-top-2 duration-200">
                                                                <AgreementEditor
                                                                    agreements={viewingMeetingDetails.next_meeting_agenda || []}
                                                                    onChange={(newAgenda) => {
                                                                        if (isClosed || isFinalized) return;
                                                                        const updatedMeeting = { ...viewingMeetingDetails, next_meeting_agenda: newAgenda };
                                                                        setViewingMeetingDetails(updatedMeeting);
                                                                        setSaveStatus('saving');
                                                                        if (window.agendaSaveTimeout) clearTimeout(window.agendaSaveTimeout);
                                                                        window.agendaSaveTimeout = setTimeout(async () => {
                                                                            try {
                                                                                const transform = (item) => ({
                                                                                    id: item.id, // Preserve ID
                                                                                    content: item.content || '',
                                                                                    level: item.level || 1,
                                                                                    children: item.children ? item.children.map(transform) : []
                                                                                });
                                                                                const backendPayload = {
                                                                                    ...updatedMeeting,
                                                                                    next_meeting_agenda: newAgenda.map(transform)
                                                                                };
                                                                                await api.planning.saveMeeting(backendPayload);
                                                                                setSaveStatus('saved');
                                                                            } catch (error) {
                                                                                console.error('Save error:', error);
                                                                                setSaveStatus('error');
                                                                            } finally {
                                                                                window.agendaSaveTimeout = null;
                                                                            }
                                                                        }, 1000);
                                                                    }}
                                                                    readOnly={isClosed || isFinalized}
                                                                />
                                                                {/* Secondary meta info/actions */}
                                                                {!(isClosed || isFinalized) && (
                                                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                                                        {viewingMeetingDetails.next_meeting_id ? (
                                                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                                                                                <div>
                                                                                    <h5 className="font-bold text-blue-900 flex items-center gap-2">
                                                                                        <CheckCircle size={16} className="text-green-500" />
                                                                                        Siguiente Reunión Programada
                                                                                    </h5>
                                                                                    {viewingMeetingDetails.plannedNextMeeting && (
                                                                                        <p className="text-sm text-blue-700 mt-1">
                                                                                            {viewingMeetingDetails.plannedNextMeeting.title} - {new Date(viewingMeetingDetails.plannedNextMeeting.date).toLocaleDateString('es-PE')}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() => {
                                                                                        // Open the next meeting modal in edit mode
                                                                                        const nextM = meetings.find(m => m.id === viewingMeetingDetails.next_meeting_id);
                                                                                        if (nextM) {
                                                                                            handleEditMeeting(nextM);
                                                                                            setViewingMeetingDetails(null); // Close current detail
                                                                                        } else {
                                                                                            showWarning('No se encontró la reunión en la lista local. Recargando...', 'Sincronizando');
                                                                                            loadData();
                                                                                        }
                                                                                    }}
                                                                                    className="bg-white hover:bg-blue-50 text-blue-600 border-blue-200"
                                                                                >
                                                                                    <Edit2 size={14} className="mr-2" /> Editar Programación
                                                                                </Button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex justify-end">
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    onClick={() => setShowNextMeetingModal(true)}
                                                                                    className="text-blue-600 hover:text-blue-700 font-bold"
                                                                                >
                                                                                    <Plus size={16} className="mr-1" /> PROGRAMAR OFICIALMENTE
                                                                                </Button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* --- TAB 2: PARTICIPANTES --- */}
                                            {activeTab === 'participantes' && (
                                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                                    <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                            <Users className="text-blue-500" size={20} />
                                                            Lista de Participantes
                                                        </h3>
                                                        {viewingMeetingDetails.attendances && viewingMeetingDetails.attendances.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {viewingMeetingDetails.attendances.map((att, idx) => {
                                                                    // Look up user details to ensure we have the name
                                                                    const user = users.find(u => u.id === att.user_id);
                                                                    const displayName = user ? user.name : (att.userName || 'Usuario');

                                                                    return (
                                                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                                                    {displayName.charAt(0)}
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-sm font-medium text-gray-700">{displayName}</span>
                                                                                    {att.check_in_time && (
                                                                                        <p className={`text-xs ${att.status === 'TARDANZA' ? 'text-amber-600 font-bold' : 'text-gray-500'} `}>
                                                                                            {att.status === 'TARDANZA' ? 'Tardanza' : 'Asistió'}: {new Date(att.check_in_time).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {/* Secretary Actions */}
                                                                                {isSecretary && (
                                                                                    <div className="flex items-center gap-1 mr-2">
                                                                                        {/* RECHAZAR (Si marcó pero no firmó) */}
                                                                                        {att.check_in_time && !att.signed_at && (
                                                                                            <button
                                                                                                className="flex items-center justify-center rounded transition-colors text-red-600 bg-red-50 hover:bg-red-100 h-7 w-7 border border-red-200"
                                                                                                title="Rechazar asistencia (Marcar como FALTA)"
                                                                                                onClick={async (e) => {
                                                                                                    e.stopPropagation();
                                                                                                    const result = await Swal.fire({
                                                                                                        title: '¿Anular asistencia?',
                                                                                                        text: `Se marcará como FALTA para ${displayName}.`,
                                                                                                        icon: 'warning',
                                                                                                        showCancelButton: true,
                                                                                                        confirmButtonColor: '#d33',
                                                                                                        cancelButtonColor: '#3085d6',
                                                                                                        confirmButtonText: 'Sí, anular',
                                                                                                        cancelButtonText: 'Cancelar'
                                                                                                    });

                                                                                                    if (result.isConfirmed) {
                                                                                                        await api.planning.rejectParticipant(viewingMeetingDetails.id, att.user_id);
                                                                                                        await refreshCurrentMeeting(); // Update UI immediately
                                                                                                        Swal.fire(
                                                                                                            'Anulado!',
                                                                                                            'La asistencia ha sido anulada.',
                                                                                                            'success'
                                                                                                        );
                                                                                                    }
                                                                                                }}
                                                                                            >
                                                                                                <XCircle size={16} />
                                                                                            </button>
                                                                                        )}
                                                                                        {/* JUSTIFICAR (Falta/Tardanza, < 24h) - Updated Condition */}
                                                                                        {(att.status === 'FALTA' || att.status === 'TARDANZA' || (!att.check_in_time && (isClosed || isFinalized))) &&
                                                                                            (!viewingMeetingDetails.real_end_time || (new Date() < new Date(new Date(viewingMeetingDetails.real_end_time).getTime() + 24 * 60 * 60 * 1000))) &&
                                                                                            !att.is_justified && att.penalty_status !== 'PAID' && (
                                                                                                <button
                                                                                                    className="flex items-center justify-center rounded transition-colors text-amber-600 bg-amber-50 hover:bg-amber-100 h-7 w-7 border border-amber-200"
                                                                                                    title="Justificar Falta/Tardanza"
                                                                                                    onClick={async (e) => {
                                                                                                        e.stopPropagation();
                                                                                                        const { value: reason } = await Swal.fire({
                                                                                                            title: 'Justificar Inasistencia',
                                                                                                            input: 'text',
                                                                                                            inputLabel: `Motivo para ${displayName} `,
                                                                                                            inputPlaceholder: 'Ingrese el motivo...',
                                                                                                            showCancelButton: true,
                                                                                                            inputValidator: (value) => {
                                                                                                                if (!value) {
                                                                                                                    return '¡Necesitas escribir un motivo!';
                                                                                                                }
                                                                                                            }
                                                                                                        });

                                                                                                        if (reason) {
                                                                                                            await api.planning.justifyParticipant(viewingMeetingDetails.id, att.user_id, reason);
                                                                                                            await refreshCurrentMeeting(); // Update UI immediately
                                                                                                            Swal.fire('Justificado', 'La inasistencia ha sido justificada.', 'success');
                                                                                                        }
                                                                                                    }}
                                                                                                >
                                                                                                    <FileText size={16} />
                                                                                                </button>
                                                                                            )}
                                                                                    </div>
                                                                                )}

                                                                                {att.signed_at ? (
                                                                                    <span className="text-green-600 font-medium flex items-center gap-1 text-sm">
                                                                                        <CheckCircle size={14} />
                                                                                        Firmado
                                                                                    </span>
                                                                                ) : att.is_justified ? (
                                                                                    <span className="text-blue-600 font-medium flex items-center gap-1 text-sm bg-blue-50 px-2 py-1 rounded">
                                                                                        <FileText size={14} />
                                                                                        Justificado
                                                                                    </span>
                                                                                ) : att.check_in_time ? (
                                                                                    <span className="text-blue-600 font-medium flex items-center gap-1 text-sm">
                                                                                        <Clock size={14} />
                                                                                        Asistió
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-gray-400 italic text-sm">No asistió</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-500 italic text-center py-8">No hay participantes registrados</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* --- TAB 3: TAREAS --- */}
                                            {activeTab === 'tareas' && (
                                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                                    <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <h4 className="font-bold text-gray-900">Progreso de Tareas</h4>
                                                            <span className="font-bold text-blue-600 text-sm">{meetingProgress}%</span>
                                                        </div>
                                                        <div className="bg-gray-100 rounded-full h-3 mb-6 border border-gray-200">
                                                            <div
                                                                className={`rounded-full h-3 transition-all duration-1000 ${meetingProgress >= 60 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-blue-500'} `}
                                                                style={{ width: `${meetingProgress}% ` }}
                                                            />
                                                        </div>

                                                        <div className="border rounded-xl overflow-hidden">
                                                            <div className="bg-slate-50 p-3 border-b flex justify-between items-center">
                                                                <span className="font-bold text-sm text-gray-700">Tareas Asignadas ({meetingTasks.length})</span>
                                                                {!isClosed && !isFinalized && (
                                                                    <button
                                                                        onClick={() => {
                                                                            handleAddTask(viewingMeetingDetails.id);
                                                                        }}
                                                                        className="text-gray-600 hover:text-blue-600 text-sm flex items-center gap-1 font-medium transition-colors"
                                                                    >
                                                                        <Plus size={16} /> Nueva Tarea
                                                                    </button>
                                                                )}
                                                            </div>

                                                            <div className="bg-white min-h-[100px] max-h-[400px] overflow-y-auto">
                                                                {meetingTasks.length === 0 ? (
                                                                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                                                        <Target size={48} className="mb-2 opacity-20" />
                                                                        <p className="text-sm">No hay tareas asignadas</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="divide-y divide-gray-100">
                                                                        {meetingTasks.map(task => {
                                                                            const assignedUser = users.find(u => u.id === task.assigned_to);

                                                                            return (
                                                                                <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                                                    <div className="flex justify-between items-start mb-3">
                                                                                        <div className="flex-1">
                                                                                            <p className="font-medium text-gray-800 text-sm mb-1">{task.title}</p>
                                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                                                                                                    <Users size={12} />
                                                                                                    {assignedUser?.name || 'Sin asignar'}
                                                                                                </span>
                                                                                                {task.deadline && (
                                                                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                                                        <Clock size={12} />
                                                                                                        {new Date(task.deadline).toLocaleDateString('es-PE')}
                                                                                                    </span>
                                                                                                )}
                                                                                                {task.priority && (
                                                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${task.priority === 'ALTA' ? 'bg-red-100 text-red-700' :
                                                                                                        task.priority === 'MEDIA' ? 'bg-yellow-100 text-yellow-700' :
                                                                                                            'bg-gray-100 text-gray-600'
                                                                                                        } `}>
                                                                                                        {task.priority === 'ALTA' ? 'Alta' : task.priority === 'MEDIA' ? 'Media' : 'Baja'}
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>

                                                                                        <button
                                                                                            onClick={() => setViewingTaskDetails(task)}
                                                                                            className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded transition-colors"
                                                                                            title="Ver detalles y comentarios"
                                                                                        >
                                                                                            <Eye size={16} />
                                                                                        </button>
                                                                                    </div>

                                                                                    <div className="space-y-1">
                                                                                        <div className="flex justify-between items-center text-xs">
                                                                                            <span className="text-gray-500">Progreso</span>
                                                                                            <span className="font-bold text-blue-600">{task.progress || 0}%</span>
                                                                                        </div>
                                                                                        <div className="bg-gray-100 rounded-full h-2">
                                                                                            <div
                                                                                                className={`rounded-full h-2 transition-all ${(task.progress || 0) === 100 ? 'bg-green-500' :
                                                                                                    (task.progress || 0) >= 50 ? 'bg-blue-500' :
                                                                                                        'bg-yellow-500'
                                                                                                    } `}
                                                                                                style={{ width: `${task.progress || 0}% ` }}
                                                                                            />
                                                                                        </div>
                                                                                    </div>

                                                                                    {task.comments && task.comments.length > 0 && (
                                                                                        <div className="mt-2 text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                                                                                            <MessageSquare size={12} className="inline mr-1" />
                                                                                            {task.comments[task.comments.length - 1].text}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* --- TAB 4: HERRAMIENTAS --- */}
                                            {activeTab === 'tools' && (
                                                <div className="animate-in slide-in-from-right-4 duration-300">
                                                    <ToolsManager
                                                        meetingId={viewingMeetingDetails.id}
                                                        isReadOnly={isClosed || isFinalized}
                                                        currentUser={currentUser}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* === FOOTER: ACTION BUTTONS === */}
                                        <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
                                            <div className="flex gap-2">
                                                {isRunning && (
                                                    <Button
                                                        variant="primary"
                                                        className="bg-red-600 hover:bg-red-700"
                                                        onClick={handleTerminate}
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-white animate-pulse mr-2" />
                                                        Terminar Sesión
                                                    </Button>
                                                )}

                                                {isFinalized && isSecretary && (
                                                    <Button
                                                        variant="primary"
                                                        className="bg-indigo-600 hover:bg-indigo-700"
                                                        onClick={handleClose}
                                                    >
                                                        <Lock size={16} className="mr-2" />
                                                        Cerrar Acta
                                                    </Button>
                                                )}
                                                {isRunning && !viewingMeetingDetails.attendances?.some(a => a.user_id === currentUser.id && a.check_in_time) && (
                                                    <Button
                                                        variant="primary"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={async () => {
                                                            try {
                                                                await api.planning.markAttendance(viewingMeetingDetails.id);
                                                                // Manually update local state to reflect change immediately
                                                                // or just reload
                                                                await loadData();
                                                            } catch (error) {
                                                                console.error(error);
                                                            }
                                                        }}
                                                    >
                                                        <Clock size={16} className="mr-2" />
                                                        Marcar Asistencia
                                                    </Button>
                                                )}
                                                {isFinalized &&
                                                    viewingMeetingDetails.attendances?.some(a => a.user_id === currentUser.id && a.check_in_time && !a.signed_at) && (
                                                        <Button
                                                            variant="primary"
                                                            className="bg-indigo-600 hover:bg-indigo-700"
                                                            onClick={() => setIsSigningActa(true)}
                                                        >
                                                            <PenTool size={16} className="mr-2" />
                                                            Firmar Acta
                                                        </Button>
                                                    )}
                                            </div>
                                            <div className="flex gap-2">
                                                {/* Botón de Vista Previa (Solo Organizadores) */}
                                                {/* Botón de Vista Previa (Solo Organizadores) */}
                                                {(isOrganizer || isSuperAdmin) && viewingMeetingDetails.status !== 'FINALIZADA' && viewingMeetingDetails.status !== 'ACTA_CERRADA' && viewingMeetingDetails.status !== 'CERRADA' && (
                                                    <Button
                                                        variant="outline"
                                                        onClick={handleTogglePreview}
                                                        className={`gap-2 ${viewingMeetingDetails.is_preview_active ? 'bg-amber-50 text-amber-700 border-amber-200' : ''} `}
                                                    >
                                                        {viewingMeetingDetails.is_preview_active ? (
                                                            <>
                                                                <EyeOff size={16} />
                                                                Desactivar Vista Previa
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye size={16} />
                                                                Activar Vista Previa
                                                            </>
                                                        )}
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="outline"
                                                    onClick={() => handlePrintMeeting(viewingMeetingDetails)}
                                                    className="gap-2"
                                                >
                                                    <Printer size={16} />
                                                    Descargar Acta (PDF)
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                            <MeetingRealTimeUpdater onUpdate={handleRealTimeUpdate} />
                        </MeetingWSProvider>
                    </div>
                </div>
            )}

            <TaskAssignmentModal
                isOpen={isAddingTask}
                onClose={() => setIsAddingTask(false)}
                meetingId={viewingMeetingDetails?.id}
                attendees={(viewingMeetingDetails?.attendances || []).map(att => ({
                    ...att,
                    user_name: users.find(u => u.id === att.user_id)?.name || att.user_name || 'Usuario desconocido'
                }))}
                onTaskAdded={loadData}
            />

            {/* Task Details Modal */}
            <Modal
                isOpen={!!viewingTaskDetails}
                onClose={() => setViewingTaskDetails(null)}
                title="Detalles de la Tarea"
                size="lg"
            >
                {viewingTaskDetails && (() => {
                    const assignedUser = users.find(u => u.id === viewingTaskDetails.assigned_to);
                    const meeting = meetings.find(m => m.id === viewingTaskDetails.meeting_id);

                    return (
                        <div className="space-y-4">
                            {/* Información básica */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <h4 className="font-bold text-gray-800">{viewingTaskDetails.title}</h4>
                                {viewingTaskDetails.description && (
                                    <p className="text-sm text-gray-600">{viewingTaskDetails.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                                    <span className="flex items-center gap-1">
                                        <Users size={14} />
                                        {assignedUser?.name || 'Sin asignar'}
                                    </span>
                                    {viewingTaskDetails.deadline && (
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {new Date(viewingTaskDetails.deadline).toLocaleDateString('es-PE')}
                                        </span>
                                    )}
                                    {viewingTaskDetails.priority && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${viewingTaskDetails.priority === 'ALTA' ? 'bg-red-100 text-red-700' :
                                            viewingTaskDetails.priority === 'MEDIA' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-600'
                                            } `}>
                                            Prioridad: {viewingTaskDetails.priority === 'ALTA' ? 'Alta' :
                                                viewingTaskDetails.priority === 'MEDIA' ? 'Media' : 'Baja'}
                                        </span>
                                    )}
                                </div>
                                {meeting && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar size={12} />
                                        Reunión: {meeting.title} - {new Date(meeting.date).toLocaleDateString('es-PE')}
                                    </p>
                                )}
                            </div>

                            {/* Progreso */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Progreso</span>
                                    <span className="text-lg font-bold text-blue-600">{viewingTaskDetails.progress || 0}%</span>
                                </div>
                                <div className="bg-gray-100 rounded-full h-3">
                                    <div
                                        className={`rounded-full h-3 transition-all ${(viewingTaskDetails.progress || 0) === 100 ? 'bg-green-500' :
                                            (viewingTaskDetails.progress || 0) >= 50 ? 'bg-blue-500' :
                                                'bg-yellow-500'
                                            } `}
                                        style={{ width: `${viewingTaskDetails.progress || 0}% ` }}
                                    />
                                </div>
                            </div>

                            {/* Historial de comentarios */}
                            <div>
                                <h5 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <MessageSquare size={16} />
                                    Historial de Comentarios
                                </h5>
                                {viewingTaskDetails.comments && viewingTaskDetails.comments.length > 0 ? (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                        {viewingTaskDetails.comments.map((comment, idx) => (
                                            <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(comment.timestamp).toLocaleString('es-PE', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                    <span className="text-xs font-medium text-blue-600">
                                                        Progreso: {comment.progress}%
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700">{comment.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        No hay comentarios registrados
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </Modal >

            {/* Previous Meetings Modal */}
            < Modal
                isOpen={viewingPreviousMeetings}
                onClose={() => setViewingPreviousMeetings(false)}
                title="Reuniones Anteriores"
                size="3xl"
            >
                {(() => {
                    const totalPages = Math.ceil(filteredPreviousMeetings.length / ITEMS_PER_PAGE);
                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                    const currentPreviousMeetings = filteredPreviousMeetings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                    return (
                        <div className="space-y-4">
                            {/* Header with count */}
                            <div className="flex items-center justify-between pb-3 border-b">
                                <span className="text-sm text-gray-600">
                                    {filteredPreviousMeetings.length} reunión{filteredPreviousMeetings.length !== 1 ? 'es' : ''} encontrada{filteredPreviousMeetings.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Date Filters */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-bold text-gray-600 mb-1">
                                            Desde
                                        </label>
                                        <input
                                            type="date"
                                            value={dateFilter.startDate}
                                            onChange={(e) => {
                                                setDateFilter({ ...dateFilter, startDate: e.target.value });
                                                setCurrentPage(1);
                                            }}
                                            className="w-full p-2 border rounded-lg text-sm"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-bold text-gray-600 mb-1">
                                            Hasta
                                        </label>
                                        <input
                                            type="date"
                                            value={dateFilter.endDate}
                                            onChange={(e) => {
                                                setDateFilter({ ...dateFilter, endDate: e.target.value });
                                                setCurrentPage(1);
                                            }}
                                            className="w-full p-2 border rounded-lg text-sm"
                                        />
                                    </div>
                                    {(dateFilter.startDate || dateFilter.endDate) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleClearFilters}
                                            className="self-end text-xs"
                                        >
                                            Limpiar Filtros
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Meetings List */}
                            {currentPreviousMeetings.length > 0 ? (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                    {currentPreviousMeetings.map(meeting => (
                                        <MeetingItem key={meeting.id} meeting={meeting} isRecent={false} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No se encontraron reuniones con los filtros aplicados</p>
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-4 pt-4 border-t text-sm text-gray-600">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className={`px-4 py-2 rounded-md border font-medium ${currentPage === 1 ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-50 hover:border-blue-300'} `}
                                    >
                                        Anterior
                                    </button>
                                    <span className="font-medium">Página {currentPage} de {totalPages}</span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`px-4 py-2 rounded-md border font-medium ${currentPage === totalPages ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-50 hover:border-blue-300'} `}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </Modal >

            {/* Participants Modal */}
            < Modal
                isOpen={showParticipantsModal}
                onClose={() => setShowParticipantsModal(false)}
                title="Lista de Participantes"
                size="xl"
            >
                {viewingMeetingDetails && (() => {
                    // 1. Get ONLY invited participants (those with attendance records)
                    const participantIds = new Set((viewingMeetingDetails.attendances || []).map(a => a.user_id));
                    const organizerUsersList = users.filter(u => participantIds.has(u.id));
                    const currentAttendees = viewingMeetingDetails.attendances || [];
                    const isClosed = viewingMeetingDetails.status === 'ACTA_CERRADA' || viewingMeetingDetails.status === 'FINALIZADA';

                    // Allow SuperAdmin, Admin, or Secretary to manage attendance
                    const isSecretary = currentUser?.isSuperAdmin ||
                        currentUser?.role === 'admin' ||
                        currentUser?.eventRole === 'secretaria' ||
                        currentUser?.organizerFunction === 'secretaria' ||
                        (currentUser?.roles && (currentUser.roles.includes('admin') || currentUser.roles.includes('secretaria')));

                    // 2. Helper to calculate status and fine
                    const getAttendanceInfo = (user) => {
                        const attendance = currentAttendees.find(a => a.user_id === user.id);

                        let status = 'falta';
                        let fine = 0;
                        let statusLabel = 'Falta';
                        let statusColor = 'bg-red-100 text-red-700';
                        let timeLabel = '-';

                        if (attendance?.is_justified) {
                            return {
                                status: 'justified',
                                label: 'Justificado',
                                color: 'bg-blue-100 text-blue-700',
                                fine: 0,
                                time: attendance.check_in_time ? new Date(attendance.check_in_time).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : 'Justificado',
                                attendanceRecord: attendance
                            };
                        }

                        if (attendance) {
                            if (attendance.status === 'TARDANZA') {
                                status = 'tardanza';
                                fine = 10.00;
                                statusLabel = 'Tardanza';
                                statusColor = 'bg-yellow-100 text-yellow-700';
                            } else if (attendance.status === 'PRESENTE') {
                                status = 'presente';
                                fine = 0;
                                statusLabel = 'Presente';
                                statusColor = 'bg-green-100 text-green-700';
                            }

                            if (attendance.check_in_time) {
                                timeLabel = new Date(attendance.check_in_time).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
                            }

                            if (isClosed && !attendance.signed_at) {
                                status = 'falta_firma';
                                fine = 20.00;
                                statusLabel = 'Falta (No Firmó)';
                                statusColor = 'bg-red-100 text-red-700 border-red-200';
                            }
                        } else if (isClosed) {
                            fine = 20.00;
                        }

                        return { status, label: statusLabel, color: statusColor, fine, time: timeLabel, attendanceRecord: attendance };
                    };

                    const handleUpdateParticipant = async (userId, updates) => {
                        try {
                            // This part should technically call a backend endpoint
                            // For now, we update local state and save meeting
                            const currentAttendance = viewingMeetingDetails.attendances || [];
                            const attendeeIndex = currentAttendance.findIndex(a => a.user_id === userId);
                            let updatedAttendance = [...currentAttendance];

                            if (attendeeIndex >= 0) {
                                updatedAttendance[attendeeIndex] = { ...updatedAttendance[attendeeIndex], ...updates };
                            } else {
                                updatedAttendance.push({
                                    user_id: userId,
                                    user_name: users.find(u => u.id === userId)?.name,
                                    ...updates
                                });
                            }

                            const updatedMeeting = { ...viewingMeetingDetails, attendances: updatedAttendance };
                            setViewingMeetingDetails(updatedMeeting);
                            await api.planning.saveMeeting(updatedMeeting);
                            await loadData();
                        } catch (error) {
                            showError('Error al actualizar participante');
                        }
                    };

                    const handleRemoveParticipant = async (userId) => {
                        const confirmed = await showConfirm('¿Remover participante de la lista?', 'Remover');
                        if (!confirmed) return;

                        const updatedAttendance = (viewingMeetingDetails.attendances || []).filter(a => a.user_id !== userId);
                        const updatedMeeting = { ...viewingMeetingDetails, attendances: updatedAttendance };
                        setViewingMeetingDetails(updatedMeeting);
                        await api.planning.saveMeeting(updatedMeeting);
                        await loadData();
                    };

                    return (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-gray-500 mb-2">
                                <p><strong>Reglas de Asistencia:</strong></p>
                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                    <li>Tolerancia: 10 min (Tardanza: S/ 10.00)</li>
                                    <li>Firma de Acta: 15 min tras cierre (Falta: S/ 10.00-S/ 20.00)</li>
                                </ul>
                            </div>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {organizerUsersList.map(user => {
                                    const info = getAttendanceInfo(user);

                                    return (
                                        <div key={user.id} className="flex items-center justify-between text-sm bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                            <div className="flex-1 min-w-0 mr-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-900 font-bold truncate" title={user.name}>
                                                        {user.name}
                                                    </span>
                                                    {info.fine > 0 && (
                                                        <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                                            -S/ {info.fine.toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${info.color} `}>
                                                        {info.label}
                                                    </span>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {info.time}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions for Secretary */}
                                            {isSecretary && (
                                                <div className="flex flex-col gap-1 items-end">
                                                    <div className="flex items-center gap-1">
                                                        {/* RECHAZAR ASISTENCIA (Si marcó asistencia pero no firmó) */}
                                                        {info.attendanceRecord?.check_in_time && !info.attendanceRecord?.signed_at && (
                                                            <button
                                                                className="flex items-center justify-center rounded transition-colors text-red-600 bg-red-50 hover:bg-red-100 h-7 w-7 border border-red-200"
                                                                title="Rechazar asistencia (Marcar como FALTA)"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    const result = await Swal.fire({
                                                                        title: '¿Anular asistencia?',
                                                                        text: 'Se marcará como FALTA.',
                                                                        icon: 'warning',
                                                                        showCancelButton: true,
                                                                        confirmButtonColor: '#d33',
                                                                        cancelButtonColor: '#3085d6',
                                                                        confirmButtonText: 'Sí, anular',
                                                                        cancelButtonText: 'Cancelar'
                                                                    });

                                                                    if (result.isConfirmed) {
                                                                        await api.planning.rejectParticipant(viewingMeetingDetails.id, user.id);
                                                                        await refreshCurrentMeeting(); // Update UI immediately
                                                                        Swal.fire('Anulado!', 'La asistencia ha sido anulada.', 'success');
                                                                    }
                                                                }}
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        )}

                                                        {/* JUSTIFICAR (Solo FALTA o TARDANZA, 24h post-reunión) */}
                                                        {(info.attendanceRecord?.status === 'FALTA' || info.attendanceRecord?.status === 'TARDANZA' || (!info.attendanceRecord?.check_in_time && (isClosed || isFinalized))) &&
                                                            (!viewingMeetingDetails.real_end_time || (new Date() < new Date(new Date(viewingMeetingDetails.real_end_time).getTime() + 24 * 60 * 60 * 1000))) &&
                                                            !info.attendanceRecord?.is_justified &&
                                                            info.attendanceRecord?.penalty_status !== 'PAID' && (
                                                                <button
                                                                    className="flex items-center justify-center rounded transition-colors text-amber-600 bg-amber-50 hover:bg-amber-100 h-7 w-7 border border-amber-200"
                                                                    title="Justificar Falta/Tardanza"
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        const { value: reason } = await Swal.fire({
                                                                            title: 'Justificar Inasistencia',
                                                                            input: 'text',
                                                                            inputLabel: 'Motivo de la justificación',
                                                                            inputPlaceholder: 'Ingrese el motivo...',
                                                                            showCancelButton: true,
                                                                            inputValidator: (value) => {
                                                                                if (!value) {
                                                                                    return '¡Necesitas escribir un motivo!';
                                                                                }
                                                                            }
                                                                        });

                                                                        if (reason) {
                                                                            await api.planning.justifyParticipant(viewingMeetingDetails.id, user.id, reason);
                                                                            await refreshCurrentMeeting(); // Update UI immediately
                                                                            Swal.fire('Justificado', 'La inasistencia ha sido justificada.', 'success');
                                                                        }
                                                                    }}
                                                                >
                                                                    <FileText size={16} />
                                                                </button>
                                                            )}
                                                    </div>
                                                    {/* MARK ATTENDANCE (If Marked but not Confirmed) */}
                                                    {info.attendanceRecord && info.attendanceRecord.status === 'pending' && !info.attendanceRecord.justified && (
                                                        <div className="flex gap-1 mb-1">
                                                            <button
                                                                onClick={() => handleUpdateParticipant(user.id, { status: 'confirmed' })}
                                                                className="text-[10px] bg-green-50 text-green-600 hover:bg-green-100 px-2 py-1 rounded border border-green-200 transition-colors"
                                                            >
                                                                Validar
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveParticipant(user.id)}
                                                                className="text-[10px] bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded border border-red-200 transition-colors"
                                                            >
                                                                Rechazar
                                                            </button>
                                                        </div>

                                                    )}



                                                    {/* SIGNED INDICATOR */}
                                                    {info.attendanceRecord?.signed_at && (
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200 font-bold mb-1 cursor-default">
                                                            FIRMADO
                                                        </span>
                                                    )}

                                                    {/* JUSTIFY / EMERGENCY */}
                                                    {!info.attendanceRecord?.justified && !info.attendanceRecord?.emergencyExit && !info.attendanceRecord?.signed_at && (
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={async () => {
                                                                    const reason = await showInput('Motivo de justificación:', 'Justificar Asistencia', { placeholder: 'Ingrese el motivo...' });
                                                                    if (reason) handleUpdateParticipant(user.id, { justified: true, justificationReason: reason });
                                                                }}
                                                                className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition-colors"
                                                            >
                                                                Justificar
                                                            </button>
                                                            {(info.status === 'presente' || info.status === 'tardanza') && (
                                                                <button
                                                                    onClick={async () => {
                                                                        const confirmed = await showConfirm('¿Registrar salida de emergencia? Esto exonerará de multa de firma.', 'Salida de Emergencia', { confirmText: 'Registrar Salida', confirmColor: '#ea580c' });
                                                                        if (confirmed) {
                                                                            handleUpdateParticipant(user.id, { emergencyExit: true, emergencyExitAt: new Date().toISOString() });
                                                                        }
                                                                    }}
                                                                    className="text-[10px] bg-orange-50 text-orange-600 hover:bg-orange-100 px-2 py-1 rounded border border-orange-200 transition-colors"
                                                                >
                                                                    Emergencia
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* UNDO */}
                                                    {(info.attendanceRecord?.justified || info.attendanceRecord?.emergencyExit) && (
                                                        <button
                                                            onClick={async () => {
                                                                const confirmed = await showConfirm('¿Remover justificación/excepción?', 'Deshacer Acción');
                                                                if (confirmed) {
                                                                    handleUpdateParticipant(user.id, { justified: false, emergencyExit: false, justificationReason: null });
                                                                }
                                                            }}
                                                            className="text-[10px] text-gray-400 hover:text-red-500 underline"
                                                        >
                                                            Deshacer Justificación
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}
            </Modal >

            {/* Next Meeting Modal */}
            <Modal
                isOpen={showNextMeetingModal}
                onClose={() => setShowNextMeetingModal(false)}
                title="Programar Siguiente Reunión"
                size="lg"
            >
                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                        <p className="text-sm text-blue-800">
                            Configure los detalles y la agenda preliminar para la próxima reunión.
                            Los puntos agregados aquí aparecerán como acuerdos iniciales/agenda en la nueva reunión.
                        </p>
                    </div>

                    <FormField
                        label="Título de la Reunión"
                        value={nextMeeting.title}
                        onChange={(e) => setNextMeeting({ ...nextMeeting, title: e.target.value })}
                        placeholder="Ej: Reunión de Seguimiento Semanal"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            label="Fecha"
                            type="date"
                            value={nextMeeting.date}
                            onChange={(e) => setNextMeeting({ ...nextMeeting, date: e.target.value })}
                        />
                        <FormField
                            label="Hora"
                            type="time"
                            value={nextMeeting.startTime}
                            onChange={(e) => setNextMeeting({ ...nextMeeting, startTime: e.target.value })}
                        />
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-bold text-gray-800 mb-2">Agenda a tratar y responsables</h4>
                        <p className="text-xs text-gray-500 mb-3">
                            Agregue los puntos a tratar en la siguiente reunión. Puede usar jerarquías (1, 1.a, 1.a.i) para detallar temas.
                        </p>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <AgreementEditor
                                agreements={nextMeeting.agreements}
                                onChange={(newAgreements) => setNextMeeting({ ...nextMeeting, agreements: newAgreements })}
                                readOnly={false}
                                addButtonText="Agregar Agenda"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            variant="primary"
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={async () => {
                                if (!nextMeeting.title || !nextMeeting.date) {
                                    showWarning('Complete título y fecha de la reunión', 'Campos requeridos');
                                    return;
                                }

                                // 3. Construct the payload
                                const meetingPayload = {
                                    title: nextMeeting.title,
                                    scheduled_start: `${nextMeeting.date}T${nextMeeting.startTime}:00`,
                                    status: 'PROGRAMADA',
                                    agreements: nextMeeting.agreements,
                                    // Optionally carry over tasks logic if needed
                                };

                                const savedNewMeeting = await api.planning.saveMeeting(meetingPayload);

                                const updatedCurrentMeeting = {
                                    ...viewingMeetingDetails,
                                    next_meeting_id: savedNewMeeting.id
                                };
                                await api.planning.saveMeeting(updatedCurrentMeeting);

                                setViewingMeetingDetails(updatedCurrentMeeting); // Keep UI in sync locally without full reload
                                setMeetings(prev => prev.map(m => m.id === viewingMeetingDetails.id ? updatedCurrentMeeting : m));

                                await loadData();
                                setNextMeeting({ title: '', date: '', startTime: '', agreements: [] });
                                setShowNextMeetingModal(false);
                                showWarning('Reunión programada exitosamente', 'Éxito');
                            }}
                        >
                            <Calendar size={18} className="mr-2" />
                            Programar Reunión
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Secure Signing Modal */}
            <Modal
                isOpen={isSigningActa}
                onClose={() => setIsSigningActa(false)}
                title="Firma Digital-Re-autenticación"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="bg-amber-50 p-3 rounded border border-amber-200 text-xs text-amber-800">
                        <AlertCircle size={16} className="inline mr-1" />
                        Esta acción generará una firma digital no repudiable mediante un hash <strong>SHA-256</strong>.
                        Debes confirmar tu identidad.
                    </div>
                    <FormField
                        label="Contraseña de Usuario"
                        type="password"
                        value={signingPassword}
                        onChange={(e) => setSigningPassword(e.target.value)}
                        placeholder="Ingresa tu contraseña para firmar"
                    />
                    <div className="flex gap-2">
                        <Button variant="ghost" className="flex-1" onClick={() => setIsSigningActa(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" className="flex-1 bg-indigo-600" onClick={() => handleSignActa(viewingMeetingDetails.id)}>
                            Firmar Acta
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Confirm Dialog-Placed last to ensure it renders on top */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
            />
        </div >

    );
};

export default PlanningManager;
