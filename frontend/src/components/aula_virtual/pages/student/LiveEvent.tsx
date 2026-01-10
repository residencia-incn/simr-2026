import React, { useState } from 'react';

const LiveEvent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'questions' | 'polls' | 'notes'>('chat');

  return (
    <div className="flex-1 flex flex-col h-full bg-background-light overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative flex-col lg:flex-row">
        
        {/* Main Stream Area */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          <div className="w-full max-w-[1400px] mx-auto p-4 lg:p-6 flex flex-col gap-6">
            
            {/* Video Container */}
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group ring-1 ring-slate-900/5">
              <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBkupkBHs8bAWJ-C-NM3bjKx2uwA79LKGAwDEJay8ZDd2ewmEEoQqnsnNtJYB8VYh-EofaEotln2zzd6x9VmXxi4WdDeq91xCPl5qVVDMXy6-ZwxQv_wRyYFAjpfCrHhjawMJCcmfQoE9RPXo9sMxYbD7ct9g0kuLYj9tHPJf8cs0jJyB_eaJIUcLOQzkOPN0WvPa4JHeIIeceVGBMCYx1Z-mNofSv2UGds8bxvWm10A2WR0urTd-6KstCpdMihjA-D_vZ8aHlFOA")'}}></div>
              
              <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
                <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md animate-pulse">
                  <span className="material-symbols-outlined text-[14px]">sensors</span> LIVE
                </div>
                <div className="bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">visibility</span> 1,245 Viendo
                </div>
              </div>

              {/* Controls (Hidden unless hovered) */}
              <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined cursor-pointer">pause</span>
                    <span className="material-symbols-outlined cursor-pointer">volume_up</span>
                    <span className="text-xs font-bold text-red-500">• EN VIVO</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded cursor-pointer">HD 1080p</span>
                    <span className="material-symbols-outlined cursor-pointer">fullscreen</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-gray-200 pb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Avances en Neuroplasticidad: Nuevas Fronteras</h1>
                <p className="text-gray-600 text-sm md:text-base max-w-3xl leading-relaxed">
                  Explorando los últimos descubrimientos en mecanismos de plasticidad sináptica y su aplicación en la rehabilitación clínica post-traumática.
                </p>
              </div>
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm shrink-0">
                <div className="size-12 rounded-full bg-gray-200 bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCLEdlESndES_7M9oPcpni1FdlRo5LlHh5TGtEAQq5oK36k_9wLyiFDcraC3vLVzv5J6FSWkv5eQr3bqc74i7rVh8I1e8FxnFtehd7dW39P2tprA_VqCFDhh_oTxTrBrvWkzfeerJzz18Nmj0-i8D5YD6iIkP_i5eyNZ5EuQIRh3x3gSJUs2uv8d8nPaihXMEstwzKB8wo9_py0_Rz8J5tQRyqN3t-V_2VhYDMprG2wJaaPixQztdFvu5TgES7AFCNy5bQn0Xb5FA")'}}></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Dr. Elena Rojas</p>
                  <p className="text-xs text-primary font-medium">Neurocientífica Principal</p>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* Sidebar (Chat / Notes / Q&A) */}
        <aside className="w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col z-10 h-[50vh] lg:h-full transition-all">
          <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setActiveTab('chat')} 
              className={`flex-1 py-3 text-sm font-bold min-w-[80px] transition-colors border-b-2 ${activeTab === 'chat' ? 'text-primary border-primary bg-primary/5' : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'}`}
            >
              Chat
            </button>
            <button 
              onClick={() => setActiveTab('notes')} 
              className={`flex-1 py-3 text-sm font-bold min-w-[80px] transition-colors border-b-2 flex items-center justify-center gap-1 ${activeTab === 'notes' ? 'text-primary border-primary bg-primary/5' : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              Apuntes
            </button>
            <button 
              onClick={() => setActiveTab('questions')} 
              className={`flex-1 py-3 text-sm font-bold min-w-[80px] transition-colors border-b-2 ${activeTab === 'questions' ? 'text-primary border-primary bg-primary/5' : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'}`}
            >
              Preguntas
            </button>
            <button 
              onClick={() => setActiveTab('polls')} 
              className={`flex-1 py-3 text-sm font-bold min-w-[80px] transition-colors border-b-2 ${activeTab === 'polls' ? 'text-primary border-primary bg-primary/5' : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'}`}
            >
              Encuestas
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            
            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                  <div className="flex gap-3">
                    <div className="size-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">JL</div>
                    <div>
                      <div className="flex items-baseline gap-2"><span className="text-xs font-bold text-slate-800">Juan Lopez</span> <span className="text-[10px] text-gray-400">09:35 AM</span></div>
                      <p className="text-sm text-slate-600 bg-gray-50 p-2 rounded-r-lg rounded-bl-lg">¡Buenos días desde Madrid! Muy interesante.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 text-xs"><span className="material-symbols-outlined text-[16px]">verified_user</span></div>
                    <div>
                      <div className="flex items-baseline gap-2"><span className="text-xs font-bold text-primary">Soporte</span> <span className="text-[10px] text-gray-400">09:37 AM</span></div>
                      <p className="text-sm text-blue-900 bg-blue-50 p-2 rounded-r-lg rounded-bl-lg">Todo el material estará disponible al finalizar.</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                  <div className="relative">
                    <input className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-3 pr-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Escribe un mensaje..."/>
                    <button className="absolute right-2 top-2 text-primary hover:text-blue-700"><span className="material-symbols-outlined text-[20px]">send</span></button>
                  </div>
                </div>
              </>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="flex flex-col h-full">
                {/* Notes Toolbar */}
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1 shrink-0">
                  <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Negrita">
                    <span className="material-symbols-outlined text-lg">format_bold</span>
                  </button>
                  <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Itálica">
                    <span className="material-symbols-outlined text-lg">format_italic</span>
                  </button>
                  <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Lista">
                    <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
                  </button>
                  <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>
                  <button className="p-1.5 bg-primary/10 text-primary rounded flex items-center gap-1 text-xs font-semibold px-2 hover:bg-primary/20 transition-colors" title="Insertar timestamp">
                    <span className="material-symbols-outlined text-base">timer</span>
                    09:42
                  </button>
                </div>

                {/* Notes Editor */}
                <div className="flex-1 p-4 overflow-y-auto bg-white">
                  <div className="min-h-full outline-none text-slate-800 text-sm space-y-4" contentEditable={true} suppressContentEditableWarning={true}>
                    <p className="text-slate-400 italic pointer-events-none">Toma apuntes del evento en vivo aquí...</p>
                    <div className="flex gap-3 group">
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono text-[11px] h-fit mt-0.5 select-none">09:15</span>
                      <p>El ponente menciona la importancia de la <strong>detección temprana</strong>.</p>
                    </div>
                  </div>
                </div>

                {/* Notes Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3 shrink-0">
                  <button className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors">
                    <span className="material-symbols-outlined text-base">save</span>
                    Guardar
                  </button>
                  <button className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary text-white hover:bg-primary/90 text-xs font-bold shadow-sm transition-colors">
                    <span className="material-symbols-outlined text-base">download</span>
                    Exportar
                  </button>
                </div>
              </div>
            )}

            {/* Other Tabs Placeholders */}
            {(activeTab === 'questions' || activeTab === 'polls') && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl opacity-50">
                    {activeTab === 'questions' ? 'help_center' : 'poll'}
                  </span>
                </div>
                <p className="text-sm font-medium">No hay {activeTab === 'questions' ? 'preguntas' : 'encuestas'} activas en este momento.</p>
              </div>
            )}

          </div>
        </aside>
      </div>
    </div>
  );
};

export default LiveEvent;