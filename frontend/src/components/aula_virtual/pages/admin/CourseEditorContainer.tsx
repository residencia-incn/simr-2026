import React, { useState } from 'react';
import CourseEditor from './CourseEditor';
import Swal from 'sweetalert2';
import { useAulaVirtual } from '../../context/AulaVirtualContext';

type ViewType = 'list' | 'edit';

interface CourseEditorContainerProps {
    onUnsavedChanges?: (hasChanges: boolean) => void;
}

const CourseEditorContainer: React.FC<CourseEditorContainerProps> = ({ onUnsavedChanges }) => {
    const [view, setView] = useState<ViewType>('list');
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

    const handleEditCourse = (courseId: number) => {
        setSelectedCourseId(courseId);
        setView('edit');
    };

    const handleCreateCourse = () => {
        setSelectedCourseId(null);
        setView('edit');
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedCourseId(null);
        if (onUnsavedChanges) {
            onUnsavedChanges(false); // Reset unsaved changes when going back
        }
    };

    if (view === 'edit') {
        return <CourseEditor onBack={handleBackToList} courseId={selectedCourseId} onUnsavedChanges={onUnsavedChanges} />;
    }

    return <CourseListView onCreate={handleCreateCourse} onEdit={handleEditCourse} />;
};

// ========== COURSE LIST VIEW ==========
interface CourseListViewProps {
    onCreate: () => void;
    onEdit: (courseId: number) => void;
}

const CourseListView: React.FC<CourseListViewProps> = ({ onCreate, onEdit }) => {
    const { courses, deleteCourse, addCourse, getStats } = useAulaVirtual();
    const [searchTerm, setSearchTerm] = useState('');

    // Transform courses for display
    const displayCourses = courses.map(course => ({
        id: course.id,
        title: course.title,
        created: `Creado el ${new Date(course.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        students: course.enrolledStudents,
        rating: course.rating,
        status: course.status,
        gradient: course.coverGradient,
        coverImage: course.coverImage
    }));

    const handleDuplicate = (courseId: number) => {
        const originalCourse = courses.find(c => c.id === courseId);
        if (originalCourse) {
            const newCourse = {
                ...originalCourse,
                id: Math.max(...courses.map(c => c.id)) + 1,
                title: `${originalCourse.title} (Copia)`,
                slug: `${originalCourse.slug}-copia`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                enrolledStudents: 0,
                rating: 0,
                totalRatings: 0,
                status: 'BORRADOR' as const
            };
            addCourse(newCourse);
        }
    };

    const handleDelete = async (courseId: number) => {
        const course = displayCourses.find(c => c.id === courseId);
        if (course) {
            const result = await Swal.fire({
                title: `¿Estás seguro de eliminar el curso "${course.title}"?`,
                text: 'Esta acción no se puede deshacer.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Aceptar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                deleteCourse(courseId);
                Swal.fire({
                    title: '¡Eliminado!',
                    text: 'El curso ha sido eliminado exitosamente.',
                    icon: 'success',
                    confirmButtonColor: '#3B82F6',
                    confirmButtonText: 'OK'
                });
            }
        }
    };

    // Filter courses by search term
    const filteredCourses = displayCourses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get stats from context
    const stats_data = getStats();
    const stats = [
        { label: 'Total Cursos', value: stats_data.totalCourses, icon: 'school', color: 'blue' },
        { label: 'Publicados', value: stats_data.publishedCourses, icon: 'check_circle', color: 'green' },
        { label: 'Borradores', value: stats_data.draftCourses, icon: 'draft', color: 'yellow' },
        { label: 'Cerrados', value: stats_data.closedCourses, icon: 'cancel', color: 'red' },
    ];

    return (
        <div className="flex-1 overflow-y-auto bg-background-light p-4 md:p-8">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main">Gestión de Cursos</h1>
                        <p className="text-text-muted text-sm mt-1">Crea, edita y administra los programas académicos de neurología.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
                            <input
                                type="text"
                                placeholder="Buscar cursos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                            />
                        </div>
                        <button
                            onClick={onCreate}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Crear Nuevo Curso
                        </button>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-border-light shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-lg bg-${stat.color}-50 flex items-center justify-center`}>
                                    <span className={`material-symbols-outlined text-${stat.color}-600 text-[24px]`}>{stat.icon}</span>
                                </div>
                                <div>
                                    <div className="text-xs text-text-muted font-semibold">{stat.label}</div>
                                    <div className="text-2xl font-bold text-text-main">{stat.value}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {filteredCourses.map(course => (
                        <div key={course.id} className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Course Image */}
                            <div className={`h-40 bg-gradient-to-br ${course.gradient} relative bg-cover bg-center`}
                                style={course.coverImage ? { backgroundImage: `url(${course.coverImage})` } : {}}
                            >
                                <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${course.status === 'PUBLICADO' ? 'bg-green-600 text-white' :
                                    course.status === 'BORRADOR' ? 'bg-yellow-500 text-white' :
                                        'bg-red-600 text-white'
                                    } shadow-sm`}>
                                    {course.status}
                                </span>
                            </div>

                            {/* Course Info */}
                            <div className="p-4">
                                <h3 className="font-bold text-text-main text-lg mb-1">{course.title}</h3>
                                <p className="text-xs text-text-muted mb-3">{course.created}</p>

                                <div className="flex items-center gap-4 mb-4 text-sm text-text-muted">
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[18px]">person</span>
                                        <span className="font-semibold">{course.students}</span>
                                        <span>Estudiantes</span>
                                    </div>
                                    {course.rating > 0 && (
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-yellow-500 text-[18px] fill-1">star</span>
                                            <span className="font-semibold">{course.rating}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 pt-3 border-t border-border-light">
                                    <button
                                        onClick={() => onEdit(course.id)}
                                        className="flex-1 px-2 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDuplicate(course.id)}
                                        className="flex-1 px-2 py-1.5 text-xs font-semibold text-text-muted hover:bg-gray-100 rounded-lg flex items-center justify-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                        Dup.
                                    </button>
                                    <button
                                        onClick={() => handleDelete(course.id)}
                                        className="flex-1 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                        Elim.
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Course Card */}
                    <button
                        onClick={onCreate}
                        className="bg-white rounded-xl border-2 border-dashed border-border-light hover:border-primary hover:bg-blue-50/30 transition-all min-h-[320px] flex flex-col items-center justify-center gap-3 text-center p-6 group"
                    >
                        <div className="w-16 h-16 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-blue-600 text-[40px]">add</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-text-main text-lg mb-1">Añadir Nuevo Curso</h3>
                            <p className="text-sm text-text-muted">Configura un nuevo programa<br />educativo desde cero</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseEditorContainer;
