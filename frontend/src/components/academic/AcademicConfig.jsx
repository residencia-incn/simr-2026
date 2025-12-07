import React, { useState, useEffect } from 'react';
import { Save, Plus, X, AlertTriangle, FileText, List, CheckSquare, Edit, Ban, Eye, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { api } from '../../services/api';

const AcademicConfig = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Local state for new items
    const [newWorkType, setNewWorkType] = useState("");
    const [newDeclaration, setNewDeclaration] = useState("");
    const [newSection, setNewSection] = useState({ label: "", limit: 100 });
    const [isAddingSection, setIsAddingSection] = useState(false);

    useEffect(() => {
        const loadConfig = async () => {
            const data = await api.academic.getConfig();
            // Migration fallback if old config exists
            if (data && !data.sections && data.wordLimits) {
                // simple migration on client
                data.sections = Object.entries(data.wordLimits).map(([key, limit]) => ({
                    id: key,
                    label: key.charAt(0).toUpperCase() + key.slice(1),
                    limit,
                    active: true
                }));
                delete data.wordLimits;
            }
            if (!data.titleWordLimit) data.titleWordLimit = 20;

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

    // --- Sections ---

    const handleSectionChange = (id, field, value) => {
        setConfig(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === id ? { ...s, [field]: value } : s
            )
        }));
    };

    const handleToggleSectionActive = (id) => {
        setConfig(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === id ? { ...s, active: !s.active } : s
            )
        }));
    };

    const handleAddSection = () => {
        if (newSection.label.trim()) {
            const id = newSection.label.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const newItem = {
                id,
                label: newSection.label.trim(),
                limit: parseInt(newSection.limit) || 0,
                active: true
            };
            setConfig(prev => ({ ...prev, sections: [...(prev.sections || []), newItem] }));
            setNewSection({ label: "", limit: 100 });
            setIsAddingSection(false);
        }
    };

    const handleDeleteSection = (id) => {
        if (confirm("¿Eliminar esta sección?")) {
            setConfig(prev => ({
                ...prev,
                sections: prev.sections.filter(s => s.id !== id)
            }));
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
        setConfig(prev => ({
            ...prev,
            workTypes: prev.workTypes.filter(t => t !== type)
        }));
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
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Configuración Académica</h3>
                    <p className="text-sm text-gray-500">Define reglas de negocio, límites y requisitos para los trabajos.</p>
                </div>
                <Button onClick={handleSave} className="bg-blue-700 text-white flex items-center gap-2">
                    {isSaving ? "Guardando..." : <><Save size={18} /> Guardar Cambios</>}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Structure & Limits */}
                <Card className="p-6 lg:row-span-2">
                    <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2">
                        <FileText size={20} className="text-blue-600" />
                        Estructura y Límites
                    </h4>

                    {/* Title Limit */}
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Límite de Palabras del Título</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="5"
                                value={config.titleWordLimit}
                                onChange={(e) => handleTitleLimitChange(e.target.value)}
                                className="w-24 p-2 border border-gray-300 rounded-md text-center font-mono"
                            />
                            <span className="text-sm text-gray-500">palabras</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <h5 className="font-bold text-gray-700 text-sm">Secciones del Resumen</h5>
                        <Button size="xs" variant="outline" onClick={() => setIsAddingSection(true)} disabled={isAddingSection}>
                            <Plus size={14} className="mr-1" /> Nueva Sección
                        </Button>
                    </div>

                    {isAddingSection && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4 animate-fadeIn">
                            <div className="flex gap-2 mb-2">
                                <input
                                    className="flex-1 p-2 text-sm border rounded"
                                    placeholder="Nombre de sección (Ej: Bibliografía)"
                                    value={newSection.label}
                                    onChange={(e) => setNewSection({ ...newSection, label: e.target.value })}
                                />
                                <input
                                    type="number"
                                    className="w-20 p-2 text-sm border rounded"
                                    placeholder="Límite"
                                    value={newSection.limit}
                                    onChange={(e) => setNewSection({ ...newSection, limit: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button size="xs" variant="ghost" onClick={() => setIsAddingSection(false)}>Cancelar</Button>
                                <Button size="xs" onClick={handleAddSection}>Agregar</Button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {config.sections?.map((section) => (
                            <div key={section.id} className={`p-3 rounded-lg border transition-all ${section.active ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-100 opacity-60'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex-1">
                                        <input
                                            value={section.label}
                                            onChange={(e) => handleSectionChange(section.id, 'label', e.target.value)}
                                            className="font-medium text-gray-900 bg-transparent border-b border-transparent focus:border-blue-400 outline-none w-full"
                                            disabled={!section.active}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleToggleSectionActive(section.id)}
                                            className={`p-1.5 rounded-md transition-colors ${section.active ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50' : 'text-gray-400 hover:text-green-500 hover:bg-green-50'}`}
                                            title={section.active ? "Desactivar Sección" : "Activar Sección"}
                                        >
                                            {section.active ? <Ban size={16} /> : <Eye size={16} />}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSection(section.id)}
                                            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            title="Eliminar Sección"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {section.active && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500">Límite:</span>
                                        <input
                                            type="number"
                                            value={section.limit}
                                            onChange={(e) => handleSectionChange(section.id, 'limit', parseInt(e.target.value))}
                                            className="w-20 p-1 border border-gray-300 rounded text-center text-xs"
                                        />
                                        <span className="text-xs text-gray-400">palabras</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                {/* 2. Work Types */}
                <Card className="p-6">
                    <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2">
                        <List size={20} className="text-purple-600" />
                        Tipos de Trabajos
                    </h4>
                    <div className="space-y-4">
                        <div className="flex gap-2">
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
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {config.workTypes.map((type, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-100">
                                    <span className="text-sm font-medium text-gray-700">{type}</span>
                                    <button onClick={() => handleRemoveWorkType(type)} className="text-gray-400 hover:text-red-500">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* 3. Declarations */}
                <Card className="p-6">
                    <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2">
                        <CheckSquare size={20} className="text-green-600" />
                        Declaraciones Juradas
                    </h4>

                    <div className="mb-4 flex gap-2">
                        <input
                            type="text"
                            value={newDeclaration}
                            onChange={(e) => setNewDeclaration(e.target.value)}
                            placeholder="Texto de la nueva declaración..."
                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddDeclaration()}
                        />
                        <Button onClick={handleAddDeclaration} disabled={!newDeclaration.trim()} size="sm">
                            <Plus size={16} /> Agregar
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {config.declarations.map((decl) => (
                            <div key={decl.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex flex-col items-center gap-1">
                                    <input
                                        type="checkbox"
                                        checked={decl.required}
                                        onChange={() => handleToggleDeclarationRequired(decl.id)}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                        title="Es obligatorio"
                                    />
                                    <span className="text-[10px] text-gray-400">Req.</span>
                                </div>
                                <span className="flex-1 text-sm text-gray-700">{decl.text}</span>
                                <button onClick={() => handleRemoveDeclaration(decl.id)} className="text-gray-400 hover:text-red-500 p-1">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default AcademicConfig;
