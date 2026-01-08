
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { INITIAL_SCHEDULE } from '../components/cronograma-integration/data/mockData';

export const useProgramSchedule = () => {
    const [scheduleData, setScheduleData] = useState(INITIAL_SCHEDULE);
    const [rawProgram, setRawProgram] = useState({});
    const [days, setDays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [daysData, progData] = await Promise.all([
                api.program.getDays(),
                api.program.getAll()
            ]);

            setDays(daysData);
            setRawProgram(progData || {});

            if (daysData && daysData.length > 0 && progData) {
                const transformedSchedule = daysData.map((day, index) => {
                    const dayNumber = index + 1;
                    const daySessionsRaw = progData[day.id] || [];

                    const sessions = daySessionsRaw.map(s => {
                        let category = s.category || 'Conferencia';
                        let categoryColor = s.categoryColor || 'blue';

                        // Fallback logic for legacy data or if not explicitly set
                        if (!s.category) {
                            if (s.type === 'full') {
                                category = 'Plenaria';
                                categoryColor = 'indigo';
                            } else {
                                category = 'Conferencia Magistral';
                                categoryColor = 'blue';
                            }

                            if (s.title.toLowerCase().includes('taller')) { category = 'Taller'; categoryColor = 'orange'; }
                            if (s.title.toLowerCase().includes('mesa')) { category = 'Mesa Redonda'; categoryColor = 'amber'; }
                        }

                        // Special handling for General Activities
                        const speakerName = s.speaker || (category === 'GENERAL' ? '' : 'Por confirmar');
                        const speakers = speakerName ? [{
                            id: s.id + '-spk',
                            name: speakerName,
                            role: 'Ponente',
                            imageUrl: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(speakerName) + '&background=random'
                        }] : [];

                        return {
                            id: s.id,
                            timeStart: s.startTime || s.time.split(' - ')[0],
                            timeEnd: s.endTime || s.time.split(' - ')[1] || '',
                            title: s.title,
                            category: category,
                            categoryColor: categoryColor,
                            speakers: speakers,
                            location: s.room || 'Auditorio Principal',
                            status: s.status || 'Publicado', // Read from storage or default
                            scheduledAt: s.scheduledAt,      // Read from storage
                            description: s.description || '',
                            linkedWorkId: s.linkedWorkId,
                            linkedTalkId: s.linkedTalkId,
                            virtualLocation: s.virtualRoom || ''
                        };
                    });

                    // Sort sessions by start time
                    sessions.sort((a, b) => a.timeStart.localeCompare(b.timeStart));

                    return {
                        dayNumber: dayNumber,
                        date: day.date,
                        label: day.label || `Día ${dayNumber}`,
                        dayId: day.id,
                        sessions: sessions
                    };
                });

                if (transformedSchedule.length > 0) {
                    setScheduleData(transformedSchedule);
                }
            }
        } catch (err) {
            console.error('Error loading program data', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();

        // Listen for program days updates to refresh automatically
        const handleRefresh = () => loadData();
        window.addEventListener('program-days-updated', handleRefresh);
        window.addEventListener('program-updated', handleRefresh);

        return () => {
            window.removeEventListener('program-days-updated', handleRefresh);
            window.removeEventListener('program-updated', handleRefresh);
        };
    }, [loadData]);

    const saveChanges = async (newScheduleData) => {
        // optimistically update state
        setScheduleData(newScheduleData);

        // Transform back to API format
        const newProgram = {};
        newScheduleData.forEach(daySchedule => {
            const dayId = daySchedule.dayId;
            if (!dayId) return;

            newProgram[dayId] = daySchedule.sessions.map(s => {
                // Map back to API structure
                return {
                    id: s.id,
                    title: s.title,
                    startTime: s.timeStart,
                    endTime: s.timeEnd,
                    time: `${s.timeStart} - ${s.timeEnd}`,
                    type: s.category === 'Plenaria' ? 'full' : 'split',
                    category: s.category,
                    categoryColor: s.categoryColor || 'blue',
                    description: s.description,
                    room: s.location,
                    virtualRoom: s.virtualLocation,
                    speaker: s.speakers[0]?.name || '',
                    linkedWorkId: s.linkedWorkId,
                    linkedTalkId: s.linkedTalkId,
                    status: s.status,          // Persist status
                    scheduledAt: s.scheduledAt // Persist scheduledAt
                };
            });
        });

        try {
            await api.program.save(newProgram);
            setRawProgram(newProgram);
        } catch (err) {
            console.error('Error saving program', err);
            setError(err);
            // Revert state if needed, or just let the next load fix it
            loadData();
        }
    };

    const updateSession = (dayNumber, updatedSession) => {
        const newSchedule = scheduleData.map(d => {
            if (d.dayNumber !== dayNumber) return d;
            return {
                ...d,
                sessions: d.sessions.map(s => s.id === updatedSession.id ? updatedSession : s)
            };
        });
        saveChanges(newSchedule);
    };

    const addSession = (dayNumber, newSession) => {
        const newSchedule = scheduleData.map(d => {
            if (d.dayNumber !== dayNumber) return d;
            return {
                ...d,
                sessions: [...d.sessions, newSession].sort((a, b) => a.timeStart.localeCompare(b.timeStart))
            };
        });
        saveChanges(newSchedule);
    };

    const deleteSession = (dayNumber, sessionId) => {
        const newSchedule = scheduleData.map(d => {
            if (d.dayNumber !== dayNumber) return d;
            return {
                ...d,
                sessions: d.sessions.filter(s => s.id !== sessionId)
            };
        });
        saveChanges(newSchedule);
    };

    return {
        scheduleData,
        loading,
        error,
        refresh: loadData,
        days,
        updateSession,
        addSession,
        deleteSession
    };
};
