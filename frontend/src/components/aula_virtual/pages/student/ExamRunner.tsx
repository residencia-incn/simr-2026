import React, { useState } from 'react';

type QuestionType = 'multiple_choice' | 'short_answer' | 'true_false';

interface Question {
  id: number;
  topic: string;
  text: string;
  type: QuestionType;
  points: number;
  options?: string[]; // For MC
}

const questions: Question[] = [
  {
    id: 1,
    topic: 'Farmacología del SNC',
    text: '¿Cuál de los siguientes mecanismos de transporte es el principal responsable de permitir el paso de la levodopa (L-DOPA) a través de la barrera hematoencefálica?',
    type: 'multiple_choice',
    points: 5,
    options: [
      'Difusión pasiva simple a través de la membrana lipídica',
      'Transporte activo mediado por el sistema de aminoácidos grandes neutros (LAT1)',
      'Transcitosis mediada por receptores de insulina',
      'Transporte facilitado por el transportador de glucosa GLUT-1',
      'Endocitosis de fase fluida (Pinocitosis)'
    ]
  },
  {
    id: 2,
    topic: 'Farmacología del SNC',
    text: 'Explique brevemente el papel de la barrera hematoencefálica en la farmacoterapia de enfermedades neurodegenerativas y mencione dos estrategias para superar esta limitación.',
    type: 'short_answer',
    points: 5
  },
  {
    id: 3,
    topic: 'Neurofisiología Básica',
    text: 'La neurogénesis en el cerebro humano adulto ocurre principalmente en el giro dentado del hipocampo y en la zona subventricular de los ventrículos laterales.',
    type: 'true_false',
    points: 2
  }
];

