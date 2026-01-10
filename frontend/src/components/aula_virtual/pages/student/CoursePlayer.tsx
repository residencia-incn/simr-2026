import React, { useState } from 'react';
import { ViewState } from '../../types';

interface CoursePlayerProps {
  setView: (view: ViewState) => void;
}

const CoursePlayer: React.FC<CoursePlayerProps> = ({ setView }) => {
  const [showMobileNotes, setShowMobileNotes] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-light relative">
      <div className="max-w-[1600px] mx-auto w-full px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <button onClick={() => setView(ViewState.STUDENT_COURSE_CATALOG)} className="hover:text-primary flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-base">home</span>
            Congresos 2024
          </button>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <button onClick={() => setView(ViewState.STUDENT_COURSE_DETAIL)} className="hover:text-primary transition-colors">Módulo de Neuroplasticidad</button>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-slate-900 font-medium truncate">Ponencia: Recuperación Post-Ictus y Plasticidad Neuronal</span>
        </nav>
      </div>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
        
        {/* Left Column: Video & Info */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-black rounded-xl overflow-hidden shadow-2xl relative group aspect-video">
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAuIYGLRrt9ADdBDtP8a0TVajX86iwqWRpwXeZbRrpgY_6cCkLqWbs2hJtF3tTNLu5nFYJsbEnadthKyJxO3vaHOAOfu5qH3Tnbowj700e9kqC4WWtPfT5FeTk2YglDoySJKH89-TCty2m5CoSxI-q_tp1vcnwPQARVQsrN8dIF7S6VqSJiKtjfry4ypUlp286KsnWFETVb0aEk1MROjSSmrBldnz245GrGCqQUqiwHiaPq7Y2IDn5t5zBATH-D03yYMMLHNpjRvw")' }}>
              <button className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg group-hover:bg-primary/90">
                <span className="material-symbols-outlined text-5xl fill-1">play_arrow</span>
              </button>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent pt-12 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-3 mb-3 group/progress cursor-pointer">
                <span className="text-[10px] text-white font-mono">14:22</span>
                <div className="h-1.5 flex-1 bg-white/20 rounded-full relative">
                  <div className="absolute inset-y-0 left-0 bg-primary w-[35%] rounded-full"></div>
                  <div className="absolute left-[35%] top-1/2 -translate-y-1/2 w-4 h-4 bg-primary border-2 border-white rounded-full shadow scale-0 group-hover/progress:scale-100 transition-transform"></div>
                </div>
                <span className="text-[10px] text-white font-mono">42:15</span>
              </div>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <button className="hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">pause</span>
                  </button>
                  <button className="hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">skip_next</span>
                  </button>
                  <div className="flex items-center gap-2 group/volume">
                    <span className="material-symbols-outlined">volume_up</span>
                    <div className="w-16 h-1 bg-white/20 rounded-full relative">
                      <div className="absolute inset-y-0 left-0 bg-white w-3/4 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs px-2 py-1 bg-white/10 rounded font-medium cursor-pointer hover:bg-white/20">1.25x</span>
                  <button className="hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">closed_caption</span>
                  </button>
                  <button className="hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">settings</span>
                  </button>
                  <button className="hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">fullscreen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Plasticidad Neuronal y Estrategias de Intervención Post-Ictus</h2>
                <div className="flex items-center gap-3 mt-2 text-slate-500">
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span className="text-sm font-medium">Ponente: Dra. Elena Marín - Jefa de Neurología en Hospital Vall d'Hebron</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="text-sm">4.8 (215 reseñas)</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600">
                  <span className="material-symbols-outlined">share</span>
                </button>
                <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600">
                  <span className="material-symbols-outlined">bookmark</span>
                </button>
                <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all">
                  <span className="material-symbols-outlined text-lg">download</span>
                  Material de Soporte
                </button>
              </div>
            </div>
            <div className="border-b border-slate-200">
              <div className="flex gap-8">
                <button className="pb-4 border-b-2 border-primary text-primary font-semibold text-sm">Descripción</button>
                <button className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors">Preguntas y Respuestas (42)</button>
                <button className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors">Bibliografía</button>
              </div>
            </div>
            <div className="text-slate-700 text-sm leading-relaxed max-w-4xl">
              <p>En esta sesión intensiva, exploraremos los mecanismos celulares de la plasticidad sináptica en el cerebro adulto tras un evento isquémico. Analizaremos cómo la neurorehabilitación temprana activa vías de señalización específicas y cómo las nuevas terapias coadyuvantes pueden mejorar el pronóstico funcional a largo plazo.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Notes Editor (Desktop) */}
        <div className={`lg:col-span-4 flex flex-col h-[600px] lg:h-auto lg:sticky lg:top-6 ${showMobileNotes ? 'fixed inset-0 z-50 bg-black/50 lg:static lg:bg-transparent' : 'hidden lg:flex'}`}>
          <div className={`bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden ${showMobileNotes ? 'absolute right-0 top-0 bottom-0 w-full sm:w-[400px] rounded-r-none animate-in slide-in-from-right' : ''}`}>
            
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showMobileNotes && (
                  <button onClick={() => setShowMobileNotes(false)} className="lg:hidden mr-2 p-1 hover:bg-slate-100 rounded-full">
                    <span className="material-symbols-outlined text-slate-600">close</span>
                  </button>
                )}
                <span className="material-symbols-outlined text-primary">edit_note</span>
                <h3 className="font-bold text-slate-900">Mis Apuntes</h3>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
                <span className="material-symbols-outlined text-[12px] fill-1">cloud_done</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Guardado</span>
              </div>
            </div>
            
            {/* Toolbar */}
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1">
              <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Negrita">
                <span className="material-symbols-outlined text-lg">format_bold</span>
              </button>
              <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Itálica">
                <span className="material-symbols-outlined text-lg">format_italic</span>
              </button>
              <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Lista con viñetas">
                <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
              </button>
              <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Lista numerada">
                <span className="material-symbols-outlined text-lg">format_list_numbered</span>
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>
              <button className="p-1.5 bg-primary/10 text-primary rounded flex items-center gap-1 text-xs font-semibold px-2 hover:bg-primary/20 transition-colors" title="Insertar timestamp actual">
                <span className="material-symbols-outlined text-base">timer</span>
                14:22
              </button>
              <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors ml-auto" title="Resaltar">
                <span className="material-symbols-outlined text-lg">format_ink_highlighter</span>
              </button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-white">
              <div className="min-h-full outline-none text-slate-800 text-sm space-y-4" contentEditable={true} suppressContentEditableWarning={true}>
                <p className="text-slate-400 italic pointer-events-none">Haz clic para empezar a escribir tus notas médicas...</p>
                <div className="flex gap-3 group">
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono text-[11px] h-fit mt-0.5 select-none cursor-pointer hover:bg-slate-200">03:45</span>
                  <p><strong className="text-slate-900">Diferenciación celular:</strong> La plasticidad no es uniforme en todas las áreas corticales. La zona de penumbra isquémica muestra mayor potencial de reconexión sináptica en las primeras 48 horas.</p>
                </div>
                <div className="flex gap-3 group">
                  <span className="bg-blue-50 text-primary px-1.5 py-0.5 rounded font-mono text-[11px] h-fit mt-0.5 select-none cursor-pointer hover:bg-blue-100">12:10</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    <li>Mecanismo de <em>LTP (Long Term Potentiation)</em>: Fundamental para el re-aprendizaje motor.</li>
                    <li>Importancia del BDNF en el pronóstico.</li>
                  </ul>
                </div>
                <div className="flex gap-3 group bg-primary/5 p-3 rounded-lg border-l-4 border-primary">
                  <span className="bg-primary text-white px-1.5 py-0.5 rounded font-mono text-[11px] h-fit mt-0.5 select-none">14:22</span>
                  <p><strong className="text-slate-900">HIPÓTESIS:</strong> La estimulación magnética transcraneal (TMS) repetitiva podría acelerar este proceso si se aplica en tándem con terapia física activa.</p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors">
                <span className="material-symbols-outlined text-lg">print</span>
                Imprimir
              </button>
              <button className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-white hover:bg-primary/90 text-sm font-bold shadow-sm transition-colors shadow-primary/20">
                <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => setShowMobileNotes(!showMobileNotes)}
          className="w-14 h-14 bg-primary rounded-full shadow-2xl flex items-center justify-center text-white hover:bg-primary/90 transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined text-3xl">edit_note</span>
        </button>
      </div>
    </div>
  );
};

export default CoursePlayer;