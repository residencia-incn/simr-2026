import React from 'react';
import { useAulaVirtual } from '../../context/AulaVirtualContext';
import { Exam } from '../../types';
import { canUserAccessCourse } from '../../../../services/api.js';

interface StudentExamDashboardProps {
    onStartExam: (examId: string | number) => void;
    onViewResult: (examId: string | number) => void;
}

const StudentExamDashboard: React.FC<StudentExamDashboardProps> = ({ onStartExam, onViewResult }) => {
    const { exams, currentUser, getExamAttempts, courses, getModulesByCourseId, getLessonsByModuleId, userProgress } = useAulaVirtual();

    // 1. Get accessible courses for this user
    const accessibleCourses = React.useMemo(() => {
        return courses.filter(course => canUserAccessCourse(currentUser, course));
    }, [courses, currentUser]);



    // 2. Identify Exams linked to Lessons in those accessible courses
    // Map ExamID -> CourseID to allow looking up the course context even if exam.courseId is missing/mismatch
    const allowedExamsMap = React.useMemo(() => {
        const map = new Map<string, string>();

        accessibleCourses.forEach(course => {
            // Check final exam
            if (course.finalExamId) {
                map.set(course.finalExamId.toString(), course.id.toString());
            }

            // Check exams in lessons
            const modules = getModulesByCourseId(Number(course.id) || course.id as any);
            modules.forEach(module => {
                const lessons = getLessonsByModuleId(Number(module.id));
                lessons.forEach(lesson => {
                    if ((lesson.type === 'QUIZ' || lesson.type === 'quiz') && lesson.content) {
                        map.set(lesson.content.toString(), course.id.toString());
                    }
                });
            });
        });
        return map;
    }, [accessibleCourses, getModulesByCourseId, getLessonsByModuleId]);

    const publishedExams = React.useMemo(() => {
        return exams.filter(e => {
            const isPublished = e.status === 'PUBLICADO';

            // Allow if the exam is "Assigned" (found in an accessible course structure)
            // We trust the map more than the exam's own courseId property which might be stale or missing
            const isAssigned = allowedExamsMap.has(e.id.toString());

            // Redundant check removed: belongsToAccessibleCourse
            // If it's in allowedExamsMap, it IS in an accessible course.

            return isPublished && isAssigned;
        });
    }, [exams, allowedExamsMap]);

    const isExamLocked = (exam: Exam) => {
        // Resolve Course ID: Prefer the one from the map (contextual), then fallback to exam property
        const derivedCourseId = allowedExamsMap.get(exam.id.toString()) || exam.courseId;

        if (!derivedCourseId) return false;

        // 1. Get all modules for this course
        // Using 'any' cast for ID compatibility as discussed earlier
        const modules = getModulesByCourseId(Number(derivedCourseId) || derivedCourseId as any);

        // 2. Find the LESSON that contains this exam
        let examLesson: any = null;
        for (const m of modules) {
            const lessons = getLessonsByModuleId(m.id as any);
            const found = lessons.find(l => (l.content && l.content.toString() === exam.id.toString()));
            if (found) {
                examLesson = found;
                break;
            }
        }

        // 3. Check Persistent Lock State ("0" / "1" DB Logic)
        if (examLesson) {
            const progress = userProgress.find(p => p.lessonId === examLesson.id && p.userId === currentUser.id);

            // A. If Explicitly Unlocked (1) -> Accessible
            if (progress && progress.isUnlocked === true) {
                return false;
            }

            // B. If Explicitly Locked (0) -> Locked
            if (progress && progress.isUnlocked === false) {
                return true;
            }
        }

        // 4. Fallback / Synchronous Validation (if no DB record or as additional safety)
        const course = courses.find(c => c.id.toString() === derivedCourseId.toString());
        if (course) {
            // A. Check for Final Exam Date Lock (Requirement: ID Association + DB/Date Logic)
            if (course.finalExamId && course.finalExamId.toString() === exam.id.toString()) {
                const condition = course.finalExamCondition || (course.finalExamDate ? 'date' : 'content');
                if (condition === 'date' && course.finalExamDate) {
                    const openDate = new Date(course.finalExamDate);
                    const now = new Date();
                    if (!isNaN(openDate.getTime()) && now < openDate) {
                        return true; // Locked because date hasn't arrived
                    }
                }
            }

            // B. Check for Content Prerequisites
            const courseModules = course.modules || [];
            const allLessons = courseModules.length > 0 ? courseModules.flatMap(m => m.items || m.lessons || []) : [];

            if (allLessons.length > 0) {
                const totalRequired = allLessons.filter(l => l.isRequired && (examLesson ? l.id !== examLesson.id : true)).length;
                if (totalRequired > 0) {
                    const completedRequired = allLessons.filter(l => {
                        if (!l.isRequired || (examLesson && l.id === examLesson.id)) return false;
                        const p = userProgress.find((up: any) => up.lessonId === l.id && up.userId === currentUser.id);
                        return p?.completed;
                    }).length;

                    return completedRequired < totalRequired;
                }
            }
        }

        return false; // Default: Unlocked if no reason to lock
    };

    const getExamStatus = (exam: Exam) => {
        const attempts = getExamAttempts(currentUser.id, exam.id);

        // Find the best completed attempt
        const completedAttempts = attempts.filter(a => a.status === 'COMPLETED');
        const bestAttempt = completedAttempts.length > 0
            ? completedAttempts.reduce((prev, current) => ((prev.score || 0) > (current.score || 0)) ? prev : current)
            : null;

        // Check if there is an active attempts (IN_PROGRESS) - usually the last one
        const activeAttempt = attempts.find(a => a.status === 'IN_PROGRESS');

        if (bestAttempt) {
            const score = bestAttempt.score || 0;
            const passingScore = exam.passingScore || 0;
            const isPassed = score >= passingScore;

            // If we have an active attempt, we might want to indicate it, 
            // but usually the "Status" of the exam module serves as the Grade report.
            // If the user is retaking, the Dashboard should probably still show the Best Grade,
            // but the button might say "Continuar" if in progress.

            // Let's refine: Status reflects the BEST GRADE. 
            // The Button logic below handles "Continuar" vs "Ver Resultados" vs "Reintentar".

            return {
                status: 'COMPLETED',
                label: isPassed ? 'Aprobado' : 'Desaprobado',
                color: isPassed ? 'green' : 'red',
                score
            };
        } else if (activeAttempt) {
            return { status: 'IN_PROGRESS', label: 'En Progreso', color: 'blue' };
        }

        if (isExamLocked(exam)) {
            return { status: 'LOCKED', label: 'Bloqueado', color: 'slate' };
        }

        return { status: 'PENDING', label: 'Pendiente', color: 'amber' };
    };

    return (
        <div className="flex-1 bg-background-light p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Mis Exámenes</h1>
                        <p className="text-slate-500 mt-2">Gestiona tus evaluaciones pendientes y revisa tus calificaciones.</p>
                    </div>

                    <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button className="px-4 py-1.5 text-sm font-bold bg-blue-600 text-white rounded shadow-sm">Todos</button>
                        <button className="px-4 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">Pendientes</button>
                        <button className="px-4 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">Completados</button>
                    </div>
                </div>

                {/* Exam Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {publishedExams.map(exam => {
                        const { status, label, color, score } = getExamStatus(exam);
                        const isCompleted = status === 'COMPLETED';
                        const isInProgress = status === 'IN_PROGRESS';
                        const isLocked = status === 'LOCKED';

                        // Debug Log
                        const attemptsCount = getExamAttempts(currentUser.id, exam.id).length;
                        const isLockedDebug = isExamLocked(exam);

                        // Course Label Logic
                        const derivedCourseId = allowedExamsMap.get(exam.id.toString()) || exam.courseId;
                        const course = courses.find(c => c.id.toString() === derivedCourseId?.toString());
                        const courseLabel = course
                            ? `${(course.category || 'Curso').toUpperCase()}: ${course.title}`
                            : 'CURSO GENERAL';

                        // Debug Log
                        // Identify Lesson for Context
                        let examLesson: any = null;
                        if (course) {
                            const modules = getModulesByCourseId(Number(course.id) || course.id as any);
                            for (const m of modules) {
                                const lessons = getLessonsByModuleId(Number(m.id));
                                const found = lessons.find(l => (l.content && l.content.toString() === exam.id.toString()));
                                if (found) {
                                    examLesson = found;
                                    break;
                                }
                            }
                        }

                        // Determine Dates
                        let effectiveStartDate = 'N/A';
                        let effectiveEndDate = course?.closingDate || 'N/A';

                        // Check if Final Exam
                        if (course && course.finalExamId && course.finalExamId.toString() === exam.id.toString()) {
                            effectiveStartDate = course.finalExamDate || 'N/A';
                        }
                        // Check if Lesson Quiz (and use lesson start date)
                        else if (examLesson && examLesson.startDate) {
                            effectiveStartDate = examLesson.startDate;
                        }

                        // Debug Log
                        console.log(`Exam Debug: ID=${exam.id}, Intentos Realizados=${attemptsCount}, Intentos Permitidos=${exam.attempts || 1}, Estado=${isLockedDebug ? '0 Bloqueado' : '1 Desbloqueado'}, Fecha Inicio Programada=${effectiveStartDate}, Fecha Fin Programada=${effectiveEndDate}`);

                        // Helper for date formatting
                        const formatDate = (dateStr: string) => {
                            if (!dateStr || dateStr === 'N/A') return null;
                            try {
                                const date = new Date(dateStr);
                                if (isNaN(date.getTime())) return dateStr;
                                // Simple Spanish formatter
                                return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                            } catch (e) {
                                return dateStr;
                            }
                        };

                        const formattedStartDate = formatDate(effectiveStartDate);
                        const formattedEndDate = formatDate(effectiveEndDate);

                        // Attempts Logic
                        const maxAttempts = exam.attempts || 1;
                        const attemptsLeft = Math.max(0, maxAttempts - attemptsCount);

                        return (
                            <div key={exam.id} className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 hover:border-blue-300 transition-colors group ${isLocked ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-${color}-50 text-${color}-700 border-${color}-100 flex items-center gap-1`}>
                                        <span className="material-symbols-outlined text-sm">{isCompleted ? (color === 'red' ? 'cancel' : 'check_circle') : isInProgress ? 'pending' : isLocked ? 'lock' : 'schedule'}</span>
                                        {label}
                                    </span>
                                    {isCompleted && (
                                        <div className={`bg-${color}-50 text-${color}-700 font-bold px-3 py-1 rounded-lg border border-${color}-100 flex flex-col items-end leading-none`}>
                                            <span className={`text-[10px] uppercase text-${color}-600/70`}>Calificación</span>
                                            <span className="text-lg">{score}/100</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors mb-2">{exam.title}</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{courseLabel}</p>
                                    <p className="text-xs text-slate-400 mb-3">Intentos disponibles: <span className="font-bold text-slate-600">{attemptsLeft}</span></p>

                                    {/* Dates Display */}
                                    <div className="flex flex-col gap-1 items-start">
                                        {formattedStartDate && (
                                            <p className="text-xs text-slate-500">
                                                Disponible el {formattedStartDate}
                                            </p>
                                        )}
                                        {formattedEndDate && (
                                            <p className="inline-block px-2 py-1 bg-red-600 text-white text-[10px] font-bold uppercase rounded leading-none shadow-sm">
                                                Fecha Límite: {formattedEndDate}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mt-auto pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-base">timer</span>
                                        {exam.timeLimit} min
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-base">help</span>
                                        {exam.questions?.length || 0} preguntas
                                    </div>
                                </div>

                                <button
                                    onClick={() => isCompleted ? onViewResult(exam.id) : !isLocked && onStartExam(exam.id)}
                                    disabled={isLocked}
                                    className={`w-full py-3 rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 transition-all ${isCompleted
                                        ? 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                                        : isLocked
                                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                                            Ver Resultados
                                        </>
                                    ) : isLocked ? (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">lock</span>
                                            Examen Bloqueado
                                        </>
                                    ) : (
                                        <>
                                            {isInProgress ? 'Continuar Examen' : 'Iniciar Examen'}
                                            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StudentExamDashboard;
