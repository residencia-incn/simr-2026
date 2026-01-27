import React, { useState } from 'react';
import { Card } from '../ui'; // Assuming Card is exported from ui index, based on DocumentationView imports
import { Database, Copy, Check, FileJson, Code } from 'lucide-react';

const DataSchemaViewer = ({ title, data, description, tableName }) => {
    const [copiedSql, setCopiedSql] = useState(false);
    const [copiedJson, setCopiedJson] = useState(false);

    // Analyze data structure
    const sampleItem = Array.isArray(data) ? (data.length > 0 ? data[0] : {}) : data;
    const fields = Object.entries(sampleItem).map(([key, value]) => {
        let type = typeof value;
        let sqlType = 'TEXT';
        let example = JSON.stringify(value);

        if (value === null) {
            type = 'null';
            sqlType = 'NULL';
            example = 'null';
        } else if (Array.isArray(value)) {
            type = 'array';
            sqlType = 'JSON'; // Or TEXT[] depending on DB
        } else if (type === 'number') {
            sqlType = Number.isInteger(value) ? 'INTEGER' : 'DECIMAL';
        } else if (type === 'boolean') {
            sqlType = 'BOOLEAN';
        } else if (type === 'object') {
            sqlType = 'JSON'; // Nested object
        } else if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
             // Heuristic for dates
             sqlType = 'TIMESTAMP';
        }

        return { key, type, sqlType, example, value };
    });

    // Generate SQL Create Statement
    const generateSQL = () => {
        const safeTableName = tableName || title.replace(/\s+/g, '_').toUpperCase();
        
        let sql = `-- Table structure for ${title}\n`;
        sql += `CREATE TABLE IF NOT EXISTS ${safeTableName} (\n`;
        
        const columnDefs = fields.map(field => {
            return `    ${field.key} ${field.sqlType}`;
        });
        
        sql += columnDefs.join(',\n');
        sql += `\n);\n\n`;

        // Generate Insert for sample data (up to 5 items)
        const itemsToInsert = Array.isArray(data) ? data.slice(0, 5) : [data];
        
        if (itemsToInsert.length > 0) {
            sql += `-- Example Data\n`;
            itemsToInsert.forEach(item => {
                const values = fields.map(field => {
                    const val = item[field.key];
                    if (val === null || val === undefined) return 'NULL';
                    if (typeof val === 'number') return val;
                    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                    return `'${String(val).replace(/'/g, "''")}'`;
                });
                sql += `INSERT INTO ${safeTableName} (${fields.map(f => f.key).join(', ')}) VALUES (${values.join(', ')});\n`;
            });
        }

        return sql;
    };

    const handleCopySql = () => {
        navigator.clipboard.writeText(generateSQL());
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2000);
    };

    const handleCopyJson = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 2000);
    };

    return (
        <Card className="mb-6 overflow-hidden border border-gray-200">
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <Database size={18} className="text-blue-600" />
                        {title}
                        <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                            {Array.isArray(data) ? `${data.length} registros` : 'Objeto único'}
                        </span>
                    </h3>
                    {description && (
                        <p className="text-sm text-gray-500 mt-1">{description}</p>
                    )}
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={handleCopyJson}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                        {copiedJson ? <Check size={14} className="text-green-600" /> : <FileJson size={14} />}
                        {copiedJson ? 'Copiado' : 'JSON'}
                    </button>
                    <button 
                        onClick={handleCopySql}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700 transition-colors"
                    >
                        {copiedSql ? <Check size={14} /> : <Code size={14} />}
                        {copiedSql ? 'Copiado' : 'Generar SQL'}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 w-1/4">Campo</th>
                            <th className="px-4 py-3 w-1/6">Tipo Datos</th>
                            <th className="px-4 py-3 w-1/6">SQL Type</th>
                            <th className="px-4 py-3">Ejemplo Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {fields.map((field, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-mono text-blue-700 font-medium">
                                    {field.key}
                                </td>
                                <td className="px-4 py-2 text-gray-500">
                                    {field.type}
                                </td>
                                <td className="px-4 py-2 font-mono text-purple-600 text-xs">
                                    {field.sqlType}
                                </td>
                                <td className="px-4 py-2 text-gray-600 truncate max-w-xs font-mono text-xs" title={field.example}>
                                    {field.example.length > 50 ? field.example.substring(0, 50) + '...' : field.example}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default DataSchemaViewer;
