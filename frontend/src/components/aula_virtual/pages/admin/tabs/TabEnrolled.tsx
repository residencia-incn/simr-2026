import React, { useState, useEffect } from 'react';
import { UserPlus, Search, UserCheck, User, Trash2, ShieldAlert } from 'lucide-react';
// import { courseService } from '../../services/courseService'; // Tu servicio
import { api } from '../../../../../services/api';
import { showSuccess, showDeleteConfirm } from '../../../../../utils/alerts';

interface TabEnrolledProps {
    courseId: number | string | null;
}

const TabEnrolled: React.FC<TabEnrolledProps> = ({ courseId }) => {
    const [students, setStudents] = useState<any[]>([]); // Lista cargada del backend
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // Para buscar usuario a agregar

    // Simulación de carga (Reemplazar con useEffect real hacia tu API)
    useEffect(() => {
        // Ejemplo de cómo vendría la data del backend:
        // GET /courses/{id}/students
        // For now we mock it or fetch all users and filter locally if backend endpoint isn't ready
        const loadStudents = async () => {
            setLoading(true);
            try {
                // Ideally: const data = await api.courses.getStudents(courseId);
                // Fallback: Fetch all users and mock the 'access_source' logic for now
                const allUsers = await api.users.getAll();

                // Mock transformation to match requested UI structure
                const mockData = allUsers.slice(0, 10).map((u: any, index: number) => ({
                    id: u.id,
                    name: u.name || `${u.firstName} ${u.lastName}`,
                    email: u.email,
                    access_source: index % 3 === 0 ? 'MANUAL' : 'RULE_MODALITY',
                    modality_name: u.registrationType || 'General'
                }));

                setStudents(mockData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            loadStudents();
        }
    }, [courseId]);

    const handleAddManual = async () => {
        // Lógica para buscar un usuario por DNI y agregarlo manualmente a la tabla "course_enrollments"
        showSuccess(`Buscando usuario: ${searchTerm} para darle acceso VIP`, 'Acceso Concedido');
    };

    const handleRemoveManual = async (studentId: any) => {
        const confirmed = await showDeleteConfirm("¿Está seguro de quitar este acceso manual?", "Revocar Acceso");
        if (confirmed) {
            // Solo se pueden borrar los manuales. Los de regla se borran cambiando la regla.
            console.log("Eliminando excepción manual...");
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">

            {/* HEADER: Buscador para agregar excepciones */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div>
                    <h4 className="font-bold text-blue-900 text-sm">Excepciones Manuales</h4>
                    <p className="text-xs text-blue-600">Otorga acceso a alguien que NO cumple las reglas (Becados, Invitados).</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-3 text-blue-400" />
                        <input
                            type="text"
                            placeholder="Buscar por DNI o Email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-lg border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                        />
                    </div>
                    <button
                        onClick={handleAddManual}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <UserPlus size={16} />
                        Agregar
                    </button>
                </div>
            </div>

            {/* TABLA DE RESULTADOS */}
            <div className="flex-1 overflow-hidden border rounded-lg shadow-sm bg-white">
                <div className="overflow-y-auto h-full">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 font-semibold">Estudiante</th>
                                <th className="p-4 font-semibold">Motivo de Acceso</th>
                                <th className="p-4 font-semibold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{student.name}</div>
                                                <div className="text-xs text-slate-400">{student.email}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* COLUMNA CLAVE: ¿POR QUÉ ENTRA? */}
                                    <td className="p-4">
                                        {student.access_source === 'MANUAL' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                                <UserCheck size={12} />
                                                Excepción Manual
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                <ShieldAlert size={12} />
                                                Regla: {student.modality_name}
                                            </span>
                                        )}
                                    </td>

                                    <td className="p-4 text-center">
                                        {student.access_source === 'MANUAL' ? (
                                            <button
                                                onClick={() => handleRemoveManual(student.id)}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                                                title="Revocar acceso manual"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-300 italic">Automático</span>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {students.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-slate-400">
                                        Nadie tiene acceso a este curso todavía. <br />
                                        Revisa las reglas en la pestaña anterior.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TabEnrolled;
