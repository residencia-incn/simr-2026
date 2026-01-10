import React from 'react';

const NotesLibrary: React.FC = () => {
  return (
    <div className="flex-1 flex h-full overflow-hidden bg-background-light">
      {/* Sidebar */}
      <aside className="hidden xl:flex w-64 flex-col border-r border-slate-200 h-full p-6 overflow-y-auto bg-white">
        <div className="mb-8">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-4">Navegación</h3>
          <nav className="flex flex-col gap-1">
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/5 shadow-sm border border-primary/10 text-primary font-semibold transition-all" href="#">
              <span className="material-symbols-outlined text-[20px]">folder_open</span>
              <span className="text-sm">Todos los Apuntes</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-primary transition-all group" href="#">
              <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-primary">schedule</span>
              <span className="text-sm">Recientes</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-primary transition-all group" href="#">
              <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-primary">star</span>
              <span className="text-sm">Favoritos</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-primary transition-all group" href="#">
              <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-primary">archive</span>
              <span className="text-sm">Archivados</span>
            </a>
          </nav>
        </div>
        <div className="mb-8">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-4">Categorías</h3>
          <nav className="flex flex-col gap-1">
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-sm" href="#">
              <span className="size-2 rounded-full bg-blue-400"></span>
              Congresos 2024
            </a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-sm" href="#">
              <span className="size-2 rounded-full bg-purple-400"></span>
              Cursos Asincrónicos
            </a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-sm" href="#">
              <span className="size-2 rounded-full bg-emerald-400"></span>
              Investigación Clínica
            </a>
          </nav>
        </div>
        <div className="mt-auto p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary text-lg">cloud_done</span>
            <span className="text-[11px] font-bold uppercase text-slate-600">Espacio</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mb-2 overflow-hidden">
            <div className="bg-primary h-full w-[45%] rounded-full"></div>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Usado 4.5GB de 10GB</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-6 lg:p-10 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Biblioteca de Mis Apuntes</h1>
            <p className="text-slate-500 text-base">Repositorio central para el estudio y repaso de neurología clínica.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 transition-all border border-slate-200 shadow-sm">
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              Exportar Todo
            </button>
            <button className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-primary/25 transition-all">
              <span className="material-symbols-outlined text-sm">add</span>
              Nuevo Apunte
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-10">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400">search</span>
            </div>
            <input className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm placeholder:text-slate-400" placeholder="Buscar por título de curso, ponente o diagnóstico (ej. Criterios de McDonald...)" type="text"/>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-xs font-bold shadow-sm transition-colors">
              Todo
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
              Epilepsia
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
              Neuroinmunología
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
              Ictus
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
              T. Movimiento
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
            <div className="h-6 w-px bg-slate-300 mx-2"></div>
            <button className="flex items-center gap-2 text-primary text-xs font-bold px-3 py-2 hover:bg-primary/5 rounded-lg transition-all">
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              Filtros Avanzados
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          
          {/* Card 1 */}
          <div className="group bg-white border border-slate-200 rounded-xl overflow-hidden transition-all hover:shadow-lg hover:border-primary/20 flex flex-col h-full cursor-pointer">
            <div className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wide border border-blue-100">Congreso Internacional</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 rounded"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                  <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors hover:bg-slate-100 rounded"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                Criterios diagnósticos en la Esclerosis Múltiple Remitente-Recurrente
              </h3>
              <div className="text-slate-500 text-sm mb-6 line-clamp-3 italic leading-relaxed">
                "Actualización de los criterios de McDonald 2024. Importancia de las bandas oligoclonales y el papel de la RM..."
              </div>
              <div className="mt-auto space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-500 uppercase">#EM</span>
                  <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-500 uppercase">#MRI</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
                    <span>Editado: Hoy, 10:45 AM</span>
                  </div>
                  <button className="size-9 bg-primary/5 text-primary rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-primary/10">
                    <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group bg-white border border-slate-200 rounded-xl overflow-hidden transition-all hover:shadow-lg hover:border-primary/20 flex flex-col h-full cursor-pointer">
            <div className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2.5 py-1 rounded bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-wide border border-purple-100">Curso Asincrónico</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 rounded"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                  <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors hover:bg-slate-100 rounded"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                Nuevas Fronteras en Terapias Génicas para la Atrofia Muscular Espinal
              </h3>
              <div className="text-slate-500 text-sm mb-6 line-clamp-3 italic leading-relaxed">
                "Revisión de protocolos de Onasemnogene abeparvovec y seguimientos a 5 años en pacientes pediátricos..."
              </div>
              <div className="mt-auto space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-500 uppercase">#AME</span>
                  <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-500 uppercase">#Genética</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
                    <span>24 Mar, 2024</span>
                  </div>
                  <button className="size-9 bg-primary/5 text-primary rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-primary/10">
                    <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group bg-white border border-slate-200 rounded-xl overflow-hidden transition-all hover:shadow-lg hover:border-primary/20 flex flex-col h-full cursor-pointer">
            <div className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wide border border-emerald-100">Investigación</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 rounded"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                  <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors hover:bg-slate-100 rounded"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                Manejo Agudo del Ictus Isquémico: Trombectomía Mecánica
              </h3>
              <div className="text-slate-500 text-sm mb-6 line-clamp-3 italic leading-relaxed">
                "Ventana terapéutica extendida mediante neuroimagen avanzada (RAPID). Comparativa de stents vs aspiración..."
              </div>
              <div className="mt-auto space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-500 uppercase">#Ictus</span>
                  <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-500 uppercase">#Urgencias</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
                    <span>15 Feb, 2024</span>
                  </div>
                  <button className="size-9 bg-primary/5 text-primary rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-primary/10">
                    <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* New Note Card */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-10 text-center hover:bg-slate-50 hover:border-primary/40 transition-all cursor-pointer group bg-white/50 h-full">
            <div className="size-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 text-slate-400 group-hover:scale-110 group-hover:text-primary group-hover:bg-white group-hover:shadow-md transition-all">
              <span className="material-symbols-outlined text-3xl">post_add</span>
            </div>
            <p className="text-slate-900 font-bold mb-1">Crea un nuevo apunte</p>
            <p className="text-slate-400 text-sm">Organiza tu conocimiento clínico</p>
          </div>

        </div>

        {/* Floating Action Bar (Mockup for functionality) */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl flex items-center gap-6 shadow-2xl z-40 transform translate-y-20 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{animationFillMode: 'forwards', animationDelay: '0.5s'}}>
          <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
            <span className="size-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-extrabold">3</span>
            <span className="text-sm font-medium tracking-tight">Seleccionados</span>
          </div>
          <div className="flex items-center gap-5">
            <button className="flex items-center gap-2 hover:text-primary transition-colors text-sm font-semibold">
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
              PDF
            </button>
            <button className="flex items-center gap-2 hover:text-primary transition-colors text-sm font-semibold">
              <span className="material-symbols-outlined text-[20px]">drive_file_move</span>
              Mover
            </button>
            <button className="flex items-center gap-2 hover:text-red-400 transition-colors text-sm font-semibold">
              <span className="material-symbols-outlined text-[20px]">delete</span>
              Eliminar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotesLibrary;