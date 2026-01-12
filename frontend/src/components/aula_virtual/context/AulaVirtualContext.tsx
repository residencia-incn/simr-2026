import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { mockCourses, mockModules, mockLessons, mockEnrollments, mockCourseMaterials, mockInstructors, mockVideos } from '../../../data/mockAulaVirtualData';
import { MOCK_USERS } from '../../../data/mockUsers';
import { Course, Module, Lesson, Enrollment, CourseMaterial, Instructor, User, Video, PlayerConfig, UserLessonProgress, VideoNote } from '../types';

// ========== TYPES ========== (Imported from types.ts, re-exporting if needed or just using them)

const MOCK_CURRENT_USER: User = {
    id: 'USR002',
    name: 'Dr. Juan Perez',
    email: 'juan.perez@example.com',
    avatar: 'https://ui-avatars.com/api/?name=Juan+Perez&background=0D8ABC&color=fff',
    role: 'student',
    modality: 'Presencial',
    purchasedItems: ['w_1767220000001'] // Taller de Neuroimagen Avanzada (Matches api.js)
};

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
    getUserNotes: (lessonId: number) => VideoNote[];
}

const AulaVirtualContext = createContext<AulaVirtualContextType | undefined>(undefined);

// ========== CONSTANTS ==========
const STORAGE_KEY = 'aula_virtual_data_v2';

// ========== PROVIDER ==========
interface AulaVirtualProviderProps {
    children: ReactNode;
}

export const AulaVirtualProvider: React.FC<AulaVirtualProviderProps> = ({ children }) => {
    // Initialize state from localStorage or use mock data
    const [courses, setCourses] = useState<Course[]>(() => {
        const stored = localStorage.getItem(`${STORAGE_KEY}_courses`);
        return stored ? JSON.parse(stored) : mockCourses;
    });

    const [videos, setVideos] = useState<Video[]>(() => {
        const stored = localStorage.getItem(`${STORAGE_KEY}_videos`);
        return stored ? JSON.parse(stored) : mockVideos;
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

    const [currentUser] = useState<User>(MOCK_CURRENT_USER);
    // Cast MOCK_USERS to User[] to avoid strict type conflicts if any, though interfaces should match
    const [users] = useState<User[]>(MOCK_USERS as unknown as User[]);
    const [specialties] = useState<string[]>(['Neurología', 'Neuropediatría', 'Neurocirugía', 'Medicina Interna', 'Psiquiatría', 'Epilepsia', 'Vascular', 'Farmacia', 'Investigación']);
    const [courseCategories] = useState<string[]>(['Curso', 'Taller', 'Congreso', 'Diplomado', 'Seminario', 'Webinar']);


    // Persist courses to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_courses`, JSON.stringify(courses));
    }, [courses]);

    // Persist videos to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_videos`, JSON.stringify(videos));
    }, [videos]);

    // Persist player config to localStorage
    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_player_config`, JSON.stringify(playerConfig));
    }, [playerConfig]);

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
        // 2. Fallback to global flat list (Legacy / Mock)
        return modules.filter(module => module.courseId === courseId);
    }, [courses, modules]);

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
            let newProgress;

            if (existingIndex >= 0) {
                // Update existing
                const currentRecord = prev[existingIndex];
                const isCompleted = currentRecord.completed || completed;

                newProgress = [...prev];
                newProgress[existingIndex] = {
                    ...currentRecord,
                    videoId: videoId || currentRecord.videoId, // Update videoId if provided
                    data: {
                        ...currentRecord.data,
                        ...data,
                        lastPosition: data.playedSeconds
                    },
                    completed: isCompleted,
                    updatedAt: now
                };
            } else {
                // Create new
                newProgress = [...prev, {
                    userId: currentUser.id,
                    lessonId,
                    videoId, // Store videoId
                    data: {
                        ...data,
                        lastPosition: data.playedSeconds
                    },
                    completed,
                    updatedAt: now
                }];
            }
            // Sync Save to LocalStorage (Critical for Close/Unload reliability)
            localStorage.setItem(`${STORAGE_KEY}_progress`, JSON.stringify(newProgress));
            return newProgress;
        });
    }, [currentUser.id]);

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

    // ========== NOTES STATE ==========
    const [userNotes, setUserNotes] = useState<VideoNote[]>(() => {
        const stored = localStorage.getItem(`${STORAGE_KEY}_notes`);
        return stored ? JSON.parse(stored) : [];
    });

    // Persist notes (Effect) - Kept as backup
    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_notes`, JSON.stringify(userNotes));
    }, [userNotes]);

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
        setUserNotes(prev => prev.filter(n => n.id !== noteId));
    }, []);

    const getUserNotes = (lessonId: number) => {
        return userNotes.filter(n => n.lessonId === lessonId && n.userId === currentUser.id).sort((a, b) => a.timestamp - b.timestamp);
    };

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

        getStats,

        // Notes Actions
        saveUserNote,
        deleteUserNote,
        getUserNotes
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
