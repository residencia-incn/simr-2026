import React, { useState, useEffect } from 'react';
import { Save, Plus, X, AlertTriangle, FileText, List, CheckSquare, Edit, Ban, Eye, Trash2, ChevronRight, Info, GripVertical, Check, Clock } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { api } from '../../services/api';

const AcademicConfig = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedWorkType, setSelectedWorkType] = useState(null);

    // Local state for new items
    const [newWorkType, setNewWorkType] = useState("");
    const [newDeclaration, setNewDeclaration] = useState("");
    const [newSection, setNewSection] = useState({ label: "", limit: 100 });
    const [isAddingSection, setIsAddingSection] = useState(false);

    // Editing & Dragging State
    const [editingSectionId, setEditingSectionId] = useState(null);
    const [editLabelValue, setEditLabelValue] = useState("");
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);

    // Delete confirmation state
    const [deleteConfirmation, setDeleteConfirmation] = useState(null); // { id, label }

    useEffect(() => {
        const loadConfig = async () => {
            const data = await api.academic.getConfig();
            // Migration fallback
            if (data && !data.sections && data.wordLimits) {
                // simple migration on client
                data.sections = Object.entries(data.wordLimits).map(([key, limit]) => ({
                    id: key,
                    label: key.charAt(0).toUpperCase() + key.slice(1),
                    limit,
                    active: true,
                    workTypes: data.workTypes || [] // Default to all if migrating
                }));
                delete data.wordLimits;
            }
            if (!data.titleWordLimit) data.titleWordLimit = 20;

            // Ensure sections have workTypes array
            if (data.sections) {
                data.sections = data.sections.map(s => ({
                    ...s,
                    workTypes: s.workTypes || [...(data.workTypes || [])]
                }));
            }

            setConfig(data);
            setLoading(false);
        };
        loadConfig();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        await api.academic.saveConfig(config);
        setIsSaving(false);
        alert("Configuración académica guardada correctamente");
    };

    // --- Title ---
    const handleTitleLimitChange = (val) => {
        setConfig(prev => ({ ...prev, titleWordLimit: parseInt(val) || 0 }));
    };

    // --- Penalties & Dates ---
    const handleConfigChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    // --- Sections Management (DnD & Content) ---

    // Drag & Drop Handlers
    const handleDragStart = (e, index) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const newSections = [...config.sections];
        const draggedItem = newSections[draggedItemIndex];
        newSections.splice(draggedItemIndex, 1);
        newSections.splice(index, 0, draggedItem);

        setConfig(prev => ({ ...prev, sections: newSections }));
        setDraggedItemIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedItemIndex(null);
    };

    // Renaming
    const startEditingSection = (section) => {
        setEditingSectionId(section.id);
        setEditLabelValue(section.label);
    };

    const saveSectionLabel = (id) => {
        if (editLabelValue.trim()) {
            setConfig(prev => ({
                ...prev,
                sections: prev.sections.map(s =>
                    s.id === id ? { ...s, label: editLabelValue.trim() } : s
                )
            }));
        }
        setEditingSectionId(null);
    };

    const handleToggleSectionForType = (sectionId, type) => {
        setConfig(prev => ({
            ...prev,
            sections: prev.sections.map(s => {
                if (s.id !== sectionId) return s;
                const currentTypes = s.workTypes || [];
                const newTypes = currentTypes.includes(type)
                    ? currentTypes.filter(t => t !== type)
                    : [...currentTypes, type];
                return { ...s, workTypes: newTypes };
            })
        }));
    };

    const handleSectionLimitChange = (id, newLimit) => {
        setConfig(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === id ? { ...s, limit: parseInt(newLimit) || 0 } : s
            )
        }));
    };

    const handleDeleteSection = (id) => {
        if (confirm("¿Eliminar esta sección de TODOS los tipos de trabajo?")) {
            setConfig(prev => ({
                ...prev,
                sections: prev.sections.filter(s => s.id !== id)
            }));
        }
    };

    const handleAddSection = () => {
        if (newSection.label.trim()) {
            const id = newSection.label.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const newItem = {
                id,
                label: newSection.label.trim(),
                limit: parseInt(newSection.limit) || 0,
                active: true,
                workTypes: config.workTypes || [] // Add to all by default or just selected? Let's add to all to avoid confusion
            };
            setConfig(prev => ({ ...prev, sections: [...(prev.sections || []), newItem] }));
            setNewSection({ label: "", limit: 100 });
            setIsAddingSection(false);
        }
    };

    // --- Work Types ---

    const handleAddWorkType = () => {
        if (newWorkType.trim() && !config.workTypes.includes(newWorkType.trim())) {
            setConfig(prev => ({
                ...prev,
                workTypes: [...prev.workTypes, newWorkType.trim()]
            }));
            setNewWorkType("");
        }
    };

    const handleRemoveWorkType = (type) => {
        if (confirm(`¿Eliminar el tipo de trabajo "${type}"?`)) {
            setConfig(prev => ({
                ...prev,
                workTypes: prev.workTypes.filter(t => t !== type),
                // Cleanup sections check
                sections: prev.sections.map(s => ({
                    ...s,
                    workTypes: s.workTypes.filter(wt => wt !== type)
                }))
            }));
            if (selectedWorkType === type) setSelectedWorkType(null);
        }
    };

    // --- Declarations ---

    const handleAddDeclaration = () => {
        if (newDeclaration.trim()) {
            const newDecl = {
                id: `d-${Date.now()}`,
                text: newDeclaration.trim(),
                required: true
            };
            setConfig(prev => ({
                ...prev,
                declarations: [...prev.declarations, newDecl]
            }));
            setNewDeclaration("");
        }
    };

    const handleRemoveDeclaration = (id) => {
        setConfig(prev => ({
            ...prev,
            declarations: prev.declarations.filter(d => d.id !== id)
        }));
    };

    const handleToggleDeclarationRequired = (id) => {
        setConfig(prev => ({
            ...prev,
            declarations: prev.declarations.map(d =>
                d.id === id ? { ...d, required: !d.required } : d
            )
        }));
    };

    if (loading || !config) return <div className="p-4 text-center">Cargando configuración...</div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header with Save Button */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-0 z-10">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Configuración Académica</h3>
                    <p className="text-sm text-gray-500">Define tipos de trabajo, estructura y requisitos.</p>
                </div>
                <Button onClick={handleSave} className="bg-blue-700 text-white flex items-center gap-2">
                    {isSaving ? "Guardando..." : <><Save size={18} /> Guardar Cambios</>}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* LEFT COLUMN: Types & Declarations */}
                <div className="lg:col-span-5 space-y-6">

                    {/* Work Types List */}
                    <Card className="p-6">
                        <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-4 border-b pb-2">
                            <List size={20} className="text-purple-600" />
                            Tipos de Trabajos
                        </h4>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newWorkType}
                                onChange={(e) => setNewWorkType(e.target.value)}
                                placeholder="Nuevo tipo..."
                                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddWorkType()}
                            />
                            <Button onClick={handleAddWorkType} disabled={!newWorkType.trim()} size="sm" variant="outline">
                                <Plus size={16} />
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {config.workTypes.map((type, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedWorkType(type)}
                                    className={`
                                        flex items-center justify-between p-3 rounded-md border cursor-pointer transition-all
                                        ${selectedWorkType === type
                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                            : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50'}
                                    `}
                                >
                                    <span className={`text-sm font-medium ${selectedWorkType === type ? 'text-blue-700' : 'text-gray-700'}`}>
                                        {type}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {selectedWorkType === type && <ChevronRight size={14} className="text-blue-400" />}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemoveWorkType(type); }}
                                            className="text-gray-300 hover:text-red-500 p-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <Info size={12} /> Selecciona un tipo para editar su estructura.
                        </p>
                    </Card>

                    {/* Deadlines & Penalties Card (NEW) */}
                    <Card className="p-6">
                        <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-4 border-b pb-2">
                            <Clock size={20} className="text-orange-600" />
                            Plazos y Penalidades
                        </h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Límite de Envío</label>
                                <input
                                    type="datetime-local"
                                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    value={config.submissionDeadline || ''}
                                    onChange={(e) => handleConfigChange('submissionDeadline', e.target.value)}
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Fecha máxima para envíos regulares sin penalidad.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Límite de Prórroga</label>
                                <input
                                    type="datetime-local"
                                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                                    value={config.extensionDeadline || ''}
                                    onChange={(e) => handleConfigChange('extensionDeadline', e.target.value)}
                                />
                                <p className="text-[10px] text-orange-600 mt-1">Envíos en este periodo tendrán penalidad.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Penalidad por Envío Tardío (Puntos)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        className="w-20 p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                                        value={config.latePenalty || 0}
                                        onChange={(e) => handleConfigChange('latePenalty', parseFloat(e.target.value))}
                                    />
                                    <span className="text-sm text-gray-500">puntos menos</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Declarations */}
                    <Card className="p-6">
                        <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-4 border-b pb-2">
                            <CheckSquare size={20} className="text-green-600" />
                            Declaraciones Juradas
                        </h4>

                        <div className="mb-4 flex gap-2">
                            <input
                                type="text"
                                value={newDeclaration}
                                onChange={(e) => setNewDeclaration(e.target.value)}
                                placeholder="Nueva declaración..."
                                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddDeclaration()}
                            />
                            <Button onClick={handleAddDeclaration} disabled={!newDeclaration.trim()} size="sm">
                                <Plus size={16} />
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {config.declarations.map((decl) => (
                                <div key={decl.id} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-gray-100 text-sm">
                                    <div className="flex flex-col items-center gap-1 mt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={decl.required}
                                            onChange={() => handleToggleDeclarationRequired(decl.id)}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                            title="Es obligatorio"
                                        />
                                        <span className="text-[9px] text-gray-400">Req.</span>
                                    </div>
                                    <span className="flex-1 text-gray-700">{decl.text}</span>
                                    <button onClick={() => handleRemoveDeclaration(decl.id)} className="text-gray-300 hover:text-red-500 p-1">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Structure Config */}
                <div className="lg:col-span-7">
                    {selectedWorkType ? (
                        <Card className="p-6 min-h-[600px] animate-slideIn">
                            <div className="mb-6 pb-4 border-b">
                                <h4 className="flex items-center gap-2 font-bold text-xl text-gray-900">
                                    <FileText size={24} className="text-blue-600" />
                                    Estructura y Límites
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">
                                    Configurando para: <span className="font-bold text-blue-700">{selectedWorkType}</span>
                                </p>
                            </div>

                            {/* Title Global Config (Shown here for convenience) */}
                            <div className="mb-6 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Límite Global de Palabras del Título</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min="5"
                                        value={config.titleWordLimit}
                                        onChange={(e) => handleTitleLimitChange(e.target.value)}
                                        className="w-24 p-2 border border-blue-300 rounded-md text-center font-mono focus:ring-blue-500 focus:outline-none"
                                    />
                                    <span className="text-sm text-gray-500">palabras</span>
                                </div>
                            </div>

                            {/* Sections Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="font-bold text-gray-700">Secciones del Resumen</h5>
                                <Button size="sm" variant="outline" onClick={() => setIsAddingSection(true)} disabled={isAddingSection}>
                                    <Plus size={16} className="mr-1" /> Nueva Sección
                                </Button>
                            </div>

                            {/* Add Section Form */}
                            {isAddingSection && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 animate-fadeIn">
                                    <h6 className="text-xs font-bold text-gray-500 uppercase mb-2">Definir Nueva Sección</h6>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            className="flex-1 p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Nombre de sección (Ej: Bibliografía)"
                                            value={newSection.label}
                                            onChange={(e) => setNewSection({ ...newSection, label: e.target.value })}
                                        />
                                        <input
                                            type="number"
                                            className="w-24 p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Límite"
                                            value={newSection.limit}
                                            onChange={(e) => setNewSection({ ...newSection, limit: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button size="xs" variant="ghost" onClick={() => setIsAddingSection(false)}>Cancelar</Button>
                                        <Button size="xs" onClick={handleAddSection}>Crear Sección</Button>
                                    </div>
                                </div>
                            )}

                            {/* Sections List */}
                            <div className="space-y-3">
                                {config.sections && config.sections.map((section, index) => {
                                    const isActiveForType = section.workTypes && section.workTypes.includes(selectedWorkType);

                                    return (
                                        <div
                                            key={section.id}
                                            className={`
                                                flex items-center gap-3 p-3 rounded-lg border transition-all
                                                ${isActiveForType ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-75'}
                                            `}
                                        >
                                            {/* Drag Handle - ONLY this part is draggable */}
                                            <div
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, index)}
                                                onDragOver={(e) => handleDragOver(e, index)}
                                                onDragEnd={handleDragEnd}
                                                className={`text-gray-300 cursor-move hover:text-gray-500 p-1 ${draggedItemIndex === index ? 'text-blue-500' : ''}`}
                                                title="Arrastrar para reordenar"
                                            >
                                                <GripVertical size={20} />
                                            </div>

                                            {/* Toggle Checkbox */}
                                            <div className="flex items-center h-full">
                                                <input
                                                    type="checkbox"
                                                    checked={isActiveForType}
                                                    onChange={() => handleToggleSectionForType(section.id, selectedWorkType)}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                                />
                                            </div>

                                            {/* Section Info / Edit Mode */}
                                            <div className="flex-1">
                                                {editingSectionId === section.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            autoFocus
                                                            className="flex-1 p-1 text-sm border rounded outline-none ring-2 ring-blue-200"
                                                            value={editLabelValue}
                                                            onChange={(e) => setEditLabelValue(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && saveSectionLabel(section.id)}
                                                        />
                                                        <button onClick={() => saveSectionLabel(section.id)} className="text-green-600 p-1 bg-green-50 rounded">
                                                            <Check size={14} />
                                                        </button>
                                                        <button onClick={() => setEditingSectionId(null)} className="text-red-500 p-1 bg-red-50 rounded">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 group">
                                                        <span className={`font-medium ${isActiveForType ? 'text-gray-900' : 'text-gray-500'}`}>
                                                            {section.label}
                                                        </span>
                                                        <button
                                                            onClick={() => startEditingSection(section)}
                                                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-opacity"
                                                            title="Renombrar sección"
                                                        >
                                                            <Edit size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Config (Limit & Delete) - NOT draggable */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                                    <span className="text-xs text-gray-500">Límite:</span>
                                                    <input
                                                        type="number"
                                                        value={section.limit}
                                                        onChange={(e) => handleSectionLimitChange(section.id, e.target.value)}
                                                        className="w-16 bg-transparent text-right text-sm font-mono focus:outline-none"
                                                    />
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setDeleteConfirmation({ id: section.id, label: section.label });
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                                                    title="Eliminar sección globalmente"
                                                    type="button"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                        </Card>
                    ) : (
                        // Empty State for Right Column
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 p-6 text-center">
                            <List size={48} className="mb-4 opacity-20" />
                            <h4 className="text-lg font-bold text-gray-500">Selecciona un Tipo de Trabajo</h4>
                            <p className="max-w-xs mx-auto mt-2">
                                Haz clic en un tipo de trabajo de la lista de la izquierda para configurar su estructura y límites.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Delete Confirmation Dialog */}
            {deleteConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md shadow-xl">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertTriangle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    ¿Eliminar sección?
                                </h3>
                                <p className="text-sm text-gray-600">
                                    ¿Estás seguro de que deseas eliminar la sección <strong>"{deleteConfirmation.label}"</strong> de TODOS los tipos de trabajo?
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Esta acción no se puede deshacer.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteConfirmation(null)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={() => {
                                    setConfig(prev => ({
                                        ...prev,
                                        sections: prev.sections.filter(s => s.id !== deleteConfirmation.id)
                                    }));
                                    setDeleteConfirmation(null);
                                }}
                            >
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicConfig;
