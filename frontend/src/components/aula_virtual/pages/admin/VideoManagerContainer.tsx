import React, { useState } from 'react';
import VideoLibrary from './videos/VideoLibrary';
import CourseVideoManager from './videos/CourseVideoManager';
import StreamingManager from './videos/StreamingManager';
import StreamingSetup from './videos/StreamingSetup';

type Tab = 'library' | 'courses' | 'streaming' | 'setup';

const VideoManagerContainer: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('library');

    return (
        <div className="flex flex-col h-full bg-background-light overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-border-light px-8 py-6 flex-shrink-0">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-text-main font-display">Gestión de Videos y Streaming</h1>
                            <p className="text-text-muted text-sm mt-1">Administra la videoteca, videos por curso y transmisiones en vivo.</p>
                        </div>
                    </div>

                    <div className="flex gap-6 border-b border-border-light overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('library')}
                            className={`pb-3 border-b-2 text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'library'
                                    ? 'border-primary text-primary font-bold'
                                    : 'border-transparent text-text-muted hover:text-text-main font-medium'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">video_library</span>
                            Videoteca General
                        </button>
                        <button
                            onClick={() => setActiveTab('courses')}
                            className={`pb-3 border-b-2 text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'courses'
                                    ? 'border-primary text-primary font-bold'
                                    : 'border-transparent text-text-muted hover:text-text-main font-medium'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">school</span>
                            Gestión por Curso
                        </button>
                        <button
                            onClick={() => setActiveTab('streaming')}
                            className={`pb-3 border-b-2 text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'streaming'
                                    ? 'border-primary text-primary font-bold'
                                    : 'border-transparent text-text-muted hover:text-text-main font-medium'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">live_tv</span>
                            Gestión de Streamings
                        </button>
                        <button
                            onClick={() => setActiveTab('setup')}
                            className={`pb-3 border-b-2 text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'setup'
                                    ? 'border-primary text-primary font-bold'
                                    : 'border-transparent text-text-muted hover:text-text-main font-medium'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">settings_input_antenna</span>
                            Configuración Streaming
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto h-full">
                    {activeTab === 'library' && <VideoLibrary />}
                    {activeTab === 'courses' && <CourseVideoManager />}
                    {activeTab === 'streaming' && <StreamingManager />}
                    {activeTab === 'setup' && <StreamingSetup />}
                </div>
            </div>
        </div>
    );
};

export default VideoManagerContainer;
