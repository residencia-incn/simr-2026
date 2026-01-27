import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../../hooks';
import Swal from 'sweetalert2';
import {
    X, FileText, CheckSquare, MessageSquare, AlertTriangle,
    CheckCircle, Shield, User, Calendar, BookOpen,
    ClipboardCheck, Activity, ChevronRight, Save,
    Tag, Download, Copy, Printer, Plus, Trash2
} from 'lucide-react';
import { Badge } from '../ui';
import { api } from '../../services/api';
import { showWarning, showError, confirm } from '../../utils/alerts';

const WorkReviewModal = ({ isOpen, onClose, work, onUpdate, readOnly = false }) => {
    const [activeTab, setActiveTab] = useState('review'); // review | content | history
    const [checklist, setChecklist] = useState({});
    const [feedback, setFeedback] = useState('');
    const [specificFeedback, setSpecificFeedback] = useState([]); // Array of { section: '', comment: '' }
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Draft persistence
    const [drafts, setDrafts] = useLocalStorage('research_review_drafts', {});

    // Load draft when work changes - prioritized logic
    useEffect(() => {
        if (work) {
            // Priority 1: Config from backend (the source of truth for structure)
            const configItems = work.checklist_config || [
                "Formato y Estructura Correcta",
                "Cumplimiento de Límite de Palabras",
                "Resguardo de Anonimato",
                "Bibliografía en Formato Vancouver"
            ];

            // Priority 2: Saved values (Draft > DB > Empty)
            const savedDraft = drafts[work.id];
            let sourceValues = {};

            if (savedDraft?.checklist) {
                sourceValues = savedDraft.checklist;
            } else if (work.checklist) {
                sourceValues = work.checklist;
            }

            // Merge logic: Create state based on CONFIG keys, looking up value in SOURCE
            const mergedChecklist = {};
            configItems.forEach(item => {
                // If the item exists in source, use its value. If not, false.
                // We do NOT include keys from source that are not in config (cleans up legacy keys like 'format')
                mergedChecklist[item] = !!sourceValues[item];

                // FALLBACK for legacy mapping (optional but helpful for transition):
                // If no exact match and we have old keys, maybe map? 
                // For now, let's keep it clean. Old keys will just appear unchecked if names don't match.
            });

            setChecklist(mergedChecklist);


            if (savedDraft?.feedback) setFeedback(savedDraft.feedback);
            else setFeedback('');

            if (savedDraft?.specificFeedback) setSpecificFeedback(savedDraft.specificFeedback);
            else setSpecificFeedback([]);
        }
    }, [work, isOpen]);

    // Save draft
    useEffect(() => {
        if (work && isOpen && !readOnly) {
            setDrafts(prev => ({
                ...prev,
                [work.id]: { checklist, feedback, specificFeedback }
            }));
        }
    }, [checklist, feedback, specificFeedback, work, isOpen, readOnly]);

    if (!isOpen || !work) return null;

    const handleCheck = (key) => {
        if (readOnly) return;
        setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const configItems = work.checklist_config || Object.keys(checklist);
    const allChecked = configItems.length > 0 && configItems.every(item => checklist[item]);

    const handleSubmit = async (status) => {
        if (status === 'ACEPTADO' && !allChecked) {
            showWarning("Debe validar todos los puntos del checklist antes de aprobar.");
            return;
        }

        const actionText = status === 'ACEPTADO' ? 'Dar el Visto Bueno' : 'Solicitar Correcciones';
        const isConfirmed = await confirm(
            `¿Está seguro de ${actionText.toLowerCase()} a este trabajo?`,
            "Confirmar Acción"
        );

        if (!isConfirmed) return;

        setIsSubmitting(true);
        try {
            await api.research.updateStatus(work.id, {
                status,
                feedback: status === 'OBSERVADO' ? feedback : (feedback || null),
                specific_feedback: status === 'OBSERVADO' ? specificFeedback : [],
                checklist: checklist
            });

            // Clear draft
            setDrafts(prev => {
                const newDrafts = { ...prev };
                delete newDrafts[work.id];
                return newDrafts;
            });

            // Success Alert
            await Swal.fire({
                title: '¡Acción Completada!',
                text: status === 'OBSERVADO'
                    ? 'Las correcciones han sido enviadas al autor correctamente.'
                    : 'El trabajo ha recibido el Visto Bueno.',
                icon: 'success',
                confirmButtonText: 'Volver a la Lista',
                confirmButtonColor: '#4f46e5'
            });

            onUpdate();
            onClose();
        } catch (error) {
            console.error("Error updating work:", error);
            showError("No se pudo actualizar el estado del trabajo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formattedDate = work.submitted_at ? new Date(work.submitted_at).toLocaleDateString() : '--/--/----';

    const getFileUrl = (url) => {
        if (!url) return '';

        // Handle legacy mock domain
        if (url.includes('mock.simr.pe')) {
            return url.replace(/https?:\/\/mock\.simr\.pe\/uploads\//, 'http://localhost:8000/archivo/');
        }

        if (url.startsWith('http')) return url;
        // Prefix with backend URL for local files
        return `http://localhost:8000${url.startsWith('/') ? '' : '/'}${url}`;
    };

    // Helper to render feedback text nicely (Ported from ResearchWorkDetailsModal)
    const renderFeedbackText = (text) => {
        const parts = text.split('--- OBSERVACIONES ESPECÍFICAS ---');
        const general = parts[0];
        const specific = parts.length > 1 ? parts[1].split('\n').filter(line => line.trim().length > 0) : [];

        return (
            <div className="space-y-4">
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{general.trim()}</p>
                {specific.length > 0 && (
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-3 flex items-center gap-2">
                            <AlertTriangle size={12} /> Observaciones Puntuales
                        </h5>
                        <ul className="space-y-3">
                            {specific.map((line, idx) => {
                                // Extract [Title]: Comment
                                const match = line.match(/• \[(.*?)\]: (.*)/);
                                if (match) {
                                    return (
                                        <li key={idx} className="flex flex-col sm:flex-row gap-2 text-sm">
                                            <span className="shrink-0">
                                                <span className="bg-white border border-orange-200 text-orange-600 px-2 py-0.5 rounded text-[11px] font-bold shadow-sm">
                                                    {match[1]}
                                                </span>
                                            </span>
                                            <span className="text-slate-700 italic">"{match[2]}"</span>
                                        </li>
                                    );
                                }
                                return <li key={idx} className="text-sm text-slate-600 pl-2 border-l-2 border-orange-200">{line.replace('• ', '')}</li>;
                            })}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 uppercase-label">

                {/* --- HEADER: PREMIUM DARK STYLE --- */}
                <div className="bg-slate-900 text-white p-6 relative shrink-0">
                    <div className="flex justify-between items-start gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-amber-600/20 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border border-amber-500/30 uppercase">
                                    MODO REVISIÓN
                                </span>
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                    Módulo de Investigación 2026
                                </span>
                            </div>
                            <h2 className="text-2xl font-black leading-tight mb-3 pr-8">
                                {work.title || "Sin título registrado"}
                            </h2>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-400 text-xs font-medium">
                                <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                                    <User size={14} className="text-indigo-400" /> {work.author_name}
                                </span>
                                <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                                    <Calendar size={14} className="text-indigo-400" /> {formattedDate}
                                </span>
                                <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                                    <Shield size={14} className="text-indigo-400" /> {work.id}
                                </span>
                                <Badge type={work.status === 'ACEPTADO' ? 'success' : 'warning'}>
                                    {work.status}
                                </Badge>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-500 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* --- NAVIGATION: TABBED INTERFACE --- */}
                <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 shadow-sm">
                    <TabButton
                        id="review"
                        icon={<ClipboardCheck size={18} />}
                        label="Panel de Evaluación"
                        active={activeTab}
                        set={setActiveTab}
                    />
                    <TabButton
                        id="content"
                        icon={<BookOpen size={18} />}
                        label="Contenido Detallado"
                        active={activeTab}
                        set={setActiveTab}
                    />
                    <TabButton
                        id="evaluacion"
                        icon={<Activity size={18} />}
                        label="Jurado / Evaluación"
                        active={activeTab}
                        set={setActiveTab}
                        badge={work.juror_score ? "1" : null}
                    />
                    <TabButton
                        id="metadata"
                        icon={<Shield size={18} />}
                        label="Metadatos"
                        active={activeTab}
                        set={setActiveTab}
                    />

                    <TabButton
                        id="history"
                        icon={<Activity size={18} />}
                        label="Historial de Auditoría"
                        active={activeTab}
                        set={setActiveTab}
                    />
                </div>

                {/* --- BODY: CONTENT AREA --- */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30 p-8 custom-scrollbar">

                    {/* TAB: REVIEW PANEL */}
                    {activeTab === 'review' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-left-4 duration-300">
                            {/* Checklist Section */}
                            <div className="space-y-6">
                                <InfoCard title="Lista de Verificación (Checklist)">
                                    <div className="space-y-3">
                                        {(work.checklist_config || Object.keys(checklist)).map((item, idx) => (
                                            <ChecklistItem
                                                key={idx}
                                                label={item}
                                                checked={!!checklist[item]}
                                                onToggle={() => handleCheck(item)}
                                                disabled={readOnly}
                                            />
                                        ))}
                                        {(!work.checklist_config && Object.keys(checklist).length === 0) && (
                                            <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 italic text-sm">
                                                No hay criterios de verificación configurados.
                                            </div>
                                        )}
                                    </div>
                                    {!allChecked && !readOnly && (
                                        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 text-amber-700 text-xs leading-relaxed">
                                            <AlertTriangle size={18} className="shrink-0" />
                                            <p><strong>Nota:</strong> Todos los puntos deben estar marcados con éxito para poder emitir un Visto Bueno definitivo.</p>
                                        </div>
                                    )}
                                </InfoCard>
                            </div>

                            {/* Feedback Section */}
                            <div className="space-y-6">
                                <InfoCard title="Observaciones y Feedback">
                                    {readOnly ? (
                                        <div className="space-y-4">
                                            {work.feedback && work.feedback.length > 0 ? (
                                                work.feedback.map((f, i) => (
                                                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                                                Observación #{work.feedback.length - i}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium">
                                                                {new Date(f.created_at).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-700 font-medium italic">"{f.comment}"</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm italic text-slate-500 text-sm">
                                                    No se registraron observaciones en esta revisión.
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* General Comment */}
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Comentario General</label>
                                                <textarea
                                                    className="w-full h-24 p-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm resize-none"
                                                    placeholder="Escriba aquí las observaciones generales..."
                                                    value={feedback}
                                                    onChange={(e) => setFeedback(e.target.value)}
                                                ></textarea>
                                            </div>

                                            {/* Specific Comments */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Observaciones Específicas</label>
                                                    <button
                                                        onClick={() => setSpecificFeedback([...specificFeedback, { section: '', comment: '' }])}
                                                        className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                                                    >
                                                        <Plus size={12} /> Agregar Sección
                                                    </button>
                                                </div>

                                                {specificFeedback.map((item, index) => (
                                                    <div key={index} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 animate-in slide-in-from-top-2">
                                                        <div className="flex gap-2">
                                                            <select
                                                                className="flex-1 text-xs p-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
                                                                value={item.section}
                                                                onChange={(e) => {
                                                                    const newFeedback = [...specificFeedback];
                                                                    newFeedback[index].section = e.target.value;
                                                                    setSpecificFeedback(newFeedback);
                                                                }}
                                                            >
                                                                <option value="">-- Seleccionar Sección --</option>
                                                                {work.values?.map((v, i) => (
                                                                    <option key={i} value={v.section_title}>{v.section_title}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={() => {
                                                                    const newFeedback = specificFeedback.filter((_, i) => i !== index);
                                                                    setSpecificFeedback(newFeedback);
                                                                }}
                                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            className="w-full h-16 p-3 bg-white border border-slate-200 rounded-lg outline-none text-xs resize-none focus:border-indigo-500"
                                                            placeholder="Comentario para esta sección..."
                                                            value={item.comment}
                                                            onChange={(e) => {
                                                                const newFeedback = [...specificFeedback];
                                                                newFeedback[index].comment = e.target.value;
                                                                setSpecificFeedback(newFeedback);
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                                {specificFeedback.length === 0 && (
                                                    <div className="text-center py-4 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs italic">
                                                        No hay observaciones específicas agregadas.
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 pt-2 border-t border-slate-100">
                                                <MessageSquare size={12} /> El autor recibirá estas notas en su panel automáticamente.
                                            </div>
                                        </div>
                                    )}
                                </InfoCard>
                            </div>
                        </div>
                    )}

                    {/* TAB: CONTENT DISPLAY (Simplified from WorkDetailsModal) */}
                    {activeTab === 'content' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            {work.values && work.values.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {work.values.sort((a, b) => (a.section_order || 0) - (b.section_order || 0)).map((val, idx) => {
                                        // Robust check for files
                                        const isGenericFile = val.file_url || (val.section_title && (val.section_title.toLowerCase().includes('archivo') || val.section_title.toLowerCase().includes('consentimiento') || val.section_title.toLowerCase().includes('adjunto')));

                                        return (
                                            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all">
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                                                    {val.section_title}
                                                </h4>

                                                {isGenericFile ? (
                                                    <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-xl group-hover:bg-indigo-50/80 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                                                <Download size={24} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-800 text-sm">{val.content_text || "Documento Adjunto"}</p>
                                                                <p className="text-xs text-slate-500 uppercase tracking-tighter">Click para descargar</p>
                                                            </div>
                                                        </div>
                                                        {val.file_url ? (
                                                            <a href={getFileUrl(val.file_url)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow hover:bg-indigo-700 transition-all flex items-center gap-1">
                                                                Ver <ChevronRight size={14} />
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic px-4">No disponible</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed whitespace-pre-line font-medium italic">
                                                        "{val.content_text || 'Sin texto'}"
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-slate-400">
                                    <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>No hay contenido estructurado disponible para este trabajo.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: EVALUACION */}
                    {activeTab === 'evaluacion' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-1 space-y-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-2">Puntaje Final</p>
                                        <div className="relative">
                                            <div className="text-6xl font-black text-indigo-600 mb-1">
                                                {work.final_score !== null ? Number(work.final_score).toFixed(2) : '--'}
                                            </div>
                                            {work.penalty_applied > 0 && (
                                                <div className="absolute -top-2 -right-12 bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-black border border-red-200">
                                                    -{work.penalty_applied}
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1 mt-4">
                                            <div
                                                className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${(work.final_score || 0) * 10}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg shadow-indigo-200/50">
                                        <h4 className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] mb-4 opacity-60">
                                            <Shield size={14} /> Desglose de Notas
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end border-b border-indigo-500/30 pb-2">
                                                <span className="text-xs font-bold text-indigo-300 uppercase">Jurado</span>
                                                <span className="text-lg font-black">{work.juror_score || '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-indigo-500/30 pb-2">
                                                <span className="text-xs font-bold text-red-400 uppercase">Penalidad</span>
                                                <span className="text-lg font-black text-red-300">-{work.penalty_applied || '0.00'}</span>
                                            </div>
                                            <div className="pt-2 text-[10px] text-indigo-200 italic leading-tight">
                                                La penalidad se calcula automáticamente por envíos fuera de fecha.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-6">
                                    {work.checklist && (
                                        <InfoCard title="Visto Bueno (Lista de Verificación)">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {Object.keys(work.checklist).map((key, idx) => (
                                                    <ValidationItem key={idx} label={key} checked={work.checklist[key]} />
                                                ))}
                                            </div>
                                        </InfoCard>
                                    )}
                                    <InfoCard title="Observaciones del Comité">
                                        {work.feedback && work.feedback.length > 0 ? (
                                            <div className="space-y-4">
                                                {work.feedback.map((f, i) => (
                                                    <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-black text-[10px]">
                                                                    JD
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Comité Evaluador</p>
                                                                    <p className="text-[10px] text-slate-400">
                                                                        {f.created_at ? new Date(f.created_at).toLocaleString() : 'Hace unos momentos'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <MessageSquare size={16} className="text-slate-200" />
                                                        </div>
                                                        {renderFeedbackText(f.comment || f)}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-white p-10 rounded-2xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
                                                <AlertTriangle size={48} className="text-slate-200 mb-4" />
                                                <p className="text-slate-400 font-medium italic">Aún no se han registrado observaciones oficiales para este trabajo.</p>
                                            </div>
                                        )}
                                    </InfoCard>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: METADATA */}
                    {activeTab === 'metadata' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-300">
                            <InfoCard title="Información del Autor">
                                <InfoItem icon={User} label="Nombre Completo" value={work.author_name} />
                                <InfoItem icon={Shield} label="ID de Usuario" value={work.user_id} />
                                <InfoItem icon={Tag} label="Especialidad Seleccionada" value={work.specialty} />
                            </InfoCard>

                            <InfoCard title="Detalles del Sistema">
                                <InfoRow label="UID de Envío" value={work.id} highlight />
                                <InfoRow label="Estado Actual" value={work.status} highlight />
                                <InfoRow label="Tipo de Envío" value={work.type_name} />
                                <InfoRow label="Fecha de Envío" value={formattedDate} />
                                <InfoRow label="Presentación Tardía" value={work.is_late_submission ? "SÍ (Aplicó Penalidad)" : "NO"} highlight={work.is_late_submission} />
                            </InfoCard>
                        </div>
                    )}

                    {/* TAB: HISTORY - DYNAMIC AUDIT LOGS */}
                    {activeTab === 'history' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-300">
                            <InfoCard title="Historial de Auditoría y Trazabilidad">
                                {work.audit_logs && work.audit_logs.length > 0 ? (
                                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 py-2">
                                        {work.audit_logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((log, idx) => (
                                            <div key={idx} className="relative pl-6">
                                                {/* Dot */}
                                                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center
                                                ${log.action === 'STATUS_CHANGE' ? 'bg-indigo-500' : log.action === 'FEEDBACK_ADDED' ? 'bg-amber-500' : 'bg-slate-400'}`}>
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                </div>

                                                {/* Content */}
                                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded
                                                        ${log.action === 'STATUS_CHANGE' ? 'bg-indigo-50 text-indigo-600' : log.action === 'FEEDBACK_ADDED' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            {log.action.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            {new Date(log.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-700 font-medium mb-1">{log.details}</p>
                                                    <p className="text-xs text-slate-400 flex items-center gap-1">
                                                        <User size={10} /> {log.user_id}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-400 italic">
                                        No hay registros de auditoría disponibles.
                                    </div>
                                )}
                            </InfoCard>
                        </div>
                    )}

                </div>

                {/* --- FOOTER: ACTIONS --- */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-bold transition-all"
                    >
                        {readOnly ? 'Cerrar' : 'Cancelar'}
                    </button>
                    {!readOnly && (
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleSubmit('OBSERVADO')}
                                disabled={isSubmitting || (!feedback && specificFeedback.length === 0)}
                                className="px-6 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-bold shadow-sm hover:bg-amber-100 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <AlertTriangle size={16} /> Solicitar Correcciones
                            </button>
                            <button
                                onClick={() => handleSubmit('ACEPTADO')}
                                disabled={isSubmitting || !allChecked}
                                className={`px-8 py-2 text-white rounded-lg text-sm font-bold shadow-lg transition-all flex items-center gap-2 
                                    ${!allChecked ? 'bg-indigo-300 cursor-not-allowed opacity-70 shadow-none' : 'bg-indigo-600 shadow-indigo-600/20 hover:scale-105 active:scale-95'}`}
                            >
                                <CheckCircle size={16} /> Dar Visto Bueno
                            </button>
                        </div>
                    )}
                    {readOnly && (
                        <div className="flex gap-3">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                                Visualizando trabajo en modo solo lectura
                            </span>
                        </div>
                    )}
                </div>

            </div >
        </div >
    );
};

// --- SUBCOMPONENTES ---
const TabButton = ({ id, icon, label, active, set, badge }) => (
    <button
        onClick={() => set(id)}
        className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all border-b-2 relative
      ${active === id ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
    >
        {icon} {label}
        {badge && (
            <span className="absolute top-3 right-4 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-white">
                {badge}
            </span>
        )}
    </button>
);

const InfoCard = ({ title, children }) => (
    <div className="space-y-4">
        <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 px-2">
            <div className="w-1.5 h-3 bg-indigo-500 rounded-full"></div>
            {title}
        </h3>
        {children}
    </div>
);

const ChecklistItem = ({ label, checked, onToggle, disabled }) => (
    <div
        onClick={!disabled ? onToggle : undefined}
        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all shadow-sm group
        ${disabled ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:border-indigo-400 cursor-pointer hover:shadow-md'}
        ${checked ? 'bg-indigo-50/30 border-indigo-400/50' : ''}`}
    >
        <div
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0
            ${checked ? 'bg-indigo-600 border-indigo-600 scale-110' : 'border-slate-300 bg-slate-50 group-hover:border-indigo-400'}`}
        >
            {checked && <Check size={14} className="text-white animate-in zoom-in duration-200" strokeWidth={4} />}
        </div>
        <span className={`text-sm font-bold transition-colors ${checked ? 'text-indigo-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
            {label}
        </span>
    </div>
);

const Check = ({ size, className, strokeWidth = 2 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"></polyline></svg>
);

const InfoRow = ({ label, value, highlight }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{label}</span>
        <span className={`text-sm font-bold ${highlight ? 'text-indigo-600' : 'text-slate-700'}`}>{value || '-'}</span>
    </div>
);

const InfoItem = ({ icon: Icon, label, value }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        if (!value || value === '-') return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <div className="p-2.5 bg-slate-50 rounded-xl text-indigo-600 border border-slate-100 shadow-inner"><Icon size={20} /></div>
            <div className="flex-grow min-w-0">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.1em] mb-0.5">{label}</p>
                <div className="flex items-center gap-2">
                    <p className="text-slate-800 font-black text-base truncate" title={value}>{value || '-'}</p>
                    <button onClick={handleCopy} className="p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-indigo-500 transition-colors">
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ValidationItem = ({ label, checked }) => (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${checked ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${checked ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
            <Check size={14} strokeWidth={4} />
        </div>
        <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
    </div>
);



export default WorkReviewModal;
