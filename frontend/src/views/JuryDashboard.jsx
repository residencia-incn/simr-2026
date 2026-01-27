import React, { useState, useEffect } from 'react';
import { useModal, useLocalStorage } from '../hooks';
import { FileText, Save, CheckCircle, Maximize2, Minimize2, X, AlertTriangle } from 'lucide-react';
import { Button, Card, Badge, Modal, FormField } from '../components/ui';
import DevelopmentView from '../components/common/DevelopmentView';
import { api } from '../services/api';
import Swal from 'sweetalert2';

const JuryDashboard = ({ user }) => {
    if (!user) return null;

    const [works, setWorks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWorkId, setSelectedWorkId] = useState(null);
    const [scores, setScores] = useState({});
    const [comment, setComment] = useState("");
    const { isOpen: showModal, open: openModal, close: closeModal } = useModal();
    const [error, setError] = useState("");
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Load assigned works
    useEffect(() => {
        const loadWorks = async () => {
            setLoading(true);
            try {
                // Fetch works specifically for this juror
                const myWorks = await api.works.getAll(user.id);
                setWorks(myWorks);
            } catch (err) {
                console.error("Error loading works:", err);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            loadWorks();
        }
    }, [user?.id]);

    // Draft Persistence
    const [drafts, setDrafts] = useLocalStorage('jury_drafts', {});

    // Rubric loading
    const [rubrics, setRubrics] = useState([]);
    const [rubricsLoading, setRubricsLoading] = useState(false);

    // Load draft and rubrics when switching works
    const selectedWork = works.find(w => w.id === selectedWorkId);

    useEffect(() => {
        if (selectedWorkId && selectedWork) {
            // Load Rubrics for this work type
            const loadRubrics = async () => {
                setRubricsLoading(true);
                try {
                    const data = await api.academic.getRubrics(selectedWork.type_name || selectedWork.type);
                    setRubrics(data);
                } catch (err) {
                    console.error("Error fetching rubrics:", err);
                } finally {
                    setRubricsLoading(false);
                }
            };
            loadRubrics();
        }
    }, [selectedWorkId, selectedWork?.type]);

    // Effect to populate form state (scores/comment)
    useEffect(() => {
        if (!selectedWorkId || !selectedWork || rubrics.length === 0) return;

        // 1. Check if already evaluated -> Load from backend data
        // Check for juror_id OR jurorId
        const existingEval = selectedWork.evaluations?.find(e => (e.jurorId || e.juror_id) === user.id);

        if (existingEval) {
            // valid evaluation found
            setComment(existingEval.comment || "");

            // Map keys "Rubric Title" -> "Rubric ID"
            const loadedScores = {};
            // existingEval.scores is { "Originalidad": 5, "Metodologia": 4 }
            if (existingEval.scores) {
                Object.entries(existingEval.scores).forEach(([title, score]) => {
                    const rubric = rubrics.find(r => r.title === title);
                    if (rubric) {
                        loadedScores[rubric.id] = score;
                    }
                });
            }
            setScores(loadedScores);
        } else {
            // 2. Not evaluated -> Load from Draft or Reset
            const savedDraft = drafts[selectedWorkId];
            if (savedDraft) {
                setScores(savedDraft.scores || {});
                setComment(savedDraft.comment || "");
            } else {
                setScores({});
                setComment("");
            }
        }
    }, [selectedWorkId, rubrics, user.id]); // Re-run when rubrics load or work changes

    // Auto-save draft when scores or comment change
    useEffect(() => {
        if (selectedWorkId) {
            const hasData = Object.keys(scores).length > 0 || comment.trim() !== "";
            if (hasData) {
                setDrafts(prev => ({
                    ...prev,
                    [selectedWorkId]: { scores, comment }
                }));
            }
        }
    }, [scores, comment, selectedWorkId]);

    const handleScoreChange = (rubricId, score) => {
        setScores(prev => ({
            ...prev,
            [rubricId]: score
        }));
        if (error) setError("");
    };

    const validateAndSubmit = () => {
        const allScored = rubrics.every(r => scores[r.id] !== undefined && scores[r.id] !== null);
        if (!allScored) {
            setError("Por favor, califique todos los criterios antes de enviar.");
            return;
        }
        setError("");
        openModal();
    };

    const totalScore = rubrics.reduce((acc, r) => acc + (scores[r.id] || 0), 0);

    const confirmSubmission = async () => {
        try {
            const payload = {
                scores: rubrics.map(r => ({
                    rubric_id: r.id,
                    score: scores[r.id] || 0
                })),
                comment: comment
            };

            await api.academic.evaluateWork(selectedWork.my_assignment_id, payload);

            // Update local state
            setWorks(prev => prev.map(w => {
                if (w.id === finalSelectedWorkId) { // Using a capture if needed, but selectedWorkId should be fine
                    return {
                        ...w,
                        status: 'CALIFICADO',
                        evaluations: [
                            ...(w.evaluations || []),
                            {
                                juror_id: user.id,
                                jurorName: user.name,
                                totalScore: totalScore,
                                comment: comment,
                                scores: Object.fromEntries(
                                    rubrics.map(r => [r.title, scores[r.id]])
                                )
                            }
                        ]
                    };
                }
                return w;
            }));

            // Remove draft
            setDrafts(prev => {
                const newDrafts = { ...prev };
                delete newDrafts[selectedWorkId];
                return newDrafts;
            });

            closeModal();
            setIsFullScreen(false);
            Swal.fire('¡Éxito!', 'Calificación enviada correctamente.', 'success');
        } catch (error) {
            console.error("Error saving evaluation:", error);
            if (error.response?.status === 409) {
                Swal.fire({
                    title: 'Ya calificado',
                    text: 'Este trabajo ya había sido calificado previamente. Se actualizará la vista.',
                    icon: 'info'
                });
                // Force reload works to get correct status
                // Ideally we call loadWorks() here but it's inside useEffect.
                // We can rely on the user refreshing or just accepting the state.
                // Better: trigger a reload via a prop or simple window reload if essential, 
                // but for now let's just close modal.
                closeModal();
                setIsFullScreen(false);
                // Reload page or re-fetch works would be better.
                window.location.reload();
            } else {
                setError("Error al guardar la calificación. Intente nuevamente.");
            }
        }
    };

    // Need to capture selectedWorkId safely for state updates
    const finalSelectedWorkId = selectedWorkId;

    // Check if current selected work is already evaluated by this user
    // Check if current selected work is already evaluated by this user
    // Backend returns 'juror_id', frontend might use 'jurorId' in some places. Check both.
    const currentEvaluation = selectedWork?.evaluations?.find(e => (e.jurorId || e.juror_id) === user.id);
    const isEvaluated = !!currentEvaluation;

    const handleWorkSelect = async (workId) => {
        if (selectedWorkId === workId) return;

        const hasChanges = Object.keys(scores).length > 0 || comment.trim() !== "";
        // If it's evaluated, it's read only, so no unsaved changes really matter for switching
        const isCurrentEvaluated = selectedWork?.evaluations?.some(e => (e.jurorId || e.juror_id) === user.id);

        if (selectedWorkId && hasChanges && !isCurrentEvaluated) {
            const result = await Swal.fire({
                title: '¿Cambiar de trabajo?',
                text: 'Tiene una calificación en curso. Si cambia de trabajo, se cerrará la calificación actual sin enviar (se guardará como borrador).',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cambiar',
                cancelButtonText: 'Continuar evaluando'
            });

            if (!result.isConfirmed) return;
        }

        setSelectedWorkId(workId);
        setError("");
        setIsFullScreen(false);
    };

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    const handleCancelEvaluation = () => {
        setIsFullScreen(false);
        setSelectedWorkId(null);
        setScores({});
        setComment("");
    };

    return (
        <div className="animate-fadeIn space-y-8 relative">
            <div className={`flex justify-between items-center ${isFullScreen ? 'hidden' : ''}`}>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Bienvenida, {user.name}</h2>
                    <p className="text-gray-600">Panel de Jurado - {user.specialty}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Cargando asignaciones...</p>
                </div>
            ) : works.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 min-h-[500px] flex items-center justify-center">
                    <DevelopmentView
                        title="Aún no hay trabajos asignados"
                        message="El comité académico aún no le ha asignado trabajos para evaluar. Recibirá una notificación cuando se le asignen nuevos trabajos."
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar / List */}
                    <div className={`lg:col-span-1 transition-all duration-300 ${isFullScreen ? 'hidden' : ''}`}>
                        <h3 className="font-bold text-gray-900 text-lg mb-4">Trabajos Asignados</h3>
                        <div className="space-y-4">
                            {works.map((work) => {
                                const isWorkEvaluated = work.evaluations?.some(e => (e.jurorId || e.juror_id) === user.id);
                                const isSelected = selectedWorkId === work.id;
                                const isDimmed = selectedWorkId && !isSelected;

                                return (
                                    <Card
                                        key={work.id}
                                        className={`p-4 transition-all duration-300 group 
                                            ${isSelected ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50/30' : 'hover:border-blue-300 cursor-pointer'}
                                            ${isDimmed ? 'opacity-40 grayscale-[0.5] scale-[0.98]' : 'scale-100'}
                                        `}
                                        onClick={() => handleWorkSelect(work.id)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant={isSelected ? "primary" : "secondary"}>{work.type}</Badge>
                                            <span className="text-xs font-mono text-gray-500">{work.id}</span>
                                        </div>
                                        <h4 className={`font-bold transition-colors mb-2 ${isSelected ? 'text-blue-900' : 'text-gray-900 group-hover:text-blue-700'}`}>
                                            {work.title}
                                        </h4>
                                        <div className="text-sm text-gray-600 mb-4">Autor oculto (Ciego)</div>

                                        {isWorkEvaluated ? (
                                            <div className="flex items-center gap-2 text-sm text-green-700 font-bold bg-green-50 p-2 rounded mb-2">
                                                <CheckCircle size={16} />
                                                Calificado
                                            </div>
                                        ) : (
                                            drafts && drafts[work.id] && (
                                                <div className="flex items-center gap-1 text-xs text-amber-600 font-medium mb-3 bg-amber-50 w-fit px-2 py-1 rounded">
                                                    <Save size={12} />
                                                    Borrador guardado
                                                </div>
                                            )
                                        )}

                                        <Button
                                            variant={isSelected ? "primary" : "outline"}
                                            className="w-full justify-center text-sm py-1.5"
                                            disabled={isWorkEvaluated && !isSelected}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleWorkSelect(work.id);
                                            }}
                                        >
                                            {isSelected ? (isWorkEvaluated ? "Ver Calificación" : "Evaluando...") : (isWorkEvaluated ? "Ver Detalles" : "Evaluar")}
                                        </Button>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Evaluation Panel */}
                    <div className={`transition-all duration-500 ease-in-out
                        ${isFullScreen
                            ? 'fixed inset-0 z-50 bg-white overflow-y-auto'
                            : 'lg:col-span-2 bg-gray-50 rounded-xl p-6 border border-gray-200 h-fit sticky top-6'}
                    `}>
                        <div className={`${isFullScreen ? 'max-w-5xl mx-auto p-8 lg:p-12' : ''}`}>
                            <div className={`${isFullScreen ? 'mb-10' : 'mb-6 border-b border-gray-200 pb-4'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-blue-800">
                                        <FileText size={isFullScreen ? 28 : 24} />
                                        <h3 className={`font-bold ${isFullScreen ? 'text-2xl' : 'text-xl'}`}>
                                            Rúbrica de Evaluación
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedWorkId && (
                                            <>
                                                {isFullScreen ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={toggleFullScreen}
                                                        title="Salir Pantalla Completa"
                                                        className="p-2"
                                                    >
                                                        <Minimize2 size={20} />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={toggleFullScreen}
                                                        title="Pantalla Completa"
                                                        className="p-2 hover:bg-blue-50 text-blue-600 border-blue-200"
                                                    >
                                                        <Maximize2 size={20} />
                                                    </Button>
                                                )}
                                                {isFullScreen && (
                                                    <button
                                                        onClick={handleCancelEvaluation}
                                                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors ml-4"
                                                        title="Cerrar Evaluación"
                                                    >
                                                        <X size={24} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {isFullScreen && selectedWork && (
                                    <div className="mt-8 mb-4 text-center animate-fadeIn">
                                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full mb-3 inline-block">
                                            {selectedWork.id}
                                        </span>
                                        <h1 className="text-3xl md:text-4xl font-black text-gray-950 leading-tight max-w-4xl mx-auto">
                                            {selectedWork.title}
                                        </h1>
                                        <div className="w-24 h-1.5 bg-blue-600 mx-auto mt-6 rounded-full opacity-50"></div>
                                    </div>
                                )}
                            </div>

                            {!selectedWorkId ? (
                                <div className="text-center py-24 text-gray-500">
                                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertTriangle size={32} className="text-gray-400" />
                                    </div>
                                    <p className="text-lg">Seleccione un trabajo de la izquierda para comenzar la evaluación.</p>
                                </div>
                            ) : (
                                <div className="animate-fadeIn">
                                    {isEvaluated && (
                                        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                                            <div className="bg-green-100 p-2 rounded-full text-green-700">
                                                <CheckCircle size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-green-800">Trabajo Calificado</h4>
                                                <p className="text-sm text-green-700">Ya ha enviado su evaluación para este trabajo. Los campos están bloqueados.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        {rubrics.map((criteria) => {
                                            const max = criteria.max_score || 5;
                                            const scoreArray = Array.from({ length: Math.floor(max) + 1 }, (_, i) => i);

                                            return (
                                                <div key={criteria.id} className={`bg-white p-4 rounded-lg border shadow-sm transition-all group ${isEvaluated ? 'opacity-90 bg-gray-50' : 'border-gray-100 hover:border-blue-200'}`}>
                                                    <div className="flex justify-between text-sm mb-3 text-gray-800 font-bold items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span>{criteria.title}</span>
                                                            {!isEvaluated && criteria.description && (
                                                                <div className="relative group/tooltip">
                                                                    <div className="cursor-help text-blue-400 hover:text-blue-600 transition-colors">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                                                    </div>
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 pointer-events-none">
                                                                        {criteria.description}
                                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-blue-600 text-lg">
                                                            {scores[criteria.id] !== undefined ? `${scores[criteria.id]} pts` : '-'}
                                                        </span>
                                                    </div>

                                                    {isEvaluated ? (
                                                        <div className="flex justify-center py-2">
                                                            <div className="text-lg font-bold text-gray-800 bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center">
                                                                {scores[criteria.id]}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-between gap-1">
                                                            {scoreArray.map((val) => (
                                                                <button
                                                                    key={val}
                                                                    onClick={() => handleScoreChange(criteria.id, val)}
                                                                    className={`
                                                                        w-full py-2 rounded-md font-medium text-sm transition-all
                                                                        ${scores[criteria.id] === val
                                                                            ? 'bg-blue-600 text-white shadow-md scale-105'
                                                                            : 'bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm'}
                                                                    `}
                                                                >
                                                                    {val}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-8">
                                        <label className="block text-sm font-bold text-gray-900 mb-2">
                                            Comentarios cualitativos
                                        </label>
                                        <textarea
                                            className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none shadow-sm ${isEvaluated ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
                                                }`}
                                            rows="4"
                                            placeholder="Escriba aquí sus observaciones y retroalimentación para el autor..."
                                            value={comment}
                                            onChange={(e) => {
                                                if (isEvaluated) return;
                                                setComment(e.target.value);
                                                if (error) setError("");
                                            }}
                                            disabled={isEvaluated}
                                        />
                                    </div>

                                    {error && (
                                        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 animate-shake">
                                            <AlertTriangle size={20} />
                                            {error}
                                        </div>
                                    )}

                                    <div className="mt-8 flex justify-end">
                                        <Button
                                            onClick={validateAndSubmit}
                                            disabled={isEvaluated}
                                            className={`
                                                px-8 py-3 text-lg font-bold shadow-lg transition-transform active:scale-95
                                                ${isEvaluated ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'}
                                            `}
                                        >
                                            {isEvaluated ? "Evaluación Finalizada (Bloqueada)" : "Enviar Calificación"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <Modal isOpen={showModal} onClose={closeModal} title="Confirmar Calificación">
                <div className="text-center py-4">
                    <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">¿Enviar calificación definitiva?</h3>
                    <p className="text-gray-600 mb-6">
                        Una vez enviada, <strong>no podrá modificarla</strong>. Asegúrese de haber revisado todos los criterios.
                    </p>

                    <div className="bg-gray-50 p-4 rounded-lg mb-8 text-left max-w-sm mx-auto border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wide border-b pb-1">Resumen</h4>
                        {rubrics.map(r => (
                            <div key={r.id} className="flex justify-between text-sm py-1">
                                <span className="text-gray-600 truncate pr-4">{r.title}</span>
                                <span className="font-mono font-bold text-gray-900">{scores[r.id]} pts</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-lg">
                            <span className="text-blue-900">Total</span>
                            <span className="text-blue-600">{totalScore} pts</span>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <Button variant="outline" onClick={closeModal} className="px-6">Volver</Button>
                        <Button onClick={confirmSubmission} className="px-8 bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all">
                            Confirmar y Enviar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
};

export default JuryDashboard;
