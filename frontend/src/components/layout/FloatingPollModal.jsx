import React, { useState, useEffect } from 'react';
import { useMeetingWS } from '../../context/MeetingWSContext';
import { api } from '../../services/api';
import { Modal, Button } from '../ui';
import { Clock, HelpCircle, Send, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FloatingPollModal = () => {
    const { lastJsonMessage, meetingId } = useMeetingWS();
    const [activePoll, setActivePoll] = useState(null);
    const [isVoted, setIsVoted] = useState(false);
    const [selectedOptionId, setSelectedOptionId] = useState(null);
    const [results, setResults] = useState(null);

    const fetchResults = async (pollId) => {
        try {
            const data = await api.polls.getResults(pollId);
            setResults(data);
            if (data.my_vote_option_id) {
                setIsVoted(true);
                setSelectedOptionId(data.my_vote_option_id);
            }
        } catch (error) {
            console.error("Error fetching poll results:", error);
        }
    };

    // Check for existing active polls on mount/reconnect
    useEffect(() => {
        if (!meetingId) return;

        const checkActivePolls = async () => {
            try {
                const polls = await api.polls.list(meetingId);
                const current = polls.find(p => p.status === 'ACTIVE');

                if (current) {
                    const details = await api.polls.getResults(current.id);
                    setActivePoll({
                        id: current.id,
                        title: current.title,
                        options: details.options || []
                    });

                    if (details.my_vote_option_id) {
                        setIsVoted(true);
                        setSelectedOptionId(details.my_vote_option_id);
                        setResults(details);
                    } else {
                        setIsVoted(false);
                        setSelectedOptionId(null);
                    }
                }
            } catch (error) {
                console.error("Error checking active polls:", error);
            }
        };

        checkActivePolls();
    }, [meetingId]);

    // WebSocket Event Listener
    useEffect(() => {
        if (!lastJsonMessage) return;

        if (lastJsonMessage.type === 'POLL_LAUNCHED') {
            const isSamePoll = String(activePoll?.id) === String(lastJsonMessage.poll_id);

            setActivePoll({
                id: lastJsonMessage.poll_id,
                title: lastJsonMessage.title,
                options: lastJsonMessage.options || []
            });

            // Only reset state if it's a NEW poll
            if (!isSamePoll) {
                setIsVoted(false);
                setSelectedOptionId(null);
                setResults(null);
            }
        }

        if (lastJsonMessage.type === 'POLL_CLOSED') {
            if (String(activePoll?.id) === String(lastJsonMessage.poll_id)) {
                setActivePoll(null);
            }
        }

        if (lastJsonMessage.type === 'VOTE_UPDATE') {
            if (String(activePoll?.id) === String(lastJsonMessage.poll_id)) {
                if (lastJsonMessage.results && Object.keys(lastJsonMessage.results).length > 0) {
                    setResults(lastJsonMessage.results);
                } else if (isVoted) {
                    fetchResults(activePoll.id);
                }
            }
        }
    }, [lastJsonMessage, isVoted, activePoll?.id]);

    const handleVote = async (optionId) => {
        try {
            await api.polls.vote(activePoll.id, optionId);
            setIsVoted(true);
            setSelectedOptionId(optionId);
            toast.success("¡Voto registrado!");
            fetchResults(activePoll.id);
            window.dispatchEvent(new CustomEvent('dashboard-refresh'));
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al votar");
        }
    };

    if (!activePoll) return null;

    return (
        <div className="fixed bottom-20 right-8 z-[100] w-80 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-500 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <HelpCircle size={18} className="animate-bounce" />
                        <span className="font-black uppercase tracking-widest text-[10px]">Encuesta en Vivo</span>
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-5 space-y-4 bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">
                        {activePoll.title}
                    </h3>

                    <div className="space-y-2">
                        {!isVoted ? (
                            activePoll.options.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleVote(opt.id)}
                                    className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-slate-700 transition-all text-xs font-bold flex items-center gap-3 active:scale-95"
                                >
                                    <div className={`w-2 h-2 rounded-full bg-${opt.color || 'blue'}-500 shadow-sm`} />
                                    <span className="flex-1">{opt.text}</span>
                                    <ChevronRight size={14} className="text-slate-300" />
                                </button>
                            ))
                        ) : (
                            <div className="space-y-3 animate-in fade-in transition-all duration-500">
                                {results?.options?.map(opt => {
                                    const isThisSelected = String(selectedOptionId) === String(opt.id);
                                    const percentage = Math.round(opt.percentage || opt.vote_percentage || 0);

                                    return (
                                        <div key={opt.id} className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                                                <span className={`flex items-center gap-1 ${isThisSelected ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
                                                    {opt.text} {isThisSelected && <Send size={10} />}
                                                </span>
                                                <span className={isThisSelected ? 'text-blue-600 font-bold' : 'text-slate-400'}>{percentage}%</span>
                                            </div>
                                            <div className={`h-2 rounded-full overflow-hidden shadow-inner ${isThisSelected ? 'bg-blue-100 ring-1 ring-blue-200' : 'bg-slate-200'}`}>
                                                <div
                                                    className={`h-full transition-all duration-1000 ${isThisSelected ? 'bg-blue-600' : `bg-${opt.color || 'blue'}-500`}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {isVoted && (
                        <div className="text-center pt-2 animate-in fade-in duration-500 border-t border-slate-200 mt-2">
                            <p className="font-black text-emerald-600 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Voto registrado • {results?.total_votes || 0} votos totales
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-tighter">La encuesta se cerrará cuando lo indique el moderador</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FloatingPollModal;
