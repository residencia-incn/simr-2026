import React, { useState, useEffect } from 'react';
import { Modal, FormField, Button } from '../ui';
import { Plus, Trash2, CheckCircle2, Circle, Clock, BarChart3, HelpCircle, X } from 'lucide-react';

const COLORS = [
    { name: 'Azul', value: 'blue' },
    { name: 'Esmeralda', value: 'emerald' },
    { name: 'Ámbar', value: 'amber' },
    { name: 'Rosa', value: 'rose' },
    { name: 'Indigo', value: 'indigo' },
];

const PollEditModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [title, setTitle] = useState('');
    const [pollType, setPollType] = useState('MULTIPLE_CHOICE');
    const [options, setOptions] = useState([
        { text: '', color: 'blue' },
        { text: '', color: 'emerald' },
    ]);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setPollType(initialData.poll_type || 'MULTIPLE_CHOICE');
            setOptions(initialData.options || [
                { text: '', color: 'blue' },
                { text: '', color: 'emerald' },
            ]);
        } else {
            setTitle('');
            setPollType('MULTIPLE_CHOICE');
            setOptions([
                { text: '', color: 'blue' },
                { text: '', color: 'emerald' },
            ]);
        }
    }, [initialData, isOpen]);

    const handleAddOption = () => {
        const nextColor = COLORS[options.length % COLORS.length].value;
        setOptions([...options, { text: '', color: nextColor }]);
    };

    const handleRemoveOption = (index) => {
        if (options.length <= 2) return;
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!title.trim()) return alert("El título es obligatorio");

        if (pollType === 'MULTIPLE_CHOICE' && options.some(opt => !opt.text.trim())) {
            return alert("Todas las opciones deben tener texto");
        }

        onSave({
            title,
            poll_type: pollType,
            options: pollType === 'BINARY'
                ? [{ text: 'SÍ', color: 'emerald' }, { text: 'NO', color: 'rose' }]
                : options
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Encuesta" : "Nueva Encuesta"} maxWidth="max-w-2xl">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                            <HelpCircle size={16} className="text-blue-500" />
                            Pregunta de la Encuesta
                        </label>
                        <textarea
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-all text-lg font-medium"
                            placeholder="¿Qué desea consultar a los participantes?"
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                            <BarChart3 size={16} className="text-purple-500" />
                            Tipo de Encuesta
                        </label>
                        <select
                            value={pollType}
                            onChange={(e) => setPollType(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-white"
                        >
                            <option value="MULTIPLE_CHOICE">Opción Múltiple</option>
                            <option value="BINARY">SÍ / NO (Binaria)</option>
                        </select>
                    </div>
                </div>

                {pollType === 'MULTIPLE_CHOICE' ? (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Opciones de Respuesta</label>
                        {options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-3 animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className={`w-3 h-10 rounded-full bg-${opt.color}-500 shrink-0 shadow-sm`} />
                                <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) => {
                                        const newOpts = [...options];
                                        newOpts[idx].text = e.target.value;
                                        setOptions(newOpts);
                                    }}
                                    placeholder={`Opción ${idx + 1}`}
                                    className="flex-1 p-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
                                />
                                <div className="flex items-center gap-1">
                                    <select
                                        value={opt.color}
                                        onChange={(e) => {
                                            const newOpts = [...options];
                                            newOpts[idx].color = e.target.value;
                                            setOptions(newOpts);
                                        }}
                                        className="text-xs p-1 border rounded bg-white"
                                    >
                                        {COLORS.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
                                    </select>
                                    <button
                                        onClick={() => handleRemoveOption(idx)}
                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        disabled={options.length <= 2}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={handleAddOption}
                            className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:text-blue-700 mt-2 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-all w-fit"
                        >
                            <Plus size={18} /> Añadir Opción
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-emerald-100 shadow-sm">
                            <CheckCircle2 size={32} className="text-emerald-500" />
                            <span className="font-black text-emerald-700 uppercase tracking-widest text-xs">SÍ</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-red-100 shadow-sm">
                            <X size={32} className="text-red-500" />
                            <span className="font-black text-red-700 uppercase tracking-widest text-xs">NO</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>
                        {initialData ? "Guardar Cambios" : "Crear Encuesta"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default PollEditModal;
