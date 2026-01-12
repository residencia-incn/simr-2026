import React, { useState, useEffect } from 'react';
import { MOCK_USERS } from '../../../../data/mockUsers';
import { mockCourses } from '../../../../data/mockAulaVirtualData';
import Swal from 'sweetalert2';
import { api } from '../../../../services/api';

interface Enrollment {
    id: number;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatar: string;
    courseId: number;
    courseName: string;
    status: 'active' | 'completed' | 'pending_payment' | 'dropped';
    progress: number;
    enrolledAt: string;
    lastAccess: string;
    paymentMethod?: 'stripe' | 'transfer' | 'scholarship';
    paymentStatus?: 'verified' | 'pending' | 'failed';
    modality?: string;
    assignedWorkshops?: string[];
}

const EnrollmentManager: React.FC = () => {
    // State
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [stats, setStats] = useState({
        pendingVerification: 0,
        monthlyIncome: 4250,
        newEnrollments: 0,
        accessPending: 0
    });

    // Dynamic Options State
    const [modalitiesInfos, setModalitiesInfos] = useState<{ value: string; label: string }[]>([
        { value: 'all', label: 'Cualquier Modalidad' }
    ]);
    const [workshopsInfos, setWorkshopsInfos] = useState<{ id: string; name: string }[]>([]);

    // Configuration Rules
    const [autoValidation, setAutoValidation] = useState(true);
    const [manualVerification, setManualVerification] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState<'summary' | 'list'>('summary');

    // Filters
    const [filterCourse, setFilterCourse] = useState<number | 'all'>('all');
    const [filterPayment, setFilterPayment] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Access Modal State
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
    const [showAccessModal, setShowAccessModal] = useState(false);


    // Load and Sync Users from Organization Module
    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Fetch System Configuration
                const pricing = await api.treasury.getPricing();

                // Set Dynamic Options for UI
                let dynamicModalities: any[] = [];
                let dynamicWorkshops: any[] = [];

                if (pricing) {
                    if (pricing.ticketTypes) {
                        dynamicModalities = pricing.ticketTypes.map((t: any) => ({
                            value: t.title,
                            label: t.title
                        }));
                        setModalitiesInfos(dynamicModalities);
                    }
                    if (pricing.workshops) {
                        dynamicWorkshops = pricing.workshops;
                        setWorkshopsInfos(pricing.workshops);
                    }
                }

                // 2. Build Mappings
                const WORKSHOP_MAPPING: Record<string, string> = {};
                dynamicWorkshops.forEach(w => {
                    WORKSHOP_MAPPING[w.id] = w.name;
                });

                // 3. Filter and Map Users
                // Show ALL users from the system (System has 23 + SuperAdmin)
                const aulaVirtualUsers = MOCK_USERS;

                const mappedEnrollments: Enrollment[] = aulaVirtualUsers.map((user, index) => {
                    // Map workshops
                    const userWorkshops = (user.purchasedItems || [])
                        .map((itemId: string) => WORKSHOP_MAPPING[itemId])
                        .filter(Boolean);

                    // Normalize Modality (Dynamic Check)
                    let normalizedModality = 'Virtual';

                    // Try to find matching ticket title from user's registrationType or ticketType
                    // If user has a valid ticket ID in purchasedItems or ticketType property, use it to find title
                    const userTicketId = (user as any).ticketType || (user.purchasedItems || []).find((id: string) => id.startsWith('t_'));

                    if (userTicketId) {
                        const ticket = pricing.ticketTypes.find((t: any) => t.id === userTicketId);
                        if (ticket) normalizedModality = ticket.title;
                    } else if (user.registrationType) {
                        // Fallback to legacy string matching if ID not found
                        if (user.registrationType === 'presencial_certificado') normalizedModality = 'Presencial + Certificado';
                        else if (user.registrationType === 'presencial') normalizedModality = 'Presencial (Sin Certificado)';
                        else if (user.registrationType === 'virtual_certificado') normalizedModality = 'Virtual + Certificado';
                        else if (user.registrationType === 'virtual') normalizedModality = 'Virtual (Sin Certificado)';
                        // Check if registrationType matches a title directly (e.g. "Completa")
                        else {
                            const directMatch = pricing.ticketTypes.find((t: any) => t.title.toLowerCase() === user.registrationType.toLowerCase());
                            if (directMatch) normalizedModality = directMatch.title;
                            else normalizedModality = user.registrationType; // Keep as is if unknown
                        }
                    }

                    // Original overrides
                    if (user.amount === 0 && user.status === 'Confirmado' && !normalizedModality.includes('Presencial')) normalizedModality = 'Beca Completa';

                    return {
                        id: index + 1,
                        userId: user.id,
                        userName: `${user.firstName} ${user.lastName}`,
                        userEmail: user.email,
                        userAvatar: user.image || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`,
                        courseId: 1,
                        courseName: user.specialty ? `Curso de ${user.specialty}` : 'Neurología Clínica Avanzada',
                        status: user.hasPaid ? 'active' : 'pending_payment',
                        progress: user.attendancePercentage || 0,
                        enrolledAt: user.registrationDate || new Date().toISOString().split('T')[0],
                        lastAccess: '2025-01-10',
                        paymentMethod: user.amount === 0 ? 'scholarship' : 'stripe',
                        paymentStatus: user.hasPaid ? 'verified' : 'pending',
                        modality: normalizedModality,
                        assignedWorkshops: userWorkshops
                    };
                });

                setEnrollments(mappedEnrollments);

                // Update Stats
                setStats(prev => ({
                    ...prev,
                    pendingVerification: mappedEnrollments.filter(e => e.paymentStatus === 'pending').length,
                    newEnrollments: mappedEnrollments.filter(e => e.enrolledAt === new Date().toISOString().split('T')[0]).length,
                    accessPending: mappedEnrollments.filter(e => e.status !== 'active').length
                }));

            } catch (error) {
                console.error("Error initializing EnrollmentManager:", error);
            }
        };

        loadData();
    }, []);

    // ... (rest of component)





    // Filter Logic
    const filteredEnrollments = enrollments.filter(enrollment => {
        // Since we don't have real Course IDs mapped to users yet, we'll be lenient with course filter or map by name
        const matchCourse = filterCourse === 'all' || true; // Placeholder: Implement real course mapping logic if needed
        const matchPayment = filterPayment === 'all' || enrollment.paymentMethod === filterPayment;
        const matchStatus = filterStatus === 'all' || enrollment.status === filterStatus;
        const matchSearch = enrollment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enrollment.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCourse && matchPayment && matchStatus && matchSearch;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredEnrollments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);


    // Actions
    const handleApprove = (id: number) => {
        Swal.fire({
            title: '¿Aprobar acceso?',
            text: "El usuario recibirá una notificación de acceso concedido.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, aprobar',
            confirmButtonColor: '#10B981'
        }).then((result) => {
            if (result.isConfirmed) {
                setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status: 'active', paymentStatus: 'verified' } : e));
                Swal.fire('Aprobado', 'Acceso habilitado correctamente', 'success');
            }
        });
    };

    const handleRemind = (id: number) => {
        Swal.fire('Recordatorio Enviado', 'Se ha enviado un correo de recordatorio de pago.', 'success');
    };

    const handleEditAccess = (enrollment: Enrollment) => {
        setSelectedEnrollment(enrollment);
        setShowAccessModal(true);
    };

    const saveAccessChanges = (modality: string, workshops: string[]) => {
        if (!selectedEnrollment) return;
        setEnrollments(prev => prev.map(e => e.id === selectedEnrollment.id ? { ...e, modality, assignedWorkshops: workshops } : e));
        setShowAccessModal(false);
        Swal.fire('Guardado', 'Los permisos de acceso han sido actualizados', 'success');
    };

    const renderPagination = () => (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
            <div className="text-xs text-gray-500">
                {filteredEnrollments.length > 0
                    ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredEnrollments.length)} de ${filteredEnrollments.length}`
                    : 'Sin resultados'
                }
            </div>
            <div className="flex gap-1">
                <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1 border border-gray-200 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="text-xs font-medium py-1.5 px-2">
                    {totalPages > 0 ? currentPage : 1} / {totalPages > 0 ? totalPages : 1}
                </span>
                <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1 border border-gray-200 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-full bg-gray-50 overflow-hidden">
            {/* Local Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-full">
                <div className="p-6 border-b border-gray-100">

                    <h1 className="text-lg font-bold text-gray-900 leading-tight">Gestión de Inscritos</h1>
                    <p className="text-xs text-gray-500 mt-1">Organización &gt; Usuarios</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'summary'
                            ? 'bg-blue-50 text-blue-700 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <span className="material-symbols-outlined">dashboard</span>
                        Resumen y Reglas
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'list'
                            ? 'bg-blue-50 text-blue-700 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <span className="material-symbols-outlined">group</span>
                        Lista de Inscritos
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="bg-blue-50 rounded-xl p-4">
                        <p className="text-xs font-medium text-blue-800 mb-1">Estado del Sistema</p>
                        <div className="flex items-center gap-2 text-blue-600">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-xs">Sincronizado</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto h-full relative">
                <div className="p-8 pb-20 max-w-6xl mx-auto space-y-6">

                    {/* Content for Summary Tab */}
                    {activeTab === 'summary' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    title="Pendientes"
                                    value={stats.pendingVerification}
                                    icon="pending_actions"
                                    color="orange"
                                    trend="+2% vs ayer"
                                />
                                <StatCard
                                    title="Ingresos"
                                    value={`€${stats.monthlyIncome.toLocaleString()}`}
                                    icon="payments"
                                    color="blue"
                                    trend="+15% este mes"
                                />
                                <StatCard
                                    title="Inscripciones"
                                    value={stats.newEnrollments}
                                    icon="person_add"
                                    color="green"
                                    trend="+5% hoy"
                                />
                                <StatCard
                                    title="Accesos Pendientes"
                                    value={stats.accessPending}
                                    icon="lock_open_right"
                                    color="red"
                                    trend="! Requiere atención"
                                />
                            </div>

                            {/* Rules Section */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-left">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold text-gray-800">Reglas de Inscripción</h2>
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">Configuración Activa</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <RuleToggle
                                        title="Validación Automática (Stripe)"
                                        description="Habilitar acceso inmediato tras pago exitoso en pasarela."
                                        enabled={autoValidation}
                                        onChange={setAutoValidation}
                                    />
                                    <RuleToggle
                                        title="Verificación Manual (Transferencia)"
                                        description="Retener acceso hasta validar comprobante bancario."
                                        enabled={manualVerification}
                                        onChange={setManualVerification}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content for List Tab */}
                    {activeTab === 'list' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Filters and Search */}
                            <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl items-center justify-between shadow-sm border border-gray-100">
                                <div className="flex flex-wrap gap-4 flex-1">
                                    <select
                                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={filterCourse}
                                        onChange={(e) => setFilterCourse(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                    >
                                        <option value="all">Todos los Cursos</option>
                                        {mockCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>

                                    <select
                                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600"
                                        value={filterPayment}
                                        onChange={(e) => setFilterPayment(e.target.value)}
                                    >
                                        <option value="all">Método de Pago: Todos</option>
                                        <option value="stripe">Stripe</option>
                                        <option value="transfer">Transferencia</option>
                                    </select>

                                    <select
                                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="all">Estado: Todos</option>
                                        <option value="active">Activo</option>
                                        <option value="pending_payment">Pendiente Pago</option>
                                        <option value="completed">Completado</option>
                                    </select>
                                </div>

                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Enrollment Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                                {renderPagination()}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Modalidad</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Fecha de Inscripción</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {currentItems.map((enrollment) => (
                                                <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={enrollment.userAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                            <div>
                                                                <p className="font-semibold text-sm text-gray-900">{enrollment.userName}</p>
                                                                <p className="text-xs text-gray-500">{enrollment.userEmail}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${enrollment.modality?.includes('Presencial') ? 'bg-purple-100 text-purple-800' :
                                                            enrollment.modality?.includes('Híbrido') ? 'bg-indigo-100 text-indigo-800' :
                                                                'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {enrollment.modality || 'No asignada'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {enrollment.enrolledAt}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => handleEditAccess(enrollment)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg tooltip"
                                                                title="Editar Acceso"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Access Modal */}
                    {showAccessModal && selectedEnrollment && (
                        <AccessModal
                            enrollment={selectedEnrollment}
                            onClose={() => setShowAccessModal(false)}
                            onSave={saveAccessChanges}
                            availableModalities={modalitiesInfos}
                            availableWorkshops={workshopsInfos}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Subcomponents ---

const StatCard = ({ title, value, icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            </div>
            <div className={`p-2 bg-${color}-50 rounded-lg text-${color}-600`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
        </div>
        <p className={`text-xs font-medium ${trend.includes('!') ? 'text-red-500' : 'text-green-600'}`}>
            {trend}
        </p>
    </div>
);

const RuleToggle = ({ title, description, enabled, onChange }: any) => (
    <div className="flex items-start justify-between p-4 border border-gray-100 rounded-lg hover:border-blue-100 transition-colors">
        <div className="pr-4">
            <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

const StatusBadge = ({ status, text }: any) => {
    const colors: any = {
        pending: 'bg-red-50 text-red-600',
        approved: 'bg-green-50 text-green-600',
        processing: 'bg-blue-50 text-blue-600',
        verifying: 'bg-yellow-50 text-yellow-600'
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.processing}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {text}
        </span>
    );
};

// Access Modal Component
const AccessModal = ({ enrollment, onClose, onSave, availableModalities, availableWorkshops }: any) => {
    const [modality, setModality] = useState(enrollment.modality || 'Virtual');
    const [selectedWorkshops, setSelectedWorkshops] = useState<string[]>(enrollment.assignedWorkshops || []);

    const toggleWorkshop = (workshopName: string) => {
        if (selectedWorkshops.includes(workshopName)) {
            setSelectedWorkshops(prev => prev.filter(w => w !== workshopName));
        } else {
            setSelectedWorkshops(prev => [...prev, workshopName]);
        }
    };

    // Handle ESC key to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Gestión de Acceso</h3>
                        <p className="text-sm text-gray-500">Editando permisos para <span className="font-semibold text-blue-600">{enrollment.userName}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Modality Section */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Modalidad de Inscripción</label>
                        <select
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={modality}
                            onChange={(e) => setModality(e.target.value)}
                        >
                            {availableModalities && availableModalities.length > 0 ? (
                                availableModalities.map((m: any) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))
                            ) : (
                                <option value="Virtual">Cargando...</option>
                            )}
                        </select>
                        <p className="mt-2 text-xs text-gray-500">Determina el tipo de certificado y los recursos disponibles.</p>
                    </div>

                    {/* Workshops Section */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Asignación de Talleres</label>
                        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50/50">
                            {availableWorkshops && availableWorkshops.map((w: any) => (
                                <label key={w.id} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        checked={selectedWorkshops.includes(w.name)}
                                        onChange={() => toggleWorkshop(w.name)}
                                    />
                                    <span className="ml-3 text-sm text-gray-700">{w.name}</span>
                                </label>
                            ))}
                            {(!availableWorkshops || availableWorkshops.length === 0) && (
                                <p className="text-xs text-gray-500 p-2">No hay talleres disponibles.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSave(modality, selectedWorkshops)}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-600/20 transition-all transform active:scale-95"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnrollmentManager;
