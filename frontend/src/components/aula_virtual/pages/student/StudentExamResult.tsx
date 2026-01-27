import React, { useState, useEffect } from 'react';
import { useAulaVirtual } from '../../context/AulaVirtualContext';
import { Exam, StudentExamAttempt } from '../../types';

interface StudentExamResultProps {
    attemptId?: string;
    examIdProp?: string | number;
    onBack: () => void;
    onRetake: () => void;
}

const StudentExamResult: React.FC<StudentExamResultProps> = ({ attemptId, examIdProp, onBack, onRetake }) => {
    const { getExamById, currentUser, getExamAttempts, examAttempts } = useAulaVirtual();
    const [attempt, setAttempt] = useState<StudentExamAttempt | null>(null);
    const [exam, setExam] = useState<Exam | undefined>(undefined);
    const [allAttempts, setAllAttempts] = useState<StudentExamAttempt[]>([]);

    // Hack: search through all user attempts in context? No, let's pass attempt object or refetch. 
    // To be clean, let's use the hook to find it.

    useEffect(() => {
        let currentExamId = examIdProp;
        let foundAttempt: StudentExamAttempt | undefined;

        if (attemptId) {
            foundAttempt = examAttempts.find(a => a.id === attemptId);
            if (foundAttempt) {
                currentExamId = foundAttempt.examId;
                setAttempt(foundAttempt);
            }
        } else if (examIdProp) {
            // Fallback: find latest attempt for this exam
            const userAttempts = examAttempts.filter(a => String(a.examId) === String(examIdProp) && a.userId === currentUser.id);
            // Sort by completedAt desc
            const sorted = userAttempts.sort((a, b) => {
                const dateA = new Date(a.completedAt || a.startedAt).getTime();
                const dateB = new Date(b.completedAt || b.startedAt).getTime();
                return dateB - dateA;
            });
            if (sorted.length > 0) {
                foundAttempt = sorted[0];
                setAttempt(foundAttempt);
            }
        }

        if (currentExamId) {
            const e = getExamById(currentExamId);
            if (e) {
                setExam(e);
                // Load all attempts for history
                const userAttempts = examAttempts.filter(a => String(a.examId) === String(currentExamId) && a.userId === currentUser.id);
                // Sort by date (latest first)
                setAllAttempts(userAttempts.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()));
            }
        }
    }, [attemptId, examIdProp, examAttempts, getExamById, currentUser.id]);

    if (!attempt || !exam) return <div className="p-10 text-center">Cargando resultados...</div>;

    if (!attempt || !exam) return <div className="p-10 text-center">Cargando resultados...</div>;

    const passingScore = exam.passingScore ?? exam.minScore ?? 70;
    const isPassed = (attempt.score || 0) >= passingScore;

    // Retake Logic
    const maxAttempts = exam.attempts || 1;
    // Count only completed attempts for limit? or all? usually all.
    // Assuming 'status' helps distinguish if needed, but let's count strictly.
    const usedAttempts = allAttempts.length;
    const canRetake = usedAttempts < maxAttempts;

    return (
        <div className="flex-1 bg-background-light p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                {/* Result Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-2 ${isPassed ? 'bg-green-500' : 'bg-red-500'}`}></div>

                    <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 ${isPassed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        <span className="material-symbols-outlined text-5xl">{isPassed ? 'check_circle' : 'cancel'}</span>
                    </div>

                    <h1 className="text-3xl font-black text-slate-900 mb-2">
                        {isPassed ? `¡Felicitaciones, ${currentUser.name.split(' ')[0]}!` : 'Sigue intentándolo'}
                    </h1>
                    <p className="text-slate-500 mb-8 max-w-lg mx-auto">
                        {isPassed
                            ? `Has superado con éxito el examen de ${exam.title}. Tu comprensión de los temas es excelente.`
                            : `No has alcanzado el puntaje mínimo para aprobar el examen de ${exam.title}. Revisa los materiales y vuelve a intentarlo.`
                        }
                    </p>

                    <div className="flex justify-center gap-10">
                        <div className="text-center">
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Calificación</span>
                            <span className={`text-4xl font-black ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                {attempt.score}/100
                            </span>
                        </div>
                        <div className="w-px bg-slate-200"></div>
                        <div className="text-center">
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estado</span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {isPassed ? 'Aprobado' : 'No Aprobado'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">timer</span>
                        </div>
                        <div>
                            <span className="block text-xs text-slate-500 font-bold uppercase">Tiempo</span>
                            <span className="text-lg font-bold text-slate-900">{Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s</span>
                        </div>
                    </div>
                    {/* Add more stats if needed */}
                </div>

                {/* Action Buttons (Moved to Top) */}
                <div className="flex justify-between pt-2 pb-6 border-b border-slate-100 mb-6">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900 px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                        Volver a Mis Exámenes
                    </button>
                    {canRetake && (
                        <button onClick={onRetake} className="flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-lg hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all">
                            <span className="material-symbols-outlined">refresh</span>
                            Reintentar Examen ({maxAttempts - usedAttempts} restantes)
                        </button>
                    )}
                </div>

                {/* Attempt History Table (Only if > 1 attempt) - Moved to Top */}
                {allAttempts.length > 1 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-900">Historial de Intentos</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3">#</th>
                                        <th className="px-6 py-3">Fecha</th>
                                        <th className="px-6 py-3 text-center">Puntaje</th>
                                        <th className="px-6 py-3 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {allAttempts.map((att, index) => {
                                        const attemptScore = att.score || 0;
                                        const attemptPassed = attemptScore >= passingScore;
                                        // Reverse index: Newest is top, but maybe label by true attempt number (total - index)?
                                        // Or just sequential based on startedAt order.
                                        // allAttempts is sorted DESC (latest first).
                                        // So the oldest (first) attempt is at index `length - 1`.
                                        // Attempt # = length - index.
                                        const attemptNumber = allAttempts.length - index;

                                        // Is this the attempt currently being viewed?
                                        const isCurrentView = att.id === attempt.id;

                                        return (
                                            <tr key={att.id} className={`hover:bg-slate-50 transition-colors ${isCurrentView ? 'bg-blue-50/30' : ''}`}>
                                                <td className="px-6 py-4 font-bold text-slate-700">
                                                    Intento {attemptNumber}
                                                    {isCurrentView && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">Viendo</span>}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {new Date(att.completedAt || att.startedAt).toLocaleDateString()}
                                                    <span className="text-slate-400 text-xs ml-1">
                                                        {new Date(att.completedAt || att.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-900">
                                                    {attemptScore}/100
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${attemptPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {attemptPassed ? 'Aprobado' : 'No Aprobado'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Question Review */}
                <h3 className="text-xl font-bold text-slate-900 mt-4">Revisión Detallada</h3>
                <div className="flex flex-col gap-4">
                    {exam.questions.map((q, i) => {
                        const userAns = attempt.answers[q.id];
                        // Simple correctness check for MC/TF
                        let isCorrect = false;
                        let correctAnswerText = '';

                        if (q.type === 'multiple_choice') {
                            const correctOpt = q.options?.find(o => o.isCorrect);
                            isCorrect = correctOpt?.id === userAns;
                            correctAnswerText = correctOpt?.text || '';
                        } else if (q.type === 'true_false') {
                            isCorrect = String(q.correctAnswer) === String(userAns === 'true');
                            correctAnswerText = q.correctAnswer ? 'Verdadero' : 'Falso';
                        }

                        return (
                            <div key={q.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-bold h-fit">{i + 1}</span>
                                        <h4 className="font-bold text-slate-900 text-lg">{q.text}</h4>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {isCorrect ? 'Correcta' : 'Incorrecta'}
                                    </span>
                                </div>

                                {/* Answers Display Logic */}
                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-sm">
                                    <p className="flex gap-2 mb-2">
                                        <span className="font-bold text-slate-700">Tu respuesta:</span>
                                        <span className={isCorrect ? 'text-green-700' : 'text-red-600'}>
                                            {q.type === 'multiple_choice'
                                                ? q.options?.find(o => o.id === userAns)?.text || 'Sin respuesta'
                                                : userAns === 'true' ? 'Verdadero' : userAns === 'false' ? 'Falso' : userAns || 'Sin respuesta'}
                                        </span>
                                    </p>
                                    {!isCorrect && (
                                        <p className="flex gap-2">
                                            <span className="font-bold text-slate-700">Respuesta correcta:</span>
                                            <span className="text-green-700 font-medium">{correctAnswerText}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Justification (Mocked if not present in data) */}
                                <div className="mt-4 flex gap-3 text-sm text-slate-600 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                    <span className="material-symbols-outlined text-blue-500">info</span>
                                    <div>
                                        <span className="block font-bold text-blue-800 text-xs uppercase mb-1">Justificación Académica</span>
                                        <p>{q.feedback || "La respuesta correcta se basa en los principios fundamentales tratados en el módulo."}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                </div>


            </div>
        </div>
    );
};

export default StudentExamResult;
