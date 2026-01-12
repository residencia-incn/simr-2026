
import React from 'react';

interface CourseContentPreviewProps {
    modules: any[];
    finalExam?: {
        enabled: boolean;
        id: string | number;
        title?: string;
        condition?: 'completion' | 'date';
        date?: string;
    };
    closingDate?: string | null;
    onVideoClick?: (videoId: number) => void;
}

const CourseContentPreview: React.FC<CourseContentPreviewProps> = ({ modules, finalExam, closingDate, onVideoClick }) => {



    // Calculate if Final Exam is locked (all modules/lessons completed)
    // Calculate if Final Exam is locked
    let isFinalExamLocked = true;
    let lockReason = '';

    if (finalExam) {
        const allModulesCompleted = modules.every(m =>
            m.items.length > 0 && m.items.every((l: any) => l.status === 'COMPLETADO')
        );

        const now = new Date();

        // 1. Check Course Closing Date (Highest Priority)
        if (closingDate) {
            const closing = new Date(closingDate);
            if (now > closing) {
                isFinalExamLocked = true;
                lockReason = `El curso finalizó el ${closing.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}. No es posible realizar el examen.`;
                // Return early or set logic flag to prevent overwrite
            } else if (finalExam.condition === 'date' && finalExam.date) {
                // 2. Check Scheduled Date
                const unlockDate = new Date(finalExam.date);
                if (now < unlockDate) {
                    isFinalExamLocked = true;
                    lockReason = `Disponible el ${unlockDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
                } else {
                    isFinalExamLocked = false;
                }
            } else {
                // 3. Check Completion
                isFinalExamLocked = !allModulesCompleted;
                if (isFinalExamLocked) {
                    lockReason = 'Completa todos los módulos para desbloquear el examen final.';
                }
            }
        }
        // Logic without closing date
        else if (finalExam.condition === 'date' && finalExam.date) {
            const unlockDate = new Date(finalExam.date);
            if (now < unlockDate) {
                isFinalExamLocked = true;
                lockReason = `Disponible el ${unlockDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
            } else {
                isFinalExamLocked = false;
            }
        } else {
            // Default to completion
            isFinalExamLocked = !allModulesCompleted;
            if (isFinalExamLocked) {
                lockReason = 'Completa todos los módulos para desbloquear el examen final.';
            }
        }
    }

    // Calculate total duration of a module
    const calculateModuleDuration = (items: any[]) => {
        if (!items || items.length === 0) return '0 min';

        let totalMinutes = 0;

        items.forEach(item => {
            if (!item.duration) return;

            const duration = item.duration.toString();

            // Improved parsing logic
            if (duration.includes(':')) {
                const parts = duration.split(':').map((p: string) => parseInt(p, 10) || 0);
                if (parts.length === 3) {
                    // HH:MM:SS
                    totalMinutes += (parts[0] * 60) + parts[1] + (parts[2] / 60);
                } else if (parts.length === 2) {
                    // MM:SS
                    totalMinutes += parts[0] + (parts[1] / 60);
                }
            }
            // Format: "XX min" or just number
            else {
                const textVal = duration.toLowerCase().replace('min', '').trim();
                const val = parseInt(textVal, 10);
                if (!isNaN(val)) {
                    totalMinutes += val;
                }
            }
        });

        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);

        if (hours > 0) {
            return `${hours} h ${minutes} min`;
        }
        return `${minutes} min`;
    };

    // Helper to check if a lesson is locked based on sequential progress
    const isLessonLocked = (moduleIndex: number, lessonIndex: number) => {
        const module = modules[moduleIndex];
        if (!module.isSequential) return false;

        // 1. Cross-Module Locking: If first lesson, check if previous module is completed
        if (lessonIndex === 0) {
            if (moduleIndex > 0) {
                const prevModule = modules[moduleIndex - 1];
                // Check if ALL items in previous module are completed
                // Note: We assume items have 'status' injected from parent (CourseDashboard)
                const isPrevModuleCompleted = prevModule.items && prevModule.items.every((item: any) => item.status === 'COMPLETADO');

                // If previous module is NOT completed, this lesson is locked
                if (!isPrevModuleCompleted) return true;
            }
            return false; // First module or prev module completed matches
        }

        // 2. Intra-Module Locking: Check previous lesson
        const prevLesson = module.items[lessonIndex - 1];
        return prevLesson.status !== 'COMPLETADO';
    };

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">list_alt</span>
                Contenido del Curso
            </h3>

            {modules.map((module, moduleIndex) => (
                <div key={module.id} className="group rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <details className="group" open={!module.isCollapsed}>
                        <summary className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100/80 transition-colors list-none">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <span className={`material-symbols-outlined ${module.status === 'PUBLICADO' || module.items.every((l: any) => l.status === 'COMPLETADO') ? 'text-green-500 bg-green-50' : 'text-gray-400 bg-gray-100'} rounded-full`}>
                                        {module.items.length > 0 && module.items.every((l: any) => l.status === 'COMPLETADO') ? 'check_circle' : (module.isSequential ? 'radio_button_checked' : 'circle')}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                        {module.name}
                                        {module.status !== 'PUBLICADO' && <span className="text-[10px] uppercase bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Borrador</span>}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">{module.items.length} lecciones • {calculateModuleDuration(module.items)}</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-gray-400 group-open:rotate-180 transition-transform">expand_more</span>
                        </summary>

                        {module.items.length > 0 && (
                            <div className="divide-y divide-gray-100 border-t border-gray-100">
                                {module.items.map((item: any, index: number) => {
                                    const locked = isLessonLocked(moduleIndex, index);

                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex items-center justify-between p-4 transition-colors group/lesson ${locked ? 'bg-slate-50 opacity-70 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
                                            onClick={() => {
                                                if (!locked && (item.type === 'video' || item.type === 'VIDEO') && onVideoClick) {
                                                    onVideoClick(item.id);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded ${locked ? 'bg-slate-100 text-slate-400' :
                                                    item.type === 'video' ? 'bg-blue-100 text-blue-600' :
                                                        item.type === 'reading' ? 'bg-purple-100 text-purple-600' :
                                                            'bg-teal-100 text-teal-600'
                                                    }`}>
                                                    <span className="material-symbols-outlined text-[20px]">
                                                        {locked ? 'lock' : item.icon || (item.type === 'video' ? 'play_arrow' : item.type === 'reading' ? 'article' : 'quiz')}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-semibold transition-colors ${locked ? 'text-slate-400' : 'text-slate-700 group-hover/lesson:text-primary'}`}>
                                                        {item.title}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-xs text-text-muted">
                                                            <span className="material-symbols-outlined text-[14px]">schedule</span> {item.duration || '5 min'}
                                                        </span>
                                                        {item.status === 'EN_CURSO' && !locked && (
                                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase">En Curso</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {item.status === 'COMPLETADO' && !locked && (
                                                <span className="material-symbols-outlined text-green-500 text-[20px]">check</span>
                                            )}
                                            {locked && (
                                                <span className="material-symbols-outlined text-slate-300 text-[20px]">lock</span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        {module.items.length === 0 && (
                            <div className="p-4 text-center text-sm text-gray-400 italic">
                                Este módulo aún no tiene contenido.
                            </div>
                        )}
                    </details>
                </div>
            ))}

            {/* Final Exam Section */}
            {finalExam && finalExam.enabled && (
                <div className={`rounded-xl border border-dashed border-2 flex items-center justify-between p-6 transition-all ${isFinalExamLocked ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-blue-200 shadow-sm'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isFinalExamLocked ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                            <span className="material-symbols-outlined text-[24px]">school</span>
                        </div>
                        <div>
                            <h4 className={`font-bold text-lg ${isFinalExamLocked ? 'text-slate-500' : 'text-slate-900'}`}>
                                Examen Final y Certificación
                            </h4>
                            <p className="text-sm text-slate-500">
                                {isFinalExamLocked
                                    ? lockReason
                                    : '¡Has completado el curso! Presenta el examen final para obtener tu certificado.'}
                            </p>
                        </div>
                    </div>
                    <div>
                        {isFinalExamLocked ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-lg font-medium text-sm">
                                <span className="material-symbols-outlined text-[18px]">lock</span>
                                {finalExam.condition === 'date' ? 'Programado' : 'Bloqueado'}
                            </div>
                        ) : (
                            <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined">description</span>
                                Iniciar Examen
                            </button>
                        )}
                    </div>
                </div>
            )}

            {modules.length === 0 && (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">No hay módulos creados para mostrar en la vista previa.</p>
                </div>
            )}
        </div>
    );
};

export default CourseContentPreview;
