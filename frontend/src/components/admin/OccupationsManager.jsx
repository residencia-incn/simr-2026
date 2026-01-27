import React, { useState } from 'react';
import { Settings, Save, X, Plus, Trash2 } from 'lucide-react';
import { showDeleteConfirm } from '../../utils/alerts';

const OccupationsManager = ({ occupations = [], onUpdate }) => {
    // occupations: Array<{ name: string, rules: { cmp: bool, rne: bool, university: bool, year: bool } }>
    // Fallback if passing simple strings (legacy support during migration)
    const safeOccupations = occupations.map(occ => {
        if (typeof occ === 'string') {
            return {
                name: occ,
                rules: { cmp: false, rne: false, university: false, year: false }
            };
        }
        return occ;
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentOcc, setCurrentOcc] = useState({
        name: '',
        rules: { cmp: false, rne: false, university: false, year: false }
    });
    const [editingIndex, setEditingIndex] = useState(-1);

    const handleSave = () => {
        if (!currentOcc.name.trim()) return;

        let updatedList;
        if (editingIndex >= 0) {
            updatedList = [...safeOccupations];
            updatedList[editingIndex] = currentOcc;
        } else {
            updatedList = [...safeOccupations, currentOcc];
        }

        onUpdate(updatedList);
        closeModal();
    };

    const handleDelete = async (index) => {
        const confirmed = await showDeleteConfirm('¿Eliminar esta ocupación?', 'Eliminar Ocupación');
        if (confirmed) {
            const updatedList = safeOccupations.filter((_, i) => i !== index);
            onUpdate(updatedList);
        }
    };

    const openForEdit = (occ, index) => {
        setCurrentOcc(JSON.parse(JSON.stringify(occ))); // Deep copy
        setEditingIndex(index);
        setIsModalOpen(true);
    };

    const openForNew = () => {
        setCurrentOcc({
            name: '',
            rules: { cmp: false, rne: false, university: false, year: false }
        });
        setEditingIndex(-1);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingIndex(-1);
    };

    const toggleRule = (rule) => {
        setCurrentOcc(prev => ({
            ...prev,
            rules: { ...prev.rules, [rule]: !prev.rules[rule] }
        }));
    };

    return (
        <div className="w-full">
            {/* Header & Add Button */}
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">
                    Define las ocupaciones y qué documentos son obligatorios para cada una.
                </p>
                <button
                    type="button"
                    onClick={openForNew}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <Plus size={16} />
                    Nueva Ocupación
                </button>
            </div>

            {/* List with Badges */}
            <div className="flex flex-wrap gap-3">
                {safeOccupations.map((occ, idx) => (
                    <div
                        key={idx}
                        className="group relative flex flex-col items-start p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-pointer min-w-[200px]"
                        onClick={() => openForEdit(occ, idx)}
                    >
                        <div className="flex justify-between w-full items-start">
                            <span className="font-bold text-gray-800">{occ.name}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(idx); }}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                            {/* Rule Badges */}
                            {Object.entries(occ.rules).filter(([, isActive]) => isActive).map(([rule]) => (
                                <span key={rule} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] uppercase font-bold rounded border border-blue-100">
                                    {rule === 'year' ? 'AÑO RES.' : rule}
                                </span>
                            ))}
                            {Object.values(occ.rules).every(v => !v) && (
                                <span className="text-[10px] text-gray-400 italic">Sin requisitos extra</span>
                            )}
                        </div>

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Settings size={14} className="text-gray-400" />
                        </div>
                    </div>
                ))}

                {safeOccupations.length === 0 && (
                    <div className="text-sm text-gray-400 italic p-4 text-center w-full bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        No hay ocupaciones configuradas.
                    </div>
                )}
            </div>

            {/* MODAL DE CONFIGURACIÓN */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-scaleIn">
                        <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>

                        <h3 className="font-bold text-xl mb-1 text-gray-800">
                            {editingIndex >= 0 ? 'Editar Ocupación' : 'Nueva Ocupación'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">Configura los requisitos de inscripción.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Ocupación</label>
                                <input
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold text-gray-800"
                                    placeholder="Ej: Médico Residente"
                                    value={currentOcc.name}
                                    onChange={e => setCurrentOcc({ ...currentOcc, name: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                <p className="text-xs text-blue-600 uppercase font-bold tracking-wider mb-2">
                                    Requisitos del Formulario
                                </p>

                                <label className="flex items-center justify-between cursor-pointer p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-300 transition-colors shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentOcc.rules.cmp ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                            🩺
                                        </div>
                                        <span className={`font-medium ${currentOcc.rules.cmp ? 'text-gray-900' : 'text-gray-500'}`}>Número de CMP</span>
                                    </div>
                                    <input type="checkbox" checked={currentOcc.rules.cmp} onChange={() => toggleRule('cmp')} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                                </label>

                                <label className="flex items-center justify-between cursor-pointer p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-300 transition-colors shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentOcc.rules.rne ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                            🎓
                                        </div>
                                        <span className={`font-medium ${currentOcc.rules.rne ? 'text-gray-900' : 'text-gray-500'}`}>Número de RNE</span>
                                    </div>
                                    <input type="checkbox" checked={currentOcc.rules.rne} onChange={() => toggleRule('rne')} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                                </label>

                                <label className="flex items-center justify-between cursor-pointer p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-300 transition-colors shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentOcc.rules.university ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                            🏫
                                        </div>
                                        <span className={`font-medium ${currentOcc.rules.university ? 'text-gray-900' : 'text-gray-500'}`}>Universidad</span>
                                    </div>
                                    <input type="checkbox" checked={currentOcc.rules.university} onChange={() => toggleRule('university')} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                                </label>

                                <label className="flex items-center justify-between cursor-pointer p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-300 transition-colors shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentOcc.rules.specialty ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                            🧬
                                        </div>
                                        <span className={`font-medium ${currentOcc.rules.specialty ? 'text-gray-900' : 'text-gray-500'}`}>Requiere Especialidad</span>
                                    </div>
                                    <input type="checkbox" checked={currentOcc.rules.specialty} onChange={() => toggleRule('specialty')} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                                </label>

                                <label className="flex items-center justify-between cursor-pointer p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-300 transition-colors shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentOcc.rules.year ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>

                                            📅
                                        </div>
                                        <span className={`font-medium ${currentOcc.rules.year ? 'text-gray-900' : 'text-gray-500'}`}>Año de Residencia</span>
                                    </div>
                                    <input type="checkbox" checked={currentOcc.rules.year} onChange={() => toggleRule('year')} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                                </label>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OccupationsManager;
