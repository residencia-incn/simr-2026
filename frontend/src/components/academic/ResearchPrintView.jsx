import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const ResearchPrintView = ({ work }) => {
    if (!work) return null;

    const formattedDate = work.submitted_at ? new Date(work.submitted_at).toLocaleDateString('es-PE', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    }) : '--/--/----';

    const printDate = new Date().toLocaleDateString('es-PE', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    });

    return (
        <div className="hidden print:block font-sans text-slate-800 p-8 w-full bg-white">
            <div className="max-w-[190mm] mx-auto">
                {/* --- HEADER --- */}
                <div className="border-b-2 border-slate-900 pb-4 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-none mb-1">FICHA DE TRABAJO</h1>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Investigación - SIMR 2026</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Fecha de Impresión</p>
                        <p className="text-xl font-bold text-slate-900">{printDate}</p>
                    </div>
                </div>

                {/* --- MAIN CARD --- */}
                <div className="border border-slate-300 rounded-xl p-6 mb-8 bg-slate-50/30">
                    <div className="flex justify-between items-start gap-6">
                        <div className="flex-1">
                            <h2 className="text-2xl font-black leading-tight text-slate-900 mb-4">
                                {work.title || "Sin Título Registrado"}
                            </h2>

                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="px-3 py-1 bg-white border border-slate-300 rounded-md text-[10px] font-black uppercase tracking-widest text-slate-600">
                                    {work.type_name || 'Trabajo Original'}
                                </span>
                                <span className="px-3 py-1 bg-white border border-slate-300 rounded-md text-[10px] font-black uppercase tracking-widest text-slate-600">
                                    {work.specialty || 'General'}
                                </span>
                                <span className="px-3 py-1 bg-white border border-slate-300 rounded-md text-[10px] font-black uppercase tracking-widest text-slate-900">
                                    {work.status}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm">
                                    <span className="font-bold text-slate-900 underline underline-offset-2">Autor:</span> <span className="text-slate-700">{work.author_name}</span>
                                </p>
                                <p className="text-xs font-mono text-slate-400">ID: {work.id}</p>
                            </div>
                        </div>

                        <div className="bg-white p-2 rounded-lg border border-slate-200 shrink-0 shadow-sm">
                            <QRCodeSVG value={`${work.id}`} size={90} />
                        </div>
                    </div>
                </div>

                {/* --- DETAILS GRID --- */}
                <div className="flex gap-12 mb-8 border-b border-slate-200 pb-8">
                    <div className="w-1/2">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4">Detalles de Envío</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm border-b border-slate-100 pb-1">
                                <span className="text-slate-500">Fecha Envío:</span>
                                <span className="font-bold text-slate-900">{formattedDate}</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-slate-100 pb-1">
                                <span className="text-slate-500">Última Mod.:</span>
                                <span className="font-bold text-slate-900">
                                    {work.updated_at ? new Date(work.updated_at).toLocaleDateString() : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Material Visual:</span>
                                <span className="font-bold text-slate-900">Registrado</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-1/2">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4">Programación</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm border-b border-slate-100 pb-1">
                                <span className="text-slate-500">Fecha:</span>
                                <span className="font-bold text-slate-900 capitalize">
                                    {work.schedule_info?.start_time
                                        ? new Date(work.schedule_info.start_time).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
                                        : 'Pendiente'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Hora:</span>
                                <span className="font-bold text-slate-900">
                                    {work.schedule_info?.start_time
                                        ? new Date(work.schedule_info.start_time).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
                                        : '--:--'}
                                </span>
                            </div>
                            {work.schedule_info?.location && (
                                <div className="flex justify-between text-sm border-t border-slate-100 pt-1">
                                    <span className="text-slate-500">Lugar:</span>
                                    <span className="font-bold text-slate-900">{work.schedule_info.location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- JURORS --- */}
                <div className="mb-8 pb-4 border-b border-slate-200">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-3">
                        Jurados Asignados (0)
                    </h3>
                    <p className="text-sm text-slate-400 italic">No hay jurados asignados aún a este trabajo.</p>
                </div>

                {/* --- CONTENT SECTION --- */}
                {work.values && work.values.length > 0 && (
                    <div className="mt-12">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">
                            Contenido Estructurado del Trabajo
                        </h3>
                        <div className="space-y-8">
                            {work.values.sort((a, b) => (a.section_order || 0) - (b.section_order || 0)).map((val, idx) => (
                                <div key={idx} className="break-inside-avoid mb-6">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-3 ml-1 border-l-4 border-indigo-600 pl-3">
                                        {val.section_title}
                                    </h4>
                                    <div className="text-[13px] text-slate-800 leading-relaxed text-justify px-2">
                                        {val.content_text ? (
                                            <p className="whitespace-pre-line">{val.content_text}</p>
                                        ) : val.file_url ? (
                                            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Documento Adjunto:</p>
                                                <p className="text-xs text-slate-400 italic break-all">{val.file_url}</p>
                                            </div>
                                        ) : val.bool_value !== null ? (
                                            <p className="font-bold text-slate-700">
                                                {val.bool_value ? '✓ CONFIRMADO' : '✗ RECHAZADO'}
                                            </p>
                                        ) : (
                                            <p className="italic text-slate-400 text-xs">Sin contenido registrado.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- FOOTER --- */}
                <div className="text-center pt-12 mt-12 border-t border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Documento generado automáticamente por sistema SIMR 2026 • Instituto Nacional de Ciencias Neurológicas (INCN)
                    </p>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { 
                        margin: 10mm; 
                        size: A4 portrait; 
                    }
                    
                    /* Essential: Hide everything by default using visibility, not display */
                    body { 
                        visibility: hidden !important;
                        background: white !important;
                    }
                    
                    /* Essential: Make the print container and its contents visible */
                    .print\\:block, 
                    .print\\:block * { 
                        visibility: visible !important;
                    }
                    
                    /* Position the print view at the very top of the printed page */
                    .print\\:block {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }

                    /* Hide the modal screen UI and background overlay */
                    .print\\:hidden,
                    .bg-black\\/60 { 
                        display: none !important; 
                        visibility: hidden !important;
                    }

                    /* Allow natural pagination */
                    .break-inside-avoid {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    
                    h1, h2, h3, h4 { page-break-after: avoid; }
                }
            `}</style>
        </div>
    );
};

export default ResearchPrintView;
