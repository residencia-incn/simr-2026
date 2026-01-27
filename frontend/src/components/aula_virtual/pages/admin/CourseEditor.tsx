import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import CategoryManagerModal from './CategoryManagerModal';
import ContentSelectorModal from './ContentSelectorModal';
import CourseContentPreview from './CourseContentPreview';
import { useAulaVirtual } from '../../context/AulaVirtualContext';
import { api, canUserAccessCourse } from '../../../../services/api';
import TabRules from './tabs/TabRules';
import TabEnrolled from './tabs/TabEnrolled';


interface CourseEditorProps {
  onBack?: () => void;
  courseId?: number | string | null;
  onUnsavedChanges?: (hasChanges: boolean) => void;
  allModalities?: any[];
  allWorkshops?: any[];
  allRoles?: any[];
}

const InstructorSelectionModal = ({ isOpen, onClose, onSelect }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [isOpen]);

  // Search Logic
  useEffect(() => {
    const doSearch = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await api.users.search(searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeout = setTimeout(doSearch, 300); // Debounce
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-text-main">Importar Instructor</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-text-muted hover:text-text-main">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 ml-1">
            Min. 2 caracteres para buscar. Se buscará en todo el directorio de usuarios.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
              <p>Buscando...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {searchResults.map(user => (
                <div
                  key={user.id}
                  onClick={() => { onSelect(user); onClose(); }}
                  className="p-4 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg cursor-pointer transition-all group flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden">
                    {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : (user.name ? user.name[0] : 'U')}
                  </div>
                  <div>
                    <h4 className="font-bold text-text-main group-hover:text-blue-700 transition-colors">{user.name}</h4>
                    <p className="text-sm text-text-muted">{(user as any).occupation || user.specialty || 'Sin ocupación'} • {user.email}</p>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm">Seleccionar</span>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm.length >= 2 ? (
            <div className="p-12 text-center text-text-muted flex flex-col items-center justify-center h-full">
              <span className="material-symbols-outlined text-[48px] mb-2 opacity-20">search_off</span>
              <p>No se encontraron usuarios.</p>
            </div>
          ) : (
            <div className="p-12 text-center text-text-muted flex flex-col items-center justify-center h-full">
              <span className="material-symbols-outlined text-[48px] mb-2 opacity-20">person_search</span>
              <p>Ingresa un nombre para buscar instructores.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CourseEditor: React.FC<CourseEditorProps> = ({ onBack, courseId, onUnsavedChanges, allModalities = [], allWorkshops = [], allRoles = [] }) => {
  const { getCourseById, addCourse, updateCourse, exams, getModulesByCourseId } = useAulaVirtual();
  const [activeTab, setActiveTab] = useState(0); // Información General por defecto

  // Course General Information State
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseStatus, setCourseStatus] = useState<'PUBLICADO' | 'BORRADOR' | 'CERRADO'>('BORRADOR');
  const [courseSpecialty, setCourseSpecialty] = useState('Neurología Clínica');
  const [courseCategory, setCourseCategory] = useState('Curso');
  const [courseDifficulty, setCourseDifficulty] = useState<'BASICO' | 'MEDIO' | 'AVANZADO'>('MEDIO');
  const [courseCoverImage, setCourseCoverImage] = useState<string | null>(null);
  const [showContentPreview, setShowContentPreview] = useState(false); // For Modal (Plan de Estudios)
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false); // For Description Toggle (General)
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Specialty State (Old Category)
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);

  // Category State (New Type)
  const [availableCategories, setAvailableCategories] = useState<string[]>(['Curso', 'Taller', 'Congreso', 'Diplomado']);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // --- DYNAMIC MODULES STATE (New) ---
  // --- DYNAMIC MODULES STATE (New) ---
  const [modules, setModules] = useState<any[]>([]);

  // --- MATERIALS STATE (New) ---
  const [materials, setMaterials] = useState<any[]>([]);

  // --- ACCESS CONFIG STATE (New) ---
  // --- ACCESS CONFIG STATE (New) ---
  const [accessConfig, setAccessConfig] = useState<{
    allowed_modality_ids: string[];
    linked_workshop_id: string | number | null;
    allowed_vip_roles?: string[];
  }>({
    allowed_modality_ids: [],
    linked_workshop_id: null,
    allowed_vip_roles: []
  });

  // Master lists (modalities, workshops) are now received via props (allModalities, allWorkshops)

  // --- FINAL EXAM STATE (New) ---
  const [includeFinalExam, setIncludeFinalExam] = useState(false);
  const [finalExamId, setFinalExamId] = useState<string | number>('');
  const [finalExamCondition, setFinalExamCondition] = useState<'completion' | 'date'>('completion');
  const [finalExamDate, setFinalExamDate] = useState('');
  const [closingDate, setClosingDate] = useState('');


  // --- INSTRUCTOR STATE (New) ---
  const [instructorId, setInstructorId] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [instructorSpecialty, setInstructorSpecialty] = useState('');
  const [instructorInstitution, setInstructorInstitution] = useState('');
  const [instructorDescription, setInstructorDescription] = useState('');



  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);

  const handleImportInstructor = (user: any) => {
    setInstructorId(user.id);
    setInstructorName(user.name);
    setInstructorSpecialty(user.specialty || '');
    setInstructorInstitution((user as any).institution || '');
  };




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
      const course = getCourseById(courseId as any);
      if (course) {
        const loadedSpecialty = (course as any).specialty || (course as any).category || 'Neurología Clínica';
        const loadedCategory = (course as any).category === loadedSpecialty ? 'Curso' : ((course as any).category || 'Curso');

        setCourseTitle(course.title);
        setCourseDescription(course.longDescription || '');
        setCourseStatus((course.status as 'PUBLICADO' | 'BORRADOR' | 'CERRADO') || 'BORRADOR');
        setCourseSpecialty(loadedSpecialty);
        setCourseCategory(loadedCategory);
        setCourseDifficulty((course.difficulty as 'BASICO' | 'MEDIO' | 'AVANZADO') || 'MEDIO');
        setCourseCoverImage(course.coverImage || null);

        // Load modules using the helper that supports both V1 (flat) and V2 (nested) structures
        const courseModules = getModulesByCourseId(course.id as any);
        setModules(courseModules);

        // Load materials if they exist
        if ((course as any).materials) {
          setMaterials((course as any).materials);
        }

        // Set original values for comparison
        setOriginalValues({
          title: course.title,
          description: course.longDescription || '',
          status: (course.status as 'PUBLICADO' | 'BORRADOR' | 'CERRADO') || 'BORRADOR',
          specialty: loadedSpecialty,
          category: loadedCategory,
          difficulty: (course.difficulty as 'BASICO' | 'MEDIO' | 'AVANZADO') || 'MEDIO',
          coverImage: course.coverImage || null,
        });

        // Load access config from new backend fields or legacy
        const backendModalities = (course as any).allowed_modality_ids;
        const backendWorkshop = (course as any).linked_workshop_id;

        if (backendModalities || backendWorkshop !== undefined) {
          setAccessConfig({
            allowed_modality_ids: backendModalities || [],
            linked_workshop_id: backendWorkshop || null
          });
        } else if ((course as any).accessConfig) {
          // Legacy fallback (attempt to map if possible, or just reset)
          setAccessConfig({
            allowed_modality_ids: [],
            linked_workshop_id: null
          });
        }

        // Load Instructor Data
        if ((course as any).instructorId || (course as any).instructor) {
          const iId = (course as any).instructorId || (course as any).instructor?.id;
          // Note: In real system, we'd fetch the instructor if not in state
          setInstructorId(iId);
          setInstructorName((course as any).instructorName || '');
          setInstructorSpecialty((course as any).instructorSpecialty || '');
          setInstructorInstitution((course as any).instructorInstitution || '');
          // Load persisted description if available
          if ((course as any).instructorDescription) {
            setInstructorDescription((course as any).instructorDescription);
          }
        }

        // Load final exam data
        // Load final exam data
        if ((course as any).finalExamId) {
          setIncludeFinalExam(true);
          setFinalExamId((course as any).finalExamId);
          setFinalExamCondition((course as any).finalExamCondition || 'completion');
          setFinalExamDate((course as any).finalExamDate || '');
        }

        // Load closing date
        if ((course as any).closingDate) {
          setClosingDate((course as any).closingDate);
        }
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
        newText = courseDescription.substring(0, start) + `** ${selectedText}** ` + courseDescription.substring(end);
        newCursorPos = end + 4;
        break;
      case 'italic':
        newText = courseDescription.substring(0, start) + `* ${selectedText}* ` + courseDescription.substring(end);
        newCursorPos = end + 2;
        break;
      case 'list':
        const lines = selectedText.split('\n');
        const bulletedLines = lines.map(line => line.trim() ? `• ${line} ` : line).join('\n');
        newText = courseDescription.substring(0, start) + bulletedLines + courseDescription.substring(end);
        newCursorPos = start + bulletedLines.length;
        break;
      case 'link':
        Swal.fire({
          title: 'Insertar Hipervínculo',
          html: `
  < input id = "link-text" class="swal2-input" placeholder = "Texto del enlace" value = "${selectedText}" >
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

    // Calculate derived stats
    const calculatedTotalModules = modules.length;
    const calculatedTotalLessons = modules.reduce((acc, mod) => acc + (mod.items?.length || 0), 0);
    // Rough estimation: 1 week per module
    // Rough estimation: 1 week per module
    const calculatedDuration = `${Math.max(4, calculatedTotalModules)} semanas`;

    // Calculate Qualified Students matching Access Configuration
    const calculatedEnrolledStudents = 0; // Temporarily 0 until real count logic implemented

    try {
      if (courseId) {
        // Update existing course
        updateCourse(courseId as any, {
          title: courseTitle,
          longDescription: courseDescription,
          status: courseStatus,
          specialty: courseSpecialty,
          category: courseCategory,
          difficulty: courseDifficulty,
          coverImage: courseCoverImage,

          modules: modules, // Save modules state
          materials: materials, // Save materials state
          accessConfig: accessConfig, // Keep for legacy/frontend state
          // Map to new Backend Fields
          allowed_modality_ids: accessConfig.allowed_modality_ids,
          linked_workshop_id: accessConfig.linked_workshop_id,
          instructorId: instructorId,
          instructorName: instructorName,
          instructorSpecialty: instructorSpecialty,
          instructorInstitution: instructorInstitution,
          instructorDescription: instructorDescription,
          finalExamId: includeFinalExam ? finalExamId : null, // Save final exam ID if included
          finalExamCondition: includeFinalExam ? finalExamCondition : 'completion',

          finalExamDate: includeFinalExam && finalExamCondition === 'date' ? finalExamDate : null,
          closingDate: closingDate || null,
          enrolledStudents: calculatedEnrolledStudents,
          // Update stats
          totalModules: calculatedTotalModules,
          totalLessons: calculatedTotalLessons,
          duration: calculatedDuration,
        } as any);
      } else {
        // Create new course
        const newCourse = {
          id: `Cu_${Date.now()}`, // Standardized Course ID format
          title: courseTitle,
          slug: courseTitle.toLowerCase().replace(/\s+/g, '-'),
          description: courseDescription.substring(0, 150) + '...',
          longDescription: courseDescription,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: courseStatus,
          specialty: courseSpecialty,
          category: courseCategory,
          difficulty: courseDifficulty,
          coverImage: courseCoverImage,

          enrolledStudents: calculatedEnrolledStudents,
          rating: 0,
          totalRatings: 0,
          duration: calculatedDuration,
          totalModules: calculatedTotalModules,
          totalLessons: calculatedTotalLessons,
          certificateEnabled: true,
          instructorId: instructorId,
          instructorName: instructorName,
          instructorSpecialty: instructorSpecialty,
          instructorInstitution: instructorInstitution,
          instructorDescription: instructorDescription,
          finalExamId: includeFinalExam ? finalExamId : null,
          finalExamCondition: includeFinalExam ? finalExamCondition : 'completion',
          finalExamDate: includeFinalExam && finalExamCondition === 'date' ? finalExamDate : null,
          closingDate: closingDate || null,
          price: 0,
          modules: modules,
          materials: materials,
          accessConfig: accessConfig,
          allowed_modality_ids: accessConfig.allowed_modality_ids,
          linked_workshop_id: accessConfig.linked_workshop_id,

        } as any;
        addCourse(newCourse);
      }

      // Update original values to prevent unsaved changes warning
      setOriginalValues({
        title: courseTitle,
        description: courseDescription,
        status: courseStatus,
        specialty: courseSpecialty,
        category: courseCategory,
        difficulty: courseDifficulty,
        coverImage: courseCoverImage,
      });

      if (onUnsavedChanges) onUnsavedChanges(false);

      await Swal.fire({
        title: '¡Guardado!',
        text: 'El curso se ha guardado correctamente.',
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
                {courseId && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 font-mono">
                    ID: {courseId}
                  </span>
                )}
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
          {['Información General', 'Plan de Estudios', 'Materiales', 'Configuración / Reglas', 'Inscritos / Estudiantes'].map((tab, i) => (
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
                        onClick={() => setShowDescriptionPreview(false)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${!showDescriptionPreview ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                      >
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Editar
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDescriptionPreview(true)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${showDescriptionPreview ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
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
                    {/* Toolbar - only show in edit mode */}
                    {!showDescriptionPreview && (
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
                    {!showDescriptionPreview ? (
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
                </div>
              </div>

              {/* Instructor Card */}
              {/* Instructor Card */}
              <div className="bg-white rounded-xl p-6 border border-border-light shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">school</span>
                  <h3 className="text-lg font-bold text-text-main">Instructor</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-semibold text-text-main">
                        Instructor
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={instructorName}
                        onChange={(e) => setInstructorName(e.target.value)}
                        placeholder="Nombre del Instructor"
                        className="flex-1 px-4 py-2.5 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                      <button
                        onClick={() => setIsInstructorModalOpen(true)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 border border-blue-200"
                      >
                        <span className="material-symbols-outlined text-[18px]">person_search</span>
                        Importar
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-2">
                      Especialidad
                    </label>
                    <input
                      type="text"
                      value={instructorSpecialty}
                      onChange={(e) => setInstructorSpecialty(e.target.value)}
                      placeholder="Ej: Neurocirugía"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-border-light rounded-lg text-sm text-gray-600 focus:outline-none focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-2">
                      Lugar de Trabajo / Institución
                    </label>
                    <input
                      type="text"
                      value={instructorInstitution}
                      onChange={(e) => setInstructorInstitution(e.target.value)}
                      placeholder="Ej: Hospital Rebagliati"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-border-light rounded-lg text-sm text-gray-600 focus:outline-none focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-main mb-2">
                    Descripción del Instructor
                  </label>
                  <textarea
                    value={instructorDescription}
                    onChange={(e) => setInstructorDescription(e.target.value)}
                    rows={4}
                    placeholder="Reseña breve sobre la experiencia del instructor..."
                    className="w-full px-4 py-2.5 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                  />
                </div>

                <InstructorSelectionModal
                  isOpen={isInstructorModalOpen}
                  onClose={() => setIsInstructorModalOpen(false)}
                  onSelect={handleImportInstructor}
                />
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
        {activeTab === 1 && (
          <StudyPlanTab
            courseTitle={courseTitle}
            modules={modules}
            setModules={setModules}
            onPreview={() => setShowContentPreview(true)}
            includeFinalExam={includeFinalExam}
            setIncludeFinalExam={setIncludeFinalExam}
            exams={exams}
            finalExamId={finalExamId}
            setFinalExamId={setFinalExamId}
            finalExamCondition={finalExamCondition}
            setFinalExamCondition={setFinalExamCondition}
            finalExamDate={finalExamDate}
            setFinalExamDate={setFinalExamDate}
            closingDate={closingDate}
            setClosingDate={setClosingDate}
          />
        )}
        {activeTab === 2 && <MaterialsTab materials={materials} setMaterials={setMaterials} modules={modules} />}
        {activeTab === 3 && (
          <TabRules
            formData={accessConfig}
            setFormData={setAccessConfig}
            allModalities={allModalities || []}
            allWorkshops={allWorkshops || []}
            allRoles={allRoles || []}
          />
        )}
        {activeTab === 4 && (
          <TabEnrolled courseId={courseId ?? null} />
        )}<div className="h-20"></div>
      </div>

      {/* Preview Modal */}
      {
        showContentPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">visibility</span>
                  Vista Previa del Estudiante
                </h3>
                <button
                  onClick={() => setShowContentPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 overflow-y-auto bg-gray-50">
                <div className="max-w-3xl mx-auto">
                  <div className="mb-6 bg-blue-50 text-blue-800 px-4 py-3 rounded-lg text-sm flex items-start gap-3 border border-blue-100">
                    <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
                    <p>Esta es una vista preliminar de cómo verán los estudiantes el contenido del curso. Algunas interacciones pueden estar deshabilitadas.</p>
                  </div>
                  {/* Use modules from component state */}
                  <CourseContentPreview modules={modules} />
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex justify-end bg-white">
                <button
                  onClick={() => setShowContentPreview(false)}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Cerrar Vista Previa
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};





// ========== TAB 0: INFORMACION GENERAL ==========
const GeneralInfoTab: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Form */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-xl border border-border-light shadow-sm">
          <h2 className="text-lg font-bold text-text-main mb-4">Detalles del Curso</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-muted mb-1">Título del Curso</label>
              <input
                type="text"
                defaultValue="Neurología Clínica Avanzada"
                className="w-full px-4 py-2 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-main font-semibold"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-muted mb-1">Descripción Corta</label>
              <textarea
                className="w-full px-4 py-2 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-main resize-none"
                rows={2}
                defaultValue="Este curso integral está diseñado para especialistas que buscan profundizar en las técnicas diagnósticas más recientes."
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border-light shadow-sm">
          <h2 className="text-lg font-bold text-text-main mb-4"> Contenido y Descripción </h2>
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

// ========== TAB 1: PLAN DE ESTUDIOS (DYNAMIC WITH DND) ==========
// ========== TAB 1: PLAN DE ESTUDIOS (DYNAMIC WITH DND) ==========
interface StudyPlanTabProps {
  courseTitle: string;
  modules: any[];
  setModules: React.Dispatch<React.SetStateAction<any[]>>;
  onPreview: () => void;
  includeFinalExam: boolean;
  setIncludeFinalExam: (value: boolean) => void;
  exams: any[];
  finalExamId: string | number;
  setFinalExamId: (id: string | number) => void;
  finalExamCondition: 'completion' | 'date';
  setFinalExamCondition: (value: 'completion' | 'date') => void;
  finalExamDate: string;
  setFinalExamDate: (value: string) => void;
  closingDate: string;
  setClosingDate: (value: string) => void;
}

const StudyPlanTab: React.FC<StudyPlanTabProps> = ({
  courseTitle,
  modules,
  setModules,
  onPreview,
  includeFinalExam,
  setIncludeFinalExam,
  exams,
  finalExamId,
  setFinalExamId,
  finalExamCondition,
  setFinalExamCondition,
  finalExamDate,
  setFinalExamDate,
  closingDate,
  setClosingDate
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [contentTypeToAdd, setContentTypeToAdd] = useState<'video' | 'reading' | 'quiz' | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [isSelectingFinalExam, setIsSelectingFinalExam] = useState(false); // State for final exam selection context

  // DnD States
  const [draggedModuleIndex, setDraggedModuleIndex] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ moduleId: number, index: number } | null>(null);

  // --- Module Management ---
  const openModuleModal = (moduleToEdit: any = null) => {
    Swal.fire({
      title: moduleToEdit ? 'Editar Módulo' : 'Nuevo Módulo',
      html: `
        <div class="flex flex-col gap-5 text-left pt-2">
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Nombre del Módulo</label>
            <input 
                id="swal-input-name" 
                class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400" 
                placeholder="Ej: Módulo 3: Casos Clínicos" 
                value="${moduleToEdit ? moduleToEdit.name : ''}"
            >
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Estado</label>
            <div class="relative">
                <select 
                    id="swal-input-status" 
                    class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                    <option value="BORRADOR" ${moduleToEdit?.status === 'BORRADOR' ? 'selected' : ''}>BORRADOR</option>
                    <option value="PUBLICADO" ${moduleToEdit?.status === 'PUBLICADO' ? 'selected' : ''}>PUBLICADO</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                    <span class="material-symbols-outlined">expand_more</span>
                </div>
            </div>
          </div>
          
          <div class="flex items-start gap-3 pt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div class="flex items-center h-5 mt-0.5">
                  <input 
                      id="swal-input-sequential" 
                      type="checkbox" 
                      class="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      ${moduleToEdit?.isSequential ? 'checked' : ''}
                  >
              </div>
              <div class="ml-1">
                  <label for="swal-input-sequential" class="text-sm font-medium text-gray-900 cursor-pointer select-none">Progreso Secuencial</label>
                  <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">Si está activo, el estudiante deberá completar cada lección para desbloquear la siguiente.</p>
              </div>
          </div>
        </div>
      `,
      customClass: {
        popup: 'rounded-xl shadow-xl border border-gray-100',
        title: 'text-xl font-bold text-gray-800',
        confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-6 py-2.5 shadow-sm transition-all',
        cancelButton: 'bg-white hover:bg-gray-50 text-gray-600 font-medium border border-gray-200 rounded-lg px-6 py-2.5 transition-all hover:text-gray-800'
      },
      buttonsStyling: false,
      showCancelButton: true,
      confirmButtonText: moduleToEdit ? 'Guardar Cambios' : 'Crear',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: () => {
        const name = (document.getElementById('swal-input-name') as HTMLInputElement).value;
        const status = (document.getElementById('swal-input-status') as HTMLSelectElement).value;
        const isSequential = (document.getElementById('swal-input-sequential') as HTMLInputElement).checked;
        if (!name) {
          Swal.showValidationMessage('¡Debes escribir un nombre!');
        }
        return { name, status, isSequential };
      },
      didOpen: () => {
        // Focus name input
        const input = document.getElementById('swal-input-name') as HTMLInputElement;
        if (input) input.focus();
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const { name, status, isSequential } = result.value;

        if (moduleToEdit) {
          setModules(modules.map(mod =>
            mod.id === moduleToEdit.id ? { ...mod, name, status, isSequential } : mod
          ));
          Swal.fire({
            title: 'Actualizado',
            text: 'El módulo ha sido actualizado correctamente.',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          });
        } else {
          setModules([
            ...modules,
            {
              id: Date.now(),
              name: name,
              status: status,
              isSequential: isSequential,
              isCollapsed: false,
              items: []
            }
          ]);
          Swal.fire({
            title: 'Módulo creado',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          });
        }
      }
    });
  };

  const deleteModule = (id: number) => {
    Swal.fire({
      title: '¿Eliminar módulo?',
      text: "Se eliminarán también todas las lecciones contenidas.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setModules(modules.filter(m => m.id !== id));
        Swal.fire('Eliminado!', 'El módulo ha sido eliminado.', 'success');
      }
    })
  };

  const toggleCollapse = (moduleId: number) => {
    setModules(modules.map(mod =>
      mod.id === moduleId ? { ...mod, isCollapsed: !mod.isCollapsed } : mod
    ));
  };

  // --- Content Management ---
  const openContentModal = (type: 'video' | 'reading' | 'quiz', moduleId: number | null = null) => {
    setContentTypeToAdd(type);
    setActiveModuleId(moduleId);
    // If moduleId is null and type is quiz, it might be for final exam, but let's be explicit with a separate handler or flag
    setIsSelectingFinalExam(moduleId === null);
    setModalOpen(true);
  };

  const handleContentSelect = (item: any) => {
    // Handle Final Exam Selection
    if (isSelectingFinalExam) {
      setFinalExamId(item.id);
      setIsSelectingFinalExam(false);
      setModalOpen(false);
      return;
    }

    // Handle Module Content Addition
    if (activeModuleId) {
      setModules(modules.map(mod => {
        if (mod.id === activeModuleId) {
          const newItem = {
            id: Date.now(),
            // CRITICAL: We bridge the lesson to the video DB using videoId
            videoId: contentTypeToAdd === 'video' ? item.id : undefined,
            contentId: item.id, // Keep for reference or other types
            content: item.id.toString(), // CRITICAL: Populate legacy field for StudentExamDashboard linkage

            title: item.title,
            type: contentTypeToAdd,
            duration: item.duration || (item.timeLimit) || '10 min',
            isRequired: false,

            // UI Helpers
            icon: contentTypeToAdd === 'video' ? 'play_circle' : contentTypeToAdd === 'reading' ? 'article' : 'quiz',
            color: contentTypeToAdd === 'video' ? 'blue' : contentTypeToAdd === 'reading' ? 'purple' : 'teal',
            meta: item.format || (item.questions ? `${Array.isArray(item.questions) ? item.questions.length : item.questions} preguntas` : null),

            // Store extra video metadata if available (optional, but good for preview)
            thumbnail: contentTypeToAdd === 'video' ? item.thumbnail : undefined,
            sourceType: contentTypeToAdd === 'video' ? item.sourceType : undefined
          };
          return { ...mod, items: [...mod.items, newItem] };
        }
        return mod;
      }));
      Swal.fire({
        title: 'Contenido añadido',
        text: 'El elemento se ha agregado al módulo correctamente.',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
    setModalOpen(false); // Close modal after selection
  };

  const deleteItem = (moduleId: number, itemId: number) => {
    setModules(modules.map(mod =>
      mod.id === moduleId ? { ...mod, items: mod.items.filter((i: any) => i.id !== itemId) } : mod
    ));
  };

  const toggleRequired = (moduleId: number, itemId: number) => {
    setModules(modules.map(mod => {
      if (mod.id === moduleId) {
        return {
          ...mod,
          items: mod.items.map((i: any) => {
            if (i.id === itemId) {
              const newStatus = !i.isRequired;
              // Optional: Show toast
              const toastMixin = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
              });
              toastMixin.fire({
                icon: newStatus ? 'success' : 'info',
                title: newStatus ? 'Marcado como Obligatorio' : 'Marcado como Opcional'
              });
              return { ...i, isRequired: newStatus };
            }
            return i;
          })
        };
      }
      return mod;
    }));
  };

  // --- DnD Logic (Modules) ---
  const handleDragStartModule = (index: number) => {
    setDraggedModuleIndex(index);
  };

  const handleDragOverModule = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedModuleIndex === null || draggedModuleIndex === index) return;

    // Reorder modules
    const newModules = [...modules];
    const draggedModule = newModules[draggedModuleIndex];
    newModules.splice(draggedModuleIndex, 1);
    newModules.splice(index, 0, draggedModule);

    setModules(newModules);
    setDraggedModuleIndex(index);
  };

  const handleDragEndModule = () => {
    setDraggedModuleIndex(null);
  };

  // --- DnD Logic (Items) ---
  const handleDragStartItem = (e: React.DragEvent, moduleId: number, index: number) => {
    e.stopPropagation(); // Prevent module drag
    setDraggedItem({ moduleId, index });
  };

  const handleDragOverItem = (e: React.DragEvent, moduleId: number, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem || (draggedItem.moduleId === moduleId && draggedItem.index === index)) return;

    // Check if dragging within same module (Simplification: only allow same-module reorder for now)
    if (draggedItem.moduleId !== moduleId) return;

    // Reorder items
    const newModules = modules.map(mod => {
      if (mod.id === moduleId) {
        const newItems = [...mod.items];
        const draggedItemContent = newItems[draggedItem.index];
        newItems.splice(draggedItem.index, 1);
        newItems.splice(index, 0, draggedItemContent);
        return { ...mod, items: newItems };
      }
      return mod;
    });

    setModules(newModules);
    setDraggedItem({ moduleId, index });
  };

  const handleDragEndItem = () => {
    setDraggedItem(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-border-light shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">view_timeline</span>
            Estructura del Contenido
          </h2>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 bg-blue-50 text-primary rounded-full">{modules.length} Módulos</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onPreview}
            className="px-4 py-2 text-sm font-medium text-text-muted bg-white border border-border-light rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">visibility</span> Vista Previa
          </button>
          <button
            onClick={() => openModuleModal()}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px] text-white">add</span> Nuevo Módulo
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {modules.map((module, index) => (
          <div
            key={module.id}
            draggable
            onDragStart={() => handleDragStartModule(index)}
            onDragOver={(e) => handleDragOverModule(e, index)}
            onDragEnd={handleDragEndModule}
            className={`bg-white border border-border-light rounded-xl shadow-sm overflow-hidden transition-all ${draggedModuleIndex === index ? 'opacity-50 border-blue-400 border-dashed' : ''}`}
          >
            {/* Module Header */}
            <div className="bg-gray-50/80 p-4 flex items-center gap-3 border-b border-border-light">
              <span className="material-symbols-outlined text-text-muted/50 cursor-move">drag_indicator</span>
              <div
                className="flex-1 flex items-center gap-3 cursor-pointer"
                onClick={() => toggleCollapse(module.id)}
              >
                <h3 className="font-bold text-text-main text-base">{module.name}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${module.status === 'PUBLICADO' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  }`}>
                  {module.status}
                </span>
                <span className="text-xs text-text-muted">({(module.items || module.lessons || []).length} lecciones)</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openModuleModal(module)}
                  className="p-2 text-text-muted hover:text-primary rounded-full hover:bg-blue-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button
                  onClick={() => deleteModule(module.id)}
                  className="p-2 text-text-muted hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
                <button
                  onClick={() => toggleCollapse(module.id)}
                  className="p-2 text-text-main hover:bg-gray-200 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-[24px] transition-transform duration-200" style={{ transform: module.isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>expand_more</span>
                </button>
              </div>
            </div>

            {/* Module Content */}
            {!module.isCollapsed && (
              <div className="p-2 bg-white flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                {(module.items || module.lessons || []).length > 0 ? (
                  (module.items || module.lessons || []).map((item: any, itemIndex: number) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStartItem(e, module.id, itemIndex)}
                      onDragOver={(e) => handleDragOverItem(e, module.id, itemIndex)}
                      onDragEnd={handleDragEndItem}
                      className={`flex items-center p-3 rounded-lg border border-transparent hover:border-border-light hover:bg-surface-hover group relative transition-all ${draggedItem?.index === itemIndex && draggedItem?.moduleId === module.id ? 'opacity-40 border-dashed border-blue-400 bg-blue-50' : ''
                        }`}
                    >
                      <span className="material-symbols-outlined text-text-muted/30 cursor-move mr-3">drag_indicator</span>
                      <div className={`size-10 rounded-lg bg-${item.color}-50 flex items-center justify-center text-${item.color}-600 border border-${item.color}-100 shrink-0`}>
                        <span className="material-symbols-outlined">{item.icon}</span>
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-sm font-semibold text-text-main">{item.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-text-muted">
                          <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded"><span className="material-symbols-outlined text-[14px]">schedule</span> {item.duration}</span>
                          {item.isRequired && (
                            <span className="flex items-center gap-1 text-orange-600 font-medium bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100"><span className="material-symbols-outlined text-[14px] fill-1">verified</span> Obligatorio</span>
                          )}
                          {((item.type === 'quiz' || item.type === 'QUIZ') && exams) ? (
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                              {(() => {
                                const exam = exams.find((e: any) => e.id === item.contentId);
                                if (exam) return `${exam.questions?.length || 0} preguntas`;
                                // Fallback to meta if it's already a clean string, or try to extract number if it's a mess
                                if (typeof item.meta === 'string' && !item.meta.includes('[object')) return item.meta;
                                return "0 preguntas";
                              })()}
                            </span>
                          ) : item.meta && (
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{item.meta}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => toggleRequired(module.id, item.id)}
                          className={`p-2 rounded-full transition-colors ${item.isRequired ? 'text-orange-500 bg-orange-50 hover:bg-orange-100' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                          title={item.isRequired ? "Quitar Obligatorio" : "Marcar como Obligatorio"}
                        >
                          <span className="material-symbols-outlined fill-1">verified</span>
                        </button>
                        <button
                          onClick={() => deleteItem(module.id, item.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Eliminar contenido"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-text-muted text-sm italic border-2 border-dashed border-gray-100 rounded-lg m-2">
                    Este módulo está vacío. Añade contenido abajo.
                  </div>
                )}

                <div className="mt-2 pt-3 pb-2 border-t border-dashed border-gray-200 text-center bg-gray-50/30 rounded-b-lg">
                  <p className="text-xs text-text-muted mb-2 font-medium">Añadir contenido al módulo</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => openContentModal('video', module.id)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">play_circle</span> Video
                    </button>
                    <button
                      onClick={() => openContentModal('reading', module.id)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-100 flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">article</span> Lectura
                    </button>
                    <button
                      onClick={() => openContentModal('quiz', module.id)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">quiz</span> Quiz
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Final Exam Toggle Block */}
        <div className="mt-2 rounded-xl border-2 border-dashed border-gray-300 bg-white/50 p-6 transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-3 border ${includeFinalExam ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                <span className="material-symbols-outlined text-3xl">school</span>
              </div>
              <div>
                <h4 className={`font-bold text-lg ${includeFinalExam ? 'text-blue-700' : 'text-gray-900'}`}>Examen Final y Certificación</h4>
                <p className="text-sm text-gray-500">Habilita esta opción para requerir un examen final antes de emitir el certificado.</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={includeFinalExam}
                onChange={(e) => setIncludeFinalExam(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">{includeFinalExam ? 'Habilitado' : 'Deshabilitado'}</span>
            </label>
          </div>

          {/* Exam Selection Dropdown */}
          {includeFinalExam && (
            <div className="mt-6 pt-6 border-t border-gray-200 animate-in slide-in-from-top-2 fade-in duration-300">
              <label className="block text-sm font-bold text-gray-700 mb-2">Examen a vincular</label>

              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <div
                    className={`w-full pl-10 pr-4 py-2.5 bg-white border ${finalExamId ? 'border-gray-300' : 'border-gray-300 border-dashed'} rounded-lg text-sm flex items-center h-[42px] cursor-pointer hover:border-blue-400 transition-colors shadow-sm`}
                    onClick={() => openContentModal('quiz', null)}
                  >
                    <span className="material-symbols-outlined absolute left-3 text-gray-400 text-[20px]">
                      {finalExamId ? 'assignment_turned_in' : 'add_circle'}
                    </span>
                    <span className={finalExamId ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                      {finalExamId
                        ? exams.find(e => e.id === finalExamId)?.title || 'Examen Seleccionado'
                        : 'Seleccionar un examen...'
                      }
                    </span>
                    <span className="material-symbols-outlined absolute right-3 text-gray-400">expand_more</span>
                  </div>
                </div>

                <button
                  onClick={() => openContentModal('quiz', null)}
                  className="px-4 py-2.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-100 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]">quiz</span>
                  {finalExamId ? 'Cambiar Examen' : 'Elegir Examen'}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Si no encuentras el examen, asegúrate de crearlo primero en el "Gestor de Exámenes".
              </p>

              {/* Exam Unlock Condition */}
              <div className="mt-6 pt-6 border-t border-gray-200 animate-in slide-in-from-top-2 fade-in duration-300">
                {/* Closing Date Configuration */}
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h5 className="font-bold text-sm text-red-900 mb-1">Fecha de Cierre del Curso</h5>
                      <p className="text-xs text-red-700">
                        Si estableces una fecha, el curso se cerrará automáticamente y el examen final dejará de estar disponible, sin importar el progreso del estudiante.
                      </p>
                    </div>
                    <div className="shrink-0">
                      <input
                        type="datetime-local"
                        className="px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm bg-white"
                        value={closingDate}
                        onChange={(e) => setClosingDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <label className="block text-sm font-bold text-gray-700 mb-3">Condición de Desbloqueo</label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${finalExamCondition === 'completion' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="examCondition"
                      className="mt-1"
                      checked={finalExamCondition === 'completion'}
                      onChange={() => setFinalExamCondition('completion')}
                    />
                    <div>
                      <span className="block font-semibold text-sm text-gray-900">Al completar el contenido</span>
                      <span className="block text-xs text-gray-500 mt-0.5">El examen se desbloquea automáticamente cuando el estudiante completa todos los módulos.</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${finalExamCondition === 'date' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="examCondition"
                      className="mt-1"
                      checked={finalExamCondition === 'date'}
                      onChange={() => setFinalExamCondition('date')}
                    />
                    <div>
                      <span className="block font-semibold text-sm text-gray-900">En fecha programada</span>
                      <span className="block text-xs text-gray-500 mt-0.5">El examen se desbloquea en una fecha y hora específica, independientemente del progreso.</span>
                    </div>
                  </label>
                </div>

                {finalExamCondition === 'date' && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fecha y Hora de Apertura</label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      value={finalExamDate}
                      onChange={(e) => setFinalExamDate(e.target.value)}
                    />
                    <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      Los estudiantes no podrán acceder al examen antes de esta fecha.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ContentSelectorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={contentTypeToAdd}
        onSelect={handleContentSelect}
        courseContext={courseTitle}
        excludeVideoIds={modules.flatMap(m => m.items || m.lessons || []).filter((item: any) => item && item.type === 'video').map((item: any) => item.contentId || item.id)}
        excludeQuizIds={[
          ...modules.flatMap(m => m.items || m.lessons || []).filter((item: any) => item && (item.type === 'quiz' || item.type === 'QUIZ')).map((item: any) => item.contentId),
          finalExamId
        ].filter(Boolean)}
      />

    </div>
  );
};

// ========== TAB 2: MATERIALES ==========
interface MaterialsTabProps {
  materials: any[];
  setMaterials: React.Dispatch<React.SetStateAction<any[]>>;
  modules: any[];
}

const MaterialsTab: React.FC<MaterialsTabProps> = ({ materials, setMaterials, modules }) => {
  const [filterModuleId, setFilterModuleId] = useState<number | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'name_asc' | 'name_desc' | 'date_asc' | 'date_desc'>('date_desc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const filteredMaterials = (filterModuleId === 'all'
    ? materials
    : materials.filter(m => m.moduleId === Number(filterModuleId))).sort((a, b) => {
      if (sortOrder === 'name_asc') return a.name.localeCompare(b.name);
      if (sortOrder === 'name_desc') return b.name.localeCompare(a.name);
      if (sortOrder === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      return new Date(b.date).getTime() - new Date(a.date).getTime(); // date_desc default
    });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    if (selectedFile) {
      confirmUpload();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    // Reset input to allow selecting same file again if needed (though we have state now)
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const confirmUpload = () => {
    if (!selectedFile) return;

    const file = selectedFile;
    // Determine type and color based on extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    let type = 'other';
    let color = 'gray';

    if (extension === 'pdf') { type = 'pdf'; color = 'red'; }
    else if (['doc', 'docx'].includes(extension || '')) { type = 'doc'; color = 'blue'; }
    else if (['xls', 'xlsx', 'csv'].includes(extension || '')) { type = 'excel'; color = 'green'; }
    else if (['ppt', 'pptx'].includes(extension || '')) { type = 'ppt'; color = 'orange'; }
    else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) { type = 'image'; color = 'purple'; }
    else if (['mp4', 'mov', 'avi'].includes(extension || '')) { type = 'video'; color = 'pink'; }

    const newFile = {
      id: Date.now(),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      moduleId: modules.length > 0 ? (filterModuleId !== 'all' ? filterModuleId : modules[0].id) : 0,
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      type,
      color
    };

    setMaterials([...materials, newFile]);
    setSelectedFile(null); // Clear selection

    Swal.fire({
      title: 'Archivo agregado',
      text: `El archivo "${file.name}" se ha agregado a la lista (simulación).`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleDeleteMaterial = (id: number) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setMaterials(materials.filter(m => m.id !== id));
        Swal.fire(
          'Eliminado',
          'El archivo ha sido eliminado.',
          'success'
        );
      }
    });
  };

  const getModuleName = (moduleId: number) => {
    const mod = modules.find(m => m.id === moduleId);
    return mod ? mod.name : 'Módulo General';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Upload Area */}
      <div
        className={`bg-white p-8 rounded-xl border-2 border-dashed transition-all ${selectedFile ? 'border-primary bg-blue-50/10' : 'border-border-light hover:border-primary/50'} text-center`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {!selectedFile ? (
          <>
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 text-[32px]">cloud_upload</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-text-main mb-2">Arrastra y suelta tus archivos aquí</h3>
            <p className="text-sm text-text-muted mb-4">o haz clic para seleccionar desde tu ordenador (Máx. 50MB)</p>
            <p className="text-xs text-text-muted mb-4">Soportado: PDF, DOCX, PPTX, JPG, PNG, MP4</p>
          </>
        ) : (
          <div className="mb-6 flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-green-600 text-[32px]">description</span>
            </div>
            <h3 className="text-lg font-bold text-text-main mb-1">{selectedFile.name}</h3>
            <p className="text-sm text-text-muted">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Listo para subir</p>
            <button
              onClick={() => setSelectedFile(null)}
              className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
            >
              Cancelar selección
            </button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4"
        />
        <button
          onClick={handleUploadClick}
          className={`px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 mx-auto transition-all ${selectedFile
            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
        >
          <span className="material-symbols-outlined text-[20px]">{selectedFile ? 'check' : 'upload'}</span>
          {selectedFile ? 'Confirmar Subida' : 'Subir Archivo'}
        </button>
      </div>

      {/* Filter and List */}
      <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-border-light flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted">Filtrar por Módulo:</span>
            <select
              className="px-3 py-1.5 border border-border-light rounded-lg text-sm"
              value={filterModuleId}
              onChange={(e) => setFilterModuleId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">Todos los módulos</option>
              {modules.map(mod => (
                <option key={mod.id} value={mod.id}>{mod.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 relative">
            <span className="text-sm font-semibold text-text-main">{filteredMaterials.length} Archivos totales</span>
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-blue-50 rounded-lg flex items-center gap-1 transition-colors relative"
            >
              <span className="material-symbols-outlined text-[18px]">sort</span>
              Organizar
            </button>

            {showSortMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="py-1">
                  <button
                    onClick={() => { setSortOrder('name_asc'); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${sortOrder === 'name_asc' ? 'text-primary font-medium bg-blue-50/50' : 'text-slate-600'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">azm</span> Nombre (A-Z)
                  </button>
                  <button
                    onClick={() => { setSortOrder('name_desc'); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${sortOrder === 'name_desc' ? 'text-primary font-medium bg-blue-50/50' : 'text-slate-600'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">za_sort</span> Nombre (Z-A)
                  </button>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button
                    onClick={() => { setSortOrder('date_desc'); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${sortOrder === 'date_desc' ? 'text-primary font-medium bg-blue-50/50' : 'text-slate-600'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span> Más recientes
                  </button>
                  <button
                    onClick={() => { setSortOrder('date_asc'); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${sortOrder === 'date_asc' ? 'text-primary font-medium bg-blue-50/50' : 'text-slate-600'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">event_busy</span> Más antiguos
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="divide-y divide-border-light">
          {filteredMaterials.length > 0 ? (
            filteredMaterials.map((file, idx) => (
              <div key={file.id || idx} className="p-4 hover:bg-gray-50/50 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg bg-${file.color}-50 flex items-center justify-center shrink-0`}>
                  <span className="material-symbols-outlined text-[24px] text-red-600">
                    {file.type === 'pdf' ? 'picture_as_pdf' : file.type === 'doc' ? 'description' : 'table_chart'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-text-main truncate">{file.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                    <span>{file.size}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">folder</span> {getModuleName(file.moduleId)}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {file.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-text-muted hover:text-primary"><span className="material-symbols-outlined text-[20px]">download</span></button>
                  <button onClick={() => handleDeleteMaterial(file.id)} className="p-2 text-text-muted hover:text-red-600"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-text-muted">
              No se encontraron archivos en este filtro.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ========== TAB 3: ESTUDIANTES ==========
// ========== TAB 3: ESTUDIANTES ==========
interface StudentsTabProps {
  accessConfig: {
    modalities: string[];
    workshops: string[];
  };
  setAccessConfig: React.Dispatch<React.SetStateAction<{
    modalities: string[];
    workshops: string[];
  }>>;
}

const StudentsTab: React.FC<StudentsTabProps> = ({ accessConfig, setAccessConfig }) => {
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dynamic Options State
  const [modalitiesInfos, setModalitiesInfos] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'Cualquier Modalidad' }
  ]);
  const [workshopsInfos, setWorkshopsInfos] = useState<{ id: string; name: string }[]>([]);

  // State for Users (Live Data)
  const [users, setUsers] = useState<any[]>([]);



  // Combined Data Loading
  useEffect(() => {
    const loadData = async () => {
      try {
        const [pricing, usersData] = await Promise.all([
          api.treasury.getPricing(),
          api.users.getAll()
        ]);

        // 1. Process Pricing/Config
        if (pricing) {
          if (pricing.ticketTypes && Array.isArray(pricing.ticketTypes)) {
            const dynamicModalities = pricing.ticketTypes.map((t: any) => ({
              value: t.id, // Store ID
              label: t.title,
              id: t.id
            }));
            setModalitiesInfos([{ value: 'all', label: 'Cualquier Modalidad' }, ...dynamicModalities]);
          }
          if (pricing.workshops && Array.isArray(pricing.workshops)) {
            setWorkshopsInfos(pricing.workshops);
          }
        }

        // 2. Process Users
        if (usersData) {
          setUsers(usersData);
        }

      } catch (error) {
        console.error("Error loading system data:", error);
      }
    };
    loadData();
  }, []);

  // Constants (Mapped from State)
  const MODALITIES = modalitiesInfos;
  const WORKSHOPS = workshopsInfos;

  // Logic to filter users
  const filteredStudents = useMemo(() => {
    // 1. Get potential users (Mocking: In real app this would be by enrolled course ID)
    // For now, we take all users from organization that have enrollment data
    let potentialUsers = users.filter(u => !u.isSuperAdmin);

    // DEBUG: Dump first user to see structure
    if (potentialUsers.length > 0) {
      console.log("DEBUG FIRST USER:", potentialUsers[0]);
    }

    // 2. Apply Access Configuration Filters (The "Check")
    // Filter by Modality OR Workshop (User fits if they match ANY criteria)
    potentialUsers = potentialUsers.filter(u => {
      // --- Modality Check ---
      let matchesModality = false;
      const selectedModalities = accessConfig.modalities;

      if (selectedModalities.includes('all')) {
        matchesModality = true;
      } else if (selectedModalities.length > 0) {
        // Direct ID Match
        matchesModality = selectedModalities.includes(u.registrationType || '');
      }

      // --- Workshop Check ---
      let matchesWorkshop = false;
      if (accessConfig.workshops.length > 0) {
        const userItems = u.purchasedItems || [];
        matchesWorkshop = accessConfig.workshops.some(wsId => userItems.includes(wsId));
      }

      // Final Decision: AND Logic with Optional Workshop
      // 1. Must match Modality (Primary Filter)
      if (!matchesModality) return false;

      // 2. If workshops are selected, must match at least one (Secondary Filter)
      if (accessConfig.workshops.length > 0 && !matchesWorkshop) return false;

      return true;
    });

    // 3. Apply Local List Filters (Search & Status)
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      potentialUsers = potentialUsers.filter(u =>
        (u.firstName + ' ' + u.lastName).toLowerCase().includes(lowerTerm) ||
        u.email.toLowerCase().includes(lowerTerm)
      );
    }


    const getModalityInfo = (u: any) => {
      // Find label by ID from modalitiesInfos which is derived from pricing
      const match = MODALITIES.find(m => m.value === u.registrationType);
      const label = match ? match.label : (u.registrationType || 'Desconocido');

      let style = 'gray';
      if (label.includes('Presencial')) style = 'blue';
      if (label.includes('Virtual')) style = 'purple';
      if (u.amount === 0 && u.status === 'Confirmado' && !label.includes('Presencial')) return { name: 'Beca Completa', id: 'grant', style: 'green' };

      return { name: label, id: u.registrationType || '-', style };
    };

    return potentialUsers.map(u => ({
      id: u.id,
      name: u.name ? u.name : `${u.firstName} ${u.lastName}`,
      email: u.email,
      initials: (u.firstName ? u.firstName[0] : (u.name ? u.name[0] : 'U')) + (u.lastName ? u.lastName[0] : ''),
      color: 'blue',
      enrolled: u.registrationDate || 'N/A',
      progress: u.attendancePercentage || 0, // Restore progress for stats
      modalityInfo: getModalityInfo(u),
      status: u.attendancePercentage === 100 ? 'COMPLETADO' : 'ACTIVO'
    }));

  }, [users, accessConfig, searchTerm]);

  const toggleWorkshop = (id: string) => {
    setAccessConfig(prev => ({
      ...prev,
      workshops: prev.workshops.includes(id)
        ? prev.workshops.filter(w => w !== id)
        : [...prev.workshops, id]
    }));
  };

  const toggleModality = (value: string) => {
    setAccessConfig(prev => {
      const isSelected = prev.modalities.includes(value);

      if (value === 'all') {
        // Toggle 'all': If selected, clear (empty). If not, exclusive select ['all'].
        return { ...prev, modalities: isSelected ? [] : ['all'] };
      }

      // Specific modality
      let newModalities = isSelected
        ? prev.modalities.filter(m => m !== value)
        : [...prev.modalities.filter(m => m !== 'all'), value]; // Remove 'all' when adding specific

      return { ...prev, modalities: newModalities };
    });
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const nextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const prevPage = () => setCurrentPage(p => Math.max(p - 1, 1));

  return (
    <div className="flex flex-col gap-6">

      {/* Access Configuration Panel */}
      <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-blue-600">lock_person</span>
          <h3 className="font-bold text-blue-900">Configuración de Acceso</h3>
        </div>
        <p className="text-sm text-blue-800/70 mb-4">
          Define quiénes tienen acceso a este curso. Los estudiantes serán inscritos automáticamente si cumplen:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Modality Selector (Multi-select) */}
          <div>
            <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Modalidades Requeridas</label>
            <div className="bg-white border border-blue-200 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
              {MODALITIES.map(m => (
                <label key={m.value} className="flex items-center gap-2 p-1.5 hover:bg-blue-50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="rounded text-blue-600 focus:ring-blue-500"
                    checked={accessConfig.modalities.includes(m.value)}
                    onChange={() => toggleModality(m.value)}
                  />
                  <span className="text-sm text-gray-700">{m.label}</span>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-blue-600 mt-1 italic">
              * Si no selecciona ninguna, el curso estará oculto o accesible para todos según política global.
            </p>
          </div>

          {/* Workshop Selector */}
          <div>
            <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Talleres Incluidos (Opcional)</label>
            <div className={`bg-white border border-blue-200 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1 ${accessConfig.modalities.length === 0 ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              {WORKSHOPS.map(ws => (
                <label key={ws.id} className="flex items-center gap-2 p-1.5 hover:bg-blue-50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="rounded text-blue-600 focus:ring-blue-500"
                    checked={accessConfig.workshops.includes(ws.id)}
                    onChange={() => toggleWorkshop(ws.id)}
                    disabled={accessConfig.modalities.length === 0}
                  />
                  <span className="text-sm text-gray-700">{ws.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl border border-border-light shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
          <input
            type="text"
            placeholder="Buscar estudiante por nombre o email..."
            className="w-full pl-10 pr-4 py-2.5 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-blue-600">{filteredStudents.length} Estudiantes Califican</span>

        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-border-light">
                <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Nombre del Estudiante</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Inscripción</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Modalidad</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Acc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {currentItems.length > 0 ? (
                currentItems.map((student, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-4 py-4 text-xs font-mono text-text-muted">{student.id}</td>
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
                      <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${student.modalityInfo.style}-100 text-${student.modalityInfo.style}-800`}>
                          {student.modalityInfo.name}
                        </span>
                        {student.modalityInfo.id !== '-' && (
                          <span className="text-[10px] text-text-muted font-mono bg-gray-50 px-1 rounded border border-gray-100">
                            {student.modalityInfo.id}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button className="p-1.5 text-text-muted hover:text-primary">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    No hay estudiantes que cumplan con los criterios seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border-light flex items-center justify-between">
          <span className="text-sm text-text-muted">
            Mostrando {currentItems.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredStudents.length)} de {filteredStudents.length} estudiantes
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={prevPage} disabled={currentPage === 1} className="p-2 text-text-muted hover:text-primary disabled:opacity-50"><span className="material-symbols-outlined">chevron_left</span></button>
              <span className="text-sm font-semibold">{currentPage} / {totalPages}</span>
              <button onClick={nextPage} disabled={currentPage === totalPages} className="p-2 text-text-muted hover:text-primary disabled:opacity-50"><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
          )}
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
              <div className="text-2xl font-bold text-text-main">
                {filteredStudents.length > 0
                  ? (filteredStudents.reduce((acc, curr) => acc + curr.progress, 0) / filteredStudents.length).toFixed(1) + '%'
                  : '0%'
                }
              </div>
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
              <div className="text-2xl font-bold text-text-main">
                {filteredStudents.filter(s => s.status === 'COMPLETADO').length}
              </div>
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