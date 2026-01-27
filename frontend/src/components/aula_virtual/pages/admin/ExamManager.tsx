import React, { useState, useEffect } from 'react';
import { useAulaVirtual } from '../../context/AulaVirtualContext';
import { Exam, Question } from '../../types';
import Swal from 'sweetalert2';

// Helper to generate a unique question ID
const generateQuestionId = () => `Q-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

// ========== SUB-COMPONENT: EXAM LIST (DASHBOARD) ==========
const ExamList = ({ onViewEditor, onViewQuestionBank }: { onViewEditor: (exam?: Exam) => void, onViewQuestionBank: () => void }) => {
  const { exams, deleteExam, courses } = useAulaVirtual();
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLICADO' | 'BORRADOR'>('ALL');

  // Helper to get course name
  const getCourseName = (courseId?: number) => {
    if (!courseId) return '';
    return courses.find(c => c.id === courseId)?.title || '';
  };

  // Stats
  const totalExams = exams.length;
  const publishedExams = exams.filter(e => e.status === 'PUBLICADO').length;
  const draftExams = exams.filter(e => e.status === 'BORRADOR').length;
  const totalAttempts = exams.reduce((acc, curr) => acc + (curr.totalAttempts || 0), 0);

  // Filter Logic
  const filteredExams = exams.filter(exam => {
    const dynamicCourseName = getCourseName(exam.courseId);
    const matchesText = exam.title.toLowerCase().includes(filter.toLowerCase()) ||
      dynamicCourseName.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || exam.status === statusFilter;
    return matchesText && matchesStatus;
  });

  const handleDelete = async (id: number | string) => {
    const result = await Swal.fire({
      title: '¿Eliminar examen?',
      text: "No podrás revertir esto.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      deleteExam(id);
      Swal.fire('Eliminado', 'El examen ha sido eliminado.', 'success');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background-light p-4 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestión Global de Exámenes</h1>
          <p className="text-text-secondary mt-1">Administre las evaluaciones de todos los congresos y cursos asincrónicos.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onViewQuestionBank()}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-6 rounded-lg transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">dataset</span>
            Banco de Preguntas
          </button>
          <button
            onClick={() => onViewEditor()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Nuevo Examen
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Exámenes', value: totalExams, icon: 'description', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Publicados', value: publishedExams, icon: 'check_circle', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'En Borrador', value: draftExams, icon: 'edit_note', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Total Intentos', value: totalAttempts > 1000 ? `${(totalAttempts / 1000).toFixed(1)}k` : totalAttempts, icon: 'assignment_ind', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-border-light shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <span className={`material-symbols-outlined ${stat.color} text-[24px]`}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-light flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Buscar por título, curso o ID..."
              className="w-full pl-10 pr-4 py-2 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              className="px-3 py-2 border border-border-light rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Todos los Estados</option>
              <option value="PUBLICADO">Publicados</option>
              <option value="BORRADOR">Borradores</option>
            </select>
            <button className="p-2 border border-border-light rounded-lg bg-white hover:bg-slate-50 text-slate-600">
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-xs font-bold text-text-secondary uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Título del Examen</th>
                <th className="px-6 py-4">Curso Asociado</th>
                <th className="px-6 py-4 text-center">Preguntas</th>
                <th className="px-6 py-4">Fecha de Creación</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light text-sm">
              {filteredExams.map(exam => (
                <tr key={exam.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{exam.title}</div>
                    <div className="text-xs text-text-muted font-mono mt-0.5">ID: {exam.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500'][Math.floor(Math.random() * 4)]}`}></div>
                      <span className="text-slate-700 font-medium line-clamp-1">{getCourseName(exam.courseId) || 'Sin Curso Asignado'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-xs">{exam.questions.length}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {exam.createdAt}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${exam.status === 'PUBLICADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      exam.status === 'BORRADOR' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                      {exam.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600" title="Ver Estadísticas">
                        <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                      </button>
                      <button onClick={() => onViewEditor(exam)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600" title="Editar">
                        <span className="material-symbols-outlined text-[18px]">edit_document</span>
                      </button>
                      <button onClick={() => handleDelete(exam.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-500 hover:text-red-600" title="Eliminar">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExams.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    <span className="material-symbols-outlined text-[48px] opacity-20 mb-2">search_off</span>
                    <p>No se encontraron exámenes que coincidan con los filtros.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-6 py-3 border-t border-border-light flex justify-between items-center text-xs text-text-secondary">
          <span>Mostrando 1-{filteredExams.length} de {totalExams} exámenes</span>
          <div className="flex gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-border-light bg-white hover:bg-slate-50 disabled:opacity-50" disabled><span className="material-symbols-outlined text-[16px]">chevron_left</span></button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-blue-600 text-white font-bold">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-border-light bg-white hover:bg-slate-50 disabled:opacity-50" disabled><span className="material-symbols-outlined text-[16px]">chevron_right</span></button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
        <span className="material-symbols-outlined text-blue-600">info</span>
        <div>
          <p className="font-bold mb-0.5">Nota de administración</p>
          <p>Los cambios realizados en los exámenes publicados afectarán a los usuarios que estén realizando la prueba en tiempo real. Se recomienda realizar las ediciones mayores en modo <strong>Borrador</strong> y sincronizar posteriormente.</p>
        </div>
      </div>
    </div >
  );
};

// ========== SUB-COMPONENT: REUSABLE QUESTION EDITOR FORM ==========
const QuestionEditorForm = ({
  initialQuestion,
  onSave,
  onCancel,
  isIndependent = false
}: {
  initialQuestion?: Question,
  onSave: (q: Question) => void,
  onCancel: () => void,
  isIndependent?: boolean
}) => {
  const { questionTags, updateQuestionTags } = useAulaVirtual();
  const [qText, setQText] = useState(initialQuestion?.text || '');
  const [qType, setQType] = useState<'multiple_choice' | 'true_false' | 'short_answer'>(initialQuestion?.type || 'multiple_choice');
  const [qPoints, setQPoints] = useState(initialQuestion?.points || 10);
  const [qOptions, setQOptions] = useState<{ id: string; text: string; isCorrect: boolean }[]>(initialQuestion?.options || [
    { id: '1', text: '', isCorrect: false },
    { id: '2', text: '', isCorrect: false }
  ]);
  const [qCorrectAnswer, setQCorrectAnswer] = useState<boolean | string | string[]>(initialQuestion?.correctAnswer !== undefined ? initialQuestion?.correctAnswer : '');
  const [qTags, setQTags] = useState<string[]>(initialQuestion?.tags || []);
  const [qImage, setQImage] = useState<string | undefined>(initialQuestion?.image);
  const [newTag, setNewTag] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const tagContainerRef = React.useRef<HTMLDivElement>(null);
  const [showJustification, setShowJustification] = useState(!!initialQuestion?.justification);
  const [qJustification, setQJustification] = useState(initialQuestion?.justification || '');

  // Update form when initialQuestion changes
  useEffect(() => {
    if (initialQuestion) {
      setQText(initialQuestion.text);
      setQType(initialQuestion.type);
      setQPoints(initialQuestion.points);
      setQOptions(initialQuestion.options || []);
      setQCorrectAnswer(initialQuestion.correctAnswer !== undefined ? initialQuestion.correctAnswer : '');
      setQTags(initialQuestion.tags || []);
      setQImage(initialQuestion.image);
      setQJustification(initialQuestion.justification || '');
      setShowJustification(!!initialQuestion.justification);
    } else {
      // Reset if no initial question (adding new)
      setQText('');
      setQType('multiple_choice');
      setQPoints(10);
      setQOptions([{ id: '1', text: '', isCorrect: false }, { id: '2', text: '', isCorrect: false }]);
      setQCorrectAnswer('');
      setQTags([]);
      setQImage(undefined);
      setQJustification('');
      setShowJustification(false);
    }
  }, [initialQuestion]);

  // Click outside tags handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagContainerRef.current && !tagContainerRef.current.contains(event.target as Node)) {
        setShowTagSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESC Key listener
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onCancel]);

  const handleSaveInternal = () => {
    if (!qText.trim()) {
      Swal.fire('Error', 'La pregunta debe tener un enunciado', 'error');
      return;
    }
    const questionToSave: Question = {
      id: initialQuestion?.id || generateQuestionId(),
      text: qText,
      type: qType,
      points: qPoints,
      options: qType === 'multiple_choice' ? qOptions : undefined,
      correctAnswer: qType !== 'multiple_choice' ? qCorrectAnswer : undefined,
      tags: qTags.length > 0 ? qTags : undefined,
      image: qImage,
      justification: showJustification ? qJustification : undefined
    };
    onSave(questionToSave);

    // Reset form if we are adding a new question (not editing)
    if (!initialQuestion) {
      setQText('');
      setQType('multiple_choice');
      setQPoints(10);
      setQOptions([{ id: Date.now().toString(), text: '', isCorrect: false }, { id: (Date.now() + 1).toString(), text: '', isCorrect: false }]);
      setQCorrectAnswer('');
      setQTags([]);
      setQImage(undefined);
      setQJustification('');
      setShowJustification(false);

      // Reset file input if exists
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSmartPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    const trueFalseRegex = /(?:(?:✔|✅|❌|X|Correcto:|Respuesta:|Rpta:|Ans:)\s*(Verdadero|Falso|V|F))|(?:\.\s*(Verdadero|Falso)\.?\s*$)/i;
    const multipleChoiceRegex = /(?:✔|✅|❌|X|Correcto:|Respuesta:|Rpta:|Ans:)\s*([A-E])/i;

    if (trueFalseRegex.test(text)) {
      e.preventDefault();
      const match = text.match(trueFalseRegex);
      const answerText = match ? (match[1] || match[2]).toLowerCase() : '';
      const isTrue = answerText.includes('verdadero') || answerText === 'v';
      let questionText = text.replace(trueFalseRegex, '').trim();
      questionText = questionText.replace(/^\d+[\.\)]\s*/, '');
      setQText(questionText);
      setQType('true_false');
      setQCorrectAnswer(isTrue);
      Swal.fire({ icon: 'info', title: 'Formato Detectado', text: `Pregunta V/F detectada. Respuesta: ${isTrue ? 'Verdadero' : 'Falso'}`, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } else if (multipleChoiceRegex.test(text)) {
      e.preventDefault();
      const lines = text.split('\n').filter(l => l.trim());
      let questionText = '';
      const newOptions: any[] = [];
      let correctAnswerLabel = '';
      const answerMatch = text.match(multipleChoiceRegex);
      if (answerMatch) correctAnswerLabel = answerMatch[1].toUpperCase();
      lines.forEach(line => {
        const optionMatch = line.match(/^([A-E])[\.\)]\s*(.*)/);
        if (optionMatch) {
          newOptions.push({ id: Date.now().toString() + Math.random(), text: optionMatch[2].trim(), isCorrect: optionMatch[1].toUpperCase() === correctAnswerLabel });
        } else if (!line.match(/(?:✔|✅|Correcto:|Respuesta:)/i)) {
          questionText += line + '\n';
        }
      });
      setQText(questionText.replace(/^\d+[\.\)]\s*/, '').trim());
      setQType('multiple_choice');
      if (newOptions.length > 0) setQOptions(newOptions);
      Swal.fire({ icon: 'info', title: 'Formato Detectado', text: `Pregunta Múltiple con ${newOptions.length} opciones.`, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    }
  };

  const handleAddTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || newTag).trim();
    if (tag && !qTags.includes(tag)) {
      setQTags([...qTags, tag]);
      if (!questionTags.includes(tag)) {
        updateQuestionTags([...questionTags, tag]);
      }
      setNewTag('');
      setShowTagSuggestions(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertFormula = () => {
    setIsFormulaModalOpen(true);
  };

  const handleFormulaInsert = (formulaText: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = qText;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setQText(before + formulaText + after);

    // Reset focus and cursor position after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + formulaText.length;
      }
    }, 0);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-border-light shadow-lg shadow-slate-200/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {initialQuestion ? `Editar Pregunta #${initialQuestion.id}` : 'Agregar Nueva Pregunta'}
          </h3>
          <p className="text-text-secondary text-sm">Pegue una pregunta formateada para autocompletar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
        <div className="md:col-span-8">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-text-secondary uppercase">Enunciado de la Pregunta</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all border border-slate-200 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">image</span>
                Imagen
              </button>
              <button
                onClick={insertFormula}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all border border-slate-200 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">functions</span>
                Fórmula
              </button>
            </div>
          </div>

          <div className={`grid gap-4 ${qImage ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {qImage && (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
                <img src={qImage} alt="Preview" className="max-w-full max-h-full object-contain" />
                <button
                  onClick={() => setQImage(undefined)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg shadow-red-500/20"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={qText}
              onChange={e => setQText(e.target.value)}
              onPaste={handleSmartPaste}
              rows={qImage ? 5 : 3}
              className="w-full bg-slate-50 border border-border-light rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all resize-none font-medium text-slate-800"
              placeholder="Escriba el enunciado de la pregunta aquí..."
            ></textarea>
          </div>
        </div>
        <div className="md:col-span-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Tipo</label>
            <select
              value={qType}
              onChange={(e) => setQType(e.target.value as any)}
              className="w-full bg-slate-50 border border-border-light rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              <option value="multiple_choice">Opción Múltiple</option>
              <option value="true_false">Verdadero / Falso</option>
              <option value="short_answer">Respuesta Corta</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Puntos</label>
            <input type="number" value={qPoints} onChange={e => setQPoints(Number(e.target.value))} className="w-full bg-slate-50 border border-border-light rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700" />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Etiquetas</label>

        {/* System Suggested Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 self-center mr-1">
            <span className="material-symbols-outlined text-[14px]">stars</span>
            Sugerencias:
          </span>
          {questionTags.slice(0, 5).map(tag => (
            <button
              key={tag}
              onClick={() => handleAddTag(tag)}
              disabled={qTags.includes(tag)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${qTags.includes(tag) ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50 active:scale-95'}`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {qTags.map(tag => (
            <span key={tag} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm animate-fade-in">
              {tag}
              <button onClick={() => setQTags(qTags.filter(t => t !== tag))} className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all text-indigo-800">
                <span className="material-symbols-outlined text-[10px]">close</span>
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 relative">
          <div className="relative flex-1" ref={tagContainerRef}>
            <input
              type="text"
              value={newTag}
              onChange={e => {
                setNewTag(e.target.value);
                setShowTagSuggestions(true);
              }}
              onFocus={() => setShowTagSuggestions(true)}
              placeholder="Añadir etiqueta (ej: Anatomía...)"
              className="w-full bg-slate-50 border border-border-light rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            {showTagSuggestions && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-40 overflow-y-auto animate-fade-in-up">
                {questionTags
                  .filter(t => t.toLowerCase().includes(newTag.toLowerCase()) && !qTags.includes(t))
                  .map(t => (
                    <button
                      key={t}
                      onClick={() => handleAddTag(t)}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 font-bold text-slate-700 transition-colors border-b border-slate-50 last:border-0 h-10 flex items-center"
                    >
                      <span className="material-symbols-outlined text-slate-400 mr-2 text-[16px]">sell</span>
                      {t}
                    </button>
                  ))}
                {newTag.trim() && !questionTags.some(t => t.toLowerCase() === newTag.toLowerCase()) && (
                  <button
                    onClick={() => handleAddTag()}
                    className="w-full text-left px-4 py-2 text-xs bg-blue-50 hover:bg-blue-100 font-black text-blue-600 transition-colors border-t border-blue-100 h-10 flex items-center"
                  >
                    <span className="material-symbols-outlined mr-2 text-[16px]">add_circle</span>
                    Crear etiqueta "{newTag}"
                  </button>
                )}
                {questionTags.filter(t => t.toLowerCase().includes(newTag.toLowerCase()) && !qTags.includes(t)).length === 0 && !newTag.trim() && (
                  <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
                    No hay más etiquetas disponibles
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={() => handleAddTag()} className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-5 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 active:scale-95">Agregar</button>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 mb-6">
        {qType === 'multiple_choice' && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Opciones de Respuesta</label>
            {qOptions.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-3">
                <button onClick={() => setQOptions(qOptions.map(o => ({ ...o, isCorrect: o.id === opt.id })))} className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${opt.isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 hover:border-emerald-400'}`}>
                  {opt.isCorrect && <span className="material-symbols-outlined text-[16px]">check</span>}
                </button>
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => setQOptions(qOptions.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o))}
                  placeholder={`Opción ${String.fromCharCode(65 + idx)}`}
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm ${opt.isCorrect ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900 font-medium' : 'border-slate-200 bg-white'}`}
                />
                <button onClick={() => setQOptions(qOptions.filter(o => o.id !== opt.id))} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[18px]">delete</span></button>
              </div>
            ))}
            <button onClick={() => setQOptions([...qOptions, { id: Date.now().toString(), text: '', isCorrect: false }])} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2">
              <span className="material-symbols-outlined text-[16px]">add</span> Añadir Opción
            </button>
          </div>
        )}

        {qType === 'true_false' && (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Respuesta Correcta</label>
            <div className="flex gap-4">
              <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${qCorrectAnswer === true ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" checked={qCorrectAnswer === true} onChange={() => setQCorrectAnswer(true)} className="sr-only" />
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${qCorrectAnswer === true ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>{qCorrectAnswer === true && <span className="material-symbols-outlined text-[14px]">check</span>}</span>
                <span className={`font-bold ${qCorrectAnswer === true ? 'text-emerald-700' : 'text-slate-600'}`}>Verdadero</span>
              </label>
              <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${qCorrectAnswer === false ? 'bg-red-50 border-red-200 ring-1 ring-red-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" checked={qCorrectAnswer === false} onChange={() => setQCorrectAnswer(false)} className="sr-only" />
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${qCorrectAnswer === false ? 'bg-red-500 border-red-500 text-white' : 'border-slate-300'}`}>{qCorrectAnswer === false && <span className="material-symbols-outlined text-[14px]">check</span>}</span>
                <span className={`font-bold ${qCorrectAnswer === false ? 'text-red-700' : 'text-slate-600'}`}>Falso</span>
              </label>
            </div>
          </div>
        )}

        {qType === 'short_answer' && (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Palabras Clave (Respuestas Correctas)</label>
            <p className="text-xs text-slate-400 mb-2">Separe las posibles respuestas con comas.</p>
            <input type="text" value={Array.isArray(qCorrectAnswer) ? (qCorrectAnswer as string[]).join(', ') : qCorrectAnswer as string} onChange={(e) => setQCorrectAnswer(e.target.value.split(',').map(s => s.trim()))} className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm" placeholder="Ej: Cerebro, Encéfalo, Corteza" />
          </div>
        )}
      </div>

      <div className="mb-6 pt-2">
        <button
          onClick={() => setShowJustification(!showJustification)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border ${showJustification ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-slate-300'}`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {showJustification ? 'lightbulb' : 'add_circle'}
          </span>
          {showJustification ? 'Quitar Justificación' : 'Añadir Justificación'}
        </button>

        {showJustification && (
          <div className="mt-4 animate-fade-in">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Explicación de la Respuesta</label>
            <textarea
              value={qJustification}
              onChange={(e) => setQJustification(e.target.value)}
              placeholder="Explique por qué esta es la respuesta correcta..."
              className="w-full bg-amber-50/30 border border-amber-100 rounded-[20px] px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all resize-none font-medium text-slate-800 italic"
              rows={3}
            ></textarea>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Cancelar</button>
        <button onClick={handleSaveInternal} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-600/20">
          {initialQuestion ? 'Guardar Cambios' : 'Agregar Pregunta'}
        </button>
      </div>

      <FormulaEditorModal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
        onInsert={handleFormulaInsert}
      />
    </div>
  );
};

// ========== SUB-COMPONENT: EXAM EDITOR (DETAILS) ==========
const ExamEditor = ({ examId, onBack }: { examId?: number | string, onBack: () => void }) => {
  const { getExamById, addExam, updateExam, courses } = useAulaVirtual();
  const [currentType, setCurrentType] = useState<'multiple_choice' | 'true_false' | 'short_answer'>('multiple_choice');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Local State for Form
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'BORRADOR' | 'PUBLICADO' | 'CERRADO'>('BORRADOR');
  const [courseId, setCourseId] = useState<number | undefined>(undefined);
  const [timeLimit, setTimeLimit] = useState(60);
  const [attempts, setAttempts] = useState(2);
  const [passingScore, setPassingScore] = useState(70);
  const [randomOrder, setRandomOrder] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [concentrationMode, setConcentrationMode] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Load Exam Data
  useEffect(() => {
    if (examId) {
      const exam = getExamById(examId);
      if (exam) {
        setTitle(exam.title);
        setStatus(exam.status);
        setCourseId(exam.courseId);
        setTimeLimit(exam.timeLimit);
        setAttempts(exam.attempts);
        setPassingScore(exam.passingScore);
        setRandomOrder(exam.randomOrder);
        setShowResults(exam.showResults);
        setConcentrationMode(exam.concentrationMode || false);
        setQuestions(exam.questions || []);
      }
    }
  }, [examId, getExamById]);

  const handleSave = async () => {
    const examData: Partial<Exam> = {
      title,
      status,
      courseId,
      courseName: courses.find(c => c.id == courseId)?.title || '',
      timeLimit,
      attempts,
      passingScore,
      randomOrder,
      showResults,
      concentrationMode,
      questions,
      updatedAt: new Date().toISOString()
    };

    if (examId) {
      updateExam(examId, examData);
      await Swal.fire('Guardado', 'Cambios guardados correctamente', 'success');
    } else {
      const newExam: Exam = {
        id: `EX-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...examData as any
      };
      addExam(newExam);
      await Swal.fire('Creado', 'Examen creado exitosamente', 'success');
    }
    // onBack(); // Remove auto-back to stay in editor
  };

  const handleImportQuestions = (newQuestions: Question[]) => {
    setQuestions(prev => [...prev, ...newQuestions]);
    Swal.fire({
      title: 'Importadas',
      text: `Se han importado ${newQuestions.length} preguntas exitosamente.`,
      icon: 'success',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
  };

  // Question Editor State
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | string | undefined>(undefined);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<'multiple_choice' | 'true_false' | 'short_answer'>('multiple_choice');
  const [qPoints, setQPoints] = useState(10);
  const [qOptions, setQOptions] = useState<{ id: string; text: string; isCorrect: boolean }[]>([
    { id: '1', text: '', isCorrect: false },
    { id: '2', text: '', isCorrect: false }
  ]);
  const [qCorrectAnswer, setQCorrectAnswer] = useState<boolean | string | string[]>('');

  const resetQuestionForm = () => {
    setIsEditingQuestion(false);
    setEditingQuestionId(undefined);
    setQText('');
    setQType('multiple_choice');
    setQPoints(10);
    setQOptions([{ id: Date.now().toString(), text: '', isCorrect: false }, { id: (Date.now() + 1).toString(), text: '', isCorrect: false }]);
    setQCorrectAnswer('');
  };

  const handleEditQuestion = (q: Question) => {
    setIsEditingQuestion(true);
    setEditingQuestionId(q.id);
    setQText(q.text);
    setQType(q.type);
    setQPoints(q.points);
    setQOptions(q.options || []);
    setQCorrectAnswer(q.correctAnswer !== undefined ? q.correctAnswer : '');
  };

  const handleDeleteQuestion = (qId: number | string) => {
    Swal.fire({
      title: '¿Eliminar pregunta?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setQuestions(questions.filter(q => q.id !== qId));
        if (editingQuestionId === qId) resetQuestionForm();
      }
    });
  };

  const handleSaveQuestion = () => {
    if (!qText.trim()) {
      Swal.fire('Error', 'La pregunta debe tener un enunciado', 'error');
      return;
    }

    const newQuestion: Question = {
      id: editingQuestionId || generateQuestionId(),
      text: qText,
      type: qType,
      points: qPoints,
      options: qType === 'multiple_choice' ? qOptions : undefined,
      correctAnswer: qType !== 'multiple_choice' ? qCorrectAnswer : undefined,
    };

    if (editingQuestionId) {
      setQuestions(questions.map(q => q.id === editingQuestionId ? newQuestion : q));
      Swal.fire({
        title: 'Actualizada',
        text: 'Pregunta actualizada correctamente',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      });
    } else {
      setQuestions([...questions, newQuestion]);
      Swal.fire({
        title: 'Agregada',
        text: 'Pregunta agregada a la lista',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      });
    }
    resetQuestionForm();
  };

  const handleAddOption = () => {
    setQOptions([...qOptions, { id: Date.now().toString(), text: '', isCorrect: false }]);
  };

  const updateOption = (id: string, field: keyof typeof qOptions[0], value: any) => {
    setQOptions(qOptions.map(opt =>
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background-light p-4 md:p-8 animate-fade-in relative">
      <ImportQuestionsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportQuestions}
        excludeQuestionIds={questions.map(q => q.id)}
      />

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1 rounded-full hover:bg-slate-200 transition-colors mr-1">
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </button>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del Examen..."
              className="bg-transparent text-slate-900 text-3xl md:text-3xl font-black leading-tight tracking-tight border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none w-full"
            />
            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider shadow-sm ${status === 'PUBLICADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
              {status}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-start">
          <button className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-border-light bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
            <span className="material-symbols-outlined text-[20px]">visibility</span>
            <span>Vista Previa</span>
          </button>
          <button onClick={() => { handleSave(); onBack(); }} className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all">
            <span className="material-symbols-outlined text-[20px]">save</span>
            <span>Guardar y Salir</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Config */}
        <aside className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
          <div className="rounded-xl border border-border-light bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">tune</span>
              Configuración General
            </h3>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-text-secondary tracking-wider">Curso Asociado</label>
                <div className="relative">
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-border-light rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none appearance-none"
                  >
                    <option value="">Seleccionar Curso...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-2.5 text-text-secondary pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-text-secondary tracking-wider">Estado</label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className={`w-full border border-border-light rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none appearance-none ${status === 'PUBLICADO' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-50'
                        }`}
                    >
                      <option value="BORRADOR">Borrador</option>
                      <option value="PUBLICADO">Publicado</option>
                      <option value="CERRADO">Cerrado</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-text-secondary pointer-events-none text-[20px]">expand_more</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-text-secondary tracking-wider">Tiempo (min)</label>
                  <input
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-border-light rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-text-secondary tracking-wider">Intentos</label>
                  <input
                    type="number"
                    value={attempts}
                    onChange={(e) => setAttempts(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-border-light rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-text-secondary tracking-wider">Aprobación (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={passingScore}
                      onChange={(e) => setPassingScore(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-border-light rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-text-secondary text-sm">%</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border-light my-1"></div>

              {/* Toggles Group */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Orden aleatorio</span>
                  <button
                    onClick={() => setRandomOrder(!randomOrder)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${randomOrder ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute left-0.5 top-0.5 inline-block w-5 h-5 transform bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm ${randomOrder ? 'translate-x-5' : 'translate-x-0'}`}></span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Mostrar resultados</span>
                  <button
                    onClick={() => setShowResults(!showResults)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${showResults ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute left-0.5 top-0.5 inline-block w-5 h-5 transform bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm ${showResults ? 'translate-x-5' : 'translate-x-0'}`}></span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">Modo Concentración</span>
                    <span className="text-[10px] text-slate-400">Pantalla completa y bloqueo de salida</span>
                  </div>
                  <button
                    onClick={() => setConcentrationMode(!concentrationMode)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${concentrationMode ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute left-0.5 top-0.5 inline-block w-5 h-5 transform bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm ${concentrationMode ? 'translate-x-5' : 'translate-x-0'}`}></span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Import Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl border border-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-between group mt-2"
          >
            <div className="flex flex-col items-start gap-1">
              <span className="font-bold text-sm uppercase tracking-wide">Importar Preguntas</span>
              <span className="text-xs text-indigo-200">Desde el Banco General</span>
            </div>
            <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">dataset</span>
          </button>
        </aside >


        <section className="lg:col-span-8 flex flex-col gap-6 order-1 lg:order-2">


          <QuestionEditorForm
            key={editingQuestionId || 'new'}
            initialQuestion={questions.find(q => q.id === editingQuestionId)}
            onSave={(q) => {
              if (editingQuestionId) {
                setQuestions(questions.map(curr => curr.id === q.id ? q : curr));
                setEditingQuestionId(undefined);
                setIsEditingQuestion(false);
                Swal.fire({
                  title: 'Actualizada',
                  text: 'Pregunta actualizada correctamente',
                  icon: 'success',
                  toast: true,
                  position: 'top-end',
                  showConfirmButton: false,
                  timer: 2000
                });
              } else {
                setQuestions([...questions, q]);
                Swal.fire('Agregada', 'Pregunta agregada a la lista', 'success');
              }
            }}
            onCancel={() => {
              setIsEditingQuestion(false);
              setEditingQuestionId(undefined);
            }}
          />


          {/* Question List */}
          {
            questions.length > 0 && (
              <div className="space-y-4 mb-2">
                <h3 className="text-lg font-bold text-slate-900 flex items-center justify-between">
                  <span>Preguntas del Examen ({questions.length})</span>
                  <span className="text-sm font-normal text-text-secondary">Total Puntos: {questions.reduce((acc, q) => acc + q.points, 0)}</span>
                </h3>
                <div className="grid gap-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className={`bg-white p-4 rounded-xl border transition-all ${editingQuestionId === q.id ? 'border-blue-600 ring-1 ring-blue-600/20 shadow-md' : 'border-border-light hover:border-blue-300 shadow-sm'}`}>
                      <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${q.type === 'multiple_choice' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                              q.type === 'true_false' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                              {q.type === 'multiple_choice' ? 'Opción Múltiple' : q.type === 'true_false' ? 'V/F' : 'Abierta'}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                              {q.points} pts
                            </span>
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono font-black">
                              ID: {q.id}
                            </span>
                          </div>
                          <p className="font-medium text-slate-900 line-clamp-2">{q.text}</p>
                          {q.type === 'multiple_choice' && (
                            <div className="mt-2 pl-2 border-l-2 border-slate-100">
                              {q.options?.map(opt => (
                                <div key={opt.id} className={`text-xs mb-1 flex items-center gap-1.5 ${opt.isCorrect ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                                  <span className="material-symbols-outlined text-[14px]">
                                    {opt.isCorrect ? 'check_circle' : 'radio_button_unchecked'}
                                  </span>
                                  {opt.text}
                                </div>
                              )).slice(0, 3)}
                              {(q.options?.length || 0) > 3 && <span className="text-xs text-slate-400 italic pl-5">...y {q.options!.length - 3} más</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => handleEditQuestion(q)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={() => handleDeleteQuestion(q.id)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </section >
      </div >
    </div >
  );
};

// ========== SUB-COMPONENT: QUESTION BANK (NEW) ==========
const QuestionBank = ({ onBack, initialTargetExamId }: { onBack: () => void, initialTargetExamId?: string }) => {
  const { exams, updateExam, questionTags, updateQuestionTags } = useAulaVirtual();
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [targetExamId, setTargetExamId] = useState<string>(initialTargetExamId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false); // Modal State
  const [viewingQuestion, setViewingQuestion] = useState<any | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filters State
  const [typeFilter, setTypeFilter] = useState<string[]>([]); // Array for multiple selection
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [tagFilter, setTagFilter] = useState<string[]>([]);   // Array for multiple tags

  // Aggregate questions from all exams
  const allQuestions = React.useMemo(() => {
    const questionMap = new Map<string, any>();

    exams.forEach(e => {
      (e.questions || []).forEach(q => {
        const id = q.id.toString();
        if (!questionMap.has(id)) {
          questionMap.set(id, {
            ...q,
            id,
            originExamId: e.id,
            originExamTitle: e.title,
            originDate: e.createdAt || new Date().toISOString()
          });
        }
      });
    });

    return Array.from(questionMap.values());
  }, [exams]);

  const uniqueCourses = React.useMemo(() => {
    const courses = new Set(allQuestions.map(q => q.originExamTitle || 'Sin Asignar'));
    return Array.from(courses);
  }, [allQuestions]);

  const uniqueTags = React.useMemo(() => {
    const tags = new Set<string>();
    allQuestions.forEach(q => q.tags?.forEach((t: string) => tags.add(t)));
    return Array.from(tags);
  }, [allQuestions]);


  // Reset page on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, courseFilter, tagFilter]);


  // Filter Logic
  const filteredQuestions = allQuestions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter.length === 0 || typeFilter.includes(q.type);
    const matchesCourse = courseFilter === 'ALL' || (q.originExamTitle || 'Sin Asignar') === courseFilter;
    const matchesTag = tagFilter.length === 0 || (q.tags || []).some((t: string) => tagFilter.includes(t));
    return matchesSearch && matchesType && matchesCourse && matchesTag;
  });

  // Derived state for pagination
  const paginatedQuestions = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);

  const toggleTypeFilter = (type: string) => {
    setTypeFilter(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleTagFilter = (tag: string) => {
    setTagFilter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSelectQuestion = (id: string) => {
    if (selectedQuestions.includes(id)) {
      setSelectedQuestions(selectedQuestions.filter(qId => qId !== id));
    } else {
      setSelectedQuestions([...selectedQuestions, id]);
    }
  };

  const handleImport = () => {
    if (!targetExamId) {
      Swal.fire('Error', 'Por favor seleccione un examen de destino.', 'error');
      return;
    }
    const targetExam = exams.find(e => e.id.toString() === targetExamId);
    if (!targetExam) return;

    const existingIds = (targetExam.questions || []).map(eq => eq.id.toString());
    const questionsToAdd = allQuestions
      .filter(q => selectedQuestions.includes(q.id))
      .filter(q => !existingIds.includes(q.id.toString()));

    if (questionsToAdd.length === 0) {
      Swal.fire('Info', 'Todas las preguntas seleccionadas ya están en el examen de destino.', 'info');
      return;
    }

    const newQuestions = questionsToAdd.map(q => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { originExamId, originExamTitle, originDate, ...rest } = q;
      return { ...rest };
    });

    updateExam(targetExam.id, {
      questions: [...(targetExam.questions || []), ...newQuestions] as Question[]
    });

    Swal.fire({
      title: 'Importación Exitosa',
      text: `Se han agregado ${newQuestions.length} preguntas al examen "${targetExam.title}".`,
      icon: 'success',
      confirmButtonColor: '#2563EB'
    });
    setSelectedQuestions([]);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 animate-fade-in text-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm group"
              title="Volver a la lista"
            >
              <span className="material-symbols-outlined group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            </button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Banco de Preguntas</h1>
          </div>
          <p className="text-text-secondary mt-2 pl-14">Gestione todas las preguntas de la plataforma de neurología, filtre por categorías o añada contenido a sus exámenes.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 font-bold py-2 md:py-2.5 px-4 md:px-5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs md:text-sm">
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Importar CSV/Excel
          </button>
          <button
            onClick={() => setIsCreatingQuestion(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 md:py-2.5 px-4 md:px-5 rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 text-xs md:text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Nueva Pregunta
          </button>
        </div>
      </div>

      {/* Selection Action Bar */}
      {selectedQuestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined">check_box</span>
            </div>
            <div>
              <h4 className="font-bold text-blue-900">{selectedQuestions.length} preguntas seleccionadas</h4>
              <p className="text-blue-600 text-xs">Añadir masivamente a un examen</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={targetExamId}
              onChange={(e) => setTargetExamId(e.target.value)}
              className="flex-1 md:w-64 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar examen de destino...</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
            <button
              onClick={handleImport}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">input</span>
              Importar a Examen
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-border-light shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-blue-600">
              <span className="material-symbols-outlined">filter_alt</span>
              <h3 className="font-bold uppercase text-xs tracking-wider">Filtros Avanzados</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Curso de Origen</label>
                  <select
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-border-light rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="ALL">Todos los cursos</option>
                    {uniqueCourses.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Pregunta</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={typeFilter.includes('multiple_choice')} onChange={() => toggleTypeFilter('multiple_choice')} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-slate-600">Opción Múltiple</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={typeFilter.includes('true_false')} onChange={() => toggleTypeFilter('true_false')} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-slate-600">Verdadero / Falso</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={typeFilter.includes('short_answer')} onChange={() => toggleTypeFilter('short_answer')} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-slate-600">Respuesta Corta</span>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Etiquetas Populares</label>
                    <button
                      onClick={() => setIsTagModalOpen(true)}
                      className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all font-bold flex items-center gap-1 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[12px]">sell</span>
                      + Etiquetas
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {questionTags.slice(0, 15).map(tag => (
                      <span
                        key={tag}
                        onClick={() => toggleTagFilter(tag)}
                        className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${tagFilter.includes(tag) ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-inner' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'}`}
                      >
                        {tag}
                      </span>
                    ))}
                    {questionTags.length === 0 && <span className="text-xs text-slate-400 italic">No hay etiquetas disponibles</span>}
                  </div>
                </div>
                <button onClick={() => { setCourseFilter('ALL'); setTypeFilter([]); setTagFilter([]); setSearchTerm(''); }} className="w-full text-blue-600 text-xs font-bold hover:underline mt-2">Limpiar todos los filtros</button>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg text-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Estadísticas del Banco</h3>
              <div className="text-3xl font-black tracking-tight mb-2">{allQuestions.length.toLocaleString()}</div>
              <div className="text-sm text-slate-400 mb-4">Preguntas totales</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[65%] rounded-full"></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-medium italic">65% utilizadas en exámenes activos</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-border-light flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                  type="text"
                  placeholder="Buscar por enunciado o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="text-xs font-medium text-slate-500 flex items-center gap-4">
                <span>Mostrando {filteredQuestions.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredQuestions.length)} de {filteredQuestions.length} resultados</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 transition-colors ${currentPage === 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400'}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className={`w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 transition-colors ${currentPage >= totalPages ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400'}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-3 bg-slate-50 border-b border-border-light text-[11px] font-bold text-slate-500 uppercase tracking-wider items-center">
              <div className="col-span-1 flex justify-center">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
                  onChange={() => {
                    if (selectedQuestions.length === filteredQuestions.length) {
                      setSelectedQuestions([]);
                    } else {
                      setSelectedQuestions(filteredQuestions.map(q => q.id));
                    }
                  }}
                />
              </div>
              <div className="col-span-6">Enunciado</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-2">Etiquetas</div>
              <div className="col-span-1 text-right">Acciones</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-100">
              {paginatedQuestions.map((q) => (
                <div key={q.id} className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors ${selectedQuestions.includes(q.id) ? 'bg-blue-50/30' : ''}`}>
                  <div className="col-span-1 flex justify-center">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(q.id)}
                      onChange={() => handleSelectQuestion(q.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-6">
                    <p className="font-bold text-slate-800 text-sm line-clamp-1 mb-1">{q.text}</p>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        {q.originExamTitle}
                      </p>
                      <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm border border-blue-200/50">
                        <span className="material-symbols-outlined text-[12px]">fingerprint</span>
                        {q.id}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${q.type === 'multiple_choice' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                      q.type === 'true_false' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                      {q.type === 'multiple_choice' ? 'Múltiple' : q.type === 'true_false' ? 'V/F' : 'Corta'}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-wrap gap-1">
                    {(q.tags || ['General', 'Neurología']).slice(0, 2).map((tag: string, i: number) => (
                      <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200">{tag}</span>
                    ))}
                  </div>
                  <div className="col-span-1 text-right flex justify-end gap-1">
                    <button
                      onClick={() => setViewingQuestion(q)}
                      className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-blue-600 inline-flex items-center justify-center transition-colors"
                      title="Ver detalles"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                    <button
                      onClick={async () => {
                        const result = await Swal.fire({
                          title: '¿Eliminar pregunta?',
                          text: "Se eliminará permanentemente de TODOS los exámenes que la utilicen.",
                          icon: 'warning',
                          showCancelButton: true,
                          confirmButtonColor: '#EF4444',
                          cancelButtonColor: '#6B7280',
                          confirmButtonText: 'Sí, eliminar de todo'
                        });

                        if (result.isConfirmed) {
                          // Find all exams containing this question
                          const affectedExams = exams.filter(e => e.questions?.some(eq => String(eq.id) === String(q.id)));

                          if (affectedExams.length === 0) {
                            Swal.fire('Info', 'Esta pregunta no se encontró en ningún examen activo.', 'info');
                            return;
                          }

                          let deletedCount = 0;
                          affectedExams.forEach(exam => {
                            const updatedQuestions = exam.questions.filter(eq => String(eq.id) !== String(q.id));
                            updateExam(exam.id, { questions: updatedQuestions });
                            deletedCount++;
                          });

                          Swal.fire(
                            'Eliminado',
                            `La pregunta fue eliminada de ${deletedCount} examen(es) correctamente.`,
                            'success'
                          );
                        }
                      }}
                      className="w-8 h-8 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 inline-flex items-center justify-center transition-colors"
                      title="Eliminar de la base de datos"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                    </button>
                  </div>
                </div>
              ))}
              {filteredQuestions.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl text-slate-400">search_off</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No se encontraron preguntas</h3>
                  <p className="text-slate-500 text-sm">Prueba con otros términos de búsqueda o filtros.</p>
                </div>
              )}
              {/* Modal for Creating/Editing Question */}
              {(isCreatingQuestion || editingQuestion) && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <QuestionEditorForm
                      initialQuestion={editingQuestion || undefined}
                      onSave={async (newQuestion) => {
                        if (editingQuestion) {
                          // Logic to update existing question
                          const target = exams.find(e => e.id === editingQuestion.originExamId);
                          if (target) {
                            const updatedQuestions = target.questions?.map(q => q.id === editingQuestion.id ? newQuestion : q);
                            updateExam(target.id, { questions: updatedQuestions });
                            Swal.fire('Actualizado', 'La pregunta ha sido actualizada correctamente.', 'success');
                          }
                          setEditingQuestion(null);
                        } else {
                          // Existing logic for new question
                          let targetId = targetExamId;
                          if (!targetId) {
                            const bank = exams.find(e => e.title === 'TOTAL_BANK' || e.id === 'general-bank');
                            if (bank) targetId = bank.id.toString();
                            else if (exams.length > 0) targetId = exams[0].id.toString();
                          }

                          if (targetId) {
                            const target = exams.find(e => e.id.toString() === targetId.toString());
                            if (target) {
                              updateExam(target.id, { questions: [...(target.questions || []), newQuestion] });
                              Swal.fire('Guardado', 'Pregunta creada y añadida al examen ' + target.title, 'success');
                              setIsCreatingQuestion(false);
                              setTargetExamId('');
                            }
                          } else {
                            Swal.fire('Error', 'No hay exámenes disponibles para guardar la pregunta.', 'error');
                          }
                        }
                      }}
                      onCancel={() => {
                        setIsCreatingQuestion(false);
                        setEditingQuestion(null);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Preview Modal */}
              {viewingQuestion && (
                <QuestionPreviewModal
                  question={viewingQuestion}
                  onClose={() => setViewingQuestion(null)}
                  onEdit={(q) => {
                    setEditingQuestion(q);
                    setViewingQuestion(null);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <TagManagerModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        tags={questionTags}
        onUpdate={updateQuestionTags}
      />
    </div>
  );
};

// ========== SUB-COMPONENT: TAG MANAGER MODAL ==========
const TagManagerModal = ({ isOpen, onClose, tags, onUpdate }: { isOpen: boolean; onClose: () => void; tags: string[]; onUpdate: (tags: string[]) => void }) => {
  const [newTag, setNewTag] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onUpdate([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleDelete = (index: number) => {
    onUpdate(tags.filter((_, i) => i !== index));
  };

  const handleSaveEdit = (index: number) => {
    if (editValue.trim() && !tags.includes(editValue.trim())) {
      const newTags = [...tags];
      newTags[index] = editValue.trim();
      onUpdate(newTags);
      setEditingIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in shadow-2xl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-white/20">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Gestión de Etiquetas</h3>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Organiza tu Banco de Preguntas</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">sell</span>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Ej: Neuroanatomía..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!newTag.trim()}
              className={`bg-blue-600 text-white px-5 rounded-2xl transition-all flex items-center gap-2 font-bold text-sm shadow-lg shadow-blue-600/20 active:scale-95 ${!newTag.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Crear
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar custom-scrollbar-thin">
            {tags.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-20">sell</span>
                <p className="text-xs font-medium">No hay etiquetas creadas</p>
              </div>
            )}
            {tags.map((tag, index) => (
              <div key={index} className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                {editingIndex === index ? (
                  <div className="flex gap-2 w-full animate-fade-in">
                    <input
                      autoFocus
                      type="text"
                      className="flex-1 px-3 py-1.5 text-sm bg-white border border-blue-400 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-medium"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(index)}
                      onBlur={() => setEditingIndex(null)}
                    />
                    <button onMouseDown={() => handleSaveEdit(index)} className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500/50"></div>
                      <span className="text-slate-700 font-bold text-sm">{tag}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                      <button onClick={() => { setEditingIndex(index); setEditValue(tag); }} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button onClick={() => handleDelete(index)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-all">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95">
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== SUB-COMPONENT: QUESTION PREVIEW MODAL ==========
const QuestionPreviewModal = ({ question, onClose, onEdit }: { question: any; onClose: () => void; onEdit: (q: any) => void }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-fade-in shadow-2xl">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in border border-white/20 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <span className="material-symbols-outlined text-[28px]">visibility</span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                Vista Previa
                <span className="text-indigo-400 text-sm ml-2 font-mono">#{question.id}</span>
              </h3>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Analiza el contenido de la pregunta</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(question)}
              className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 active:scale-95"
              title="Editar Pregunta"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-8">
            {/* Question Text */}
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200/60 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl">format_quote</span>
              </div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Enunciado</label>

              <div className="flex flex-col md:flex-row gap-6 items-start">
                {question.image && (
                  <div className="w-full md:w-1/3 rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/30">
                    <img src={question.image} alt="Question Reference" className="w-full h-auto object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-lg text-slate-800 font-bold leading-relaxed">{question.text}</p>
                </div>
              </div>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-[18px]">category</span>
                <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wider">
                  {question.type === 'multiple_choice' ? 'Opción Múltiple' : question.type === 'true_false' ? 'Verdadero/Falso' : 'Respuesta Corta'}
                </span>
              </div>
              {question.tags?.map((tag: string, i: number) => (
                <div key={i} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">sell</span>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{tag}</span>
                </div>
              ))}
            </div>

            {/* Options */}
            {(question.type === 'multiple_choice' || question.type === 'true_false') && (
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Opciones y Respuesta</label>
                <div className="grid gap-3">
                  {question.options?.map((opt: any, i: number) => {
                    const isCorrect = question.type === 'multiple_choice' ? opt.isCorrect : (question.correctAnswer === (i === 0 ? 'true' : 'false'));
                    return (
                      <div
                        key={i}
                        className={`p-5 rounded-3xl border transition-all flex items-center justify-between group ${isCorrect ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-400'}`}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className={`text-sm font-bold ${isCorrect ? 'text-emerald-900' : 'text-slate-700'}`}>{opt.text}</span>
                        </div>
                        {isCorrect && (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Correcta
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {question.type === 'short_answer' && (
              <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100">
                <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Respuesta Correcta</label>
                <p className="text-emerald-900 font-black text-xl">{question.correctAnswer || 'No especificada'}</p>
              </div>
            )}

            {question.justification && (
              <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <span className="material-symbols-outlined text-6xl text-amber-600">lightbulb</span>
                </div>
                <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Justificación de la Respuesta
                </label>
                <p className="text-amber-900 font-medium italic leading-relaxed text-sm">
                  "{question.justification}"
                </p>
              </div>
            )}

            {/* Origin */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">history</span>
                <span className="text-[11px] font-medium italic">
                  Originado en: <span className="font-bold text-slate-600">{question.originExamTitle}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-8 py-4 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
          >
            Cerrar Vista
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== SUB-COMPONENT: FORMULA EDITOR MODAL ==========
const FormulaEditorModal = ({ isOpen, onClose, onInsert }: { isOpen: boolean; onClose: () => void; onInsert: (formula: string) => void }) => {
  const [formula, setFormula] = useState('');
  const [activeCategory, setActiveCategory] = useState('Básico');

  const categories = {
    'Básico': ['<', '>', '≤', '≥', 'x²', '√', '∫', '°', '∞', 'e', 'Ω', '℧'],
    'Operaciones': ['=', '≠', '≡', '≈', 'xⁿ', '( )', '∑', '·', 'π', 'μ', 'ρ', 'ε'],
    'Símbolos': ['+', '-', '×', '÷', '±', '÷', '→', '¬', 'θ', 'δ', 'ω', 'λ']
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in shadow-2xl">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in border border-white/20 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <span className="material-symbols-outlined text-[24px]">functions</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Editor de Ecuaciones</h3>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Inserta símbolos científicos</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6">
          {/* Categories */}
          <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-2xl">
            {Object.keys(categories).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${activeCategory === cat ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Symbol Grid */}
          <div className="grid grid-cols-6 gap-2 mb-6">
            {(categories as any)[activeCategory].map((sym: string) => (
              <button
                key={sym}
                onClick={() => setFormula(prev => prev + sym)}
                className="h-12 bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-200 hover:shadow-sm rounded-xl text-lg font-bold text-slate-700 transition-all active:scale-95 flex items-center justify-center"
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Editor Area */}
          <div className="space-y-4">
            <div className="bg-slate-900 p-6 rounded-[32px] min-h-[120px] flex items-center justify-center relative overflow-hidden group">
              <div className="absolute top-4 left-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vista Previa</div>
              <div className="text-white text-3xl font-serif italic tracking-wide">{formula || 'a² + b² = c²'}</div>
            </div>

            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="Escribe o selecciona símbolos..."
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onInsert(formula);
              onClose();
            }}
            disabled={!formula.trim()}
            className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
          >
            Insertar Ecuación
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== SUB-COMPONENT: IMPORT QUESTIONS MODAL ==========
const ImportQuestionsModal = ({
  isOpen,
  onClose,
  onImport,
  excludeQuestionIds = []
}: {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: Question[]) => void;
  excludeQuestionIds?: (number | string)[];
}) => {
  const { exams, questionTags } = useAulaVirtual();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [tagFilter, setTagFilter] = useState<string>('ALL');

  // Aggregate and Filter Questions
  const availableQuestions = React.useMemo(() => {
    const questionMap = new Map<string, any>();
    exams.forEach(e => {
      (e.questions || []).forEach(q => {
        const qId = q.id.toString();
        if (!questionMap.has(qId) && !excludeQuestionIds.includes(q.id)) {
          questionMap.set(qId, {
            ...q,
            originExamTitle: e.title
          });
        }
      });
    });
    return Array.from(questionMap.values());
  }, [exams, excludeQuestionIds]);

  const filteredQuestions = availableQuestions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) || q.id.toString().includes(searchTerm);
    const matchesType = typeFilter === 'ALL' || q.type === typeFilter;
    const matchesTag = tagFilter === 'ALL' || (q.tags || []).includes(tagFilter);
    return matchesSearch && matchesType && matchesTag;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleImportInternal = () => {
    const questionsToImport = availableQuestions.filter(q => selectedIds.includes(q.id.toString())).map(q => ({
      ...q,
      originExamTitle: undefined // Clean up helper prop
    }));
    onImport(questionsToImport);
    onClose();
    setSelectedIds([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-scale-in border border-white/20">

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Importar desde Banco de Preguntas</h3>
            <p className="text-xs text-slate-500 font-medium">Seleccione las preguntas que desea añadir a este examen</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 bg-white">
          <div className="md:col-span-5 relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Buscar por enunciado..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos los tipos</option>
              <option value="multiple_choice">Opción Múltiple</option>
              <option value="true_false">Verdadero/Falso</option>
              <option value="short_answer">Respuesta Corta</option>
            </select>
          </div>
          <div className="md:col-span-4">
            <select
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todas las etiquetas</option>
              {questionTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          <div className="space-y-3">
            {filteredQuestions.map(q => (
              <div
                key={q.id}
                onClick={() => handleToggleSelect(q.id.toString())}
                className={`bg-white p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md group flex items-start gap-4 ${selectedIds.includes(q.id.toString()) ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10' : 'border-slate-200 hover:border-blue-300'}`}
              >
                <div className={`w-5 h-5 mt-1 rounded border flex items-center justify-center transition-colors ${selectedIds.includes(q.id.toString()) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                  {selectedIds.includes(q.id.toString()) && <span className="material-symbols-outlined text-[14px]">check</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${q.type === 'multiple_choice' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {q.type === 'multiple_choice' ? 'Múltiple' : q.type === 'true_false' ? 'V/F' : 'Corta'}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                      {q.points} pts
                    </span>
                    {q.originExamTitle && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">history</span>
                        {q.originExamTitle}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 line-clamp-2">{q.text}</p>
                  <div className="flex gap-2 mt-2">
                    {q.tags?.map((t: string) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {filteredQuestions.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
                <p>No se encontraron preguntas con los filtros actuales.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center shadow-lg z-10">
          <div className="text-sm font-medium text-slate-600">
            {selectedIds.length} preguntas seleccionadas
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm">
              Cancelar
            </button>
            <button
              onClick={handleImportInternal}
              disabled={selectedIds.length === 0}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Importar Seleccionadas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== MAIN COMPONENT ==========
const ExamManager: React.FC = () => {
  const [viewMode, setViewMode] = useState<'LIST' | 'EDITOR' | 'QUESTION_BANK'>('LIST');
  const [selectedExamId, setSelectedExamId] = useState<number | string | undefined>(undefined);

  const handleViewEditor = (exam?: Exam) => {
    setSelectedExamId(exam?.id);
    setViewMode('EDITOR');
  };

  const handleBack = () => {
    setSelectedExamId(undefined);
    setViewMode('LIST');
  };

  if (viewMode === 'QUESTION_BANK') {
    return <QuestionBank onBack={handleBack} initialTargetExamId={selectedExamId?.toString()} />;
  }

  if (viewMode === 'LIST') {
    return <ExamList onViewEditor={handleViewEditor} onViewQuestionBank={() => setViewMode('QUESTION_BANK')} />;
  }

  return <ExamEditor examId={selectedExamId} onBack={handleBack} />;
};

export default ExamManager;