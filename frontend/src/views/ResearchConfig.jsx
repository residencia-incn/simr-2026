import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, FileText, Calendar, AlertTriangle, Settings, ArrowUp, ArrowDown } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/ui';

const ResearchConfig = () => {
    const [submissionTypes, setSubmissionTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Default structure for new type
    const emptyType = {
        name: "Nuevo Tipo de Trabajo",
        deadline_standard: new Date().toISOString().slice(0, 16), // datetime-local format
        deadline_extended: "",
        penalty_per_day: 0.0,
        sections: [],
        checklist_config: ["Formato y Estructura Correcta", "Cumplimiento de Límite de Palabras", "Resguardo de Anonimato", "Bibliografía en Formato Vancouver"]
    };

    const [activeType, setActiveType] = useState(emptyType);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Load types on mount
    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        setIsLoading(true);
        try {
            const types = await api.research.getTypes();
            if (types && types.length > 0) {
                setSubmissionTypes(types);
                setActiveType(types[0]);
            } else {
                // Init with one empty type if none exist
                setSubmissionTypes([]);
                setActiveType(emptyType);
            }
        } catch (error) {
            console.error("Error loading types:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTypeChange = (field, value) => {
        setActiveType(prev => ({ ...prev, [field]: value }));
        setHasUnsavedChanges(true);
    };

    const handleSectionChange = (sectionId, field, value) => {
        setActiveType(prev => ({
            ...prev,
            sections: prev.sections.map(sec =>
                sec.id === sectionId ? { ...sec, [field]: value } : sec
            )
        }));
        setHasUnsavedChanges(true);
    };

    const addSection = () => {
        // Generate temporary ID for new sections (negative to distinguish from DB ids)
        const newId = (Math.min(...activeType.sections.map(s => s.id), 0) - 1);
        const newSection = {
            id: newId,
            title: "Nueva Sección",
            help_text: "",
            max_words: 200,
            data_type: "TEXT",
            is_required: true,
            section_order: activeType.sections.length + 1
        };
        setActiveType(prev => ({
            ...prev,
            sections: [...prev.sections, newSection]
        }));
        setHasUnsavedChanges(true);
    };

    const removeSection = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar sección?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setActiveType(prev => ({
                ...prev,
                sections: prev.sections.filter(s => s.id !== id)
            }));
            setHasUnsavedChanges(true);
        }
    };

    const handleNewType = async () => {
        if (hasUnsavedChanges) {
            const result = await Swal.fire({
                title: '¿Descartar cambios?',
                text: "Tienes cambios sin guardar. ¿Deseas descartarlos?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, descartar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    setActiveType(emptyType);
                    setHasUnsavedChanges(true); // It's a new unsaved type
                }
            });
        } else {
            setActiveType(emptyType);
            setHasUnsavedChanges(true); // It's a new unsaved type
        }
    };

    const addChecklistItem = () => {
        const current = activeType.checklist_config || [];
        handleTypeChange('checklist_config', [...current, "Nuevo ítem de verificación"]);
    };

    const updateChecklistItem = (index, value) => {
        const current = [...(activeType.checklist_config || [])];
        current[index] = value;
        handleTypeChange('checklist_config', current);
    };

    const removeChecklistItem = (index) => {
        const current = [...(activeType.checklist_config || [])];
        current.splice(index, 1);
        handleTypeChange('checklist_config', current);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Validate required fields
            if (!activeType.name.trim()) {
                Swal.fire('Error', 'El nombre del tipo de trabajo es obligatorio.', 'error');
                setIsSaving(false);
                return;
            }

            // Prepare payload - strictly match Pydantic schema
            const payload = {
                name: activeType.name,
                description: activeType.description || null, // Ensure description is sent
                deadline_standard: activeType.deadline_standard,
                deadline_extended: activeType.deadline_extended || null,
                penalty_per_day: activeType.penalty_per_day,
                is_active: activeType.is_active !== false,
                checklist_config: activeType.checklist_config || [],
                sections: activeType.sections.map((s, i) => ({
                    title: s.title,
                    help_text: s.help_text,
                    section_order: i + 1,
                    data_type: s.data_type,
                    min_words: s.min_words || 0,
                    max_words: s.max_words || null,
                    allowed_file_types: s.allowed_file_types || null,
                    is_required: s.is_required
                }))
            };

            let savedType;
            if (activeType.id) {
                // UPDATE existing
                savedType = await api.research.updateType(activeType.id, payload);
            } else {
                // CREATE new
                savedType = await api.research.createType(payload);
            }

            // Reload list
            await loadTypes();

            // Set active to the newly created/updated one
            // We need to match by ID if it was an update, or name if new
            const newInList = submissionTypes.find(t => t.id === savedType.id) || savedType;
            // Note: submissionTypes might not be updated yet if loadTypes state update is async batching
            // But await loadTypes() waits for the API call. React state update is async. 
            // Better to just set it to the response savedType which handles the immediate UI need.
            setActiveType(savedType);

            setHasUnsavedChanges(false);
            Swal.fire({
                title: 'Guardado',
                text: activeType.id ? 'Cambios actualizados correctamente.' : 'Nuevo tipo creado exitosamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error saving:", error);
            // Parse Backend Validation Errors
            let errorMessage = "Ha ocurrido un error al guardar.";

            if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (Array.isArray(detail)) {
                    // Pydantic validation errors
                    errorMessage = detail.map(err => {
                        const field = err.loc[err.loc.length - 1];
                        return `${field}: ${err.msg}`;
                    }).join('\n');
                } else if (typeof detail === 'string') {
                    errorMessage = detail;
                } else {
                    errorMessage = JSON.stringify(detail);
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            Swal.fire('Error al guardar', errorMessage, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <LoadingSpinner text="Cargando configuración..." className="h-screen" />;

    return (
        <div className="p-6 bg-gray-50 min-h-screen animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Settings className="w-6 h-6" /> Configuración de Investigación
                </h1>
                <button
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || isSaving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${hasUnsavedChanges && !isSaving
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                >
                    {isSaving ? <LoadingSpinner size="sm" color="text-gray-500" /> : <Save className="w-4 h-4" />}
                    {isSaving ? "Guardando..." : (activeType.id ? "Guardar Cambios" : "Guardar Nuevo Tipo")}
                </button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Sidebar */}
                <div className="col-span-12 md:col-span-3 bg-white rounded-xl shadow-sm p-4 border border-gray-100 h-fit">
                    <h3 className="font-semibold text-gray-500 text-sm uppercase mb-4">Tipos Definidos</h3>
                    <ul className="space-y-2">
                        {submissionTypes.map(type => (
                            <li
                                key={type.id}
                                onClick={async () => {
                                    if (hasUnsavedChanges) {
                                        const result = await Swal.fire({
                                            title: '¿Descartar cambios?',
                                            text: "Tienes cambios sin guardar. ¿Deseas descartarlos?",
                                            icon: 'warning',
                                            showCancelButton: true,
                                            confirmButtonColor: '#3085d6',
                                            cancelButtonColor: '#d33',
                                            confirmButtonText: 'Sí, descartar',
                                            cancelButtonText: 'Cancelar'
                                        });
                                        if (!result.isConfirmed) return;
                                    }
                                    setActiveType(type);
                                    setHasUnsavedChanges(false);
                                }}
                                className={`p-3 rounded-lg cursor-pointer flex items-center justify-between ${activeType.id === type.id ? "bg-blue-50 text-blue-700 border border-blue-200" : "hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium">{type.name}</span>
                                    <span className="text-[10px] text-gray-400">ID: {type.id}</span>
                                </div>
                            </li>
                        ))}
                        <li className="mt-4 pt-4 border-t border-gray-100">
                            <button
                                onClick={handleNewType}
                                className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-500 flex justify-center items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Nuevo Tipo
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Editor */}
                <div className="col-span-12 md:col-span-9 space-y-6">

                    {/* General Config */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" /> Parámetros y Fechas
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Tipo de Trabajo</label>
                                <input
                                    type="text"
                                    value={activeType.name}
                                    onChange={(e) => handleTypeChange('name', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej. Reporte de Caso Clínico"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite Regular</label>
                                <input
                                    type="datetime-local"
                                    value={activeType.deadline_standard ? activeType.deadline_standard.slice(0, 16) : ""}
                                    onChange={(e) => handleTypeChange('deadline_standard', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-red-600">Fecha Límite con Prórroga</label>
                                <input
                                    type="datetime-local"
                                    value={activeType.deadline_extended ? activeType.deadline_extended.slice(0, 16) : ""}
                                    onChange={(e) => handleTypeChange('deadline_extended', e.target.value)}
                                    className="w-full p-2 border border-red-200 bg-red-50 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Penalidad por Día (Puntos)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={activeType.penalty_per_day}
                                    onChange={(e) => handleTypeChange('penalty_per_day', parseFloat(e.target.value))}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 outline-none"
                                />
                            </div>
                            <div className="flex items-center mt-6">
                                <input
                                    type="checkbox"
                                    checked={activeType.is_active !== false}
                                    onChange={(e) => handleTypeChange('is_active', e.target.checked)}
                                    className="w-4 h-4 text-green-600 rounded mr-2"
                                />
                                <label className="text-sm font-medium text-gray-700">Activo para Envíos</label>
                            </div>
                        </div>
                    </div>

                    {/* Section Builder */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" /> Estructura del Trabajo
                            </h3>
                            <button onClick={addSection} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-100 font-medium transition-colors">
                                + Agregar Sección
                            </button>
                        </div>

                        <div className="space-y-4">
                            {activeType.sections?.map((section, index) => (
                                <div key={section.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50/50 relative group">
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => removeSection(section.id)} className="text-gray-400 hover:text-red-500 p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-12 gap-4 items-end">
                                        <div className="col-span-1 flex flex-col items-center justify-center gap-1">
                                            {index > 0 && (
                                                <button
                                                    onClick={() => moveSection(index, -1)}
                                                    className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                                                    title="Mover arriba"
                                                >
                                                    <ArrowUp className="w-4 h-4" />
                                                </button>
                                            )}
                                            <div className="text-gray-400 font-bold text-xl leading-none">
                                                {index + 1}
                                            </div>
                                            {index < activeType.sections.length - 1 && (
                                                <button
                                                    onClick={() => moveSection(index, 1)}
                                                    className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                                                    title="Mover abajo"
                                                >
                                                    <ArrowDown className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="col-span-4">
                                            <label className="text-xs text-gray-500 font-semibold uppercase">Título Sección</label>
                                            <input
                                                type="text"
                                                value={section.title}
                                                onChange={(e) => handleSectionChange(section.id, 'title', e.target.value)}
                                                className="w-full mt-1 p-2 bg-white border border-gray-300 rounded text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                                                placeholder="Ej. Introducción"
                                            />
                                        </div>

                                        <div className="col-span-3">
                                            <label className="text-xs text-gray-500 font-semibold uppercase">Tipo de Dato</label>
                                            <select
                                                value={section.data_type}
                                                onChange={(e) => handleSectionChange(section.id, 'data_type', e.target.value)}
                                                className="w-full mt-1 p-2 bg-white border border-gray-300 rounded text-sm outline-none"
                                            >
                                                <option value="TEXT">Texto (Abstract/Cuerpo)</option>
                                                <option value="FILE">Archivo (PDF/IMG)</option>
                                                <option value="BOOLEAN">Checkbox (Declaración)</option>
                                            </select>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="text-xs text-gray-500 font-semibold uppercase">Límites</label>
                                            {section.data_type === 'TEXT' ? (
                                                <input
                                                    type="number"
                                                    placeholder="Max Palabras"
                                                    value={section.max_words || ''}
                                                    onChange={(e) => handleSectionChange(section.id, 'max_words', parseInt(e.target.value))}
                                                    className="w-full mt-1 p-2 bg-white border border-gray-300 rounded text-sm outline-none"
                                                />
                                            ) : section.data_type === 'FILE' ? (
                                                <input
                                                    type="text"
                                                    placeholder=".pdf,.jpg"
                                                    value={section.allowed_file_types || ''}
                                                    onChange={(e) => handleSectionChange(section.id, 'allowed_file_types', e.target.value)}
                                                    className="w-full mt-1 p-2 bg-white border border-gray-300 rounded text-sm outline-none"
                                                />
                                            ) : (
                                                <div className="mt-1 p-2 text-xs text-gray-400 italic">Sin límites</div>
                                            )}
                                        </div>

                                        <div className="col-span-2 flex items-center gap-2 mb-2">
                                            <input
                                                type="checkbox"
                                                checked={section.is_required}
                                                onChange={(e) => handleSectionChange(section.id, 'is_required', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="text-sm text-gray-600">Obligatorio</span>
                                        </div>

                                        <div className="col-span-11 col-start-2 mt-2">
                                            <input
                                                type="text"
                                                placeholder="Instrucciones para el residente (Placeholder/Tooltip)"
                                                value={section.help_text || ''}
                                                onChange={(e) => handleSectionChange(section.id, 'help_text', e.target.value)}
                                                className="w-full p-2 bg-white border border-gray-200 rounded text-xs text-gray-600 italic outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {(!activeType.sections || activeType.sections.length === 0) && (
                                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>Este tipo de trabajo aún no tiene secciones definidas.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Checklist Builder */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <ClipboardCheck className="w-5 h-5 text-indigo-600" /> Lista de Verificación de Revisión (Checklist)
                            </h3>
                            <button onClick={addChecklistItem} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md hover:bg-indigo-100 font-medium transition-colors">
                                + Agregar Punto
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mb-4 italic">
                            Estos puntos aparecerán en el "Panel de Evaluación" del revisor. Todos deben ser marcados para permitir el "Visto Bueno".
                        </p>

                        <div className="space-y-3">
                            {(activeType.checklist_config || []).map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-right-2 duration-200" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="bg-slate-100 text-slate-500 w-8 h-8 rounded flex items-center justify-center font-bold text-xs shrink-0">
                                        {idx + 1}
                                    </div>
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => updateChecklistItem(idx, e.target.value)}
                                        className="flex-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                        placeholder="Ej. Formato y Estructura Correcta"
                                    />
                                    <button
                                        onClick={() => removeChecklistItem(idx)}
                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Eliminar punto"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            {(!activeType.checklist_config || activeType.checklist_config.length === 0) && (
                                <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 italic text-sm">
                                    No hay puntos definidos. El revisor podrá aprobar sin restricciones.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ClipboardCheck = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="m9 14 2 2 4-4"></path></svg>
);

export default ResearchConfig;
