import React, { useState, useMemo } from 'react';
import { User } from '../../../types';
import { useAulaVirtual } from '../../../context/AulaVirtualContext';

interface SpeakerSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (speakerName: string) => void;
}

const SpeakerSelectorModal: React.FC<SpeakerSelectorModalProps> = ({ isOpen, onClose, onSelect }) => {
    const { users } = useAulaVirtual();
    const [searchTerm, setSearchTerm] = useState('');

    // Filter logic: Check 'eventRoles', 'eventRole', 'role' for 'ponente' (case insensitive)
    const speakers = useMemo(() => {
        return users.filter(user => {
            const isSpeaker =
                (user.eventRoles && user.eventRoles.includes('ponente')) ||
                (user.eventRole === 'ponente') ||
                (user.role && user.role.toLowerCase() === 'ponente') ||
                (user.roles && user.roles.includes('ponente'));

            if (!isSpeaker) return false;

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return user.name.toLowerCase().includes(term) ||
                    user.email.toLowerCase().includes(term);
            }
            return true;
        });
    }, [users, searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-800">Seleccionar Ponente</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {speakers.length > 0 ? (
                        <div className="space-y-1">
                            {speakers.map(speaker => (
                                <button
                                    key={speaker.id}
                                    onClick={() => {
                                        onSelect(speaker.name);
                                        onClose();
                                    }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl transition-colors text-left group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                        {speaker.avatar ? (
                                            <img src={speaker.avatar} alt={speaker.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            speaker.name.charAt(0)
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-800 group-hover:text-blue-700">{speaker.name}</div>
                                        <div className="text-xs text-gray-500">{speaker.email}</div>
                                    </div>
                                    <span className="ml-auto material-symbols-outlined text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all">check_circle</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">person_off</span>
                            <p>No se encontraron ponentes.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpeakerSelectorModal;
