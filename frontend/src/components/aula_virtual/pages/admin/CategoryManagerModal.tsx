import React, { useState } from 'react';
import Swal from 'sweetalert2';

interface CategoryManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: string[];
    onUpdateCategories: (newCategories: string[]) => void;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
    isOpen,
    onClose,
    categories,
    onUpdateCategories
}) => {
    const [newCategory, setNewCategory] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!newCategory.trim()) return;
        if (categories.includes(newCategory.trim())) {
            Swal.fire({
                icon: 'warning',
                title: 'Categoría existente',
                text: 'Esta categoría ya existe en la lista.',
                confirmButtonColor: '#3B82F6'
            });
            return;
        }
        onUpdateCategories([...categories, newCategory.trim()]);
        setNewCategory('');
    };

    const handleStartEdit = (index: number) => {
        setEditingIndex(index);
        setEditValue(categories[index]);
    };

    const handleSaveEdit = () => {
        if (editingIndex === null || !editValue.trim()) return;

        // Check for duplicates (excluding current item)
        const isDuplicate = categories.some((cat, idx) => idx !== editingIndex && cat === editValue.trim());
        if (isDuplicate) {
            Swal.fire({
                icon: 'warning',
                title: 'Categoría existente',
                text: 'Esta categoría ya existe en la lista.',
                confirmButtonColor: '#3B82F6'
            });
            return;
        }

        const updated = [...categories];
        updated[editingIndex] = editValue.trim();
        onUpdateCategories(updated);
        setEditingIndex(null);
        setEditValue('');
    };

    const handleDelete = (index: number) => {
        Swal.fire({
            title: '¿Eliminar categoría?',
            text: "No podrás revertir esta acción.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                const updated = categories.filter((_, i) => i !== index);
                onUpdateCategories(updated);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Gestionar Categorías</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Add New */}
                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Nueva categoría (ej. Seminario)"
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!newCategory.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                        </button>
                    </div>

                    {/* List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {categories.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-blue-100 transition-colors">
                                {editingIndex === idx ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1 px-2 py-1 bg-white border border-blue-300 rounded text-sm focus:outline-none"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                        />
                                        <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-700">
                                            <span className="material-symbols-outlined text-[18px]">check</span>
                                        </button>
                                        <button onClick={() => setEditingIndex(null)} className="text-gray-400 hover:text-gray-600">
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-sm font-medium text-gray-700">{cat}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleStartEdit(idx)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(idx)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <p className="text-center text-sm text-gray-400 py-4">No hay categorías definidas</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryManagerModal;
