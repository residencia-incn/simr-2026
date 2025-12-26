import React, { useState } from 'react';
import { BookOpen, Users, Code, Database, FileText, GitBranch, Map, Settings, ChevronRight, Shield, CheckCircle, AlertTriangle, Sliders } from 'lucide-react';
import { Card } from '../components/ui';

const DocumentationView = () => {
    const [activeSection, setActiveSection] = useState('overview');

    const sections = [
        { id: 'overview', label: 'Visión General', icon: BookOpen },
        { id: 'rbac', label: 'Roles y Permisos (RBAC)', icon: Shield },
        { id: 'architecture', label: 'Arquitectura', icon: Map },
        { id: 'test-users', label: 'Usuarios de Prueba', icon: Users },
        { id: 'components', label: 'Mapa de Componentes', icon: Code },
        { id: 'data-models', label: 'Modelos de Datos', icon: Database },
        { id: 'api-reference', label: 'Referencia API', icon: Settings },
        { id: 'development', label: 'Guía de Desarrollo', icon: FileText },
        { id: 'changelog', label: 'Changelog', icon: GitBranch }
    ];

    const testUsers = [
        {
            category: 'Superadmin',
            users: [
                { email: 'admin', password: 'admin', name: 'Super Usuario', roles: 'Todos los roles' }
            ]
        },
        {
            category: 'Comité Organizador',
            users: [
                { email: 'admin', password: 'admin', name: 'Super Usuario', roles: 'admin, academic, treasurer' }
            ]
        },
        {
            category: 'Académico',
            users: [
                { email: 'academico', password: 'academico', name: 'Dr. Pedro Castillo', roles: 'academic, participant' },
                { email: 'ltrujillo@incn.gob.pe', password: 'N/A', name: 'Dr. Luis Trujillo', roles: 'academic, resident, participant' }
            ]
        },
        {
            category: 'Tesorero',
            users: [
                { email: 'tesorero', password: 'tesorero', name: 'Dra. Ana Torres', roles: 'treasurer, participant' },
                { email: 'jperez@gmail.com', password: 'N/A', name: 'Dr. Juan Pérez', roles: 'treasurer, resident, participant' }
            ]
        },
        {
            category: 'Jurado',
            users: [
                { email: 'rabinstein@mayo.edu', password: 'N/A', name: 'Dr. Alejandro Rabinstein', roles: 'jury, participant' }
            ]
        },
        {
            category: 'Residentes',
            users: [
                { email: 'hvasquez@incn.gob.pe', password: 'N/A', name: 'Dr. Henderson Vasquez', roles: 'resident, participant' },
                { email: 'cgutierrez@incn.gob.pe', password: 'N/A', name: 'Dr. Carlos Gutierrez', roles: 'resident, participant' }
            ]
        }
    ];

    const components = [
        {
            category: 'Vistas Principales',
            items: [
                { name: 'HomeView', path: '/views/HomeView.jsx', description: 'Página principal con carousel, countdown y secciones informativas' },
                { name: 'AdminDashboard', path: '/views/AdminDashboard.jsx', description: 'Panel de administración con gestión de asistentes, programa, comité, etc.' },
                { name: 'AcademicDashboard', path: '/views/AcademicDashboard.jsx', description: 'Panel académico para gestión de trabajos, jurados y calificaciones' },
                { name: 'ResidentDashboard', path: '/views/ResidentDashboard.jsx', description: 'Panel para residentes con envío de trabajos y seguimiento' },
                { name: 'TreasurerDashboard', path: '/views/TreasurerDashboard.jsx', description: 'Panel de tesorería con gestión financiera' }
            ]
        },
        {
            category: 'Componentes Admin',
            items: [
                { name: 'PlanningManager', path: '/components/admin/PlanningManager.jsx', description: 'Gestión de reuniones y asignación de tareas' },
                { name: 'MyTasks', path: '/components/admin/MyTasks.jsx', description: 'Vista de tareas asignadas para miembros del comité' },
                { name: 'ProgramManager', path: '/components/admin/ProgramManager.jsx', description: 'Gestión del programa científico con bloques horarios' },
                { name: 'CommitteeManager', path: '/components/admin/CommitteeManager.jsx', description: 'Gestión de miembros del comité organizador' },
                { name: 'CertificationManager', path: '/components/admin/CertificationManager.jsx', description: 'Aprobación de notas y emisión de certificados' },
                { name: 'SystemConfiguration', path: '/components/admin/SystemConfiguration.jsx', description: 'Configuración general del sistema' },
                { name: 'UserManagement', path: '/components/admin/UserManagement.jsx', description: 'Gestión de usuarios y asignación de roles' },
                { name: 'PermissionsModal', path: '/components/admin/PermissionsModal.jsx', description: 'Gestor manual de permisos RBAC' }
            ]
        },
        {
            category: 'Autenticación & Seguridad',
            items: [
                { name: 'AuthContext', path: '/context/AuthContext.tsx', description: 'Provider global para estado de usuario y permisos' },
                { name: 'PermissionGate', path: '/components/auth/PermissionGate.tsx', description: 'Wrapper para proteger componentes basado en scopes' },
                { name: 'LoginModal', path: '/views/LoginModal.jsx', description: 'Modal de autenticación de usuarios' }
            ]
        },
        {
            category: 'Componentes Comunes',
            items: [
                { name: 'TasksQuickAccess', path: '/components/common/TasksQuickAccess.jsx', description: 'Acceso rápido a tareas desde el header' },
                { name: 'NotificationMenu', path: '/components/common/NotificationMenu.jsx', description: 'Menú de notificaciones en el header' },
                { name: 'HeroCarousel', path: '/components/common/HeroCarousel.jsx', description: 'Carousel principal de la página de inicio' }
            ]
        }
    ];

    const dataModels = [
        {
            name: 'Attendees',
            storage: 'ATTENDEES',
            fields: ['id', 'name', 'email', 'dni', 'cmp', 'institution', 'modality', 'status', 'certificationApproved', 'grade']
        },
        {
            name: 'Registrations',
            storage: 'REGISTRATIONS',
            fields: ['id', 'name', 'email', 'dni', 'institution', 'modalidad', 'amount', 'paymentProof', 'status']
        },
        {
            name: 'Works',
            storage: 'WORKS',
            fields: ['id', 'title', 'authors', 'category', 'submittedBy', 'submittedAt', 'status', 'assignedJury', 'grades']
        },
        {
            name: 'Planning Meetings',
            storage: 'PLANNING_MEETINGS',
            fields: ['id', 'date', 'title', 'agreements', 'attendees', 'createdBy', 'createdAt']
        },
        {
            name: 'Planning Tasks',
            storage: 'PLANNING_TASKS',
            fields: ['id', 'meetingId', 'title', 'description', 'assignedTo', 'dueDate', 'priority', 'progress', 'status', 'comments']
        },
        {
            name: 'Treasury',
            storage: 'TREASURY',
            fields: ['id', 'type', 'amount', 'description', 'category', 'date', 'createdBy']
        }
    ];

    const gitCommits = [
        {
            hash: '5c3d2e1',
            date: '2025-12-25',
            message: 'feat: Add Advanced Permissions Mode to User Management',
            details: [
                'Added toggle in PermissionsModal to switch between Module View and Advanced View',
                'Implemented granular scope-level permission control (profile:read, accounting:write, etc.)',
                'Created comprehensive UI for selecting individual permissions grouped by category',
                'Updated documentation with complete scope list and usage examples',
                'Added support for custom permission arrays alongside module-based permissions'
            ]
        },
        {
            hash: '4f2a1b0',
            date: '2025-12-25',
            message: 'feat: Implement RBAC System (Roles & Permissions)',
            details: [
                'Created AuthContext with permission derivation from legacy roles',
                'Implemented PermissionGate component for UI protection',
                'Added PermissionsModal for manual scope management in Admin',
                'Protected critical routes (Treasury, Jury, Admin) in App.jsx',
                'Added fine-grained permission control (accounting:read, users:manage, etc.)'
            ]
        },
        {
            hash: 'a7b8c9d',
            date: '2025-12-09',
            message: 'feat: Add Attendance System with QR support',
            details: [
                'Added QR code generation and display in User Profile',
                'Implemented AttendanceManager for admin/staff',
                'Added reliable QR scanner with camera support',
                'Created self-check-in flow with daily tokens',
                'Integrated real-time attendance statistics'
            ]
        },
        {
            hash: '6b85b17',
            date: '2025-12-09',
            message: 'feat: Add planning and task management system with quick access',
            details: [
                'Implemented comprehensive planning module for secretaries',
                'Added PlanningManager component for meeting and task management',
                'Created MyTasks component for committee members',
                'Added TasksQuickAccess in header with badge notifications',
                'Implemented meeting details modal with task progress and comments'
            ]
        },
        {
            hash: 'prev',
            date: '2025-12-08',
            message: 'Previous features',
            details: [
                'Academic dates and deadlines configuration',
                'Schedule conflict detection and prevention',
                'Registration system with pricing logic',
                'Local persistence with localStorage'
            ]
        }
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">SIMR 2026 - Documentación Técnica</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Sistema de gestión integral para el Simposio Internacional de Medicina de Residentes del Instituto Nacional de Ciencias Neurológicas.
                            </p>
                        </div>

                        <Card className="bg-blue-50 border-blue-200">
                            <h3 className="font-bold text-blue-900 mb-3">Stack Tecnológico</h3>
                            <ul className="space-y-2 text-sm text-blue-800">
                                <li><strong>Frontend:</strong> React 18 con Vite</li>
                                <li><strong>Estilos:</strong> Tailwind CSS (Vanilla)</li>
                                <li><strong>Iconos:</strong> Lucide React</li>
                                <li><strong>Persistencia:</strong> LocalStorage</li>
                                <li><strong>Routing:</strong> Client-side navigation</li>
                            </ul>
                        </Card>

                        <Card>
                            <h3 className="font-bold text-gray-900 mb-3">Módulos Principales</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="p-3 bg-gray-50 rounded border">
                                    <strong className="text-blue-600">Administración</strong>
                                    <p className="text-gray-600 text-xs mt-1">Gestión de asistentes, programa, comité, certificados</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded border">
                                    <strong className="text-green-600">Académico</strong>
                                    <p className="text-gray-600 text-xs mt-1">Trabajos, jurados, calificaciones, rúbricas</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded border">
                                    <strong className="text-purple-600">Planificación</strong>
                                    <p className="text-gray-600 text-xs mt-1">Reuniones, acuerdos, tareas, seguimiento</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded border">
                                    <strong className="text-yellow-600">Tesorería</strong>
                                    <p className="text-gray-600 text-xs mt-1">Ingresos, egresos, balance financiero</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            case 'rbac':
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sistema de Roles y Permisos (RBAC)</h2>
                            <p className="text-gray-600">
                                El sistema utiliza un control de acceso basado en roles (Legacy) y permisos granulares (Scopes).
                                Esto permite tanto la asignación rápida de perfiles como la personalización detallada de accesos.
                            </p>
                        </div>

                        <Card>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Shield className="text-blue-600" size={20} />
                                Conceptos Fundamentales
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                    <h4 className="font-bold text-purple-900 mb-2">Roles (Función en el Evento)</h4>
                                    <p className="text-sm text-purple-800 mb-2">
                                        Define la función principal del usuario en el evento.
                                    </p>
                                    <ul className="text-sm space-y-1 text-purple-700">
                                        <li>• <strong>Asistente:</strong> Participante básico</li>
                                        <li>• <strong>Organizador:</strong> Miembro del staff</li>
                                        <li>• <strong>Jurado:</strong> Evaluador de trabajos</li>
                                        <li>• <strong>Ponente:</strong> Presentador</li>
                                    </ul>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                    <h4 className="font-bold text-green-900 mb-2">Módulos (Áreas de Acceso)</h4>
                                    <p className="text-sm text-green-800 mb-2">
                                        Secciones específicas de la aplicación a las que el usuario tiene acceso.
                                    </p>
                                    <div className="text-xs font-mono bg-white p-2 rounded border border-green-200 text-green-700 space-y-1">
                                        <div>mi_perfil</div>
                                        <div>aula_virtual</div>
                                        <div>contabilidad</div>
                                        <div>secretaria</div>
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <h4 className="font-bold text-blue-900 mb-2">Permisos (Scopes)</h4>
                                    <p className="text-sm text-blue-800 mb-2">
                                        Permisos granulares que controlan acciones específicas.
                                    </p>
                                    <div className="text-xs font-mono bg-white p-2 rounded border border-blue-200 text-blue-700 space-y-1">
                                        <div>accounting:read</div>
                                        <div>users:manage</div>
                                        <div>papers:write</div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <h3 className="font-bold text-gray-900 mb-4">Lógica de Asignación de Módulos</h3>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-bold text-gray-800 mb-2">1. Asistente</h4>
                                    <p className="text-sm text-gray-600 mb-2">Acceso base: <code className="bg-white px-2 py-1 rounded">mi_perfil</code></p>
                                    <p className="text-sm text-gray-600">
                                        <strong>Condicional:</strong> Si pagó modalidad Virtual o Presencial+Certificado →
                                        <code className="bg-white px-2 py-1 rounded ml-1">aula_virtual</code>
                                    </p>
                                </div>

                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-bold text-blue-800 mb-2">2. Organizador (Staff)</h4>
                                    <p className="text-sm text-blue-700 mb-2">
                                        Acceso común: <code className="bg-white px-2 py-1 rounded">mi_perfil</code>,
                                        <code className="bg-white px-2 py-1 rounded ml-1">aula_virtual</code>,
                                        <code className="bg-white px-2 py-1 rounded ml-1">trabajos</code>
                                    </p>
                                    <p className="text-sm text-blue-700 font-bold mb-1">Acceso específico por función:</p>
                                    <ul className="text-sm space-y-1 text-blue-600">
                                        <li>• <strong>Tesorero:</strong> + <code className="bg-white px-2 py-1 rounded">contabilidad</code></li>
                                        <li>• <strong>Secretaria:</strong> + <code className="bg-white px-2 py-1 rounded">secretaria</code></li>
                                        <li>• <strong>Investigación:</strong> + <code className="bg-white px-2 py-1 rounded">investigacion</code></li>
                                        <li>• <strong>Académico:</strong> + <code className="bg-white px-2 py-1 rounded">academico</code></li>
                                        <li>• <strong>Admin:</strong> + <code className="bg-white px-2 py-1 rounded">organizacion</code> (acceso total)</li>
                                    </ul>
                                </div>

                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <h4 className="font-bold text-purple-800 mb-2">3. Jurado</h4>
                                    <p className="text-sm text-purple-700">
                                        Acceso: <code className="bg-white px-2 py-1 rounded">mi_perfil</code>,
                                        <code className="bg-white px-2 py-1 rounded ml-1">jurado</code>,
                                        <code className="bg-white px-2 py-1 rounded ml-1">aula_virtual</code>
                                    </p>
                                </div>

                                <div className="p-4 bg-green-50 rounded-lg">
                                    <h4 className="font-bold text-green-800 mb-2">4. Ponente</h4>
                                    <p className="text-sm text-green-700">
                                        Acceso: <code className="bg-white px-2 py-1 rounded">mi_perfil</code>,
                                        <code className="bg-white px-2 py-1 rounded ml-1">aula_virtual</code>
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">Módulo / Scope</th>
                                            <th className="px-4 py-3 text-center">Admin</th>
                                            <th className="px-4 py-3 text-center">Tesorero</th>
                                            <th className="px-4 py-3 text-center">Académico</th>
                                            <th className="px-4 py-3 text-center">Participante</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        <tr>
                                            <td className="px-4 py-2 font-medium">Contabilidad <span className="block text-xs text-gray-400 font-mono">accounting:read</span></td>
                                            <td className="text-center text-green-600"><CheckCircle size={16} className="inline" /></td>
                                            <td className="text-center text-green-600"><CheckCircle size={16} className="inline" /></td>
                                            <td className="text-center text-gray-300">-</td>
                                            <td className="text-center text-gray-300">-</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 font-medium">Usuarios <span className="block text-xs text-gray-400 font-mono">users:manage</span></td>
                                            <td className="text-center text-green-600"><CheckCircle size={16} className="inline" /></td>
                                            <td className="text-center text-gray-300">-</td>
                                            <td className="text-center text-gray-300">-</td>
                                            <td className="text-center text-gray-300">-</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 font-medium">Trabajos <span className="block text-xs text-gray-400 font-mono">papers:read</span></td>
                                            <td className="text-center text-green-600"><CheckCircle size={16} className="inline" /></td>
                                            <td className="text-center text-gray-300">-</td>
                                            <td className="text-center text-green-600"><CheckCircle size={16} className="inline" /></td>
                                            <td className="text-center text-gray-300">-</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 font-medium">Aula Virtual <span className="block text-xs text-gray-400 font-mono">classroom:read</span></td>
                                            <td className="text-center text-green-600"><CheckCircle size={16} className="inline" /></td>
                                            <td className="text-center text-gray-300">-</td>
                                            <td className="text-center text-green-600"><CheckCircle size={16} className="inline" /></td>
                                            <td className="text-center text-green-600"><CheckCircle size={16} className="inline" /></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        <Card className="bg-yellow-50 border-yellow-200">
                            <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                                <AlertTriangle size={18} />
                                Gestión Manual de Permisos
                            </h3>
                            <p className="text-sm text-yellow-800 mb-2">
                                Los administradores pueden asignar módulos o permisos específicos manualmente,
                                sobrescribiendo la asignación automática basada en roles.
                            </p>
                            <p className="text-sm text-yellow-800 mb-2">
                                Esto se realiza desde <strong>Administración &gt; Usuarios</strong>, usando el botón de "Escudo" (🛡️).
                            </p>
                            <p className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                                <strong>Ejemplo:</strong> Un usuario con rol "Asistente" que no pagó puede recibir acceso manual
                                al módulo <code>aula_virtual</code> como cortesía.
                            </p>
                        </Card>

                        <Card className="bg-purple-50 border-purple-200">
                            <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                <Sliders size={18} />
                                Modo Avanzado: Control Granular de Permisos
                            </h3>
                            <p className="text-sm text-purple-800 mb-3">
                                El <strong>Modo Avanzado</strong> permite un control preciso a nivel de scopes individuales,
                                ideal para casos donde se necesita limitar o expandir accesos específicos sin cambiar el módulo completo.
                            </p>

                            <div className="space-y-3">
                                <div className="bg-white p-3 rounded-lg border border-purple-200">
                                    <h4 className="font-bold text-purple-900 mb-2 text-sm">¿Cómo acceder?</h4>
                                    <ol className="text-sm text-purple-800 space-y-1 list-decimal list-inside">
                                        <li>Ir a <strong>Organización &gt; Gestión de Usuarios</strong></li>
                                        <li>Click en el icono de escudo (🛡️) del usuario</li>
                                        <li>Activar el toggle <strong>"Modo Avanzado"</strong></li>
                                        <li>Seleccionar/deseleccionar permisos específicos</li>
                                        <li>Guardar cambios</li>
                                    </ol>
                                </div>

                                <div className="bg-white p-3 rounded-lg border border-purple-200">
                                    <h4 className="font-bold text-purple-900 mb-2 text-sm">Casos de Uso</h4>
                                    <ul className="text-sm text-purple-800 space-y-2">
                                        <li>• <strong>Restricción específica:</strong> Un usuario con módulo "Contabilidad" pero sin permiso de escritura (<code>accounting:write</code>), solo lectura.</li>
                                        <li>• <strong>Acceso temporal:</strong> Dar <code>jury:evaluate</code> a un organizador para que evalúe trabajos sin acceso completo al módulo Jurado.</li>
                                        <li>• <strong>Permisos mixtos:</strong> Combinar permisos de diferentes módulos sin activar todos los módulos completos.</li>
                                    </ul>
                                </div>

                                <div className="bg-white p-3 rounded-lg border border-purple-200">
                                    <h4 className="font-bold text-purple-900 mb-2 text-sm">Lista Completa de Scopes</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <p className="font-bold text-purple-900 mb-1">Perfil y Básico</p>
                                            <ul className="font-mono text-purple-700 space-y-0.5">
                                                <li>• profile:read</li>
                                                <li>• profile:write</li>
                                                <li>• classroom:read</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-bold text-purple-900 mb-1">Académico</p>
                                            <ul className="font-mono text-purple-700 space-y-0.5">
                                                <li>• papers:read</li>
                                                <li>• papers:submit</li>
                                                <li>• papers:write</li>
                                                <li>• papers:manage</li>
                                                <li>• papers:grade</li>
                                                <li>• academic:read</li>
                                                <li>• academic:write</li>
                                                <li>• jury:assign</li>
                                                <li>• jury:read</li>
                                                <li>• jury:evaluate</li>
                                                <li>• research:read</li>
                                                <li>• research:write</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-bold text-purple-900 mb-1">Administrativo</p>
                                            <ul className="font-mono text-purple-700 space-y-0.5">
                                                <li>• accounting:read</li>
                                                <li>• accounting:write</li>
                                                <li>• secretary:read</li>
                                                <li>• planning:read</li>
                                                <li>• planning:write</li>
                                                <li>• attendance:read</li>
                                                <li>• attendance:write</li>
                                                <li>• users:manage</li>
                                                <li>• admin:all</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            case 'architecture':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Arquitectura del Sistema</h2>

                        <Card>
                            <h3 className="font-bold text-gray-900 mb-3">Estructura de Directorios</h3>
                            <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
                                {`frontend/
├── src/
│   ├── components/
│   │   ├── admin/          # Componentes de administración
│   │   ├── academic/       # Componentes académicos
│   │   ├── common/         # Componentes compartidos
│   │   ├── layout/         # Layout components
│   │   └── ui/             # UI primitives
│   ├── views/              # Vistas principales
│   ├── services/           # API y storage
│   ├── hooks/              # Custom hooks
│   ├── data/               # Mock data
│   └── App.jsx             # Componente raíz`}
                            </pre>
                        </Card>

                        <Card>
                            <h3 className="font-bold text-gray-900 mb-3">Sistema de Roles</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-3 p-2 bg-red-50 rounded">
                                    <span className="font-bold text-red-700">superadmin</span>
                                    <span className="text-gray-600">Acceso total al sistema</span>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-blue-50 rounded">
                                    <span className="font-bold text-blue-700">admin</span>
                                    <span className="text-gray-600">Gestión general del evento</span>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
                                    <span className="font-bold text-green-700">academic</span>
                                    <span className="text-gray-600">Gestión académica y trabajos</span>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded">
                                    <span className="font-bold text-yellow-700">treasurer</span>
                                    <span className="text-gray-600">Gestión financiera</span>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-purple-50 rounded">
                                    <span className="font-bold text-purple-700">jury</span>
                                    <span className="text-gray-600">Evaluación de trabajos</span>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                    <span className="font-bold text-gray-700">resident</span>
                                    <span className="text-gray-600">Envío de trabajos</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            case 'test-users':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Usuarios de Prueba</h2>

                        {testUsers.map((category, idx) => (
                            <Card key={idx}>
                                <h3 className="font-bold text-gray-900 mb-3">{category.category}</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="text-left p-2 font-bold text-gray-700">Email/Usuario</th>
                                                <th className="text-left p-2 font-bold text-gray-700">Contraseña</th>
                                                <th className="text-left p-2 font-bold text-gray-700">Nombre</th>
                                                <th className="text-left p-2 font-bold text-gray-700">Roles</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {category.users.map((user, userIdx) => (
                                                <tr key={userIdx} className="border-t border-gray-100">
                                                    <td className="p-2 font-mono text-xs bg-gray-50">{user.email}</td>
                                                    <td className="p-2 font-mono text-xs bg-gray-50">{user.password}</td>
                                                    <td className="p-2">{user.name}</td>
                                                    <td className="p-2 text-xs text-gray-600">{user.roles}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        ))}
                    </div>
                );

            case 'components':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mapa de Componentes</h2>

                        {components.map((category, idx) => (
                            <Card key={idx}>
                                <h3 className="font-bold text-gray-900 mb-3">{category.category}</h3>
                                <div className="space-y-2">
                                    {category.items.map((component, compIdx) => (
                                        <div key={compIdx} className="p-3 bg-gray-50 rounded border border-gray-200">
                                            <div className="flex items-start justify-between mb-1">
                                                <span className="font-mono text-sm font-bold text-blue-600">{component.name}</span>
                                                <span className="text-xs text-gray-500 font-mono">{component.path}</span>
                                            </div>
                                            <p className="text-sm text-gray-700">{component.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                );

            case 'data-models':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Modelos de Datos</h2>

                        {dataModels.map((model, idx) => (
                            <Card key={idx}>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-gray-900">{model.name}</h3>
                                    <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                        {model.storage}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {model.fields.map((field, fieldIdx) => (
                                        <span key={fieldIdx} className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded border">
                                            {field}
                                        </span>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                );

            case 'api-reference':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Referencia API</h2>

                        <Card>
                            <h3 className="font-bold text-gray-900 mb-3">Módulos Principales</h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-mono text-sm font-bold text-blue-600 mb-2">api.planning</h4>
                                    <ul className="text-sm space-y-1 ml-4">
                                        <li className="font-mono text-xs">getMeetings()</li>
                                        <li className="font-mono text-xs">saveMeeting(meeting)</li>
                                        <li className="font-mono text-xs">deleteMeeting(id)</li>
                                        <li className="font-mono text-xs">getTasks()</li>
                                        <li className="font-mono text-xs">saveTask(task)</li>
                                        <li className="font-mono text-xs">updateTaskProgress(taskId, progress, comment, userId)</li>
                                        <li className="font-mono text-xs">getMyTasks(userId)</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-mono text-sm font-bold text-blue-600 mb-2">api.attendees</h4>
                                    <ul className="text-sm space-y-1 ml-4">
                                        <li className="font-mono text-xs">getAll()</li>
                                        <li className="font-mono text-xs">add(attendee)</li>
                                        <li className="font-mono text-xs">update(id, data)</li>
                                        <li className="font-mono text-xs">remove(id)</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-mono text-sm font-bold text-blue-600 mb-2">api.works</h4>
                                    <ul className="text-sm space-y-1 ml-4">
                                        <li className="font-mono text-xs">getAll()</li>
                                        <li className="font-mono text-xs">submit(work)</li>
                                        <li className="font-mono text-xs">assignJury(workId, juryIds)</li>
                                        <li className="font-mono text-xs">submitGrade(workId, juryId, grade)</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            case 'development':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Guía de Desarrollo</h2>

                        <Card>
                            <h3 className="font-bold text-gray-900 mb-3">Convenciones de Código</h3>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li>• Componentes en PascalCase</li>
                                <li>• Funciones y variables en camelCase</li>
                                <li>• Constantes en UPPER_SNAKE_CASE</li>
                                <li>• Archivos de componentes: ComponentName.jsx</li>
                                <li>• Usar destructuring para props</li>
                                <li>• Preferir functional components con hooks</li>
                            </ul>
                        </Card>

                        <Card>
                            <h3 className="font-bold text-gray-900 mb-3">Agregar Nueva Funcionalidad</h3>
                            <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                                <li>Crear componente en la carpeta apropiada</li>
                                <li>Agregar métodos API en services/api.js si es necesario</li>
                                <li>Definir storage keys en services/storage.js</li>
                                <li>Agregar ruta en App.jsx si es una vista</li>
                                <li>Implementar control de acceso por roles</li>
                                <li>Actualizar esta documentación</li>
                                <li>Hacer commit con mensaje descriptivo</li>
                            </ol>
                        </Card>

                        <Card className="bg-yellow-50 border-yellow-200">
                            <h3 className="font-bold text-yellow-900 mb-3">Mejores Prácticas</h3>
                            <ul className="space-y-2 text-sm text-yellow-800">
                                <li>✓ Usar el hook useApi para llamadas asíncronas</li>
                                <li>✓ Implementar loading states</li>
                                <li>✓ Manejar errores apropiadamente</li>
                                <li>✓ Validar datos antes de guardar</li>
                                <li>✓ Usar componentes UI reutilizables</li>
                                <li>✓ Mantener componentes pequeños y enfocados</li>
                            </ul>
                        </Card>
                    </div>
                );

            case 'changelog':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Historial de Cambios</h2>

                        <div className="space-y-4">
                            {gitCommits.map((commit, idx) => (
                                <Card key={idx} className="border-l-4 border-l-blue-500">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{commit.message}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                    {commit.hash}
                                                </span>
                                                <span className="text-xs text-gray-500">{commit.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ul className="space-y-1 text-sm text-gray-700">
                                        {commit.details.map((detail, detailIdx) => (
                                            <li key={detailIdx} className="flex items-start gap-2">
                                                <ChevronRight size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                <span>{detail}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            ))}
                        </div>

                        <Card className="bg-blue-50 border-blue-200">
                            <p className="text-sm text-blue-800">
                                <strong>Nota:</strong> Este changelog se actualiza automáticamente con cada commit de Git.
                                Para ver el historial completo, ejecuta <code className="bg-blue-100 px-1 rounded">git log</code> en la terminal.
                            </p>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="h-full flex gap-6">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 rounded-xl p-4 flex-shrink-0">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen size={20} className="text-blue-600" />
                        Documentación
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Referencia Técnica</p>
                </div>

                <nav className="space-y-1">
                    {sections.map(section => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;

                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon size={16} />
                                {section.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default DocumentationView;
