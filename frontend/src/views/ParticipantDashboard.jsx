import React, { useState, useEffect } from 'react';
import { Video, Play, FileQuestion, MessageSquare, Send, Award, Download, ChevronLeft, ChevronDown, ChevronUp, FileText, Monitor, Lock, AlertTriangle, X } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import Button from '../components/ui/Button';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { INITIAL_PROGRAM } from '../data/mockData';

const ParticipantDashboard = ({ user, navigate }) => {
    // Session & Security State
    const [userIp, setUserIp] = useState('192.168.1.10'); // Simulated IP
    const [sessionStatus, setSessionStatus] = useState('active'); // active, duplicate

    // UI State
    const [activeTab, setActiveTab] = useState('modules'); // modules, notes, chat
    const [notes, setNotes] = useState(() => localStorage.getItem(`simr_notes_${user.id}`) || '');
    const [chatMessage, setChatMessage] = useState("");
    const [chatHistory, setChatHistory] = useState([
        { id: 1, user: 'Dr. Ruiz', text: '¡Excelente ponencia, saludos desde Arequipa!', time: '09:15' },
        { id: 2, user: 'Dra. Silva', text: '¿Podrían compartir las diapositivas?', time: '09:18' }
    ]);
    const [expandedModule, setExpandedModule] = useState(null);
    const [abstractModal, setAbstractModal] = useState({ isOpen: false, title: '', content: '' });

    // Initial Security Check
    useEffect(() => {
        // Simulate IP detection
        const mockIps = ['181.65.20.12', '200.48.29.15', '190.234.11.8'];
        setUserIp(mockIps[Math.floor(Math.random() * mockIps.length)]);

        // Simulate Session Enforcement
        const sessionId = Date.now().toString();
        const existingSession = localStorage.getItem(`simr_session_${user.id}`);

        // In a real app, this logic happens on the server via sockets or polling
        // Here we simulate checking if another "tab" updated the session recently (simple version)
        if (existingSession) {
            // For demo purposes, we'll overwrite it to allow refreshing, 
            // but in a strict demo we might show a warning if we could detect another active window.
            // Let's simplified: Set this as the active session.
            localStorage.setItem(`simr_session_${user.id}`, sessionId);
        } else {
            localStorage.setItem(`simr_session_${user.id}`, sessionId);
        }

    }, [user.id]);

    // Notes Persistence
    useEffect(() => {
        localStorage.setItem(`simr_notes_${user.id}`, notes);
    }, [notes, user.id]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatMessage.trim()) return;

        const newMsg = {
            id: Date.now(),
            user: user.name.split(" ")[0], // First name
            text: chatMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChatHistory(prev => [...prev, newMsg]);
        setChatMessage("");
    };

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
    const currentAttendee = attendees?.find(a => a.name === user.name);

    const userCertification = currentAttendee ? {
        grade: currentAttendee.grade || 0,
        approved: currentAttendee.certificationApproved || false,
        credits: 3.5
    } : { grade: 0, approved: false, credits: 0 };

    // Get current live module
    const liveModule = INITIAL_PROGRAM.find(m => m.status === 'live');


    // Renderers
    const renderModules = () => (
        <div className="space-y-2">
            {INITIAL_PROGRAM.map((module) => (
                <div key={module.id} className="border border-gray-700/50 rounded-lg overflow-hidden bg-gray-800/30">
                    <button
                        onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                        className={`w-full flex items-center justify-between p-3 text-left transition-colors ${module.status === 'live' ? 'bg-blue-900/20 border-l-2 border-blue-500' : 'hover:bg-gray-700/50'}`}
                    >
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-200 flex items-center gap-2">
                                {module.country && (
                                    <img
                                        src={`https://flagcdn.com/24x18/${module.country}.png`}
                                        alt={`Flag of ${module.country}`}
                                        className="h-3 w-auto object-contain rounded-sm"
                                    />
                                )}
                                {module.title}
                            </span>
                            <span className="text-xs text-gray-500">{module.time} • {module.speaker}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {module.status === 'live' && <span className="text-[10px] font-bold text-red-500 animate-pulse">EN VIVO</span>}
                            {expandedModule === module.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </div>
                    </button>

                    {expandedModule === module.id && (
                        <div className="p-3 bg-gray-900/50 text-xs text-gray-400 border-t border-gray-700/50">
                            <p>Detalles de la sesión: {module.speaker}</p>
                            <div className="mt-2 flex gap-4">
                                <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300"><Download size={12} /> Recursos</button>
                                {module.abstract && (
                                    <button
                                        onClick={() => setAbstractModal({ isOpen: true, title: module.title, content: module.abstract })}
                                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                                    >
                                        <FileText size={12} /> Ver Abstract
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    const renderChat = () => (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-700">
                {chatHistory.map((msg) => (
                    <div key={msg.id} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className={`text-xs font-bold ${msg.user === user.name.split(" ")[0] ? 'text-blue-400' : 'text-purple-400'}`}>{msg.user}</span>
                            <span className="text-[10px] text-gray-500">{msg.time}</span>
                        </div>
                        <p className="text-sm text-gray-300">{msg.text}</p>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 pt-3 border-t border-gray-700">
                <div className="relative">
                    <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Envía una pregunta..."
                        className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg pl-3 pr-10 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700"
                    />
                    <button type="submit" className="absolute right-2 top-2 p-1 text-blue-500 hover:text-blue-400">
                        <Send size={16} />
                    </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 text-center">Las preguntas serán leídas por el moderador.</p>
            </form>
        </div>
    );

    const renderNotes = () => (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-300">Mis Apuntes</h3>
                <span className="text-xs text-gray-500">{notes.length} caracteres</span>
            </div>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Toma nota de los puntos importantes aquí..."
                className="flex-1 w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-gray-300 text-sm focus:outline-none focus:border-blue-500 resize-none h-full"
            />
            <button className="mt-2 w-full py-2 bg-blue-900/30 text-blue-400 text-xs rounded hover:bg-blue-900/50 flex items-center justify-center gap-1">
                <Download size={12} /> Guardar / Descargar Apuntes
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-[#0f1115] text-white z-50 overflow-hidden flex flex-col" >
            {/* Header Simplified */}
            < div className="h-16 bg-[#1a1d24] border-b border-gray-800 flex items-center justify-between px-6 shrink-0" >
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate ? navigate('home') : window.location.reload()}
                        className="flex items-center gap-2 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                    >
                        <ChevronLeft size={16} /> Regresar al Inicio
                    </button>
                    <div className="h-6 w-px bg-gray-700 mx-2"></div>
                    <div>
                        <h1 className="font-bold text-lg leading-none flex items-center gap-2">
                            {liveModule?.country && (
                                <img
                                    src={`https://flagcdn.com/24x18/${liveModule.country}.png`}
                                    alt={`Flag of ${liveModule.country}`}
                                    className="h-4 w-auto object-contain rounded-sm"
                                />
                            )}
                            {liveModule?.title || 'Transmisión en Vivo'}
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">
                            {liveModule ? `${liveModule.speaker} • ${liveModule.time}` : 'Esperando inicio...'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Session Security Info */}
                    <div className="hidden lg:flex flex-col items-end">
                        <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30">
                            <Monitor size={10} />
                            <span>Conexión Segura</span>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-0.5 font-mono">IP: {userIp}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                </div>
            </div >

            {/* Main Layout */}
            < div className="flex flex-1 overflow-hidden" >

                {/* Left: Video Player Area */}
                < div className="flex-1 bg-black relative flex flex-col" >
                    <div className="flex-1 relative flex items-center justify-center bg-black/50">
                        {/* Simulated Video Player */}
                        <div className="w-full h-full max-h-[80vh] aspect-video bg-gray-900 relative group">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <Video size={48} className="text-gray-600 mx-auto mb-4 opacity-50" />
                                    <p className="text-gray-500">Transmisión en Vivo</p>
                                </div>
                            </div>

                            {/* Player Controls Mockup */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="h-1 bg-gray-700 rounded-full mb-4 cursor-pointer overflow-hidden">
                                    <div className="h-full w-[85%] bg-red-600 relative">
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full shadow"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-white">
                                    <div className="flex items-center gap-4">
                                        <Play size={24} className="fill-white" />
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                                            <span className="text-red-500 font-bold text-sm tracking-wide">EN VIVO</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-mono text-gray-400">00:45:12 / --:--:--</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="h-16 bg-[#1a1d24] border-t border-gray-800 flex items-center justify-between px-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    const liveModule = INITIAL_PROGRAM.find(m => m.status === 'live');
                                    if (liveModule?.abstract) {
                                        setAbstractModal({ isOpen: true, title: liveModule.title, content: liveModule.abstract });
                                    }
                                }}
                                className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
                            >
                                <FileText size={18} /> Ver Abstract
                            </button>
                            <button className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
                                <FileQuestion size={18} /> Requisitos de Certificación
                            </button>
                            <button onClick={() => handleDownloadCertificate()} disabled={!userCertification.approved} className={`text-gray-400 flex items-center gap-2 text-sm transition-colors ${userCertification.approved ? 'hover:text-green-400' : 'opacity-50 cursor-not-allowed'}`}>
                                <Award size={18} /> Mi Certificado
                            </button>
                        </div>
                        <div>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0 px-6 h-9 text-sm">
                                Ir al Examen Final
                            </Button>
                        </div>
                    </div>
                </div >

                {/* Right: Interactive Sidebar */}
                < div className="w-[350px] bg-[#1a1d24] border-l border-gray-800 flex flex-col shrink-0 transition-all" >
                    {/* Tabs */}
                    < div className="flex border-b border-gray-800" >
                        <button
                            onClick={() => setActiveTab('modules')}
                            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'modules' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
                        >
                            Módulos
                        </button>
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'chat' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
                        >
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('notes')}
                            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'notes' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
                        >
                            Apuntes
                        </button>
                    </div >

                    {/* Content */}
                    < div className="flex-1 overflow-y-auto p-4 custom-scrollbar" >
                        {activeTab === 'modules' && renderModules()}
                        {activeTab === 'chat' && renderChat()}
                        {activeTab === 'notes' && renderNotes()}
                    </div >
                </div >
            </div >

            {/* Hidden Certificate Template for PDF Generation */}
            < div id="certificate-template" className="hidden" >
                <div className="w-[1100px] h-[850px] bg-white p-20 text-center border-[20px] border-blue-900 relative text-black">
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
            </div >
            {/* Abstract Modal */}
            {
                abstractModal.isOpen && (
                    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
                        <div className="bg-[#1a1d24] border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
                                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                    <FileText size={20} className="text-blue-500" />
                                    Abstract de la Ponencia
                                </h3>
                                <button
                                    onClick={() => setAbstractModal({ ...abstractModal, isOpen: false })}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 max-h-[70vh] overflow-y-auto">
                                <h4 className="text-xl font-bold text-gray-200 mb-4">{abstractModal.title}</h4>
                                <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed whitespace-pre-line">
                                    {abstractModal.content}
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-700 bg-gray-800/30 flex justify-end">
                                <Button
                                    onClick={() => setAbstractModal({ ...abstractModal, isOpen: false })}
                                    className="bg-gray-700 hover:bg-gray-600 text-white"
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ParticipantDashboard;
