
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const SelectSpeakerModal = ({ isOpen, onClose, onSelect, selectedSpeakers = [] }) => {
    const [speakers, setSpeakers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadSpeakers();
        }
    }, [isOpen]);

    const loadSpeakers = async () => {
        setLoading(true);
        try {
            // Use the new role-based search to fetch "Ponente" users
            // If searchTerm is empty, it returns all "ponente" users
            // If searchTerm has value, it filters by name/dni AND role "ponente" backend-side
            const data = await api.users.search(searchTerm, 'ponente');
            setSpeakers(data);
        } catch (error) {
            console.error("Error loading speakers:", error);
        } finally {
            setLoading(false);
        }
    };

    // Trigger load when search term changes (debounced ideally, but simple effect for now)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) loadSpeakers();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, isOpen]);

    // Client-side filtering is no longer needed if backend does it, 
    // but we might keep it if we fetch ALL speakers initialy. 
    // However, for scalability, let's rely on the effect above updating 'speakers'
    const filteredSpeakers = speakers;

    const isSelected = (speakerId) => {
        return selectedSpeakers.some(s => s.id === speakerId);
    };

    const handleToggleSpeaker = (speaker) => {
        onSelect(speaker);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Ponente" maxWidth="max-w-2xl">
            <div className="flex flex-col gap-4">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">person_search</span>
                    </span>
                    <input
                        className="block w-full rounded-lg border-0 py-2 pl-12 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 dark:bg-slate-800/50 dark:ring-slate-700 dark:text-white"
                        placeholder="Buscar por nombre o institución..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="max-h-[400px] overflow-y-auto flex flex-col gap-2 pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="py-10 text-center text-slate-500">
                            <div className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-primary rounded-full mb-2" role="status" aria-label="loading"></div>
                            <p>Cargando ponentes...</p>
                        </div>
                    ) : filteredSpeakers.length === 0 ? (
                        <div className="py-10 text-center text-slate-500">
                            <span className="material-symbols-outlined text-[48px] mb-2 opacity-20">person_off</span>
                            <p>No se encontraron ponentes</p>
                        </div>
                    ) : (
                        filteredSpeakers.map(speaker => (
                            <div
                                key={speaker.id}
                                onClick={() => handleToggleSpeaker(speaker)}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected(speaker.id)
                                    ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
                                    : 'bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="bg-center bg-no-repeat bg-cover rounded-full size-12 border border-slate-100 dark:border-slate-700 shadow-sm"
                                        style={{ backgroundImage: `url("${speaker.imageUrl || speaker.image || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAxMkMyLjcxIDEyIDEuOTg4IDYuNzUyIDQuNDA0IDQuMjI0IDQuOTYyIDMuNjQgNi40MjYgMyA4IDNoOGMxLjU3NCAwIDMuMDM4LjY0IDMuNTk2IDEuMjI0QzIyLjAxMiA2Ljc1MiAyMS4yOSAxMiAxMiAxMnpNMTIgMTRjLTQuNDIgMC04IDEuNzktOCA0djJoMTZ2LTJjMC0yLjIxLTMuNTgtNC04LTR6IiBmaWxsPSIjY2Njc2NjIi8+PC9zdmc+'}")` }}
                                    ></div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{speaker.name}</h4>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">apartment</span>
                                            {speaker.institution || 'Sin institución'}
                                        </p>
                                    </div>
                                </div>
                                <div className={`size-6 rounded-full flex items-center justify-center border ${isSelected(speaker.id)
                                    ? 'bg-primary border-primary text-white shadow-sm'
                                    : 'border-slate-300 dark:border-slate-600'
                                    }`}>
                                    {isSelected(speaker.id) && <span className="material-symbols-outlined text-[16px]">check</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </div>
            </div>
        </Modal>
    );
};

export default SelectSpeakerModal;
