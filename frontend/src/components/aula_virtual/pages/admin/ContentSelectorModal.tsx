import React, { useState } from 'react';
import { useAulaVirtual } from '../../context/AulaVirtualContext'; // Import context
import { mockReadings, mockExams } from '../../../../data/mockAulaVirtualData'; // Remove mockVideos

interface ContentSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'video' | 'reading' | 'quiz' | null;
    onSelect: (item: any) => void;
    courseContext?: string; // For filtering by course
    excludeVideoIds?: number[]; // IDs to exclude from the list
}

const ContentSelectorModal: React.FC<ContentSelectorModalProps> = ({ isOpen, onClose, type, onSelect, courseContext, excludeVideoIds = [] }) => {
    const { videos } = useAulaVirtual(); // Get real videos
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen || !type) return null;

    const getTitle = () => {
        switch (type) {
            case 'video': return courseContext ? `Seleccionar Video del Curso: ${courseContext}` : 'Seleccionar Video';
            case 'reading': return 'Seleccionar Lectura';
            case 'quiz': return 'Seleccionar Examen/Quiz';
            default: return 'Seleccionar Contenido';
        }
    };

    const getData = () => {
        switch (type) {
            case 'video':
                // Filter by courseContext if available
                // Filter by courseContext if available
                let filteredVideos = videos;
                if (courseContext) {
                    filteredVideos = videos.filter(v =>
                        v.courseName === courseContext ||
                        (v.associatedCourses && v.associatedCourses.includes(courseContext))
                    );
                }
                // Filter out excluded IDs
                if (excludeVideoIds.length > 0) {
                    filteredVideos = filteredVideos.filter(v => !excludeVideoIds.includes(v.id));
                }
                return filteredVideos;
            case 'reading': return mockReadings;
            case 'quiz': return mockExams;
            default: return [];
        }
    };

    const data = getData();
    const filteredData = data.filter((item: any) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (item: any) => {
        onSelect({
            ...item,
            contentType: type // Add type to item for identification
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">{getTitle()}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        <input
                            type="text"
                            placeholder={`Buscar ${type === 'video' ? 'video' : type === 'reading' ? 'lectura' : 'examen'}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredData.length > 0 ? (
                        <div className="flex flex-col gap-1">
                            {filteredData.map((item: any) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg group text-left transition-colors border border-transparent hover:border-blue-100"
                                >
                                    {/* Icon based on type */}
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${type === 'video' ? 'bg-red-50 text-red-600' :
                                        type === 'reading' ? 'bg-purple-50 text-purple-600' :
                                            'bg-teal-50 text-teal-600'
                                        }`}>
                                        <span className="material-symbols-outlined">
                                            {type === 'video' ? 'play_arrow' : type === 'reading' ? 'article' : 'quiz'}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-700 text-sm">{item.title}</h4>
                                        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                                            {type === 'video' && <span>{item.duration} • Subido el {item.uploadedAt}</span>}
                                            {type === 'reading' && <span>{item.format} • {item.module}</span>}
                                            {type === 'quiz' && <span>{item.questions} preguntas • {item.timeLimit}</span>}
                                        </div>
                                    </div>

                                    <span className="material-symbols-outlined text-gray-300 group-hover:text-blue-500">add_circle</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                            <p>No se encontraron resultados</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContentSelectorModal;
