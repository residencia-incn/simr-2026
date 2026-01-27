import React, { useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Phone, MapPin, Building, Calendar, Brain, Activity, Clock, Printer, CheckCircle, AlertCircle, FileText, Download, Copy, Check, Cake, CreditCard, Shield, GraduationCap, ClipboardList, MessageCircle, RefreshCcw } from 'lucide-react';
import { Button, Card, Badge } from '../ui';
import CustomQRCode from '../ui/CustomQRCode';
import { api } from '../../services/api';

const AttendeeDetailsModal = ({ isOpen, onClose, attendee }) => {
    const printRef = useRef();

    // Close on Escape key
    React.useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);


    const handlePrint = () => {
        window.print();
    };

    // State for resolved workshop names
    const [workshopNames, setWorkshopNames] = useState({});
    const [activeTab, setActiveTab] = useState('general');

    React.useEffect(() => {
        const loadPricing = async () => {
            try {
                const pricing = await api.treasury.getPricing();
                const map = {};

                // Map ticket types (modalities)
                if (pricing.ticketTypes) {
                    pricing.ticketTypes.forEach(t => map[t.id] = t.title);
                }

                // Map workshops
                if (pricing.workshops) {
                    pricing.workshops.forEach(w => map[w.id] = w.name);
                }
                setWorkshopNames(map);
            } catch (err) {
                console.error("Failed to load workshop names", err);
            }
        };
        loadPricing();
    }, []);

    // Derived State
    const attendancePercent = useMemo(() => {
        return parseInt(attendee?.attendancePercent || 0);
    }, [attendee?.attendancePercent]);

    const isApproved = attendancePercent >= 60;

    // Derived/Mock Data
    if (!isOpen || !attendee) return null;

    const fullName = `${attendee.lastName || ''} ${attendee.firstName || ''}`.trim() || attendee.name;
    // Map usage of purchasedItems if workshops is just IDs
    const rawWorkshops = attendee.workshops || attendee.purchasedItems || [];
    const workshops = rawWorkshops.map(id => workshopNames[id] || id);

    // Resolve Role Display (ignoring generic 'user' role)
    const rawRole = attendee.eventRole || (attendee.eventRoles && attendee.eventRoles[0]) || 'Asistente';
    const displayRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1);

    const badgeName = attendee.badgeName || fullName.split(' ').slice(0, 2).join(' '); // Default short name

    // Tab Content Component Helpers
    const renderGeneralTab = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Profile Photo & QR */}
                <div className="flex flex-col gap-4 items-center w-full md:w-auto flex-shrink-0">
                    <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-xl overflow-hidden relative">
                        {attendee.image ? (
                            <img src={attendee.image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600">
                                <User size={64} />
                            </div>
                        )}
                    </div>
                    <div className="bg-white p-3 rounded-xl border-2 border-dashed border-gray-200 shadow-sm">
                        <CustomQRCode value={JSON.stringify({ id: attendee.id, dni: attendee.dni, name: fullName })} size={120} level="H" />
                    </div>
                    <span className="text-xs text-gray-400 font-mono tracking-wider">{attendee.dni || 'NO DNI'}</span>
                </div>

                {/* Basic Info */}
                <div className="flex-grow space-y-4 w-full">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{fullName}</h1>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge variant={attendee.modality === 'Virtual' ? 'purple' : 'green'} className="text-sm py-1 px-3">
                                    {workshopNames[attendee.ticketType] || attendee.modality || attendee.participationModality || 'Presencial'}
                                </Badge>
                                <Badge variant="blue" className="text-sm py-1 px-3">
                                    {displayRole}
                                </Badge>
                                {attendee.isActive && <Badge variant="green" className="text-sm">Activo</Badge>}
                            </div>
                        </div>
                        {/* Emergency Actions */}
                        <div className="flex gap-2">
                            {attendee.phone && (
                                <a
                                    href={`https://wa.me/51${attendee.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                    title="WhatsApp Directo"
                                >
                                    <MessageCircle size={20} />
                                </a>
                            )}
                            <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Reenviar Credenciales">
                                <Mail size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <InfoItem icon={CreditCard} label="DNI" value={attendee.dni || '-'} />
                        <InfoItem icon={Cake} label="Fecha Nacimiento" value={attendee.birthDate ? attendee.birthDate.split('-').reverse().join('/') : '-'} />
                        <InfoItem icon={Mail} label="Email" value={attendee.email || '-'} copyable />
                        <InfoItem icon={Phone} label="Teléfono" value={attendee.phone || '-'} />
                        <InfoItem icon={Building} label="Institución" value={attendee.institution || '-'} />
                        <InfoItem icon={Calendar} label="Fecha Registro" value={attendee.registrationDate ? new Date(attendee.registrationDate).toLocaleDateString() : '-'} />
                    </div>
                </div>
            </div>

            {/* Badge Preview Section */}
            <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard size={20} className="text-indigo-600" /> Vista Previa de Credencial
                </h3>
                <div className="bg-gray-100 p-6 rounded-xl flex justify-center">
                    {/* Mock Badge Visual */}
                    <div className="w-[350px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col items-center pb-6">
                        <div className="w-full h-4 bg-indigo-600"></div>
                        <div className="w-full h-16 bg-gray-50 flex items-center justify-center border-b border-gray-100 mb-4">
                            <img src="/logo-simr.png" alt="SIMR 2026" className="h-20 object-contain mix-blend-multiply opacity-80 mt-[-10px]" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                            <span className="font-bold text-gray-400 text-lg uppercase tracking-widest hidden">SIMR 2026</span>
                        </div>
                        <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow mb-3 overflow-hidden">
                            {attendee.image ? <img src={attendee.image} className="w-full h-full object-cover" /> : <User size={48} className="text-gray-400 m-auto mt-4" />}
                        </div>
                        <h2 className="text-xl font-bold text-center px-4 leading-tight mb-1">{badgeName}</h2>
                        <p className="text-indigo-600 font-medium text-sm uppercase mb-4">{displayRole}</p>
                        <CustomQRCode value={`SIMR:${attendee.id}`} size={80} />
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><BriefcaseIcon /> Información Profesional</h3>
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-3">
                        <DetailRow label="Ocupación" value={attendee.occupation || '-'} />
                        <DetailRow label="Especialidad" value={attendee.specialty || '-'} />
                        <DetailRow label="CMP" value={attendee.cmp_number || attendee.cmp || '-'} />
                        <DetailRow label="RNE" value={attendee.rne_number || attendee.rne || '-'} />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAcademicTab = () => (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Workshops */}
                <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Brain size={20} className="text-purple-600" /> Talleres Inscritos
                    </h3>
                    <div className="space-y-3">
                        {workshops.map((workshop, idx) => (
                            <div key={idx} className="p-3 border border-gray-200 rounded-lg flex items-center gap-3 bg-white hover:shadow-md transition-shadow">
                                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-700">{workshop}</span>
                            </div>
                        ))}
                        {workshops.length === 0 && <p className="text-gray-500 text-sm italic p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">No registrado en talleres adicionales.</p>}
                    </div>
                </div>

                {/* Progress */}
                <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Activity size={20} className="text-blue-600" /> Progreso de Asistencia</h3>
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-700">Asistencia General</span>
                            <span className="font-bold text-blue-600">{attendancePercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                            <div className={`h-2.5 rounded-full ${isApproved ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${attendancePercent}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500">{isApproved ? 'El usuario cumple con el requisito de asistencia para certificación.' : 'El usuario aún no alcanza el mínimo requerido (60%).'}</p>
                    </div>
                </div>
            </div>

            {/* Submitted Abstracts */}
            <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-orange-600" /> Trabajos de Investigación
                </h3>
                {attendee.submittedAbstracts && attendee.submittedAbstracts.length > 0 ? (
                    <div className="space-y-2">
                        {attendee.submittedAbstracts.map((abs, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                                <span className="font-medium text-gray-800 text-sm">[{abs.id}] {abs.title}</span>
                                <Badge variant={abs.status === 'Aprobado' ? 'green' : 'yellow'} className="text-xs">{abs.status}</Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">No ha enviado trabajos de investigación.</p>
                    </div>
                )}
            </div>

            {/* Certificates */}
            <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <GraduationCap size={20} className="text-yellow-600" /> Certificados
                </h3>
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex justify-between items-center">
                    <div>
                        <p className="text-yellow-800 font-bold text-sm">Certificado de Asistencia</p>
                        <p className="text-yellow-600 text-xs">{isApproved ? 'Disponible para descarga' : 'Bloqueado por inasistencia'}</p>
                    </div>
                    <Button variant="outline" size="sm" disabled={!isApproved} className="bg-white border-yellow-200 text-yellow-700 hover:bg-yellow-100">
                        <Download size={14} className="mr-2" /> Previsualizar
                    </Button>
                </div>
            </div>
        </div>
    );

    const renderPermissionsTab = () => (
        <div className="space-y-6">
            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                    <Shield size={20} /> Seguridad
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-red-100">
                        <div>
                            <p className="font-medium text-gray-800 text-sm">Resetear Contraseña</p>
                            <p className="text-xs text-gray-500">Cambia la contraseña a un valor predeterminado (123456).</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                            <RefreshCcw size={14} className="mr-2" /> Resetear
                        </Button>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-red-100">
                        <div>
                            <p className="font-medium text-gray-800 text-sm">Permisos de Módulo</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                                {attendee.modules && attendee.modules.map(m => (
                                    <Badge key={m} variant="gray" className="text-[10px]">{m}</Badge>
                                ))}
                            </div>
                        </div>
                        <Button variant="outline" size="sm">
                            Gestionar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAuditTab = () => (
        <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                        <tr>
                            <th className="p-3">Fecha</th>
                            <th className="p-3">Acción</th>
                            <th className="p-3">Usuario Admin</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {attendee.auditLog && attendee.auditLog.length > 0 ? (
                            attendee.auditLog.map((log, idx) => (
                                <tr key={idx}>
                                    <td className="p-3 text-gray-500 font-mono text-xs">{log.date}</td>
                                    <td className="p-3 font-medium text-gray-900">{log.action}</td>
                                    <td className="p-3">
                                        <Badge variant="blue" className="text-xs">{log.adminUser}</Badge>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="p-6 text-center text-gray-400 italic">No hay registros de auditoría disponibles.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:block print:relative print:inset-auto print:h-auto">
            {/* Screen Version Container (Hidden on Print) */}
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeInUp print:hidden"
            >
                {/* Screen Header */}
                <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Detalle del {displayRole}</h2>
                        <p className="text-sm text-gray-500">ID: {attendee.id || 'N/A'}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrint} className="gap-2">
                            <Printer size={18} /> Imprimir Ficha
                        </Button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-200 px-6 bg-gray-50/50">
                    <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} label="Perfil General" icon={User} />
                    <TabButton active={activeTab === 'academic'} onClick={() => setActiveTab('academic')} label="Académico" icon={GraduationCap} />
                    <TabButton active={activeTab === 'permissions'} onClick={() => setActiveTab('permissions')} label="Permisos & Seguridad" icon={Shield} />
                    <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} label="Auditoría" icon={ClipboardList} />
                </div>

                {/* Content Area */}
                <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar bg-white">
                    {activeTab === 'general' && renderGeneralTab()}
                    {activeTab === 'academic' && renderAcademicTab()}
                    {activeTab === 'permissions' && renderPermissionsTab()}
                    {activeTab === 'audit' && renderAuditTab()}
                </div>
            </div>





            {/* PRINT PORTAL - Moved out of #root to ensure exclusive print layout */}
            {createPortal(
                <div className="print-portal-root hidden print:block absolute top-0 left-0 w-full bg-white z-[9999]">
                    <div ref={printRef} className="w-full h-full p-8 text-black text-sm">
                        {/* Print Header */}
                        <div className="flex justify-between items-center border-b-2 border-gray-800 pb-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-black uppercase tracking-tight">Ficha de Asistente</h1>
                                <p className="text-sm text-gray-600">Sistema Integrado SIMR 2026</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Fecha de Impresión</p>
                                <p className="text-sm font-bold text-black">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Print Profile Strip */}
                        <div className="flex items-start gap-6 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            {/* Avatar */}
                            <div className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden border border-gray-300 flex-shrink-0">
                                {attendee.image ?
                                    <img src={attendee.image} className="w-full h-full object-cover" alt="" /> :
                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={40} /></div>
                                }
                            </div>

                            {/* Main Info */}
                            <div className="flex-grow pt-1">
                                <h2 className="text-3xl font-bold text-black leading-tight mb-2">{fullName}</h2>
                                <div className="flex gap-2 mb-3">
                                    <span className="px-2 py-1 bg-blue-100 border border-blue-300 text-xs font-bold text-blue-800 rounded uppercase">{displayRole}</span>
                                    <span className="px-2 py-1 bg-green-100 border border-green-300 text-xs font-bold text-green-800 rounded uppercase">{workshopNames[attendee.ticketType] || attendee.modality || 'Presencial'}</span>
                                </div>
                                <p className="text-xs text-gray-500 font-mono">ID: {attendee.id || 'N/A'} | DNI: {attendee.dni || 'NO DNI'}</p>
                            </div>

                            {/* QR Code */}
                            <div className="bg-white p-2 border border-gray-200">
                                <CustomQRCode value={JSON.stringify({ id: attendee.id, dni: attendee.dni, name: fullName })} size={80} level="H" />
                            </div>
                        </div>

                        {/* Print Data Grid - Compact 2 Columns */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            {/* Left: Personal */}
                            <div>
                                <h3 className="text-sm font-bold text-black uppercase border-b border-gray-300 pb-1 mb-3">Información Personal</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-600">DNI:</span> <span className="font-semibold text-black">{attendee.dni || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Fecha Nac.:</span> <span className="font-semibold text-black">{attendee.birthDate ? attendee.birthDate.split('-').reverse().join('/') : '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Email:</span> <span className="font-semibold text-black truncate max-w-[150px]">{attendee.email || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Teléfono:</span> <span className="font-semibold text-black">{attendee.phone || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Institución:</span> <span className="font-semibold text-black text-right">{attendee.institution || '-'}</span></div>
                                </div>
                            </div>

                            {/* Right: Professional */}
                            <div>
                                <h3 className="text-sm font-bold text-black uppercase border-b border-gray-300 pb-1 mb-3">Información Profesional</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-600">Ocupación:</span> <span className="font-semibold text-black">{attendee.occupation || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Especialidad:</span> <span className="font-semibold text-black">{attendee.specialty || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">CMP:</span> <span className="font-semibold text-black">{attendee.cmp_number || attendee.cmp || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">RNE:</span> <span className="font-semibold text-black">{attendee.rne_number || attendee.rne || '-'}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Print Bottom: Workshops & Attendance */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            {/* Workshops */}
                            <div>
                                <h3 className="text-sm font-bold text-black uppercase border-b border-gray-300 pb-1 mb-3">Talleres ({workshops.length})</h3>
                                <ul className="space-y-1">
                                    {workshops.map((w, i) => (
                                        <li key={i} className="text-sm text-black flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-black rounded-full"></span> {w}
                                        </li>
                                    ))}
                                    {workshops.length === 0 && <li className="text-sm text-gray-500 italic">Ninguno</li>}
                                </ul>
                            </div>

                            {/* Attendance */}
                            <div>
                                <h3 className="text-sm font-bold text-black uppercase border-b border-gray-300 pb-1 mb-3">Asistencia ({attendancePercent}%)</h3>
                                <div className="w-full bg-gray-200 h-4 border border-gray-400 rounded-sm mb-2">
                                    <div className="bg-gray-800 h-full" style={{ width: `${attendancePercent}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-600 text-justify">
                                    El presente documento certifica el estado de registro y asistencia del participante en el marco del SIMR 2026.
                                </p>
                            </div>
                        </div>

                        {/* Print Footer */}
                        <div className="border-t-2 border-gray-200 pt-4 mt-auto">
                            <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest">Documento generado automáticamente por Sistema de Gestión SIMR</p>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Global Print Styles Injection */}
            <style>{`
                @media print {
                    @page { margin: 1cm; size: auto; }
                    /* HIDE EVERYTHING IN ROOT */
                    #root, #root > * {
                        display: none !important;
                    }
                    /* SHOW PORTAL */
                    .print-portal-root {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100vw;
                        height: 100vh;
                        margin: 0;
                        padding: 0;
                        background: white;
                        visibility: visible !important;
                    }
                   .print-portal-root * {
                        visibility: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
};

// Helper Components
const TabButton = ({ active, onClick, label, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${active
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
    >
        <Icon size={18} />
        {label}
    </button>
);

const InfoItem = ({ icon: Icon, label, value, copyable }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value || value === '-') return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-500 print:bg-white print:border print:border-gray-200">
                <Icon size={16} />
            </div>
            <div className="flex-grow">
                <p className="text-xs text-gray-400 uppercase font-bold">{label}</p>
                <div className="flex items-center gap-2">
                    <p className="text-gray-900 font-medium truncate max-w-[200px]" title={value}>{value}</p>
                    {copyable && value && value !== '-' && (
                        <button
                            onClick={handleCopy}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Copiar correo"
                        >
                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ label, value }) => (
    <div className="flex justify-between border-b border-gray-100 last:border-0 pb-2 last:pb-0">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="text-gray-900 font-bold">{value}</span>
    </div>
);

const BriefcaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
);

export default AttendeeDetailsModal;
