import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import CategoryManagerModal from './CategoryManagerModal';
import { useAulaVirtual } from '../../context/AulaVirtualContext';
import { api } from '../../../../services/api';

interface CourseEditorProps {
  onBack?: () => void;
  courseId?: number | null;
  onUnsavedChanges?: (hasChanges: boolean) => void;
}

const CourseEditor: React.FC<CourseEditorProps> = ({ onBack, courseId, onUnsavedChanges }) => {
  const { getCourseById, addCourse, updateCourse } = useAulaVirtual();
  const [activeTab, setActiveTab] = useState(0); // Información General por defecto

  // Course General Information State
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseStatus, setCourseStatus] = useState<'PUBLICADO' | 'BORRADOR' | 'CERRADO'>('BORRADOR');
  const [courseSpecialty, setCourseSpecialty] = useState('Neurología Clínica');
  const [courseCategory, setCourseCategory] = useState('Curso');
  const [courseDifficulty, setCourseDifficulty] = useState<'BASICO' | 'MEDIO' | 'AVANZADO'>('MEDIO');
  const [courseCoverImage, setCourseCoverImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Specialty State (Old Category)
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);

  // Category State (New Type)
  const [availableCategories, setAvailableCategories] = useState<string[]>(['Curso', 'Taller', 'Congreso', 'Diplomado']);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Track original values for change detection
  const [originalValues, setOriginalValues] = useState<{
    title: string;
    description: string;
    status: 'PUBLICADO' | 'BORRADOR' | 'CERRADO';
    specialty: string;
    category: string;
    difficulty: 'BASICO' | 'MEDIO' | 'AVANZADO';
    coverImage: string | null;
  }>({
    title: '',
    description: '',
    status: 'BORRADOR',
    specialty: 'Neurología Clínica',
    category: 'Curso',
    difficulty: 'MEDIO',
    coverImage: null,
  });

  // Load dynamic specialties
  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const config = await api.system.getConfig();
        // Use participantSpecialties as source for specialties
        if (config.participantSpecialties && config.participantSpecialties.length > 0) {
          setAvailableSpecialties(config.participantSpecialties);

          // If current specialty is not in the list (and not loading initial data), select first one
          if (!courseId && courseSpecialty === 'Neurología Clínica' && !config.participantSpecialties.includes('Neurología Clínica')) {
            setCourseSpecialty(config.participantSpecialties[0]);
            // Update original values specialty for new course to avoid false positive change
            setOriginalValues(prev => ({ ...prev, specialty: config.participantSpecialties[0] }));
          }
        } else {
          // Fallback default
          setAvailableSpecialties(['Neurología', 'Neurocirugía', 'Psiquiatría', 'Medicina Interna', 'Pediatría', 'Medicina Intensiva', 'Otro']);
        }
      } catch (error) {
        console.error('Error loading specialties:', error);
        // Fallback default on error
        setAvailableSpecialties(['Neurología', 'Neurocirugía', 'Psiquiatría', 'Medicina Interna', 'Pediatría', 'Medicina Intensiva', 'Otro']);
      }
    };
    loadSpecialties();
  }, [courseId]); // Add dependency to re-check if needed, though running once on mount is main goal.

  // Load course data if editing
  useEffect(() => {
    if (courseId) {
      const course = getCourseById(courseId);
      if (course) {
        const loadedSpecialty = (course as any).specialty || (course as any).category || 'Neurología Clínica';
        const loadedCategory = (course as any).category === loadedSpecialty ? 'Curso' : ((course as any).category || 'Curso');

        setCourseTitle(course.title);
        setCourseDescription(course.longDescription);
        setCourseStatus(course.status);
        setCourseSpecialty(loadedSpecialty);
        setCourseCategory(loadedCategory);
        setCourseDifficulty(course.difficulty);
        setCourseCoverImage(course.coverImage);

        // Set original values for comparison
        setOriginalValues({
          title: course.title,
          description: course.longDescription,
          status: course.status,
          specialty: loadedSpecialty,
          category: loadedCategory,
          difficulty: course.difficulty,
          coverImage: course.coverImage,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]); // Only re-run when courseId changes, not when getCourseById changes

  // Detect changes
  useEffect(() => {
    // Check if any field has content (for new courses)
    const hasAnyInput = courseTitle.trim() !== '' || courseDescription.trim() !== '';

    // For existing courses, compare with original values
    const hasChangesFromOriginal =
      courseTitle !== originalValues.title ||
      courseDescription !== originalValues.description ||
      courseStatus !== originalValues.status ||
      courseSpecialty !== originalValues.specialty ||
      courseCategory !== originalValues.category ||
      courseDifficulty !== originalValues.difficulty;

    // A course has unsaved changes if:
    // 1. It's being created and has any input, OR
    // 2. It's being edited and values differ from original
    const hasChanges = (!courseId && hasAnyInput) || (courseId && hasChangesFromOriginal);

    if (onUnsavedChanges) {
      onUnsavedChanges(!!hasChanges); // Ensure it's always boolean
    }
  }, [courseTitle, courseDescription, courseStatus, courseSpecialty, courseCategory, courseDifficulty, originalValues, onUnsavedChanges, courseId]);

  const handleDiscard = async () => {
    // Calculate if there are changes
    const hasChanges =
      courseTitle !== originalValues.title ||
      courseDescription !== originalValues.description ||
      courseStatus !== originalValues.status ||
      courseSpecialty !== originalValues.specialty ||
      courseCategory !== originalValues.category ||
      courseDifficulty !== originalValues.difficulty ||
      courseCoverImage !== originalValues.coverImage;

    if (!hasChanges) {
      if (onBack) onBack();
      return;
    }

    const result = await Swal.fire({
      title: '¿Descartar cambios?',
      text: 'Se perderán todos los cambios no guardados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Descartar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed && onBack) {
      onBack();
    }
  };

  // Rich text editor functions
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (formatType: 'bold' | 'italic' | 'list' | 'link') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = courseDescription.substring(start, end);
    let newText = '';
    let newCursorPos = end;

    switch (formatType) {
      case 'bold':
        newText = courseDescription.substring(0, start) + `**${selectedText}**` + courseDescription.substring(end);
        newCursorPos = end + 4;
        break;
      case 'italic':
        newText = courseDescription.substring(0, start) + `*${selectedText}*` + courseDescription.substring(end);
        newCursorPos = end + 2;
        break;
      case 'list':
        const lines = selectedText.split('\n');
        const bulletedLines = lines.map(line => line.trim() ? `• ${line}` : line).join('\n');
        newText = courseDescription.substring(0, start) + bulletedLines + courseDescription.substring(end);
        newCursorPos = start + bulletedLines.length;
        break;
      case 'link':
        Swal.fire({
          title: 'Insertar Hipervínculo',
          html: `
            <input id="link-text" class="swal2-input" placeholder="Texto del enlace" value="${selectedText}">
            <input id="link-url" class="swal2-input" placeholder="https://ejemplo.com">
          `,
          confirmButtonText: 'Insertar',
          confirmButtonColor: '#3B82F6',
          showCancelButton: true,
          cancelButtonText: 'Cancelar',
          preConfirm: () => {
            const text = (document.getElementById('link-text') as HTMLInputElement).value;
            const url = (document.getElementById('link-url') as HTMLInputElement).value;
            if (!url) {
              Swal.showValidationMessage('Por favor ingresa una URL');
              return false;
            }
            return { text: text || url, url };
          }
        }).then((result) => {
          if (result.isConfirmed && result.value) {
            const linkText = `[${result.value.text}](${result.value.url})`;
            const newText = courseDescription.substring(0, start) + linkText + courseDescription.substring(end);
            setCourseDescription(newText);
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start + linkText.length, start + linkText.length);
            }, 100);
          }
        });
        return; // Exit early for link since it's async
    }

    setCourseDescription(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      await Swal.fire({
        title: 'Archivo inválido',
        text: 'Por favor selecciona una imagen válida.',
        icon: 'error',
        confirmButtonColor: '#3B82F6',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      await Swal.fire({
        title: 'Archivo muy grande',
        text: 'La imagen no debe superar 5MB.',
        icon: 'error',
        confirmButtonColor: '#3B82F6',
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Convert image to Base64
      const reader = new FileReader();

      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        setCourseCoverImage(base64String);

        await Swal.fire({
          title: '¡Imagen subida!',
          text: 'La imagen de portada se ha actualizado correctamente.',
          icon: 'success',
          confirmButtonColor: '#3B82F6',
          timer: 2000,
        });

        setIsUploadingImage(false);
      };

      reader.onerror = async () => {
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo leer la imagen. Por favor intenta de nuevo.',
          icon: 'error',
          confirmButtonColor: '#3B82F6',
        });
        setIsUploadingImage(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo subir la imagen. Por favor intenta de nuevo.',
        icon: 'error',
        confirmButtonColor: '#3B82F6',
      });
      setIsUploadingImage(false);
    }
  };

  // Render markdown to HTML for preview
  const renderMarkdown = (text: string) => {
    // First escape HTML to prevent XSS (basic)
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Process lists (groups of lines starting with •)
    html = html.replace(/(?:^• .+(?:\n|$))+/gm, (match) => {
      const items = match.trim().split('\n').map(line => `<li>${line.substring(2)}</li>`).join('');
      return `<ul class="list-disc pl-5 mb-4">${items}</ul>`;
    });

    // Process other formatting
    html = html
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.+?)\*/g, '<em>$1</em>') // Italic
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>') // Links
      .replace(/\n/g, '<br>'); // Line breaks (remaining newlines)

    return html;
  };

  const handleSaveAll = async () => {
    // Validate required fields
    if (!courseTitle.trim()) {
      await Swal.fire({
        title: 'Campo requerido',
        text: 'El título del curso es obligatorio.',
        icon: 'error',
        confirmButtonColor: '#3B82F6',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      if (courseId) {
        // Update existing course
        updateCourse(courseId, {
          title: courseTitle,
          longDescription: courseDescription,
          status: courseStatus,
          specialty: courseSpecialty,
          category: courseCategory,
          difficulty: courseDifficulty,
          coverImage: courseCoverImage,
        });
      } else {
        // Create new course
        const newCourse = {
          id: Date.now(), // Temporary ID generation
          title: courseTitle,
          slug: courseTitle.toLowerCase().replace(/\s+/g, '-'),
          description: courseDescription.substring(0, 150),
          longDescription: courseDescription,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: courseStatus,
          specialty: courseSpecialty,
          category: courseCategory,
          difficulty: courseDifficulty,
          coverImage: courseCoverImage,
          coverGradient: 'from-blue-100 to-blue-300',
          enrolledStudents: 0,
          rating: 0,
          totalRatings: 0,
          duration: '4 semanas',
          totalModules: 0,
          totalLessons: 0,
          certificateEnabled: false,
          instructorId: 'INST001',
          price: 0,
        };
        addCourse(newCourse as any);
      }

      await Swal.fire({
        title: '¡Guardado exitoso!',
        text: 'Todos los cambios han sido guardados correctamente.',
        icon: 'success',
        confirmButtonColor: '#3B82F6',
        confirmButtonText: 'OK'
      });

      // Navigate back to course list after successful save
      if (onBack) {
        onBack();
      }
    } catch (error) {
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo guardar el curso.',
        icon: 'error',
        confirmButtonColor: '#3B82F6',
        confirmButtonText: 'OK'
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background-light p-4 md:p-8">
      <div className="max-w-[1000px] mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={handleDiscard}
                className="p-2 hover:bg-gray-100 rounded-lg text-text-muted"
                title="Volver"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-text-main text-2xl md:text-3xl font-bold font-display tracking-tight">
                  {courseTitle || 'Nuevo Curso'}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${courseStatus === 'PUBLICADO' ? 'bg-green-100 text-green-700 border border-green-200' :
                  courseStatus === 'CERRADO' ? 'bg-red-100 text-red-700 border border-red-200' :
                    'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  }`}>
                  {courseStatus}
                </span>
              </div>
              <p className="text-text-muted text-sm">Organiza los módulos, lecciones y materiales del curso.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Discard button removed as it is now handled by back button */}
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px] text-white">save</span>
              Guardar Todo
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border-light flex gap-6 overflow-x-auto">
          {['Información General', 'Plan de Estudios', 'Materiales', 'Estudiantes'].map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`pb-3 border-b-2 text-sm whitespace-nowrap ${i === activeTab ? 'border-primary text-primary font-bold' : 'border-transparent text-text-muted hover:text-text-main font-medium'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Course Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl p-6 border border-border-light shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <h3 className="text-lg font-bold text-text-main">Detalles del Curso</h3>
                </div>

                {/* Course Title */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-text-main mb-2">
                    Título del Curso
                  </label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="Ej: Neurología Clínica Avanzada: Del Diagnóstico al Tratamiento"
                    className="w-full px-4 py-2.5 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>

                {/* Long Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-text-main">
                      Descripción Larga
                    </label>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setShowPreview(false)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${!showPreview ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                      >
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Editar
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${showPreview ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                      >
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          Vista Previa
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="border border-border-light rounded-lg overflow-hidden">
                    {/* Toolbar - only show in edit mode */}
                    {!showPreview && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-border-light">
                        <button
                          type="button"
                          onClick={() => applyFormatting('bold')}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                          title="Negrita (Ctrl+B)">
                          <span className="material-symbols-outlined text-[18px]">format_bold</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('italic')}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                          title="Cursiva (Ctrl+I)">
                          <span className="material-symbols-outlined text-[18px]">format_italic</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('list')}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                          title="Lista con viñetas">
                          <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('link')}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                          title="Insertar hipervínculo">
                          <span className="material-symbols-outlined text-[18px]">link</span>
                        </button>
                      </div>
                    )}

                    {/* Editor / Preview */}
                    {!showPreview ? (
                      <textarea
                        ref={textareaRef}
                        value={courseDescription}
                        onChange={(e) => setCourseDescription(e.target.value)}
                        rows={15}
                        placeholder="Describe el contenido del curso, objetivos y lo que aprenderán los estudiantes..."
                        className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
                      />
                    ) : (
                      <div
                        className="w-full px-4 py-3 text-sm min-h-[300px] prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(courseDescription) }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-1">{courseDescription.length} caracteres</p>
                </div>
              </div>
            </div>

            {/* Right Column - Settings */}
            <div className="space-y-6">
              {/* Publication Status */}
              <div className="bg-white rounded-xl p-6 border border-border-light shadow-sm">
                <h3 className="text-sm font-bold text-text-main mb-4 uppercase tracking-wide">Publicación</h3>

                <button
                  onClick={() => setCourseStatus('PUBLICADO')}
                  className={`w-full p-4 rounded-lg border-2 mb-3 transition-all ${courseStatus === 'PUBLICADO'
                    ? 'border-green-500 bg-green-50'
                    : 'border-border-light hover:border-green-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-600">visibility</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-text-main text-sm">Publicado</div>
                      <div className="text-xs text-text-muted">Visible para todos los alumnos</div>
                    </div>
                    {courseStatus === 'PUBLICADO' && (
                      <span className="material-symbols-outlined text-primary fill-1">check_circle</span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setCourseStatus('BORRADOR')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${courseStatus === 'BORRADOR'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-border-light hover:border-yellow-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-yellow-600">draft</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-text-main text-sm">Borrador</div>
                      <div className="text-xs text-text-muted">Solo visible para administradores</div>
                    </div>
                    {courseStatus === 'BORRADOR' && (
                      <span className="material-symbols-outlined text-primary fill-1">check_circle</span>
                    )}
                  </div>
                </button>
              </div>

              {/* Classification */}
              <div className="bg-white rounded-xl p-6 border border-border-light shadow-sm">
                <h3 className="text-sm font-bold text-text-main mb-4 uppercase tracking-wide">Clasificación</h3>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-text-main mb-2">
                    Especialidad
                  </label>
                  <select
                    value={courseSpecialty}
                    onChange={(e) => setCourseSpecialty(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  >
                    {availableSpecialties.length > 0 ? (
                      availableSpecialties.map((spec, idx) => (
                        <option key={idx} value={spec}>{spec}</option>
                      ))
                    ) : (
                      // Fallback options if state not ready (though state init array empty)
                      <>
                        <option value="Neurología Clínica">Neurología Clínica</option>
                        <option value="Neurocirugía">Neurocirugía</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-text-main">
                      Categoría
                    </label>
                    <button
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Editar
                    </button>
                  </div>
                  <select
                    value={courseCategory}
                    onChange={(e) => setCourseCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  >
                    {availableCategories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <CategoryManagerModal
                  isOpen={isCategoryModalOpen}
                  onClose={() => setIsCategoryModalOpen(false)}
                  categories={availableCategories}
                  onUpdateCategories={setAvailableCategories}
                />

                <div>
                  <label className="block text-sm font-semibold text-text-main mb-2">
                    Nivel de Dificultad
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setCourseDifficulty('BASICO')}
                      className={`px-1 py-2 rounded-lg text-xs font-semibold transition-all ${courseDifficulty === 'BASICO'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                        }`}
                    >
                      Básico
                    </button>
                    <button
                      onClick={() => setCourseDifficulty('MEDIO')}
                      className={`px-1 py-2 rounded-lg text-xs font-semibold transition-all ${courseDifficulty === 'MEDIO'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                        }`}
                    >
                      Medio
                    </button>
                    <button
                      onClick={() => setCourseDifficulty('AVANZADO')}
                      className={`px-1 py-2 rounded-lg text-xs font-semibold transition-all ${courseDifficulty === 'AVANZADO'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                        }`}
                    >
                      Avanzado
                    </button>
                  </div>
                </div>

                {/* Cover Image Section */}
                <div className="bg-white rounded-xl p-6 border border-border-light shadow-sm mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary">image</span>
                    <h3 className="text-lg font-bold text-text-main">Imagen de Portada</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Image Preview */}
                    <div className="relative w-full aspect-video bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg overflow-hidden border-2 border-dashed border-blue-200">
                      {courseCoverImage ? (
                        <img
                          src={courseCoverImage}
                          alt="Portada del curso"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <span className="material-symbols-outlined text-[48px] mb-2">add_photo_alternate</span>
                          <p className="text-sm font-medium">Sin imagen de portada</p>
                        </div>
                      )}
                    </div>

                    {/* Upload Button */}
                    <div>
                      <input
                        type="file"
                        id="cover-image-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploadingImage}
                      />
                      <label
                        htmlFor="cover-image-upload"
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-medium transition-colors ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">upload</span>
                        {isUploadingImage ? 'Subiendo...' : 'Cambiar Imagen'}
                      </label>
                      <p className="text-xs text-text-muted mt-2 text-center">
                        Formatos: JPG, PNG, WEBP • Máx. 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 1 && <StudyPlanTab />}
        {activeTab === 2 && <MaterialsTab />}
        {activeTab === 3 && <StudentsTab />}

        <div className="h-20"></div>
      </div>
    </div>
  );
};

// ========== TAB 0: INFORMACIÓN GENERAL ==========
const GeneralInfoTab: React.FC = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Column - Course Details */}
      <div className="flex-1 bg-white p-6 rounded-xl border border-border-light shadow-sm">
        <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">description</span>
          Detalles del Curso
        </h2>

        {/* Título del Curso */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-main mb-2">Título del Curso</label>
          <input
            type="text"
            defaultValue="Neurología Clínica Avanzada: Del Diagnóstico al Tratamiento"
            className="w-full px-4 py-2.5 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
        </div>

        {/* Descripción Larga */}
        <div>
          <label className="block text-sm font-semibold text-text-main mb-2">Descripción Larga</label>
          <div className="border border-border-light rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b border-border-light flex gap-2">
              <button className="p-1.5 hover:bg-gray-200 rounded text-text-muted"><span className="font-bold text-sm">B</span></button>
              <button className="p-1.5 hover:bg-gray-200 rounded text-text-muted"><span className="italic text-sm">I</span></button>
              <button className="p-1.5 hover:bg-gray-200 rounded text-text-muted"><span className="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
              <button className="p-1.5 hover:bg-gray-200 rounded text-text-muted"><span className="material-symbols-outlined text-[18px]">link</span></button>
              <button className="p-1.5 hover:bg-gray-200 rounded text-text-muted"><span className="material-symbols-outlined text-[18px]">format_quote</span></button>
            </div>
            <textarea
              className="w-full px-4 py-3 min-h-[200px] focus:outline-none text-sm text-text-main resize-none"
              defaultValue="Este curso integral está diseñado para especialistas que buscan profundizar en las técnicas diagnósticas más recientes y los protocolos terapéuticos de vanguardia en la práctica neurológica actual.

A lo largo de los módulos, exploraremos:
• Avances en neuroimagen funcional.
• Manejo terapéutico de patologías neurodegenerativas.
• Casos prácticos y discusión de dilemas diagnósticos."
            />
          </div>
        </div>
      </div>

      {/* Right Column - Settings */}
      <div className="lg:w-80 flex flex-col gap-6">
        {/* Publicación */}
        <div className="bg-white p-4 rounded-xl border border-border-light shadow-sm">
          <h3 className="text-sm font-bold text-text-main mb-3 uppercase tracking-wide">Publicación</h3>
          <div className="space-y-3">
            <div className="p-3 border-2 border-blue-600 rounded-lg bg-blue-50/50 flex items-center gap-3 cursor-pointer">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">visibility</span>
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-text-main">Publicado</div>
                <div className="text-xs text-text-muted">Visible para todos los alumnos</div>
              </div>
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[16px]">check</span>
              </div>
            </div>
            <div className="p-3 border border-border-light rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-50">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-text-muted">
                <span className="material-symbols-outlined">edit_note</span>
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-text-main">Borrador</div>
                <div className="text-xs text-text-muted">Solo visible para administradores</div>
              </div>
            </div>
          </div>
        </div>

        {/* Clasificación */}
        <div className="bg-white p-4 rounded-xl border border-border-light shadow-sm">
          <h3 className="text-sm font-bold text-text-main mb-3 uppercase tracking-wide">Clasificación</h3>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-text-muted mb-2">Categoría</label>
            <select className="w-full px-3 py-2 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Neurología Clínica</option>
              <option>Pediatría</option>
              <option>Cirugía</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-2">Nivel de Dificultad</label>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg border border-border-light text-text-muted hover:bg-gray-50">Básico</button>
              <button className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white">Medio</button>
              <button className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg border border-border-light text-text-muted hover:bg-gray-50">Avanzado</button>
            </div>
          </div>
        </div>

        {/* Imagen de Portada */}
        <div className="bg-white p-4 rounded-xl border border-border-light shadow-sm">
          <h3 className="text-sm font-bold text-text-main mb-3 uppercase tracking-wide">Imagen de Portada</h3>
          <div className="relative aspect-video bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg overflow-hidden flex items-center justify-center">
            <button className="px-4 py-2 bg-white rounded-lg shadow-md text-sm font-semibold text-text-main hover:bg-gray-50 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">upload</span>
              Cambiar imagen
            </button>
          </div>
          <p className="text-xs text-text-muted mt-2">Formatos sugeridos: JPG, PNG. Tamaño recomendado: 1200x675px (16:9)</p>
        </div>
      </div>
    </div>
  );
};

// ========== TAB 1: PLAN DE ESTUDIOS (ACTUAL) ==========
const StudyPlanTab: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-border-light shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">view_timeline</span>
            Estructura del Contenido
          </h2>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 bg-blue-50 text-primary rounded-full">3 Módulos</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm font-medium text-text-muted bg-white border border-border-light rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">visibility</span> Vista Previa
          </button>
          <button className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-white">add</span> Nuevo Módulo
          </button>
        </div>
      </div>

      {/* Module 1 */}
      <div className="bg-white border border-border-light rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-50/80 p-4 flex items-center gap-3 border-b border-border-light cursor-pointer">
          <span className="material-symbols-outlined text-text-muted/50 cursor-move">drag_indicator</span>
          <div className="flex-1 flex items-center gap-3">
            <h3 className="font-bold text-text-main text-base">Módulo 1: Introducción a la Neuropatología</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide border border-green-200">Publicado</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 text-text-muted hover:text-primary"><span className="material-symbols-outlined text-[20px]">edit</span></button>
            <button className="p-2 text-text-muted hover:text-red-600"><span className="material-symbols-outlined text-[20px]">delete</span></button>
            <button className="p-2 text-text-main"><span className="material-symbols-outlined text-[24px]">expand_less</span></button>
          </div>
        </div>

        <div className="p-2 bg-white flex flex-col gap-2">
          {/* Lesson 1 */}
          <div className="flex items-center p-3 rounded-lg border border-transparent hover:border-border-light hover:bg-surface-hover group relative">
            <span className="material-symbols-outlined text-text-muted/30 cursor-move mr-3">drag_indicator</span>
            <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary border border-blue-100 shrink-0">
              <span className="material-symbols-outlined">play_circle</span>
            </div>
            <div className="ml-4 flex-1">
              <h4 className="text-sm font-semibold text-text-main">Bienvenida y Objetivos del Curso</h4>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-text-muted">
                <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded"><span className="material-symbols-outlined text-[14px]">schedule</span> 05:20</span>
                <span className="flex items-center gap-1 text-orange-600 font-medium bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100"><span className="material-symbols-outlined text-[14px] fill-1">verified</span> Obligatorio</span>
              </div>
            </div>
          </div>

          {/* Lesson 2 */}
          <div className="flex items-center p-3 rounded-lg border border-transparent hover:border-border-light hover:bg-surface-hover group relative">
            <span className="material-symbols-outlined text-text-muted/30 cursor-move mr-3">drag_indicator</span>
            <div className="size-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 shrink-0">
              <span className="material-symbols-outlined">article</span>
            </div>
            <div className="ml-4 flex-1">
              <h4 className="text-sm font-semibold text-text-main">Lectura: Historia Clínica Neurológica</h4>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-text-muted">
                <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded"><span className="material-symbols-outlined text-[14px]">schedule</span> 15 min</span>
                <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">PDF descargable</span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-3 pb-2 border-t border-dashed border-gray-200 text-center">
            <p className="text-xs text-text-muted mb-2 font-medium">Añadir contenido al módulo</p>
            <div className="flex gap-2 justify-center">
              <button className="px-3 py-2 rounded-lg text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">play_circle</span> Video
              </button>
              <button className="px-3 py-2 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-100 flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">article</span> Lectura
              </button>
              <button className="px-3 py-2 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">quiz</span> Quiz
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Module 2 (Collapsed) */}
      <div className="bg-white border border-border-light rounded-xl shadow-sm overflow-hidden">
        <div className="bg-white p-4 flex items-center gap-3 select-none group hover:bg-gray-50/50 cursor-pointer">
          <span className="material-symbols-outlined text-text-muted/50 cursor-move">drag_indicator</span>
          <div className="flex-1 flex items-center gap-3">
            <h3 className="font-bold text-text-main text-base">Módulo 2: Neuroimagen Avanzada</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide border border-green-200">Publicado</span>
          </div>
          <button className="p-2 text-text-main"><span className="material-symbols-outlined text-[24px]">expand_more</span></button>
        </div>
      </div>
    </div>
  );
};

// ========== TAB 2: MATERIALES ==========
const MaterialsTab: React.FC = () => {
  const materials = [
    { name: 'Guía de Examen Neurológico.pdf', size: '2.4 MB', module: 'Módulo 1', date: '12 Oct 2023', type: 'pdf', color: 'red' },
    { name: 'Atlas de Resonancia Magnética - Tomo I.pdf', size: '18.7 MB', module: 'Módulo 2', date: '14 Oct 2023', type: 'pdf', color: 'red' },
    { name: 'Casos de Estudio: Esclerosis Múltiple.docx', size: '1.2 MB', module: 'Módulo 3', date: '15 Oct 2023', type: 'doc', color: 'orange' },
    { name: 'Tabla de Dosis Farmacológicas.xlsx', size: '0.5 MB', module: 'Módulo 1', date: '18 Oct 2023', type: 'excel', color: 'green' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Upload Area */}
      <div className="bg-white p-8 rounded-xl border-2 border-dashed border-border-light text-center">
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-600 text-[32px]">cloud_upload</span>
          </div>
        </div>
        <h3 className="text-lg font-bold text-text-main mb-2">Arrastra y suelta tus archivos aquí</h3>
        <p className="text-sm text-text-muted mb-4">o haz clic para seleccionar desde tu ordenador (Máx. 50MB)</p>
        <p className="text-xs text-text-muted mb-4">Soportado: PDF, DOCX, PPTX, JPG, PNG, MP4</p>
        <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2 mx-auto">
          <span className="material-symbols-outlined text-[20px]">upload</span>
          Subir Archivo
        </button>
      </div>

      {/* Filter and List */}
      <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-light flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted">Filtrar por Módulo:</span>
            <select className="px-3 py-1.5 border border-border-light rounded-lg text-sm">
              <option>Todos los módulos</option>
              <option>Módulo 1</option>
              <option>Módulo 2</option>
              <option>Módulo 3</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-text-main">{materials.length} Archivos totales</span>
            <button className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-blue-50 rounded-lg flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">sort</span>
              Organizar
            </button>
          </div>
        </div>

        <div className="divide-y divide-border-light">
          {materials.map((file, idx) => (
            <div key={idx} className="p-4 hover:bg-gray-50/50 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg bg-${file.color}-50 flex items-center justify-center shrink-0`}>
                <span className="material-symbols-outlined text-[24px] text-red-600">
                  {file.type === 'pdf' ? 'picture_as_pdf' : file.type === 'doc' ? 'description' : 'table_chart'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-text-main truncate">{file.name}</h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                  <span>{file.size}</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">folder</span> {file.module}</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {file.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-text-muted hover:text-primary"><span className="material-symbols-outlined text-[20px]">download</span></button>
                <button className="p-2 text-text-muted hover:text-red-600"><span className="material-symbols-outlined text-[20px]">delete</span></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ========== TAB 3: ESTUDIANTES ==========
const StudentsTab: React.FC = () => {
  const students = [
    { name: 'Dr. Alejandro Arriaga', email: 'ale.arriaga@email.com', initials: 'AA', color: 'blue', enrolled: '12 May, 2024', progress: 85, grade: 9.2, status: 'ACTIVO' },
    { name: 'Dra. María Sánchez', email: 'm.sanchez@hospital.org', initials: 'MS', color: 'purple', enrolled: '08 May, 2024', progress: 100, grade: 9.8, status: 'COMPLETADO' },
    { name: 'Ricardo Castillo', email: 'r.castillo.neuro@unit.edu.mx', initials: 'RC', color: 'orange', enrolled: '15 Abr, 2024', progress: 42, grade: 7.5, status: 'ACTIVO' },
    { name: 'Laura Ruiz', email: 'l.ruiz.neuro@gmail.com', initials: 'LR', color: 'teal', enrolled: '02 May, 2024', progress: 12, grade: 8.0, status: 'ACTIVO' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl border border-border-light shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
          <input
            type="text"
            placeholder="Buscar estudiante por nombre o email..."
            className="w-full pl-10 pr-4 py-2.5 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-blue-600">128 Estudiantes Inscritos</span>
          <select className="px-3 py-2 border border-border-light rounded-lg text-sm">
            <option>Todos los estados</option>
            <option>Activo</option>
            <option>Completado</option>
          </select>
          <button className="p-2 text-text-muted hover:text-primary">
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-border-light">
                <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Nombre del Estudiante</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Inscripción</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Progreso (%)</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Calificación<br />Promedio</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Acc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {students.map((student, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-${student.color}-100 flex items-center justify-center text-${student.color}-700 font-bold text-sm shrink-0`}>
                        {student.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-text-main">{student.name}</div>
                        <div className="text-xs text-text-muted">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-text-muted">{student.enrolled}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${student.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-text-main w-10 text-right">{student.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-bold text-text-main">{student.grade}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${student.status === 'COMPLETADO'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                      }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button className="p-1.5 text-text-muted hover:text-primary">
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border-light flex items-center justify-between">
          <span className="text-sm text-text-muted">Mostrando 1-4 de 128 estudiantes</span>
          <div className="flex items-center gap-2">
            <button className="p-2 text-text-muted hover:text-primary"><span className="material-symbols-outlined">chevron_left</span></button>
            <button className="w-8 h-8 rounded-lg bg-blue-600 text-white font-semibold text-sm">1</button>
            <button className="w-8 h-8 rounded-lg text-text-muted hover:bg-gray-100 font-semibold text-sm">2</button>
            <button className="w-8 h-8 rounded-lg text-text-muted hover:bg-gray-100 font-semibold text-sm">3</button>
            <button className="p-2 text-text-muted hover:text-primary"><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-border-light shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 text-[28px]">bar_chart</span>
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase font-semibold mb-1">Progreso Promedio</div>
              <div className="text-2xl font-bold text-text-main">64.5%</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border-light shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 text-[28px]">workspace_premium</span>
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase font-semibold mb-1">Estudiantes Certificados</div>
              <div className="text-2xl font-bold text-text-main">18</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border-light shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-600 text-[28px]">star</span>
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase font-semibold mb-1">Calificación Global</div>
              <div className="text-2xl font-bold text-text-main">8.7/10</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseEditor;