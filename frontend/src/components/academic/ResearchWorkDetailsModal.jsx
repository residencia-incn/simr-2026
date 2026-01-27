import React, { useState, useEffect } from 'react';
import { X, User, Calendar, FileText, Activity, Tag, BookOpen, Shield, Download, Check, Copy, ChevronRight, MessageSquare, AlertCircle, UploadCloud } from 'lucide-react';
import { Badge } from '../ui';
import api from '../../services/api';
import Swal from 'sweetalert2';
import ResearchPrintView from './ResearchPrintView';

const ResearchWorkDetailsModal = ({ isOpen, onClose, work, onSuccess }) => {
    const [activeTab, setActiveTab] = useState('content'); // content | evaluacion | metadata
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [specificFeedbackSections, setSpecificFeedbackSections] = useState([]);
    const [uploadingFiles, setUploadingFiles] = useState({});

    // Initialize data
    useEffect(() => {
        if (work) {
            setFormData(JSON.parse(JSON.stringify(work.values || [])));

            // Extract flagged sections from feedback
            const flagging = [];
            if (work.feedback) {
                work.feedback.forEach(fbItem => {
                    const txt = fbItem.comment || fbItem || "";
                    // Look for [Title] pattern
                    const matches = txt.match(/\[(.*?)\]/g);
                    if (matches) {
                        matches.forEach(m => flagging.push(m.replace(/[\[\]]/g, '').trim()));
                    }
                });
            }
            setSpecificFeedbackSections(flagging);
        }
    }, [work, isOpen]);

    // Atajo ESC para cerrar
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !work) return null;

    const handleTextChange = (sectionConfigId, text) => {
        setFormData(prev => prev.map(item =>
            item.section_config_id === sectionConfigId
                ? { ...item, content_text: text }
                : item
        ));
    };

    const handleFileChange = async (sectionConfigId, file) => {
        if (!file) return;

        setUploadingFiles(prev => ({ ...prev, [sectionConfigId]: true }));
        try {
            const response = await api.documents.upload(file);
            const fileUrl = response.webViewLink || response.web_view_link || response.file_id || response.id || response.url || response;

            if (!fileUrl) throw new Error("No se obtuvo URL del archivo");

            setFormData(prev => prev.map(item =>
                item.section_config_id === sectionConfigId
                    ? { ...item, file_url: fileUrl, content_text: file.name }
                    : item
            ));

        } catch (error) {
            console.error("Upload error:", error);
            Swal.fire('Error', 'No se pudo subir el archivo.', 'error');
        } finally {
            setUploadingFiles(prev => ({ ...prev, [sectionConfigId]: false }));
        }
    };

    const handleResubmit = async () => {
        setSubmitting(true);
        try {
            await api.research.updateContent(work.id, {
                type_id: work.type_id,
                specialty: work.specialty, // Keep existing
                title: work.title,
                values: formData
            });

            // Auto-update status to ENVIADO
            await api.research.updateStatus(work.id, { status: 'ENVIADO' });

            onClose();
            if (onSuccess) onSuccess();
            Swal.fire('¡Enviado!', 'Tus correcciones han sido enviadas correctamente.', 'success');
        } catch (error) {
            console.error("Error updating:", error);
            Swal.fire('Error', 'No se pudo guardar los cambios.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const formattedDate = work.submitted_at ? new Date(work.submitted_at).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : '--/--/----';

    const statusColors = {
        'BORRADOR': 'bg-slate-500',
        'ENVIADO': 'bg-blue-500',
        'EN_REVISION': 'bg-amber-500',
        'OBSERVADO': 'bg-orange-500',
        'ACEPTADO': 'bg-green-500',
        'RECHAZADO': 'bg-red-500'
    };

    const getFileUrl = (url) => {
        if (!url) return '';
        if (url.includes('mock.simr.pe')) {
            return url.replace(/https?:\/\/mock\.simr\.pe\/uploads\//, 'http://localhost:8000/archivo/');
        }
        if (url.startsWith('http')) return url;
        return `http://localhost:8000${url.startsWith('/') ? '' : '/'}${url}`;
    };

    // Helper to render feedback text nicely
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
                            <AlertCircle size={12} /> Observaciones Puntuales
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
        <>
            {/* PRINT VIEW (Rendered as sibling, visible only when printing) */}
            <ResearchPrintView work={work} />

            {/* SCREEN VIEW (Modal Overlay - Hidden when printing) */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300 print:hidden">
                <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                    {/* --- HEADER: PREMIUM DARK STYLE --- */}
                    <div className="bg-slate-900 text-white p-6 relative shrink-0">
                        <div className="flex justify-between items-start gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border border-indigo-500/30 uppercase">
                                        {work.id}
                                    </span>
                                    <div className={`w-2 h-2 rounded-full ${statusColors[work.status] || 'bg-slate-400'} animate-pulse`}></div>
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                        {work.type_name || 'Trabajo de Investigación'}
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
                                        <Tag size={14} className="text-indigo-400" /> {work.specialty}
                                    </span>
                                    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${work.status === 'ACEPTADO' ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-blue-500/50 text-blue-400 bg-blue-500/10'}`}>
                                        {work.status}
                                    </span>
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
                            id="content"
                            icon={<FileText size={18} />}
                            label={isEditing ? "Modificando Contenido" : "Contenido Estructurado"}
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
                            id="audit"
                            icon={<Activity size={18} />}
                            label="Historial de Auditoría"
                            active={activeTab}
                            set={setActiveTab}
                        />
                    </div>

                    {/* --- BODY: CONTENT AREA --- */}
                    <div className="flex-1 overflow-y-auto bg-slate-50/30 p-8 custom-scrollbar">

                        {/* TAB: CONTENT */}
                        {activeTab === 'content' && (
                            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                                {work.status === 'OBSERVADO' && !isEditing && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                                <AlertCircle size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">Este trabajo tiene observaciones.</p>
                                                <p className="text-xs text-slate-500">Puedes editar el contenido y reenviarlo para evaluación.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-orange-200 transition-all active:scale-95"
                                        >
                                            Corregir Ahora
                                        </button>
                                    </div>
                                )}

                                {formData && formData.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-6">
                                        {formData.sort((a, b) => (a.section_order || 0) - (b.section_order || 0)).map((val, idx) => {
                                            const isFlagged = work.status === 'OBSERVADO' && specificFeedbackSections.includes(val.section_title);
                                            const isGenericFile = val.file_url || (val.section_title && (val.section_title.toLowerCase().includes('archivo') || val.section_title.toLowerCase().includes('consentimiento')));

                                            return (
                                                <InfoCard
                                                    key={idx}
                                                    title={val.section_title}
                                                    flagged={isFlagged}
                                                >
                                                    {isEditing ? (
                                                        // --- EDIT MODE ---
                                                        <div className="space-y-2">
                                                            {isGenericFile ? (
                                                                // FILE EDIT - Check this first to avoid switching to Textarea if content_text (filename) exists
                                                                <div className={`p-5 rounded-xl border border-dashed transition-all ${isFlagged ? 'border-red-300 bg-red-50/50' : 'border-slate-300 bg-slate-50'}`}>
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm border border-slate-200">
                                                                                <FileText size={24} />
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-bold text-slate-700 text-sm">
                                                                                    {val.file_url ? 'Archivo actual registrado' : 'Subir archivo'}
                                                                                </p>
                                                                                {val.file_url && (
                                                                                    <a href={getFileUrl(val.file_url)} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">Ver archivo actual</a>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <label className="cursor-pointer">
                                                                            <input
                                                                                type="file"
                                                                                className="hidden"
                                                                                onChange={(e) => handleFileChange(val.section_config_id, e.target.files[0])}
                                                                                disabled={uploadingFiles[val.section_config_id]}
                                                                            />
                                                                            <span className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2
                                                                        ${uploadingFiles[val.section_config_id] ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                                                                                {uploadingFiles[val.section_config_id] ? 'Subiendo...' : (
                                                                                    <><UploadCloud size={16} /> {val.file_url ? 'Reemplazar' : 'Subir'}</>
                                                                                )}
                                                                            </span>
                                                                        </label>
                                                                    </div>
                                                                    {isFlagged && (
                                                                        <div className="mt-3 text-xs text-red-500 font-bold flex items-center gap-1">
                                                                            <AlertCircle size={12} /> Se requiere corrección en este archivo
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : val.content_text !== null ? (
                                                                // TEXT EDIT
                                                                <div className="relative">
                                                                    <textarea
                                                                        value={val.content_text}
                                                                        onChange={(e) => handleTextChange(val.section_config_id, e.target.value)}
                                                                        rows={6}
                                                                        className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-offset-1 transition-all
                                                                    ${isFlagged
                                                                                ? 'border-red-300 bg-red-50 focus:ring-red-500'
                                                                                : 'border-slate-300 focus:ring-indigo-500'}`}
                                                                    />
                                                                    {isFlagged && (
                                                                        <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-black uppercase text-red-500 bg-white/80 px-2 py-0.5 rounded border border-red-200">
                                                                            <AlertCircle size={10} /> Corregir
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : val.bool_value !== null ? (
                                                                <div className={`flex items-center gap-3 p-4 rounded-xl border ${val.bool_value ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                                                    {val.bool_value ? <Check size={20} /> : <X size={20} />}
                                                                    <span className="font-bold">{val.bool_value ? 'Confirmado / Sí' : 'No / Denegado'}</span>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        // --- VIEW MODE ---
                                                        <>
                                                            {(val.file_url || isGenericFile) ? (
                                                                <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-xl group">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 group-hover:scale-110 transition-transform">
                                                                            <Download size={24} />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-slate-800 text-sm">{val.section_title || "Documento Adjunto"}</p>
                                                                            <p className="text-xs text-slate-500 uppercase tracking-tighter">
                                                                                {val.content_text && !val.content_text.includes('http') ? val.content_text : 'Click para ver material'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    {val.file_url ? (
                                                                        <a
                                                                            href={getFileUrl(val.file_url)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
                                                                        >
                                                                            Abrir Archivo <ChevronRight size={16} />
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-xs text-slate-400 italic">Archivo no disponible</span>
                                                                    )}
                                                                </div>
                                                            ) : val.content_text ? (
                                                                <div className={`bg-white p-5 rounded-xl border shadow-sm group transition-all relative
                                                            ${isFlagged ? 'border-red-300 shadow-red-100' : 'border-slate-200 hover:border-indigo-200'}`}>

                                                                    {isFlagged && (
                                                                        <div className="absolute -top-3 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                                                            <AlertCircle size={10} /> OBSERVADO
                                                                        </div>
                                                                    )}

                                                                    <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm md:text-base italic">
                                                                        "{val.content_text}"
                                                                    </p>
                                                                    <div className="mt-3 flex justify-end">
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            {val.content_text.split(/\s+/).length} palabras
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : val.bool_value !== null ? (
                                                                <div className={`flex items-center gap-3 p-4 rounded-xl border ${val.bool_value ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                                                    {val.bool_value ? <Check size={20} /> : <X size={20} />}
                                                                    <span className="font-bold">{val.bool_value ? 'Confirmado / Sí' : 'No / Denegado'}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="p-4 bg-slate-100 rounded-xl border border-dashed border-slate-300 text-slate-400 italic text-sm text-center">
                                                                    Sin información registrada en esta sección.
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </InfoCard>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                        <BookOpen size={64} className="mb-4 opacity-20" />
                                        <p className="font-medium">No se encontraron datos estructurados para este trabajo.</p>
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
                                                    style={{ width: `${(work.final_score || 0) * 10}%` }} // Adjusted to scale
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
                                                    <AlertCircle size={48} className="text-slate-200 mb-4" />
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

                        {/* TAB: AUDIT */}
                        {activeTab === 'audit' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-300">
                                <InfoCard title="Historial de Auditoría y Trazabilidad">
                                    {work.audit_logs && work.audit_logs.length > 0 ? (
                                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 py-2">
                                            {work.audit_logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((log, idx) => (
                                                <div key={idx} className="relative pl-6">
                                                    {/* Dot */}
                                                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center
                                                ${log.action === 'STATUS_CHANGE' ? 'bg-indigo-500' : log.action === 'FEEDBACK_ADDED' ? 'bg-orange-500' : 'bg-slate-400'}`}>
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded
                                                        ${log.action === 'STATUS_CHANGE' ? 'bg-indigo-50 text-indigo-600' : log.action === 'FEEDBACK_ADDED' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
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
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-50 bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">
                                        {i}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {work.status === 'ACEPTADO' ? 'Trabajo Validado por el Comité' : isEditing ? 'Modificando Contenido' : 'En proceso de evaluación académica'}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            {!isEditing && (
                                <button
                                    onClick={() => window.print()}
                                    className="px-6 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                                >
                                    <PrinterIcon size={16} /> Imprimir Detalles
                                </button>
                            )}

                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-bold transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleResubmit}
                                        disabled={submitting}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        {submitting ? 'Enviando...' : 'Guardar y Enviar Correcciones'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-bold transition-all"
                                >
                                    Cerrar
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

// --- SUBCOMPONENTES VISUALES ---
const TabButton = ({ id, icon, label, active, set, badge }) => (
    <button
        onClick={() => set(id)}
        className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all border-b-2 relative
      ${active === id ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
    >
        {icon} {label}
        {badge && (
            <span className="absolute top-3 right-4 w-4 h-4 bg-indigo-600 text-white text-[8px] flex items-center justify-center rounded-full border border-white">
                {badge}
            </span>
        )}
    </button>
);

const InfoCard = ({ title, children, flagged }) => (
    <div className={`space-y-4 ${flagged ? 'animate-pulse-once' : ''}`}>
        <h3 className={`font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 px-2 ${flagged ? 'text-red-500' : 'text-slate-400'}`}>
            <div className={`w-1.5 h-3 rounded-full ${flagged ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
            {title}
        </h3>
        {children}
    </div>
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

const PrinterIcon = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
);

export default ResearchWorkDetailsModal;
