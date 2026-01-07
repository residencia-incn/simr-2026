import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen } from 'lucide-react';
import Button from '../ui/Button';

const AddTalkModal = ({ isOpen, onClose, onSave, specialties = [], initialData = null }) => {
    const [formData, setFormData] = useState({
        title: '',
        specialty: ''
    });
    const [errors, setErrors] = useState({});

    // Reset or populate form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    title: initialData.title || '',
                    specialty: initialData.specialty || ''
                });
            } else {
                setFormData({ title: '', specialty: '' });
            }
            setErrors({});
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!formData.title.trim()) newErrors.title = 'El título es obligatorio';
        if (!formData.specialty) newErrors.specialty = 'La subespecialidad es obligatoria';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave({
            ...initialData, // Keep ID if editing
            title: formData.title,
            specialty: formData.specialty,
            id: initialData?.id || `talk-${Date.now()}`
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100">

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center text-white">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <BookOpen size={20} />
                        {initialData ? 'Editar Ponencia' : 'Agregar Ponencia'}
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Título de la Ponencia
                            </label>
                            <input
                                type="text"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all
                                    ${errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                                `}
                                placeholder="Ingrese el título..."
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                        </div>

                        {/* Specialty */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subespecialidad
                            </label>
                            <select
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all
                                    ${errors.specialty ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                                `}
                                value={formData.specialty}
                                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                            >
                                <option value="">Seleccione una opción</option>
                                {specialties.map((spec, idx) => (
                                    <option key={idx} value={spec}>{spec}</option>
                                ))}
                            </select>

                            {errors.specialty && <p className="text-xs text-red-500 mt-1">{errors.specialty}</p>}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                            >
                                <Save size={16} />
                                Guardar Ponencia
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddTalkModal;
