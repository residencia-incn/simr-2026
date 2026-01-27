import React, { useRef, useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X, User, Calendar, FileText, Printer, CheckCircle,
    Download, Clock, BookOpen, Award, Users, AlertTriangle,
    QrCode, CreditCard, Building2, Check, Copy
} from 'lucide-react';
import { Button, Badge, CustomQRCode } from '../ui';
import { useApi } from '../../hooks';
import { api } from '../../services/api';


const WorkDetailsModal = ({ isOpen, onClose, work }) => {
    const printRef = useRef();
    const [printType, setPrintType] = useState('work'); // 'work' | 'evaluation'
    const [scheduleConfig, setScheduleConfig] = useState({ days: [], blocks: [], locations: [] });

    // Fetch Jurors & Rubrics
    const { data: allJurors } = useApi(api.jurors.getAll);

    // Fetch Rubrics & Evaluations for this work
    const { data: rubrics, execute: fetchRubrics } = useApi(
        () => work ? api.academic.getRubrics(work.type) : Promise.resolve([]),
        false
    );

    // Fetch Program Config for Schedule Details
    useEffect(() => {
        if (isOpen) {
            api.program.getConfig().then(setScheduleConfig).catch(console.error);
        }
    }, [isOpen]);


    // Derived Data & Juror Resolution
    const assignedJurors = useMemo(() => {
        if (!work || !work.jury) return [];
        let juryIds = Array.isArray(work.jury) ? work.jury : [work.jury];
        return juryIds.map(id => {
            const found = allJurors?.find(j => j.id === id);
            return found || { id, name: typeof id === 'string' ? id : 'Jurado Desconocido', email: 'No registrado' };
        });
    }, [work, allJurors]);

    // Resolve Schedule Details
    const scheduleDetails = useMemo(() => {
        if (!work || !scheduleConfig.blocks.length) return null;

        // Handle Date (avoid TZ issues by appending time if just YYYY-MM-DD)
        const day = work.day ? new Date(work.day + (work.day.includes('T') ? '' : 'T00:00:00')) : null;
        const dayLabel = day ? day.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'No asignado';

        const block = scheduleConfig.blocks.find(b => b.id === work.block_id);
        const location = scheduleConfig.locations.find(l => l.id === work.location_id) || { name: work.room || 'No asignado' };

        return {
            date: dayLabel,
            time: block ? `${block.startTime.substring(0, 5)} - ${block.endTime.substring(0, 5)}` : 'No asignado',
            location: location.name
        };
    }, [work, scheduleConfig]);

    // Mock evaluations if not present (or use real ones)
    const evaluations = useMemo(() => {
        return work?.evaluations || [];
    }, [work]);

    // Fetch data on open
    useEffect(() => {
        if (isOpen && work?.type) {
            fetchRubrics();
        }
    }, [isOpen, work, fetchRubrics]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);


    if (!isOpen || !work) return null;

    const handlePrint = (type) => {
        setPrintType(type);
        // Small delay to ensure render
        setTimeout(() => {
            window.print();
        }, 100);
    };

    // Validar rúbrica para evitar errores
    const activeRubric = rubrics || [];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* === HEADER: DARK STYLE === */}
                <div className="bg-slate-900 text-white p-6 flex justify-between items-start shrink-0">
                    <div className="flex gap-4 overflow-hidden">
                        <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400 border-2 border-indigo-500/30 shrink-0">
                            <FileText size={32} />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300 font-mono tracking-wider">
                                    {work.code || work.id || 'S/C'}
                                </span>
                                {work.is_finalist && (
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500 text-black font-bold flex items-center gap-1">
                                        <Award size={10} /> FINALISTA
                                    </span>
                                )}
                            </div>

                            <h2 className="text-xl md:text-2xl font-bold leading-tight truncate-2-lines mb-2" title={work.title}>
                                {work.title}
                            </h2>

                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <User size={14} /> {work.author || work.main_author}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle size={14} /> {work.specialty}
                                </span>
                                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide
                                    ${work.status === 'ACEPTADO' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                        work.status === 'RECHAZADO' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                    {work.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg shrink-0"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* === BODY === */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar space-y-6">

                    {/* TOP ACTIONS BAR */}
                    <div className="flex flex-wrap gap-3 mb-2">
                        <button
                            onClick={() => handlePrint('work')}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all"
                        >
                            <Printer size={16} /> Imprimir Ficha
                        </button>
                        <button
                            onClick={() => handlePrint('evaluation')}
                            className="flex items-center gap-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all"
                        >
                            <FileText size={16} /> Ficha de Evaluación
                        </button>

                        {work.slidesUrl && (
                            <a href={work.slidesUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all">
                                <Download size={16} /> Descargar PPT
                            </a>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* LEFT COLUMN: DETAILS */}
                        <div className="lg:col-span-2 space-y-6">

                            <InfoCard title="Detalles del Trabajo">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    <InfoItem icon={User} label="Autor Principal" value={work.author || work.main_author} />
                                    <InfoItem icon={CreditCard} label="DNI Autor" value={work.author_dni || '-'} />

                                    <div className="md:col-span-2">
                                        <InfoItem icon={Building2} label="Sede / Institución" value={work.institution || '-'} />
                                    </div>

                                    <div className="md:col-span-2">
                                        <p className="text-xs text-slate-400 uppercase font-black tracking-widest mb-1">Co-Autores</p>
                                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                            {work.co_authors || 'No registrados'}
                                        </p>
                                    </div>
                                </div>
                            </InfoCard>

                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                    <Award size={20} className="text-blue-600" />
                                    Resultados de Evaluación ({evaluations.length})
                                </h3>

                                {evaluations.length > 0 ? (
                                    <div className="space-y-4">
                                        {evaluations.map((ev, i) => (
                                            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm relative overflow-hidden transition-shadow hover:shadow-md">
                                                {/* Decorative Background Element */}
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>

                                                {/* Header: Juror & Score */}
                                                <div className="flex justify-between items-start mb-6 relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                                                            {ev.jurorName ? ev.jurorName.charAt(0) : 'J'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-base">{ev.jurorName || 'Jurado Anónimo'}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-xs text-slate-500">Puntaje Otorgado:</span>
                                                                <span className="text-blue-700 font-black text-sm">{ev.score || ev.totalScore} pts</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {ev.date && (
                                                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                                            {new Date(ev.date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Breakdown Pills */}
                                                {ev.breakdown && (
                                                    <div className="flex flex-wrap gap-3 mb-5">
                                                        {Object.entries(ev.breakdown).map(([key, val]) => (
                                                            <div key={key} className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                                                                <span className="text-xs text-slate-600 font-medium">{key}</span>
                                                                <span className="flex items-center justify-center bg-blue-100 text-blue-700 text-xs font-black w-6 h-6 rounded-md">
                                                                    {val}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Comment Section */}
                                                {ev.comment && (
                                                    <div className="relative pl-4 border-l-4 border-blue-200">
                                                        <p className="text-sm text-slate-600 italic">"{ev.comment}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                                        <p>Aún no hay evaluaciones registradas.</p>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* RIGHT COLUMN: QR & METADATA */}
                        <div className="space-y-6">

                            <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 text-center">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-center gap-2">
                                    <QrCode size={18} className="text-slate-400" /> Control de Acceso
                                </h3>
                                <div className="bg-white p-3 border-2 border-slate-100 rounded-xl shadow-inner inline-block mx-auto mb-3">
                                    <CustomQRCode value={JSON.stringify({ id: work.id, code: work.code })} size={120} />
                                </div>
                                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{work.code || work.id}</p>
                            </div>

                            <InfoCard title="Jurados Asignados">
                                {assignedJurors.length > 0 ? (
                                    <div className="space-y-3">
                                        {assignedJurors.map((juror) => (
                                            <div key={juror.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
                                                    {juror.name ? juror.name[0] : 'J'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-700 truncate">{juror.name}</p>
                                                    <p className="text-xs text-slate-400 truncate">{juror.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">Pendiente de asignación</p>
                                )}
                            </InfoCard>

                        </div>
                    </div>
                </div>

                {/* === PORTAL DE IMPRESIÓN === */}
                {createPortal(
                    <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black print-portal-root" ref={printRef}>

                        {/* --- FICHA DE TRABAJO (INSCRIPCIÓN) --- */}
                        {printType === 'work' && (
                            <div className="max-w-[185mm] mx-auto min-h-full flex flex-col bg-white">
                                {/* Header */}
                                <div className="flex items-center gap-4 border-b-2 border-black pb-4 mb-8">
                                    <div className="w-24 h-24 shrink-0">
                                        <img src="/icono.svg" alt="SIMR Logo" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex-1 text-center">
                                        <h1 className="text-xl font-bold uppercase leading-tight tracking-wide">
                                            XXXI Semana de Investigación del Médico Residente 2026
                                        </h1>
                                        <h2 className="text-lg font-bold mt-2 tracking-wider border-t-2 border-black inline-block px-6 py-1">
                                            FICHA DEL TRABAJO
                                        </h2>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="border-2 border-black px-3 py-2 mb-2">
                                            <p className="text-[10px] font-bold uppercase">Código de Proyecto</p>
                                            <p className="text-2xl font-mono font-black leading-none">{work.code || work.id}</p>
                                        </div>
                                        <p className="text-xs font-bold">{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Body Content */}
                                <div className="flex-1 space-y-6">
                                    {/* Title Section */}
                                    <div className="border border-black p-4 bg-gray-50">
                                        <p className="text-xs font-bold uppercase text-gray-500 mb-1">Título del Trabajo</p>
                                        <p className="text-lg font-bold leading-tight text-justify">{work.title}</p>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="border-b border-black pb-1">
                                                <p className="text-[10px] font-bold uppercase text-gray-500">Autor Principal</p>
                                                <p className="font-medium text-sm">{work.author || work.main_author}</p>
                                            </div>
                                            <div className="border-b border-black pb-1">
                                                <p className="text-[10px] font-bold uppercase text-gray-500">DNI</p>
                                                <p className="font-medium text-sm">{work.author_dni || '-'}</p>
                                            </div>
                                            <div className="border-b border-black pb-1">
                                                <p className="text-[10px] font-bold uppercase text-gray-500">Especialidad</p>
                                                <p className="font-medium text-sm">{work.specialty}</p>
                                            </div>
                                            <div className="border-b border-black pb-1">
                                                <p className="text-[10px] font-bold uppercase text-gray-500">Estado Actual</p>
                                                <p className="font-medium text-sm uppercase">{work.status}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="border-b border-black pb-1">
                                                <p className="text-[10px] font-bold uppercase text-gray-500">Sede / Institución</p>
                                                <p className="font-medium text-sm">{work.institution || '-'}</p>
                                            </div>
                                            <div className="border-b border-black pb-1">
                                                <p className="text-[10px] font-bold uppercase text-gray-500">Tipo de Trabajo</p>
                                                <p className="font-medium text-sm">{work.type}</p>
                                            </div>

                                            {/* SCHEDULE DETAILS */}
                                            {scheduleDetails && scheduleDetails.time !== 'No asignado' && (
                                                <div className="border-2 border-blue-900 bg-blue-50 p-2 mt-2">
                                                    <p className="text-[10px] font-bold uppercase text-blue-800 mb-1">Programación / Ponencia</p>
                                                    <p className="text-xs font-bold">{scheduleDetails.date}</p>
                                                    <p className="text-lg font-black leading-none text-blue-900">{scheduleDetails.time}</p>
                                                    <p className="text-xs font-medium uppercase mt-1">{scheduleDetails.location}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Co-Authors */}
                                    <div className="border border-black p-4">
                                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">Co-Autores</p>
                                        <p className="text-sm italic text-gray-700 leading-relaxed">
                                            {work.co_authors || 'No se han registrado co-autores para este trabajo.'}
                                        </p>
                                    </div>

                                    {/* Assigned Jurors */}
                                    {assignedJurors.length > 0 && (
                                        <div className="border border-black p-4 bg-gray-50">
                                            <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">Jurados Asignados</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                {assignedJurors.map(j => (
                                                    <div key={j.id} className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-black"></div>
                                                        <span className="text-sm font-medium">{j.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* QR & Validation */}
                                    <div className="flex items-end justify-between mt-auto pt-8 border-t-2 border-black border-dashed">
                                        <div className="flex items-center gap-4">
                                            <div className="border border-black p-2 bg-white">
                                                <CustomQRCode value={JSON.stringify({ id: work.id, code: work.code, title: work.title })} size={100} />
                                            </div>
                                            <div className="text-xs text-gray-500 space-y-1">
                                                <p>Documento generado automáticamente</p>
                                                <p>Sistema de Gestión Académica SIMR 2026</p>
                                                <p className="font-mono">{work.id}</p>
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <div className="w-64 border-b border-black mb-2"></div>
                                            <p className="text-xs font-bold uppercase">Firma del Responsable / Autor</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- FICHA DE EVALUACIÓN (JURADOS) --- */}
                        {printType === 'evaluation' && (
                            <div className="max-w-[185mm] mx-auto">
                                {assignedJurors.length > 0 ? assignedJurors.map((juror, pageIdx) => (
                                    <div key={pageIdx} className="page-break-after-always relative min-h-[22cm] p-4 box-border flex flex-col pt-4">
                                        {/* Header */}
                                        <div className="flex items-center gap-4 border-b-2 border-black pb-4 mb-4">
                                            <div className="w-20 h-20 shrink-0">
                                                <img src="/icono.svg" alt="SIMR Logo" className="w-full h-full object-contain" />
                                            </div>

                                            <div className="flex-1 text-center">
                                                <h1 className="text-xl font-bold uppercase leading-tight tracking-wide">
                                                    XXXI Semana de Investigación del Médico Residente 2026
                                                </h1>
                                                <h2 className="text-lg font-bold mt-1 tracking-wider border-t border-black inline-block px-4">
                                                    FICHA DE EVALUACIÓN
                                                </h2>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className="border border-black px-2 py-1 mb-1">
                                                    <p className="text-[10px] font-bold uppercase">Código</p>
                                                    <p className="text-lg font-mono font-bold leading-none">{work.code || work.id}</p>
                                                </div>
                                                <p className="text-xs font-bold">{new Date().toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        {/* Work Info - Grid Layout for Density */}
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-4 border-b border-black pb-2">
                                            <div className="col-span-2">
                                                <p className="font-bold uppercase text-[10px] text-gray-500">Título del Trabajo</p>
                                                <p className="font-bold text-sm leading-tight">{work.title}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold uppercase text-[10px] text-gray-500">Autor Principal</p>
                                                <p className="font-medium truncate">{work.main_author || work.author}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold uppercase text-[10px] text-gray-500">Especialidad</p>
                                                <p className="font-medium truncate">{work.specialty}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold uppercase text-[10px] text-gray-500">Jurado Calificador</p>
                                                <p className="font-medium truncate">{juror.name}</p>
                                            </div>
                                        </div>

                                        {/* Rubric Table - Manual Scoring Format */}
                                        <div className="flex-1 mb-1">
                                            <table className="w-full border-collapse border border-black text-[10px]">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border border-black p-1 text-center w-[5%]">#</th>
                                                        <th className="border border-black p-1 text-left w-[25%]">Criterio (Rúbrica)</th>
                                                        <th className="border border-black p-1 text-left w-[60%]">Descripción</th>
                                                        <th className="border border-black p-1 text-center w-[10%]">Puntaje</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {activeRubric.length > 0 ? activeRubric.map((item, idx) => {
                                                        const maxPoints = item.max_points || item.max_score || 0;
                                                        return (
                                                            <tr key={idx}>
                                                                <td className="border border-black p-1 text-center font-bold">{idx + 1}</td>
                                                                <td className="border border-black p-1 font-bold align-top">
                                                                    {item.title || item.criterio}
                                                                    <span className="block text-[9px] font-normal text-gray-500 mt-1">(Max: {maxPoints})</span>
                                                                </td>
                                                                <td className="border border-black p-1 text-justify align-top leading-tight">
                                                                    {item.description || item.descripcion}
                                                                </td>
                                                                <td className="border border-black p-1 text-center align-middle h-8">

                                                                </td>
                                                            </tr>
                                                        );
                                                    }) : (
                                                        <tr><td colSpan="4" className="border border-black p-2 text-center italic">Cargando rúbrica...</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-auto pt-2 break-inside-avoid">
                                            <div className="flex justify-between items-end mb-1">
                                                <div className="w-[60%] border-t border-black pt-1 text-center">
                                                    <p className="font-bold uppercase text-xs">Firma del Jurado</p>
                                                    <p className="text-[10px]">{juror.name}</p>
                                                </div>
                                                <div className="border-2 border-black p-2 bg-gray-50 min-w-[100px]">
                                                    <p className="text-[10px] font-bold uppercase text-center mb-1">Puntaje Total</p>
                                                    <div className="text-xl font-black text-center">
                                                        ___ / {activeRubric.reduce((acc, curr) => acc + (curr.max_points || curr.max_score || 0), 0)}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-center text-[9px] text-gray-400 mt-2">
                                                SIMR 2026 - Control Académico
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-xl font-bold flex flex-col items-center justify-center h-full">
                                        <p>No se pueden generar fichas de evaluación.</p>
                                        <p className="text-sm font-normal mt-2">No hay jurados asignados a este trabajo.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <style>{`
                            @media print {
                                @page { margin: 1cm; size: auto; }
                                body { visibility: hidden; }
                                .print-portal-root {
                                    display: block !important;
                                    position: absolute;
                                    left: 0;
                                    top: 0;
                                    width: 100%;
                                    height: auto;
                                    min-height: 100vh;
                                    margin: 0;
                                    padding: 0;
                                    background: white;
                                    visibility: visible !important;
                                    z-index: 9999;
                                }
                                .print-portal-root * {
                                    visibility: visible !important;
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                }
                                .page-break-after-always {
                                    page-break-after: always;
                                }
                            }
                        `}</style>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const InfoCard = ({ title, children }) => (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
            {title}
        </h3>
        <div className="space-y-3">{children}</div>
    </div>
);

const InfoItem = ({ icon: Icon, label, value }) => {
    const [copied, setCopied] = React.useState(false);
    const handleCopy = () => {
        if (!value || value === '-') return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400 border border-slate-100 shrink-0">
                <Icon size={16} />
            </div>
            <div className="flex-grow min-w-0">
                <p className="text-xs text-slate-400 uppercase font-black tracking-widest leading-none mb-1">{label}</p>
                <div className="flex items-center gap-1.5">
                    <p className="text-slate-700 font-bold text-sm truncate" title={value}>{value || '-'}</p>
                    {value && value !== '-' && (
                        <button onClick={handleCopy} className="p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-indigo-500 transition-colors">
                            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkDetailsModal;
