import React, { useState, useEffect } from 'react';
import { User, Check } from 'lucide-react';
import { Modal, Button, LoadingSpinner } from '../ui';
import { api } from '../../services/api';
import { useApi } from '../../hooks';

const AssignJuryModal = ({ isOpen, onClose, work, onUpdate }) => {
    const { data: jurors, loading } = useApi(api.jurors.getAll);
    const [selectedJurors, setSelectedJurors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (work?.jury && Array.isArray(work.jury)) {
            setSelectedJurors(work.jury);
        } else if (work?.jury) {
            // Handle legacy single string/id case
            setSelectedJurors([work.jury]);
        } else {
            setSelectedJurors([]);
        }
    }, [work]);

    const handleToggleJuror = (jurorId) => {
        setSelectedJurors(prev => {
            if (prev.includes(jurorId)) {
                return prev.filter(id => id !== jurorId);
            } else {
                return [...prev, jurorId];
            }
        });
    };

    const handleAssign = async () => {
        setIsSubmitting(true);
        try {
            await api.works.update({
                ...work,
                jury: selectedJurors // Save array of IDs
            });
            onUpdate();
            onClose();
        } catch (error) {
            console.error("Error assigning jury:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Asignar Jurado" size="md">
            <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                    Seleccione los jurados encargados de evaluar el trabajo <strong>"{work?.title}"</strong>.
                </p>

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
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
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-gray-900">{juror.name}</div>
                                            <div className="text-xs text-gray-500">{juror.institution} • {juror.specialty}</div>
                                        </div>
                                    </div>
                                    {isSelected && <Check size={18} className="text-blue-600" />}
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
                    <Button onClick={handleAssign} disabled={selectedJurors.length === 0 || isSubmitting} className="flex-1">
                        {isSubmitting ? 'Asignando...' : 'Guardar Asignación'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AssignJuryModal;
