import React, { useState, useEffect, useRef } from 'react';
import { useAulaVirtual } from '../../context/AulaVirtualContext';
import { Exam, Question, StudentExamAttempt } from '../../types';
import Swal from 'sweetalert2';

interface StudentExamRunnerProps {
    examId: string | number;
    onFinish: (attempt: StudentExamAttempt) => void;
    onBack: () => void;
}

const StudentExamRunner: React.FC<StudentExamRunnerProps> = ({ examId, onFinish, onBack }) => {
    const {
        getExamById,
        currentUser,
        getExamAttempts,
        saveExamAttempt,
        courses
    } = useAulaVirtual();
    const [exam, setExam] = useState<Exam | undefined>(undefined);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string | number, any>>({});
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [currentAttemptId, setCurrentAttemptId] = useState<string | undefined>(undefined);
    const isSubmitting = useRef(false);

    // Initial load and attempt session management
    useEffect(() => {
        const e = getExamById(examId);
        if (e && currentUser) {

            // Randomize questions if enabled
            let examQuestions = [...e.questions];
            if (e.randomOrder) {
                examQuestions = examQuestions.sort(() => Math.random() - 0.5);
            }

            const examWithShuffle = { ...e, questions: examQuestions };
            setExam(examWithShuffle);

            // Concentration Mode
            if (e.concentrationMode) {
                try {
                    document.documentElement.requestFullscreen();
                } catch (err) {
                    console.error("Fullscreen denied", err);
                }
            }

            // Check for existing in-progress attempt for this user and exam
            const userAttempts = getExamAttempts(currentUser.id, examId);
            const activeAttempt = userAttempts.find(a => a.status === 'IN_PROGRESS');

            if (activeAttempt) {
                console.log("Resuming existing attempt:", activeAttempt.id);
                setAnswers(activeAttempt.answers || {});
                setCurrentAttemptId(activeAttempt.id);

                // Calculate remaining time based on original start time
                const start = new Date(activeAttempt.startedAt).getTime();
                const now = new Date().getTime();
                const elapsedSeconds = Math.floor((now - start) / 1000);
                const totalSeconds = (e.timeLimit || 60) * 60;
                const remaining = Math.max(0, totalSeconds - elapsedSeconds);

                setTimeLeft(remaining);

                // If time already expired while away, submit immediately
                if (remaining === 0) {
                    handleSubmit(true);
                }
            } else {
                // Create new attempt record
                const newId = `attempt_${Date.now()}_${currentUser.id}`;
                const newAttempt: StudentExamAttempt = {
                    id: newId,
                    examId: e.id,
                    userId: currentUser.id,
                    courseId: e.courseId,
                    startedAt: new Date().toISOString(),
                    status: 'IN_PROGRESS',
                    answers: {},
                    timeSpent: 0
                };
                console.log("Starting new attempt:", newId);
                saveExamAttempt(newAttempt);
                setCurrentAttemptId(newId);
                setTimeLeft((e.timeLimit || 60) * 60);
            }
        }
    }, [examId, getExamById, currentUser?.id]);

    // Concentration Mode Events
    useEffect(() => {
        if (!exam?.concentrationMode || !currentAttemptId) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Show warning FIRST, then submit
                Swal.fire({
                    title: 'Examen Finalizado',
                    text: 'Se ha detectado que saliste de la pantalla del examen. Por seguridad (Modo Concentración), tu examen será enviado automáticamente.',
                    icon: 'warning',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    confirmButtonText: 'Entendido'
                }).then(() => {
                    handleSubmit(true);
                });
            }
        };

        // Enforce Fullscreen loop
        const interval = setInterval(() => {
            if (exam.concentrationMode && !document.fullscreenElement) {
                // User exited fullscreen
                // Pause interval to avoid multiple alerts if possible, but interval continues.
                // We rely on Swal blocking or isSubmitting ref.
                if (!isSubmitting.current && !Swal.isVisible()) {
                    Swal.fire({
                        title: 'Modo Concentración Interrumpido',
                        text: 'Has salido del modo pantalla completa. El examen se enviará automáticamente.',
                        icon: 'error',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        confirmButtonText: 'Entendido'
                    }).then(() => {
                        handleSubmit(true);
                    });
                }
            }
        }, 2000);

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            clearInterval(interval);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(console.error);
            }
        };
    }, [exam?.concentrationMode, currentAttemptId]);

    // Timer logic
    useEffect(() => {
        if (timeLeft <= 0 && exam && currentAttemptId) {
            if (!isSubmitting.current) {
                handleSubmit(true); // Auto-submit on timeout
            }
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, exam?.id, currentAttemptId]);

    // Format time
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleAnswer = (val: any) => {
        if (!exam || !currentAttemptId) return;
        const currentQ = exam.questions[currentQIndex];
        const newAnswers = { ...answers, [currentQ.id]: val };
        setAnswers(newAnswers);

        // Persistent auto-save to database/context
        const userAttempts = getExamAttempts(currentUser.id, examId);
        const activeAttempt = userAttempts.find(a => a.id === currentAttemptId);
        if (activeAttempt) {
            saveExamAttempt({
                ...activeAttempt,
                answers: newAnswers
            });
        }
    };

    const handleNext = () => {
        if (!exam) return;
        if (currentQIndex < exam.questions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQIndex > 0) {
            setCurrentQIndex(prev => prev - 1);
        }
    };

    const calculateScore = (finalAnswers: any) => {
        if (!exam) return 0;
        let totalPoints = 0;
        let earnedPoints = 0;

        exam.questions.forEach(q => {
            totalPoints += q.points;
            const userAns = finalAnswers[q.id];

            if (q.type === 'multiple_choice') {
                const correctOption = q.options?.find(o => o.isCorrect);
                if (correctOption && String(correctOption.id) === String(userAns)) {
                    earnedPoints += q.points;
                }
            } else if (q.type === 'true_false') {
                if (String(q.correctAnswer) === String(userAns)) {
                    earnedPoints += q.points;
                }
            } else if (q.type === 'short_answer') {
                // Simplified: check exact match or if user answer is in list of correct answers
                const isCorrect = Array.isArray(q.correctAnswer)
                    ? q.correctAnswer.some(a => String(a).toLowerCase() === String(userAns).toLowerCase())
                    : String(q.correctAnswer).toLowerCase() === String(userAns).toLowerCase();
                if (isCorrect) earnedPoints += q.points;
            }
        });

        return Math.round((earnedPoints / totalPoints) * 100) || 0;
    };

    const handleSubmit = (silent = false) => {
        if (!exam || !currentAttemptId || isSubmitting.current) return;

        const performSubmit = () => {
            isSubmitting.current = true;
            const score = calculateScore(answers);

            // Get original attempt to preserve startedAt
            const userAttempts = getExamAttempts(currentUser.id, examId);
            const activeAttempt = userAttempts.find(a => a.id === currentAttemptId);

            const finalAttempt: StudentExamAttempt = {
                id: currentAttemptId,
                examId: exam.id,
                userId: currentUser.id,
                courseId: exam.courseId,
                startedAt: activeAttempt?.startedAt || new Date().toISOString(),
                completedAt: new Date().toISOString(),
                status: 'COMPLETED',
                score,
                answers,
                timeSpent: ((exam.timeLimit || 60) * 60) - timeLeft
            };

            saveExamAttempt(finalAttempt);

            // Exit Fullscreen if in concentration mode
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }

            if (silent) {
                // If silent (timeout/security), we usually don't show success, just callback.
                // But user asked for specific "Shown Results" behavior.
                // If silent, we probably just redirect.
                onFinish(finalAttempt);
            } else {
                if (exam.showResults) {
                    // Default behavior, show score etc.
                    onFinish(finalAttempt);
                } else {
                    // Custom "Exam Sent" message
                    Swal.fire({
                        title: 'Examen Enviado',
                        text: 'Tus respuestas han sido registradas exitosamente.',
                        icon: 'success',
                        confirmButtonText: 'Volver al curso',
                        confirmButtonColor: '#2563eb'
                    }).then(() => {
                        onFinish(finalAttempt);
                    });
                }
            }
        };

        if (silent) {
            performSubmit();
        } else {
            Swal.fire({
                title: '¿Finalizar examen?',
                text: "Asegúrate de haber respondido todas las preguntas posibles.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb', // blue-600
                cancelButtonColor: '#64748b', // slate-500
                confirmButtonText: 'Sí, finalizar',
                cancelButtonText: 'Seguir revisando'
            }).then((result) => {
                if (result.isConfirmed) {
                    performSubmit();
                }
            });
        }
    };

    if (!exam) return <div className="p-10 text-center">Cargando examen...</div>;

    if (!exam.questions || exam.questions.length === 0) {
        return (
            <div className="p-10 text-center flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-4xl text-slate-300">quiz</span>
                <p className="text-slate-500">Este examen no tiene preguntas configuradas.</p>
                <button onClick={onBack} className="text-blue-600 font-bold hover:underline">Volver</button>
            </div>
        );
    }

    const currentQuestion = exam.questions[currentQIndex];

    if (!currentQuestion) {
        return <div className="p-10 text-center">Error al cargar la pregunta.</div>;
    }

    return (
        <div className="flex-1 bg-background-light flex flex-col h-full overflow-hidden">
            <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] mx-auto w-full p-4 lg:p-8 gap-6 h-full">

                <main className="flex-1 flex flex-col gap-6 overflow-y-auto min-w-0">
                    {/* Header Info */}
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
                            <span className="bg-blue-100 text-primary px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border border-blue-200">Examen</span>
                            <span>|</span>
                            <span>{courses.find(c => c.id === exam.courseId)?.title || exam.courseName}</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 leading-tight">{exam.title}</h1>
                    </div>

                    {/* Question Container */}
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col gap-8 animate-in fade-in duration-300">

                        {/* Question Header */}
                        <div className="flex items-end justify-between border-b border-slate-100 pb-5">
                            <div>
                                <span className="text-xs font-bold text-primary mb-1 block uppercase tracking-wider flex items-center gap-2">
                                    Pregunta {currentQIndex + 1} de {exam.questions.length}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-orange-50 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-100">{currentQuestion.points} Puntos</span>
                            </div>
                        </div>

                        {/* Question Text */}
                        <div className="prose prose-lg max-w-none">
                            <p className="text-lg md:text-xl text-slate-900 font-medium leading-relaxed">
                                {currentQuestion.text}
                            </p>
                        </div>

                        {/* Answer Area */}
                        <div className="flex flex-col gap-4">
                            {currentQuestion.type === 'multiple_choice' && (
                                <div className="grid gap-3">
                                    {currentQuestion.options?.map((opt: any, i: number) => {
                                        const letter = String.fromCharCode(65 + i);
                                        const isSelected = String(answers[currentQuestion.id]) === String(opt.id);
                                        return (
                                            <label key={opt.id} className="group relative cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`q_${currentQuestion.id}`}
                                                    className="peer sr-only"
                                                    value={opt.id}
                                                    checked={isSelected}
                                                    onChange={() => handleAnswer(opt.id)}
                                                />
                                                <div className={`flex items-center gap-4 p-4 md:p-5 rounded-xl border-2 transition-all duration-200 ${isSelected
                                                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                                                    : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50'
                                                    }`}>
                                                    <div className={`flex-none w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-200 ${isSelected
                                                        ? 'bg-blue-600 border-blue-600 text-white'
                                                        : 'border-slate-200 text-slate-400 group-hover:border-blue-400 group-hover:text-blue-600'
                                                        }`}>
                                                        {isSelected ? (
                                                            <span className="material-symbols-outlined text-[20px]">check</span>
                                                        ) : (
                                                            <span>{letter}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className={`text-base font-medium transition-colors ${isSelected ? 'text-blue-700' : 'text-slate-700 group-hover:text-slate-900'
                                                            }`}>
                                                            {opt.text}
                                                        </span>
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {currentQuestion.type === 'true_false' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {[
                                        { id: 'true', text: 'Verdadero', letter: 'V' },
                                        { id: 'false', text: 'Falso', letter: 'F' }
                                    ].map((opt) => {
                                        const isSelected = answers[currentQuestion.id] === opt.id;
                                        return (
                                            <label key={opt.id} className="relative cursor-pointer group">
                                                <input
                                                    className="peer sr-only"
                                                    name={`q_${currentQuestion.id}`}
                                                    type="radio"
                                                    value={opt.id}
                                                    checked={isSelected}
                                                    onChange={() => handleAnswer(opt.id)}
                                                />
                                                <div className={`h-full p-6 rounded-xl border-2 transition-all flex items-center gap-4 ${isSelected
                                                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                                                    : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50'
                                                    }`}>
                                                    <div className={`flex-none w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-200 ${isSelected
                                                        ? 'bg-blue-600 border-blue-600 text-white'
                                                        : 'border-slate-200 text-slate-400 group-hover:border-blue-400 group-hover:text-blue-600'
                                                        }`}>
                                                        {isSelected ? (
                                                            <span className="material-symbols-outlined text-[20px]">check</span>
                                                        ) : (
                                                            <span>{opt.letter}</span>
                                                        )}
                                                    </div>
                                                    <span className={`text-lg font-bold transition-colors ${isSelected ? 'text-blue-700' : 'text-slate-800'
                                                        }`}>{opt.text}</span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {currentQuestion.type === 'short_answer' && (
                                <textarea
                                    className="w-full min-h-[200px] bg-slate-50 border border-slate-300 rounded-lg p-5 outline-none resize-y"
                                    placeholder="Escriba su respuesta aquí..."
                                    value={answers[currentQuestion.id] || ''}
                                    onChange={(e) => handleAnswer(e.target.value)}
                                ></textarea>
                            )}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-auto pt-4 pb-4">
                        <button
                            onClick={handlePrev}
                            disabled={currentQIndex === 0}
                            className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>

                        {currentQIndex === exam.questions.length - 1 ? (
                            <button
                                onClick={() => handleSubmit()}
                                className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/25 transition-all"
                            >
                                Finalizar Examen
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/25 transition-all"
                            >
                                Siguiente
                            </button>
                        )}
                    </div>
                </main>

                {/* Sidebar */}
                <aside className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-6">
                    {/* Timer */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col items-center gap-2 sticky top-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Tiempo Restante</span>
                        <div className={`text-4xl font-black tabular-nums tracking-tight ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    {/* Progress Grid */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
                        <h4 className="font-bold text-slate-900 text-sm uppercase">Progreso</h4>
                        <div className="grid grid-cols-5 gap-2">
                            {exam.questions.map((q, i) => {
                                const isCurrent = i === currentQIndex;
                                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentQIndex(i)}
                                        className={`aspect-square rounded flex items-center justify-center text-sm font-bold transition-all ${isCurrent ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200' :
                                            isAnswered ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button onClick={onBack} className="text-slate-500 text-sm hover:underline self-center">
                        Salir del Examen
                    </button>
                </aside>

            </div>
        </div>
    );
};

export default StudentExamRunner;
