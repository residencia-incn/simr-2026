import React, { useState } from 'react';
import { X, SlidersHorizontal, ArrowUp, ArrowDown, Calendar, Clock, Type, TrendingUp, Filter, ChevronDown, Check, RefreshCw, Hash } from 'lucide-react';

const FilterDrawer = ({ isOpen, onClose, onApply, initialFilters }) => {
    const [sortOrder, setSortOrder] = useState(initialFilters?.sortOrder || 'desc');
    const [sortBy, setSortBy] = useState(initialFilters?.sortBy || 'date');
    const [filters, setFilters] = useState({
        year: initialFilters?.year || '2024',
        categories: initialFilters?.categories || ['pre-congress', 'day-1', 'day-2'],
        tags: initialFilters?.tags || []
    });
    const [tagInput, setTagInput] = useState('');

    const toggleCategory = (cat) => {
        setFilters(prev => ({
            ...prev,
            categories: prev.categories.includes(cat)
                ? prev.categories.filter(c => c !== cat)
                : [...prev.categories, cat]
        }));
    };

    const addTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            setFilters(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
        }
    };

    const removeTag = (tag) => {
        setFilters(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
        }));
    };

    const handleApply = () => {
        onApply({
            sortOrder,
            sortBy,
            ...filters
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-3xl bg-[#1e2330] rounded-2xl shadow-2xl border border-gray-700 flex flex-col max-h-[85vh] animate-fadeIn">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500">
                            <SlidersHorizontal size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white leading-none">Filtros y Ordenación</h3>
                            <p className="text-xs text-gray-400 mt-1">Configura la vista de la galería administrativa</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">

                    {/* Sort Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp size={16} />
                                Criterio de Ordenación
                            </h4>
                            <div className="flex bg-gray-800 rounded-lg p-0.5 border border-gray-700">
                                <button
                                    onClick={() => setSortOrder('asc')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${sortOrder === 'asc' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <ArrowUp size={14} /> Asc
                                </button>
                                <button
                                    onClick={() => setSortOrder('desc')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${sortOrder === 'desc' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <ArrowDown size={14} /> Desc
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { id: 'date', label: 'Fecha Subida', sub: 'Defecto', icon: Calendar },
                                { id: 'event_date', label: 'Fecha Evento', sub: 'Cronológico', icon: Clock },
                                { id: 'title', label: 'Título', sub: 'Alfabético', icon: Type },
                                { id: 'popularity', label: 'Popularidad', sub: 'Vistas', icon: TrendingUp },
                            ].map(opt => (
                                <label key={opt.id} className="cursor-pointer relative group">
                                    <input
                                        type="radio"
                                        name="sort"
                                        checked={sortBy === opt.id}
                                        onChange={() => setSortBy(opt.id)}
                                        className="peer sr-only"
                                    />
                                    <div className="p-4 rounded-xl bg-[#111421] border border-gray-700 transition-all peer-checked:border-blue-500 peer-checked:ring-1 peer-checked:ring-blue-500 peer-checked:bg-blue-500/10 hover:border-gray-500">
                                        <opt.icon className="text-gray-400 peer-checked:text-blue-500 mb-2" size={20} />
                                        <p className="text-sm font-bold text-white">{opt.label}</p>
                                        <p className="text-[10px] text-gray-400">{opt.sub}</p>
                                    </div>
                                    {sortBy === opt.id && (
                                        <div className="absolute top-3 right-3 w-4 h-4 rounded-full border border-blue-500 bg-blue-500 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                        </div>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-gray-700 w-full"></div>

                    {/* Filters Section */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Filter size={16} />
                            Filtros Avanzados
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-300">Edición del Congreso</label>
                                <div className="relative">
                                    <select
                                        value={filters.year}
                                        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                                        className="w-full bg-[#111421] border border-gray-700 rounded-lg text-sm text-white py-2.5 px-3 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none outline-none"
                                    >
                                        <option value="2024">2024 (Actual)</option>
                                        <option value="2023">2023</option>
                                        <option value="2022">2022</option>
                                        <option value="all">Todas las ediciones</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <label className="text-xs font-medium text-gray-300">Álbumes y Categorías</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['Pre-Congreso', 'Día 1', 'Día 2', 'Gala', 'Talleres', 'Expo', 'Social'].map(cat => {
                                    const id = cat.toLowerCase().replace(' ', '-');
                                    const isSelected = filters.categories.includes(id);
                                    return (
                                        <label key={id} className={`flex items-center gap-2 bg-[#111421] p-2 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-gray-500' : 'border-gray-700 hover:border-gray-500'}`}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleCategory(id)}
                                                className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-0"
                                            />
                                            <span className="text-xs text-white">{cat}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-300">Etiquetas (Tags)</label>
                            <div className="relative">
                                <Hash size={16} className="absolute left-3 top-2.5 text-gray-500" />
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={addTag}
                                    className="w-full bg-[#111421] border border-gray-700 rounded-lg text-sm text-white py-2.5 pl-10 pr-3 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 outline-none"
                                    placeholder="Escribe y presiona Enter..."
                                />
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {filters.tags.map(tag => (
                                    <span key={tag} className="bg-blue-500/20 text-blue-500 text-xs px-2 py-1 rounded border border-blue-500/30 flex items-center gap-1 cursor-pointer hover:bg-blue-500/30">
                                        #{tag} <button onClick={() => removeTag(tag)}><X size={12} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#111421] border-t border-gray-700 rounded-b-2xl flex justify-between items-center">
                    <button
                        onClick={() => setFilters({ year: 'all', categories: [], tags: [] })}
                        className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                        <RefreshCw size={16} /> Limpiar Filtros
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">234 resultados</span>
                        <button
                            onClick={handleApply}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                        >
                            Aplicar Cambios <Check size={18} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FilterDrawer;
