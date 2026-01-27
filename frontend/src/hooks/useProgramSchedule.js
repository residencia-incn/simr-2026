import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import Swal from 'sweetalert2';

export const useProgramSchedule = () => {
    const [scheduleData, setScheduleData] = useState([]);
    const [days, setDays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch Config (Days) and Activities (Flat list)
            const [configData, activitiesData] = await Promise.all([
                api.program.getConfig(),       // { days: [...], blocks: [...] }
                api.program.getActivities()    // [ { ... }, ... ]
            ]);

            const daysList = configData.days || [];
            setDays(daysList);

            // 2. Transform Flat Activities -> Nested Schedule Data
            if (daysList.length > 0) {
                const transformedSchedule = daysList.map((day, index) => {
                    const dayNumber = index + 1;
                    const dayDateStr = day.date; // "YYYY-MM-DD"

                    // Filter activities for this day
                    const dayActivities = activitiesData.filter(a => {
                        return a.startTime && a.startTime.startsWith(dayDateStr);
                    });

                    const sessions = dayActivities.map(s => {
                        // Extract time HH:MM from ISO
                        const startDate = new Date(s.startTime);
                        const endDate = new Date(s.endTime);
                        const start = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                        const end = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

                        // Map Speaker
                        const speakers = [];
                        if (s.speaker_id || s.speaker_name) {
                            speakers.push({
                                id: s.speaker_id || 'spk-unknown',
                                name: s.speaker_name || 'Desconocido',
                                role: 'Ponente',
                                imageUrl: s.speaker_photo
                            });
                        }

                        // Determine Color
                        let catColor = 'blue';
                        const type = s.type?.toLowerCase() || 'ponencia';
                        if (type === 'general') catColor = 'slate';
                        if (type === 'ceremonia') catColor = 'amber';

                        return {
                            id: s.id,
                            timeStart: start, // "09:00"
                            timeEnd: end,     // "10:00"
                            title: s.title,
                            category: s.classification_label || (type === 'ponencia' ? 'Conferencia' : type.charAt(0).toUpperCase() + type.slice(1)),
                            categoryColor: catColor,
                            speakers: speakers,
                            location: s.location?.name || 'Por definir',
                            virtualLocation: s.location?.urlLink || '',
                            status: s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : 'Borrador', // "Publicado", "Borrador"
                            description: s.description || '',
                            rawStartTime: s.startTime,
                            rawEndTime: s.endTime,
                            blockId: s.block_id,
                            locationId: s.location_id,
                            linkedWorkId: s.external_paper_id
                        };
                    });

                    // Sort by time
                    sessions.sort((a, b) => a.timeStart.localeCompare(b.timeStart));

                    return {
                        dayNumber: dayNumber,
                        date: day.date,
                        label: day.label || `Día ${dayNumber}`,
                        dayId: day.date,
                        sessions: sessions
                    };
                });

                setScheduleData(transformedSchedule);

                // NEW: Process Blocks for Drag & Drop
                // We map blocks to the day they belong to, and attach sessions
                const blocksByDay = transformedSchedule.map(dayData => {
                    // Get config blocks for this day
                    const dayConfigBlocks = configData.blocks.filter(b => b.date === dayData.date);

                    // Attach sessions to blocks
                    const blocksWithSessions = dayConfigBlocks.map(block => {
                        const blockSessions = dayData.sessions.filter(s => s.blockId === block.id);
                        return {
                            ...block,
                            activities: blockSessions
                        };
                    });

                    // Sort blocks by time
                    blocksWithSessions.sort((a, b) => a.startTime.localeCompare(b.startTime));

                    return {
                        dayNumber: dayData.dayNumber,
                        blocks: blocksWithSessions
                    };
                });

                // Save to state (Need to add a new state for this or Attach to scheduleData)
                // Let's attach to scheduleData for simplicity
                setScheduleData(prev => prev.map(d => {
                    const blockInfo = blocksByDay.find(bd => bd.dayNumber === d.dayNumber);
                    return { ...d, blocks: blockInfo ? blockInfo.blocks : [] };
                }));
            } else {
                setScheduleData([]);
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
    }, [loadData]);


    // --- ACTIONS ---

    const updateSession = async (dayNumber, updatedSession) => {
        try {
            const dayObj = days.find((d, i) => i + 1 === dayNumber);
            if (!dayObj) return;

            const datePart = dayObj.date; // "YYYY-MM-DD"
            const startISO = `${datePart}T${updatedSession.timeStart}:00`;
            const endISO = `${datePart}T${updatedSession.timeEnd}:00`;

            const payload = {
                title: updatedSession.title,
                description: updatedSession.description,
                startTime: startISO,
                endTime: endISO,
                status: updatedSession.status ? updatedSession.status.toLowerCase() : 'borrador',
            };

            const config = await api.program.getConfig();
            const dayBlocks = config.blocks.filter(b => b.date === datePart);

            // Logic for Update: If blockId provided but invalid for new time, or not provided, find best block
            let targetBlockId = updatedSession.blockId;

            if (targetBlockId) {
                const explicitBlock = dayBlocks.find(b => b.id === targetBlockId);
                if (explicitBlock) {
                    const blockStart = explicitBlock.startTime.slice(0, 5);
                    const blockEnd = explicitBlock.endTime.slice(0, 5);
                    if (updatedSession.timeStart < blockStart || updatedSession.timeEnd > blockEnd) {
                        targetBlockId = null; // Time changed outside block -> Auto-find new one
                    }
                }
            }

            if (!targetBlockId) {
                const targetBlock = dayBlocks.find(b => {
                    const bStart = b.startTime.slice(0, 5);
                    const bEnd = b.endTime.slice(0, 5);
                    return updatedSession.timeStart >= bStart && updatedSession.timeEnd <= bEnd;
                });
                if (targetBlock) {
                    targetBlockId = targetBlock.id;
                }
                // If still null, backend might error or accept if validation is loose (backend validates strict block-time match)
                // We'll let backend decide or warn if strictly creating
            }

            if (targetBlockId) payload.block_id = targetBlockId;
            if (updatedSession.locationId) payload.location_id = updatedSession.locationId;
            if (updatedSession.type) payload.type = updatedSession.type; // Pass type if present

            if (updatedSession.speakers && updatedSession.speakers.length > 0) {
                payload.speaker_id = updatedSession.speakers[0].id;
            }
            if (updatedSession.linkedWorkId) {
                payload.external_paper_id = updatedSession.linkedWorkId;
            }

            await api.program.updateActivity(updatedSession.id, payload);

            await Swal.fire({
                icon: 'success',
                title: 'Actividad Actualizada',
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });

            await loadData();
        } catch (e) {
            console.error("Update failed", e);
            Swal.fire({
                icon: 'error',
                title: 'Error al actualizar',
                text: e.response?.data?.detail || e.message
            });
        }
    };

    const addSession = async (dayNumber, newSession) => {
        try {
            const dayObj = days.find((d, i) => i + 1 === dayNumber);
            if (!dayObj) return;

            const datePart = dayObj.date;
            const startISO = `${datePart}T${newSession.timeStart}:00`;
            const endISO = `${datePart}T${newSession.timeEnd}:00`;

            // Auto-assign or Use Selected Block
            let targetBlockId = newSession.blockId;
            const config = await api.program.getConfig();
            const dayBlocks = config.blocks.filter(b => b.date === datePart);

            if (targetBlockId) {
                // Verify validity
                const explicitBlock = dayBlocks.find(b => b.id === targetBlockId);

                // If explicit block doesn't match times anymore, try to find a better one auto-magically
                if (explicitBlock) {
                    const blockStart = explicitBlock.startTime.slice(0, 5);
                    const blockEnd = explicitBlock.endTime.slice(0, 5);

                    if (newSession.timeStart < blockStart || newSession.timeEnd > blockEnd) {
                        console.warn("Time outside selected block, attempting auto-reassignment...");
                        targetBlockId = null; // Reset to force auto-find
                    }
                } else {
                    targetBlockId = null;
                }
            }

            if (!targetBlockId) {
                // Find block enclosing this time
                const targetBlock = dayBlocks.find(b => {
                    const bStart = b.startTime.slice(0, 5);
                    const bEnd = b.endTime.slice(0, 5);
                    return newSession.timeStart >= bStart && newSession.timeEnd <= bEnd;
                });

                if (!targetBlock) {
                    await Swal.fire({
                        icon: 'warning',
                        title: 'Sin Bloque Horario',
                        text: `No existe un Bloque Horario configurado que cubra este horario (${newSession.timeStart} - ${newSession.timeEnd}). Por favor crea el bloque primero en la configuración o ajusta el horario.`,
                    });
                    return;
                }
                targetBlockId = targetBlock.id;
            }

            const payload = {
                title: newSession.title,
                description: newSession.description,
                startTime: startISO,
                endTime: endISO,
                status: newSession.status?.toLowerCase() || 'borrador',
                type: newSession.type || 'ponencia',
                block_id: targetBlockId,
                location_id: newSession.locationId
            };

            if (newSession.speakers && newSession.speakers.length > 0) {
                payload.speaker_id = newSession.speakers[0].id;
            }
            if (newSession.classification) {
                payload.classification_label = newSession.classification;
            }
            if (newSession.linkedWorkId) {
                payload.external_paper_id = newSession.linkedWorkId;
            }

            await api.program.createActivity(payload);

            await Swal.fire({
                icon: 'success',
                title: 'Actividad Creada',
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });

            await loadData();
        } catch (e) {
            console.error("Create failed", e);
            Swal.fire({
                icon: 'error',
                title: 'Error al crear',
                text: e.response?.data?.detail || e.message
            });
        }
    };

    const deleteSession = async (dayNumber, sessionId) => {
        try {
            await api.program.deleteActivity(sessionId);
            await Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'La actividad ha sido eliminada correctamente.',
                timer: 1500,
                showConfirmButton: false
            });
            loadData();
        } catch (e) {
            console.error(e);
            Swal.fire({
                icon: 'error',
                title: 'Error al eliminar',
                text: e.message
            });
        }
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
