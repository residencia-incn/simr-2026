import React from 'react';
import { ChevronUp, ChevronDown, Archive } from 'lucide-react';
import Button from './Button';

const Table = ({
    columns,
    data,
    onSort,
    sortConfig,
    emptyMessage = "No hay datos para mostrar",
    actions,
    className = ""
}) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
                <Archive className="mx-auto mb-3 text-gray-300" size={48} />
                <p className="text-gray-500 font-medium">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={`overflow-x-auto border border-gray-200 rounded-xl shadow-sm ${className}`}>
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs border-b border-gray-200">
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                className={`px-4 py-3 ${col.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''} ${col.className || ''}`}
                                onClick={() => col.sortable && onSort && onSort(col.key)}
                            >
                                <div className="flex items-center gap-1">
                                    {col.header}
                                    {sortConfig && sortConfig.key === col.key && (
                                        sortConfig.direction === 'asc'
                                            ? <ChevronUp size={14} className="text-blue-600" />
                                            : <ChevronDown size={14} className="text-blue-600" />
                                    )}
                                </div>
                            </th>
                        ))}
                        {actions && <th className="px-4 py-3 text-right">Acciones</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {data.map((item, rowIndex) => (
                        <tr key={item.id || rowIndex} className="hover:bg-gray-50 transition-colors">
                            {columns.map((col, colIndex) => (
                                <td key={colIndex} className={`px-4 py-3 ${col.tdClassName || ''}`}>
                                    {col.render ? col.render(item) : item[col.key]}
                                </td>
                            ))}
                            {actions && (
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                    {actions(item)}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