const ExamRunner: React.FC = () => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const totalQ = 10; // Mock total
  
  const currentQuestion = questions[currentQIndex % questions.length]; // Cycle through mock questions

  const handleNext = () => {
    setCurrentQIndex(prev => Math.min(prev + 1, totalQ - 1));
  };

  const handlePrev = () => {
    setCurrentQIndex(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="flex-1 bg-background-light flex flex-col h-full overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] mx-auto w-full p-4 lg:p-8 gap-6 h-full">
        
        <main className="flex-1 flex flex-col gap-6 overflow-y-auto min-w-0">
          {/* Header Info */}
          <div className="flex flex-col gap-2">
             <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
              <span className="bg-blue-100 text-primary px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border border-blue-200">Examen Final</span>
              <span>|</span>
              <span>Módulo 4: Trastornos del Movimiento</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">Neurología Clínica Avanzada</h1>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 shadow-sm">
            <span className="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
            <div>
                <p className="text-sm text-blue-900 font-bold">Lea atentamente.</p>
                <p className="text-sm text-blue-800/80">Sus respuestas se guardan automáticamente a medida que avanza. No actualice la página durante el examen.</p>
            </div>
          </div>

          {/* Question Container */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col gap-8 animate-in fade-in duration-300 key={currentQuestion.id}">
            
            {/* Question Header */}
            <div className="flex items-end justify-between border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-bold text-primary mb-1 block uppercase tracking-wider flex items-center gap-2">
                    Pregunta {currentQIndex + 1} de {totalQ}
                </span>
                <h3 className="text-2xl font-bold text-slate-900">{currentQuestion.topic}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${currentQuestion.type === 'true_false' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : currentQuestion.type === 'short_answer' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                    {currentQuestion.type === 'multiple_choice' && 'Selección Múltiple'}
                    {currentQuestion.type === 'short_answer' && 'Respuesta Corta'}
                    {currentQuestion.type === 'true_false' && 'Verdadero / Falso'}
                </span>
                <span className="bg-orange-50 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-100">{currentQuestion.points} Puntos</span>
              </div>
            </div>

            {/* Question Text */}
            <div className="prose prose-lg max-w-none">
                <p className="text-lg md:text-xl text-slate-900 font-medium leading-relaxed">
                    {currentQuestion.text}
                </p>
            </div>

            {/* Answer Area - Dynamic based on type */}
            <div className="flex flex-col gap-4">
                
                {/* MULTIPLE CHOICE */}
                {currentQuestion.type === 'multiple_choice' && (
                    <>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">checklist</span>
                        Seleccione una opción:
                    </p>
                    <div className="grid gap-3">
                        {currentQuestion.options?.map((opt, i) => {
                            const letter = String.fromCharCode(65 + i);
                            return (
                                <label key={i} className="group relative cursor-pointer">
                                <input type="radio" name={`q_${currentQuestion.id}`} className="peer sr-only" />
                                <div className="flex items-center gap-4 p-4 md:p-5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 peer-checked:border-primary peer-checked:bg-blue-50 peer-checked:shadow-sm">
                                    <div className="flex-none w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-blue-400 peer-checked:border-primary peer-checked:bg-primary relative flex items-center justify-center transition-colors">
                                        <div className="w-2.5 h-2.5 bg-white rounded-full opacity-0 transform scale-50 transition-all duration-200 peer-checked:opacity-100 peer-checked:scale-100"></div>
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-base text-slate-700 font-medium group-hover:text-slate-900 peer-checked:text-primary transition-colors">
                                            {opt}
                                        </span>
                                    </div>
                                    <div className="text-slate-300 font-display font-bold text-lg opacity-40 group-hover:opacity-60 peer-checked:text-primary peer-checked:opacity-100 w-6 text-center">{letter}</div>
                                </div>
                                </label>
                            )
                        })}
                    </div>
                    </>
                )}

                {/* SHORT ANSWER */}
                {currentQuestion.type === 'short_answer' && (
                    <>
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">edit_note</span>
                            Su respuesta
                        </label>
                    </div>
                    <div className="relative h-full group">
                        <textarea 
                            className="w-full min-h-[280px] bg-slate-50 border border-slate-300 rounded-lg p-5 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none resize-y text-base leading-relaxed shadow-inner transition-all placeholder:text-slate-400" 
                            placeholder="Escriba su respuesta aquí. Sea conciso y utilice terminología técnica adecuada..."
                        ></textarea>
                        <div className="absolute bottom-3 right-3 text-xs font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">0 / 500 palabras</div>
                    </div>
                    </>
                )}

                {/* TRUE / FALSE */}
                {currentQuestion.type === 'true_false' && (
                    <>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Seleccione una opción
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <label className="relative cursor-pointer group">
                            <input className="peer sr-only" name={`q_${currentQuestion.id}`} type="radio" value="true"/>
                            <div className="h-full p-6 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 peer-checked:border-primary peer-checked:bg-blue-50/50 peer-checked:shadow-[0_0_0_1px_rgba(43,108,238,1)] transition-all duration-200 flex items-center gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center peer-checked:border-primary peer-checked:bg-primary text-white transition-all">
                                    <span className="material-symbols-outlined text-[20px] scale-0 peer-checked:scale-100 transition-transform duration-200">check</span>
                                </div>
                                <div>
                                    <span className="block text-lg font-bold text-slate-800 peer-checked:text-primary mb-0.5">Verdadero</span>
                                    <span className="block text-sm text-slate-500 font-medium peer-checked:text-primary/80">La afirmación es correcta</span>
                                </div>
                            </div>
                        </label>
                        <label className="relative cursor-pointer group">
                            <input className="peer sr-only" name={`q_${currentQuestion.id}`} type="radio" value="false"/>
                            <div className="h-full p-6 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 peer-checked:border-primary peer-checked:bg-blue-50/50 peer-checked:shadow-[0_0_0_1px_rgba(43,108,238,1)] transition-all duration-200 flex items-center gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center peer-checked:border-primary peer-checked:bg-primary text-white transition-all">
                                    <span className="material-symbols-outlined text-[20px] scale-0 peer-checked:scale-100 transition-transform duration-200">close</span>
                                </div>
                                <div>
                                    <span className="block text-lg font-bold text-slate-800 peer-checked:text-primary mb-0.5">Falso</span>
                                    <span className="block text-sm text-slate-500 font-medium peer-checked:text-primary/80">La afirmación es incorrecta</span>
                                </div>
                            </div>
                        </label>
                    </div>
                    </>
                )}

            </div>
          </div>

          <div className="flex justify-between mt-auto pt-4 pb-4">
            <button 
                onClick={handlePrev}
                disabled={currentQIndex === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="material-symbols-outlined">arrow_back</span>
                Anterior
            </button>
            <button 
                onClick={handleNext}
                disabled={currentQIndex === totalQ - 1}
                className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary hover:bg-blue-700 text-white font-bold shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
                Siguiente
                <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </main>

        <aside className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-6 lg:p-6 lg:border-l border-slate-200 bg-white/50 lg:bg-white backdrop-blur-sm">
          {/* Timer */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col items-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100"><div className="h-full bg-primary w-2/3"></div></div>
            <div className="flex items-center gap-2 text-slate-600 mb-1 mt-2">
                <span className="material-symbols-outlined text-lg">timer</span>
                <span className="text-xs font-bold uppercase tracking-widest">Tiempo Restante</span>
            </div>
            <div className="flex items-center gap-2 text-4xl font-black text-slate-900 tabular-nums tracking-tight">
              <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg min-w-[2ch] text-center shadow-inner">00</div>
              <span className="text-slate-300 text-2xl mb-1">:</span>
              <div className="bg-blue-50 border border-blue-100 text-primary px-3 py-2 rounded-lg min-w-[2ch] text-center shadow-inner">45</div>
              <span className="text-slate-300 text-2xl mb-1">:</span>
              <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg min-w-[2ch] text-center shadow-inner">23</div>
            </div>
          </div>

          {/* Progress Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <p className="text-slate-900 text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">grid_view</span>
                Progreso
              </p>
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded">{currentQIndex + 1} / {totalQ}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${((currentQIndex + 1) / totalQ) * 100}%` }}></div>
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {[...Array(totalQ)].map((_, i) => {
                const num = i + 1;
                let statusClass = "bg-slate-50 border-slate-100 text-slate-400 font-medium hover:bg-slate-100 hover:text-slate-600"; // Pending
                if (num < currentQIndex + 1) statusClass = "bg-blue-50 border-blue-100 text-primary font-bold hover:bg-primary hover:text-white hover:border-primary"; // Completed
                if (num === currentQIndex + 1) statusClass = "bg-primary text-white border-primary font-bold shadow-md ring-2 ring-primary/20 ring-offset-2"; // Current
                
                return (
                  <button 
                    key={num} 
                    onClick={() => setCurrentQIndex(i)}
                    className={`aspect-square flex items-center justify-center rounded-lg border text-sm transition-all ${statusClass}`}
                  >
                    {num}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100 font-medium">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-primary shadow-sm"></div><span>Actual</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-50 border border-blue-200"></div><span>Completada</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-200"></div><span>Pendiente</span></div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 mt-2">
            <button className="w-full py-2 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors hover:bg-slate-50 rounded-lg">
                <span className="material-symbols-outlined text-lg">flag</span>
                Reportar un problema
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default ExamRunner;