import React, { useState } from 'react';

type StreamSource = 'cloudflare' | 'youtube' | 'vimeo' | 'rtmp';

const StreamingSetup: React.FC = () => {
    const [selectedSource, setSelectedSource] = useState<StreamSource>('cloudflare');
    const [rtmpKeyVisible, setRtmpKeyVisible] = useState(false);

    const renderInputs = () => {
        switch (selectedSource) {
            case 'cloudflare':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">ID del Video Cloudflare</label>
                            <input
                                type="text"
                                defaultValue="fc23e8003a2c918c864758d977864f1d"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-mono"
                            />
                            <p className="text-xs text-gray-400 mt-1">Introduce el Stream Video ID generado en tu panel de Cloudflare.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">URL del Servidor (RTMP)</label>
                                <input type="text" placeholder="rtmps://live.cloudflare.com..." disabled className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-lg text-sm text-gray-400" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Clave de Transmisión</label>
                                <input type="password" placeholder="••••••••••••" disabled className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-lg text-sm text-gray-400" />
                            </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-700">
                            <span className="material-symbols-outlined text-[20px]">info</span>
                            <p>Para YouTube o Vimeo, asegúrate de que el video sea público o esté configurado como "oculto" pero con permisos de inserción activados.</p>
                        </div>
                    </div>
                );
            case 'youtube':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">URL del video de YouTube</label>
                            <input
                                type="text"
                                defaultValue="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                            />
                            <p className="text-xs text-gray-400 mt-1">Introduce la URL completa o el ID del video de YouTube para incrustar.</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-700">
                            <span className="material-symbols-outlined text-[20px]">info</span>
                            <p>Asegúrate de que el video de YouTube tenga permitida la inserción en sitios externos y que la privacidad sea Pública o No Listada.</p>
                        </div>
                    </div>
                );
            case 'vimeo':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">ID del video de Vimeo</label>
                            <input
                                type="text"
                                defaultValue="849203912"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-mono"
                            />
                            <p className="text-xs text-gray-400 mt-1">Introduce el identificador numérico que aparece en la URL de tu video de Vimeo.</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-700">
                            <span className="material-symbols-outlined text-[20px]">info</span>
                            <p>Para Vimeo, asegúrate de que el video esté configurado con permisos de inserción para tu dominio de academia.</p>
                        </div>
                    </div>
                );
            case 'rtmp':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">URL del Servidor (RTMP)</label>
                            <input
                                type="text"
                                defaultValue="rtmp://stream.neurology-academy.org/live/primary"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-mono"
                            />
                            <p className="text-xs text-gray-400 mt-1">Copia esta URL en los ajustes de emisión de OBS o tu software de codificación.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Clave de Transmisión</label>
                            <div className="relative">
                                <input
                                    type={rtmpKeyVisible ? "text" : "password"}
                                    defaultValue="live_2384_xc9df87s87f6sd87f6sd8f76sd"
                                    className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-mono"
                                />
                                <button
                                    onClick={() => setRtmpKeyVisible(!rtmpKeyVisible)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <span className="material-symbols-outlined text-[20px]">{rtmpKeyVisible ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">No compartas esta clave. Es única para esta transmisión.</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-700">
                            <span className="material-symbols-outlined text-[20px]">info</span>
                            <p>El codificador debe estar configurado con una resolución recomendada de 1080p a 30fps y un bitrate de 4500-6000 Kbps para una calidad óptima en neurología quirúrgica.</p>
                        </div>
                    </div>
                );
        }
    };

    const getPreviewContent = () => {
        switch (selectedSource) {
            case 'cloudflare':
                return (
                    <div className="relative w-full h-full bg-black flex items-center justify-center">
                        <img src="https://img.freepik.com/free-photo/brain-scan-x-ray_53876-88746.jpg" alt="Preview" className="w-full h-full object-cover opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/50">
                                <span className="material-symbols-outlined text-white text-[32px]">play_arrow</span>
                            </div>
                        </div>
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-white text-xs font-bold tracking-wider">DRAFT PREVIEW</span>
                        </div>
                    </div>
                );
            case 'youtube':
                return (
                    <div className="relative w-full h-full bg-black">
                        <img src="https://img.freepik.com/free-photo/doctor-explaining-diagnosis_23-2148761405.jpg" alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-600 text-[64px] drop-shadow-lg">play_circle</span>
                        </div>
                        <div className="absolute bottom-4 right-4 bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold text-white">YOUTUBE</div>
                    </div>
                );
            case 'vimeo':
                return (
                    <div className="relative w-full h-full bg-black">
                        <img src="https://img.freepik.com/free-photo/brain-scan-x-ray_53876-88746.jpg" alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined text-white text-[32px]">play_arrow</span>
                            </div>
                        </div>
                        <div className="absolute top-4 left-4 text-white text-xs font-mono opacity-70">VIMEO PLAYER</div>
                    </div>
                );
            case 'rtmp':
                return (
                    <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400 relative">
                        <div className="bg-gray-200 px-3 py-1 rounded-full text-xs font-bold text-gray-500 mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div> DESCONECTADO
                        </div>
                        <h4 className="text-gray-600 font-bold mb-1">Esperando señal...</h4>
                        <p className="text-xs text-center max-w-[200px]">Inicia la transmisión en tu software para ver la vista previa.</p>
                    </div>
                );
        }
    };

    return (
        <div className="mx-auto max-w-6xl">
            {/* Page Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Configuración del Streaming</h2>
                    <p className="text-gray-500 text-sm">Configura la fuente y los parámetros para la transmisión en vivo del evento.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-500/20">Guardar Cambios</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Config Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4">Fuente de Transmisión</h3>

                        {/* Source Selectors */}
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            <button
                                onClick={() => setSelectedSource('cloudflare')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${selectedSource === 'cloudflare' ? 'border-blue-500 bg-blue-50/50 text-blue-700' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50 text-gray-600'}`}
                            >
                                <span className="material-symbols-outlined text-[32px] mb-2">cloud_queue</span>
                                <span className="text-xs font-bold">Cloudflare</span>
                            </button>
                            <button
                                onClick={() => setSelectedSource('youtube')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${selectedSource === 'youtube' ? 'border-blue-500 bg-blue-50/50 text-blue-700' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50 text-gray-600'}`}
                            >
                                <span className="material-symbols-outlined text-[32px] mb-2">play_circle</span>
                                <span className="text-xs font-bold">YouTube</span>
                            </button>
                            <button
                                onClick={() => setSelectedSource('vimeo')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${selectedSource === 'vimeo' ? 'border-blue-500 bg-blue-50/50 text-blue-700' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50 text-gray-600'}`}
                            >
                                <span className="material-symbols-outlined text-[32px] mb-2">video_library</span>
                                <span className="text-xs font-bold">Vimeo</span>
                            </button>
                            <button
                                onClick={() => setSelectedSource('rtmp')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${selectedSource === 'rtmp' ? 'border-blue-500 bg-blue-50/50 text-blue-700' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50 text-gray-600'}`}
                            >
                                <span className="material-symbols-outlined text-[32px] mb-2">cast_connected</span>
                                <span className="text-xs font-bold">RTMP/OBS</span>
                            </button>
                        </div>

                        {/* Dynamic Inputs */}
                        {renderInputs()}
                    </div>
                </div>

                {/* Sidebar / Preview */}
                <div className="space-y-6">
                    {/* Preview Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">preview</span>
                            Vista Previa
                        </h3>

                        <div className="aspect-video bg-black rounded-lg overflow-hidden border border-gray-200 mb-4">
                            {getPreviewContent()}
                        </div>

                        <button className="w-full py-2.5 border border-blue-200 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                            {selectedSource === 'rtmp' ? (
                                <><span className="material-symbols-outlined text-[18px]">sync</span> Refrescar Señal</>
                            ) : (
                                <><span className="material-symbols-outlined text-[18px]">play_circle</span> Probar Conexión</>
                            )}
                        </button>
                    </div>

                    {/* Settings Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4">Ajustes de Interacción</h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Habilitar Chat</span>
                                <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" name="toggle" id="toggle1" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-blue-600 right-0" />
                                    <label htmlFor="toggle1" className="toggle-label block overflow-hidden h-5 rounded-full bg-blue-600 cursor-pointer"></label>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Modo Moderación</span>
                                <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" name="toggle" id="toggle2" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300" />
                                    <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></label>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Grabación automática</span>
                                <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" name="toggle" id="toggle3" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-blue-600 right-0" />
                                    <label htmlFor="toggle3" className="toggle-label block overflow-hidden h-5 rounded-full bg-blue-600 cursor-pointer"></label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StreamingSetup;
