import React, { useState, useEffect } from 'react';
import { Search, BookOpen, User, Check, Plus, X, Filter, Mic } from 'lucide-react';
import { api } from '../../services/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';

const ImportActivityModal = ({ isOpen, onClose, onImportWork, onImportTalk }) => {
    const [activeTab, setActiveTab] = useState('works'); // 'works' | 'talks'
    const [searchTerm, setSearchTerm] = useState('');
    const [works, setWorks] = useState([]);
    const [talks, setTalks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSpecialty, setSelectedSpecialty] = useState('all');

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [worksData, speakersData, programData] = await Promise.all([
                api.works.getAll(),
                api.speakers.getAll(),
                api.program.getAll()
            ]);

            // 1. Collect all scheduled IDs and Titles to avoid duplicates
            const scheduledIds = new Set();
            const scheduledTitles = new Set();

            Object.values(programData || {}).forEach(daySessions => {
                if (!Array.isArray(daySessions)) return;
                daySessions.forEach(session => {
                    if (session.linkedWorkId) scheduledIds.add(session.linkedWorkId);
                    if (session.linkedTalkId) scheduledIds.add(session.linkedTalkId);
                    if (session.title) scheduledTitles.add(session.title.toLowerCase().trim());

                    // Also check sub-sessions if any (multi-track)
                    if (session.sessions) {
                        Object.values(session.sessions).forEach(s => {
                            if (s.linkedWorkId) scheduledIds.add(s.linkedWorkId);
                            if (s.linkedTalkId) scheduledIds.add(s.linkedTalkId);
                            if (s.title) scheduledTitles.add(s.title.toLowerCase().trim());
                        });
                    }
                });
            });

            // 2. Filter only accepted works that NOT in schedule
            setWorks(worksData.filter(w =>
                (w.status === 'Aceptado' || w.status === 'Aprobado') &&
                !scheduledIds.has(w.id) &&
                !scheduledTitles.has(w.title?.toLowerCase().trim())
            ));

            // 3. Extract and filter talks
            const allTalks = [];
            speakersData.forEach(speaker => {
                if (speaker.talks && Array.isArray(speaker.talks)) {
                    speaker.talks.forEach(talk => {
                        // Check if NOT already scheduled
                        if (!scheduledIds.has(talk.id) && !scheduledTitles.has(talk.title?.toLowerCase().trim())) {
                            allTalks.push({
                                ...talk,
                                speaker: {
                                    id: speaker.id,
                                    name: speaker.name,
                                    specialty: speaker.specialty,
                                    institution: speaker.institution,
                                    imageUrl: speaker.imageUrl,
                                    email: speaker.email
                                }
                            });
                        }
                    });
                }
            });
            setTalks(allTalks);

        } catch (error) {
            console.error("Error loading import data:", error);
        } finally {
            setLoading(false);
        }
    };

    const specialties = [...new Set([
        ...works.map(w => w.specialty),
        ...talks.map(t => t.specialty)
    ])].filter(Boolean).sort();

    const filteredWorks = works.filter(w => {
        const matchesSearch = w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (w.author && w.author.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesSpecialty = selectedSpecialty === 'all' || w.specialty === selectedSpecialty;
        return matchesSearch && matchesSpecialty;
    });

    const filteredTalks = talks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.speaker && t.speaker.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesSpecialty = selectedSpecialty === 'all' || t.specialty === selectedSpecialty;
        return matchesSearch && matchesSpecialty;
    });

    const handleImportWork = (work) => {
        // Prepare mapping
        const importedData = {
            title: work.title,
            category: work.type === 'Poster' ? 'Reporte de Caso' : 'Trabajo Original',
            linkedWorkId: work.id,
            authorName: work.author,
            authorId: work.authorId
        };
        onImportWork(importedData);
        onClose();
    };

    const handleImportTalk = (talk) => {
        const importedData = {
            title: talk.title,
            category: 'Conferencia Magistral',
            linkedTalkId: talk.id,
            specialty: talk.specialty,
            speaker: talk.speaker
        };
        onImportTalk(importedData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Importar Actividad" size="2xl">
            <div className="flex flex-col gap-4">
                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por título, autor o ponente..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary outline-none"
                        value={selectedSpecialty}
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                    >
                        <option value="all">Todas las subespecialidades</option>
                        {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('works')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'works' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500'}`}
                    >
                        <BookOpen size={16} />
                        Trabajos Aceptados ({filteredWorks.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('talks')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'talks' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500'}`}
                    >
                        <Mic size={16} />
                        Ponencias Magistrales ({filteredTalks.length})
                    </button>
                </div>

                {/* List Body */}
                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="py-20 text-center text-slate-500">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            Cargando datos...
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {activeTab === 'works' ? (
                                filteredWorks.length > 0 ? (
                                    filteredWorks.map(work => (
                                        <div key={work.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary/50 transition-all group">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge type="info" size="xs">{work.type}</Badge>
                                                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter">#{work.id}</span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white leading-tight mb-1">{work.title}</h4>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                                        <User size={12} /> {work.author}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleImportWork(work)}
                                                    className="bg-primary/10 text-primary hover:bg-primary hover:text-white border-none shadow-none"
                                                >
                                                    Importar
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                                        No se encontraron trabajos aceptados.
                                    </div>
                                )
                            ) : (
                                filteredTalks.length > 0 ? (
                                    filteredTalks.map(talk => (
                                        <div key={talk.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary/50 transition-all group">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge type="warning" size="xs">Conferencia Magistral</Badge>
                                                        <Badge type="neutral" size="xs">{talk.specialty}</Badge>
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white leading-tight mb-1">{talk.title}</h4>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-600">
                                                            {talk.speaker.imageUrl ? (
                                                                <img src={talk.speaker.imageUrl} alt={talk.speaker.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="text-slate-400" size={12} />
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{talk.speaker.name}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleImportTalk(talk)}
                                                    className="bg-primary/10 text-primary hover:bg-primary hover:text-white border-none shadow-none"
                                                >
                                                    Importar
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                                        No se encontraron ponencias maestras asignadas.
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button variant="ghost" onClick={onClose}>Cerrar</Button>
                </div>
            </div>
        </Modal>
    );
};

export default ImportActivityModal;
