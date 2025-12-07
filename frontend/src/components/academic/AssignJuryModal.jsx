import React, { useState, useEffect } from 'react';
import { User, Check } from 'lucide-react';
import { Modal, Button, LoadingSpinner } from '../ui';
import { api } from '../../services/api';
import { useApi } from '../../hooks';

const AssignJuryModal = ({ isOpen, onClose, work, onUpdate }) => {
    const { data: jurors, loading } = useApi(api.jurors.getAll);
    const [selectedJury, setSelectedJury] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (work?.jury) {
            setSelectedJury(work.jury);
        } else {
            setSelectedJury(null);
        }
    }, [work]);

    const handleAssign = async () => {
        if (!selectedJury) return;
        setIsSubmitting(true);
        try {
            await api.works.update({
                ...work,
                jury: selectedJury
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
                    Seleccione un jurado encargado de evaluar el trabajo <strong>"{work?.title}"</strong>.
                </p>

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {jurors?.map(juror => (
                            <div
                                key={juror.id}
                                onClick={() => setSelectedJury(juror.id)}
                                className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${selectedJury === juror.id
                                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                        : 'hover:bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedJury === juror.id ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-gray-900">{juror.name}</div>
                                        <div className="text-xs text-gray-500">{juror.institution} • {juror.specialty}</div>
                                    </div>
                                </div>
                                {selectedJury === juror.id && <Check size={18} className="text-blue-600" />}
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
                    <Button onClick={handleAssign} disabled={!selectedJury || isSubmitting} className="flex-1">
                        {isSubmitting ? 'Asignando...' : 'Guardar Asignación'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AssignJuryModal;
