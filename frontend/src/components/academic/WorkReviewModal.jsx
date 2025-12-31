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
    const [academicConfig, setAcademicConfig] = useState(null);

    // Load config
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await api.academic.getConfig();
                setAcademicConfig(config);
            } catch (error) {
                console.error("Error loading academic config:", error);
            }
        };
        loadConfig();
    }, []);

    // Filter sections based on work type
    const activeSections = academicConfig?.sections?.filter(s =>
        s.active && (!s.workTypes || s.workTypes.includes(work?.type))
    ) || [];


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
            // Fetch fresh work data to avoid overwriting concurrent changes
            // This is critical for synchronization between different views (Research/Academic)
            const freshWork = await api.works.getById(work.id);
            const targetWork = freshWork || work;

            await api.works.update({
                ...targetWork,
                status,
                feedback: status === 'Observado' ? feedback : null,
                checklist: status === 'Aceptado' ? checklist : null
            });

            // LOGICA DE PROMOCION A PONENTE
            if (status === 'Aceptado' && targetWork.authorId) {
                try {
                    // Buscar usuario autor
                    const allUsers = await api.users.getAllIncludingSuperAdmin();
                    const authorUser = allUsers.find(u => u.id === targetWork.authorId);

                    if (authorUser) {
                        // Actualizar roles y perfiles
                        // Agregar 'ponente' a eventRoles
                        const currentEventRoles = authorUser.eventRoles || [];
                        const newEventRoles = [...new Set([...currentEventRoles, 'ponente'])];

                        // Agregar perfiles de acceso: 'aula_virtual' y 'trabajos' (resident dashboard access logic usually relies on user type but profiles help too)
                        // Note: 'trabajos' profile in mockData maps to WORKS section. 'resident' role usually maps to 'resident-dashboard'
                        const currentProfiles = authorUser.profiles || [];
                        const newProfiles = [...new Set([...currentProfiles, 'aula_virtual', 'trabajos', 'perfil_basico'])];

                        // Agregar rol 'resident' y 'participant' a roles array para el switcher
                        const currentRoles = authorUser.roles || [];
                        const newRoles = [...new Set([...currentRoles, 'resident', 'participant'])];

                        await api.users.update({
                            ...authorUser,
                            eventRoles: newEventRoles,
                            profiles: newProfiles,
                            roles: newRoles,
                            // Ensure role is at least something valid if it was basic
                            role: authorUser.role === 'participant' || authorUser.role === 'Especialista' ? 'Ponente' : authorUser.role
                        });
                        console.log(`Usuario ${authorUser.name} promovido a Ponente con accesos.`);
                    }
                } catch (userErr) {
                    console.error("Error promoviendo usuario a ponente:", userErr);
                    // No bloquear el flujo principal si falla la promoción, pero alertar
                    alert("El trabajo se aprobó, pero hubo un error actualizando el rol del autor. Por favor verifique manualmente.");
                }
            }


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
            alert("Ocurrió un error al actualizar el trabajo. Por favor intente nuevamente.");
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
                        {activeSections.length > 0 ? (
                            activeSections.map(section => (
                                <div key={section.id} className="space-y-1">
                                    <span className="font-semibold block text-gray-700">{section.label}:</span>
                                    <p className="text-gray-600 whitespace-pre-wrap">
                                        {work.abstract?.[section.id] || <span className="italic text-gray-400">Sin contenido</span>}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-4 text-center text-gray-400 italic">
                                Cargando estructura del abstract...
                            </div>
                        )}
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
                            <div className="flex-1 flex flex-col gap-1">
                                <Button
                                    className="w-full opacity-100 disabled:opacity-50"
                                    onClick={() => {
                                        if (!allChecked) {
                                            alert("Debe validar todos los puntos de la lista de verificación (checklist) antes de dar el Visto Bueno.");
                                            return;
                                        }
                                        handleSubmit('Aceptado');
                                    }}
                                    disabled={isSubmitting}
                                >
                                    <CheckCircle size={18} className="mr-2" />
                                    Dar Visto Bueno
                                </Button>
                                {!allChecked && (
                                    <span className="text-[10px] text-red-500 text-center font-medium animate-pulse">
                                        * Complete el checklist para aprobar
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default WorkReviewModal;
