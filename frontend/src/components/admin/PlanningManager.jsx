import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Edit2, Users, CheckCircle, Clock, AlertCircle, Target, TrendingUp, MessageSquare, Eye, Printer } from 'lucide-react';
import { Button, Card, Modal, FormField, LoadingSpinner, EmptyState, ConfirmDialog } from '../ui';
import { api } from '../../services/api';
import { useApi } from '../../hooks';
import { showWarning, showError } from '../../utils/alerts';
import AgreementEditor from './AgreementEditor';
import { flattenAgreements } from '../../utils/agreementUtils';

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
    const [viewingPreviousMeetings, setViewingPreviousMeetings] = useState(false);
    const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
    const [viewingTaskDetails, setViewingTaskDetails] = useState(null);
    const [openedFromPreviousMeetings, setOpenedFromPreviousMeetings] = useState(false);
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [showNextMeetingModal, setShowNextMeetingModal] = useState(false);
    const [nextMeeting, setNextMeeting] = useState({ title: '', date: '', startTime: '', agreements: [] });
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

    // Calculate meeting progress for each meeting
    const getMeetingProgress = (meeting) => {
        const meetingTasks = tasks.filter(t => t.meetingId === meeting.id);
        return meetingTasks.length > 0
            ? Math.round(meetingTasks.reduce((sum, t) => sum + t.progress, 0) / meetingTasks.length)
            : meeting.status === 'closed' ? 100 : 0;
    };

    // Calculate overall progress based on meetings
    const overallProgress = meetings.length > 0
        ? Math.round(meetings.reduce((sum, meeting) => sum + getMeetingProgress(meeting), 0) / meetings.length)
        : 0;

    // Meeting statistics
    const meetingStats = {
        total: meetings.length,
        completed: meetings.filter(m => m.status === 'closed').length,
        inProgress: meetings.filter(m => m.status === 'open' && new Date(m.date) <= new Date()).length,
        pending: meetings.filter(m => m.status === 'open' && new Date(m.date) > new Date()).length
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
            startTime: '', // New field
            title: '',
            status: 'open', // New: Meetings start as open
            agreements: [''],
            attendees: [],
            createdBy: currentUser.id
        });
        setIsEditingMeeting(true);
    };

    const handleEditMeeting = (meeting) => {
        if (meeting.status === 'closed') {
            showWarning('Esta reunión ya ha sido finalizada.', 'No se puede editar');
            return;
        }
        setCurrentMeeting({ ...meeting });
        setIsEditingMeeting(true);
    };

    const handleSaveMeeting = async () => {
        if (!currentMeeting.title || !currentMeeting.date) {
            showWarning('Complete todos los campos requeridos.', 'Campos incompletos');
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

        // Get next meeting for agenda
        let nextMeetingPrint = null;
        if (meeting.plannedNextMeeting) {
            nextMeetingPrint = meeting.plannedNextMeeting;
        } else {
            // Legacy fallback
            const meetingEnd = new Date(`${meeting.date}T${meeting.startTime || '00:00'}`);
            const upcomingMeetings = meetings.filter(m => {
                if (m.status !== 'open') return false;
                const mStart = new Date(`${m.date}T${m.startTime || '00:00'}`);
                return mStart > meetingEnd;
            }).sort((a, b) => new Date(`${a.date}T${a.startTime || '00:00'}`) - new Date(`${b.date}T${b.startTime || '00:00'}`));
            nextMeetingPrint = upcomingMeetings.length > 0 ? upcomingMeetings[0] : null;
        }

        // Get attendees with status
        const attendeesList = meeting.attendance
            ? meeting.attendance.map(a => {
                const user = users.find(u => u.id === a.userId);
                const name = user ? user.name : a.userName;
                let status = '';
                let statusColor = '#374151'; // Default gray

                if (a.isJustified) {
                    status = 'Justificado';
                    statusColor = '#d97706'; // Amber
                } else if (a.signedAt) {
                    status = 'Presente (Firmado)';
                    statusColor = '#059669'; // Emerald
                } else {
                    status = 'Falta / No Firmado';
                    statusColor = '#dc2626'; // Red
                }

                return { name, status, statusColor };
            })
            : [];

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
                    .participants { margin-top: 15px; }
                    .participants ul { list-style-type: none; padding-left: 0; }
                    .participants li { padding: 5px 0; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; }
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

                <h2>Participantes</h2>
                <div class="participants">
                    ${attendeesList.length > 0
                ? `<ul>${attendeesList.map(item => `
                        <li>
                            <span>${item.name}</span>
                            <span style="color: ${item.statusColor}; font-weight: bold; font-size: 0.9em;">${item.status}</span>
                        </li>`).join('')}</ul>`
                : '<p>No se registraron participantes.</p>'
            }
                </div>

                <h2>Acuerdos</h2>
                ${meeting.agreements && meeting.agreements.length > 0
                ? (() => {
                    const flattened = flattenAgreements(meeting.agreements);
                    return flattened.length > 0
                        ? `<ul style="list-style: none; padding-left: 0;">${flattened.map(item => `
                            <li style="margin-bottom: 8px; padding-left: ${(item.level - 1) * 30}px;">
                                <strong>${item.numbering}</strong> ${item.text}
                            </li>`).join('')}</ul>`
                        : '<p>No se registraron acuerdos específicos.</p>';
                })()
                : '<p>No se registraron acuerdos específicos.</p>'
            }

                <h2>Agenda de la Próxima Reunión</h2>
                ${nextMeetingPrint
                ? (() => {
                    const flattened = flattenAgreements(nextMeetingPrint.agreements || []);
                    return `
                        <div style="margin-bottom: 20px; padding: 15px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                            <p style="font-weight: bold; color: #1e3a8a; margin-bottom: 5px; font-size: 1.1em;">${nextMeetingPrint.title}</p>
                            <p style="font-size: 0.9em; color: #64748b; margin-bottom: 15px;">
                                <strong>Fecha:</strong> ${new Date(nextMeetingPrint.date).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
                                ${nextMeetingPrint.startTime ? ` | <strong>Hora:</strong> ${nextMeetingPrint.startTime}` : ''}
                            </p>
                            
                            <h3 style="font-size: 1em; color: #334155; margin-bottom: 10px; border-bottom: none;">Puntos de Agenda:</h3>
                            ${flattened.length > 0
                            ? `<ul style="list-style: none; padding-left: 0;">${flattened.map(item => `
                                    <li style="margin-bottom: 8px; padding-left: ${(item.level - 1) * 20}px;">
                                        <strong>${item.numbering}</strong> ${item.text}
                                    </li>`).join('')}</ul>`
                            : '<p style="font-style: italic; color: #94a3b8;">No hay puntos de agenda definidos.</p>'
                        }
                        </div>`;
                })()
                : '<p style="font-style: italic; color: #94a3b8;">No hay próxima reunión programada.</p>'
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

                <h2>Firmas</h2>
                ${meeting.attendance && meeting.attendance.some(a => a.signedAt)
                ? `<div class="signatures">
                        <p style="margin-bottom: 20px; color: #666; font-size: 0.9em;">
                            Las siguientes personas firmaron el acta de esta reunión:
                        </p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Fecha y Hora de Firma</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${meeting.attendance
                    .filter(a => a.signedAt)
                    .map(a => {
                        const user = users.find(u => u.id === a.userId);
                        const name = user ? user.name : a.userName;
                        const signedDate = new Date(a.signedAt).toLocaleString('es-PE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        return `
                                            <tr>
                                                <td>${name}</td>
                                                <td>${signedDate}</td>
                                            </tr>
                                        `;
                    }).join('')}
                            </tbody>
                        </table>
                    </div>`
                : '<p style="color: #dc2626; font-style: italic;">Esta acta no ha sido firmada por ningún participante.</p>'
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
            showWarning('Complete todos los campos requeridos.', 'Campos incompletos');
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
            : meeting.status === 'closed' ? 100 : 0;

        // Check if meeting is in the future
        const meetingDateTime = new Date(`${meeting.date}T${meeting.startTime || '00:00'}`);
        const isFuture = meeting.status === 'open' && meetingDateTime > new Date();

        return (
            <div
                className={`bg-white rounded-xl border border-gray-100 transition-all group 
                    ${isFuture
                        ? 'opacity-70 cursor-not-allowed bg-gray-50'
                        : 'hover:border-blue-300 hover:shadow-md cursor-pointer'
                    } 
                    ${!isRecent && !isFuture ? 'opacity-80 hover:opacity-100' : ''}`}
                onClick={() => {
                    if (isFuture) {
                        showWarning(
                            `Esta reunión está programada para el ${new Date(`${meeting.date}T12:00:00`).toLocaleDateString('es-PE')}`,
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
                <div className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors ${isFuture ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
                                <Calendar size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className={`font-bold ${isFuture ? 'text-gray-500' : 'text-gray-800'}`}>{meeting.title}</h4>
                                    {meeting.status === 'closed' && (
                                        <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                            FINALIZADA
                                        </span>
                                    )}
                                    {isFuture && (
                                        <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                            <Clock size={10} /> PROGRAMADA
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(`${meeting.date}T12:00:00`).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
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
                        {meeting.status !== 'closed' ? (
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" onClick={() => handleEditMeeting(meeting)}>
                                    <Edit2 size={16} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteMeeting(meeting.id)}>
                                    <Trash2 size={16} className="text-red-500" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="opacity-0 cursor-default">
                                    <Edit2 size={16} />
                                </Button>
                            </div>
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
                onClose={() => {
                    setViewingMeetingDetails(null);
                    if (openedFromPreviousMeetings) {
                        setViewingPreviousMeetings(true);
                        setOpenedFromPreviousMeetings(false);
                    }
                }}
                title="Detalles de la Reunión"
                size="3xl"
            >
                {viewingMeetingDetails && (() => {
                    const meetingTasks = tasks.filter(t => t.meetingId === viewingMeetingDetails.id);
                    const meetingProgress = meetingTasks.length > 0
                        ? Math.round(meetingTasks.reduce((sum, t) => sum + t.progress, 0) / meetingTasks.length)
                        : viewingMeetingDetails.status === 'closed' ? 100 : 0;

                    // Ensure status exists (default to 'open' if undefined)
                    const isClosed = viewingMeetingDetails.status === 'closed';

                    const handleEndMeeting = async () => {
                        setConfirmDialog({
                            isOpen: true,
                            title: 'Terminar Reunión',
                            message: '¿Está seguro de terminar la reunión? No podrá realizar más modificaciones.',
                            type: 'warning',
                            onConfirm: async () => {
                                const updatedMeeting = await api.planning.closeMeeting(viewingMeetingDetails.id);
                                await loadData();
                                setViewingMeetingDetails(updatedMeeting);
                                setConfirmDialog({ isOpen: false });
                            }
                        });
                    };

                    const handleConfirmAttendance = async (userId, status) => {
                        if (isClosed) return;

                        try {
                            await api.planning.updateAttendanceStatus(
                                viewingMeetingDetails.id,
                                userId,
                                status, // 'confirmed' or 'rejected'
                                currentUser.id
                            );
                            await loadData();
                            // Reload meeting details
                            const updatedMeetings = await api.planning.getMeetings();
                            const updatedMeeting = updatedMeetings.find(m => m.id === viewingMeetingDetails.id);
                            setViewingMeetingDetails(updatedMeeting);
                        } catch (error) {
                            showError(error.message || 'Error al actualizar asistencia');
                        }
                    };

                    // Get organizers who marked attendance for this meeting
                    const meetingAttendance = viewingMeetingDetails.attendance || [];
                    const organizerUsers = users.filter(u =>
                        u.eventRole === 'organizador' || u.eventRoles?.includes('organizador')
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
                                        onClick={() => setShowParticipantsModal(true)}
                                        className="gap-2"
                                    >
                                        <Users size={16} />
                                        Participantes
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handlePrintMeeting(viewingMeetingDetails)}
                                        className="gap-2"
                                    >
                                        <Printer size={16} />
                                        Imprimir Acta
                                    </Button>
                                </div>
                            </div>

                            {/* Main Grid: Agreements & Participants */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Agreements Column */}
                                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 md:col-span-2">
                                    <div className="flex items-center gap-2 mb-4 text-blue-800">
                                        <MessageSquare size={18} />
                                        <h4 className="font-bold">Acuerdos Tomados</h4>
                                    </div>

                                    {isClosed ? (
                                        viewingMeetingDetails.agreements && viewingMeetingDetails.agreements.length > 0 ? (
                                            <ul className="space-y-3">
                                                {viewingMeetingDetails.agreements.map((agreement, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                                        <span>{typeof agreement === 'object' ? agreement.text : agreement}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="text-center py-8 text-gray-400 text-sm italic">
                                                No hay acuerdos registrados
                                            </div>
                                        )
                                    ) : (
                                        <AgreementEditor
                                            agreements={viewingMeetingDetails.agreements}
                                            onChange={async (newAgreements) => {
                                                const updatedMeeting = { ...viewingMeetingDetails, agreements: newAgreements };
                                                setViewingMeetingDetails(updatedMeeting);
                                                await api.planning.saveMeeting(updatedMeeting);
                                                loadData();
                                            }}
                                            readOnly={false}
                                        />
                                    )}
                                </div>

                                {/* Next Meeting Agenda Column */}
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                    <div className="flex items-center gap-2 mb-4 text-gray-800">
                                        <Calendar size={18} />
                                        <h4 className="font-bold">Agenda de Siguiente Reunión</h4>
                                    </div>

                                    {/* Next Meeting Form - Conditional Render based on Meeting Status */}
                                    {viewingMeetingDetails.status === 'closed' ? (
                                        <div className="space-y-4">
                                            {viewingMeetingDetails.plannedNextMeeting ? (
                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h5 className="font-bold text-gray-800">{viewingMeetingDetails.plannedNextMeeting.title}</h5>
                                                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-medium">
                                                            Histórico
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 mb-3 flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={14} />
                                                            {new Date(`${viewingMeetingDetails.plannedNextMeeting.date}T12:00:00`).toLocaleDateString('es-PE')}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={14} />
                                                            {viewingMeetingDetails.plannedNextMeeting.startTime || 'No definida'}
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                                        <h6 className="text-xs font-bold text-gray-500 uppercase mb-2">Agenda Planificada</h6>
                                                        {viewingMeetingDetails.plannedNextMeeting.agreements && viewingMeetingDetails.plannedNextMeeting.agreements.length > 0 ? (
                                                            <ul className="space-y-2">
                                                                {viewingMeetingDetails.plannedNextMeeting.agreements.map((item, idx) => (
                                                                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                                                        <span className="text-blue-500 mt-1">•</span>
                                                                        {item.text}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-sm text-gray-400 italic">No se registró agenda detallada.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 text-gray-400 italic bg-white rounded-lg border border-dashed border-gray-300">
                                                    No se guardó agenda para la siguiente reunión en esta acta.
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-3 mb-4">
                                                <p className="text-sm text-gray-600 mb-4">
                                                    Establece la agenda y detalles de la próxima reunión para dar continuidad a los acuerdos y temas pendientes.
                                                </p>

                                                <Button
                                                    variant="primary"

                                                    className="w-full py-6 flex flex-col items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:scale-[1.02]"
                                                    onClick={() => {
                                                        if (viewingMeetingDetails.plannedNextMeeting) {
                                                            const planned = viewingMeetingDetails.plannedNextMeeting;

                                                            // Find if the actual meeting exists to get ID
                                                            const currentEnd = new Date(`${viewingMeetingDetails.date}T${viewingMeetingDetails.startTime || '00:00'}`);
                                                            const upcomingMeetings = meetings.filter(m => {
                                                                if (m.status !== 'open') return false;
                                                                const mStart = new Date(`${m.date}T${m.startTime || '00:00'}`);
                                                                return mStart > currentEnd;
                                                            }).sort((a, b) => new Date(`${a.date}T${a.startTime || '00:00'}`) - new Date(`${b.date}T${b.startTime || '00:00'}`));

                                                            const nextRealId = upcomingMeetings.length > 0 ? upcomingMeetings[0].id : null;

                                                            setNextMeeting({
                                                                id: nextRealId, // Link to real ID if exists
                                                                title: planned.title,
                                                                date: planned.date,
                                                                startTime: planned.startTime || '',
                                                                agreements: planned.agreements || []
                                                            });
                                                        } else {
                                                            // Legacy fallback: Load from live meeting
                                                            const currentEnd = new Date(`${viewingMeetingDetails.date}T${viewingMeetingDetails.startTime || '00:00'}`);
                                                            const upcomingMeetings = meetings.filter(m => {
                                                                if (m.status !== 'open') return false;
                                                                const mStart = new Date(`${m.date}T${m.startTime || '00:00'}`);
                                                                return mStart > currentEnd;
                                                            }).sort((a, b) => new Date(`${a.date}T${a.startTime || '00:00'}`) - new Date(`${b.date}T${b.startTime || '00:00'}`));

                                                            if (upcomingMeetings.length > 0) {
                                                                const next = upcomingMeetings[0];
                                                                setNextMeeting({
                                                                    id: next.id,
                                                                    title: next.title,
                                                                    date: next.date,
                                                                    startTime: next.startTime || '',
                                                                    agreements: next.agreements || []
                                                                });
                                                            } else {
                                                                setNextMeeting({ title: '', date: '', startTime: '', agreements: [] });
                                                            }
                                                        }
                                                        setShowNextMeetingModal(true);
                                                    }}



                                                >
                                                    <div className="flex items-center gap-2 text-lg font-bold">
                                                        <Plus size={20} />
                                                        Programar Reunión
                                                    </div>
                                                    <span className="text-xs font-normal opacity-90">Definir fecha, hora y agenda</span>
                                                </Button>
                                            </div>

                                            <p className="text-[10px] text-gray-400 mt-3 italic text-center">
                                                También puedes programar reuniones desde el botón "Nueva Reunión"
                                            </p>
                                        </>
                                    )}
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
                                                {meetingTasks.map(task => {
                                                    const assignedUser = users.find(u => u.id === task.assignedTo);

                                                    return (
                                                        <div key={task.id} className="p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                                            {/* Header de la tarea */}
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-gray-800 text-sm mb-1">{task.title}</p>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                                                                            <Users size={12} />
                                                                            {assignedUser?.name || 'Sin asignar'}
                                                                        </span>
                                                                        {task.dueDate && (
                                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                                <Clock size={12} />
                                                                                {new Date(task.dueDate).toLocaleDateString('es-PE')}
                                                                            </span>
                                                                        )}
                                                                        {task.priority && (
                                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                                    'bg-gray-100 text-gray-600'
                                                                                }`}>
                                                                                {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Botón para ver detalles */}
                                                                <button
                                                                    onClick={() => setViewingTaskDetails(task)}
                                                                    className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded transition-colors"
                                                                    title="Ver detalles y comentarios"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                            </div>

                                                            {/* Barra de progreso */}
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
                                                                            }`}
                                                                        style={{ width: `${task.progress || 0}%` }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Último comentario (si existe) */}
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
                    );
                })()}
            </Modal >

            {/* Task Details Modal */}
            < Modal
                isOpen={!!viewingTaskDetails}
                onClose={() => setViewingTaskDetails(null)}
                title="Detalles de la Tarea"
                size="lg"
            >
                {viewingTaskDetails && (() => {
                    const assignedUser = users.find(u => u.id === viewingTaskDetails.assignedTo);
                    const meeting = meetings.find(m => m.id === viewingTaskDetails.meetingId);

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
                                    {viewingTaskDetails.dueDate && (
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {new Date(viewingTaskDetails.dueDate).toLocaleDateString('es-PE')}
                                        </span>
                                    )}
                                    {viewingTaskDetails.priority && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${viewingTaskDetails.priority === 'high' ? 'bg-red-100 text-red-700' :
                                            viewingTaskDetails.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            Prioridad: {viewingTaskDetails.priority === 'high' ? 'Alta' :
                                                viewingTaskDetails.priority === 'medium' ? 'Media' : 'Baja'}
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
                                            }`}
                                        style={{ width: `${viewingTaskDetails.progress || 0}%` }}
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
                                        className={`px-4 py-2 rounded-md border font-medium ${currentPage === 1 ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-50 hover:border-blue-300'}`}
                                    >
                                        Anterior
                                    </button>
                                    <span className="font-medium">Página {currentPage} de {totalPages}</span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`px-4 py-2 rounded-md border font-medium ${currentPage === totalPages ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-50 hover:border-blue-300'}`}
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
                    // 1. Get all organizers
                    const organizerUsersList = users.filter(u => {
                        const role = (u.role || '').toLowerCase();
                        const eventRole = (u.eventRole || '').toLowerCase();
                        const roles = (u.roles || []).map(r => r.toLowerCase());
                        const eventRoles = (u.eventRoles || []).map(r => r.toLowerCase());

                        return role === 'organizador' ||
                            role === 'admin' ||
                            eventRole === 'organizador' ||
                            eventRole === 'admin' ||
                            roles.includes('organizador') ||
                            roles.includes('admin') ||
                            eventRoles.includes('organizador') ||
                            eventRoles.includes('admin');
                    });
                    const currentAttendees = viewingMeetingDetails.attendance || [];
                    const isClosed = viewingMeetingDetails.status === 'closed';

                    // Allow SuperAdmin, Admin, or Secretary to manage attendance
                    const isSecretary = currentUser?.isSuperAdmin ||
                        currentUser?.role === 'admin' ||
                        currentUser?.eventRole === 'secretaria' ||
                        currentUser?.organizerFunction === 'secretaria' ||
                        (currentUser?.roles && (currentUser.roles.includes('admin') || currentUser.roles.includes('secretaria')));

                    // 2. Helper to calculate status and fine
                    const getAttendanceInfo = (user) => {
                        const attendance = currentAttendees.find(a => a.userId === user.id);

                        // Dynamic Fine Calculation based on history
                        const priorAbsences = user.unjustifiedAbsences || 0;
                        const absenceFine = priorAbsences === 0 ? 10.00 : 20.00;

                        let status = 'falta'; // Default to Absent
                        let fine = absenceFine; // Default Fine for Absence (Dynamic)
                        let statusLabel = 'Falta';
                        let statusColor = 'bg-red-100 text-red-700';
                        let timeLabel = '-';

                        // If manually justified
                        if (attendance?.justified) {
                            return {
                                status: 'justified',
                                label: 'Justificado',
                                color: 'bg-blue-100 text-blue-700',
                                fine: 0,
                                time: attendance.markedAt ? new Date(attendance.markedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : 'Justificado',
                                attendanceRecord: attendance
                            };
                        }

                        // If Emergency Exit
                        if (attendance?.emergencyExit) {
                            return {
                                status: 'emergency',
                                label: 'Salida Emergencia',
                                color: 'bg-orange-100 text-orange-700',
                                fine: 0, // No fine if authorized emergency
                                time: `Salió: ${new Date(attendance.emergencyExitAt || Date.now()).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`,
                                attendanceRecord: attendance
                            };
                        }

                        if (attendance) {
                            const markedTime = new Date(attendance.markedAt);
                            const meetingTime = new Date(`${viewingMeetingDetails.date}T${viewingMeetingDetails.startTime || '00:00'}`);

                            // Tolerance Check (10 mins)
                            // Use absolute difference to handle slight pre-starts, but usually late is positive
                            const diffMinutes = (markedTime - meetingTime) / 60000;

                            if (diffMinutes <= 10) {
                                status = 'presente';
                                fine = 0;
                                statusLabel = 'Presente';
                                statusColor = 'bg-green-100 text-green-700';
                            } else {
                                status = 'tardanza';
                                fine = 10.00;
                                statusLabel = `Tardanza (+${Math.round(diffMinutes)}m)`;
                                statusColor = 'bg-yellow-100 text-yellow-700';
                            }
                            timeLabel = markedTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

                            // Signing Check (Only if meeting is closed)
                            if (isClosed) {
                                if (!attendance.signedAt) {
                                    status = 'falta_firma';
                                    fine = absenceFine; // Treated as Falta (Dynamic)
                                    statusLabel = 'Falta (No Firmó)';
                                    statusColor = 'bg-red-100 text-red-700 border-red-200';
                                } else {
                                    // Check signing time tolerance (15 mins from close)
                                    // Assuming viewingMeetingDetails.closedAt exists
                                    if (viewingMeetingDetails.closedAt) {
                                        const signedTime = new Date(attendance.signedAt);
                                        const closedTime = new Date(viewingMeetingDetails.closedAt);
                                        const signDiff = (signedTime - closedTime) / 60000;

                                        if (signDiff > 15) {
                                            // Late signing = Falta? Per requirement: "Si no se firmo en ese tiempo, contara como falta"
                                            // Assuming "signing late" is equivalent to not signing in time window.
                                            status = 'falta_firma_tarde';
                                            fine = absenceFine; // Dynamic Fine
                                            statusLabel = 'Falta (Firma Tarde)';
                                            statusColor = 'bg-red-100 text-red-700';
                                        }
                                    }
                                }
                            }
                        }

                        return { status, label: statusLabel, color: statusColor, fine, time: timeLabel, attendanceRecord: attendance };
                    };

                    const handleUpdateParticipant = async (userId, updates) => {
                        const currentAttendees = viewingMeetingDetails.attendance || [];
                        const attendeeIndex = currentAttendees.findIndex(a => a.userId === userId);
                        let updatedAttendees = [...currentAttendees];

                        if (attendeeIndex >= 0) {
                            updatedAttendees[attendeeIndex] = { ...updatedAttendees[attendeeIndex], ...updates };
                        } else {
                            // Create new record if justifying someone who wasn't there
                            updatedAttendees.push({
                                userId,
                                name: organizerUsersList.find(u => u.id === userId)?.name,
                                status: 'confirmed', // Assume confirmed if interacting
                                markedAt: new Date().toISOString(), // stamp now
                                ...updates
                            });
                        }

                        const updatedMeeting = { ...viewingMeetingDetails, attendance: updatedAttendees };
                        setViewingMeetingDetails(updatedMeeting);
                        await api.planning.saveMeeting(updatedMeeting);
                        loadData();
                    };

                    const handleRemoveParticipant = async (userId) => {
                        if (!confirm('¿Rechazar asistencia? El usuario quedará como si nunca hubiera marcado.')) return;

                        const currentAttendance = viewingMeetingDetails.attendance || [];
                        const updatedAttendance = currentAttendance.filter(a => a.userId !== userId);

                        const updatedMeeting = { ...viewingMeetingDetails, attendance: updatedAttendance };
                        setViewingMeetingDetails(updatedMeeting);
                        await api.planning.saveMeeting(updatedMeeting);
                        loadData();
                    };

                    return (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-gray-500 mb-2">
                                <p><strong>Reglas de Asistencia:</strong></p>
                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                    <li>Tolerancia: 10 min (Tardanza: S/ 10.00)</li>
                                    <li>Firma de Acta: 15 min tras cierre (Falta: S/ 10.00 - S/ 20.00)</li>
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
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${info.color}`}>
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
                                                    {info.attendanceRecord?.signedAt && (
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200 font-bold mb-1 cursor-default">
                                                            FIRMADO
                                                        </span>
                                                    )}

                                                    {/* JUSTIFY / EMERGENCY */}
                                                    {!info.attendanceRecord?.justified && !info.attendanceRecord?.emergencyExit && !info.attendanceRecord?.signedAt && (
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    const reason = prompt('Motivo de justificación:');
                                                                    if (reason) handleUpdateParticipant(user.id, { justified: true, justificationReason: reason });
                                                                }}
                                                                className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition-colors"
                                                            >
                                                                Justificar
                                                            </button>
                                                            {(info.status === 'presente' || info.status === 'tardanza') && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (confirm('¿Registrar salida de emergencia? Esto exonerará de multa de firma.')) {
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
                                                            onClick={() => {
                                                                if (confirm('¿Remover justificación/excepción?')) {
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
            < Modal
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

                                // 1. Save Snapshot to Current Meeting (Meeting A)
                                const plannedData = {
                                    title: nextMeeting.title,
                                    date: nextMeeting.date,
                                    startTime: nextMeeting.startTime,
                                    agreements: nextMeeting.agreements || []
                                };

                                const updatedCurrentMeeting = {
                                    ...viewingMeetingDetails,
                                    plannedNextMeeting: plannedData
                                };
                                await api.planning.saveMeeting(updatedCurrentMeeting);
                                setViewingMeetingDetails(updatedCurrentMeeting); // Keep UI in sync

                                // 2. Create/Update Actual Next Meeting (Meeting B)
                                const newMeeting = {
                                    id: nextMeeting.id || null,
                                    title: nextMeeting.title,
                                    date: nextMeeting.date,
                                    startTime: nextMeeting.startTime,
                                    status: 'open',
                                    agreements: nextMeeting.agreements || [], // Initial sync
                                    attendees: [],
                                    createdBy: currentUser.id,
                                    createdAt: Date.now()
                                };

                                await api.planning.saveMeeting(newMeeting);
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
            </Modal >

            {/* Confirm Dialog - Placed last to ensure it renders on top */}
            < ConfirmDialog
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
