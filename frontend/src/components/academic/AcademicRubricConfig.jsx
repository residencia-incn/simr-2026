import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit, Check, X, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { api } from '../../services/api';
import { showError, showSuccess } from '../../utils/alerts';

const AcademicRubricConfig = () => {
    const [rubrics, setRubrics] = useState([]);
    const [workTypes, setWorkTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // New Rubric State
    const [isAdding, setIsAdding] = useState(false);
    const [newRubric, setNewRubric] = useState({ title: '', description: '', work_types: [], max_score: 20 });

    // Editing State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', work_types: [], max_score: 20 });

    // Delete Confirmation
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [rubricsData, typesData] = await Promise.all([
                api.academic.getRubrics(),
                api.research.getTypes() // Assuming this returns list of type strings or objects
            ]);
            setRubrics(rubricsData || []);
            // Handle types data format (assuming it might be list of strings or objects)
            const types = Array.isArray(typesData) ? typesData.map(t => typeof t === 'object' ? t.name : t) : [];
            setWorkTypes(types);
        } catch (error) {
            console.error("Error loading rubrics data", error);
            showError("Error al cargar la configuración de rúbricas");
        } finally {
            setLoading(false);
        }
    };

    const handleAddRubric = async () => {
        if (!newRubric.title.trim() || !newRubric.description.trim() || newRubric.work_types.length === 0) {
            showError("Por favor complete todos los campos requeridos (incluyendo al menos un tipo de trabajo)");
            return;
        }

        setIsSaving(true);
        try {
            const created = await api.academic.createRubric(newRubric);
            setRubrics([...rubrics, created]);
            setNewRubric({ title: '', description: '', work_types: [], max_score: 20 });
            setIsAdding(false);
            showSuccess("Rúbrica creada correctamente");
        } catch (error) {
            console.error("Error creating rubric", error);
            showError("Error al crear la rúbrica");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleWorkType = (type, isEdit = false) => {
        if (isEdit) {
            const current = editForm.work_types || [];
            if (current.includes(type)) {
                setEditForm({ ...editForm, work_types: current.filter(t => t !== type) });
            } else {
                setEditForm({ ...editForm, work_types: [...current, type] });
            }
        } else {
            const current = newRubric.work_types || [];
            if (current.includes(type)) {
                setNewRubric({ ...newRubric, work_types: current.filter(t => t !== type) });
            } else {
                setNewRubric({ ...newRubric, work_types: [...current, type] });
            }
        }
    };

    const handleDeleteRubric = async (id) => {
        try {
            await api.academic.deleteRubric(id);
            setRubrics(rubrics.filter(r => r.id !== id));
            setDeleteConfirmation(null);
            showSuccess("Rúbrica eliminada");
        } catch (error) {
            console.error("Error deleting rubric", error);
            showError("Error al eliminar la rúbrica");
        }
    };

    const startEditing = (rubric) => {
        setEditingId(rubric.id);
        setEditForm({ ...rubric });
    };

    const saveEdit = async () => {
        setIsSaving(true);
        try {
            const updated = await api.academic.updateRubric(editingId, editForm);
            setRubrics(rubrics.map(r => r.id === editingId ? updated : r));
            setEditingId(null);
            showSuccess("Rúbrica actualizada");
        } catch (error) {
            console.error("Error updating rubric", error);
            showError("Error al actualizar la rúbrica");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando rúbricas...</div>;

    return (
        <div className="space-y-6 animate-fadeIn p-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Rúbricas de Evaluación</h2>
                    <p className="text-gray-600">Defina los criterios que utilizarán los jurados para calificar los trabajos.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "secondary" : "primary"}>
                    {isAdding ? "Cancelar" : <><Plus size={18} className="mr-2" /> Nueva Rúbrica</>}
                </Button>
            </div>

            {/* Add New Form */}
            {isAdding && (
                <Card className="p-6 border-blue-200 bg-blue-50">
                    <h3 className="font-bold text-blue-900 mb-4">Agregar Nuevo Criterio</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Criterio</label>
                                <input
                                    className="w-full border rounded-md p-2"
                                    placeholder="Ej. Originalidad"
                                    value={newRubric.title}
                                    onChange={e => setNewRubric({ ...newRubric, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Puntaje Máximo</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-md p-2"
                                    value={newRubric.max_score}
                                    onChange={e => setNewRubric({ ...newRubric, max_score: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Tooltip para el jurado)</label>
                            <textarea
                                className="w-full border rounded-md p-2"
                                rows={2}
                                placeholder="Describa qué se debe evaluar en este punto..."
                                value={newRubric.description}
                                onChange={e => setNewRubric({ ...newRubric, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipos de Trabajo (Seleccione uno o varios):</label>
                            <div className="flex flex-wrap gap-2">
                                {workTypes.map(type => {
                                    const isSelected = newRubric.work_types.includes(type);
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => toggleWorkType(type)}
                                            className={`px-3 py-1.5 rounded-full border text-sm transition-all flex items-center gap-1.5 ${isSelected
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                                                }`}
                                        >
                                            {isSelected && <Check size={14} />}
                                            {type}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleAddRubric} disabled={isSaving}>
                                {isSaving ? 'Guardando...' : 'Guardar Criterio'}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* List */}
            <div className="space-y-4">
                {rubrics.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                        No hay rúbricas definidas.
                    </div>
                )}
                {rubrics.map(rubric => {
                    const isEditing = editingId === rubric.id;
                    const rWorkTypes = rubric.work_types || [];

                    return (
                        <Card key={rubric.id} className={`p-4 transition-shadow ${isEditing ? 'border-2 border-blue-500 shadow-md' : 'hover:shadow-md'}`}>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            className="w-full border rounded-md p-2 font-bold"
                                            value={editForm.title}
                                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                            placeholder="Título"
                                        />
                                        <input
                                            type="number"
                                            className="w-full border rounded-md p-2"
                                            value={editForm.max_score}
                                            onChange={e => setEditForm({ ...editForm, max_score: parseInt(e.target.value) || 0 })}
                                            placeholder="Max Score"
                                        />
                                    </div>
                                    <textarea
                                        className="w-full border rounded-md p-2"
                                        rows={2}
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        placeholder="Descripción"
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipos de Trabajo:</label>
                                        <div className="flex flex-wrap gap-2">
                                            {workTypes.map(type => {
                                                const isSelected = editForm.work_types?.includes(type);
                                                return (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => toggleWorkType(type, true)}
                                                        className={`px-3 py-1 rounded-full border text-xs transition-all flex items-center gap-1 ${isSelected
                                                                ? 'bg-blue-600 text-white border-blue-600'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                                                            }`}
                                                    >
                                                        {isSelected && <Check size={12} />}
                                                        {type}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" onClick={() => setEditingId(null)}><X size={18} /></Button>
                                        <Button onClick={saveEdit} disabled={isSaving}><Check size={18} /></Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between gap-4 group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="font-bold text-gray-900 mr-2">{rubric.title}</h3>
                                            <div className="flex flex-wrap gap-1">
                                                {rWorkTypes.map(t => (
                                                    <span key={t} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-200">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full border border-green-200">Max: {rubric.max_score} pts</span>
                                        </div>
                                        <p className="text-sm text-gray-600">{rubric.description}</p>
                                    </div>
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" onClick={() => startEditing(rubric)}>
                                            <Edit size={18} />
                                        </button>
                                        <button className="p-2 text-red-600 hover:bg-red-50 rounded" onClick={() => setDeleteConfirmation(rubric)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Custom Delete Confirmation Modal */}
            {deleteConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-scaleIn">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">¿Eliminar esta rúbrica?</h3>
                            <p className="text-sm text-gray-500">
                                Está a punto de eliminar <strong>"{deleteConfirmation.title}"</strong>. Esta acción no se puede deshacer.
                            </p>
                            <div className="flex gap-3 w-full pt-2">
                                <button
                                    onClick={() => setDeleteConfirmation(null)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeleteRubric(deleteConfirmation.id)}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicRubricConfig;
