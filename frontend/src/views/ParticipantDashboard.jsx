import React from 'react';
import { Video, Play, FileQuestion, Clock, MessageSquare, Send, Award, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';

const ParticipantDashboard = ({ user }) => {
    const handleDownloadCertificate = () => {
        const element = document.getElementById('certificate-template');
        const opt = {
            margin: 0,
            filename: `Certificado_SIMR2026_${user.name}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const { data: attendees } = useApi(api.attendees.getAll);

    // Find current user in attendees list to get real certification status
    const currentAttendee = attendees?.find(a => a.name === user.name);

    const userCertification = currentAttendee ? {
        grade: currentAttendee.grade || 0,
        approved: currentAttendee.certificationApproved || false,
        credits: 3.5 // This could be dynamic based on role/type
    } : {
        grade: 0,
        approved: false,
        credits: 0
    };
    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-bold text-gray-900">Sala Virtual - En Vivo</h2><p className="text-gray-600">Bienvenido, disfruta de las ponencias en tiempo real.</p></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span><span className="text-red-600 font-bold text-sm tracking-wide">EN VIVO</span></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative group">
                        <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><Video size={64} className="text-gray-500 mx-auto mb-4 opacity-50" /><p className="text-gray-400 font-medium">Esperando transmisión...</p></div></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"><div className="flex items-center gap-4 text-white"><Play size={24} className="fill-white" /><div className="h-1 bg-white/30 flex-grow rounded-full overflow-hidden"><div className="h-full w-2/3 bg-red-600"></div></div><span className="text-xs">Live</span></div></div>
                    </div>
                    <div className="flex justify-end gap-4">
                        {userCertification.approved && (
                            <Button onClick={handleDownloadCertificate} className="bg-blue-700 hover:bg-blue-800 text-white shadow-lg px-6 py-3 text-lg font-bold flex items-center gap-2">
                                <Download size={20} /> Descargar Certificado
                            </Button>
                        )}
                        <Button className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg px-8 py-3 text-lg font-bold animate-pulse">
                            <FileQuestion size={24} /> Ir al Examen Final
                        </Button>
                    </div>

                    {/* Hidden Certificate Template */}
                    <div id="certificate-template" className="hidden">
                        <div className="w-[1100px] h-[850px] bg-white p-20 text-center border-[20px] border-blue-900 relative">
                            <div className="absolute top-10 left-10 w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-xs">Logo CMP</div>
                            <div className="absolute top-10 right-10 w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-xs">Logo SIMR</div>

                            <h1 className="text-5xl font-serif font-bold text-blue-900 mt-20 mb-8">CERTIFICADO</h1>
                            <p className="text-2xl text-gray-600 mb-4">Otorgado a:</p>
                            <h2 className="text-4xl font-bold text-gray-900 mb-8 border-b-2 border-gray-300 inline-block pb-2 px-10">{user.name}</h2>
                            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
                                Por haber aprobado satisfactoriamente el <strong>Simposio Internacional de Medicina y Residencia 2026</strong>,
                                realizado del 22 al 24 de Octubre de 2026, obteniendo una calificación de <strong>{userCertification.grade}</strong>.
                            </p>
                            <div className="flex justify-center gap-12 mt-12">
                                <div className="text-center">
                                    <div className="w-48 h-0.5 bg-gray-900 mb-2"></div>
                                    <p className="font-bold text-gray-800">Dr. Presidente</p>
                                    <p className="text-sm text-gray-600">Presidente SIMR 2026</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-48 h-0.5 bg-gray-900 mb-2"></div>
                                    <p className="font-bold text-gray-800">Dr. Decano</p>
                                    <p className="text-sm text-gray-600">Decano CMP</p>
                                </div>
                            </div>
                            <div className="absolute bottom-10 right-10 text-gray-500 text-sm">
                                Créditos Académicos: {userCertification.credits}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <Card className="h-full flex flex-col">
                        <div className="border-b border-gray-100 pb-4 mb-4"><h3 className="font-bold text-gray-900 flex items-center gap-2"><Clock size={18} className="text-blue-700" /> A continuación</h3></div>
                        <div className="space-y-4 flex-grow overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg"><span className="text-xs font-bold text-blue-700 mb-1 block">Ahora (09:00 - 10:00)</span><h4 className="text-sm font-bold text-gray-900">Manejo Actual del ACV Isquémico</h4><p className="text-xs text-gray-700 mt-1">Dr. Juan Pérez</p></div>
                            <div className="p-3 bg-white border border-gray-100 rounded-lg opacity-60"><span className="text-xs font-bold text-gray-600 mb-1 block">10:00 - 11:00</span><h4 className="text-sm font-bold text-gray-800">Epilepsia Refractaria</h4><p className="text-xs text-gray-600 mt-1">Dra. Maria Lopez</p></div>
                            <div className="p-3 bg-white border border-gray-100 rounded-lg opacity-60"><span className="text-xs font-bold text-gray-600 mb-1 block">11:00 - 11:30</span><h4 className="text-sm font-bold text-gray-800">Coffee Break</h4></div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100"><h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><MessageSquare size={18} className="text-blue-700" /> Chat en vivo</h3><div className="bg-gray-50 rounded-lg p-3 h-40 overflow-y-auto mb-3 text-xs space-y-2 border border-gray-200"><p><span className="font-bold text-gray-800">Dr. Ruiz:</span> ¿Excelente ponencia, saludos desde Arequipa!</p><p><span className="font-bold text-gray-800">Dra. Silva:</span> ¿Podrían compartir las diapositivas?</p></div><div className="flex gap-2"><input type="text" placeholder="Escribe algo..." className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500 text-gray-800" /><button className="bg-blue-700 text-white p-2 rounded hover:bg-blue-800"><Send size={14} /></button></div></div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ParticipantDashboard;
