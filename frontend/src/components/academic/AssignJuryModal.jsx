import React, { useState, useEffect } from 'react';
import { User, Check, AlertCircle, Info } from 'lucide-react';
import { Modal, Button, LoadingSpinner } from '../ui';
import { api } from '../../services/api';
import { showError } from '../../utils/alerts';

const AssignJuryModal = ({ isOpen, onClose, work, onUpdate }) => {
    const [jurors, setJurors] = useState([]);
    const [juryLimit, setJuryLimit] = useState(3);
    const [selectedJurors, setSelectedJurors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // Fetch Jurors, Settings and current selection in parallel
                const [jurorsData, settingsData] = await Promise.all([
                    api.jurors.getAll(),
                    api.academic.getSettings()
                ]);

                setJurors(jurorsData);

                const limitSetting = settingsData.find(s => s.key === 'jurados_por_trabajo');
                if (limitSetting) setJuryLimit(parseInt(limitSetting.value));

                // Initialize selection
                if (work?.jury && Array.isArray(work.jury)) {
                    setSelectedJurors(work.jury);
                } else if (work?.jury) {
                    setSelectedJurors([work.jury]);
                } else {
                    setSelectedJurors([]);
                }
            } catch (error) {
                console.error("Error loading modal data:", error);
                showError("Error al cargar la lista de jurados.");
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            loadInitialData();
        }
    }, [isOpen, work]);

    const handleToggleJuror = (jurorId) => {
        setSelectedJurors(prev => {
            if (prev.includes(jurorId)) {
                return prev.filter(id => id !== jurorId);
            } else {
                if (prev.length >= juryLimit) {
                    showError(`No se pueden asignar más de ${juryLimit} jurados por trabajo.`);
                    return prev;
                }
                return [...prev, jurorId];
            }
        });
    };

    const handleAssign = async () => {
        setIsSubmitting(true);
        try {
            await api.academic.syncJuries(work.id, selectedJurors);
            onUpdate();
            onClose();
        } catch (error) {
            console.error("Error assigning jury:", error);
            showError(error.message || "Error al actualizar los jurados.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Asignar Jurados" size="md">
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-3">
                    <Info className="text-blue-500 shrink-0" size={18} />
                    <p className="text-blue-800 text-xs">
                        Seleccione los jurados encargados de evaluar el trabajo <strong>"{work?.title}"</strong>.
                        El límite configurado es de <strong>{juryLimit}</strong> jurados.
                    </p>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <LoadingSpinner />
                        <span className="text-sm text-gray-500">Cargando directorio de jurados...</span>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                        {jurors?.map(juror => {
                            const isSelected = selectedJurors.includes(juror.id);
                            return (
                                <div
                                    key={juror.id}
                                    onClick={() => handleToggleJuror(juror.id)}
                                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${isSelected
                                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                        : 'hover:bg-gray-50 border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                                            {juror.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-gray-900">{juror.name}</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-medium">{juror.institution} • {juror.specialty}</div>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                        {isSelected && <Check size={14} className="text-white" />}
                                    </div>
                                </div>
                            );
                        })}
                        {jurors.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                <AlertCircle className="mx-auto mb-2 opacity-20" size={40} />
                                <p>No hay jurados registrados en el sistema.</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
                    <Button onClick={handleAssign} disabled={isSubmitting} className="flex-1">
                        {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AssignJuryModal;
