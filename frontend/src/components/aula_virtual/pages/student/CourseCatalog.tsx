import React from 'react';
import { ViewState } from '../../types';

interface CourseCatalogProps {
  setView: (view: ViewState) => void;
}

const CourseCatalog: React.FC<CourseCatalogProps> = ({ setView }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-background-light p-4 lg:p-8 flex flex-col gap-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span className="hover:text-primary transition-colors cursor-pointer">Inicio</span>
            <span className="material-symbols-outlined !text-[14px]">chevron_right</span>
            <span className="text-slate-900 font-medium">Videoteca</span>
          </div>
          <h1 className="text-slate-900 text-3xl md:text-4xl font-black tracking-tight">Videoteca de Videoclases</h1>
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
          <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-slate-400 text-slate-900" placeholder="Buscar por título, palabra clave..." type="text"/>
        </div>
        <div className="flex flex-1 gap-3 w-full overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <select className="bg-slate-50 border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary py-2.5 min-w-[140px] cursor-pointer hover:bg-slate-100 transition-colors">
            <option value="">Todos los Temas</option>
            <option value="epilepsy">Epilepsia</option>
            <option value="stroke">Ictus y Cerebrovascular</option>
            <option value="neurodegenerative">Neurodegenerativas</option>
            <option value="sleep">Trastornos del Sueño</option>
          </select>
          <select className="bg-slate-50 border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary py-2.5 min-w-[140px] cursor-pointer hover:bg-slate-100 transition-colors">
            <option value="">Todos los Ponentes</option>
            <option value="dr-rodriguez">Dr. Rodríguez</option>
            <option value="dra-garcia">Dra. María García</option>
            <option value="dr-lopez">Dr. López</option>
          </select>
          <select className="bg-slate-50 border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary py-2.5 min-w-[130px] cursor-pointer hover:bg-slate-100 transition-colors">
            <option value="">Año</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
          <div className="border-l border-slate-200 mx-1"></div>
          <button className="flex items-center gap-1 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors whitespace-nowrap">
            <span className="material-symbols-outlined text-[20px]">tune</span>
            <span className="hidden xl:inline">Más Filtros</span>
          </button>
        </div>
        <div className="hidden lg:flex items-center gap-2 border-l border-slate-200 pl-4">
          <button className="p-2 text-primary bg-primary/10 rounded-lg transition-colors">
            <span className="material-symbols-outlined">grid_view</span>
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined">view_list</span>
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide py-1.5 mr-2 self-center">Populares:</span>
        <button className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-full hover:bg-blue-700 transition-colors shadow-sm shadow-primary/30">Congreso 2024</button>
        <button className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-full hover:border-primary/50 hover:text-primary transition-colors">Neuroética</button>
        <button className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-full hover:border-primary/50 hover:text-primary transition-colors">Casos Clínicos</button>
        <button className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-full hover:border-primary/50 hover:text-primary transition-colors">Alzheimer</button>
        <button className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-full hover:border-primary/50 hover:text-primary transition-colors">Neurocirugía</button>
        <button className="ml-auto text-xs font-bold text-primary hover:underline self-center">Limpiar filtros</button>
      </div>

      {/* Featured Card */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 group cursor-pointer shadow-lg hover:shadow-xl transition-all">
        <div className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDySrTrHxP6SDfU2oNImXle91DuSmusa81-GrLRF80DmUoBTh9va5Sw7xqG0M0Gb_tgA31vB32G0pf6isISLltKVwPnHE3AwfQk3tCH-Qh7pr7kkGw25gYx6XIuhZBDNP-M7vUwDuC4WMS3HhI6CyzGqHwCYovZif3kk7hJFeliM4VctMxdKUt5oMdMYuLmHpF4THs4wGaw4j5wf5BWUxkWflAlB-teMaRo2rWqaL-trh6mtKa_T9BqZKtrZOJM8PqJ6VPhF_V9aQ")'}}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent"></div>
        <div className="relative z-10 p-6 md:p-10 flex flex-col items-start justify-center h-full min-h-[320px] md:min-h-[380px] max-w-3xl">
          <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded mb-4 shadow-lg">
            <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
            DESTACADO DEL MES
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tight">Neuroplasticidad: Nuevos Horizontes Terapéuticos</h2>
          <p className="text-slate-200 text-base md:text-lg mb-6 line-clamp-3 md:line-clamp-2 max-w-2xl">Una masterclass exclusiva sobre los últimos descubrimientos en la capacidad regenerativa del sistema nervioso central y sus aplicaciones prácticas en rehabilitación post-traumática.</p>
          <div className="flex flex-wrap items-center gap-6 mb-8 text-white/90">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-cover bg-center ring-2 ring-white/30" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBGKSg-snhAlBPL4o3upFgLLVl50G1ADEnkx5jdA8VkuGrFjN_kwhORi2yLs5z6qYpyvR9CivANk36aV8_JaWETGzaXpQA5RBtPQRtEOOTeis1P-jZiyN_gvIN7CMnWMmOYnlMQC5qSYpYHvp5-A50C35jov4-rTDZWlmqcbkv6X3lKr-rRvL15pJ-gFHeFiXBn0nR4C0-Dk5pgcQlsOycrzSSuf9OQGv--IQOt49l7728UNjUvDMpl5T_NkjxnJ5YtCnzGaatk2A")'}}></div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none">Dra. María García</span>
                <span className="text-xs text-slate-300">Neurología Experimental</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              1h 45min
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              12 Oct 2024
            </div>
          </div>
          <button 
            onClick={() => setView(ViewState.STUDENT_COURSE_DETAIL)}
            className="flex items-center gap-3 bg-primary hover:bg-blue-600 text-white px-8 py-3.5 rounded-xl text-base font-bold transition-all shadow-lg shadow-primary/30 group-hover:translate-y-[-2px]"
          >
            <span className="material-symbols-outlined text-[24px]">play_circle</span>
            Reproducir Ahora
          </button>
        </div>
      </div>

      {/* Grid of Courses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div onClick={() => setView(ViewState.STUDENT_COURSE_DETAIL)} className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group cursor-pointer">
          <div className="relative aspect-video bg-slate-200 overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBku6L_Z-krbMJZLcEOfKDSHIx1TOB9FUsa97ttCi0E1u5Gra_YuQlj-UOCnzHJWqUT5iGhU_21CmizvQQL3eieHi_12P4aObk4f1vJOoFoRCFIlW2DNVtWLRPibAMpplL2Sw9Q2aBcUEE0Ndu5vuVGT8lz0DpczVieV-YJ0B8fs_jaNDbBv29RH-k3hzcljSwXvXDMo4rDMuF7ZLJdHjEJN6l3XLJl4lOYvFeUSCyY1U7Mi2uxZR-S54i7JVJJmJA2g5bFl3Bdmw")'}}></div>
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[48px] opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 drop-shadow-lg">play_circle</span>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-1.5 py-0.5 rounded">45:20</div>
            <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm">Clínica</div>
          </div>
          <div className="p-4 flex flex-col flex-1">
            <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">Diagnóstico Diferencial en Cefaleas Complejas</h3>
            <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-slate-200 bg-cover" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBWau6yCTcrvjZZx_cEwMY7LVvQK8tyixdEbER7h3bDG4kODdG7rp4exZJmh0C1_J2yMQNX0E7LcMjw1BfPym3BF3UMxjr4O-WXfJkYYRba1UWBqHSypGfXB2s2fyih0-XYWqC0mNrausgbFWj-9wRA3eVPPvq4delne_WAMdmZ7odlDUdimB3wVjvkByc5KPuZtRqzq6WFnKiOlSV40gwYm17VW6oCttJar3GaEyzXXQYL8KzFbupgN0KbeVOPtnY63wzceNlg2A")'}}></div>
                <span className="text-xs font-medium text-slate-600">Dr. Rodríguez</span>
              </div>
              <span className="text-xs text-slate-400">Hace 2 días</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div onClick={() => setView(ViewState.STUDENT_COURSE_DETAIL)} className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group cursor-pointer">
          <div className="relative aspect-video bg-slate-200 overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDqHTJ95PcZbOvoAz4YbST_0ZiQbWgoCgaWmtPR7YoMUyKLFfX0iH-OC3fA5YpqmCJoTAMIdEA0702wYjsRQCEAQti5sDvYiujYGoUYa9EGdxDW0ZZ32li7HD2MAORFoYAYVxZvwAhhZ6kzVEcFybVmAiXbYoIy2j9hpHQT2ScH2S91VtYqArnkp6-sJ1OhMO69G_0qV3srZB-PhDrpP0Ite9PKpfBGObOnr0h_95PlJVNBssOXulWE2G5byXGB6ECvaqRUQzF0nA")'}}></div>
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[48px] opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 drop-shadow-lg">play_circle</span>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-1.5 py-0.5 rounded">22:15</div>
            <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm">Taller</div>
          </div>
          <div className="p-4 flex flex-col flex-1">
            <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">Manejo de la Apnea del Sueño: Guía Práctica</h3>
            <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-slate-200 bg-cover" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBGKSg-snhAlBPL4o3upFgLLVl50G1ADEnkx5jdA8VkuGrFjN_kwhORi2yLs5z6qYpyvR9CivANk36aV8_JaWETGzaXpQA5RBtPQRtEOOTeis1P-jZiyN_gvIN7CMnWMmOYnlMQC5qSYpYHvp5-A50C35jov4-rTDZWlmqcbkv6X3lKr-rRvL15pJ-gFHeFiXBn0nR4C0-Dk5pgcQlsOycrzSSuf9OQGv--IQOt49l7728UNjUvDMpl5T_NkjxnJ5YtCnzGaatk2A")'}}></div>
                <span className="text-xs font-medium text-slate-600">Dra. Weiss</span>
              </div>
              <span className="text-xs text-slate-400">Hace 1 sem</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div onClick={() => setView(ViewState.STUDENT_COURSE_DETAIL)} className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group cursor-pointer">
          <div className="relative aspect-video bg-slate-200 overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDySrTrHxP6SDfU2oNImXle91DuSmusa81-GrLRF80DmUoBTh9va5Sw7xqG0M0Gb_tgA31vB32G0pf6isISLltKVwPnHE3AwfQk3tCH-Qh7pr7kkGw25gYx6XIuhZBDNP-M7vUwDuC4WMS3HhI6CyzGqHwCYovZif3kk7hJFeliM4VctMxdKUt5oMdMYuLmHpF4THs4wGaw4j5wf5BWUxkWflAlB-teMaRo2rWqaL-trh6mtKa_T9BqZKtrZOJM8PqJ6VPhF_V9aQ")'}}></div>
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[48px] opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 drop-shadow-lg">play_circle</span>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-1.5 py-0.5 rounded">1:15:00</div>
            <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm">Congreso</div>
          </div>
          <div className="p-4 flex flex-col flex-1">
            <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">Panel: Ética en la Inteligencia Artificial Médica</h3>
            <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="size-6 rounded-full bg-slate-200 border border-white"></div>
                  <div className="size-6 rounded-full bg-slate-300 border border-white"></div>
                </div>
                <span className="text-xs font-medium text-slate-600 ml-1">Varios Ponentes</span>
              </div>
              <span className="text-xs text-slate-400">10 Oct</span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div onClick={() => setView(ViewState.STUDENT_COURSE_DETAIL)} className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group cursor-pointer">
          <div className="relative aspect-video bg-slate-200 overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDqHTJ95PcZbOvoAz4YbST_0ZiQbWgoCgaWmtPR7YoMUyKLFfX0iH-OC3fA5YpqmCJoTAMIdEA0702wYjsRQCEAQti5sDvYiujYGoUYa9EGdxDW0ZZ32li7HD2MAORFoYAYVxZvwAhhZ6kzVEcFybVmAiXbYoIy2j9hpHQT2ScH2S91VtYqArnkp6-sJ1OhMO69G_0qV3srZB-PhDrpP0Ite9PKpfBGObOnr0h_95PlJVNBssOXulWE2G5byXGB6ECvaqRUQzF0nA")'}}></div>
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[48px] opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 drop-shadow-lg">play_circle</span>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-1.5 py-0.5 rounded">34:10</div>
            <div className="absolute top-2 left-2 bg-teal-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm">Investigación</div>
          </div>
          <div className="p-4 flex flex-col flex-1">
            <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">Biomarcadores en Alzheimer Temprano</h3>
            <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-slate-200 bg-cover" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBWau6yCTcrvjZZx_cEwMY7LVvQK8tyixdEbER7h3bDG4kODdG7rp4exZJmh0C1_J2yMQNX0E7LcMjw1BfPym3BF3UMxjr4O-WXfJkYYRba1UWBqHSypGfXB2s2fyih0-XYWqC0mNrausgbFWj-9wRA3eVPPvq4delne_WAMdmZ7odlDUdimB3wVjvkByc5KPuZtRqzq6WFnKiOlSV40gwYm17VW6oCttJar3GaEyzXXQYL8KzFbupgN0KbeVOPtnY63wzceNlg2A")'}}></div>
                <span className="text-xs font-medium text-slate-600">Dr. Martínez</span>
              </div>
              <span className="text-xs text-slate-400">28 Sep</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-6 mt-4">
        <button className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Anterior
        </button>
        <div className="flex items-center gap-1">
          <button className="size-8 rounded-lg bg-primary text-white text-sm font-bold shadow-md shadow-primary/30">1</button>
          <button className="size-8 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium transition-colors">2</button>
          <button className="size-8 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium transition-colors">3</button>
          <span className="text-slate-400">...</span>
          <button className="size-8 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium transition-colors">12</button>
        </div>
        <button className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium text-sm">
          Siguiente
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default CourseCatalog;