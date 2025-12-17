import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Shield, Calendar, MapPin, Clock } from 'lucide-react';
import { api } from '../../services/api';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const AcademicSpeakers = () => {
    const [speakers, setSpeakers] = useState([]);
    const [programData, setProgramData] = useState({});
    const [days, setDays] = useState([]);
    const [selectedSpeakerId, setSelectedSpeakerId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Load speakers and program data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [allAttendees, progData, daysData] = await Promise.all([
                    api.attendees.getAll(),
                    api.program.getAll(),
                    api.program.getDays()
                ]);

                // Filter for 'Ponente' role
                const speakersList = allAttendees.filter(a => a.role === 'Ponente');
                setSpeakers(speakersList);
                setProgramData(progData || {});
                setDays(daysData || []);

            } catch (error) {
                console.error("Error loading speakers data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const selectedSpeaker = speakers.find(s => s.id === selectedSpeakerId);

    // Find assigned sessions for the selected speaker
    const getAssignedSessions = () => {
        if (!selectedSpeaker || !programData) return [];

        const sessions = [];
        const normalizeName = (name) => name ? name.toLowerCase().trim() : '';
        const speakerName = normalizeName(selectedSpeaker.name);

        Object.entries(programData).forEach(([dayId, blocks]) => {
            if (!blocks) return;

            const dayLabel = days.find(d => d.id === dayId)?.date || dayId;

            blocks.forEach(block => {
                // Check block speaker (for single session blocks)
                if (block.speaker && normalizeName(block.speaker).includes(speakerName)) {
                    sessions.push({ ...block, day: dayLabel, type: 'block' });
                }

                // Check sessions within the block (for multi-track)
                if (block.sessions) {
                    Object.values(block.sessions).forEach(session => {
                        if (session.speaker && normalizeName(session.speaker).includes(speakerName)) {
                            sessions.push({ ...session, day: dayLabel, time: block.time, type: 'session' });
                        }
                    });
                }
            });
        });

        return sessions;
    };

    const assignedSessions = getAssignedSessions();

    const filteredSpeakers = speakers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.specialty && s.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="h-[600px] flex gap-6 animate-fadeIn">
            {/* Left Panel: Speaker List */}
            <div className="w-1/3 flex flex-col gap-4 bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Directorio de Ponentes</h3>
                    <Badge className="bg-blue-100 text-blue-700">{speakers.length}</Badge>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o especialidad..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {filteredSpeakers.map(speaker => (
                        <div
                            key={speaker.id}
                            onClick={() => setSelectedSpeakerId(speaker.id)}
                            className={`
                                p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm
                                ${selectedSpeakerId === speaker.id
                                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                    : 'bg-white border-gray-100 hover:border-gray-200'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-purple-100 text-purple-700`}>
                                    {speaker.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900">{speaker.name}</h4>
                                    <p className="text-xs text-gray-500">{speaker.specialty || 'Sin especialidad'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel: Details & Assigned Sessions */}
            <div className="w-2/3 bg-gray-50 rounded-xl border border-gray-200 p-6 flex flex-col">
                {selectedSpeaker ? (
                    <>
                        <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center text-2xl font-bold text-purple-600 shadow-sm">
                                    {selectedSpeaker.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedSpeaker.name}</h2>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Shield size={14} className="text-purple-500" />
                                            <span>{selectedSpeaker.specialty || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Mail size={14} />
                                            <span>{selectedSpeaker.email || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        Institución: <span className="font-medium text-gray-700">{selectedSpeaker.institution || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <Calendar size={18} className="text-blue-500" />
                                Ponencias Asignadas ({assignedSessions.length})
                            </h3>

                            {assignedSessions.length > 0 ? (
                                <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                    {assignedSessions.map((session, idx) => (
                                        <Card key={idx} className="p-4 bg-white hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge size="sm" className="bg-blue-100 text-blue-800">{session.day}</Badge>
                                                <div className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    <Clock size={12} /> {session.time}
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-gray-900 mb-1">{session.title}</h4>
                                            {session.room && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                                                    <MapPin size={12} className="text-purple-500" />
                                                    {session.room}
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-white rounded-lg border border-dashed border-gray-200">
                                    <Calendar size={32} className="mb-2 opacity-20" />
                                    <p className="text-sm">No tiene ponencias asignadas en el programa.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <User size={48} className="mb-4 opacity-20" />
                        <p>Seleccione un ponente del directorio para ver sus detalles.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AcademicSpeakers;
