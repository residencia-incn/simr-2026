import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../../hooks';
import {
    X,
    FileText,
    CheckSquare,
    MessageSquare,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { Modal, Button, FormField } from '../ui';
import { api } from '../../services/api';

const WorkReviewModal = ({ isOpen, onClose, work, onUpdate, readOnly = false, previousFeedback = '' }) => {
    const [checklist, setChecklist] = useState({
        format: false,
        wordCount: false,
        anonymity: false,
        bibliography: false
    });
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);


    // Draft persistence
    const [drafts, setDrafts] = useLocalStorage('academic_review_drafts', {});

    // Load draft when work changes
    useEffect(() => {
        if (work) {
            const savedDraft = drafts[work.id];
            if (savedDraft) {
                setChecklist(savedDraft.checklist || {
                    format: false,
                    wordCount: false,
                    anonymity: false,
                    bibliography: false
                });
                setFeedback(savedDraft.feedback || '');
            } else {
                // Reset to defaults if no draft
                setChecklist({
                    format: false,
                    wordCount: false,
                    anonymity: false,
                    bibliography: false
                });
                setFeedback('');
            }
        }
    }, [work]); // Only runs when props.work changes

    // Save draft when content changes
    useEffect(() => {
        if (work && isOpen) {
            setDrafts(prev => ({
                ...prev,
                [work.id]: { checklist, feedback }
            }));
        }
    }, [checklist, feedback, work, isOpen]);

    if (!work) return null;

    const handleCheck = (key) => {
        setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const allChecked = Object.values(checklist).every(Boolean);

    const handleSubmit = async (status) => {
        setIsSubmitting(true);
        try {
            await api.works.update({
                ...work,
                status,
                feedback: status === 'Observado' ? feedback : null,
                checklist: status === 'Aceptado' ? checklist : null
            });


            // Clear draft on success
            setDrafts(prev => {
                const newDrafts = { ...prev };
                delete newDrafts[work.id];
                return newDrafts;
            });

            onUpdate(); // Refresh parent list
            onClose();
        } catch (error) {
            console.error("Error updating work:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Revisión de Trabajo" size="3xl">
            <div className="space-y-6">
                {/* Work Header */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{work.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1"><FileText size={14} /> {work.type}</span>
                        <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded">{work.id}</span>
                    </div>
                </div>

                {/* Abstract */}
                <div className="space-y-2">
                    <h4 className="font-bold text-gray-800 border-b pb-1">Resumen Estructurado</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            <span className="font-semibold block text-gray-700">Introducción:</span>
                            <p className="text-gray-600 line-clamp-3 hover:line-clamp-none">{work.abstract.intro}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="font-semibold block text-gray-700">Métodos:</span>
                            <p className="text-gray-600 line-clamp-3 hover:line-clamp-none">{work.abstract.methods}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="font-semibold block text-gray-700">Resultados:</span>
                            <p className="text-gray-600 line-clamp-3 hover:line-clamp-none">{work.abstract.results}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="font-semibold block text-gray-700">Conclusiones:</span>
                            <p className="text-gray-600 line-clamp-3 hover:line-clamp-none">{work.abstract.conclusions}</p>
                        </div>
                    </div>
                </div>

                {/* Validation Checklist */}
                {!checklist ? null : (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <CheckSquare size={18} /> Validación de Requisitos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className={`flex items-center gap-2 ${readOnly ? '' : 'cursor-pointer hover:bg-white'} p-2 rounded transition-colors`}>
                                <input
                                    type="checkbox"
                                    checked={checklist.format}
                                    onChange={() => !readOnly && handleCheck('format')}
                                    disabled={readOnly}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                                />
                                <span className="text-sm">Formato Correcto (Título, Estructura)</span>
                            </label>
                            <label className={`flex items-center gap-2 ${readOnly ? '' : 'cursor-pointer hover:bg-white'} p-2 rounded transition-colors`}>
                                <input
                                    type="checkbox"
                                    checked={checklist.wordCount}
                                    onChange={() => !readOnly && handleCheck('wordCount')}
                                    disabled={readOnly}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                                />
                                <span className="text-sm">Límite de Palabras (300-500)</span>
                            </label>
                            <label className={`flex items-center gap-2 ${readOnly ? '' : 'cursor-pointer hover:bg-white'} p-2 rounded transition-colors`}>
                                <input
                                    type="checkbox"
                                    checked={checklist.anonymity}
                                    onChange={() => !readOnly && handleCheck('anonymity')}
                                    disabled={readOnly}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                                />
                                <span className="text-sm">Anonimato (Sin nombres en cuerpo)</span>
                            </label>
                            <label className={`flex items-center gap-2 ${readOnly ? '' : 'cursor-pointer hover:bg-white'} p-2 rounded transition-colors`}>
                                <input
                                    type="checkbox"
                                    checked={checklist.bibliography}
                                    onChange={() => !readOnly && handleCheck('bibliography')}
                                    disabled={readOnly}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                                />
                                <span className="text-sm">Bibliografía / Referencias</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Feedback Section */}
                {readOnly ? (
                    previousFeedback && (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                                <MessageSquare size={16} /> Observaciones Anteriores
                            </h4>
                            <p className="text-sm text-yellow-800">{previousFeedback}</p>
                        </div>
                    )
                ) : (
                    <div>
                        <FormField
                            label="Observaciones Generales (Solo si se rechaza)"
                            type="textarea"
                            rows={3}
                            placeholder="Indique las correcciones necesarias..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            icon={MessageSquare}
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1"
                    >
                        {readOnly ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {!readOnly && (
                        <>
                            <Button
                                variant="secondary"
                                className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                                onClick={() => handleSubmit('Observado')}
                                disabled={isSubmitting || !feedback}
                            >
                                <AlertTriangle size={18} className="mr-2" />
                                Solicitar Correcciones
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={() => handleSubmit('Aceptado')}
                                disabled={isSubmitting || !allChecked}
                            >
                                <CheckCircle size={18} className="mr-2" />
                                Dar Visto Bueno
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default WorkReviewModal;
