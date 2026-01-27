import React, { useEffect, useState } from 'react';
import { ShieldCheck, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { api } from '../../../services/api';
import { showSuccess, showError, showConfirm } from '../../../utils/alerts';
import { LoadingSpinner } from '../../ui';

// Sub-component moved OUTSIDE to prevent re-renders on every keystroke
const CategoryList = ({ type, title, icon: Icon, inputState, setInputState, categories, handleAdd, handleDelete }) => {
    const list = categories.filter(c => c.type === type);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
                <Icon className={type === 'income' ? "text-emerald-500" : "text-red-500"} size={20} />
                <h3 className="font-bold text-slate-700">{title}</h3>
            </div>

            {/* INPUT DE AÑADIR */}
            <div className="p-4 border-b">
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder={`Nueva categoría...`}
                        value={inputState}
                        onChange={(e) => setInputState(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd(inputState, type)}
                    />
                    <button
                        onClick={() => handleAdd(inputState, type)}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors"
                    >
                        Añadir
                    </button>
                </div>
            </div>

            {/* LISTA */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[400px]">
                {list.map(cat => (
                    <div key={cat.id} className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-700 font-medium">{cat.name}</span>
                            {/* 🔒 BADGE DE SISTEMA */}
                            {cat.is_system && (
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <ShieldCheck size={10} /> Sistema
                                </span>
                            )}
                        </div>

                        {/* BOTÓN DE BORRAR (Solo si no es sistema) */}
                        {!cat.is_system && (
                            <button
                                onClick={() => handleDelete(cat.id)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                title="Eliminar categoría"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
                {list.length === 0 && (
                    <div className="text-center p-8 text-slate-400 text-sm italic">
                        No hay categorías registradas.
                    </div>
                )}
            </div>
        </div>
    );
};

const CategoriesTab = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Inputs para nuevas categorías
    const [newIncome, setNewIncome] = useState("");
    const [newExpense, setNewExpense] = useState("");

    const loadData = async () => {
        try {
            const data = await api.treasury.getCategories();
            setCategories(data);
        } catch (error) {
            console.error("Error cargando categorías", error);
            showError("Error al cargar categorías");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAdd = async (name, type) => {
        if (!name.trim()) return;

        try {
            await api.treasury.addCategory(type, name);
            showSuccess("Categoría agregada");
            if (type === 'income') setNewIncome("");
            else setNewExpense("");
            loadData();
        } catch (error) {
            console.error(error);
            showError("Error al crear categoría");
        }
    };

    const handleDelete = async (id) => {
        // Need to find category name/type to delete using the API signature deleteCategory(type, name)
        // BUT API only has deleteCategory(type, name), UI gives ID. 
        // We need to look up the category from state to get name and type.

        const cat = categories.find(c => c.id === id);
        if (!cat) return;

        const confirmed = await showConfirm("¿Estás seguro de eliminar esta categoría?");
        if (!confirmed) return;

        try {
            await api.treasury.deleteCategory(cat.type, cat.name);
            showSuccess("Categoría eliminada");
            loadData();
        } catch (error) {
            console.error(error);
            showError(error.response?.data?.detail || "No se pudo eliminar");
        }
    };

    if (loading) return (
        <div className="p-12 flex justify-center">
            <LoadingSpinner />
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* COLUMNA INGRESOS */}
            <CategoryList
                type="income"
                title="Ingresos"
                icon={TrendingUp}
                inputState={newIncome}
                setInputState={setNewIncome}
                categories={categories}
                handleAdd={handleAdd}
                handleDelete={handleDelete}
            />

            {/* COLUMNA EGRESOS */}
            <CategoryList
                type="expense"
                title="Egresos"
                icon={TrendingDown}
                inputState={newExpense}
                setInputState={setNewExpense}
                categories={categories}
                handleAdd={handleAdd}
                handleDelete={handleDelete}
            />
        </div>
    );
};

export default CategoriesTab;
