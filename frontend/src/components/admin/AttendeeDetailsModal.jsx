import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Phone, MapPin, Building, Calendar, Brain, Activity, Clock, Printer, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react';
import { Button, Card, Badge } from '../ui';
import QRCode from 'react-qr-code';

const AttendeeDetailsModal = ({ isOpen, onClose, attendee }) => {
    const printRef = useRef();

    if (!isOpen || !attendee) return null;

    const handlePrint = () => {
        window.print();
    };

    // Derived/Mock Data
    const fullName = `${attendee.lastName || ''} ${attendee.firstName || ''}`.trim() || attendee.name;
    const workshops = attendee.workshops || ['Taller de Neuroimagen', 'Taller de Ética']; // Mock if empty
    const attendancePercent = parseInt(attendee.attendancePercent || Math.floor(Math.random() * 40) + 60); // Mock
    const isApproved = attendancePercent >= 60;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:block print:relative print:inset-auto print:h-auto">
            {/* Screen Version Container (Hidden on Print) */}
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto animate-fadeInUp print:hidden"
            >
                {/* Screen Header */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 p-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Detalles del Asistente</h2>
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

                {/* Screen Content */}
                <div className="p-8 space-y-8">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row gap-8 items-start">
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
                                <QRCode value={JSON.stringify({ id: attendee.id, dni: attendee.dni, name: fullName })} size={120} level="M" />
                            </div>
                            <span className="text-xs text-gray-400 font-mono tracking-wider">{attendee.dni || 'NO DNI'}</span>
                        </div>

                        <div className="flex-grow space-y-4 w-full">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{fullName}</h1>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge variant="blue" className="text-sm py-1 px-3">{attendee.role || 'Participante'}</Badge>
                                    <Badge variant={attendee.modality === 'Virtual' ? 'purple' : 'green'} className="text-sm py-1 px-3">{attendee.modality || 'Presencial'}</Badge>
                                    <Badge variant={isApproved ? 'green' : 'gray'} className="text-sm py-1 px-3">{isApproved ? 'Aprobado' : 'En Curso'}</Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <InfoItem icon={Mail} label="Email" value={attendee.email || '-'} />
                                <InfoItem icon={Phone} label="Teléfono" value={attendee.phone || '-'} />
                                <InfoItem icon={Building} label="Institución" value={attendee.institution || '-'} />
                                <InfoItem icon={Calendar} label="Fecha Registro" value={attendee.date || '-'} />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><BriefcaseIcon /> Información Profesional</h3>
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-3">
                                <DetailRow label="Ocupación" value={attendee.occupation || '-'} />
                                <DetailRow label="Especialidad" value={attendee.specialty || '-'} />
                                <DetailRow label="CMP" value={attendee.cmp || '-'} />
                                <DetailRow label="RNE" value={attendee.rne || '-'} />
                            </div>
                        </div>
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

                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Brain size={20} className="text-purple-600" /> Talleres Inscritos</h3>
                        <div className="grid md:grid-cols-2 gap-3">
                            {workshops.map((workshop, idx) => (
                                <div key={idx} className="p-3 border border-gray-200 rounded-lg flex items-center gap-3 bg-white">
                                    <CheckCircle size={16} className="text-green-500" />
                                    <span className="text-sm font-medium text-gray-700">{workshop}</span>
                                </div>
                            ))}
                            {workshops.length === 0 && <p className="text-gray-500 text-sm italic col-span-2">No registrado en talleres adicionales.</p>}
                        </div>
                    </div>
                </div>
            </div>



            // ... (component code) ...

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
                                    <span className="px-2 py-1 bg-gray-100 border border-gray-300 text-xs font-bold text-black rounded uppercase">{attendee.role || 'Participante'}</span>
                                    <span className="px-2 py-1 bg-gray-100 border border-gray-300 text-xs font-bold text-black rounded uppercase">{attendee.modality || 'Presencial'}</span>
                                    <span className="px-2 py-1 bg-gray-100 border border-gray-300 text-xs font-bold text-black rounded uppercase">{isApproved ? 'Aprobado' : 'En Curso'}</span>
                                </div>
                                <p className="text-xs text-gray-500 font-mono">ID: {attendee.id || 'N/A'} | DNI: {attendee.dni || 'NO DNI'}</p>
                            </div>

                            {/* QR Code */}
                            <div className="bg-white p-2 border border-gray-200">
                                <QRCode value={JSON.stringify({ id: attendee.id, dni: attendee.dni, name: fullName })} size={80} />
                            </div>
                        </div>

                        {/* Print Data Grid - Compact 2 Columns */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            {/* Left: Personal */}
                            <div>
                                <h3 className="text-sm font-bold text-black uppercase border-b border-gray-300 pb-1 mb-3">Información Personal</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-600">DNI:</span> <span className="font-semibold text-black">{attendee.dni || '-'}</span></div>
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
                                    <div className="flex justify-between"><span className="text-gray-600">CMP:</span> <span className="font-semibold text-black">{attendee.cmp || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">RNE:</span> <span className="font-semibold text-black">{attendee.rne || '-'}</span></div>
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
const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-50 rounded-lg text-gray-500 print:bg-white print:border print:border-gray-200">
            <Icon size={16} />
        </div>
        <div>
            <p className="text-xs text-gray-400 uppercase font-bold">{label}</p>
            <p className="text-gray-900 font-medium truncate max-w-[200px]">{value}</p>
        </div>
    </div>
);

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
