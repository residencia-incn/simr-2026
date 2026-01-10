import React, { useState } from 'react';

// Mock Data
const MOCK_COURSES = [
    { id: 1, title: 'Diplomado en Neurología Clínica', videos: 24, icon: 'school', color: 'bg-blue-100 text-blue-600' },
    { id: 2, title: 'Maestría en Stroke', videos: 18, icon: 'neurology', color: 'bg-indigo-100 text-indigo-600' },
    { id: 3, title: 'Neuropsicología Básica', videos: 12, icon: 'psychology', color: 'bg-green-100 text-green-600' },
    { id: 4, title: 'Actualización Farmacológica 2023', videos: 9, icon: 'science', color: 'bg-purple-100 text-purple-600' },
    { id: 5, title: 'Trastornos del Movimiento', videos: 15, icon: 'accessibility_new', color: 'bg-orange-100 text-orange-600' },
];

const MOCK_COURSE_VIDEOS = [
    {
        id: 101,
        module: 'MÓDULO 1',
        status: 'PUBLICADO',
        statusColor: 'bg-green-100 text-green-700',
        title: 'Introducción a la Epilepsia Refractaria',
        author: 'Dr. Alejandro Ruiz',
        date: '12 Oct 2023',
        duration: '45:12',
        thumbnail: 'https://img.freepik.com/free-photo/brain-scan-x-ray_53876-88746.jpg'
    },
    {
        id: 102,
        module: 'MÓDULO 2',
        status: 'BORRADOR',
        statusColor: 'bg-yellow-100 text-yellow-700',
        title: 'Seminario: Neuroimagen en Crisis Epilépticas',
        author: 'Dra. Elena Martínez',
        date: '15 Oct 2023',
        duration: '1:02:45',
        thumbnail: 'https://img.freepik.com/free-photo/doctor-explaining-diagnosis_23-2148761405.jpg'
    },
    {
        id: 103,
        module: 'MÓDULO 3',
        status: 'PUBLICADO',
        statusColor: 'bg-green-100 text-green-700',
        title: 'Tratamiento Farmacológico Inicial',
        author: 'Dr. Roberto Gómez',
        date: '20 Oct 2023',
        duration: '38:20',
        thumbnail: 'https://img.freepik.com/free-vector/video-player-template-flat-style_23-2147775537.jpg'
    }
];

const CourseVideoManager: React.FC = () => {
    const [selectedCourse, setSelectedCourse] = useState(MOCK_COURSES[0]);

    return (
        <div className="flex h-full gap-6">
            {/* Sidebar - Course List */}
            <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Filtrar cursos..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {MOCK_COURSES.map((course) => (
                        <button
                            key={course.id}
                            onClick={() => setSelectedCourse(course)}
                            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedCourse.id === course.id ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50 border border-transparent'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${course.color}`}>
                                <span className="material-symbols-outlined">{course.icon}</span>
                            </div>
                            <div>
                                <h3 className={`text-sm font-semibold ${selectedCourse.id === course.id ? 'text-blue-900' : 'text-gray-700'}`}>
                                    {course.title}
                                </h3>
                                <p className="text-xs text-gray-500">{course.videos} Videos asociados</p>
                            </div>
                            {selectedCourse.id === course.id && (
                                <div className="ml-auto w-1 h-8 bg-blue-500 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content - Video List */}
            <div className="flex-1 flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{selectedCourse.title}</h2>
                        <p className="text-sm text-gray-500">Lista de videos por orden de visualización</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-200" title="Descargar lista">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                        </button>
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-200" title="Configuración">
                            <span className="material-symbols-outlined text-[20px]">settings</span>
                        </button>
                    </div>
                </div>

                {/* Video List */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {/* Add New Button */}
                    <div className="flex justify-end mb-6">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                            <span className="material-symbols-outlined text-[18px]">add_to_queue</span>
                            Asociar nuevo video a este curso
                        </button>
                    </div>

                    <div className="space-y-4">
                        {MOCK_COURSE_VIDEOS.map((video) => (
                            <div key={video.id} className="bg-white border border-gray-200 rounded-lg p-1 flex items-center group hover:shadow-md transition-shadow">
                                {/* Drag Handle */}
                                <div className="px-3 cursor-grab text-gray-300 hover:text-gray-500">
                                    <span className="material-symbols-outlined">drag_indicator</span>
                                </div>

                                {/* Thumbnail */}
                                <div className="relative w-40 h-24 rounded-md overflow-hidden flex-shrink-0 bg-black">
                                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-90" />
                                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1 rounded">
                                        {video.duration}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 px-4 py-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">{video.module}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${video.statusColor}`}>
                                            {video.status}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-1">{video.title}</h3>
                                    <p className="text-xs text-gray-500">Subido por: {video.author} • {video.date}</p>
                                </div>

                                {/* Actions */}
                                <div className="px-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                    <button className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Drop Zone */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors cursor-pointer min-h-[150px]">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3 text-gray-500">
                                <span className="material-symbols-outlined text-[24px]">add</span>
                            </div>
                            <span className="font-medium text-sm">Arrastra videos aquí o haz clic para añadir</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseVideoManager;
