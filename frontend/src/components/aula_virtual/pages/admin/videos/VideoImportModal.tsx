import React, { useState } from 'react';
import { useAulaVirtual } from '../../../context/AulaVirtualContext';
import { Video } from '../../../types';

interface VideoImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (videoIds: number[]) => void;
    currentCourseTitle: string;
    availableVideos: Video[];
}

const VideoImportModal: React.FC<VideoImportModalProps> = ({ isOpen, onClose, onImport, currentCourseTitle, availableVideos }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVideoIds, setSelectedVideoIds] = useState<number[]>([]);

    if (!isOpen) return null;

    // Filter by search term
    const filteredVideos = availableVideos.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.speaker.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelection = (id: number) => {
        if (selectedVideoIds.includes(id)) {
            setSelectedVideoIds(prev => prev.filter(vId => vId !== id));
        } else {
            setSelectedVideoIds(prev => [...prev, id]);
        }
    };

    const handleImport = () => {
        onImport(selectedVideoIds);
        setSelectedVideoIds([]);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Importar Videos a {currentCourseTitle}</h3>
                        <p className="text-sm text-gray-500">Selecciona videos de la biblioteca general para asociarlos a este curso.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por título o ponente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {filteredVideos.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {filteredVideos.map(video => {
                                const isSelected = selectedVideoIds.includes(video.id);
                                return (
                                    <div
                                        key={video.id}
                                        onClick={() => toggleSelection(video.id)}
                                        className={`flex items-start gap-4 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded border mt-1 flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                                            {isSelected && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                                        </div>

                                        <div className="w-24 h-16 bg-gray-200 rounded overflow-hidden shrink-0">
                                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-semibold text-sm mb-1 ${isSelected ? 'text-blue-800' : 'text-gray-800'}`}>{video.title}</h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className={`px-1.5 py-0.5 rounded ${video.categoryColor || 'bg-gray-100'}`}>{video.category}</span>
                                                <span>{video.speaker}</span>
                                                <span>• {video.duration}</span>
                                            </div>
                                            {video.courseName && (
                                                <p className="text-xs text-gray-400 mt-1 truncate">
                                                    Originalmente en: {video.courseName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <span className="material-symbols-outlined text-4xl mb-2">video_library</span>
                            <p>No se encontraron videos disponibles para importar.</p>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-between items-center rounded-b-xl">
                    <span className="text-sm text-gray-600">
                        {selectedVideoIds.length} video{selectedVideoIds.length !== 1 && 's'} seleccionado{selectedVideoIds.length !== 1 && 's'}
                    </span>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={selectedVideoIds.length === 0}
                            className={`px-6 py-2 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 ${selectedVideoIds.length > 0
                                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">add_link</span>
                            Importar Seleccionados
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoImportModal;
