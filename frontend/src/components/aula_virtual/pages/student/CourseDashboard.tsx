import React from 'react';
import { ViewState } from '../../types';

interface CourseDashboardProps {
  setView: (view: ViewState) => void;
}

const CourseDashboard: React.FC<CourseDashboardProps> = ({ setView }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-background-light p-4 lg:p-8">
      <div className="max-w-[1200px] mx-auto">
        <nav aria-label="Breadcrumb" className="flex mb-8">
          <ol className="flex items-center space-x-2">
            <li><button onClick={() => setView(ViewState.STUDENT_COURSE_CATALOG)} className="text-slate-500 hover:text-primary text-sm font-medium">Inicio</button></li>
            <li className="text-slate-300 text-sm">/</li>
            <li><button onClick={() => setView(ViewState.STUDENT_COURSE_CATALOG)} className="text-slate-500 hover:text-primary text-sm font-medium">Cursos</button></li>
            <li className="text-slate-300 text-sm">/</li>
            <li aria-current="page" className="text-primary font-bold text-sm">Neurología Clínica Avanzada</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                    Neurología Clínica Avanzada: Diagnóstico y Tratamiento
                  </h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 shadow-sm">
                    En curso
                  </span>
                </div>
                <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-3xl">
                  Un curso integral sobre los últimos avances en neuroimagen y terapias farmacológicas. Diseñado específicamente para residentes y especialistas que buscan actualización continua.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-500 mb-1">Tu Progreso</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-primary tracking-tight">65%</span>
                      <span className="text-sm font-medium text-slate-500">Completado</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-500 bg-gray-100 px-2 py-1 rounded">12/18 Lecciones</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mt-2">
                  <div className="bg-primary h-3 rounded-full transition-all duration-500 shadow-sm" style={{ width: '65%' }}></div>
                </div>
                <div className="mt-6">
                  <button 
                    onClick={() => setView(ViewState.STUDENT_PLAYER)}
                    className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <span className="material-symbols-outlined">play_circle</span>
                    Continuar: Módulo 3, Lección 2
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center hover:border-primary/30 transition-colors">
                <span className="material-symbols-outlined text-primary mb-2 text-3xl">view_module</span>
                <span className="text-xl font-bold text-slate-900">6</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Módulos</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center hover:border-primary/30 transition-colors">
                <span className="material-symbols-outlined text-primary mb-2 text-3xl">smart_display</span>
                <span className="text-xl font-bold text-slate-900">24</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Videos</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center hover:border-primary/30 transition-colors">
                <span className="material-symbols-outlined text-primary mb-2 text-3xl">schedule</span>
                <span className="text-xl font-bold text-slate-900">32h</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Duración</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center hover:border-primary/30 transition-colors">
                <span className="material-symbols-outlined text-primary mb-2 text-3xl">group</span>
                <span className="text-xl font-bold text-slate-900">4.8</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Valoración</span>
              </div>
            </div>

            {/* Modules List */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">list_alt</span>
                Contenido del Curso
              </h3>
              
              {/* Module 1 */}
              <div className="group rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <details className="group">
                  <summary className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100/80 transition-colors list-none">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-green-500 bg-green-50 rounded-full">check_circle</span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">Módulo 1: Fundamentos de Neuroanatomía</h4>
                        <p className="text-xs text-slate-500 mt-0.5">3 lecciones • 1h 45m</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 group-open:rotate-180 transition-transform">expand_more</span>
                  </summary>
                  <div className="divide-y divide-gray-100 border-t border-gray-100">
                    <a className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group/lesson cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded text-green-600">
                          <span className="material-symbols-outlined text-[20px]">play_circle</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700 group-hover/lesson:text-primary transition-colors">1.1 Introducción a la anatomía cerebral</span>
                          <span className="text-xs text-slate-500">Video • 45 min</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-green-500 text-[20px]">check</span>
                    </a>
                    <a className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group/lesson cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded text-green-600">
                          <span className="material-symbols-outlined text-[20px]">description</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700 group-hover/lesson:text-primary transition-colors">1.2 Lectura: Atlas interactivo</span>
                          <span className="text-xs text-slate-500">PDF • 15 min</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-green-500 text-[20px]">check</span>
                    </a>
                  </div>
                </details>
              </div>

              {/* Module 2 */}
              <div className="group rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100/80 transition-colors list-none">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-500 bg-green-50 rounded-full">check_circle</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">Módulo 2: Neurofisiología Clínica</h4>
                      <p className="text-xs text-slate-500 mt-0.5">4 lecciones • 2h 10m</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">expand_more</span>
                </div>
              </div>

              {/* Module 3 (Active) */}
              <div className="group rounded-xl border border-primary/40 bg-white shadow-md overflow-hidden ring-1 ring-primary/10">
                <details open className="group">
                  <summary className="flex items-center justify-between p-4 cursor-pointer bg-blue-50/50 list-none">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-20 animate-ping"></span>
                        <span className="material-symbols-outlined text-primary relative">radio_button_checked</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">Módulo 3: Trastornos del Movimiento</h4>
                        <p className="text-xs text-slate-500 mt-0.5">5 lecciones • 3h 30m</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-primary rotate-180">expand_more</span>
                  </summary>
                  <div className="divide-y divide-gray-100 block border-t border-slate-100">
                    <a className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group/lesson opacity-75 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded text-gray-400">
                          <span className="material-symbols-outlined text-[20px]">play_circle</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700 line-through decoration-gray-400">3.1 Fisiopatología del Parkinson</span>
                          <span className="text-xs text-slate-400">Video • 40 min</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-green-500 text-[20px]">check</span>
                    </a>
                    <a onClick={() => setView(ViewState.STUDENT_PLAYER)} className="flex items-center justify-between p-4 bg-blue-50 border-l-4 border-primary transition-colors group/lesson shadow-inner cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary p-2 rounded text-white shadow-lg shadow-primary/30">
                          <span className="material-symbols-outlined text-[20px] fill-1">play_arrow</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary">3.2 Diagnóstico Diferencial (Actual)</span>
                          <span className="text-xs text-primary/80 font-medium">Video • 55 min</span>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded bg-white text-primary text-[10px] font-bold uppercase tracking-wider border border-blue-100 shadow-sm">En curso</span>
                    </a>
                    <div className="flex items-center justify-between p-4 opacity-70 cursor-not-allowed bg-gray-50/80">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-200 p-2 rounded text-gray-400">
                          <span className="material-symbols-outlined text-[20px]">lock</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-500">3.3 Terapias Farmacológicas</span>
                          <span className="text-xs text-slate-400">Video • 60 min</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 opacity-70 cursor-not-allowed bg-gray-50/80">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-200 p-2 rounded text-gray-400">
                          <span className="material-symbols-outlined text-[20px]">lock</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-500">3.4 Cuestionario del Módulo</span>
                          <span className="text-xs text-slate-400">Quiz • 20 min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              </div>

              {/* Module 4 */}
              <div className="group rounded-xl border border-slate-200 bg-gray-100/50 overflow-hidden opacity-80">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400">lock</span>
                    <div>
                      <h4 className="font-bold text-slate-500 text-base">Módulo 4: Epilepsia y Convulsiones</h4>
                      <p className="text-xs text-slate-400 mt-0.5">6 lecciones • 4h 15m</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border-2 border-dashed border-gray-300 bg-white/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 rounded-full p-3 text-gray-400 border border-gray-200">
                    <span className="material-symbols-outlined text-3xl">school</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Examen Final y Certificación</h4>
                    <p className="text-sm text-slate-500">Completa todos los módulos para desbloquear el examen final.</p>
                  </div>
                </div>
                <button className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed flex items-center gap-2 border border-gray-200" disabled>
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Bloqueado
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Instructor
              </h3>
              <div className="flex items-start gap-4">
                <div className="size-14 rounded-full bg-cover bg-center shrink-0 shadow-sm border border-gray-100" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAQeNOv66bVknUVdBM1MuyIf2bsCdRhvGzQH_WTyApT3PiTOtN4iU2Vmiq_eoxdGAy0QYrAcjX1k2xEdSQ0CCDEzvCW7ims1FZoGXxZSn9veUalIWRkv0-B6koaPJ94W4MiPDJ7FmoQwZsCu_sT59nDSLYwc2G2aGLj7Sl1-Y8iLD2wyTHG_3XWfmorm9D2gjoPyEkanQrUsyrYIoCj2SPhcK1znLROgA2ht5i9hGIXbwITXuNzCPB1suNu2OixNtYRg13KHsFLiQ")'}}></div>
                <div>
                  <p className="font-bold text-slate-900">Dr. Alejandro Vargas</p>
                  <p className="text-xs text-primary font-medium mb-2">Neurólogo Senior, Hospital General</p>
                  <p className="text-xs text-slate-600 leading-snug">Especialista en trastornos del movimiento con más de 15 años de experiencia clínica.</p>
                </div>
              </div>
              <button className="mt-4 w-full py-2 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-gray-50 hover:text-primary transition-all">
                Ver Perfil Completo
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">folder_open</span>
                Recursos del Curso
              </h3>
              <div className="flex flex-col gap-3">
                <a className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100 cursor-pointer">
                  <div className="bg-red-50 p-2 rounded text-red-500">
                    <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-primary transition-colors">Guía de Estudio Completa.pdf</p>
                    <p className="text-xs text-slate-400">2.4 MB</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 text-[18px]">download</span>
                </a>
                <a className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100 cursor-pointer">
                  <div className="bg-red-50 p-2 rounded text-red-500">
                    <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-primary transition-colors">Protocolos de Neuroimagen.pdf</p>
                    <p className="text-xs text-slate-400">4.1 MB</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 text-[18px]">download</span>
                </a>
                <a className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100 cursor-pointer">
                  <div className="bg-blue-50 p-2 rounded text-blue-500">
                    <span className="material-symbols-outlined text-[20px]">link</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-primary transition-colors">Base de Datos de Casos</p>
                    <p className="text-xs text-slate-400">Enlace Externo</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 text-[18px]">open_in_new</span>
                </a>
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-white p-6 border border-blue-100 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-8xl text-primary">help</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2 relative z-10">¿Dudas sobre el contenido?</h3>
              <p className="text-sm text-slate-600 mb-4 relative z-10 leading-relaxed">Participa en el foro de discusión exclusivo para alumnos de este curso.</p>
              <button className="text-sm font-bold text-primary hover:text-blue-700 transition-colors flex items-center gap-1 relative z-10 group">
                Ir al Foro
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDashboard;