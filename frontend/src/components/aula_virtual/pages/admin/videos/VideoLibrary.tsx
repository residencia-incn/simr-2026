import React, { useState } from 'react';

// Mock Data
const MOCK_STATS = [
    { label: 'Total Videos', value: '1,284', trend: '+12%', color: 'text-green-500' },
    { label: 'Espacio Utilizado', value: '420 GB', sub: '84% cap.', color: 'text-green-500' },
    { label: 'Vistas Totales', value: '45.2k', trend: '+18%', color: 'text-green-500' },
    { label: 'Subidas este mes', value: '28', sub: 'Reciente', color: 'text-blue-500' },
];

const MOCK_VIDEOS = [
    {
        id: 1,
        title: 'Introducción a la Epilepsia Refractaria',
        category: 'EPILEPSIA',
        categoryColor: 'bg-indigo-100 text-indigo-700',
        speaker: 'Dr. Ruiz',
        course: 'Diplomado en Neurología Clínica',
        duration: '45:12',
        date: '12 Oct 2023',
        thumbnail: 'https://img.freepik.com/free-photo/brain-scan-x-ray_53876-88746.jpg'
    },
    {
        id: 2,
        title: 'Manejo Agudo del ACV Isquémico',
        category: 'VASCULAR',
        categoryColor: 'bg-purple-100 text-purple-700',
        speaker: 'Dra. Elena M.',
        course: 'Maestría en Stroke',
        duration: '1:02:45',
        date: '08 Oct 2023',
        thumbnail: 'https://img.freepik.com/free-photo/doctor-explaining-diagnosis_23-2148761405.jpg'
    },
    {
        id: 3,
        title: 'Farmacología de Nuevos Antiepilépticos',
        category: 'FARMACIA',
        categoryColor: 'bg-green-100 text-green-700',
        speaker: 'Dr. Roberto G.',
        course: 'Actualización Farmacológica 2023',
        duration: '38:20',
        date: '05 Oct 2023',
        thumbnail: 'https://img.freepik.com/free-vector/video-player-template-flat-style_23-2147775537.jpg'
    }
];

const VideoLibrary: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="space-y-6">
            {/* Header & Main Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Videoteca de Clases</h2>
                    <p className="text-gray-500 text-sm">Gestiona y organiza las clases grabadas de la plataforma académica.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">upload</span>
                    Subir Nuevo Video
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {MOCK_STATS.map((stat, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-32">
                        <span className="text-sm font-semibold text-gray-500">{stat.label}</span>
                        <div className="flex items-end justify-between">
                            <span className="text-3xl font-bold text-gray-800">{stat.value}</span>
                            <div className={`text-xs font-bold px-2 py-1 rounded-full bg-opacity-10 ${stat.trend ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {stat.trend || stat.sub}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                        <option>Todas las categorías</option>
                        <option>Epilepsia</option>
                        <option>Vascular</option>
                        <option>Farmacia</option>
                    </select>
                    <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                        <option>Todos los Ponentes</option>
                        <option>Dr. Ruiz</option>
                        <option>Dra. Elena</option>
                    </select>
                    <button className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50" title="Filtros avanzados">
                        <span className="material-symbols-outlined text-[20px]">filter_list</span>
                    </button>
                    <button className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50" title="Descargar reporte">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                </div>
                <button className="w-full md:w-auto px-4 py-2 bg-blue-600/10 text-blue-700 font-medium rounded-lg hover:bg-blue-600/20 transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">link</span>
                    Nueva Carga Externa
                </button>
            </div>

            {/* Video List Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="min-w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                                <th className="px-6 py-4 font-semibold">Miniatura & Título</th>
                                <th className="px-6 py-4 font-semibold">Curso</th>
                                <th className="px-6 py-4 font-semibold">Duración</th>
                                <th className="px-6 py-4 font-semibold">Fecha</th>
                                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {MOCK_VIDEOS.map((video) => (
                                <tr key={video.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-4">
                                            <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 border border-gray-200">
                                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2">{video.title}</h3>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className={`px-2 py-0.5 rounded flex items-center font-bold ${video.categoryColor}`}>
                                                        {video.category}
                                                    </span>
                                                    <span className="text-gray-500">{video.speaker}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{video.course}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-gray-700">{video.duration}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-500">{video.date}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors" title="Editar">
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            <button className="p-1.5 text-gray-400 hover:text-green-600 rounded transition-colors" title="Recargar/Actualizar">
                                                <span className="material-symbols-outlined text-[18px]">refresh</span>
                                            </button>
                                            <button className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors" title="Eliminar">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Section */}
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                    <span className="text-sm text-gray-500">
                        Mostrando <span className="font-semibold text-gray-700">1 a 3</span> de <span className="font-semibold text-gray-700">1,284</span> videos
                    </span>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">Anterior</button>
                        <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-semibold">1</button>
                        <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">2</button>
                        <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">Siguiente</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoLibrary;
