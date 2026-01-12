import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { ViewState, Course, Module, Lesson, Instructor } from '../../types';
import { useAulaVirtual } from '../../context/AulaVirtualContext';
import CourseContentPreview from '../admin/CourseContentPreview';

interface CourseDashboardProps {
  setView: (view: ViewState) => void;
  courseId?: number | null;
  onVideoSelect?: (videoId: number) => void;
}

const CourseDashboard: React.FC<CourseDashboardProps> = ({ setView, courseId, onVideoSelect }) => {
  const { getCourseById, getModulesByCourseId, getLessonsByModuleId, getInstructorById, userProgress } = useAulaVirtual();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [instructor, setInstructor] = useState<Instructor | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to render markdown (same as in CourseEditor)
  const renderMarkdown = (text: string) => {
    if (!text) return '';
    let html = text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") // Escape
      .replace(/(?:^• .+(?:\n|$))+/gm, (match) => { // Lists
        const items = match.trim().split('\n').map(line => `<li>${line.substring(2)}</li>`).join('');
        return `<ul class="list-disc pl-5 mb-4">${items}</ul>`;
      })
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.+?)\*/g, '<em>$1</em>') // Italic
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>') // Links
      .replace(/\n/g, '<br>'); // Line breaks
    return html;
  };

  const calculateTotalDuration = () => {
    let totalMinutes = 0;

    // Use modules state which is populated with items/lessons
    modules.forEach((module: any) => {
      // Ensure we have items, either from module.items (V2) or via helper (V1)
      const items = module.items || getLessonsByModuleId(module.id);

      items.forEach((item: any) => {
        if (!item.duration) return;
        const duration = item.duration.toString();

        if (duration.includes(':')) {
          const parts = duration.split(':').map((p: string) => parseInt(p, 10) || 0);
          if (parts.length === 3) {
            // HH:MM:SS
            totalMinutes += (parts[0] * 60) + parts[1] + (parts[2] / 60);
          } else if (parts.length === 2) {
            const mins = parts[0];
            const secs = parts[1];
            totalMinutes += mins + (secs / 60);
          }
        } else {
          const textVal = duration.toLowerCase().replace('min', '').trim();
          const val = parseInt(textVal, 10);
          if (!isNaN(val)) totalMinutes += val;
        }
      });
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    if (hours > 0) return `${hours} h ${minutes} min`;
    return `${minutes} min`;
  };

  const calculateTotalLessons = () => {
    return modules.reduce((acc, module: any) => {
      const items = module.items || getLessonsByModuleId(module.id);
      return acc + (items ? items.length : 0);
    }, 0);
  };

  // Calculate Progress Logic
  const progressStats = React.useMemo(() => {
    let completedCount = 0;
    let totalCount = 0;
    const allLessonIds: number[] = [];

    modules.forEach((module: any) => {
      const items = module.items || getLessonsByModuleId(module.id);
      if (items) {
        items.forEach((item: any) => {
          totalCount++;
          allLessonIds.push(item.id);
          // Check completion in userProgress
          const progress = userProgress.find(p => p.lessonId === item.id);
          if (progress?.completed) {
            completedCount++;
          }
        });
      }
    });

    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Check if course has been started (any progress record exists)
    const hasStarted = userProgress.some(p => allLessonIds.includes(p.lessonId));

    return { completed: completedCount, total: totalCount, percent, allLessonIds, hasStarted };
  }, [modules, userProgress, getLessonsByModuleId]);

  const handleStartContinue = () => {
    // Determine where to start
    let targetVideoId: number | null = null;

    if (progressStats.hasStarted) {
      // Find last accessed lesson
      const relevantProgress = userProgress.filter(p => progressStats.allLessonIds.includes(p.lessonId));
      // Sort by updatedAt desc
      relevantProgress.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      if (relevantProgress.length > 0) {
        targetVideoId = relevantProgress[0].lessonId;
      }
    }

    if (targetVideoId && onVideoSelect) {
      onVideoSelect(targetVideoId);
    }
    setView(ViewState.STUDENT_PLAYER);
  };

  useEffect(() => {
    if (courseId) {
      const courseData = getCourseById(courseId);
      if (courseData) {
        setCourse(courseData);

        // Load relationships
        const modulesData = getModulesByCourseId(courseId);
        setModules(modulesData);

        // Determine Instructor
        if (courseData.instructorName) {
          // Use embedded instructor details from CourseEditor
          setInstructor({
            id: courseData.instructorId || 'custom',
            name: courseData.instructorName,
            specialty: courseData.instructorSpecialty || '',
            title: courseData.instructorInstitution || '', // Map Institution to Title for display
            bio: courseData.instructorDescription || '',
            email: '', // Not needed for display
            avatar: '', // Will use default avatar logic in render
            coursesCount: 0
          });
        } else if (courseData.instructorId) {
          // Fallback to lookup for legacy courses
          const instructorData = getInstructorById(String(courseData.instructorId));
          setInstructor(instructorData);
        }
      }
    }
    setIsLoading(false);
  }, [courseId, getCourseById, getModulesByCourseId, getInstructorById]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center p-8">Cargando curso...</div>;
  }

  if (!course) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <span className="material-symbols-outlined text-[64px] mb-4 text-slate-300">school</span>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Curso no encontrado</h2>
        <p className="mb-6">No se pudo cargar la información del curso seleccionado.</p>
        <button
          onClick={() => setView(ViewState.STUDENT_COURSE_CATALOG)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Volver al Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background-light p-4 lg:p-8 pb-24">
      <div className="max-w-[1200px] mx-auto">
        <nav aria-label="Breadcrumb" className="flex mb-8 overflow-hidden">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button onClick={() => setView(ViewState.STUDENT_COURSE_CATALOG)} className="hover:text-primary flex items-center gap-1 transition-colors flex-shrink-0">
              <span className="material-symbols-outlined text-base">school</span>
              Mis Cursos
            </button>
            <span className="material-symbols-outlined text-xs flex-shrink-0">chevron_right</span>
            <span className="text-slate-900 font-medium truncate max-w-[200px] sm:max-w-none">{course.title}</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                    {course.title}
                  </h2>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${course.status === 'PUBLICADO' ? 'bg-green-100 text-green-700 border-green-200' :
                    course.status === 'BORRADOR' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      'bg-red-100 text-red-700 border-red-200'
                    }`}>
                    {course.status === 'PUBLICADO' ? 'En curso' : course.status}
                  </span>
                </div>
                <div
                  className="mt-4 text-lg text-slate-600 leading-relaxed max-w-3xl prose prose-slate prose-p:my-2 prose-a:text-primary"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(course.longDescription || course.description) }}
                />
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-500 mb-1">Tu Progreso</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-primary tracking-tight">{progressStats.percent}%</span>
                      <span className="text-sm font-medium text-slate-500">Completado</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-500 bg-gray-100 px-2 py-1 rounded">
                      {progressStats.completed}/{progressStats.total} Lecciones
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mt-2">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${progressStats.percent}%` }}
                  ></div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={handleStartContinue}
                    className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {progressStats.hasStarted ? 'play_arrow' : 'play_circle'}
                    </span>
                    <span className="text-lg">
                      {progressStats.hasStarted ? 'Continuar Curso' : 'Comenzar Curso'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center hover:border-primary/30 transition-colors">
                <span className="material-symbols-outlined text-primary mb-2 text-3xl">view_module</span>
                <span className="text-xl font-bold text-slate-900">{modules.length}</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Módulos</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center hover:border-primary/30 transition-colors">
                <span className="material-symbols-outlined text-primary mb-2 text-3xl">smart_display</span>
                <span className="text-xl font-bold text-slate-900">{calculateTotalLessons()}</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Clases</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center hover:border-primary/30 transition-colors">
                <span className="material-symbols-outlined text-primary mb-2 text-3xl">schedule</span>
                <span className="text-xl font-bold text-slate-900">{calculateTotalDuration()}</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Duración</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center hover:border-primary/30 transition-colors">
                <span className="material-symbols-outlined text-primary mb-2 text-3xl">group</span>
                <span className="text-xl font-bold text-slate-900">{course.rating}</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Valoración</span>
              </div>
            </div>

            {/* Modules List */}
            <CourseContentPreview
              modules={modules
                .filter((m: any) => m.status === 'PUBLICADO') // Only show published modules
                .map((m: any) => {
                  const items = m.items || getLessonsByModuleId(m.id);
                  const processedItems = items.map((item: any) => {
                    const progress = userProgress.find(p => p.lessonId === item.id);
                    return {
                      ...item,
                      status: progress?.completed ? 'COMPLETADO' : 'EN_CURSO' // Map completion
                    };
                  });
                  return {
                    ...m,
                    items: processedItems
                  };
                })}
              onVideoClick={(videoId) => {
                if (onVideoSelect) onVideoSelect(videoId);
              }}
              finalExam={{
                enabled: !!course?.finalExamId,
                id: course?.finalExamId || '',
                condition: (course?.finalExamCondition as 'completion' | 'date') || 'completion',
                date: course?.finalExamDate || ''
              }}
              closingDate={course?.closingDate}
            />
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Instructor Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px]">person</span>
                Instructor
              </h3>
              {instructor ? (
                <div className="flex items-start gap-4">
                  <img
                    src={instructor.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(instructor.name)}
                    alt={instructor.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight mb-1">{instructor.name}</h4>
                    <p className="text-sm text-slate-500 font-medium mb-2">
                      {instructor.specialty}
                      {instructor.title && instructor.title !== instructor.specialty && (
                        <span className="text-slate-400 font-normal"> • {instructor.title}</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {instructor.bio || "Instructor especializado del curso."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 text-slate-500 italic">
                  Instructor no asignado.
                </div>
              )}
            </div>

            {/* Resources Widget */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px] text-slate-700">folder_open</span>
                Recursos del Curso
              </h3>
              <div className="flex flex-col gap-3">
                {(course.materials && course.materials.length > 0 ? course.materials : []).length > 0 ? (
                  (course.materials || []).map((resource: any, index: number) => {
                    // Determine icon and color based on file type
                    let icon = 'description';
                    let colorClass = 'text-blue-500 bg-blue-50 border-blue-100 group-hover:bg-blue-100';

                    const type = resource.type ? resource.type.toLowerCase() : '';
                    const name = resource.name ? resource.name.toLowerCase() : '';

                    if (type.includes('pdf') || name.endsWith('.pdf')) {
                      icon = 'picture_as_pdf';
                      colorClass = 'text-red-500 bg-red-50 border-red-100 group-hover:bg-red-100';
                    } else if (type.includes('word') || type.includes('doc') || name.endsWith('.doc') || name.endsWith('.docx')) {
                      icon = 'description';
                      colorClass = 'text-blue-600 bg-blue-50 border-blue-100 group-hover:bg-blue-100';
                    } else if (type.includes('excel') || type.includes('sheet') || type.includes('csv') || name.endsWith('.xls') || name.endsWith('.xlsx')) {
                      icon = 'table_view';
                      colorClass = 'text-green-600 bg-green-50 border-green-100 group-hover:bg-green-100';
                    } else if (type.includes('image') || name.endsWith('.jpg') || name.endsWith('.png')) {
                      icon = 'image';
                      colorClass = 'text-purple-600 bg-purple-50 border-purple-100 group-hover:bg-purple-100';
                    } else if (type.includes('video') || name.endsWith('.mp4')) {
                      icon = 'movie';
                      colorClass = 'text-pink-600 bg-pink-50 border-pink-100 group-hover:bg-pink-100';
                    }

                    return (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group cursor-pointer">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${colorClass}`}>
                          <span className="material-symbols-outlined">{icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700 truncate">{resource.name}</p>
                          <p className="text-xs text-slate-400">
                            {resource.size ? resource.size : 'Archivo'} • {resource.uploadedAt ? new Date(resource.uploadedAt).toLocaleDateString() : 'Recurso'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (resource.url) {
                              window.open(resource.url, '_blank');
                            } else {
                              Swal.fire({
                                title: 'Descarga simulada',
                                text: `Se descargaría el archivo: ${resource.name}`,
                                icon: 'info',
                                timer: 2000,
                                showConfirmButton: false
                              });
                            }
                          }}
                          className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors hover:bg-slate-100 rounded-full p-1"
                        >
                          download
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-slate-400 text-sm italic">
                    <span className="material-symbols-outlined text-[32px] mb-2 opacity-50 block mx-auto">folder_off</span>
                    No hay recursos disponibles.
                  </div>
                )}
              </div>
            </div>

            {/* Support Widget */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-blue-600 bg-white p-2 rounded-full shadow-sm">help</span>
                <h3 className="text-sm font-bold text-slate-900">¿Dudas sobre el contenido?</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4 ml-1">
                Nuestro equipo docente y soporte técnico están disponibles para ayudarte.
              </p>
              <button className="w-full py-2.5 bg-white border border-blue-200 text-blue-700 font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm text-sm">
                Contactar Soporte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDashboard;