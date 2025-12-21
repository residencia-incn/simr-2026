import React, { useState } from 'react';
import { FileText, Check } from 'lucide-react';
import { Modal, Button, LoadingSpinner } from '../ui';
import { api } from '../../services/api';

const AssignWorkToJuryModal = ({ isOpen, onClose, juror, works, onUpdate }) => {
    const [selectedWorks, setSelectedWorks] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter available works:
    // 1. Must be 'Aceptado'
    // 2. Must NOT already be assigned to this juror
    const availableWorks = works?.filter(w => {
        if (w.status !== 'Aceptado') return false;

        let currentJury = w.jury || [];
        if (!Array.isArray(currentJury)) currentJury = [currentJury];

        return !currentJury.includes(juror?.id);
    }) || [];

    const handleToggleWork = (workId) => {
        setSelectedWorks(prev => {
            if (prev.includes(workId)) {
                return prev.filter(id => id !== workId);
            } else {
                return [...prev, workId];
            }
        });
    };

    const handleAssign = async () => {
        setIsSubmitting(true);
        try {
            // Update each selected work SEQUENTIALLY to avoid race conditions with local storage
            for (const workId of selectedWorks) {
                // Fetch fresh work data to ensure we have the latest attributes
                const freshWork = await api.works.getById(workId);
                if (!freshWork) continue;

                let currentJury = freshWork.jury || [];
                if (!Array.isArray(currentJury)) currentJury = [currentJury];

                // Check again if already assigned (double safety)
                if (currentJury.includes(juror.id)) continue;

                await api.works.update({
                    ...freshWork,
                    jury: [...currentJury, juror.id]
                });
            }

            onUpdate(); // Refresh data in parent
            onClose();
            setSelectedWorks([]);
            // Optional: Show success toast here if global toast is available
        } catch (error) {
            console.error("Error assigning works to jury:", error);
            alert("Hubo un error al asignar los trabajos. Por favor intente nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Asignar Trabajos a ${juror?.name}`} size="md">
            <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                    Seleccione los trabajos aceptados que desea asignar a este jurado.
                </p>

                <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                    {availableWorks.length > 0 ? (
                        availableWorks.map(work => {
                            const isSelected = selectedWorks.includes(work.id);
                            return (
                                <div
                                    key={work.id}
                                    onClick={() => handleToggleWork(work.id)}
                                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${isSelected
                                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                        : 'hover:bg-gray-50 border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-start gap-3 overflow-hidden">
                                        <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                            <FileText size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm text-gray-900 truncate pr-2">{work.title}</div>
                                            <div className="text-xs text-gray-500">{work.specialty} • {work.type}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{work.author}</div>
                                        </div>
                                    </div>
                                    {isSelected && <Check size={18} className="text-blue-600 shrink-0" />}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No hay trabajos aceptados disponibles para asignar.
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-4">
                    <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
                    <Button onClick={handleAssign} disabled={selectedWorks.length === 0 || isSubmitting} className="flex-1">
                        {isSubmitting ? 'Asignando...' : 'Asignar Trabajos'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AssignWorkToJuryModal;
