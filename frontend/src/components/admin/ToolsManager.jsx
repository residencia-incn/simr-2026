import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LoadingSpinner } from '../ui';
import { Plus, Play, Square, ListOrdered, BarChart3, Trash2, Clock, CheckCircle2, RotateCw } from 'lucide-react';
import PollEditModal from './PollEditModal';
import { toast } from 'react-hot-toast';
import { useMeetingWS } from '../../context/MeetingWSContext';

export default function ToolsManager({ meetingId, isReadOnly }) {
    const { lastJsonMessage, isConnected } = useMeetingWS();
    const [polls, setPolls] = useState([]);
    const [selectedPoll, setSelectedPoll] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPoll, setEditingPoll] = useState(null);
    const [liveResults, setLiveResults] = useState(null);

    const loadPolls = async () => {
        try {
            const data = await api.polls.list(meetingId);
            setPolls(data);
            setIsLoading(false);
        } catch (error) {
            console.error("Error cargando encuestas:", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPolls();
    }, [meetingId]);

    // Listener de WebSockets para eventos de encuestas
    useEffect(() => {
        if (!lastJsonMessage) return;

        const { type, poll_id, results: wsResults } = lastJsonMessage;

        // Actualización de resultados en vivo
        if (type === 'VOTE_UPDATE' && String(poll_id) === String(selectedPoll?.id)) {
            console.log("🗳️ REAL-TIME SYNC: VOTE_UPDATE recibido", wsResults);
            if (wsResults && Object.keys(wsResults).length > 0) {
                setLiveResults(wsResults);
            } else {
                api.polls.getResults(selectedPoll.id).then(setLiveResults);
            }
        }

        // Actualización de estados (Lanzada/Cerrada)
        if (type === 'POLL_LAUNCHED' || type === 'POLL_CLOSED') {
            console.log(`📣 REAL-TIME EVENT: ${type} para Poll ${poll_id}`);
            loadPolls();

            // Si la encuesta afectada es la seleccionada, actualizar su estado localmente
            if (String(poll_id) === String(selectedPoll?.id)) {
                setSelectedPoll(prev => ({
                    ...prev,
                    status: type === 'POLL_LAUNCHED' ? 'ACTIVE' : 'CLOSED'
                }));
            }
        }
    }, [lastJsonMessage, selectedPoll?.id]);

    // Al seleccionar una encuesta, cargamos sus resultados iniciales
    useEffect(() => {
        if (!selectedPoll?.id) {
            setLiveResults(null);
            return;
        }

        const fetchInitial = async () => {
            try {
                const data = await api.polls.getResults(selectedPoll.id);
                setLiveResults(data);
            } catch (err) {
                console.error("Error fetching initial results:", err);
            }
        };

        fetchInitial();
    }, [selectedPoll?.id]);

    const handleCreatePoll = async (pollData) => {
        try {
            await api.polls.create(meetingId, pollData);
            toast.success("Encuesta creada");
            setIsEditModalOpen(false);
            loadPolls();
        } catch (error) {
            toast.error("Error al crear encuesta");
        }
    };

    const handleLaunch = async (pollId) => {
        try {
            await api.polls.launch(pollId);
            toast.success("¡Encuesta lanzada en vivo!");
            loadPolls();
            // Actualizar el objeto seleccionado localmente para reflejar el estado
            setSelectedPoll(prev => prev?.id === pollId ? { ...prev, status: 'ACTIVE' } : prev);
        } catch (error) {
            toast.error("No se pudo lanzar la encuesta");
        }
    };

    const handleClose = async (pollId) => {
        try {
            await api.polls.close(pollId);
            toast.success("Encuesta cerrada");
            loadPolls();
            setSelectedPoll(prev => prev?.id === pollId ? { ...prev, status: 'CLOSED' } : prev);
        } catch (error) {
            toast.error("Error al cerrar");
        }
    };

    const handleDelete = async (pollId) => {
        if (!window.confirm("¿Seguro que desea eliminar esta encuesta?")) return;
        try {
            await api.polls.delete(pollId);
            toast.success("Eliminada");
            if (selectedPoll?.id === pollId) setSelectedPoll(null);
            loadPolls();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    if (isLoading) return <div className="p-10 flex justify-center"><LoadingSpinner /></div>;

    // Derived connection status for UI feedback

    return (
        <div className="flex flex-col h-[600px] border rounded-xl bg-white overflow-hidden shadow-sm">

            <div className="flex flex-1 overflow-hidden">

                {/* IZQUIERDA: Listado */}
                <div className="w-1/3 border-r bg-slate-50 flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center bg-white">
                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                            <ListOrdered size={16} className="text-blue-600" />
                            Encuestas
                        </h3>
                        {!isReadOnly && (
                            <button
                                onClick={() => { setEditingPoll(null); setIsEditModalOpen(true); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                            >
                                <Plus size={18} />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {polls.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-sm italic mt-10">
                                No hay encuestas creadas.
                            </div>
                        ) : (
                            polls.map(poll => (
                                <div
                                    role="button"
                                    tabIndex={0}
                                    key={poll.id}
                                    onClick={() => setSelectedPoll(poll)}
                                    onKeyDown={(e) => e.key === 'Enter' && setSelectedPoll(poll)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all group relative cursor-pointer ${selectedPoll?.id === poll.id
                                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                                        : 'bg-white border-transparent hover:border-slate-200'
                                        }`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${poll.status === 'ACTIVE' ? 'text-emerald-600' :
                                            poll.status === 'CLOSED' ? 'text-slate-400' : 'text-blue-500'
                                            }`}>
                                            {poll.status === 'ACTIVE' ? '• En Vivo' :
                                                poll.status === 'CLOSED' ? 'Finalizada' : 'Borrador'}
                                        </span>
                                        <span className="font-bold text-slate-700 text-sm line-clamp-2">{poll.title}</span>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                                            <BarChart3 size={10} /> {poll.options?.length || 0} opciones
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(poll.id); }}
                                        className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* DERECHA: Control y Resultados */}
                <div className="w-2/3 flex flex-col bg-white">
                    {selectedPoll ? (
                        <div className="flex-1 flex flex-col">
                            {/* Cabecera Control */}
                            <div className="p-6 border-b bg-slate-50/50">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 leading-tight flex items-center gap-2">
                                            {selectedPoll.title}
                                            <button
                                                onClick={() => {
                                                    toast.promise(api.polls.getResults(selectedPoll.id).then(setLiveResults), {
                                                        loading: 'Sincronizando...',
                                                        success: 'Datos actualizados',
                                                        error: 'Error de red'
                                                    });
                                                }}
                                                className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-blue-600"
                                                title="Forzar actualización de datos"
                                            >
                                                <RotateCw size={14} />
                                            </button>
                                        </h2>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedPoll.status === 'DRAFT' && (
                                            <button
                                                onClick={() => handleLaunch(selectedPoll.id)}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                                            >
                                                <Play size={16} fill="white" /> Lanzar Encuesta
                                            </button>
                                        )}
                                        {selectedPoll.status === 'ACTIVE' && (
                                            <button
                                                onClick={() => handleClose(selectedPoll.id)}
                                                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
                                            >
                                                <Square size={16} fill="white" /> Cerrar Encuesta
                                            </button>
                                        )}
                                        {selectedPoll.status === 'CLOSED' && (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-200 text-slate-600 rounded-lg font-bold text-xs uppercase tracking-widest">
                                                <CheckCircle2 size={16} /> Finalizada
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Resultados en Vivo */}
                            <div className="flex-1 overflow-y-auto p-8 bg-white">
                                <div className="max-w-md mx-auto space-y-8">
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-slate-900">{liveResults?.total_votes || 0}</div>
                                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Votos Totales</div>
                                    </div>

                                    <div className="space-y-6">
                                        {(liveResults?.options || selectedPoll.options || []).map(opt => {
                                            const total = liveResults?.total_votes || 0;
                                            const count = opt.vote_count || 0;
                                            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                                            return (
                                                <div key={opt.id} className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="font-bold text-slate-700 text-sm">{opt.text}</span>
                                                        <span className="font-black text-slate-900 text-sm">{percentage}% ({count})</span>
                                                    </div>
                                                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                                        <div
                                                            className={`h-full bg-${opt.color || 'blue'}-500 transition-all duration-700 ease-out`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {selectedPoll.status === 'ACTIVE' && (
                                        <div className="flex items-center justify-center gap-2 text-emerald-500 animate-pulse text-xs font-bold bg-emerald-50 py-2 rounded-full border border-emerald-100">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            Sincronizando en tiempo real...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-slate-50/30">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                <BarChart3 size={40} />
                            </div>
                            <h3 className="font-bold text-slate-400">Seleccione una encuesta</h3>
                            <p className="text-xs text-slate-400 mt-1">Cree o elija una encuesta de la lista para ver el control y resultados.</p>
                        </div>
                    )}
                </div>

                <PollEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleCreatePoll}
                    initialData={editingPoll}
                />
            </div>
        </div>
    );
}
