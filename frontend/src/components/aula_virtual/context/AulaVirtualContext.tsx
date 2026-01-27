import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
// Mock data imports removed for SQL migration
const mockCourses: any[] = [];
const mockModules: any[] = [];
const mockLessons: any[] = [];
const mockEnrollments: any[] = [];
const mockCourseMaterials: any[] = [];
const mockInstructors: any[] = [];
const mockVideos: any[] = [];
const mockExams: any[] = [];
const MOCK_USERS: any[] = [];
import { Course, Module, Lesson, Enrollment, CourseMaterial, Instructor, User, Video, PlayerConfig, UserLessonProgress, VideoNote, Exam, StudentExamAttempt } from '../types';


// ========== TYPES ========== (Imported from types.ts, re-exporting if needed or just using them)

const USER_STORAGE_KEY = 'simr_user'; // Key used by main App

const FALLBACK_USER: User | null = null;

const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
    defaultPlayer: 'plyr',
    youtube: {
        hideControls: true,
        modestBranding: true,
        disableRelated: true
    },
    autoPlay: false
};

// ========== CONTEXT ==========
interface AulaVirtualContextType {
    // State
    courses: Course[];
    modules: Module[];
    lessons: Lesson[];
    enrollments: Enrollment[];
    materials: CourseMaterial[];
    instructors: Instructor[];
    currentUser: User;
    videos: Video[];
    playerConfig: PlayerConfig;
    users: User[];
    specialties: string[];
    courseCategories: string[];
    userProgress: UserLessonProgress[];
    userNotes: VideoNote[]; // Added notes state
    exams: Exam[];
    questionTags: string[];
    examAttempts: StudentExamAttempt[]; // State for exam attempts

    // Course Actions

    // Course Actions
    addCourse: (course: Course) => void;
    updateCourse: (id: number, updates: Partial<Course>) => void;
    deleteCourse: (id: number) => void;
    getCourseById: (id: number) => Course | undefined;

    // Module Actions
    getModulesByCourseId: (courseId: number) => Module[];

    // Lesson Actions
    getLessonsByModuleId: (moduleId: number) => Lesson[];

    // Enrollment Actions
    getEnrollmentsByCourseId: (courseId: number) => Enrollment[];

    // Material Actions
    getMaterialsByCourseId: (courseId: number) => CourseMaterial[];

    // Instructor Actions
    getInstructorById: (id: string) => Instructor | undefined;

    // Video Actions
    addVideo: (video: Video) => void;
    updateVideo: (id: number, updates: Partial<Video>) => void;
    deleteVideo: (id: number) => void;

    // Player Actions
    updatePlayerConfig: (config: PlayerConfig) => void;

    // Progress Actions
    updateLessonProgress: (lessonId: number, data: { playedSeconds: number; totalSeconds: number }, completed?: boolean, videoId?: number) => void;
    getLessonProgress: (lessonId: number) => UserLessonProgress | undefined;
    getVideoProgress: (videoId: number) => UserLessonProgress | undefined;
    markLessonsAsUnlocked: (lessonIds: number[]) => void;
    markLessonsAsLocked: (lessonIds: number[]) => void;

    // Stats
    getStats: () => {
        totalCourses: number;
        publishedCourses: number;
        draftCourses: number;
        closedCourses: number;
    };

    // Notes Actions
    saveUserNote: (note: Partial<VideoNote>) => void;
    deleteUserNote: (noteId: string) => void;
    getUserNotes: (userId: string, courseId?: string | number) => VideoNote[];

    // Exam Actions
    addExam: (exam: Exam) => void;
    updateExam: (id: string | number, updates: Partial<Exam>) => void;
    deleteExam: (id: string | number) => void;
    getExamById: (id: string | number) => Exam | undefined;
    updateQuestionTags: (tags: string[]) => void;

    // Student Exam Actions
    saveExamAttempt: (attempt: StudentExamAttempt) => void;
    getExamAttempts: (userId: string, examId: string | number) => StudentExamAttempt[];
}

const AulaVirtualContext = createContext<AulaVirtualContextType | undefined>(undefined);

// ========== CONSTANTS ==========
const STORAGE_KEY = 'aula_virtual_data_v7';

// ========== PROVIDER ==========
interface AulaVirtualProviderProps {
    children: ReactNode;
}

