import React, { useState } from 'react';
import { ViewState } from '../../types';
import { useAulaVirtual } from '../../context/AulaVirtualContext';

interface ReadingManagementProps {
    onEdit: (id: number | null) => void;
}

// Local mock removed in favor of imported mockReadings
const ReadingManagement: React.FC<ReadingManagementProps> = ({ onEdit }) => {
    const { materials } = useAulaVirtual();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, pdf, link, text

    const filteredReadings = materials.filter((reading: any) => {
        const matchesSearch = reading.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reading.module.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || reading.type === filterType;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gestión de Lecturas</h1>
                    <p className="text-slate-500">Administra y organiza los documentos del plan de estudios.</p>
                </div>
                <button
                    onClick={() => onEdit(null)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium shadow-sm hover:shadow"
                >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    Nueva Lectura
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <span className="material-symbols-outlined text-2xl">description</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Lecturas</p>
                        <p className="text-2xl font-bold text-slate-800">24 Documentos</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Formatos PDF</p>
                        <p className="text-2xl font-bold text-slate-800">18 Archivos</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <span className="material-symbols-outlined text-2xl">link</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enlaces Externos</p>
                        <p className="text-2xl font-bold text-slate-800">6 Referencias</p>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Filters Toolbar */}
                <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-center gap-2">
                        {['all', 'pdf', 'link', 'text'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === type
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                            >
                                {type === 'all' ? 'Todos' : type === 'pdf' ? 'PDFs' : type === 'link' ? 'Enlaces' : 'Módulos'}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Buscar lectura..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full md:w-64"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre del Documento</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Formato</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Módulo</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Última Actualización</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredReadings.map((reading: any) => (
                                <tr key={reading.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${reading.type === 'pdf' ? 'bg-red-50 text-red-600' :
                                                reading.type === 'link' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-purple-50 text-purple-600'
                                                }`}>
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {reading.type === 'pdf' ? 'picture_as_pdf' :
                                                        reading.type === 'link' ? 'link' : 'article'}
                                                </span>
                                            </div>
                                            <span className="font-semibold text-slate-700">{reading.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${reading.type === 'pdf' ? 'bg-red-100 text-red-700' :
                                            reading.type === 'link' ? 'bg-blue-100 text-blue-700' :
                                                'bg-purple-100 text-purple-700'
                                            }`}>
                                            {reading.format}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-600">{reading.module}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-500">{reading.updatedAt}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver previa">
                                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                            </button>
                                            <button
                                                onClick={() => onEdit(reading.id as any)}
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredReadings.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">search_off</span>
                                        <p>No se encontraron lecturas que coincidan con tu búsqueda.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer/Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
                    <button className="hover:text-slate-700 font-medium disabled:opacity-50" disabled>Anterior</button>
                    <div className="flex gap-2">
                        <button className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">1</button>
                        <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">2</button>
                        <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">3</button>
                    </div>
                    <button className="hover:text-slate-700 font-medium">Siguiente</button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4 text-blue-800">
                <span className="material-symbols-outlined text-blue-600">info</span>
                <p className="text-sm font-medium flex-1">
                    Las lecturas marcadas como obligatorias deben ser visualizadas por el estudiante para completar el módulo.
                </p>
                <button className="text-sm font-bold text-blue-700 hover:text-blue-900 hover:underline">
                    Configurar requisitos
                </button>
            </div>
        </div>
    );
};

export default ReadingManagement;
