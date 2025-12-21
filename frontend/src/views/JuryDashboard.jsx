import React, { useState, useEffect } from 'react';
import { useModal, useLocalStorage } from '../hooks';
import { FileText, Save, CheckCircle } from 'lucide-react';
import { Button, Card, Badge, Modal, FormField } from '../components/ui';
import DevelopmentView from '../components/common/DevelopmentView';
import { api } from '../services/api';

const JuryDashboard = ({ user }) => {
    const [works, setWorks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWorkId, setSelectedWorkId] = useState(null);
    const [scores, setScores] = useState({});
    const [comment, setComment] = useState("");
    const { isOpen: showModal, open: openModal, close: closeModal } = useModal();
    const [error, setError] = useState("");

    // Load assigned works
    useEffect(() => {
        const loadWorks = async () => {
            setLoading(true);
            try {
                const allWorks = await api.works.getAll();
                // Filter works assigned to this user
                const myWorks = allWorks.filter(w => {
                    if (!w.jury) return false;
                    // Check array of jury IDs
                    if (Array.isArray(w.jury)) {
                        return w.jury.includes(user.id);
                    }
                    // Legacy single string check
                    return w.jury === user.id || w.jury === user.name;
                });
                setWorks(myWorks);
            } catch (err) {
                console.error("Error loading works:", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadWorks();
        }
    }, [user]);

    // Draft Persistence
    const [drafts, setDrafts, removeDrafts] = useLocalStorage('jury_drafts', {});

    // Load draft when switching works
    useEffect(() => {
        if (selectedWorkId) {
            const savedDraft = drafts[selectedWorkId];
            if (savedDraft) {
                setScores(savedDraft.scores || {});
                setComment(savedDraft.comment || "");
            } else {
                setScores({});
                setComment("");
            }
        }
    }, [selectedWorkId]); // Only run when ID changes, not drafts

    // Auto-save draft when scores or comment change
    useEffect(() => {
        if (selectedWorkId) {
            // Only save if there is some data
            const hasData = Object.keys(scores).length > 0 || comment.trim() !== "";
            if (hasData) {
                setDrafts(prev => ({
                    ...prev,
                    [selectedWorkId]: { scores, comment }
                }));
            }
        }
    }, [scores, comment, selectedWorkId]); // Only save on content change

    // Config loading
    const [academicConfig, setAcademicConfig] = useState(null);

    useEffect(() => {
        const loadConfig = async () => {
            const config = await api.academic.getConfig();
            setAcademicConfig(config);
        };
        loadConfig();
    }, []);

    // Derived criteria based on selected work type
    const selectedWork = works.find(w => w.id === selectedWorkId);

    // Default criteria if config not loaded or rubrics empty (fallback)
    const defaultCriteria = [
        { name: "Originalidad del trabajo", description: "Evalúa si el trabajo presenta ideas novedosas." },
        { name: "Relevancia clínica / científica", description: "Impacto potencial de los hallazgos." },
        { name: "Claridad de metodología", description: "Diseño claro y reproducible." },
        { name: "Calidad de resultados", description: "Precisión y validez de datos." },
        { name: "Calidad de presentación", description: "Redacción y estructura." }
    ];

    const criteriaList = (selectedWork && academicConfig?.rubrics)
        ? academicConfig.rubrics.filter(r => r.active && (!r.workTypes || r.workTypes.includes(selectedWork.type)))
        : defaultCriteria;

    const handleScoreChange = (criteriaName, score) => {
        setScores(prev => ({
            ...prev,
            [criteriaName]: score
        }));
        if (error) setError("");
    };

    const validateAndSubmit = () => {
        const allScored = criteriaList.every(c => scores[c.name] !== undefined && scores[c.name] !== null);
        if (!allScored) {
            setError("Por favor, califique todos los criterios antes de enviar.");
            return;
        }
        setError("");
        openModal();
    };

    const confirmSubmission = async () => {
        try {
            await api.works.addEvaluation(selectedWorkId, {
                jurorId: user.id,
                jurorName: user.name,
                scores: scores,
                totalScore: totalScore,
                comment: comment
            });

            // Update local state to reflect change immediately
            setWorks(prev => prev.map(w => {
                if (w.id === selectedWorkId) {
                    const existingEvals = w.evaluations || [];
                    return {
                        ...w,
                        evaluations: [...existingEvals, {
                            jurorId: user.id,
                            scores,
                            totalScore,
                            comment
                        }]
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
            // Optional: Don't clear selection immediately so user sees "Finished" state
            // setSelectedWorkId(null); 
            // setScores({});
            // setComment("");

        } catch (error) {
            console.error("Error saving evaluation:", error);
            setError("Error al guardar la calificación. Intente nuevamente.");
        }
    };

    const totalScore = Object.values(scores).reduce((a, b) => a + (b || 0), 0);

    // Check if current selected work is already evaluated by this user
    const currentEvaluation = selectedWork?.evaluations?.find(e => e.jurorId === user.id);
    const isEvaluated = !!currentEvaluation;

    // Load existing evaluation data if available (Read Only Mode)
    useEffect(() => {
        if (isEvaluated && currentEvaluation) {
            setScores(currentEvaluation.scores || {});
            setComment(currentEvaluation.comment || "");
        } else if (selectedWorkId && !isEvaluated) {
            // Restore draft or reset
            const savedDraft = drafts[selectedWorkId];
            if (savedDraft) {
                setScores(savedDraft.scores || {});
                setComment(savedDraft.comment || "");
            } else {
                setScores({});
                setComment("");
            }
        }
    }, [selectedWorkId, isEvaluated, currentEvaluation]);

    return (
        <div className="animate-fadeIn space-y-8 relative">
            <div className="flex justify-between items-center">
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
                    <div className="lg:col-span-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-4">Trabajos Asignados</h3>
                        <div className="space-y-4">
                            {works.map((work) => {
                                const isWorkEvaluated = work.evaluations?.some(e => e.jurorId === user.id);
                                return (
                                    <Card
                                        key={work.id}
                                        className={`p-4 hover:border-blue-300 cursor-pointer transition-colors group ${selectedWorkId === work.id ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                                        onClick={() => setSelectedWorkId(work.id)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge>{work.type}</Badge>
                                            <span className="text-xs font-mono text-gray-500">{work.id}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 mb-2 group-hover:text-blue-700">{work.title}</h4>
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
                                            variant={selectedWorkId === work.id ? "primary" : "outline"}
                                            className="w-full justify-center text-sm py-1.5"
                                            disabled={isWorkEvaluated && selectedWorkId !== work.id}
                                        >
                                            {selectedWorkId === work.id ? (isWorkEvaluated ? "Ver Calificación" : "Evaluando...") : (isWorkEvaluated ? "Ver Detalles" : "Evaluar")}
                                        </Button>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-gray-50 rounded-xl p-6 border border-gray-200 h-fit sticky top-6">
                        <div className="flex items-center gap-2 mb-6 text-blue-800 border-b border-gray-200 pb-4">
                            <FileText size={24} />
                            <h3 className="font-bold text-xl">Rubrica de Evaluación</h3>
                        </div>

                        {!selectedWorkId ? (
                            <div className="text-center py-20 text-gray-500">
                                <p className="text-lg">Seleccione un trabajo de la izquierda para comenzar la evaluación.</p>
                            </div>
                        ) : (
                            <>
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
                                    {criteriaList.map((criteria, i) => (
                                        <div key={i} className={`bg-white p-4 rounded-lg border shadow-sm relative group ${isEvaluated ? 'opacity-90 bg-gray-50' : 'border-gray-100'}`}>
                                            <div className="flex justify-between text-sm mb-3 text-gray-800 font-bold items-center">
                                                <div className="flex items-center gap-2">
                                                    <span>{criteria.name}</span>
                                                    {!isEvaluated && (
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
                                                    {scores[criteria.name] !== undefined ? `${scores[criteria.name]} pts` : '-'}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 justify-between">
                                                {[0, 1, 2, 3, 4, 5].map((num) => (
                                                    <button
                                                        key={num}
                                                        onClick={() => !isEvaluated && handleScoreChange(criteria.name, num)}
                                                        disabled={isEvaluated}
                                                        className={`
                                                            w-10 h-10 rounded-full font-bold text-sm transition-all
                                                            ${scores[criteria.name] === num
                                                                ? 'bg-blue-600 text-white scale-110 shadow-md ring-2 ring-blue-200'
                                                                : isEvaluated
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-blue-400 hover:text-blue-600 hover:bg-white'}
                                                        `}
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8">
                                    <FormField
                                        label="Comentarios cualitativos"
                                        type="textarea"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder={isEvaluated ? "Sin comentarios" : "Ingrese sus observaciones detalladas aquí..."}
                                        rows={4}
                                        className="h-auto"
                                        disabled={isEvaluated}
                                    />
                                </div>

                                <div className="pt-6">
                                    {error && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm animate-fadeIn">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                            {error}
                                        </div>
                                    )}
                                    {!isEvaluated && (
                                        <Button
                                            onClick={validateAndSubmit}
                                            className="w-full justify-center bg-blue-700 hover:bg-blue-800 text-lg py-3 shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-1"
                                        >
                                            Enviar Calificación
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={closeModal}
                    title="Confirmar Evaluación"
                    size="md"
                    className="overflow-hidden"
                >
                    <div className="space-y-4">
                        <p className="text-gray-600 text-sm">
                            Por favor revise el resumen de su calificación. <br />
                            <span className="font-bold text-red-500">Una vez enviada, no podrá ser modificada.</span>
                        </p>

                        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                            {criteriaList.map((c, i) => (
                                <div key={i} className="flex justify-between">
                                    <span className="text-gray-600">{c.name}</span>
                                    <span className="font-bold text-gray-900">{scores[c.name]} pts</span>
                                </div>
                            ))}
                            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-base">
                                <span>Puntaje Total</span>
                                <span className="text-blue-700">{totalScore} pts</span>
                            </div>
                        </div>

                        {comment && (
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase">Comentarios</span>
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mt-1 italic">"{comment}"</p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={closeModal}
                                className="flex-1 justify-center"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={confirmSubmission}
                                className="flex-1 justify-center bg-blue-700 hover:bg-blue-800"
                            >
                                Confirmar y Enviar
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default JuryDashboard;
