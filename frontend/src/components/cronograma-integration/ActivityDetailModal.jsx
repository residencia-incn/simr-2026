import React from 'react';

const ActivityDetailModal = ({ isOpen, onClose, session }) => {
    if (!isOpen || !session) return null;

    // Helper to get category color styling
    const getCategoryStyle = (color) => {
        if (!color) return 'bg-slate-100 text-slate-700 border-slate-200';
        return `bg-${color}-50 text-${color}-700 border-${color}-100 dark:bg-${color}-900/20 dark:text-${color}-300 dark:border-${color}-800`;
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div
                    className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-slate-200 dark:border-slate-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with Category and Close Button */}
                    <div className="relative p-6 pb-0 flex justify-between items-start">
                        <div>
                            {session.category && session.category !== 'GENERAL' && (
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${getCategoryStyle(session.categoryColor)}`}>
                                    {session.category}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            className="rounded-full p-1 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
                            onClick={onClose}
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="px-6 py-4">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-4">
                            {session.title}
                        </h3>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
                            {/* Time */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="size-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-primary">
                                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Horario</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{session.timeStart} - {session.timeEnd}</span>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="size-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-primary">
                                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Ubicación</span>
                                    <div className="flex flex-col">
                                        {session.location && (
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">{session.location}</span>
                                        )}
                                        {session.virtualLocation && (
                                            <span className="font-medium text-blue-600 dark:text-blue-400 text-xs flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">videocam</span>
                                                {session.virtualLocation}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {session.description && (
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary">description</span>
                                    Acerca de la actividad
                                </h4>
                                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <p className="whitespace-pre-wrap font-medium">{session.description}</p>
                                </div>
                            </div>
                        )}

                        {/* Speakers */}
                        {session.speakers && session.speakers.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary">group</span>
                                    {session.speakers.length > 1 ? 'Panel de Expertos' : 'Ponente'}
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {session.speakers.map(speaker => (
                                        <div key={speaker.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div
                                                className="size-12 rounded-full bg-slate-200 dark:bg-slate-700 bg-center bg-cover border-2 border-white dark:border-slate-600 shadow-sm"
                                                style={{ backgroundImage: `url("${speaker.imageUrl || speaker.image}")` }}
                                            ></div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{speaker.name}</div>
                                                <div className="text-xs text-slate-500 font-medium">{speaker.institution || speaker.specialty || 'Ponente Invitado'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end">
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-lg bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 sm:mt-0 sm:w-auto"
                            onClick={onClose}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityDetailModal;
