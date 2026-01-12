import React, { useState, useEffect } from 'react';
import { useAulaVirtual } from '../../../context/AulaVirtualContext';
import { PlayerConfig, PlayerType } from '../../../types';

interface PlayerSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PlayerSettingsModal: React.FC<PlayerSettingsModalProps> = ({ isOpen, onClose }) => {
    const { playerConfig, updatePlayerConfig } = useAulaVirtual();
    const [localConfig, setLocalConfig] = useState<PlayerConfig>(playerConfig);

    useEffect(() => {
        if (isOpen) {
            setLocalConfig(playerConfig);
        }
    }, [isOpen, playerConfig]);

    const handleSave = () => {
        updatePlayerConfig(localConfig);
        onClose();
    };

    const handleToggleYoutube = (key: keyof PlayerConfig['youtube']) => {
        setLocalConfig(prev => ({
            ...prev,
            youtube: {
                ...prev.youtube,
                [key]: !prev.youtube[key]
            }
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Configuración del Reproductor</h3>
                        <p className="text-sm text-gray-500">Personaliza la experiencia de visualización.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Default Player Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Reproductor Predeterminado</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setLocalConfig({ ...localConfig, defaultPlayer: 'native' })}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${localConfig.defaultPlayer === 'native'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-3xl">html</span>
                                <span className="font-semibold">Nativo (HTML5)</span>
                            </button>
                            <button
                                onClick={() => setLocalConfig({ ...localConfig, defaultPlayer: 'plyr' })}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${localConfig.defaultPlayer === 'plyr'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-3xl">smart_display</span>
                                <span className="font-semibold">Plyr (Avanzado)</span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            <b>Plyr</b> ofrece una interfaz unificada y controles avanzados. <b>Nativo</b> usa el reproductor estándar del navegador.
                        </p>
                    </div>

                    <hr className="border-gray-100" />

                    {/* YouTube Specific Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-600">play_circle</span>
                            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">YouTube Best Logic</label>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-800">Ocultar Controles Nativos</span>
                                    <span className="text-xs text-gray-500">Muestra nuestra interfaz sobre la de YouTube.</span>
                                </div>
                                <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${localConfig.youtube.hideControls ? 'bg-blue-600' : 'bg-gray-300'}`}
                                    onClick={() => handleToggleYoutube('hideControls')}>
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${localConfig.youtube.hideControls ? 'translate-x-5' : ''}`} />
                                </div>
                            </label>

                            <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-800">Marca Modesta (Modest Branding)</span>
                                    <span className="text-xs text-gray-500">Reduce el logo de YouTube en el reproductor.</span>
                                </div>
                                <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${localConfig.youtube.modestBranding ? 'bg-blue-600' : 'bg-gray-300'}`}
                                    onClick={() => handleToggleYoutube('modestBranding')}>
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${localConfig.youtube.modestBranding ? 'translate-x-5' : ''}`} />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlayerSettingsModal;
