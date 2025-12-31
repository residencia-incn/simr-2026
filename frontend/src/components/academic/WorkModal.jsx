import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import Badge from '../ui/Badge';
import {
    AlertCircle, Save, Info, Users, FileText,
    Calendar, Tag, BookOpen, Edit3
} from 'lucide-react';
import { api } from '../../services/api';

const WorkModal = ({ isOpen, onClose, work, mode = 'view', onSave }) => {
    // Determine if we are in 'edit' mode based on prop AND if onSave is provided
    const isEditing = mode === 'edit' && !!onSave;

    if (!work) return null;

    const [formData, setFormData] = useState({ title: '', abstract: {} });
    const [academicConfig, setAcademicConfig] = useState(null);
    const [sections, setSections] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize/Reset form data when work or mode changes
    useEffect(() => {
        if (work) {
            setFormData({
                title: work.title || '',
                abstract: { ...work.abstract }
            });
        }
    }, [work, isOpen]);

    // Load Config
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await api.academic.getConfig();
                setAcademicConfig(config);
                let loadedSections = config.sections || [];
                if (!loadedSections.length && config.wordLimits) {
                    loadedSections = Object.entries(config.wordLimits).map(([key, limit]) => ({
                        id: key,
                        label: key.charAt(0).toUpperCase() + key.slice(1),
                        limit,
                        active: true
                    }));
                }
                setSections(loadedSections.filter(s => s.active));
            } catch (error) {
                console.error("Error loading config", error);
            }
        };
        if (isOpen) loadConfig();
    }, [isOpen]);

    const handleChange = (field, value) => {
        if (!isEditing) return;
        if (field === 'title') {
            setFormData(prev => ({ ...prev, title: value }));
        } else {
            setFormData(prev => ({
                ...prev,
                abstract: { ...prev.abstract, [field]: value }
            }));
        }
    };

    const countWords = (str) => {
        if (!str) return 0;
        return str.trim().split(/\s+/).length;
    };

    const handleSubmit = async () => {
        if (!isEditing) return;
        setIsSaving(true);
        try {
            // Validation
            if (academicConfig?.titleWordLimit && countWords(formData.title) > academicConfig.titleWordLimit) {
                alert(`El título excede el límite de ${academicConfig.titleWordLimit} palabras.`);
                setIsSaving(false);
                return;
            }

            const updatedWork = {
                ...work,
                title: formData.title,
                abstract: formData.abstract,
                status: 'En Evaluación'
            };
            await onSave(updatedWork);
            onClose();
        } catch (error) {
            console.error("Error saving work", error);
            alert("Error al guardar cambios.");
        } finally {
            setIsSaving(false);
        }
    };

    // Helper: Authors Render
    const renderAuthors = () => {
        const authors = Array.isArray(work.authors) ? work.authors : (work.author ? [{ name: work.author, role: 'Principal' }] : []);
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {authors.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded border border-gray-200 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                            {(a.name || 'A')[0]}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-medium text-sm text-gray-900 truncate" title={a.name}>{a.name}</p>
                            <p className="text-xs text-gray-500 truncate">{a.role || a.email || a.institution || 'Autor'}</p>
                        </div>
                        {idx === 0 && <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 font-medium ml-auto">Principal</span>}
                    </div>
                ))}
            </div>
        );
    };

    // Helper: Header Render
    const renderHeader = () => (
        <div className="border-b pb-4 mb-4">
            <div className="flex justify-between items-start gap-4 mb-2">
                {isEditing ? (
                    <div className="w-full">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título del Trabajo</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className="w-full p-2 text-lg font-bold text-gray-900 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <div className={`text-xs text-right mt-1 ${countWords(formData.title) > (academicConfig?.titleWordLimit || 20) ? 'text-red-600' : 'text-gray-400'
                            }`}>
                            {countWords(formData.title)} / {academicConfig?.titleWordLimit || 20} palabras
                        </div>
                    </div>
                ) : (
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                        {work.title}
                    </h3>
                )}
                {!isEditing && (
                    <Badge type={work.status === 'Aceptado' ? 'success' : work.status === 'Rechazado' ? 'error' : 'warning'}>
                        {work.status}
                    </Badge>
                )}
            </div>

            {!isEditing && (
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center gap-1">
                        <Tag size={14} className="text-blue-600" />
                        <span className="font-medium">{work.type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <BookOpen size={14} className="text-purple-600" />
                        <span>{work.specialty}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-green-600" />
                        <span>{new Date(work.date || Date.now()).toLocaleDateString()}</span>
                    </div>
                </div>
            )}
        </div>
    );

    const hasObservations = (!!work.feedback && work.feedback.length > 0) || (!!work.observations && work.observations.length > 0);

    // In View mode, show observations if they exist (especially for Observado status)
    // In Edit mode, ALWAYS show observations panel (if status warrants editing, presumably there are observations)
    const showObservations = isEditing || hasObservations;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Trabajo" : "Detalles del Trabajo"}
            size="3xl"
        >
            <div className={`flex flex-col lg:flex-row gap-6 ${isEditing ? 'h-[70vh]' : ''}`}>

                {/* Main Content (Left if observations present) */}
                <div className={`flex-1 space-y-6 ${isEditing ? 'overflow-y-auto pr-2' : ''}`}>
                    {renderHeader()}

                    {/* Authors */}
                    <div>
                        <h4 className="flex items-center gap-2 font-bold text-gray-800 text-sm uppercase tracking-wide border-b pb-2 mb-2">
                            <Users size={16} /> Autores
                            {isEditing && <span className="text-xs font-normal text-gray-400 normal-case ml-2">(No editable)</span>}
                        </h4>
                        {renderAuthors()}
                    </div>

                    {/* Abstract */}
                    <div>
                        <h4 className="flex items-center gap-2 font-bold text-gray-800 text-sm uppercase tracking-wide border-b pb-2 mb-4">
                            <FileText size={16} /> Resumen Estructurado
                        </h4>
                        <div className="space-y-4">
                            {sections.map(section => (
                                <div key={section.id}>
                                    {isEditing ? (
                                        <>
                                            <FormField
                                                label={section.label}
                                                type="textarea"
                                                value={formData.abstract[section.id] || ''}
                                                onChange={(e) => handleChange(section.id, e.target.value)}
                                                rows={4}
                                                className="mb-1"
                                            />
                                            <div className={`text-xs text-right ${countWords(formData.abstract[section.id]) > section.limit ? 'text-red-600' : 'text-gray-400'
                                                }`}>
                                                {countWords(formData.abstract[section.id] || '')} / {section.limit} palabras
                                            </div>
                                        </>
                                    ) : (
                                        <div className="mb-3">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-1">{section.label}</h5>
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                                {work.abstract?.[section.id] || <span className="italic text-gray-400">Sin contenido</span>}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Observations */}
                {showObservations && (
                    <div className="lg:w-1/3 flex flex-col gap-4 border-l pl-4 lg:pl-6 border-gray-100">
                        <div className={`p-4 rounded-lg sticky top-0 ${isEditing ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 border border-gray-200'}`}>
                            <h4 className={`font-bold flex items-center gap-2 mb-2 ${isEditing ? 'text-orange-800' : 'text-gray-700'}`}>
                                <AlertCircle size={18} /> Observaciones
                            </h4>
                            <div className={`text-sm leading-relaxed whitespace-pre-line ${isEditing ? 'text-orange-900' : 'text-gray-600'}`}>
                                {work.feedback || work.observation || work.observations || "No hay observaciones registradas."}
                            </div>

                            {isEditing && (
                                <div className="mt-4 text-xs text-orange-700 flex items-start gap-1">
                                    <Info size={14} className="shrink-0 mt-0.5" />
                                    <p>Por favor revise las observaciones del comité y realice las correcciones necesarias en el formulario de la izquierda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <Button variant="secondary" onClick={onClose} disabled={isSaving}>
                    {isEditing ? 'Cancelar' : 'Cerrar'}
                </Button>
                {isEditing && (
                    <Button type="submit" onClick={handleSubmit} disabled={isSaving} className="bg-blue-600 text-white">
                        {isSaving ? 'Enviando...' : (
                            <>
                                <Save size={16} className="mr-2" />
                                {work.status === 'Observado' ? 'Enviar Correcciones' : 'Guardar Cambios'}
                            </>
                        )}
                    </Button>
                )}
            </div>
        </Modal>
    );
};

export default WorkModal;
