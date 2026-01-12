import React, { useState, useEffect } from 'react';
import { useAulaVirtual } from '../../../context/AulaVirtualContext';
import { Video } from '../../../types';
import AddVideoModal, { VideoData } from './AddVideoModal';
import VideoPreviewModal from './VideoPreviewModal';
import VideoImportModal from './VideoImportModal';
import Swal from 'sweetalert2';

const CourseVideoManager: React.FC = () => {
    const { courses, videos, addVideo, updateVideo, deleteVideo, users, courseCategories } = useAulaVirtual();

    // Left Sidebar State
    const [selectedCourse, setSelectedCourse] = useState<any>(null); // Course type might need definition
    const [searchCourseTerm, setSearchCourseTerm] = useState('');

    // Modal & Video Management State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
    const [editingVideoId, setEditingVideoId] = useState<number | null>(null);

    // Preview Modal State
    const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Initialize selected course
    useEffect(() => {
        if (!selectedCourse && courses.length > 0) {
            setSelectedCourse(courses[0]);
        }
    }, [courses]);

    // Derived Lists
    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchCourseTerm.toLowerCase())
    );

    const courseVideos = selectedCourse
        ? videos.filter(v => v.courseName === selectedCourse.title || v.associatedCourses?.includes(selectedCourse.title))
        : [];

    // Handlers
    const handleCourseSelect = (course: any) => {
        setSelectedCourse(course);
    };

    const handleAddClick = () => {
        if (!selectedCourse) return;

        // Pre-fill course name
        const initialData: VideoData = {
            title: '',
            description: '',
            courses: [selectedCourse.title],
            speaker: '',
            category: '',
            specialty: '',
            sourceType: 'local',
            sourceUrl: '',
            sourceId: '',
            duration: '',
            file: null
        };
        setEditingVideo(initialData);
        setEditingVideoId(null);
        setIsAddModalOpen(true);
    };

    const handleEditClick = (video: Video) => {
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
            file: null
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
                Swal.fire('Eliminado!', 'El video ha sido eliminado.', 'success');
            }
        });
    };

    const handleSaveVideo = (data: VideoData) => {
        let storedUrl = data.sourceUrl || '';
        let storedSize = '0 MB';
        let storedDuration = data.duration || '00:00';

        if (data.sourceType === 'local' && data.file) {
            storedUrl = URL.createObjectURL(data.file);
            storedSize = `${(data.file.size / (1024 * 1024)).toFixed(2)} MB`;
        }

        if (editingVideoId) {
            updateVideo(editingVideoId, {
                title: data.title,
                description: data.description,
                category: data.category,
                speaker: data.speaker,
                courseName: data.courses[0] || selectedCourse?.title,
                associatedCourses: data.courses,
                sourceType: data.sourceType,
                sourceUrl: storedUrl,
                sourceId: data.sourceId,
                duration: storedDuration,
                status: 'LISTO'
            } as any);

            Swal.fire({
                title: 'Actualizado!',
                text: 'Video actualizado correctamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            const newVideo: Video = {
                id: Date.now(),
                title: data.title,
                description: data.description,
                courseName: data.courses[0] || selectedCourse?.title || 'Sin asignar',
                associatedCourses: data.courses,
                category: data.category || 'GENERAL',
                categoryColor: 'bg-blue-100 text-blue-700',
                speaker: data.speaker || 'Desconocido',
                duration: storedDuration,
                date: new Date().toISOString().split('T')[0],
                thumbnail: 'https://img.freepik.com/free-vector/online-tutorials-concept_52683-37480.jpg',
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
                text: 'Video añadido al curso correctamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
        setIsAddModalOpen(false);
        setEditingVideo(null);
        setEditingVideoId(null);
    };

    const handleImportVideos = (selectedIds: number[]) => {
        if (!selectedCourse) return;

        selectedIds.forEach(id => {
            const video = videos.find(v => v.id === id);
            if (video) {
                const currentCourses = video.associatedCourses || (video.courseName ? [video.courseName] : []);
                if (!currentCourses.includes(selectedCourse.title)) {
                    // Update video with new course association
                    updateVideo(id, {
                        ...video,
                        associatedCourses: [...currentCourses, selectedCourse.title],
                        // Ensure legacy field is somewhat consistent if needed, or leave as original
                        // We do NOT change 'courseName' (primary) if it's already set, unless we want to move it.
                        // Here we just ADD association.
                    } as any);
                }
            }
        });

        Swal.fire({
            title: 'Videos Importados',
            text: `${selectedIds.length} video(s) han sido asociados a ${selectedCourse.title}.`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    };

    const handleThumbnailClick = (video: Video) => {
        setPreviewVideo(video);
        setIsPreviewOpen(true);
    };

    return (
        <div className="flex flex-col lg:flex-row h-full gap-6">
            {/* Sidebar - Course List */}
            <div className="w-full lg:w-80 flex-shrink-0 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden h-96 lg:h-full">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Filtrar cursos..."
                            value={searchCourseTerm}
                            onChange={(e) => setSearchCourseTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredCourses.map((course) => {
                        const isSelected = selectedCourse?.id === course.id;
                        // Count videos for this course
                        const videoCount = videos.filter(v => v.courseName === course.title).length;

                        return (
                            <button
                                key={course.id}
                                onClick={() => handleCourseSelect(course)}
                                className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${isSelected ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50 border border-transparent'}`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-100 text-indigo-600`}>
                                    <span className="material-symbols-outlined">school</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                        {course.title}
                                    </h3>
                                    <p className="text-xs text-gray-500">{videoCount} Videos asociados</p>
                                </div>
                                {isSelected && (
                                    <div className="ml-2 w-1 h-8 bg-blue-500 rounded-full flex-shrink-0" />
                                )}
                            </button>
                        );
                    })}
                    {filteredCourses.length === 0 && (
                        <div className="p-4 text-center text-gray-500 text-sm">No se encontraron cursos.</div>
                    )}
                </div>
            </div>

            {/* Main Content - Video List */}
            <div className="flex-1 flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden min-h-[500px]">
                {selectedCourse ? (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{selectedCourse.title}</h2>
                                <p className="text-sm text-gray-500">Lista de videos por orden de visualización</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsImportModalOpen(true)}
                                    className="bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">link</span>
                                    Importar Video
                                </button>
                                <button
                                    onClick={handleAddClick}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    Nuevo Video
                                </button>
                            </div>
                        </div>

                        {/* Video List */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                            <div className="space-y-4">
                                {courseVideos.length > 0 ? (
                                    courseVideos.map((video) => (
                                        <div key={video.id} className="bg-white border border-gray-200 rounded-lg p-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 group hover:shadow-md transition-shadow">
                                            {/* Drag Handle (Visual only for now) */}
                                            <div className="hidden sm:block px-2 cursor-grab text-gray-300 hover:text-gray-500">
                                                <span className="material-symbols-outlined">drag_indicator</span>
                                            </div>

                                            {/* Thumbnail */}
                                            <div
                                                className="relative w-full sm:w-40 h-24 rounded-md overflow-hidden flex-shrink-0 cursor-pointer bg-gray-900"
                                                onClick={() => handleThumbnailClick(video)}
                                            >
                                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <span className="material-symbols-outlined text-white text-[24px]">play_circle</span>
                                                </div>
                                                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1 rounded">
                                                    {video.duration}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${video.categoryColor || 'bg-gray-100 text-gray-600'}`}>
                                                        {video.category}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-gray-500 border border-gray-200 px-1.5 rounded-sm">
                                                        {video.status || 'LISTO'}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-gray-800 mb-1 truncate" title={video.title}>{video.title}</h3>
                                                <p className="text-xs text-gray-500 truncate">
                                                    Ponente: {video.speaker} • Fecha: {video.date}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex sm:flex-col gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-auto sm:ml-0">
                                                <button
                                                    onClick={() => handleEditClick(video)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(video.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                                                    title="Eliminar"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="material-symbols-outlined text-[32px] text-gray-400">videocam_off</span>
                                        </div>
                                        <p className="font-medium">No hay videos asociados a este curso.</p>
                                        <p className="text-sm mt-1">Haz clic en "Asociar nuevo video" para comenzar.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">school</span>
                        <p>Selecciona un curso para gestionar sus videos</p>
                    </div>
                )}
            </div>

            <AddVideoModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSaveVideo}
                initialData={editingVideo}
                forcedCourseName={selectedCourse?.title}
            />

            <VideoImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportVideos}
                currentCourseTitle={selectedCourse?.title || ''}
                availableVideos={selectedCourse ? videos.filter(v =>
                    v.courseName !== selectedCourse.title &&
                    (!v.associatedCourses || !v.associatedCourses.includes(selectedCourse.title))
                ) : []}
            />

            <VideoPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                video={previewVideo}
            />
        </div>
    );
};

export default CourseVideoManager;
