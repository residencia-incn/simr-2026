import React from 'react';
import { ViewState } from '../../types';
import { useAulaVirtual } from '../../context/AulaVirtualContext';
import { canUserAccessCourse } from '../../../../services/api';

interface CourseCatalogProps {
  setView: (view: ViewState) => void;
  onCourseSelect?: (courseId: number) => void;
}

const CourseCatalog: React.FC<CourseCatalogProps> = ({ setView, onCourseSelect }) => {
  const { courses, currentUser } = useAulaVirtual();

  const getCategoryColor = (category: string) => {
    const normalized = (category || '').toLowerCase().trim();
    switch (normalized) {
      case 'congreso':
        return 'bg-purple-600';
      case 'taller':
        return 'bg-emerald-500';
      case 'curso':
        return 'bg-blue-600';
      case 'simposio':
        return 'bg-amber-500';
      case 'diplomado':
        return 'bg-indigo-600';
      case 'webinar':
        return 'bg-rose-500';
      default:
        return 'bg-slate-600';
    }
  };

  const canAccessCourse = (course: any) => {
    return canUserAccessCourse(currentUser, course);
  };

  // Filter courses based on status AND access rights
  const visibleCourses = courses.filter(c => c.status === 'PUBLICADO' && canAccessCourse(c));

  const handleCourseClick = (courseId: number) => {
    if (onCourseSelect) {
      onCourseSelect(courseId);
    } else {
      setView(ViewState.STUDENT_COURSE_DETAIL);
    }
  };



  return (
    <div className="flex-1 overflow-y-auto bg-background-light p-4 lg:p-8 flex flex-col gap-6">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>

          <h1 className="text-slate-900 text-3xl md:text-4xl font-black tracking-tight">Videoteca</h1>
          <p className="text-slate-500 mt-2 max-w-2xl text-base">Accede al catálogo completo de grabaciones de congresos, simposios y cursos asincrónicos. Filtra por tema, ponente o fecha para encontrar lo que necesitas.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap">
            <span className="material-symbols-outlined text-[20px]">history</span>
            Historial
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap">
            <span className="material-symbols-outlined text-[20px]">playlist_play</span>
            Mi Lista
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <span className="material-symbols-outlined">search</span>
          </span>
          <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-slate-400 text-slate-900" placeholder="Buscar por título, palabra clave..." type="text" />
        </div>
        <div className="flex flex-1 gap-3 w-full overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <select className="bg-slate-50 border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary py-2.5 min-w-[140px] cursor-pointer hover:bg-slate-100 transition-colors">
            <option value="">Todos los Temas</option>
            <option value="epilepsy">Epilepsia</option>
            <option value="stroke">Ictus y Cerebrovascular</option>
            <option value="neurodegeneration">Neurodegenerativas</option>
            <option value="neuropediatrics">Neuropediatría</option>
          </select>
          <select className="bg-slate-50 border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary py-2.5 min-w-[140px] cursor-pointer hover:bg-slate-100 transition-colors">
            <option value="">Cualquier Fecha</option>
            <option value="latest">Más recientes</option>
            <option value="last-month">Último mes</option>
            <option value="last-year">Último año</option>
          </select>
          <select className="bg-slate-50 border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary py-2.5 min-w-[140px] cursor-pointer hover:bg-slate-100 transition-colors">
            <option value="">Tipo de Evento</option>
            <option value="congress">Congreso</option>
            <option value="symposium">Simposio</option>
            <option value="course">Curso</option>
          </select>
          <div className="border-l border-slate-200 mx-1"></div>
          <button className="flex items-center gap-1 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors whitespace-nowrap">
            <span className="material-symbols-outlined text-[20px]">tune</span>
            Más Filtros
          </button>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors">
            <span className="material-symbols-outlined">grid_view</span>
          </button>
          <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors">
            <span className="material-symbols-outlined">view_list</span>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-500 px-1">
        <span>Mostrando <strong>{visibleCourses.length}</strong> resultados</span>
        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
        <button className="text-xs font-bold text-primary hover:underline self-center">Limpiar filtros</button>
      </div>



      {/* Grid of Courses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visibleCourses.map(course => (
          <div key={course.id} onClick={() => handleCourseClick(course.id)} className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group cursor-pointer">
            <div className={`relative aspect-video bg-gradient-to-br ${course.coverGradient || 'from-slate-200 to-slate-300'} overflow-hidden`}>
              {course.coverImage ? (
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url("${course.coverImage}")` }}></div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                  <span className="material-symbols-outlined text-[48px] opacity-20">image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[48px] opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 drop-shadow-lg">play_circle</span>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-1.5 py-0.5 rounded">{course.totalModules || 0} Módulos</div>
              <div className={`absolute top-2 left-2 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm ${getCategoryColor(course.category)}`}>
                {course.category || 'Curso'}
              </div>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
              <p className="text-sm text-slate-500 mb-3 line-clamp-2">{course.description}</p>

              <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  {course.duration || '0m'}
                </span>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-yellow-400 text-[18px] fill-1">star</span>
                  <span className="text-sm font-bold text-slate-700">{course.rating}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Trigger */}
      <div className="flex items-center justify-center pt-8">
        <button className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-primary transition-all shadow-sm">
          Cargar más videos
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default CourseCatalog;