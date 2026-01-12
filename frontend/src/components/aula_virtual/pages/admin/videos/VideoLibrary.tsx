import React, { useState } from 'react';
import AddVideoModal, { VideoData } from './AddVideoModal';
import VideoPreviewModal from './VideoPreviewModal';
import PlayerSettingsModal from './PlayerSettingsModal';
import Swal from 'sweetalert2';
import { useAulaVirtual } from '../../../context/AulaVirtualContext';
import { Video } from '../../../types';

// Mock Stats (Could be derived from context too, but keeping UI simple for now)


const VideoLibrary: React.FC = () => {
    const { videos, addVideo, updateVideo, deleteVideo, courseCategories, users } = useAulaVirtual();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Preview Modal State
    const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Settings Modal State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
    const [editingVideoId, setEditingVideoId] = useState<number | null>(null);

    const handleSaveVideo = (data: VideoData) => {
        // Logic to simulate cloud upload or handle external link
        let storedUrl = data.sourceUrl || '';
        let storedSize = '0 MB';
        let storedDuration = '00:00'; // Default, would need metadata extraction

        if (data.sourceType === 'local' && data.file) {
            // SIMULACION DE SUBIDA A CLOUD
            // En un caso real, aquí iría la lógica de subida a S3/Azure/etc.
            storedUrl = URL.createObjectURL(data.file); // Mock URL for local preview
            storedSize = `${(data.file.size / (1024 * 1024)).toFixed(2)} MB`;
            storedDuration = data.duration || '00:00';
        }

        // Use provided duration (e.g. from local extraction) if available, else keep default
        if (data.duration) {
            storedDuration = data.duration;
        }

        if (editingVideoId) {
            // Update existing video
            updateVideo(editingVideoId, {
                title: data.title,
                description: data.description,
                category: data.category,
                speaker: data.speaker,
                courseName: data.courses[0] || 'Sin asignar',
                associatedCourses: data.courses,
                courseId: undefined, // Logic to find ID if needed
                sourceType: data.sourceType,
                sourceUrl: storedUrl,
                sourceId: data.sourceId,
                duration: storedDuration,
                status: 'LISTO' // Assuming update resets status or keeps it
            } as any); // Partial cast due to simplified types in this view vs full model

            Swal.fire({
                title: 'Actualizado!',
                text: 'La información del video ha sido actualizada.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            // Add new video
            const newVideo: Video = {
                id: Date.now(), // Simple ID generation
                title: data.title,
                description: data.description,
                courseName: data.courses[0] || 'Sin asignar',
                associatedCourses: data.courses,
                category: data.category || 'GENERAL',
                categoryColor: 'bg-blue-100 text-blue-700', // Default color logic
                speaker: data.speaker || 'Desconocido',
                duration: storedDuration,
                date: new Date().toISOString().split('T')[0],
                thumbnail: 'https://img.freepik.com/free-vector/online-tutorials-concept_52683-37480.jpg', // Default
                sourceType: data.sourceType,
                sourceUrl: storedUrl,
                sourceId: data.sourceId,
                status: 'LISTO',
                views: 0,
                size: storedSize
            };
            addVideo(newVideo);
            Swal.fire({
                title: 'Agregado!',
                text: data.sourceType === 'local' ? 'Video subido y registrado exitosamente.' : 'Video registrado exitosamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
        setEditingVideo(null);
        setEditingVideoId(null);
    };

    const handleEditClick = (video: Video) => {
        // Map Database Video to Form VideoData
        const videoData: VideoData = {
            title: video.title,
            description: video.description,
            courses: video.associatedCourses || (video.courseName ? [video.courseName] : []),
            speaker: video.speaker,
            category: video.category,
            specialty: video.specialty || '',
            sourceType: video.sourceType,
            sourceUrl: video.sourceUrl,
            sourceId: video.sourceId,
            duration: video.duration,
            file: null // Files cannot be pre-populated in input[type=file]
        };
        setEditingVideo(videoData);
        setEditingVideoId(video.id);
        setIsAddModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteVideo(id);
                Swal.fire(
                    'Eliminado!',
                    'El video ha sido eliminado.',
                    'success'
                );
            }
        });
    };

    const handleResubirClick = (video: Video) => {
        handleEditClick(video); // Reuse edit logic
    };

    const handleThumbnailClick = (video: Video) => {
        setPreviewVideo(video);
        setIsPreviewOpen(true);
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setEditingVideo(null);
        setEditingVideoId(null);
    }

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter Logic
    const filteredVideos = videos.filter(video => {
        const matchesSearch =
            video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (video.associatedCourses && video.associatedCourses.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())));

        const matchesCategory = selectedCategory ? video.category === selectedCategory : true;

        return matchesSearch && matchesCategory;
    });

    // Stats Calculation
    const totalVideos = videos.length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const uploadsThisMonth = videos.filter(v => {
        const date = new Date(v.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
    const totalViews = videos.reduce((acc, curr) => acc + (curr.views || 0), 0);
    const formattedViews = totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews;

    // Derived Lists for Dropdowns (based on actual content)
    const availableCategories = Array.from(new Set(videos.map(v => v.category))).filter(Boolean);
    const availableSpeakers = Array.from(new Set(videos.map(v => v.speaker))).filter(Boolean);

    // Pagination Logic
    const indexOfLastVideo = currentPage * itemsPerPage;
    const indexOfFirstVideo = indexOfLastVideo - itemsPerPage;
    const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);
    const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="space-y-6">
            {/* Header & Main Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Videoteca de Clases</h2>
                    <p className="text-gray-500 text-sm">Gestiona y organiza las clases grabadas de la plataforma académica.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
                        title="Configurar Reproductores"
                    >
                        <span className="material-symbols-outlined text-[20px]">settings</span>
                        Reproductores
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">upload</span>
                        Subir Nuevo Video
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Videos */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold text-gray-500">Total Videos</span>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <span className="material-symbols-outlined">video_library</span>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-gray-800">{totalVideos}</span>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full mb-1">Activos</span>
                    </div>
                </div>

                {/* Total Views */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold text-gray-500">Vistas Totales</span>
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <span className="material-symbols-outlined">visibility</span>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-gray-800">{formattedViews}</span>
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full mb-1">Global</span>
                    </div>
                </div>

                {/* Uploads This Month */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold text-gray-500">Subidas este mes</span>
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                            <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-gray-800">{uploadsThisMonth}</span>
                        <span className="text-xs font-medium text-gray-500 mb-1">videos recientes</span>
                    </div>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">

                {/* Search Bar */}
                <div className="relative w-full lg:w-96 order-2 lg:order-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">search</span>
                    <input
                        type="text"
                        placeholder="Buscar por título, ponente o curso..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                </div>

                <div className="flex flex-wrap gap-3 w-full lg:w-auto order-1 lg:order-2">
                    <select
                        value={selectedCategory}
                        onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[150px]"
                    >
                        <option value="">Todas las categorías</option>
                        {courseCategories.map((cat: string) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    {(searchTerm || selectedCategory) && (
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedCategory(''); setCurrentPage(1); }}
                            className="p-2 border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Limpiar filtros"
                        >
                            <span className="material-symbols-outlined text-[20px]">filter_alt_off</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Video List Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="min-w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                                <th className="px-6 py-4 font-semibold w-24">ID</th>
                                <th className="px-6 py-4 font-semibold">Miniatura & Título</th>
                                <th className="px-6 py-4 font-semibold">Curso</th>
                                <th className="px-6 py-4 font-semibold">Duración</th>
                                <th className="px-6 py-4 font-semibold">Fecha</th>
                                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentVideos.map((video) => (
                                <tr key={video.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 group/id cursor-pointer" title="Click para copiar ID" onClick={() => {
                                            navigator.clipboard.writeText(video.id.toString());
                                            // Optional: simple toast or visual feedback could be added here
                                        }}>
                                            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200 group-hover/id:bg-blue-50 group-hover/id:text-blue-600 group-hover/id:border-blue-200 transition-colors">
                                                #{video.id}
                                            </span>
                                            <span className="material-symbols-outlined text-[14px] text-gray-400 opacity-0 group-hover/id:opacity-100 transition-opacity">content_copy</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-4">
                                            {/* Clickable Thumbnail */}
                                            <div
                                                className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 border border-gray-200 cursor-pointer shadow-sm group-hover:shadow-md transition-all group-hover:scale-105"
                                                onClick={() => handleThumbnailClick(video)}
                                                title="Ver video"
                                            >
                                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                                        <span className="material-symbols-outlined text-blue-600 text-[20px]">play_arrow</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2">{video.title}</h3>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className={`px-2 py-0.5 rounded flex items-center font-bold ${video.categoryColor}`}>
                                                        {video.category}
                                                    </span>
                                                    <span className="text-gray-500">{video.speaker}</span>
                                                    {video.sourceType === 'local' && (
                                                        <span className="flex items-center text-gray-400" title="Almacenado localmente">
                                                            <span className="material-symbols-outlined text-[14px] ml-1">cloud_done</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{video.courseName}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-gray-700">{video.duration}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-500">{video.date}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={() => handleEditClick(video)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                                title="Editar"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleResubirClick(video)}
                                                className="p-1.5 text-gray-400 hover:text-green-600 rounded transition-colors"
                                                title="Resubir/Actualizar"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">refresh</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(video.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                                                title="Eliminar"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="hidden">
                            <tr><td>Foot</td></tr>
                        </tfoot>

                    </table>
                </div>

                {/* Pagination Section */}
                {filteredVideos.length > 0 && (
                    <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                        <span className="text-sm text-gray-500">
                            Mostrando <span className="font-semibold text-gray-700">{indexOfFirstVideo + 1} a {Math.min(indexOfLastVideo, filteredVideos.length)}</span> de <span className="font-semibold text-gray-700">{filteredVideos.length}</span> videos
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                <button
                                    key={number}
                                    onClick={() => handlePageChange(number)}
                                    className={`px-3 py-1 rounded-md text-sm font-semibold ${currentPage === number
                                        ? 'bg-blue-600 text-white'
                                        : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {number}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <AddVideoModal
                isOpen={isAddModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveVideo}
                initialData={editingVideo}
            />

            <VideoPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                video={previewVideo}
            />

            <PlayerSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
};

export default VideoLibrary;
