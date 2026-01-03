import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, PenTool, Users, AlertCircle } from 'lucide-react';
import { Button, Card, Modal, LoadingSpinner, EmptyState } from '../ui';
import { api } from '../../services/api';
import { useApi } from '../../hooks';
import { showSuccess, showError, showWarning } from '../../utils/alerts';

const MyMeetings = ({ currentUser }) => {
    const [meetings, setMeetings] = useState([]);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [isViewingDetails, setIsViewingDetails] = useState(false);

    // Load active meetings (meetings available for signing)
    const { data, loading, execute: loadMeetings } = useApi(async () => {
        return await api.planning.getActiveMeetings();
    });

    useEffect(() => {
        loadMeetings();
        // Refresh every minute to update time remaining
        const interval = setInterval(loadMeetings, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (data) {
            // Filter only meetings that have started (date <= now)
            const now = new Date();
            const validMeetings = data.filter(m => {
                const meetingStart = new Date(`${m.date}T${m.startTime || '00:00'}`);
                return meetingStart <= now;
            });
            setMeetings(validMeetings);
        }
    }, [data]);

    const handleSignMeeting = async (meeting) => {
        try {
            await api.planning.signMeeting(meeting.id, currentUser.id);
            await showSuccess('Has firmado el acta correctamente', 'Firma registrada');
            await loadMeetings();
            if (selectedMeeting?.id === meeting.id) {
                setIsViewingDetails(false);
                setSelectedMeeting(null);
            }
        } catch (error) {
            showError(error.message);
        }
    };

    const handleViewDetails = (meeting) => {
        setSelectedMeeting(meeting);
        setIsViewingDetails(true);
    };

    const getTimeRemaining = (meeting) => {
        if (meeting.status !== 'closed' || !meeting.closedAt) return null;

        const closedTime = new Date(meeting.closedAt).getTime();
        const nowTime = new Date().getTime();
        const diffMinutes = Math.floor((nowTime - closedTime) / 1000 / 60);
        const remaining = 15 - diffMinutes;

        if (remaining <= 0) return 'Expirado';
        return `${remaining} min restantes`;
    };

    const hasUserSigned = (meeting) => {
        if (!meeting.attendance) return false;
        const attendance = meeting.attendance.find(a => a.userId === currentUser.id);
        return attendance?.signedAt ? true : false;
    };

    const canSign = (meeting) => {
        if (meeting.status !== 'closed') return false;
        if (hasUserSigned(meeting)) return false;

        const timeRemaining = getTimeRemaining(meeting);
        return timeRemaining !== 'Expirado';
    };

    if (loading && !meetings.length) {
        return <div className="p-8 flex justify-center"><LoadingSpinner text="Cargando reuniones..." /></div>;
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <PenTool size={20} className="text-blue-600" />
                    Reuniones - Firma de Actas
                </h3>
                <p className="text-sm text-gray-600">
                    Las actas cerradas están disponibles para firma durante 15 minutos
                </p>
            </div>

            {/* Meetings List */}
            <div className="flex-1 overflow-y-auto space-y-3">
                {meetings.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title="No hay reuniones disponibles"
                        description="Cuando se cierren reuniones, aparecerán aquí para que puedas firmar el acta"
                    />
                ) : (
                    meetings.map(meeting => {
                        const signed = hasUserSigned(meeting);
                        const canSignNow = canSign(meeting);
                        const timeRemaining = getTimeRemaining(meeting);
                        const isClosed = meeting.status === 'closed';

                        return (
                            <Card
                                key={meeting.id}
                                className={`border-l-4 ${signed
                                    ? 'border-l-green-500 bg-green-50/30'
                                    : canSignNow
                                        ? 'border-l-orange-500 bg-orange-50/30'
                                        : 'border-l-blue-500'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-bold text-gray-800">{meeting.title}</h4>
                                            {isClosed && (
                                                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
                                                    CERRADA
                                                </span>
                                            )}
                                            {signed && (
                                                <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                    <CheckCircle size={12} />
                                                    FIRMADA
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {(() => {
                                                    console.log('Meeting Date:', meeting.date, 'Formatted:', new Date(`${meeting.date}T12:00:00`).toLocaleDateString('es-PE'));
                                                    return new Date(`${meeting.date}T12:00:00`).toLocaleDateString('es-PE', {
                                                        day: 'numeric',
                                                        month: 'numeric',
                                                        year: 'numeric'
                                                    });
                                                })()}

                                            </span>
                                            {meeting.startTime && (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {meeting.startTime}
                                                </span>
                                            )}
                                            {meeting.attendance && (
                                                <span className="flex items-center gap-1">
                                                    <Users size={14} />
                                                    {meeting.attendance.length} participantes
                                                </span>
                                            )}
                                        </div>

                                        {isClosed && timeRemaining && (
                                            <div className={`text-sm font-medium ${timeRemaining === 'Expirado'
                                                ? 'text-red-600'
                                                : 'text-orange-600'
                                                }`}>
                                                <AlertCircle size={14} className="inline mr-1" />
                                                {timeRemaining === 'Expirado'
                                                    ? 'Tiempo de firma expirado'
                                                    : `Tiempo para firmar: ${timeRemaining}`
                                                }
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewDetails(meeting)}
                                        >
                                            Ver Detalles
                                        </Button>
                                        {canSignNow && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleSignMeeting(meeting)}
                                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                            >
                                                <PenTool size={16} className="mr-2" />
                                                Firmar Acta
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Meeting Details Modal */}
            <Modal
                isOpen={isViewingDetails}
                onClose={() => {
                    setIsViewingDetails(false);
                    setSelectedMeeting(null);
                }}
                title="Detalles de la Reunión"
                size="lg"
            >
                {selectedMeeting && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-bold text-gray-800 mb-2">{selectedMeeting.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {new Date(selectedMeeting.date).toLocaleDateString('es-PE', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </span>
                                {selectedMeeting.startTime && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {selectedMeeting.startTime}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Agreements */}
                        <div className="border-t pt-4">
                            <h5 className="text-sm font-bold text-gray-700 mb-2">Acuerdos Tomados</h5>
                            {selectedMeeting.agreements && selectedMeeting.agreements.length > 0 ? (
                                <ul className="space-y-2">
                                    {selectedMeeting.agreements.map((agreement, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                            <span>{agreement}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No se registraron acuerdos</p>
                            )}
                        </div>

                        {/* Participants */}
                        <div className="border-t pt-4">
                            <h5 className="text-sm font-bold text-gray-700 mb-2">Participantes</h5>
                            {selectedMeeting.attendance && selectedMeeting.attendance.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedMeeting.attendance.map((att, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                                            <span className="text-gray-700">{att.userName}</span>
                                            {att.signedAt ? (
                                                <span className="text-green-600 font-medium flex items-center gap-1">
                                                    <CheckCircle size={14} />
                                                    Firmado
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">No firmado</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No hay participantes registrados</p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t">
                            <Button variant="ghost" onClick={() => setIsViewingDetails(false)}>
                                Cerrar
                            </Button>
                            {canSign(selectedMeeting) && (
                                <Button
                                    onClick={() => handleSignMeeting(selectedMeeting)}
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                    <PenTool size={16} className="mr-2" />
                                    Firmar Acta
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MyMeetings;
