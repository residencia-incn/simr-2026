import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const SpeakerSection = () => {
    const [speakers, setSpeakers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSpeakers = async () => {
            try {
                const data = await api.speakers.getAll();
                setSpeakers(data);
            } catch (error) {
                console.error("Error fetching featured speakers:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSpeakers();
    }, []);

    if (loading) return null; // Or a subtle skeleton
    if (speakers.length === 0) return null;

    return (
        <div className="mt-12">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">groups</span>
                Ponentes Destacados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {speakers.map(speaker => (
                    <div key={speaker.id} className="flex items-center gap-4 p-4 bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <div
                            className="bg-center bg-no-repeat bg-cover rounded-full size-14 ring-2 ring-slate-50 dark:ring-slate-800 shrink-0 bg-slate-100 flex items-center justify-center overflow-hidden"
                            style={{ backgroundImage: (speaker.imageUrl || speaker.image) ? `url("${speaker.imageUrl || speaker.image}")` : 'none' }}
                        >
                            {!(speaker.imageUrl || speaker.image) && (
                                <span className="material-symbols-outlined text-slate-400">person</span>
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate" title={speaker.name}>{speaker.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{speaker.specialty || speaker.role || 'Ponente'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SpeakerSection;
