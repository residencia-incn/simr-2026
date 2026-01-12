import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ViewState, Course, Module, Lesson } from '../../types';
import { useAulaVirtual } from '../../context/AulaVirtualContext';
import CourseContentPreview from '../admin/CourseContentPreview';
import UnifiedVideoPlayer from '../../components/UnifiedVideoPlayer';
import { CourseNotes } from './CourseNotes';

interface CoursePlayerProps {
  setView: (view: ViewState) => void;
  courseId: number | null;
  initialVideoId: number | null;
}

const CoursePlayer: React.FC<CoursePlayerProps> = ({ setView, courseId, initialVideoId }) => {
  const {
    getCourseById, getModulesByCourseId, getLessonsByModuleId, getInstructorById,
    videos, updateLessonProgress, getLessonProgress, getVideoProgress, userProgress
  } = useAulaVirtual();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState<number | null>(initialVideoId);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'content' | 'notes'>('content');

  // Notes Feature States
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0); // Track live time for Notes
  const [seekTarget, setSeekTarget] = useState<number | null>(null); // State to trigger seeking

  // Throttle progress updates
  const lastProgressUpdate = useRef<number>(0);

  // Track video stats in ref for unmount saving
  const currentVideoStatsRef = useRef({ time: 0, duration: 0, videoId: undefined as number | undefined });

  // Initialize Data
  useEffect(() => {
    if (courseId) {
      const courseData = getCourseById(courseId);
      if (courseData) {
        setCourse(courseData);
        setModules(getModulesByCourseId(courseId));
      }
    }
  }, [courseId, getCourseById, getModulesByCourseId]);

  // Set initial video if not provided
  useEffect(() => {
    if (!currentVideoId && modules.length > 0) {
      let foundVideoId: number | null = null;
      for (const module of modules) {
        const items = module.items || getLessonsByModuleId(module.id);
        const video = items.find((item: any) => item.type === 'video' || item.type === 'VIDEO');
        if (video) {
          foundVideoId = video.id;
          break;
        }
      }
      if (foundVideoId) {
        setCurrentVideoId(foundVideoId);
      }
    }
  }, [modules, currentVideoId, getLessonsByModuleId]);

  // Find current video details - Memoized to prevent frequent re-calcs
  const currentVideo = useMemo(() => {
    if (!currentVideoId || !modules.length) return null;

    let lessonItem: any = null;
    for (const module of modules) {
      const items = module.items || getLessonsByModuleId(module.id);
      const found = items.find((item: any) => item.id === currentVideoId);
      if (found) {
        lessonItem = found;
        break;
      }
    }

    if (!lessonItem) return null;

    if (lessonItem.videoId && videos) {
      const fullVideo = videos.find(v => v.id === lessonItem.videoId);
      if (fullVideo) {
        return {
          ...fullVideo,
          title: lessonItem.title,
          id: lessonItem.id,
          videoUrl: fullVideo.sourceUrl,
          sourceType: fullVideo.sourceType,
          thumbnail: fullVideo.thumbnail,
          duration: fullVideo.duration,
          videoId: lessonItem.videoId
        };
      }
    }

    return lessonItem;
  }, [currentVideoId, modules, videos, getLessonsByModuleId]);

  // Calculate Resume Time synchronously via useMemo
  // This ensures initialTime is correct on first render of UnifiedVideoPlayer
  const resumeTime = useMemo(() => {
    console.log("DEBUG: Calculating Resume Time. VideoID:", currentVideoId);
    if (currentVideo) {
      const prog = getLessonProgress(currentVideo.id);
      console.log("DEBUG: LessonProgress found:", prog);
      if (prog && prog.data && prog.data.lastPosition) {
        console.log("DEBUG: Returning LessonProgress time:", prog.data.lastPosition);
        return prog.data.lastPosition;
      }
      if ((currentVideo as any).videoId) {
        const videoProg = getVideoProgress((currentVideo as any).videoId);
        console.log("DEBUG: VideoProgress found:", videoProg);
        if (videoProg && videoProg.data && videoProg.data.lastPosition) {
          console.log("DEBUG: Returning VideoProgress time:", videoProg.data.lastPosition);
          return videoProg.data.lastPosition;
        }
      }
    }
    console.log("DEBUG: No progress found. Returning 0.");
    return 0;
  }, [currentVideoId, getLessonProgress, getVideoProgress, currentVideo]); // Depend on ID mostly, currentVideo dependency is safe if memoized

  // Handle Video Progress - Memoized to prevent re-creation on every render
  const handleVideoProgress = useCallback((time: number, duration: number, percentage: number) => {
    if (currentVideo) {
      setCurrentPlaybackTime(time);

      const vidId = (currentVideo as any).videoId;
      currentVideoStatsRef.current = { time, duration, videoId: vidId };

      const now = Date.now();
      if (now - lastProgressUpdate.current >= 5000) {
        lastProgressUpdate.current = now;
        updateLessonProgress(currentVideo.id, { playedSeconds: time, totalSeconds: duration }, false, vidId);
      }
    }
  }, [currentVideo, updateLessonProgress]); // currentVideo is now stable via useMemo

  // Handle Completion
  const handleVideoComplete = useCallback(() => {
    if (currentVideo) {
      updateLessonProgress(
        currentVideo.id,
        {
          playedSeconds: (currentVideo as any).duration ? parseFloat((currentVideo as any).duration) * 60 : 0,
          totalSeconds: (currentVideo as any).duration ? parseFloat((currentVideo as any).duration) * 60 : 0
        },
        true,
        (currentVideo as any).videoId
      );
    }
  }, [currentVideo, updateLessonProgress]);

  // Handle Seek - Memoized to prevent CourseNotes re-renders
  const handleSeek = useCallback((time: number) => {
    setSeekTarget(time);
  }, []);

  // Save progress on unmount or video change
  useEffect(() => {
    return () => {
      const stats = currentVideoStatsRef.current;
      if (currentVideoId && stats.time > 0) {
        console.log("Saving final progress on unmount/change for video:", currentVideoId, "Time:", stats.time);
        // Using function from closure, assuming stability or benign staleness (context functions usually stable)
        updateLessonProgress(currentVideoId, { playedSeconds: stats.time, totalSeconds: stats.duration }, false, stats.videoId);
      }
    };
  }, [currentVideoId, updateLessonProgress]);

  // Compute Unlocked Lessons (Sequential Logic)
  const unlockedLessons = useMemo(() => {
    const unlocked = new Set<number>();
    let previousCompleted = true; // First lesson is always unlocked

    // Sort modules by order (assuming they might not be sorted)
    const sortedModules = [...modules].sort((a, b) => a.order - b.order);

    for (const module of sortedModules) {
      const items = module.items || getLessonsByModuleId(module.id);
      // Sort items by order
      const sortedItems = [...items].sort((a: any, b: any) => a.order - b.order);

      for (const item of sortedItems) {
        if (previousCompleted) {
          unlocked.add(item.id);
        }

        // Check if THIS item is completed to unlock the NEXT one
        const prog = getLessonProgress(item.id);
        const isCompleted = prog?.completed || item.status === 'COMPLETADO';

        if (!isCompleted) {
          previousCompleted = false;
        }
      }
    }
    return unlocked;
  }, [modules, getLessonProgress, userProgress]); // Re-calculate when progress updates

  const instructor = course ? getInstructorById(String(course.instructorId)) : null;

  if (!course) return <div className="p-8 text-center">Cargando curso...</div>;

  const totalLessons = modules.reduce((acc, m) => acc + (m.items || getLessonsByModuleId(m.id)).length, 0);
  const completedLessonsCount = userProgress.filter(p => p.completed && modules.some(m => (m.items || getLessonsByModuleId(m.id)).some(l => l.id === p.lessonId))).length;
  const courseCompletionPercentage = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-light relative">
      <div className="max-w-[1920px] mx-auto w-full px-4 sm:px-6 py-4 flex justify-between items-center">
        <nav className="flex items-center gap-2 text-sm text-slate-500 overflow-hidden">
          <button onClick={() => setView((ViewState as any).STUDENT_COURSE_CATALOG)} className="hover:text-primary flex items-center gap-1 transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-base">school</span>
            Mis Cursos
          </button>
          <span className="material-symbols-outlined text-xs flex-shrink-0">chevron_right</span>
          <button onClick={() => setView((ViewState as any).STUDENT_COURSE_DETAIL)} className="hover:text-primary transition-colors truncate max-w-[150px] sm:max-w-none">
            {course.title}
          </button>
          {currentVideo && (
            <>
              <span className="material-symbols-outlined text-xs flex-shrink-0">chevron_right</span>
              <span className="text-slate-900 font-medium truncate">{currentVideo.title}</span>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all shadow-sm ${!isSidebarOpen
              ? 'bg-blue-600 text-white border-transparent hover:bg-blue-700 shadow-md transform hover:scale-105'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300'
              }`}
            title={isSidebarOpen ? "Ocultar Contenido" : "Mostrar Contenido"}
          >
            <span className="material-symbols-outlined text-[20px]">{isSidebarOpen ? 'last_page' : 'first_page'}</span>
            <span className="hidden sm:inline">{isSidebarOpen ? 'Ocultar Contenido' : 'Ver Temario'}</span>
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-[1920px] mx-auto w-full px-4 sm:px-6 pb-6 flex gap-6 overflow-y-auto">

        <div className={`flex flex-col gap-6 min-h-0 container-player transition-all duration-300 ${isSidebarOpen ? 'w-full lg:w-[calc(100%-400px)]' : 'w-full'}`}>

          <div className="bg-black rounded-xl overflow-hidden shadow-2xl relative aspect-video flex-shrink-0">
            {currentVideo ? (
              <UnifiedVideoPlayer
                key={currentVideoId}
                videoUrl={(currentVideo as any).sourceUrl || (currentVideo as any).videoUrl || ''}
                sourceType={(currentVideo as any).sourceType}
                title={currentVideo.title}
                thumbnail={currentVideo.thumbnail}
                durationStr={String(currentVideo.duration)}
                autoPlay={true}
                initialTime={resumeTime}
                seekTo={seekTarget}
                onProgress={handleVideoProgress}
                onComplete={handleVideoComplete}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <span className="material-symbols-outlined text-6xl opacity-50 mb-2">movie</span>
                  <p>Selecciona una lección para comenzar</p>
                </div>
              </div>
            )}
          </div>

          {currentVideo && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">{currentVideo.title}</h2>
                  <div className="flex items-center gap-3 mt-2 text-slate-500 flex-wrap">
                    {instructor && (
                      <>
                        <span className="material-symbols-outlined text-sm">person</span>
                        <span className="text-sm font-medium">Instructor: {instructor.name}</span>
                        <span className="hidden sm:inline w-1 h-1 bg-slate-300 rounded-full"></span>
                      </>
                    )}
                    <span className="text-sm bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {currentVideo.duration} min
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600" title="Compartir">
                    <span className="material-symbols-outlined">share</span>
                  </button>
                  <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600" title="Guardar">
                    <span className="material-symbols-outlined">bookmark</span>
                  </button>
                  <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all">
                    <span className="material-symbols-outlined text-lg">download</span>
                    Material
                  </button>
                </div>
              </div>

              <div className="border-b border-slate-200">
                <div className="flex gap-8 overflow-x-auto">
                  <button className="pb-4 border-b-2 border-primary text-primary font-semibold text-sm whitespace-nowrap">Descripción</button>
                  <button className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors whitespace-nowrap">Apuntes</button>
                  <button className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors whitespace-nowrap">Recursos</button>
                </div>
              </div>

              <div className="text-slate-700 text-sm leading-relaxed max-w-4xl">
                <p>{currentVideo.content || course.description}</p>
              </div>
            </div>
          )}
        </div>

        <div
          className={`flex-shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 sticky top-0 h-[calc(100vh-2rem)]
             ${isSidebarOpen ? 'w-[400px] translate-x-0 opacity-100' : 'w-0 translate-x-[20px] opacity-0 overflow-hidden border-none pointer-events-none'}`}
        >
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setSidebarTab('content')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${sidebarTab === 'content' ? 'text-primary' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Contenido
              {sidebarTab === 'content' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-primary"></div>}
            </button>
            <button
              onClick={() => setSidebarTab('notes')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${sidebarTab === 'notes' ? 'text-primary' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <div className="flex items-center justify-center gap-2">
                Mis Apuntes
                {sidebarTab === 'notes' && <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide border border-green-200">Guardado</span>}
              </div>
              {sidebarTab === 'notes' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-primary"></div>}
            </button>
          </div>

          {sidebarTab === 'content' ? (
            <>
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm">Progreso del Curso</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>{courseCompletionPercentage}% Completado</span>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${courseCompletionPercentage}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-slate-100">
                  {modules.filter((m: any) => m.status === 'PUBLICADO').map((module, modIdx, allModules) => {
                    const moduleItems = module.items || getLessonsByModuleId(module.id);
                    return (
                      <div key={module.id}>
                        <div className="px-4 py-3 bg-slate-50/50 font-bold text-sm text-slate-800 flex justify-between items-center sticky top-0 backdrop-blur-sm z-10 border-b border-slate-100">
                          {module.name}
                          <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-normal">{moduleItems.length || 0}</span>
                        </div>
                        <div>
                          {moduleItems.map((item: any) => {
                            const isActive = currentVideoId === item.id;
                            const progress = getLessonProgress(item.id);
                            const isCompleted = progress?.completed || item.status === 'COMPLETADO';
                            const isLocked = !unlockedLessons.has(item.id);

                            let progressPercentage = 0;
                            if (progress && progress.data && progress.data.totalSeconds > 0) {
                              progressPercentage = Math.round((progress.data.playedSeconds / progress.data.totalSeconds) * 100);
                            }

                            return (
                              <div
                                key={item.id}
                                onClick={() => !isLocked && setCurrentVideoId(item.id)}
                                className={`px-4 py-3 flex gap-3 transition-colors border-l-4 
                                  ${isActive ? 'bg-blue-50 border-primary' : isLocked ? 'bg-slate-50 border-transparent opacity-60 cursor-not-allowed' : 'hover:bg-slate-50 border-transparent cursor-pointer'}
                                  relative overflow-hidden`}
                              >
                                <div className={`mt-0.5 min-w-[20px] z-10`}>
                                  {isActive ? (
                                    <span className="material-symbols-outlined text-primary text-[20px] animate-pulse">play_circle</span>
                                  ) : isCompleted ? (
                                    <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
                                  ) : isLocked ? (
                                    <span className="material-symbols-outlined text-slate-400 text-[20px]">lock</span>
                                  ) : (
                                    <span className="material-symbols-outlined text-slate-400 text-[20px]">radio_button_unchecked</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 z-10">
                                  <div className="flex justify-between items-start">
                                    <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : isLocked ? 'text-slate-500' : 'text-slate-700'}`}>{item.title}</p>
                                    {progressPercentage > 0 && progressPercentage < 100 && !isCompleted && !isLocked && (
                                      <div className="flex items-center gap-2 ml-2 min-w-[60px]">
                                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-bold">{progressPercentage}%</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-1.5 rounded flex items-center gap-1 ${isLocked ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                      <span className="material-symbols-outlined text-[10px]">schedule</span>
                                      {item.duration}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">sticky_note_2</span>
              <p>La función de apuntes está deshabilitada temporalmente para mantenimiento.</p>
            </div>
            /* 
            currentVideo && course ? (
              <CourseNotes
                courseId={course.id}
                moduleId={modules.find(m => m.items?.some((i: any) => i.id === currentVideoId) || getLessonsByModuleId(m.id).some(l => l.id === currentVideoId))?.id || 0}
                lessonId={currentVideo.id}
                videoId={(currentVideo as any).videoId}
                currentTime={currentPlaybackTime}
                onSeek={handleSeek}
              />
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                Selecciona un video para tomar notas.
              </div>
            )
            */
          )}
        </div>

      </main>
    </div>
  );
};

export default CoursePlayer;