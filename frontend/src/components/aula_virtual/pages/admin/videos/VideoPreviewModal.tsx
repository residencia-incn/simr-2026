import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Video } from '../../../types';
import { useAulaVirtual } from '../../../context/AulaVirtualContext';

interface VideoPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    video: Video | null;
}

import UnifiedVideoPlayer from '../../../components/UnifiedVideoPlayer';

// --- MAIN COMPONENT ---
const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ isOpen, onClose, video }) => {
    const { playerConfig } = useAulaVirtual();
    if (!isOpen || !video) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col md:flex-row">
                <div className="w-full md:w-3/4 bg-black relative flex items-center justify-center">
                    <UnifiedVideoPlayer
                        videoUrl={video.sourceUrl || ''}
                        sourceType={video.sourceType}
                        title={video.title}
                        thumbnail={video.thumbnail}
                        durationStr={video.duration}
                        autoPlay={playerConfig.autoPlay}
                    />
                </div>
                <div className="w-full md:w-1/4 bg-white flex flex-col border-l border-gray-100">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2 pr-2">{video.title}</h3>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><span className="material-symbols-outlined">close</span></button>
                    </div>
                    <div className="p-6 overflow-y-auto space-y-6">
                        <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${video.categoryColor}`}>{video.category}</span>
                            <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-500">{video.duration}</span>
                        </div>
                        <div><span className="text-xs font-bold text-gray-400 uppercase">Descripción</span><p className="text-sm text-gray-600 mt-1">{video.description || "Sin descripción."}</p></div>
                        <div><span className="text-xs font-bold text-gray-400 uppercase">Curso</span><div className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">{video.courseName}</div></div>
                        <div><span className="text-xs font-bold text-gray-400 uppercase">Ponente</span><div className="flex items-center gap-2 mt-1"><div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{video.speaker.charAt(0)}</div><span className="text-sm text-gray-700">{video.speaker}</span></div></div>
                        <div className="pt-4 border-t border-gray-100"><span className="text-xs font-bold text-gray-400 uppercase">Modo de Reproducción</span><div className="flex items-center gap-2 mt-1"><span className={`w-2 h-2 rounded-full ${playerConfig.defaultPlayer === 'plyr' ? 'bg-green-500' : 'bg-gray-400'}`} /><span className="text-xs font-bold text-gray-600">{playerConfig.defaultPlayer === 'plyr' ? 'CUSTOM PLYR' : 'NATIVE PLAYER'}</span></div></div>
                    </div>
                    <div className="p-4 border-t border-gray-100 mt-auto bg-gray-50 text-center"><button className="text-sm text-blue-600 font-medium hover:underline">Ver recurso completo</button></div>
                </div>
            </div>
        </div>
    );
}

export default VideoPreviewModal;
