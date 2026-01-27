import React, { useState, useEffect } from 'react';
import {
    X,
    ClipboardList,
    User,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Target
} from 'lucide-react';
import { api } from '../../services/api';
import { showSuccess, showError } from '../../utils/alerts';

const TaskAssignmentModal = ({ isOpen, onClose, meetingId, attendees, onTaskAdded }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assigned_to: '',
        deadline: '',
        priority: 'MEDIA'
    });
    const [loading, setLoading] = useState(false);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: '',
                description: '',
                assigned_to: '',
                deadline: new Date().toISOString().split('T')[0],
                priority: 'MEDIA'
            });
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.assigned_to) {
            showError("Debe seleccionar un responsable");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                meeting_id: meetingId,
                // Ensure deadline has time part for DateTime field
                deadline: formData.deadline ? `${formData.deadline}T23:59:59` : null
            };

            await api.planning.createTask(payload);
            showSuccess("Tarea asignada correctamente");
            if (onTaskAdded) onTaskAdded();
            onClose();
        } catch (error) {
            console.error(error);
            showError(error.response?.data?.detail || "Error al asignar tarea");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Target size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Asignar Nueva Tarea</h3>
                            <p className="text-slate-400 text-xs mt-0.5 uppercase tracking-wider font-medium">Planificación de Reunión</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Título */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                            <ClipboardList size={14} />
                            Título de la Tarea
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: Redactar informe de gestión..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-medium placeholder:text-slate-400"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                            <Target size={14} />
                            Descripción (Opcional)
                        </label>
                        <textarea
                            rows="2"
                            placeholder="Detalles adicionales sobre la tarea..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-medium placeholder:text-slate-400 resize-none"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Responsable */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                                <User size={14} />
                                Responsable
                            </label>
                            <div className="relative">
                                <select
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none font-medium cursor-pointer"
                                    value={formData.assigned_to}
                                    onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
                                >
                                    <option value="">Seleccionar asistente...</option>
                                    {attendees.map(att => (
                                        <option key={att.user_id} value={att.user_id}>
                                            {att.user_name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <Clock size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Fecha de Vencimiento */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                                <Calendar size={14} />
                                Fecha de Vencimiento
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-medium text-slate-600"
                                value={formData.deadline}
                                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Prioridad */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                            <AlertTriangle size={14} />
                            Nivel de Prioridad
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'BAJA', label: 'Baja', color: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200' },
                                { id: 'MEDIA', label: 'Media', color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
                                { id: 'ALTA', label: 'Alta', color: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' }
                            ].map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority: p.id })}
                                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${formData.priority === p.id
                                        ? p.id === 'ALTA' ? 'bg-red-600 text-white border-red-600 scale-[1.02]' :
                                            p.id === 'MEDIA' ? 'bg-amber-500 text-white border-amber-500 scale-[1.02]' :
                                                'bg-slate-700 text-white border-slate-700 scale-[1.02]'
                                        : p.color
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.title || !formData.assigned_to}
                            className="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Clock size={18} className="animate-spin" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    <span>Asignar Tarea</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskAssignmentModal;
