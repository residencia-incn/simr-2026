import React, { useState, useEffect } from 'react';
import { useAulaVirtual } from '../../../context/AulaVirtualContext';
import SpeakerSelectorModal from './SpeakerSelectorModal';

const CourseMultiSelect = ({ options, selectedValues, onChange, lockedValues = [] }: {
    options: { id: number | string, title: string }[],
    selectedValues: string[],
    onChange: (values: string[]) => void,
    lockedValues?: string[]
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (title: string) => {
        if (lockedValues.includes(title)) return;
        if (selectedValues.includes(title)) {
            onChange(selectedValues.filter(v => v !== title));
        } else {
            onChange([...selectedValues, title]);
        }
    };

    return (
        <div className="relative">
            <div
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 bg-white min-h-[42px] flex flex-wrap gap-2 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedValues.length === 0 && <span className="text-gray-400">Seleccionar Cursos...</span>}
                {selectedValues.map(val => (
                    <span key={val} className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${lockedValues.includes(val) ? 'bg-gray-100 text-gray-500 border border-gray-200' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                        {val}
                        {!lockedValues.includes(val) && (
                            <span
                                className="material-symbols-outlined text-[14px] hover:text-blue-900 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); toggleOption(val); }}
                            >close</span>
                        )}
                        {lockedValues.includes(val) && <span className="material-symbols-outlined text-[14px]">lock</span>}
                    </span>
                ))}
                <div className="ml-auto flex items-center text-gray-400">
                    <span className="material-symbols-outlined">{isOpen ? 'expand_less' : 'expand_more'}</span>
                </div>
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {options.map(opt => (
                            <div
                                key={opt.id}
                                className={`px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 ${selectedValues.includes(opt.title) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                                onClick={() => toggleOption(opt.title)}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedValues.includes(opt.title) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                    {selectedValues.includes(opt.title) && <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>}
                                </div>
                                <span className="text-sm">{opt.title}</span>
                                {lockedValues.includes(opt.title) && <span className="material-symbols-outlined text-[14px] text-gray-400 ml-auto">lock</span>}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export type VideoSourceType = 'local' | 'youtube' | 'vimeo' | 'gdrive' | 'bunny' | 'cloudflare';

export interface VideoData {
    title: string;
    description: string;
    courses: string[];
    speaker: string;
    category: string;
    specialty: string;
    sourceType: VideoSourceType;
    sourceUrl?: string;
    sourceId?: string;
    duration?: string;
    file?: File | null;
}

const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getVideoDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            resolve(formatDuration(video.duration));
        };
        video.onerror = () => resolve('00:00');
        video.src = window.URL.createObjectURL(file);
    });
};

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

const getYouTubeDuration = (url: string): Promise<string> => {
    return new Promise((resolve) => {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/);
        const videoId = match ? match[1] : null;

        if (!videoId) {
            resolve('00:00');
            return;
        }

        if (!window.YT || !window.YT.Player) {
            // Load API if not present
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

            // Wait for API (polled for simplicity in this context, or global callback)
            const checkYT = setInterval(() => {
                if (window.YT && window.YT.Player) {
                    clearInterval(checkYT);
                    createPlayer();
                }
            }, 100);
        } else {
            createPlayer();
        }

        function createPlayer() {
            const container = document.createElement('div');
            container.style.display = 'none';
            document.body.appendChild(container);

            const player = new window.YT.Player(container, {
                videoId: videoId,
                events: {
                    'onReady': (event: any) => {
                        const duration = event.target.getDuration();
                        resolve(formatDuration(duration));
                        document.body.removeChild(player.getIframe()); // Cleanup
                    },
                    'onError': () => {
                        resolve('00:00');
                        if (document.body.contains(player.getIframe())) {
                            document.body.removeChild(player.getIframe());
                        }
                    }
                }
            });
        }
    });
};

interface AddVideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: VideoData) => void;
    initialData?: VideoData | null;
    forcedCourseName?: string;
}

const AddVideoModal: React.FC<AddVideoModalProps> = ({ isOpen, onClose, onSave, initialData, forcedCourseName }) => {
    // Hooks
    const { courses, courseCategories, specialties, users } = useAulaVirtual();

    // State
    const [step, setStep] = useState<1 | 2>(1);
    const [formData, setFormData] = useState<VideoData>({
        title: '',
        description: '',
        courses: [],
        speaker: '',
        category: '',
        specialty: '',
        sourceType: 'local',
        sourceUrl: '',
        sourceId: '',
        duration: '',
        file: null
    });
    const [dragActive, setDragActive] = useState(false);
    const [showSpeakerModal, setShowSpeakerModal] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Map legacy 'course' to 'courses' if needed, or use existing 'courses'
                const existingCourses = (initialData as any).courses || ((initialData as any).course ? [(initialData as any).course] : []);
                // Ensure forced course is included if editing (less likely to force on edit, but safe)
                const mergedCourses = forcedCourseName && !existingCourses.includes(forcedCourseName)
                    ? [...existingCourses, forcedCourseName]
                    : existingCourses;

                setFormData({
                    ...initialData,
                    courses: mergedCourses
                });
                // Only jump to details (Step 2) if we truly have source content (Edit Mode)
                if (initialData.sourceUrl || initialData.file) {
                    setStep(2);
                } else {
                    setStep(1);
                }
            } else {
                // New Entry
                const defaultCourses = forcedCourseName ? [forcedCourseName] : [];
                setStep(1);
                setFormData({
                    title: '',
                    description: '',
                    courses: defaultCourses,
                    speaker: '',
                    category: '',
                    specialty: '',
                    sourceType: 'local',
                    sourceUrl: '',
                    sourceId: '',
                    duration: '',
                    file: null
                });
            }
        }
    }, [isOpen, initialData, forcedCourseName]);

    useEffect(() => {
        if (formData.speaker) {
            const speakerUser = users.find(u => u.name === formData.speaker);
            if (speakerUser && speakerUser.specialty) {
                setFormData(prev => ({ ...prev, specialty: speakerUser.specialty || '' }));
            }
        }
    }, [formData.speaker, users]);

    useEffect(() => {
        if (formData.sourceType === 'youtube' && formData.sourceUrl) {
            const timer = setTimeout(async () => {
                const duration = await getYouTubeDuration(formData.sourceUrl!);
                if (duration !== '00:00') {
                    setFormData(prev => ({ ...prev, duration }));
                }
            }, 1000); // 1s debounce to avoid rapid API calls
            return () => clearTimeout(timer);
        }
    }, [formData.sourceType, formData.sourceUrl]);

    if (!isOpen) return null;

    const handleChange = (field: keyof VideoData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = async (file: File) => {
        handleChange('file', file);
        if (file.type.startsWith('video/')) {
            const duration = await getVideoDuration(file);
            handleChange('duration', duration);
        }
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleSave = () => {
        // Validation logic here
        if (!formData.title || formData.courses.length === 0) return; // Basic validation
        onSave(formData);
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">
                                {initialData ? 'Editar Video' : (step === 1 ? 'Seleccionar Origen del Video' : 'Detalles del Video')}
                            </h3>
                            <p className="text-sm text-text-muted mt-0.5">
                                {initialData ? 'Modifica los detalles del video existente' : (step === 1 ? 'Elige cómo quieres agregar el video a la plataforma' : 'Completa la información básica')}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {step === 1 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Local Upload */}
                                <button
                                    onClick={() => { handleChange('sourceType', 'local'); setStep(2); }}
                                    className="group p-4 border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-xl flex flex-col items-center gap-3 transition-all hover:bg-blue-50/30 text-center"
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-[24px]">upload_file</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">Subir Archivo</h4>
                                        <p className="text-xs text-gray-500 mt-1">MP4, MOV hasta 2GB</p>
                                    </div>
                                </button>

                                {/* External URL */}
                                <button
                                    onClick={() => { handleChange('sourceType', 'youtube'); setStep(2); }}
                                    className="group p-4 border border-gray-200 hover:border-red-500 rounded-xl flex flex-col items-center gap-3 transition-all hover:bg-red-50/30 text-center shadow-sm hover:shadow-md"
                                >
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-[24px]">smart_display</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">Enlace Externo</h4>
                                        <p className="text-xs text-gray-500 mt-1">YouTube, Vimeo, Drive</p>
                                    </div>
                                </button>

                                {/* CDN Integration */}
                                <button
                                    onClick={() => { handleChange('sourceType', 'bunny'); setStep(2); }}
                                    className="group p-4 border border-gray-200 hover:border-orange-500 rounded-xl flex flex-col items-center gap-3 transition-all hover:bg-orange-50/30 text-center shadow-sm hover:shadow-md"
                                >
                                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-[24px]">cloud_sync</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">Integración CDN</h4>
                                        <p className="text-xs text-gray-500 mt-1">Bunny.net, Cloudflare</p>
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Source specific inputs */}
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        {!initialData && (
                                            <button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline flex items-center">
                                                <span className="material-symbols-outlined text-[16px] mr-1">arrow_back</span>
                                                Cambiar Origen
                                            </button>
                                        )}
                                        {!initialData && <span className="text-gray-300">|</span>}
                                        <span className="text-sm font-semibold text-blue-800 uppercase tracking-wider">{formData.sourceType}</span>
                                    </div>

                                    {formData.sourceType === 'local' && (
                                        <div
                                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-100/50' : 'border-gray-300 hover:border-blue-400'}`}
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleFileDrop}
                                        >
                                            <input
                                                type="file"
                                                className="hidden"
                                                id="video-upload"
                                                accept="video/*"
                                                onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                                            />
                                            <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                                {formData.file ? (
                                                    <>
                                                        <span className="material-symbols-outlined text-[32px] text-green-500">check_circle</span>
                                                        <span className="font-medium text-gray-700">{formData.file.name}</span>
                                                        <span className="text-xs text-gray-500">{(formData.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-[32px] text-gray-400">cloud_upload</span>
                                                        <span className="font-medium text-gray-700">Arrastra tu video aquí o haz clic para buscar</span>
                                                        <span className="text-xs text-gray-500">Formatos soportados: MP4, MOV, AVI</span>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    )}

                                    {(formData.sourceType === 'youtube' || formData.sourceType === 'vimeo' || formData.sourceType === 'gdrive') && (
                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-gray-700">URL del Video</label>
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">link</span>
                                                    <input
                                                        type="text"
                                                        value={formData.sourceUrl}
                                                        onChange={(e) => handleChange('sourceUrl', e.target.value)}
                                                        placeholder="https://youtube.com/watch?v=..."
                                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    />
                                                </div>
                                                <select
                                                    value={formData.sourceType}
                                                    onChange={(e) => handleChange('sourceType', e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                                >
                                                    <option value="youtube">YouTube</option>
                                                    <option value="vimeo">Vimeo</option>
                                                    <option value="gdrive">Google Drive</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {(formData.sourceType === 'bunny' || formData.sourceType === 'cloudflare') && (
                                        <div className="space-y-3">
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Video ID / GUID</label>
                                                    <input
                                                        type="text"
                                                        value={formData.sourceId}
                                                        onChange={(e) => handleChange('sourceId', e.target.value)}
                                                        placeholder="Ej: 1234-5678-..."
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    />
                                                </div>
                                                <div className="w-1/3">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                                                    <select
                                                        value={formData.sourceType}
                                                        onChange={(e) => handleChange('sourceType', e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                                    >
                                                        <option value="bunny">Bunny.net</option>
                                                        <option value="cloudflare">Cloudflare Stream</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Common Metadata */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Título del Video</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => handleChange('title', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                placeholder="Ej: Metodología de la Investigación Clínica"
                                            />
                                            <div className="w-24 group relative">
                                                <input
                                                    type="text"
                                                    value={formData.duration || ''}
                                                    readOnly
                                                    placeholder="00:00"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-center text-gray-500 text-sm cursor-help"
                                                />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                                    Duración detectada
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cursos Asociados</label>
                                        <CourseMultiSelect
                                            options={courses}
                                            selectedValues={formData.courses}
                                            onChange={(vals) => handleChange('courses', vals)}
                                            lockedValues={forcedCourseName ? [forcedCourseName] : []}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {forcedCourseName ? 'Este video debe estar asociado al curso actual.' : 'Puedes asociar el video a múltiples cursos.'}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => handleChange('category', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                        >
                                            <option value="">Seleccionar Categoría...</option>
                                            {courseCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                                        <select
                                            value={formData.specialty}
                                            onChange={(e) => handleChange('specialty', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                        >
                                            <option value="">Seleccionar Especialidad...</option>
                                            {specialties.map(spec => (
                                                <option key={spec} value={spec}>{spec}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ponente</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">person</span>
                                                <input
                                                    type="text"
                                                    value={formData.speaker}
                                                    readOnly
                                                    placeholder="Seleccionar Ponente..."
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-not-allowed"
                                                />
                                            </div>
                                            <button
                                                onClick={() => setShowSpeakerModal(true)}
                                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">search</span>
                                                Buscar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Cancelar
                        </button>
                        {step === 2 && (
                            <button
                                onClick={handleSave}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors"
                            >
                                {initialData ? 'Actualizar Video' : 'Guardar Video'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Speaker Modal */}
            <SpeakerSelectorModal
                isOpen={showSpeakerModal}
                onClose={() => setShowSpeakerModal(false)}
                onSelect={(name) => handleChange('speaker', name)}
            />
        </>
    );
};

export default AddVideoModal;
