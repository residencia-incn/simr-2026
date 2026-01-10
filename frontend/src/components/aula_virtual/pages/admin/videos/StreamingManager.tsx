import React, { useState } from 'react';

// Mock Data
const MOCK_COURSES = [
    { id: 1, title: 'Diplomado en Neurología Clínica', streams: 2, status: 'Active' },
    { id: 2, title: 'Maestría en Stroke y ACV', streams: 1, status: 'Scheduled' },
    { id: 3, title: 'Actualización en Epilepsia 2024', streams: 0, status: 'Finished' },
    { id: 4, title: 'Neurooncología Avanzada', streams: 0, status: 'None' },
];

const StreamingManager: React.FC = () => {
    const [selectedCourse, setSelectedCourse] = useState(MOCK_COURSES[0]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestión de Streamings</h2>
                    <p className="text-gray-500 text-sm">Configura y programa las transmisiones en vivo por curso.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    Programar Nueva Transmisión
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <span className="text-sm font-semibold text-gray-500 mb-2 block">Transmisiones Hoy</span>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold text-gray-800">4</span>
                        <div className="text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-600 animate-pulse">
                            EN VIVO AHORA
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <span className="text-sm font-semibold text-gray-500 mb-2 block">Total Espectadores</span>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold text-gray-800">1,842</span>
                        <span className="text-xs font-bold text-green-600">+24%</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <span className="text-sm font-semibold text-gray-500 mb-2 block">Tasa de Retención</span>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold text-gray-800">78%</span>
                        <span className="text-xs font-medium text-gray-400">Promedio</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <span className="text-sm font-semibold text-gray-500 mb-2 block">Uptime del Servicio</span>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold text-gray-800">99.9%</span>
                        <div className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> OPTIMO
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-gray-400">school</span>
                            Seleccionar Curso
                        </h3>
                        <div className="space-y-1">
                            {MOCK_COURSES.map(course => (
                                <button
                                    key={course.id}
                                    onClick={() => setSelectedCourse(course)}
                                    className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${selectedCourse.id === course.id
                                            ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                                            : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span>{course.title}</span>
                                    </div>
                                    {course.streams > 0 && (
                                        <span className="text-xs text-blue-500 mt-1 block">{course.streams} transmisiones</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-6">
                    {/* Section Header */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                <span className="material-symbols-outlined">slideshow</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Sesiones de Streaming</h3>
                                <p className="text-xs text-gray-500">Filtrado por: {selectedCourse.title}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Descargar Reporte</button>
                            <button className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm hover:bg-blue-100 font-medium">Configuración Global</button>
                        </div>
                    </div>

                    {/* Active Session */}
                    <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-blue-50/30">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 uppercase tracking-wide">En Línea</span>
                                <span className="text-xs text-gray-500">Iniciado: Hoy, 18:00 (GMT-5)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-sm">Espectadores actuales:</span>
                                <span className="font-bold text-lg text-gray-900">412</span>
                            </div>
                        </div>
                        <div className="p-6 flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Sesión 4: Manejo de Crisis Convulsivas en Emergencias</h3>
                                <p className="text-gray-500 mb-6 text-sm">Ponente: Dr. Alejandro Ruiz</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Servidor de Origen</span>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px] text-gray-400">cloud_queue</span>
                                            <span className="text-sm font-medium">Cloudflare Stream</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Stream Key</span>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-mono text-gray-600">••••••••482x</span>
                                            <button className="text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined text-[16px]">content_copy</span></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 justify-center min-w-[200px]">
                                <button className="w-full py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">settings</span>
                                    Configuración Técnica
                                </button>
                                <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">analytics</span>
                                    Ver Analíticas
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Scheduled Session */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase tracking-wide">Programada</span>
                                <span className="text-xs text-gray-500">Fecha: 24 Oct, 19:00 (GMT-5)</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Sesión 5: Avances en Terapia Génica Neuromuscular</h3>
                            <p className="text-gray-500 text-sm mb-4">Ponente: Dra. Elena Martínez</p>

                            <div className="flex gap-4">
                                <div className="bg-gray-50 px-3 py-2 rounded border border-gray-200 flex-1 max-w-xs">
                                    <span className="text-xs text-gray-500 block">URL de destino</span>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="material-symbols-outlined text-[14px] text-gray-400">link</span>
                                        <span className="text-xs text-blue-600 truncate">https://vimeo.com/event/992...</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-3 py-2 rounded border border-gray-200 flex-1 max-w-xs">
                                    <span className="text-xs text-gray-500 block">Plataforma</span>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[14px] text-gray-400">videocam</span>
                                        <span className="text-xs text-gray-700">Vimeo Live</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 min-w-[200px]">
                            <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm">Editar Detalles</button>
                            <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 text-sm flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                                Reprogramar
                            </button>
                            <button className="text-right text-xs text-red-500 hover:underline mt-1 font-medium">CANCELAR TRANSMISIÓN</button>
                        </div>
                    </div>

                    {/* Finished Session */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-600 uppercase tracking-wide">Finalizado</span>
                                <span className="text-xs text-gray-500">Realizado: 15 Oct, 2023</span>
                            </div>
                            <h3 className="font-bold text-gray-700">Sesión 3: Fundamentos de Neuroimagen</h3>
                            <p className="text-xs text-gray-500 mt-1">Grabación disponible en videoteca automáticamente.</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600 tooltip" title="Estadísticas">
                                <span className="material-symbols-outlined">bar_chart</span>
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 tooltip" title="Ver grabación">
                                <span className="material-symbols-outlined">movie</span>
                            </button>
                        </div>
                    </div>

                    {/* Add New Placeholder */}
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                        <span className="material-symbols-outlined text-gray-300 text-[40px] mb-2">add</span>
                        <h3 className="font-bold text-gray-700">¿Necesitas una sesión adicional?</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-4">Puedes añadir transmisiones extraordinarias o de soporte para este curso en cualquier momento.</p>
                        <button className="text-blue-600 font-medium text-sm hover:underline">Añadir sesión extra</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StreamingManager;
