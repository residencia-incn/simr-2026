import React, { useState, useEffect, useRef } from 'react';
import {
    Activity,
    CheckCircle,
    AlertCircle,
    Calendar,
    Clock,
    DollarSign,
    ListTodo,
    X,
    ChevronRight,
    Loader2,
    Briefcase,
    CreditCard,
    PenTool,
    BarChart3,
    FileText,
    Upload,
    RefreshCw // [FIX] Added missing icon import
} from 'lucide-react';
import { api } from '../../services/api';
import { showSuccess, showError, showInput } from '../../utils/alerts';
import { Modal, Badge, Button } from '../ui'; // Ensure Button is imported
import { toast } from 'react-hot-toast';
import { MeetingWSProvider, useMeetingWS } from '../../context/MeetingWSContext';
// [REMOVED] import { uploadToCloud } from '../../utils/upload'; 

const CountdownTimer = ({ targetDate, children }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();

            if (difference > 0) {
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            } else {
                setTimeLeft('0:00');
                setIsExpired(true);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (isExpired) {
        return (
            <div className="w-full bg-red-100 text-red-600 text-xs py-2 rounded text-center border border-red-200 font-bold uppercase animate-pulse">
                TIEMPO EXPIRADO
            </div>
        );
    }

    return (
        <>
            <div className="text-xs font-bold text-center py-1 rounded border mb-2 bg-amber-50 text-amber-700 border-amber-200">
                Tiempo restante: {timeLeft}
            </div>
            {children}
        </>
    );
};

const UserDashboardWidget = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('polls'); // Default to polls if there are active ones
    const [summary, setSummary] = useState({
        badge_count: 0,
        meetings: {
            active: [],
            scheduled: []
        },
        pending_tasks: [],
        pending_debts: [],
        polls: []
    });
    const [loading, setLoading] = useState(false);
    const [markingAttendance, setMarkingAttendance] = useState(null);
    const [updatingTask, setUpdatingTask] = useState(null);
    const [viewingTask, setViewingTask] = useState(null);

    // [NEW] Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedDebtKeys, setSelectedDebtKeys] = useState([]); // Stores "type-id" strings
    const [voucherFile, setVoucherFile] = useState(null);
    const [voucherPreview, setVoucherPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    // [NEW] Destination Accounts
    const [destinationAccounts, setDestinationAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState("");
    const popoverRef = useRef(null);

    const processSummaryData = (data) => ({
        badge_count: data?.badge_count || 0,
        meetings: {
            active: data?.meetings?.active || [],
            scheduled: data?.meetings?.scheduled || []
        },
        pending_tasks: Array.isArray(data?.tasks) ? data.tasks :
            Array.isArray(data?.pending_tasks) ? data.pending_tasks : [],
        pending_debts: Array.isArray(data?.debts) ? data.debts :
            Array.isArray(data?.pending_debts) ? data.pending_debts : [],
        polls: Array.isArray(data?.polls) ? data.polls : []
    });

    const fetchSummary = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const data = await api.dashboard.getSummary();
            const processed = processSummaryData(data);
            setSummary(processed);
        } catch (error) {
            console.error("Failed to fetch dashboard summary", error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    // Initial load and polling
    useEffect(() => {
        if (!user) return;

        fetchSummary(true);

        const intervalId = setInterval(() => {
            fetchSummary(false);
        }, 30000); // Poll every 30 seconds

        const handleRefresh = () => fetchSummary(false);
        window.addEventListener('dashboard-refresh', handleRefresh);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('dashboard-refresh', handleRefresh);
        };
    }, [user]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleMarkAttendance = async (meeting) => {
        setMarkingAttendance(meeting.id);
        try {
            await api.planning.markAttendance(meeting.id);
            showSuccess(`Has marcado asistencia en: ${meeting.title}`);
            // Refresh data immediately
            window.dispatchEvent(new CustomEvent('dashboard-refresh'));
        } catch (error) {
            console.error(error);
            showError('No se pudo marcar asistencia');
        } finally {
            setMarkingAttendance(null);
        }
    };

    const handleUpdateTaskProgress = async (taskId, progress, status, comment = null) => {
        setMarkingAttendance(taskId); // Reutilizando el estado de loading
        try {
            await api.planning.updateTaskProgress(taskId, progress, status, comment);

            // Refrescar localmente
            setSummary(prev => ({
                ...prev,
                pending_tasks: prev.pending_tasks.map(t => {
                    if (t.id === taskId) {
                        const newComments = [...(t.comments || [])];
                        if (comment) {
                            newComments.push({
                                timestamp: new Date().toISOString(),
                                progress,
                                text: comment,
                                user_id: 'me' // Simplificado para la UI
                            });
                        }
                        return { ...t, progress, status, comments: newComments };
                    }
                    return t;
                }).filter(t => status !== 'COMPLETADA') // Si se completa, desaparece de pendientes en el widget
            }));

            // Si se completó, refrescar todo para actualizar badge_count
            if (status === 'COMPLETADA') {
                showSuccess('Tarea completada ¡Buen trabajo!');
                const data = await api.dashboard.getSummary();
                setSummary({
                    badge_count: data?.badge_count || 0,
                    meetings: {
                        active: data?.meetings?.active || [],
                        scheduled: data?.meetings?.scheduled || []
                    },
                    pending_tasks: Array.isArray(data?.tasks) ? data.tasks :
                        Array.isArray(data?.pending_tasks) ? data.pending_tasks : [],
                    pending_debts: Array.isArray(data?.debts) ? data.debts :
                        Array.isArray(data?.pending_debts) ? data.pending_debts : []
                });
            }
        } catch (error) {
            console.error(error);
            showError('No se pudo actualizar el progreso');
        } finally {
            setMarkingAttendance(null);
        }
    };

    const handleSignActa = async (meeting) => {
        const password = await showInput('Ingrese su clave para firmar el acta:', 'password');
        if (!password) return;

        setMarkingAttendance(meeting.id);
        try {
            await api.planning.signActa(meeting.id, password);
            showSuccess('Acta firmada correctamente. Se generó su hash SHA-256.');

            // Optimistic Update: Avoid reload
            setSummary(prev => {
                const updatedActive = prev.meetings.active.map(m =>
                    m.id === meeting.id ? { ...m, has_signed: true } : m
                );
                return {
                    ...prev,
                    meetings: {
                        ...prev.meetings,
                        active: updatedActive
                    }
                };
            });

            // Trigger fetch in background just to be sure
            if (typeof fetchSummary === 'function') {
                fetchSummary(false);
            }

        } catch (error) {
            showError(error.response?.data?.detail || 'Error al firmar acta');
        } finally {
            setMarkingAttendance(null);
        }
    };

    const handleViewActa = async (meetingId) => {
        const toastId = toast.loading('Generando vista previa del acta...');
        try {
            const meeting = await api.planning.getMeeting(meetingId);

            // Fetch additional data if needed, like polls
            let pollsWithResults = [];
            try {
                const pollList = await api.polls.list(meetingId);
                const activeOrClosedPolls = pollList.filter(p => p.status !== 'DRAFT');
                pollsWithResults = await Promise.all(
                    activeOrClosedPolls.map(p => api.polls.getResults(p.id))
                );

            } catch (err) {
                console.warn("Could not fetch polls for act", err);
            }

            // [NEW] Fetch Next Meeting Details if linked
            let nextMeetingDetails = null;
            if (meeting.next_meeting_id) {
                try {
                    nextMeetingDetails = await api.planning.getMeeting(meeting.next_meeting_id);
                } catch (err) {
                    console.warn("Could not fetch next meeting details", err);
                }
            }

            // Minimalist "Agreements" flattener locally since we don't have the helper
            const flattenAgreements = (items, level = 1, prefix = '') => {
                let result = [];
                items.forEach((item, index) => {
                    const num = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
                    result.push({ ...item, level, numbering: num });
                    if (item.sub_agreements && item.sub_agreements.length > 0) {
                        result = result.concat(flattenAgreements(item.sub_agreements, level + 1, num));
                    }
                });
                return result;
            };

            // Generate HTML (Simplified version of PlanningManager logic)
            const meetingContent = `
                 <html>
                 <head>
                     <title>Acta de Reunión - ${meeting.title}</title>
                     <style>
                         body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                         h1 { color: #1e3a8a; border-bottom: 3px solid #1e3a8a; font-size: 24px; margin-bottom: 20px; padding-bottom: 10px; }
                         h2 { color: #1e40af; border-bottom: 1px solid #e2e8f0; font-size: 18px; margin-top: 30px; padding-bottom: 5px; }
                         .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
                         .meta div { font-size: 14px; }
                         .meta strong { color: #64748b; text-transform: uppercase; font-size: 11px; display: block; margin-bottom: 2px; }
                         
                         ul { padding-left: 20px; }
                         li { margin-bottom: 8px; }
                         
                         .attendance-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-top: 15px; }
                         .participant { background: #fff; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; font-size: 13px; }
                         .badge-present { color: #059669; font-weight: bold; font-size: 11px; }
                         .badge-absent { color: #dc2626; font-size: 11px; font-style: italic; }

                         .poll-card { margin-bottom: 15px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #fff; page-break-inside: avoid; }
                         .poll-title { font-size: 14px; margin: 0 0 10px 0; color: #1e3a8a; font-weight: bold; }
                         .poll-option { display: flex; align-items: center; gap: 10px; font-size: 12px; margin-bottom: 6px; }
                         .bar-bg { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
                         .bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
                     <style>
                         body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #000; max-width: 800px; margin: 0 auto; }
                         h1 { text-align: center; font-size: 18pt; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }
                         h2 { font-size: 12pt; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-top: 25px; text-transform: uppercase; margin-bottom: 15px; }
                         
                         /* Table Styles */
                         table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10pt; }
                         th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
                         th { background-color: #f3f4f6; font-weight: bold; text-align: center; }
                         .text-center { text-align: center; }
                         .header-table td { border: none; padding: 2px 0; }

                         /* Status Colors */
                         .status-presente { color: green; font-weight: bold; }
                         .status-falta { color: red; font-weight: bold; }
                         .status-tardanza { color: orange; font-weight: bold; }
                         .signature-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; }
                         .signature-box { text-align: center; font-size: 9pt; }
                         .signature-line { border-top: 1px solid #000; margin-top: 40px; margin-bottom: 5px; width: 80%; margin-left: auto; margin-right: auto; }
                         
                         .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(0,0,0,0.05); pointer-events: none; z-index: -1; border: 5px solid rgba(0,0,0,0.05); padding: 20px; border-radius: 20px; }
                     </style>
                 </head>
                 <body>
                     <div class="watermark">VISTA PREVIA</div>
                     
                     <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 14pt; font-weight: bold;">ACTA DE REUNIÓN N° ${String(meeting.id).padStart(4, '0')}</div>
                        <div style="font-size: 12pt;">${meeting.title}</div>
                     </div>

                     <table class="header-table" style="border: none; margin-bottom: 20px;">
                        <tr>
                            <td width="15%"><b>FECHA:</b></td>
                            <td width="35%">${new Date(meeting.scheduled_start).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                            <td width="15%"><b>INICIO:</b></td>
                            <td width="35%">${meeting.real_start_time ? new Date(meeting.real_start_time).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                        </tr>
                        <tr>
                            <td><b>ESTADO:</b></td>
                            <td>${meeting.status}</td>
                            <td><b>FIN:</b></td>
                            <td>${meeting.real_end_time ? new Date(meeting.real_end_time).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                        </tr>
                     </table>

                     <h2>I. Control de Asistencia</h2>
                     <table>
                        <thead>
                            <tr>
                                <th style="text-align: left;">PARTICIPANTE</th>
                                <th width="100">HORA</th>
                                <th width="120">ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${meeting.attendances.map((a, i) => {
                const checkIn = a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '-';
                let statusClass = '';
                if (a.status === 'PRESENTE') statusClass = 'status-presente';
                if (a.status === 'FALTA') statusClass = 'status-falta';
                if (a.status === 'TARDANZA') statusClass = 'status-tardanza';

                return `
                                 <tr style="background-color: ${i % 2 === 0 ? '#fff' : '#f9fafb'};">
                                    <td>${a.user_name || 'Participante'}</td>
                                    <td class="text-center">${checkIn}</td>
                                    <td class="text-center ${statusClass}">${a.status || 'PENDIENTE'}</td>
                                 </tr>`;
            }).join('')}
                        </tbody>
                     </table>
                     <div style="font-size: 9pt; margin-top: 5px;">
                        <i>Total Asistentes: ${meeting.attendances.filter(a => a.check_in_time).length}</i>
                     </div>

                     <h2>II. Acuerdos y Deliberaciones</h2>
                     ${meeting.agreements && meeting.agreements.length > 0
                    ? `<ul>${flattenAgreements(meeting.agreements).map(a =>
                        `<li style="margin-left: ${(a.level - 1) * 20}px; margin-bottom: 8px;">
                                <b>${a.numbering}</b> ${a.content}
                             </li>`
                    ).join('')}</ul>`
                    : '<p style="color: #64748b; font-style: italic;">No se registraron acuerdos.</p>'
                }
                    
                     ${meeting.next_meeting_agenda && meeting.next_meeting_agenda.length > 0 ? `
                        <h2>III. Agenda de la Siguiente Reunión</h2>
                        ${nextMeetingDetails ? `
                             <div style="margin-bottom: 10px; padding: 10px; background-color: #f0f9ff; border-left: 4px solid #0ea5e9; font-size: 10pt;">
                                 <strong>PRÓXIMA REUNIÓN PROGRAMADA:</strong><br/>
                                 📅 ${new Date(nextMeetingDetails.scheduled_start).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br/>
                                 ⏰ ${new Date(nextMeetingDetails.scheduled_start).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                             </div>
                        `: ''}
                        <ul>
                            ${meeting.next_meeting_agenda.map(item => {
                    const text = typeof item === 'string' ? item : (item.content || item.title || 'Punto de agenda');
                    let subItems = '';
                    if (typeof item === 'object' && item.children && item.children.length > 0) {
                        subItems = `
                                        <ul style="margin-top: 5px;">
                                            ${item.children.map(sub => `
                                                <li style="margin-bottom: 2px;">
                                                    ${typeof sub === 'string' ? sub : (sub.content || sub.title)}
                                                </li>
                                            `).join('')}
                                        </ul>
                                    `;
                    }
                    return `<li style="margin-bottom: 8px;"><b>${text}</b>${subItems}</li>`;
                }).join('')}
                        </ul>
                     ` : ''}

                     ${meeting.tasks && meeting.tasks.length > 0 ? `
                        <h2>${meeting.next_meeting_agenda && meeting.next_meeting_agenda.length > 0 ? 'IV' : 'III'}. Asignación de Tareas</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th style="text-align: left;">DESCRIPCIÓN</th>
                                    <th width="100">PLAZO</th>
                                    <th width="100">PRIORIDAD</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${meeting.tasks.map(t => `
                                    <tr>
                                        <td>${t.title}</td>
                                        <td class="text-center">${t.deadline ? new Date(t.deadline).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }) : '-'}</td>
                                        <td class="text-center">${t.priority}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                     ` : ''}

                     ${pollsWithResults && pollsWithResults.length > 0 ? `
                        <h2>${(meeting.next_meeting_agenda && meeting.next_meeting_agenda.length > 0 && meeting.tasks && meeting.tasks.length > 0) ? 'V' :
                        (meeting.next_meeting_agenda && meeting.next_meeting_agenda.length > 0) || (meeting.tasks && meeting.tasks.length > 0) ? 'IV' : 'III'}. Resultados de Votaciones</h2>
                        ${pollsWithResults.map(poll => `
                            <div class="poll-card" style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 15px; page-break-inside: avoid;">
                                <div class="poll-title" style="font-weight: bold; color: #1e3a8a; margin-bottom: 10px;">ENCUESTA: ${poll.title.toUpperCase()}</div>
                                ${poll.options.map(opt => `
                                    <div class="poll-option" style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px; font-size: 9pt;">
                                        <div style="width: 40%; text-align: right; padding-right: 10px;">${opt.text}</div>
                                        <div class="bar-bg" style="flex: 1; height: 10px; background: #f3f4f6; border-radius: 5px; overflow: hidden;">
                                            <div class="bar-fill" style="width: ${opt.vote_percentage}%; height: 100%; background: ${opt.color === 'emerald' ? '#10b981' : '#3b82f6'};"></div>
                                        </div>
                                        <div style="width: 40px; font-weight: bold;">${Math.round(opt.vote_percentage)}%</div>
                                    </div>
                                `).join('')}
                                <div style="font-size: 8pt; color: #6b7280; text-align: right; margin-top: 5px;">Total Votos: ${poll.total_votes}</div>
                            </div>
                        `).join('')}
                     ` : ''}

                     <div class="signature-grid">
                        ${meeting.attendances.map(a => {
                            // Only show signature lines for present people or if final
                            const name = a.user_name || 'Participante';
                            const isSigned = !!a.signed_at;
                            return `
                             <div class="signature-box">
                                <div class="signature-line"></div>
                                <b>${name}</b><br>
                                <span style="font-size: 8pt; color: #666;">
                                    ${isSigned ? 'FIRMADO DIGITALMENTE' : 'PENDIENTE'}
                                </span>
                             </div>
                             `;
                        }).join('')}
                     </div>

                     <div style="margin-top: 50px; font-size: 9pt; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
                        Vista Previa Generada por SIMR 2026 el ${new Date().toLocaleString()}
                     </div>
                 </body>
                 </html>
             `;

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(meetingContent);
                printWindow.document.close();
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            } else {
                toast.error('El navegador bloqueó la ventana emergente');
            }

            toast.dismiss(toastId);
        } catch (error) {
            console.error(error);
            toast.error('Error al generar vista previa', { id: toastId });
        }
    };

    const handleToggleDebt = (debt) => {
        const key = `${debt.type}-${debt.id}`;

        // Si el estado es IN_PROCESS (Validando), no permitir interacción
        if (debt.status === 'IN_PROCESS' || debt.status === 'validando') {
            toast.error('Este item ya está en proceso de validación.');
            return;
        }

        setSelectedDebtKeys(prev => {
            const isRemoving = prev.includes(key);

            if (isRemoving) {
                // Lógica de deselección secuencial: Deseleccionar este y todos los POSTERIORES (si son del mismo tipo o contribuciones)
                if (debt.type === 'contribution') {
                    // Encontrar el índice del mes deseleccionado en la lista global de deudas
                    const pendingContributions = pending_debts.filter(d => d.type === 'contribution');
                    const targetMonthDate = new Date(debt.month_date);

                    return prev.filter(k => {
                        const [type, id] = k.split('-');
                        if (type !== 'contribution') return true; // Mantener multas

                        const d = pendingContributions.find(pc => pc.id.toString() === id);
                        if (!d) return false;

                        const dDate = new Date(d.month_date);
                        return dDate < targetMonthDate; // Mantener solo los anteriores
                    });
                }
                return prev.filter(k => k !== key);
            } else {
                // Lógica de selección secuencial: Verificar que no haya pendientes ANTERIORES sin seleccionar
                if (debt.type === 'contribution') {
                    const pendingContributions = pending_debts.filter(d =>
                        d.type === 'contribution' &&
                        d.status !== 'IN_PROCESS' &&
                        d.status !== 'validando'
                    );

                    const targetMonthDate = new Date(debt.month_date);

                    // Buscar si hay algún mes anterior que no esté en la selección actual
                    const missingPrevious = pendingContributions.find(pc => {
                        const pcDate = new Date(pc.month_date);
                        const pcKey = `${pc.type}-${pc.id}`;
                        return pcDate < targetMonthDate && !prev.includes(pcKey);
                    });

                    if (missingPrevious) {
                        toast.error(`Debes seleccionar los meses anteriores primero (${missingPrevious.month} ${missingPrevious.year})`);
                        return prev;
                    }
                }
                return [...prev, key];
            }
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVoucherFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setVoucherPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();

        if (selectedDebtKeys.length === 0) {
            showError('Debes seleccionar al menos una deuda para pagar.');
            return;
        }
        if (!voucherFile) {
            showError('Por favor selecciona una imagen de tu comprobante.');
            return;
        }
        if (!selectedAccount) {
            showError('Por favor selecciona una cuenta de destino.');
            return;
        }

        try {
            setIsUploading(true);
            // [REMOVED] const voucherUrl = await uploadToCloud(voucherFile);

            // Separate IDs
            const contributionIds = selectedDebtKeys
                .filter(k => k.startsWith('contribution-'))
                .map(k => parseInt(k.split('-')[1]));

            const penaltyIds = selectedDebtKeys
                .filter(k => k.startsWith('fine-'))
                .map(k => parseInt(k.split('-')[1]));

            // Calculate amount (just for record)
            const debtsToPay = summary.pending_debts.filter(d => selectedDebtKeys.includes(`${d.type}-${d.id}`));
            const totalAmount = debtsToPay.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

            await api.organizerContributions.pay({
                user_id: user.id,
                contribution_ids: contributionIds,
                penalty_ids: penaltyIds,
                amount: totalAmount,
                method: "TRANSFERENCIA",
                voucher: voucherFile, // [FIX] Send real File object
                target_account_id: parseInt(selectedAccount)
            });

            showSuccess('Pago registrado exitosamente. Esperando validación.');
            setIsPaymentModalOpen(false);
            setVoucherFile(null);
            setVoucherPreview(null);
            setSelectedDebtKeys([]);
            // Force refresh from server (which now includes IN_PROCESS debts)
            const freshData = await api.dashboard.getSummary();
            const processed = processSummaryData(freshData);
            setSummary(processed);

            // Note: selectedDebtKeys already cleared in line 641

        } catch (error) {
            console.error(error);
            showError(error.message || 'Error al procesar el pago');
        } finally {
            setIsUploading(false);
        }
    };

    const parseAmount = (val) => {
        if (val === undefined || val === null) return 0;
        const strVal = String(val);
        const num = parseFloat(strVal);
        return isNaN(num) ? 0 : num;
    };

    // Calculate total selected for display
    // Calculate total selected for display
    const totalSelectedAmount = React.useMemo(() => {
        const selectedDebts = summary?.pending_debts?.filter(d => selectedDebtKeys.includes(`${d.type}-${d.id}`)) || [];

        if (!summary?.pending_debts) return 0;
        return selectedDebts.reduce((sum, d) => sum + parseAmount(d.amount), 0);
    }, [summary?.pending_debts, selectedDebtKeys]);

    // [NEW] Fetch Accounts & Config when Modal Opens
    useEffect(() => {
        if (isPaymentModalOpen) {
            const fetchConfig = async () => {
                try {
                    const [accounts, destinations, settings] = await Promise.all([
                        api.treasury.getAccounts(),
                        api.treasuryConfig.getDestinations().catch(() => ({})),
                        api.treasuryConfig.getSettings().catch(() => ({})) // [NEW] Fetch Global Settings
                    ]);
                    setDestinationAccounts(accounts);

                    // Prioritize specific settings for Monthly Contributions
                    const targetIdFromSettings = settings.default_contribution_account;
                    const targetIdFromDestinations = destinations["Inscripciones"] || destinations["Aporte Mensual"] || destinations["Aportes"];

                    const targetId = targetIdFromSettings || targetIdFromDestinations;

                    if (targetId) {
                        setSelectedAccount(String(targetId));
                    } else {
                        // Fallback: Search by name
                        const defaultAcc = accounts.find(a => a.name.toLowerCase().includes('inscripciones'));
                        if (defaultAcc) setSelectedAccount(String(defaultAcc.id));
                        else if (accounts.length > 0) setSelectedAccount(String(accounts[0].id));
                    }
                } catch (e) {
                    console.error("Error fetching accounts setup", e);
                }
            };
            fetchConfig();
        }
    }, [isPaymentModalOpen]);

    if (!user) return null;

    const { badge_count, meetings, pending_tasks, pending_debts, polls } = summary;
    const active_meetings = meetings?.active || [];
    const scheduled_meetings = meetings?.scheduled || [];
    const active_polls = polls || [];

    return (
        <div className="relative" ref={popoverRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-lg transition-all duration-200 ${isOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
                title="Centro de Comando Personal"
            >
                <Activity size={24} />
                {badge_count > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-[10px] items-center justify-center font-bold shadow-sm border border-white">
                            {badge_count}
                        </span>
                    </span>
                )}
            </button>

            {/* Popover */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-xl shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden transform transition-all origin-top-right animate-in fade-in zoom-in-95 backdrop-blur-sm">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 border-b flex items-center justify-between">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                            <Briefcase size={16} className="text-gray-500" />
                            Mi Comando
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b bg-gray-50/50">
                        <button
                            onClick={() => setActiveTab('live')}
                            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors relative ${activeTab === 'live' ? 'border-red-500 text-red-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                        >
                            <span className="flex items-center justify-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    {active_meetings.length > 0 && (
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    )}
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${active_meetings.length > 0 ? 'bg-red-500' : 'bg-gray-300'}`}></span>
                                </span>
                                En Vivo
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                        >
                            <span className="flex items-center justify-center gap-1.5">
                                <ListTodo size={14} />
                                Tareas
                                {pending_tasks.length > 0 && (
                                    <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-[10px]">{pending_tasks.length}</span>
                                )}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('treasury')}
                            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === 'treasury' ? 'border-emerald-500 text-emerald-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                        >
                            <span className="flex items-center justify-center gap-1.5">
                                <DollarSign size={14} />
                                Tesorería
                                {pending_debts.length > 0 && (
                                    <span className="bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full text-[10px]">{pending_debts.length}</span>
                                )}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('polls_tab')}
                            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === 'polls_tab' ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                        >
                            <span className="flex items-center justify-center gap-1.5">
                                <BarChart3 size={14} />
                                Encuestas
                                {active_polls.filter(p => p.status === 'ACTIVE' && !p.my_vote_option_id).length > 0 && (
                                    <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full text-[10px]">
                                        {active_polls.filter(p => p.status === 'ACTIVE' && !p.my_vote_option_id).length}
                                    </span>
                                )}
                            </span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="max-h-[400px] overflow-y-auto p-4 bg-gray-50/30 min-h-[200px]">
                        {loading && !summary.badge_count ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <Loader2 size={24} className="animate-spin mb-2" />
                                <span className="text-xs">Cargando...</span>
                            </div>
                        ) : (
                            <>
                                {/* LIVE TAB */}
                                {activeTab === 'live' && (<>
                                    <div className="space-y-3">
                                        {/* 1. SECCIÓN: EN VIVO */}
                                        {summary.meetings && summary.meetings.active && summary.meetings.active.length > 0 ? (
                                            summary.meetings.active.map(meeting => (
                                                <MeetingItemWithWS
                                                    key={meeting.id}
                                                    meeting={meeting}
                                                    user={user}
                                                    markingAttendance={markingAttendance}
                                                    handleMarkAttendance={handleMarkAttendance}
                                                    handleViewActa={handleViewActa}
                                                    handleSignActa={handleSignActa}
                                                />
                                            ))
                                        ) : (
                                            <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                                                    <Calendar size={20} />
                                                </div>
                                                <p className="text-sm font-medium text-slate-500">No tienes reuniones en curso</p>
                                                <p className="text-xs text-slate-400 mt-1">Las reuniones programadas aparecerán aquí cuando inicien.</p>
                                            </div>
                                        )}

                                    </div>

                                    {/* SECCIÓN: PROGRAMADAS (Solo en EN VIVO) */}
                                    {
                                        summary.meetings && summary.meetings.scheduled && summary.meetings.scheduled.length > 0 && (
                                            <div className="mt-2 text-left">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Próximas</p>
                                                {summary.meetings.scheduled.map(m => (
                                                    <div key={m.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-3 mb-2 opacity-80 hover:opacity-100 transition-opacity">
                                                        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg flex-shrink-0">
                                                            <Calendar size={16} />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-sm font-semibold text-gray-700 truncate">{m.title}</p>
                                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Clock size={10} />
                                                                {m.start_time ? new Date(m.start_time).toLocaleString() : 'Pendiente'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }

                                    {/* Estado Vacío (Solo en EN VIVO) */}
                                    {
                                        (!summary.meetings?.active?.length && !summary.meetings?.scheduled?.length) && (
                                            <EmptyState icon={Calendar} message="No tienes reuniones activas ni programadas." />
                                        )
                                    }
                                </>)}
                            </>
                        )}




                        {/* TASKS TAB */}
                        {
                            activeTab === 'tasks' && (
                                <div className="space-y-3">
                                    {pending_tasks.length === 0 ? (
                                        <EmptyState icon={CheckCircle} message="¡Al día! No tienes tareas pendientes." />
                                    ) : (
                                        pending_tasks.map(task => (
                                            <div key={task.id}
                                                className="bg-white border border-gray-100 rounded-lg p-3 hover:border-blue-300 transition-colors shadow-sm space-y-3 group/task"
                                            >
                                                <div className="flex items-start gap-3 cursor-pointer" onClick={() => setViewingTask(task)}>
                                                    <div className={`mt-0.5 ${task.priority === 'ALTA' ? 'text-red-500' : task.priority === 'MEDIA' ? 'text-amber-500' : 'text-blue-500'}`}>
                                                        <AlertCircle size={16} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-sm font-bold text-gray-800 line-clamp-2 group-hover/task:text-blue-600 transition-colors">{task.title}</p>
                                                            <ChevronRight size={14} className="text-gray-300 group-hover/task:text-blue-400 translate-x-0 group-hover/task:translate-x-1 transition-all" />
                                                        </div>
                                                        {task.description && <p className="text-[10px] text-gray-500 line-clamp-1 italic">{task.description}</p>}
                                                        <div className="flex items-center justify-between mt-1">
                                                            <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                                                                <Calendar size={10} />
                                                                {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Sin fecha'}
                                                            </span>
                                                            <div className="flex gap-1">
                                                                {task.comments?.length > 0 && (
                                                                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                                        <Activity size={10} /> {task.comments.length}
                                                                    </span>
                                                                )}
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm ${task.priority === 'ALTA' ? 'bg-red-100 text-red-700' :
                                                                    task.priority === 'MEDIA' ? 'bg-amber-100 text-amber-700' :
                                                                        'bg-slate-100 text-slate-700'
                                                                    }`}>
                                                                    {task.priority || 'NORMAL'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Progress Section */}
                                                <div className="pt-2 border-t border-gray-50">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Avance: {task.progress || 0}%</span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${task.status === 'EN_PROGRESO' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
                                                            }`}>
                                                            {task.status || 'PENDIENTE'}
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        step="5"
                                                        value={updatingTask?.id === task.id ? updatingTask.progress : (task.progress || 0)}
                                                        onClick={e => e.stopPropagation()}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            setUpdatingTask({
                                                                id: task.id,
                                                                progress: val,
                                                                comment: updatingTask?.id === task.id ? updatingTask.comment : ''
                                                            });
                                                        }}
                                                        disabled={markingAttendance === task.id}
                                                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-600 border-none outline-none"
                                                        style={{
                                                            background: `linear-gradient(to right, #2563eb ${updatingTask?.id === task.id ? updatingTask.progress : (task.progress || 0)}%, #e5e7eb ${updatingTask?.id === task.id ? updatingTask.progress : (task.progress || 0)}%)`
                                                        }}
                                                    />

                                                    {updatingTask?.id === task.id && (
                                                        <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                            <textarea
                                                                placeholder="Describe tu avance..."
                                                                className="w-full text-[10px] p-2 border border-blue-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none resize-none bg-blue-50/30"
                                                                value={updatingTask.comment}
                                                                onClick={e => e.stopPropagation()}
                                                                onChange={(e) => setUpdatingTask({ ...updatingTask, comment: e.target.value })}
                                                                rows="2"
                                                            />
                                                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setUpdatingTask(null);
                                                                    }}
                                                                    className="flex-1 px-2 py-1 text-[10px] bg-gray-100 text-gray-600 rounded font-bold hover:bg-gray-200"
                                                                >
                                                                    CANCELAR
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const status = updatingTask.progress === 100 ? 'COMPLETADA' : 'EN_PROGRESO';
                                                                        handleUpdateTaskProgress(task.id, updatingTask.progress, status, updatingTask.comment);
                                                                        setUpdatingTask(null);
                                                                    }}
                                                                    disabled={updatingTask.progress <= (task.progress || 0)}
                                                                    className="flex-[2] px-2 py-1 text-[10px] bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-sm disabled:opacity-50"
                                                                >
                                                                    GUARDAR AVANCE
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )
                        }

                        {/* TREASURY TAB */}
                        {
                            activeTab === 'treasury' && (
                                <div className="space-y-3">
                                    {pending_debts.length === 0 ? (
                                        <EmptyState icon={DollarSign} message="Estás al día con tus pagos." />
                                    ) : (
                                        <>
                                            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 mb-2">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle size={16} className="text-amber-600 mt-0.5" />
                                                    <div>
                                                        <h5 className="text-xs font-bold text-amber-800">Tienes pagos pendientes</h5>
                                                        <p className="text-[10px] text-amber-700">Regulariza tus aportes o multas para evitar penalidades adicionales.</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {pending_debts.map((debt, index) => {
                                                const isInProcess = ['IN_PROCESS', 'validando', 'VALIDANDO'].includes(debt.status);
                                                const isSelected = selectedDebtKeys.includes(`${debt.type}-${debt.id}`);
                                                return (
                                                    <div
                                                        key={`${debt.type}-${debt.id}`}
                                                        onClick={() => !isInProcess && handleToggleDebt(debt)}
                                                        className={`bg-white border rounded-lg p-3 flex justify-between items-center shadow-sm transition-all ${isInProcess ? 'opacity-70 cursor-default bg-gray-50/50' :
                                                            isSelected ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50 cursor-pointer' :
                                                                'hover:border-blue-300 cursor-pointer'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {!isInProcess ? (
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                                                    {isSelected && <CheckCircle size={10} className="text-white" />}
                                                                </div>
                                                            ) : (
                                                                <div className="w-4 h-4 flex items-center justify-center text-amber-500">
                                                                    <RefreshCw size={14} className="animate-spin" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-xs font-bold text-gray-700">{debt.concept || 'Deuda Pendiente'}</p>
                                                                    {isInProcess && (
                                                                        <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Validando</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 mt-0.5">{debt.type === 'fine' ? 'Multa' : 'Aporte'}</p>
                                                            </div>
                                                        </div>
                                                        <span className="font-mono text-sm font-bold text-gray-900">
                                                            S/ {parseFloat(debt.amount || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            <button
                                                onClick={() => setIsPaymentModalOpen(true)}
                                                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <CreditCard size={14} />
                                                IR A PAGAR {selectedDebtKeys.length > 0 && `(S/ ${totalSelectedAmount.toFixed(2)})`}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )
                        }

                        {/* POLLS TAB */}
                        {
                            activeTab === 'polls_tab' && (
                                <div className="space-y-3">
                                    {active_polls.length === 0 ? (
                                        <EmptyState icon={BarChart3} message="No hay encuestas activas o recientes." />
                                    ) : (
                                        [...active_polls].sort((a, b) => b.id - a.id).map(poll => (
                                            <PollDetailView
                                                key={poll.id}
                                                poll={poll}
                                                onVote={async () => {
                                                    const data = await api.dashboard.getSummary();
                                                    const processed = processSummaryData(data);
                                                    setSummary(processed);
                                                }}
                                            />
                                        ))
                                    )}
                                </div>
                            )
                        }

                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 py-2 border-t text-[10px] text-center text-gray-400 uppercase font-medium tracking-wide" >
                        Actualizado hace unos instantes
                    </div>

                </div>
            )}

            {/* [NEW] Payment Modal */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="Registrar Pago"
                size="lg"
            >
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-sm font-bold text-blue-800 uppercase tracking-wider">Total Seleccionado</span>
                                <p className="text-xs text-blue-600/70 mt-1">Has seleccionado {selectedDebtKeys.length} items para pagar.</p>
                            </div>
                            <span className="text-3xl font-black text-blue-700">
                                S/ {Number(isNaN(totalSelectedAmount) ? 0 : totalSelectedAmount).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* [NEW] Account Display (Read Only) */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 ml-1">Cuenta de Destino (Automática)</label>
                        {(() => {
                            const account = destinationAccounts.find(a => String(a.id) === String(selectedAccount));
                            if (!account) return (
                                <div className="bg-red-50 p-4 text-red-600 text-xs rounded-xl border border-red-100 flex items-center gap-2">
                                    <AlertCircle size={18} />
                                    No se ha configurado una cuenta de destino. Contacte a soporte.
                                </div>
                            );

                            return (
                                <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 shadow-sm flex items-start gap-5 hover:border-indigo-200 transition-colors relative">
                                    <div className="absolute top-4 right-4">
                                        <Badge variant="info" className="text-[10px] px-2 py-0.5 font-bold">{account.currency}</Badge>
                                    </div>
                                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 mt-1">
                                        {account.institution?.logo_url ? (
                                            <img src={account.institution.logo_url} alt={account.institution?.name} className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <span className="text-xs font-black text-indigo-600 uppercase">{account.institution?.short_name || 'BANK'}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col gap-3">
                                            <div>
                                                <p className="text-[10px] uppercase text-indigo-400 font-black mb-0.5 tracking-wider">Titular de la Cuenta</p>
                                                <p className="text-xl font-black text-gray-900 leading-none">
                                                    {account.holder_name}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                                                {account.institution?.type === 'wallet' ? (
                                                    <div>
                                                        <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Número de Celular (Billetera)</p>
                                                        <p className="text-2xl font-black text-indigo-600 font-mono tracking-tighter">
                                                            {account.account_number || '---'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Número de Cuenta</p>
                                                            <p className="text-xl font-black text-gray-900 font-mono tracking-tighter">
                                                                {account.account_number || '---'}
                                                            </p>
                                                        </div>
                                                        {account.cci && (
                                                            <div>
                                                                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Código Interbancario (CCI)</p>
                                                                <p className="text-lg font-bold text-gray-700 font-mono tracking-tighter">
                                                                    {account.cci}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                        <p className="text-[10px] text-gray-400 mt-2 px-1 flex items-center gap-1">
                            <CheckCircle size={10} className="text-emerald-500" />
                            Tu pago será validado por la oficina de tesorería para confirmar tu aporte.
                        </p>
                    </div>

                    <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                        {summary?.pending_debts?.filter(d => selectedDebtKeys.includes(`${d.type}-${d.id}`)).map(debt => (
                            <div key={`${debt.type}-${debt.id}`} className="flex justify-between text-xs py-2 border-b border-dashed border-gray-200 last:border-0">
                                <span className="text-gray-600">{debt.concept}</span>
                                <span className="font-bold text-gray-800">S/ {(parseFloat(debt.amount) || 0).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700">Comprobante de Pago</label>
                        <div className="flex gap-4">
                            <label className="flex-1 block cursor-pointer group">
                                <div className={`h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${voucherFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 group-hover:border-blue-400'}`}>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    {voucherFile ? (
                                        <div className="text-center text-green-600 p-2">
                                            <CheckCircle size={28} className="mx-auto mb-2" />
                                            <p className="text-xs font-bold truncate max-w-[200px]">{voucherFile.name}</p>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400 group-hover:text-blue-500 transition-colors">
                                            <Upload size={28} className="mx-auto mb-2" />
                                            <p className="text-xs font-bold">Subir Foto/Captura del comprobante</p>
                                        </div>
                                    )}
                                </div>
                            </label>
                            {voucherPreview && (
                                <div className="w-32 h-32 rounded-2xl border bg-gray-100 overflow-hidden flex items-center justify-center relative group shadow-sm">
                                    <img src={voucherPreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                                    <button
                                        type="button"
                                        onClick={() => { setVoucherFile(null); setVoucherPreview(null); }}
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button variant="ghost" className="flex-1 h-12 text-sm font-bold" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-12 text-sm shadow-lg shadow-emerald-100"
                            disabled={selectedDebtKeys.length === 0 || !voucherFile || isUploading}
                        >
                            {isUploading ? <Loader2 className="animate-spin mr-2" size={18} /> : <DollarSign size={18} className="mr-2" />}
                            {isUploading ? 'PROCESANDO PAGO...' : 'CONFIRMAR PAGO'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Task Detail Modal - Moved outside popover to avoid clipping */}
            <Modal
                isOpen={!!viewingTask}
                onClose={() => setViewingTask(null)}
                title="Historial de Avance"
                size="md"
            >
                {viewingTask && (
                    <div className="space-y-6 pb-2">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="font-bold text-slate-800 mb-1">{viewingTask.title}</h4>
                            <p className="text-xs text-slate-500 mb-3">{viewingTask.description || 'Sin descripción adicional'}</p>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    <Badge variant={viewingTask.priority === 'ALTA' ? 'danger' : 'warning'}>{viewingTask.priority}</Badge>
                                    <Badge variant="info">{viewingTask.status}</Badge>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Progreso Actual</p>
                                    <p className="text-xl font-black text-blue-600">{viewingTask.progress}%</p>
                                </div>
                            </div>
                            <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full transition-all duration-1000"
                                    style={{ width: `${viewingTask.progress}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Clock size={14} />
                                Línea de Tiempo y Comentarios
                            </h5>

                            <div className="space-y-4">
                                {viewingTask.comments && viewingTask.comments.length > 0 ? (
                                    viewingTask.comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((comment, idx) => (
                                        <div key={idx} className="relative pl-6 border-l-2 border-slate-100 pb-2">
                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-400 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                            </div>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                    Avance: {comment.progress}%
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {new Date(comment.timestamp).toLocaleString('es-PE', {
                                                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-slate-50 italic">
                                                "{comment.text}"
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-400 italic">
                                        <Activity size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-xs font-medium">No hay historial de comentarios registrado aún.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setViewingTask(null)}
                                className="w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-colors shadow-lg shadow-slate-200"
                            >
                                CERRAR DETALLES
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const PollDetailView = ({ poll, onVote }) => {
    const { lastJsonMessage } = useMeetingWS();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [voting, setVoting] = useState(false);

    const loadResults = async () => {
        setLoading(true);
        try {
            const data = await api.polls.getResults(poll.id);
            setResults(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (poll.status === 'CLOSED' || poll.my_vote_option_id) {
            loadResults();
        }
    }, [poll.id, poll.status, poll.my_vote_option_id]);

    // [NEW] WebSocket live sync for results
    useEffect(() => {
        if (lastJsonMessage && lastJsonMessage.type === 'VOTE_UPDATE') {
            if (lastJsonMessage.poll_id === poll.id) {
                if (lastJsonMessage.results) {
                    setResults(lastJsonMessage.results);
                } else {
                    loadResults();
                }
            }
        }
    }, [lastJsonMessage, poll.id]);

    const handleVote = async (optionId) => {
        setVoting(true);
        try {
            await api.polls.vote(poll.id, optionId);
            toast.success("¡Voto registrado!");
            onVote();
            loadResults();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al votar");
        } finally {
            setVoting(false);
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:border-indigo-200 transition-colors">
            <div className={`p-3 border-b flex justify-between items-start gap-4 ${poll.status === 'ACTIVE' ? 'bg-indigo-50/30' : 'bg-gray-50/50'}`}>
                <h4 className="font-bold text-gray-800 text-xs leading-tight">{poll.title}</h4>
                <Badge variant={poll.status === 'ACTIVE' ? 'info' : 'secondary'} className="text-[8px] uppercase">
                    {poll.status === 'ACTIVE' ? 'EN VIVO' : 'FINALIZADA'}
                </Badge>
            </div>

            <div className="p-3 space-y-2">
                {poll.status === 'ACTIVE' && !poll.my_vote_option_id ? (
                    // VISTA PARA VOTAR
                    <div className="space-y-1.5">
                        {loading ? (
                            <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gray-300" /></div>
                        ) : (
                            results?.options?.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleVote(opt.id)}
                                    disabled={voting}
                                    className="w-full text-left p-2 rounded-lg border border-gray-100 bg-white hover:border-indigo-300 hover:bg-indigo-50 text-[11px] font-bold text-gray-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full bg-${opt.color || 'blue'}-500`} />
                                    {opt.text}
                                </button>
                            )) || (
                                <button onClick={loadResults} className="text-[10px] text-indigo-600 font-bold underline w-full text-center">Ver opciones para votar</button>
                            )
                        )}
                    </div>
                ) : (
                    // VISTA DE RESULTADOS
                    <div className="space-y-2">
                        {loading ? (
                            <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gray-300" /></div>
                        ) : (
                            results?.options?.map(opt => {
                                const isMyVote = poll.my_vote_option_id === opt.id;
                                return (
                                    <div key={opt.id} className="space-y-1">
                                        <div className="flex justify-between text-[9px] font-bold">
                                            <span className={`flex items-center gap-1 ${isMyVote ? 'text-indigo-600' : 'text-gray-600'}`}>
                                                {opt.text} {isMyVote && <CheckCircle size={10} />}
                                            </span>
                                            <span className="text-gray-400">{opt.percentage}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 bg-${opt.color || 'blue'}-500`}
                                                style={{ width: `${opt.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        {!loading && results && (
                            <div className="pt-1 flex justify-between items-center text-[8px] text-gray-400 font-bold uppercase tracking-tighter">
                                <span>{results.total_votes} votos totales</span>
                                {poll.status === 'ACTIVE' && <span className="text-indigo-500 animate-pulse">Sincronizando...</span>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const EmptyState = ({ icon: Icon, message }) => (
    <div className="flex flex-col items-center justify-center h-32 text-center">
        <div className="bg-gray-100 p-3 rounded-full mb-2">
            <Icon size={20} className="text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 font-medium max-w-[150px]">{message}</p>
    </div>
);

// --- Helper Components ---

const MeetingItemWithWS = (props) => {
    return (
        <MeetingWSProvider meetingId={props.meeting.id}>
            <MeetingActiveCard {...props} />
        </MeetingWSProvider>
    );
};

const MeetingActiveCard = ({ meeting: initialMeeting, user, markingAttendance, handleMarkAttendance, handleViewActa, handleSignActa }) => {
    const { lastJsonMessage } = useMeetingWS();
    const [meeting, setMeeting] = useState(initialMeeting);

    useEffect(() => {
        setMeeting(initialMeeting);
    }, [initialMeeting]);

    useEffect(() => {
        if (lastJsonMessage && lastJsonMessage.type === 'MEETING_UPDATED' && lastJsonMessage.meeting_id === meeting.id) {
            if (lastJsonMessage.is_preview_active !== undefined) {
                setMeeting(prev => ({ ...prev, is_preview_active: lastJsonMessage.is_preview_active }));
            }
        }
    }, [lastJsonMessage]);

    const expirationTime = meeting.real_end_time ? new Date(new Date(meeting.real_end_time).getTime() + 15 * 60000) : null;
    const isExpired = expirationTime && new Date() > expirationTime;
    const showPorFirmar = ['FINALIZADA', 'CERRADA'].includes(meeting.status) && !meeting.has_signed && !isExpired;

    // Calculate meeting end time for expired check logic (heuristic)
    const meetingEndTime = meeting.scheduled_start ? new Date(new Date(meeting.scheduled_start).getTime() + 4 * 60 * 60 * 1000) : new Date();

    return (
        <div className={`bg-white border-l-4 ${['FINALIZADA', 'CERRADA'].includes(meeting.status) ? 'border-amber-500' : 'border-red-500'} rounded-r-lg shadow-sm p-3 group hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-800 text-sm">{meeting.title}</h4>
                {['FINALIZADA', 'CERRADA'].includes(meeting.status) ? (
                    showPorFirmar && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            POR FIRMAR
                        </span>
                    )
                ) : (
                    <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        EN CURSO
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1"><Clock size={12} /> {meeting.start_time ? new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora'}</span>
                <span className="flex items-center gap-1"><Briefcase size={12} /> {user.eventRole || 'Participante'}</span>
            </div>

            {/* Lógica de Estados de Asistencia */}
            {meeting.status === 'EN_CURSO' && meeting.my_attendance_status === 'PENDIENTE' && (
                <button
                    onClick={() => handleMarkAttendance(meeting)}
                    disabled={markingAttendance === meeting.id}
                    className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white text-xs font-bold py-2 rounded-lg shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {markingAttendance === meeting.id ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <CheckCircle size={14} />
                    )}
                    MARCAR ASISTENCIA
                </button>
            )}
            {meeting.my_attendance_status === 'ESPERANDO_VALIDACION' && (
                <div className="w-full bg-orange-100 text-orange-700 text-xs py-2 rounded text-center border border-orange-200 font-bold">
                    ⏳ Esperando validación...
                </div>
            )}
            {/* Mostrar estado PRESENTE o TARDANZA */}
            {(meeting.status === 'EN_CURSO' || ['FINALIZADA', 'CERRADA'].includes(meeting.status)) &&
                (meeting.my_attendance_status === 'PRESENTE' || meeting.my_attendance_status === 'TARDANZA') && (
                    <div className={`w-full text-xs py-2 rounded text-center border font-bold flex items-center justify-center gap-1 ${meeting.my_attendance_status === 'TARDANZA'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                        <CheckCircle size={12} />
                        {meeting.my_attendance_status === 'TARDANZA'
                            ? 'Asistencia Confirmada (Tardanza)'
                            : 'Asistencia Confirmada'}
                    </div>
                )}

            {/* Botón VER ACTA (Vista Previa) */}
            {meeting.is_preview_active && (
                <button
                    onClick={() => handleViewActa(meeting.id)}
                    className="w-full mt-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 rounded-lg border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2"
                >
                    <FileText size={14} className="text-blue-600" />
                    VER ACTA
                </button>
            )}

            {/* Estado FALTA en reuniones Finalizadas/Cerradas si no se marcó */}
            {['FINALIZADA', 'CERRADA'].includes(meeting.status) &&
                (!meeting.my_attendance_status || meeting.my_attendance_status === 'FALTA') && (
                    <div className="w-full bg-red-100 text-red-700 text-xs py-2 rounded text-center border border-red-200 font-bold mb-2">
                        FALTA
                    </div>
                )}

            {/* Lógica FINALIZADA / FIRMA - Solo si asistió (PRESENTE o TARDANZA) */}
            {['FINALIZADA', 'CERRADA'].includes(meeting.status) &&
                (meeting.my_attendance_status === 'PRESENTE' || meeting.my_attendance_status === 'TARDANZA') && (
                    <div className="space-y-2 mt-2">
                        {meeting.has_signed ? (
                            <div className="w-full bg-emerald-50 text-emerald-700 text-xs py-2 rounded text-center border border-emerald-200 font-bold flex items-center justify-center gap-1">
                                <CheckCircle size={12} />
                                ACTA FIRMADA (SHA-256)
                            </div>
                        ) : (
                            meeting.real_end_time ? (
                                <CountdownTimer targetDate={new Date(new Date(meeting.real_end_time).getTime() + 15 * 60000)}>
                                    <button
                                        onClick={() => handleSignActa(meeting)}
                                        disabled={markingAttendance === meeting.id}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 rounded-lg shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 animate-pulse"
                                    >
                                        {markingAttendance === meeting.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <PenTool size={14} />
                                        )}
                                        FIRMAR ACTA
                                    </button>
                                </CountdownTimer>
                            ) : null
                        )}
                    </div>
                )}
        </div>
    );
};

export default UserDashboardWidget;
