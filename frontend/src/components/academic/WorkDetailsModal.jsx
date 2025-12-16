import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    X, User, Calendar, FileText, Printer, CheckCircle,
    Download, Clock, BookOpen, Award, Users, AlertTriangle
} from 'lucide-react';
import { Button, Badge } from '../ui';
import QRCode from 'react-qr-code';
import { useApi } from '../../hooks';
import { api } from '../../services/api';

const WorkDetailsModal = ({ isOpen, onClose, work }) => {
    const printRef = useRef();

    // Fetch Jurors directly here to match IDs if needed, although we might just use the passed work data if it's enriched
    // For now we assume 'work' object has minimal jury info, or we resolve it.
    // In AcademicDashboard, 'works' items might have jury IDs.
    const { data: allJurors } = useApi(api.jurors.getAll);

    if (!isOpen || !work) return null;

    const handlePrint = () => {
        window.print();
    };

    // Derived Data
    const isApproved = work.status === 'Aceptado';
    const hasSlides = !!work.slidesUrl;

    // Resolve Jurors
    let assignedJurors = [];
    if (work.jury) {
        let juryIds = Array.isArray(work.jury) ? work.jury : [work.jury];
        assignedJurors = juryIds.map(id => {
            // Try to find in allJurors list, otherwise use the ID/Name itself if it's legacy string
            const found = allJurors?.find(j => j.id === id);
            return found || { name: typeof id === 'string' ? id : 'Usuario Eliminado', specialty: '-' };
        });
    }

    const formattedDate = work.submittedAt ? new Date(work.submittedAt).toLocaleDateString() : '-';
    const formattedModDate = work.updatedAt ? new Date(work.updatedAt).toLocaleDateString() : '-';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:block print:relative print:inset-auto print:h-auto">
            {/* Screen Version Container (Hidden on Print) */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-fadeInUp print:hidden">
                {/* Screen Header */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 p-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <BookOpen size={20} className="text-blue-600" />
                            Detalles del Trabajo
                        </h2>
                        <p className="text-sm text-gray-500 font-mono">CÓDIGO: {work.id}</p>
                    </div>
                    <div className="flex gap-2">
                        {hasSlides && (
                            <Button variant="outline" onClick={() => window.open(work.slidesUrl, '_blank')} className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                                <Download size={18} /> PPT
                            </Button>
                        )}
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
                        {/* Left: General Info */}
                        <div className="flex-grow space-y-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{work.title}</h1>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge variant={isApproved ? "green" : "yellow"} className="text-sm py-1 px-3">
                                        {work.status}
                                    </Badge>
                                    <Badge variant="blue" className="text-sm py-1 px-3">
                                        {work.type}
                                    </Badge>
                                    <Badge variant="purple" className="text-sm py-1 px-3">
                                        {work.specialty}
                                    </Badge>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoItem icon={User} label="Autor Principal" value={work.author} />
                                <InfoItem icon={Calendar} label="Fecha de Envío" value={formattedDate} />
                                <InfoItem icon={Clock} label="Última Modificación" value={formattedModDate} />
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg text-gray-500 border border-gray-200">
                                        {work.day ? <Calendar size={16} className="text-blue-600" /> : <AlertTriangle size={16} className="text-yellow-500" />}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Programación</p>
                                        <p className="text-gray-900 font-medium">
                                            {work.day ? `${work.day} - ${work.time}` : 'Pendiente'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: QR */}
                        <div className="flex flex-col gap-4 items-center flex-shrink-0">
                            <div className="bg-white p-3 rounded-xl border-2 border-dashed border-gray-200 shadow-sm">
                                <QRCode value={JSON.stringify({ id: work.id, title: work.title, author: work.author })} size={120} level="M" />
                            </div>
                            <span className="text-xs text-gray-400 font-mono tracking-wider">{work.id}</span>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Jurors Section */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users size={20} className="text-purple-600" />
                            Jurados Asignados ({assignedJurors.length})
                        </h3>
                        {assignedJurors.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {assignedJurors.map((juror, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                            {juror.name ? juror.name.charAt(0) : '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{juror.name}</p>
                                            <p className="text-xs text-gray-500">{juror.specialty}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
                                No hay jurados asignados para este trabajo.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PRINT PORTAL */}
            {createPortal(
                <div className="print-portal-root hidden print:block absolute top-0 left-0 w-full bg-white z-[9999]">
                    <div ref={printRef} className="w-full h-full p-8 text-black text-sm">
                        {/* Print Header */}
                        <div className="flex justify-between items-center border-b-2 border-gray-800 pb-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-black uppercase tracking-tight">Ficha de Trabajo</h1>
                                <p className="text-sm text-gray-600">Investigación - SIMR 2026</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Fecha de Impresión</p>
                                <p className="text-sm font-bold text-black">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Print Main Info */}
                        <div className="flex items-start gap-6 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex-grow">
                                <h2 className="text-2xl font-bold text-black leading-tight mb-2">{work.title}</h2>
                                <div className="flex gap-2 mb-3">
                                    <span className="px-2 py-1 bg-white border border-gray-300 text-xs font-bold text-black rounded uppercase">{work.type}</span>
                                    <span className="px-2 py-1 bg-white border border-gray-300 text-xs font-bold text-black rounded uppercase">{work.specialty}</span>
                                    <span className="px-2 py-1 bg-white border border-gray-300 text-xs font-bold text-black rounded uppercase">{work.status}</span>
                                </div>
                                <p className="text-sm text-gray-700 mb-1"><strong>Autor:</strong> {work.author}</p>
                                <p className="text-xs text-gray-500 font-mono">ID: {work.id}</p>
                            </div>
                            <div className="bg-white p-2 border border-gray-200">
                                <QRCode value={JSON.stringify({ id: work.id })} size={80} />
                            </div>
                        </div>

                        {/* Print Details Grid */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="text-sm font-bold text-black uppercase border-b border-gray-300 pb-1 mb-3">Detalles de Envío</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-600">Fecha Envío:</span> <span className="font-semibold text-black">{formattedDate}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Última Mod.:</span> <span className="font-semibold text-black">{formattedModDate}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Material Visual:</span> <span className="font-semibold text-black">{hasSlides ? 'PPT Adjunto' : 'Pendiente'}</span></div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-black uppercase border-b border-gray-300 pb-1 mb-3">Programación</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-600">Fecha:</span> <span className="font-semibold text-black">{work.day || 'Por definir'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Hora:</span> <span className="font-semibold text-black">{work.time || '--:--'}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Print Jurors */}
                        <div>
                            <h3 className="text-sm font-bold text-black uppercase border-b border-gray-300 pb-1 mb-3">Jurados Asignados ({assignedJurors.length})</h3>
                            {assignedJurors.length > 0 ? (
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="py-2 font-medium text-gray-500">Nombre</th>
                                            <th className="py-2 font-medium text-gray-500">Especialidad</th>
                                            <th className="py-2 font-medium text-gray-500">Institución</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assignedJurors.map((j, i) => (
                                            <tr key={i} className="border-b border-gray-100 last:border-0">
                                                <td className="py-2 font-bold text-black">{j.name}</td>
                                                <td className="py-2 text-gray-700">{j.specialty}</td>
                                                <td className="py-2 text-gray-700">{j.institution || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-gray-500 italic text-sm">No hay jurados asignados.</p>
                            )}
                        </div>

                        {/* Print Footer */}
                        <div className="border-t-2 border-gray-200 pt-4 mt-auto fixed bottom-8 w-full left-0 px-8">
                            <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest">Documento generado automáticamente por Sistema de Gestión SIMR 2026</p>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Styles */}
            <style>{`
                @media print {
                    @page { margin: 1cm; size: auto; }
                    #root, #root > * { display: none !important; }
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

const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg text-gray-500 border border-gray-200">
            <Icon size={16} />
        </div>
        <div>
            <p className="text-xs text-gray-400 uppercase font-bold">{label}</p>
            <p className="text-gray-900 font-medium truncate max-w-[200px]">{value}</p>
        </div>
    </div>
);

export default WorkDetailsModal;
