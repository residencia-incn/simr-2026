import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit, Check, X, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { api } from '../../services/api';

const AcademicRubricConfig = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // New Rubric State
    const [isAdding, setIsAdding] = useState(false);
    const [newRubric, setNewRubric] = useState({ name: '', description: '', workTypes: [] });

    // Editing State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', description: '', workTypes: [] });

    // Delete Confirmation
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        const data = await api.academic.getConfig();
        if (!data.rubrics) data.rubrics = [];
        setConfig(data);
        setLoading(false);
    };

    const handleSave = async (updatedConfig) => {
        setIsSaving(true);
        const configToSave = updatedConfig || config;
        await api.academic.saveConfig(configToSave);
        setConfig(configToSave);
        setIsSaving(false);
        // show success check?
    };

    const handleAddRubric = () => {
        if (!newRubric.name.trim() || !newRubric.description.trim()) return;

        const newRubrics = [...config.rubrics, {
            id: `rub_${Date.now()}`,
            name: newRubric.name,
            description: newRubric.description,
            active: true,
            workTypes: newRubric.workTypes.length > 0 ? newRubric.workTypes : config.workTypes // Default to all if empty
        }];

        const updatedConfig = { ...config, rubrics: newRubrics };
        handleSave(updatedConfig);
        setNewRubric({ name: '', description: '', workTypes: [] });
        setIsAdding(false);
    };

    const handleDeleteRubric = (id) => {
        const newRubrics = config.rubrics.filter(r => r.id !== id);
        handleSave({ ...config, rubrics: newRubrics });
        setDeleteConfirmation(null);
    };

    const startEditing = (rubric) => {
        setEditingId(rubric.id);
        setEditForm({ ...rubric });
    };

    const saveEdit = () => {
        const newRubrics = config.rubrics.map(r =>
            r.id === editingId ? { ...r, ...editForm } : r
        );
        handleSave({ ...config, rubrics: newRubrics });
        setEditingId(null);
    };

    const toggleWorkType = (type, isNew = false) => {
        const target = isNew ? newRubric : editForm;
        const setTarget = isNew ? setNewRubric : setEditForm;

        const currentTypes = target.workTypes || [];
        const newTypes = currentTypes.includes(type)
            ? currentTypes.filter(t => t !== type)
            : [...currentTypes, type];

        setTarget({ ...target, workTypes: newTypes });
    };

    if (loading) return <div className="p-8 text-center">Cargando configuración...</div>;

    const availableWorkTypes = config.workTypes || [];

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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Criterio</label>
                            <input
                                className="w-full border rounded-md p-2"
                                placeholder="Ej. Originalidad"
                                value={newRubric.name}
                                onChange={e => setNewRubric({ ...newRubric, name: e.target.value })}
                            />
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Aplica a:</label>
                            <div className="flex flex-wrap gap-2">
                                {availableWorkTypes.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => toggleWorkType(type, true)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${(newRubric.workTypes || []).includes(type)
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleAddRubric} disabled={isSaving}>
                                Guardar Criterio
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* List */}
            <div className="space-y-4">
                {config.rubrics.map(rubric => {
                    if (editingId === rubric.id) {
                        return (
                            <Card key={rubric.id} className="p-6 border-2 border-blue-500 shadow-md">
                                <div className="space-y-4">
                                    <input
                                        className="w-full border rounded-md p-2 font-bold"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                    <textarea
                                        className="w-full border rounded-md p-2"
                                        rows={2}
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {availableWorkTypes.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => toggleWorkType(type, false)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${(editForm.workTypes || []).includes(type)
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-white text-gray-600 border-gray-300'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" onClick={() => setEditingId(null)}><X size={18} /></Button>
                                        <Button onClick={saveEdit}><Check size={18} /></Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    }

                    return (
                        <Card key={rubric.id} className="p-4 hover:shadow-md transition-shadow flex justify-between gap-4 group">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-gray-900">{rubric.name}</h3>
                                    {!rubric.active && <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded">Inactivo</span>}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{rubric.description}</p>
                                <div className="flex flex-wrap gap-1">
                                    {rubric.workTypes?.map(t => (
                                        <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{t}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" onClick={() => startEditing(rubric)}>
                                    <Edit size={18} />
                                </button>
                                <button className="p-2 text-red-600 hover:bg-red-50 rounded" onClick={() => setDeleteConfirmation(rubric)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
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
                                Está a punto de eliminar <strong>"{deleteConfirmation.name}"</strong>. Esta acción no se puede deshacer.
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