export const AulaVirtualProvider: React.FC<AulaVirtualProviderProps> = ({ children }) => {
    // Initialize state from localStorage or use mock data
    const [courses, setCourses] = useState<Course[]>(() => {
        const stored = localStorage.getItem(`${STORAGE_KEY}_courses`);
        const initialData = stored ? JSON.parse(stored) : mockCourses;
        // V3 Migration: Standardize IDs
        return initialData.map((c: any) => ({
            ...c,
            id: String(c.id).startsWith('Cu_') ? c.id : `Cu_${c.id}`
        }));
    });

    const [videos, setVideos] = useState<Video[]>(() => {
        const stored = localStorage.getItem(`${STORAGE_KEY}_videos`);
        const initialData = stored ? JSON.parse(stored) : mockVideos;
        // V3 Migration: Update reference courseIds
        return initialData.map((v: any) => ({
            ...v,
            courseId: String(v.courseId).startsWith('Cu_') ? v.courseId : `Cu_${v.courseId}`
        }));
    });

    const [exams, setExams] = useState<Exam[]>(() => {
        const stored = localStorage.getItem(`${STORAGE_KEY}_exams`);
        const initialData = stored ? JSON.parse(stored) : (mockExams as unknown as Exam[]);
        // V3 Migration: Update reference courseIds
        return initialData.map((e: any) => ({
            ...e,
            courseId: String(e.courseId).startsWith('Cu_') ? e.courseId : `Cu_${e.courseId}`
        }));
    });

    const [playerConfig, setPlayerConfig] = useState<PlayerConfig>(() => {
        const stored = localStorage.getItem(`${STORAGE_KEY}_player_config`);
        return stored ? JSON.parse(stored) : DEFAULT_PLAYER_CONFIG;
    });

    const [modules] = useState<Module[]>(mockModules);
    const [lessons] = useState<Lesson[]>(mockLessons as unknown as Lesson[]);
    const [enrollments] = useState<Enrollment[]>(mockEnrollments as unknown as Enrollment[]);
    const [materials] = useState<CourseMaterial[]>(mockCourseMaterials);
    const [instructors] = useState<Instructor[]>(mockInstructors);

    // User State - Sync with Main App Storage
    const [currentUser] = useState<User>(() => {
        try {
            const storedUser = localStorage.getItem(USER_STORAGE_KEY);
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                // Attempt to start fresh from MOCK_USERS to ensure purchasedItems are up to date
                // matching the ID from storage.
                const freshUser = MOCK_USERS.find((u: any) => u.id === userData.id);
                if (freshUser) {
                    return freshUser as unknown as User;
                }
                return userData as User;
            }
        } catch (e) {
            console.warn('Error loading user from storage', e);
        }
        return null as unknown as User;
    });
    // Cast MOCK_USERS to User[] to avoid strict type conflicts if any, though interfaces should match
    const [users] = useState<User[]>(MOCK_USERS as unknown as User[]);
    const [specialties] = useState<string[]>(['Neurología', 'Neuropediatría', 'Neurocirugía', 'Medicina Interna', 'Psiquiatría', 'Epilepsia', 'Vascular', 'Farmacia', 'Investigación']);
    const [courseCategories] = useState<string[]>(['Curso', 'Taller', 'Congreso', 'Diplomado', 'Seminario', 'Webinar']);
    const [questionTags, setQuestionTags] = useState<string[]>(() => {
        const stored = localStorage.getItem(`${STORAGE_KEY}_question_tags`);
        return stored ? JSON.parse(stored) : ['General', 'Neurología', 'Examen Admisión', 'Residantado', 'Casos Clínicos'];
    });


    // Persist courses to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_courses`, JSON.stringify(courses));
    }, [courses]);

    // Persist videos to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_videos`, JSON.stringify(videos));
    }, [videos]);

    // Persist exams
    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_exams`, JSON.stringify(exams));
    }, [exams]);

    // Persist player config to localStorage
    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_player_config`, JSON.stringify(playerConfig));
    }, [playerConfig]);

    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_question_tags`, JSON.stringify(questionTags));
    }, [questionTags]);

    // ========== COURSE ACTIONS ==========
    const addCourse = (course: Course) => {
        setCourses(prev => [...prev, course]);
    };

    const updateCourse = (id: number, updates: Partial<Course>) => {
        setCourses(prev =>
            prev.map(course =>
                course.id === id
                    ? { ...course, ...updates, updatedAt: new Date().toISOString() }
                    : course
            )
        );
    };

    const deleteCourse = (id: number) => {
        setCourses(prev => prev.filter(course => course.id !== id));
    };

    const getCourseById = useCallback((id: number) => {
        return courses.find(course => course.id === id);
    }, [courses]);

    // ========== VIDEO ACTIONS ==========
    const addVideo = (video: Video) => {
        setVideos(prev => [video, ...prev]);
    };

    const updateVideo = (id: number, updates: Partial<Video>) => {
        setVideos(prev =>
            prev.map(video =>
                video.id === id ? { ...video, ...updates } : video
            )
        );
    };

    const deleteVideo = (id: number) => {
        setVideos(prev => prev.filter(video => video.id !== id));
    };

    // ========== EXAM ACTIONS ==========
    const addExam = (exam: Exam) => {
        setExams(prev => [exam, ...prev]);
    };

    const updateExam = (id: string | number, updates: Partial<Exam>) => {
        setExams(prev =>
            prev.map(exam =>
                exam.id === id ? { ...exam, ...updates, updatedAt: new Date().toISOString() } : exam
            )
        );
    };

    const deleteExam = (id: string | number) => {
        setExams(prev => prev.filter(exam => exam.id !== id));
    };

    const getExamById = useCallback((id: string | number) => {
        return exams.find(exam => exam.id === id);
    }, [exams]);

    const updateQuestionTags = (tags: string[]) => {
        setQuestionTags(tags);
    };

    // ========== PLAYER ACTIONS ==========

    const updatePlayerConfig = (config: PlayerConfig) => {
        setPlayerConfig(config);
    };

    // ========== MODULE ACTIONS ==========
    const getModulesByCourseId = useCallback((courseId: number) => {
        // 1. Check if course has nested modules (Editor V2 persistence)
        const course = courses.find(c => c.id === courseId);
        if (course && course.modules && course.modules.length > 0) {
            return course.modules as Module[];
        }
        // 2. Fallback to global flat list (Legacy / Mock) -> HYDRATE WITH LESSONS
        return modules
            .filter(module => module.courseId === courseId)
            .map(m => ({
                ...m,
                // Hydrate 'items' or 'lessons' for the editor to recognize content
                items: lessons.filter(l => l.moduleId === m.id)
            }));
    }, [courses, modules, lessons]);

    // ========== LESSON ACTIONS ==========
    const getLessonsByModuleId = useCallback((moduleId: number) => {
        // 1. Check if moduleId belongs to a V2 nested module (search in all courses)
        for (const course of courses) {
            if (course.modules) {
                const foundModule = course.modules.find((m: any) => m.id === moduleId);
                if (foundModule && foundModule.items) {
                    return foundModule.items as Lesson[];
                }
            }
        }
        // 2. Fallback to global flat list
        return lessons.filter(lesson => lesson.moduleId === moduleId);
    }, [courses, lessons]);

    // ========== ENROLLMENT ACTIONS ==========
    const getEnrollmentsByCourseId = (courseId: number) => {
        return enrollments.filter(enrollment => enrollment.courseId === courseId);
    };

    // ========== MATERIAL ACTIONS ==========
    const getMaterialsByCourseId = (courseId: number) => {
        return materials.filter(material => material.courseId === courseId);
    };

    // ========== INSTRUCTOR ACTIONS ==========
    const getInstructorById = useCallback((id: string) => {
        return instructors.find(instructor => instructor.id === id);
    }, [instructors]);

    // ========== STATS ==========
    const getStats = () => {
        return {
            totalCourses: courses.length,
            publishedCourses: courses.filter(c => c.status === 'PUBLICADO').length,
            draftCourses: courses.filter(c => c.status === 'BORRADOR').length,
            closedCourses: courses.filter(c => c.status === 'CERRADO').length,
        };
    };

    // ========== PROGRESS & TRACKING STATE ==========
    const [userProgress, setUserProgress] = useState<UserLessonProgress[]>(() => {
        const stored = localStorage.getItem(`${STORAGE_KEY}_progress`);
        return stored ? JSON.parse(stored) : [];
    });

    // Persist progress
    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_progress`, JSON.stringify(userProgress));
    }, [userProgress]);

    // ========== PROGRESS ACTIONS ==========
    const updateLessonProgress = useCallback((lessonId: number, data: { playedSeconds: number; totalSeconds: number }, completed: boolean = false, videoId?: number) => {
        setUserProgress(prev => {
            const existingIndex = prev.findIndex(p => p.lessonId === lessonId && p.userId === currentUser.id);
            const now = new Date().toISOString();
            let newProgress = [...prev];
            let currentRecord;

            // 1. Update/Create CURRENT Lesson Record
            if (existingIndex >= 0) {
                currentRecord = newProgress[existingIndex];
                const isCompleted = currentRecord.completed || completed;

                newProgress[existingIndex] = {
                    ...currentRecord,
                    videoId: videoId || currentRecord.videoId,
                    data: {
                        ...currentRecord.data,
                        ...data,
                        lastPosition: data.playedSeconds
                    },
                    completed: isCompleted,
                    updatedAt: now
                };
            } else {
                currentRecord = {
                    userId: currentUser.id,
                    lessonId,
                    videoId,
                    data: { ...data, lastPosition: data.playedSeconds },
                    completed,
                    updatedAt: now,
                    isUnlocked: true // Implicitly unlocked if we are updating it? Or rely on default?
                };
                newProgress.push(currentRecord as any);
            }

            // 2. LOGIC FOR UNLOCKING NEXT LESSON (Persistent "0"/"1" State)
            if (completed || (currentRecord && currentRecord.completed)) {
                // Find where we are in the course structure
                // Iterate all courses -> modules -> lessons to find current lesson ID
                // Note: This is an expensive operation inside a setter, but necessary for "Live DB" simulation without backend
                let foundCurrent = false;
                let nextLessonId: number | null = null;

                // Flatten traversal to find next ID
                // Using 'courses' from closure (careful with stale closures, but 'courses' usually static-ish)
                // Better to use a functional approach if possible, but for this context:
                for (const course of courses) {
                    if (foundCurrent && nextLessonId) break;

                    const modules = course.modules || []; // Assuming nested structure V2
                    for (const module of modules) {
                        if (foundCurrent && nextLessonId) break;

                        const lessons = module.items || module.lessons || [];
                        for (const lesson of lessons) {
                            if (foundCurrent) {
                                nextLessonId = lesson.id;
                                break;
                            }
                            if (lesson.id === lessonId) {
                                foundCurrent = true;
                            }
                        }
                    }
                }

                if (nextLessonId) {
                    // Unlock the next lesson
                    const nextIndex = newProgress.findIndex(p => p.lessonId === nextLessonId && p.userId === currentUser.id);
                    if (nextIndex >= 0) {
                        // Update existing next lesson record to unlock it
                        newProgress[nextIndex] = {
                            ...newProgress[nextIndex],
                            isUnlocked: true,
                            updatedAt: now
                        };
                    } else {
                        // Create new record for next lesson as Unlocked "1"
                        newProgress.push({
                            userId: currentUser.id,
                            lessonId: nextLessonId!,
                            data: { playedSeconds: 0, totalSeconds: 0, lastPosition: 0 },
                            completed: false,
                            isUnlocked: true,
                            updatedAt: now
                        } as any);
                    }
                }
            }

            // Sync Save to LocalStorage
            localStorage.setItem(`${STORAGE_KEY}_progress`, JSON.stringify(newProgress));
            return newProgress;
        });
    }, [currentUser.id, courses]); // Added courses dependency

    const getLessonProgress = (lessonId: number) => {
        return userProgress.find(p => p.lessonId === lessonId && p.userId === currentUser.id);
    };

    // Find progress by Video ID (fallback for when Lesson ID changes but Video content is same)
    const getVideoProgress = (vidId: number) => {
        // Find the most recently updated progress for this videoId
        const records = userProgress.filter(p => p.videoId === vidId && p.userId === currentUser.id);
        if (records.length === 0) return undefined;
        // Sort by updatedAt desc
        return records.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
    };

    const markLessonsAsUnlocked = useCallback((lessonIds: number[]) => {
        if (lessonIds.length === 0) return;

        setUserProgress(prev => {
            const now = new Date().toISOString();
            const newProgress = [...prev];
            let changed = false;

            lessonIds.forEach(id => {
                const index = newProgress.findIndex(p => p.lessonId === id && p.userId === currentUser.id);
                if (index >= 0) {
                    // Update existing only if currently locked or undefined
                    if (!newProgress[index].isUnlocked) {
                        newProgress[index] = { ...newProgress[index], isUnlocked: true, updatedAt: now };
                        changed = true;
                    }
                } else {
                    // Create new record as unlocked
                    newProgress.push({
                        userId: currentUser.id,
                        lessonId: id,
                        data: { playedSeconds: 0, totalSeconds: 0 },
                        completed: false,
                        isUnlocked: true,
                        updatedAt: now
                    } as any);
                    changed = true;
                }
            });

            if (changed) {
                localStorage.setItem(`${STORAGE_KEY}_progress`, JSON.stringify(newProgress));
                return newProgress;
            }
            return prev;
        });
    }, [currentUser.id]);

    const markLessonsAsLocked = useCallback((lessonIds: number[]) => {
        if (lessonIds.length === 0) return;

        setUserProgress(prev => {
            const now = new Date().toISOString();
            const newProgress = [...prev];
            let changed = false;

            lessonIds.forEach(id => {
                const index = newProgress.findIndex(p => p.lessonId === id && p.userId === currentUser.id);
                if (index >= 0) {
                    // Update existing only if currently unlocked
                    if (newProgress[index].isUnlocked) {
                        newProgress[index] = { ...newProgress[index], isUnlocked: false, updatedAt: now };
                        changed = true;
                    }
                }
                // If it doesn't exist, it's implicitly locked, so no need to create a record just to say it's locked
            });

            if (changed) {
                localStorage.setItem(`${STORAGE_KEY}_progress`, JSON.stringify(newProgress));
                return newProgress;
            }
            return prev;
        });
    }, [currentUser.id]);

    // ========== EXAM ATTEMPTS STATE ==========
    const [examAttempts, setExamAttempts] = useState<StudentExamAttempt[]>(() => {
        const stored = localStorage.getItem(`${STORAGE_KEY}_exam_attempts`);
        return stored ? JSON.parse(stored) : [];
    });

    // Persist exam attempts
    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_exam_attempts`, JSON.stringify(examAttempts));
    }, [examAttempts]);

    const saveExamAttempt = useCallback((attempt: StudentExamAttempt) => {
        setExamAttempts(prev => {
            const index = prev.findIndex(a => a.id === attempt.id);
            if (index >= 0) {
                const newAttempts = [...prev];
                newAttempts[index] = attempt;
                return newAttempts;
            }
            return [...prev, attempt];
        });
    }, []);

    const getExamAttempts = useCallback((userId: string, examId: string | number) => {
        return examAttempts.filter(a => a.userId === userId && a.examId === examId);
    }, [examAttempts]);

    // ========== SYNC FINAL EXAM STATUS LOGIC (DATABASE LEVEL) ==========
    // Effectively updates 'userProgress.isUnlocked' for Final Exams based on Rules
    useEffect(() => {
        if (!courses || courses.length === 0) return;

        let hasChanges = false;
        const now = new Date();
        const newProgress = JSON.parse(JSON.stringify(userProgress));

        courses.forEach(course => {
            if (course.finalExamId) {
                // 1. Find the Lesson associated with this Final Exam (Robust Search)
                const found = lessons.find((l: any) => l.content && l.content.toString() === course.finalExamId?.toString());
                const finalExamLessonId = found ? found.id : null;

                if (finalExamLessonId) {
                    const progressIndex = newProgress.findIndex((p: any) => p.lessonId === finalExamLessonId && p.userId === currentUser.id);
                    let currentStatus = progressIndex >= 0 ? !!newProgress[progressIndex].isUnlocked : false;

                    // 2. CHECK CONDITION
                    let shouldBeUnlocked = false;
                    const condition = course.finalExamCondition || (course.finalExamDate ? 'date' : 'content');

                    if (condition === 'date') {
                        if (course.finalExamDate) {
                            const openDate = new Date(course.finalExamDate);
                            if (!isNaN(openDate.getTime()) && now >= openDate) {
                                shouldBeUnlocked = true;
                            }
                        }
                    }
                    else if (condition === 'content') {
                        const courseModules = course.modules || [];
                        const allLessons = courseModules.flatMap(m => m.items || m.lessons || []);
                        const totalRequired = allLessons.filter(l => l.isRequired && l.id !== finalExamLessonId).length;

                        const completedRequired = allLessons.filter(l => {
                            if (!l.isRequired || l.id === finalExamLessonId) return false;
                            const p = newProgress.find((up: any) => up.lessonId === l.id && up.userId === currentUser.id);
                            return p?.completed;
                        }).length;

                        if (completedRequired >= totalRequired && totalRequired > 0) {
                            shouldBeUnlocked = true;
                        }
                    }

                    // 3. UPDATE DB IF CHANGED
                    if (shouldBeUnlocked !== currentStatus) {
                        if (progressIndex >= 0) {
                            newProgress[progressIndex].isUnlocked = shouldBeUnlocked;
                            newProgress[progressIndex].updatedAt = now.toISOString();
                        } else {
                            newProgress.push({
                                userId: currentUser.id,
                                lessonId: finalExamLessonId,
                                data: { playedSeconds: 0, totalSeconds: 0 },
                                completed: false,
                                isUnlocked: shouldBeUnlocked,
                                updatedAt: now.toISOString()
                            });
                        }
                        hasChanges = true;
                    }
                }
            }
        });

        if (hasChanges) {
            setUserProgress(newProgress);
        }

    }, [courses, currentUser.id, userProgress, lessons]);

    // ========== NOTES STATE ==========
    const [userNotes, setUserNotes] = useState<VideoNote[]>(() => {
        const stored = localStorage.getItem(`${STORAGE_KEY}_notes`);
        return stored ? JSON.parse(stored) : [];
    });

    // ========== NOTES ACTIONS ==========
    const saveUserNote = useCallback((note: Partial<VideoNote>) => {
        setUserNotes(prev => {
            const now = new Date().toISOString();
            let newNotes;

            if (note.id) {
                // Update existing
                newNotes = prev.map(n =>
                    n.id === note.id
                        ? { ...n, ...note, updatedAt: now } as VideoNote
                        : n
                );
            } else {
                // Create new
                const newNote: VideoNote = {
                    id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    userId: currentUser.id,
                    courseId: note.courseId!,
                    moduleId: note.moduleId!,
                    lessonId: note.lessonId!,
                    videoId: note.videoId,
                    content: note.content || '',
                    timestamp: note.timestamp || 0,
                    formattedTimestamp: note.formattedTimestamp || '00:00',
                    createdAt: now,
                    updatedAt: now
                };
                newNotes = [...prev, newNote];
            }
            // Sync Save to LocalStorage
            localStorage.setItem(`${STORAGE_KEY}_notes`, JSON.stringify(newNotes));
            return newNotes;
        });
    }, [currentUser.id]);

    const deleteUserNote = useCallback((noteId: string) => {
        setUserNotes(prev => {
            const newNotes = prev.filter(n => n.id !== noteId);
            localStorage.setItem(`${STORAGE_KEY}_notes`, JSON.stringify(newNotes));
            return newNotes;
        });
    }, []);

    const getUserNotes = useCallback((userId: string, courseId?: number | string | undefined) => {
        return userNotes.filter(n => n.userId === userId && (!courseId || n.courseId === courseId));
    }, [userNotes]);

    const value: AulaVirtualContextType = {
        // State
        courses,
        modules,
        lessons,
        enrollments,
        materials,
        instructors,
        currentUser,
        videos,
        playerConfig,
        users,
        specialties,
        courseCategories,
        userProgress,
        userNotes, // Expose notes state

        // Actions
        addCourse,
        updateCourse,
        deleteCourse,
        getCourseById,
        getModulesByCourseId,
        getLessonsByModuleId,
        getEnrollmentsByCourseId,
        getMaterialsByCourseId,
        getInstructorById,

        addVideo,
        updateVideo,
        deleteVideo,

        updatePlayerConfig,
        updateLessonProgress,
        getLessonProgress,
        getVideoProgress,
        markLessonsAsUnlocked,
        markLessonsAsLocked,

        getStats,

        // Notes Actions
        saveUserNote,
        deleteUserNote,
        getUserNotes,

        // Exam Actions
        exams,
        addExam,
        updateExam,
        deleteExam,
        getExamById,
        questionTags,
        updateQuestionTags,

        // Student Exam Actions
        examAttempts,
        saveExamAttempt,
        getExamAttempts
    };

    return (
        <AulaVirtualContext.Provider value={value}>
            {children}
        </AulaVirtualContext.Provider>
    );
};

// ========== HOOK ==========
export const useAulaVirtual = () => {
    const context = useContext(AulaVirtualContext);
    if (!context) {
        throw new Error('useAulaVirtual must be used within an AulaVirtualProvider');
    }
    return context;
};
