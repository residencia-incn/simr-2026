import React, { useState } from 'react';
import { api } from '../../../services/api';

const AdminPhotoGrid = ({ items = [], selectedYear, years = [], onYearChange, onAddYear, onEdit, onDelete, onUpload, onViewAlbums, onOpenFilters }) => {

    // Mock layout classes assignment for demo purposes to match code5.html aesthetics
    // In a real app, this might be stored in the DB or calculated based on aspect ratio
    const getGridClass = (index) => {
        // Pattern from code5.html: Big (0), Wide (1), Tall (2), Normal (3), Wide (4), Normal (5), Normal (6), Normal (7)
        const patterns = ['big', 'wide', 'tall', '', 'wide', '', '', '', 'tall', 'wide', '', ''];
        const type = patterns[index % patterns.length];

        const classes = {
            'big': 'col-span-2 row-span-2',
            'wide': 'col-span-2',
            'tall': 'row-span-2',
            '': ''
        };
        return classes[type] || '';
    };

    return (
        <div className="relative h-full w-full bg-[#0e101b] flex flex-col overflow-hidden">
            <style>{`
                .wall-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    grid-auto-rows: 180px;
                    gap: 4px;
                    padding-bottom: 80px;
                }
                .grid-item {
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .grid-item:hover {
                    z-index: 10;
                    transform: scale(1.05);
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
                    border-radius: 4px;
                    outline: 2px solid #1736cf;
                }
                .edit-overlay {
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .grid-item:hover .edit-overlay {
                    opacity: 1;
                }
            `}</style>

            {/* Floating Year Selector */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 p-1.5 rounded-full shadow-xl">
                {years.map(year => (
                    <button
                        key={year}
                        onClick={() => onYearChange(year)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${selectedYear === year ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        {year}
                    </button>
                ))}

                <button
                    onClick={onAddYear}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-dashed border-gray-500"
                >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
            </div>

            {/* Main Grid */}
            <div className="flex-grow overflow-y-auto p-1 custom-scrollbar">
                <div className="wall-grid">
                    {/* Hero Mock Item (Always first if present or manually added) */}
                    <div className="grid-item col-span-2 row-span-2 relative group">
                        <img
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuADPK2mVjGFZY6xGF_CEyKjk-gN77LZZLs0KuaCAeEb8Ijxr77wTiIKyz2Vi_5mcKGDAsyqpPJWUy9OHIiOsp5sGpC-3ng6c3mm8fI0VJhBlRwlWd22_yzsSIM4W98s_xHBkuI6WRMweVhYSUIraw4WQYGTWdNNNpi6y_LbuFzAw0XP5PqHGoftBL9-VSexTyF_VA70y3da8fiChW1T7jH1WB6hu29RAk9fU-9PYDmW1kj7bjnohMQZozpSk_CEf1-phRwwMewLxRo"
                            alt="Banner"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 p-6 flex flex-col justify-end">
                            <h2 className="text-2xl font-black leading-tight text-white mb-1">Memorias {selectedYear}</h2>
                            <p className="text-sm text-gray-300">Congreso Nacional de Neurología</p>
                        </div>
                        <div className="edit-overlay absolute inset-0 bg-black/60 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                            <button className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform"><span className="material-symbols-outlined">edit</span></button>
                        </div>
                    </div>

                    {items.map((item, index) => (
                        <div key={item.id} className={`grid-item ${getGridClass(index)} group`}>
                            <img src={item.url} alt={item.title} className="w-full h-full object-cover" />

                            {/* Tags */}
                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">
                                {item.category || 'General'}
                            </div>

                            {/* Actions Overlay */}
                            <div className="edit-overlay absolute inset-0 bg-black/60 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                <button
                                    onClick={() => onEdit(item)}
                                    className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg"
                                    title="Editar"
                                >
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button
                                    onClick={() => onDelete(item.id)}
                                    className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                                    title="Eliminar"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add Placeholders */}
                    {[1, 2, 3].map(i => (
                        <div
                            key={`add-${i}`}
                            onClick={onUpload}
                            className="grid-item flex items-center justify-center bg-gray-800/30 border-2 border-dashed border-gray-700 hover:border-gray-500 text-gray-600 hover:text-gray-400 hover:bg-gray-800/50 transition-all"
                        >
                            <div className="text-center">
                                <span className="material-symbols-outlined text-4xl mb-1">add_photo_alternate</span>
                                <p className="text-xs font-bold">Añadir</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Dock Filters */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1736cf]/90 backdrop-blur-xl px-6 py-3 rounded-2xl flex items-center gap-6 shadow-2xl border border-white/10 max-w-[90%] overflow-x-auto no-scrollbar">
                <button className="text-white font-bold text-xs whitespace-nowrap border-b-2 border-white pb-0.5">Todas</button>
                <button className="text-white/70 hover:text-white font-medium text-xs whitespace-nowrap hover:scale-105 transition-all">Pre-Congreso</button>
                <button className="text-white/70 hover:text-white font-medium text-xs whitespace-nowrap hover:scale-105 transition-all">Día 1</button>
                <button className="text-white/70 hover:text-white font-medium text-xs whitespace-nowrap hover:scale-105 transition-all">Día 2</button>
                <button className="text-white/70 hover:text-white font-medium text-xs whitespace-nowrap hover:scale-105 transition-all">Gala</button>
                <div className="w-px h-4 bg-white/20"></div>
                <button
                    onClick={onOpenFilters}
                    className="flex items-center gap-1 text-white/70 hover:text-white font-medium text-xs whitespace-nowrap hover:scale-105 transition-all"
                >
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    Más Filtros
                </button>
                <button
                    onClick={onViewAlbums}
                    className="flex items-center gap-1 text-white/70 hover:text-white font-medium text-xs whitespace-nowrap hover:scale-105 transition-all"
                >
                    <span className="material-symbols-outlined text-[16px]">folder_open</span>
                    Gestionar Álbumes
                </button>
            </div>
        </div>
    );
};

export default AdminPhotoGrid;
