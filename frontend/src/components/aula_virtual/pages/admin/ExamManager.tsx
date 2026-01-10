import React, { useState } from 'react';

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

const ExamManager: React.FC = () => {
  const [currentType, setCurrentType] = useState<QuestionType>('multiple_choice');

  // Dummy state for UI demonstration
  const [mcOptions, setMcOptions] = useState([
    { id: 'A', text: 'Hemiparesia contralateral y afasia', isCorrect: true },
    { id: 'B', text: 'Ceguera monocular transitoria', isCorrect: false },
    { id: 'C', text: 'Paraparesia de miembros inferiores', isCorrect: false },
  ]);

  const [tfValue, setTfValue] = useState<boolean | null>(true); // true = Verdadero

  return (
    <div className="flex-1 overflow-y-auto bg-background-light p-4 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-tight">
              Examen Final: Neurología Clínica
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-200 uppercase tracking-wider shadow-sm">
              Borrador
            </span>
          </div>
          <p className="text-text-secondary text-base font-normal leading-normal max-w-2xl">
            Configure los detalles generales, asigne el examen a un curso y administre el banco de preguntas.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-start">
          <button className="flex items-center justify-center gap-2 h-10 px-6 rounded-lg border border-border-light bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
            <span className="material-symbols-outlined text-[20px]">visibility</span>
            <span>Vista Previa</span>
          </button>
          <button className="flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-primary hover:bg-blue-600 text-white text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
            <span className="material-symbols-outlined text-[20px]">save</span>
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Config */}
        <aside className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
          <div className="rounded-xl border border-border-light bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">tune</span>
              Configuración General
            </h3>
            <form className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-text-secondary tracking-wider">Curso Asociado</label>
                <div className="relative">
                  <select className="w-full bg-slate-50 border border-border-light rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none transition-shadow">
                    <option>Neurología Clínica 2024</option>
                    <option>Neuroanatomía Básica</option>
                    <option>Urgencias Neurológicas</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-2.5 text-text-secondary pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-text-secondary tracking-wider">Tiempo (min)</label>
                  <input className="w-full bg-slate-50 border border-border-light rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow" type="number" defaultValue={60}/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-text-secondary tracking-wider">Intentos</label>
                  <input className="w-full bg-slate-50 border border-border-light rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow" type="number" defaultValue={2}/>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-text-secondary tracking-wider">Puntaje de Aprobación (%)</label>
                <div className="relative">
                  <input className="w-full bg-slate-50 border border-border-light rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none pr-8 transition-shadow" type="number" defaultValue={70}/>
                  <span className="absolute right-3 top-2.5 text-text-secondary text-sm">%</span>
                </div>
              </div>
              <div className="h-px bg-border-light my-1"></div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Orden aleatorio</span>
                <button className="w-11 h-6 bg-primary rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" type="button">
                  <span className="translate-x-6 inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out mt-1 ml-1 shadow-sm"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Mostrar resultados</span>
                <button className="w-11 h-6 bg-slate-200 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" type="button">
                  <span className="translate-x-1 inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out mt-1 ml-1 shadow-sm"></span>
                </button>
              </div>
            </form>
          </div>
          <div className="rounded-xl border border-border-light bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Resumen</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900">12</span>
                <span className="text-xs font-semibold text-text-secondary mt-1">Preguntas</span>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-primary">100</span>
                <span className="text-xs font-semibold text-text-secondary mt-1">Puntos Totales</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="lg:col-span-8 flex flex-col gap-6 order-1 lg:order-2">
          
          {/* Search & Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-border-light shadow-sm">
            <div className="relative w-full sm:max-w-md">
              <div className="flex w-full items-stretch rounded-lg h-10 shadow-sm">
                <div className="text-text-secondary flex border border-r-0 border-border-light bg-slate-50 items-center justify-center pl-3 rounded-l-lg">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary border border-border-light bg-slate-50 h-full placeholder:text-slate-400 px-3 text-sm font-normal leading-normal transition-all" placeholder="Buscar preguntas..."/>
              </div>
            </div>
            <button className="flex shrink-0 items-center justify-center gap-2 h-10 px-5 rounded-lg bg-primary hover:bg-blue-600 text-white text-sm font-bold transition-all w-full sm:w-auto shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>Añadir Pregunta</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-slate-800 text-white px-4 text-xs font-bold transition-colors shadow-sm">
              Todas
            </button>
            <button 
              onClick={() => setCurrentType('multiple_choice')}
              className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full border border-border-light px-4 text-xs font-medium transition-colors ${currentType === 'multiple_choice' ? 'bg-primary/10 text-primary border-primary' : 'bg-white text-text-secondary hover:border-primary hover:text-primary hover:bg-primary/5'}`}
            >
              Selección Múltiple
            </button>
            <button 
              onClick={() => setCurrentType('true_false')}
              className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full border border-border-light px-4 text-xs font-medium transition-colors ${currentType === 'true_false' ? 'bg-primary/10 text-primary border-primary' : 'bg-white text-text-secondary hover:border-primary hover:text-primary hover:bg-primary/5'}`}
            >
              Verdadero/Falso
            </button>
            <button 
               onClick={() => setCurrentType('short_answer')}
               className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full border border-border-light px-4 text-xs font-medium transition-colors ${currentType === 'short_answer' ? 'bg-primary/10 text-primary border-primary' : 'bg-white text-text-secondary hover:border-primary hover:text-primary hover:bg-primary/5'}`}
            >
              Respuesta Corta
            </button>
          </div>

          {/* Question Editor */}
          <div className="rounded-xl border-2 border-primary/30 bg-white shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary cursor-move hover:w-2 transition-all"></div>
            <div className="p-6 flex flex-col gap-6">
              
              {/* Header Editor */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border border-primary/10">Pregunta 1</span>
                    <div className="relative group/dropdown">
                      <button className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary font-medium transition-colors bg-slate-50 px-2 py-0.5 rounded border border-transparent hover:border-slate-200">
                        {currentType === 'multiple_choice' && 'Selección Múltiple'}
                        {currentType === 'true_false' && 'Verdadero/Falso'}
                        {currentType === 'short_answer' && 'Respuesta Corta'}
                        <span className="material-symbols-outlined text-[14px]">expand_more</span>
                      </button>
                    </div>
                  </div>
                  <input 
                    className="w-full bg-transparent border-b border-border-light text-lg font-medium text-slate-900 focus:outline-none focus:border-primary pb-2 placeholder:text-slate-400 transition-colors" 
                    placeholder="Escriba el enunciado de la pregunta..." 
                    type="text" 
                    defaultValue={
                      currentType === 'multiple_choice' ? "¿Cuál de los siguientes es el síntoma principal en un ACV isquémico?" :
                      currentType === 'true_false' ? "¿La neuroplasticidad es la capacidad del sistema nervioso para cambiar su estructura?" :
                      "¿Cuál es el tratamiento farmacológico de primera elección para las crisis de ausencia?"
                    }
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-end">
                    <label className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Puntos</label>
                    <input className="w-16 h-9 bg-slate-50 border border-border-light rounded text-center text-sm font-bold text-slate-900 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-shadow" type="number" defaultValue={currentType === 'short_answer' ? 5 : 10}/>
                  </div>
                  <div className="flex gap-1 ml-2 mt-4">
                    <button className="p-2 text-text-secondary hover:text-primary transition-colors rounded hover:bg-slate-100" title="Duplicar">
                      <span className="material-symbols-outlined text-[20px]">content_copy</span>
                    </button>
                    <button className="p-2 text-text-secondary hover:text-red-500 transition-colors rounded hover:bg-slate-100" title="Eliminar">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-4 py-2 border-b border-border-light/50">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors border border-dashed border-border-light hover:border-primary/30 group/btn bg-slate-50/50" title="Añadir Imagen">
                    <span className="material-symbols-outlined text-[18px] group-hover/btn:text-primary">add_photo_alternate</span>
                    Imagen
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors border border-dashed border-border-light hover:border-primary/30 group/btn bg-slate-50/50" title="Añadir Fórmula">
                    <span className="material-symbols-outlined text-[18px] group-hover/btn:text-primary">functions</span>
                    Fórmula
                  </button>
                </div>
                <div className="h-4 w-px bg-border-light"></div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="material-symbols-outlined text-text-secondary text-[18px]">label</span>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                      Neurología Vascular
                      <button className="hover:text-indigo-900"><span className="material-symbols-outlined text-[14px]">close</span></button>
                    </span>
                    <input className="bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none w-32 focus:w-48 transition-all" placeholder="Añadir etiqueta (ej. Epilepsia)..." type="text"/>
                  </div>
                </div>
              </div>

              {/* EDITOR BODY - DYNAMIC */}
              <div className="flex flex-col gap-3 pt-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  {currentType === 'multiple_choice' ? 'Respuestas' : 
                   currentType === 'true_false' ? 'Definir Respuesta Correcta' : 
                   'Respuestas Correctas Esperadas'}
                </label>

                {/* Multiple Choice Layout */}
                {currentType === 'multiple_choice' && (
                  <>
                    {mcOptions.map((opt) => (
                      <div key={opt.id} className="flex items-center gap-3 group/option animate-fade-in">
                        <div className="shrink-0 flex items-center justify-center" title="Marcar como correcta">
                          <input 
                            checked={opt.isCorrect} 
                            onChange={() => setMcOptions(mcOptions.map(o => ({...o, isCorrect: o.id === opt.id})))}
                            className="w-5 h-5 text-primary bg-white border-slate-300 focus:ring-primary focus:ring-2 cursor-pointer" 
                            name="mc_ans" 
                            type="radio"
                          />
                        </div>
                        <div className={`flex-1 flex items-center rounded-lg border px-3 py-2 shadow-sm transition-all ${opt.isCorrect ? 'bg-blue-50/50 border-primary/40' : 'bg-white border-border-light hover:border-slate-300'}`}>
                          <span className={`text-xs font-bold mr-3 w-6 h-6 flex items-center justify-center rounded border ${opt.isCorrect ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-50 text-text-secondary border-slate-200'}`}>
                            {opt.id}
                          </span>
                          <input className="bg-transparent w-full text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium" type="text" defaultValue={opt.text}/>
                        </div>
                        <button className="opacity-0 group-hover/option:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity">
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    ))}
                    <button className="self-start mt-1 flex items-center gap-1 text-xs font-bold text-primary hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100">
                      <span className="material-symbols-outlined text-[16px]">add</span> Añadir Opción
                    </button>
                  </>
                )}

                {/* True/False Layout */}
                {currentType === 'true_false' && (
                  <div className="flex flex-col gap-3">
                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all group select-none ${tfValue === true ? 'border-primary/40 bg-blue-50/30' : 'border-border-light bg-white hover:border-slate-300'}`}>
                      <div className="shrink-0 flex items-center justify-center">
                        <input checked={tfValue === true} onChange={() => setTfValue(true)} className="w-5 h-5 text-primary bg-white border-slate-300 focus:ring-primary focus:ring-2 cursor-pointer" name="tf_correct" type="radio"/>
                      </div>
                      <span className={`text-base font-bold ${tfValue === true ? 'text-slate-900' : 'text-slate-700'}`}>Verdadero</span>
                      {tfValue === true && (
                        <div className="ml-auto flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-wider bg-white/50 border border-primary/10 px-2 py-1 rounded">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Correcta
                        </div>
                      )}
                    </label>
                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all group select-none ${tfValue === false ? 'border-primary/40 bg-blue-50/30' : 'border-border-light bg-white hover:border-slate-300'}`}>
                      <div className="shrink-0 flex items-center justify-center">
                        <input checked={tfValue === false} onChange={() => setTfValue(false)} className="w-5 h-5 text-primary bg-white border-slate-300 focus:ring-primary focus:ring-2 cursor-pointer" name="tf_correct" type="radio"/>
                      </div>
                      <span className={`text-base font-bold ${tfValue === false ? 'text-slate-900' : 'text-slate-700'}`}>Falso</span>
                      {tfValue === false && (
                         <div className="ml-auto flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-wider bg-white/50 border border-primary/10 px-2 py-1 rounded">
                           <span className="material-symbols-outlined text-[14px]">check_circle</span>
                           Correcta
                         </div>
                       )}
                    </label>
                  </div>
                )}

                {/* Short Answer Layout */}
                {currentType === 'short_answer' && (
                   <>
                     <p className="text-xs text-text-secondary mb-1">Añada todas las variantes de respuesta que el sistema debe considerar correctas.</p>
                     
                     {['Etosuximida', 'Zarontin'].map((val, idx) => (
                       <div key={idx} className="flex items-center gap-3 group/option animate-fade-in">
                         <div className="flex-1 flex items-center bg-white rounded-lg border border-primary/50 ring-1 ring-primary/10 px-3 py-2 shadow-sm">
                           <span className="material-symbols-outlined text-emerald-500 mr-2 text-[20px]">check</span>
                           <input className="bg-transparent w-full text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium" type="text" defaultValue={val}/>
                         </div>
                         <button className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-white border border-transparent hover:border-border-light rounded-lg shadow-sm">
                           <span className="material-symbols-outlined text-[18px]">delete</span>
                         </button>
                       </div>
                     ))}
                     
                     <div className="flex items-center gap-3 group/option opacity-60 hover:opacity-100 transition-opacity">
                        <div className="flex-1 flex items-center bg-slate-100/50 border-dashed border-2 border-slate-300 rounded-lg px-3 py-2">
                           <span className="material-symbols-outlined text-slate-300 mr-2 text-[20px]">add</span>
                           <input className="bg-transparent w-full text-sm text-slate-600 outline-none placeholder:text-slate-500" placeholder="Escriba otra respuesta alternativa..." type="text"/>
                        </div>
                     </div>
                     
                     <div className="mt-2 flex items-center gap-2">
                       <label className="inline-flex items-center cursor-pointer">
                         <input type="checkbox" className="sr-only peer"/>
                         <div className="relative w-7 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                         <span className="ms-2 text-xs font-medium text-text-secondary">Distinguir mayúsculas</span>
                       </label>
                     </div>
                   </>
                )}

              </div>
            </div>
            
            {/* Editor Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-border-light flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-text-secondary text-[18px]">drag_indicator</span>
                <span className="text-xs text-text-secondary font-medium">Arrastrar para reordenar</span>
              </div>
              <button className="text-xs font-bold text-primary hover:underline hover:text-blue-700">Ocultar detalles</button>
            </div>
          </div>

          {/* Questions List */}
          <div className="rounded-xl border border-border-light bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-border-light">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider w-16">#</th>
                  <th className="px-6 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Pregunta</th>
                  <th className="px-6 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider w-32">Tipo</th>
                  <th className="px-6 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider w-24 text-center">Puntos</th>
                  <th className="px-6 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider w-24 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                <tr className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setCurrentType('true_false')}>
                  <td className="px-6 py-4 text-sm text-text-secondary font-medium">
                    <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 cursor-grab text-slate-400 hover:text-slate-600">drag_indicator</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-800 line-clamp-1">La barrera hematoencefálica es permeable a proteínas grandes.</p>
                    <div className="flex gap-2 mt-1">
                      <span className="inline-flex items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">Neurofisiología</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">Verdadero/Falso</span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-slate-800">5</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-primary transition-colors p-1 rounded-md hover:bg-blue-50">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setCurrentType('short_answer')}>
                  <td className="px-6 py-4 text-sm text-text-secondary font-medium">
                    <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 cursor-grab text-slate-400 hover:text-slate-600">drag_indicator</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-800 line-clamp-1">Describa brevemente la función del lóbulo temporal en la memoria.</p>
                    <div className="flex gap-2 mt-1">
                      <span className="inline-flex items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">Neuropsicología</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">Resp. Corta</span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-slate-800">15</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-primary transition-colors p-1 rounded-md hover:bg-blue-50">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="bg-slate-50 p-4 text-center border-t border-border-light">
              <button className="text-sm font-bold text-primary hover:text-blue-700 flex items-center justify-center gap-1 mx-auto transition-colors">
                Ver todas las preguntas <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="border-2 border-dashed border-border-light rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-blue-50/30 transition-all cursor-pointer group bg-white">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-text-secondary group-hover:text-primary group-hover:bg-white group-hover:shadow-md transition-all mb-3">
              <span className="material-symbols-outlined text-[24px]">add</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">Añadir Nueva Pregunta</h4>
            <p className="text-xs text-text-secondary mt-1 group-hover:text-slate-600">Haga clic para crear una nueva pregunta al final de la lista</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExamManager;