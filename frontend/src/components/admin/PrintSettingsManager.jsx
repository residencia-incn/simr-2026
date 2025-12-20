import React, { useState, useRef } from 'react';
import { Printer, Settings, Users, ChevronLeft, ChevronRight, Grid } from 'lucide-react';
import { Card, Button } from '../ui';
import Photocheck from './Photocheck';
import { useApi } from '../../hooks';
import { api } from '../../services/api';
import { printContent } from '../../utils/printHandler';
import { showSuccess } from '../../utils/alerts';

const PrintSettingsManager = () => {
    // Attendees Data
    const { data } = useApi(api.attendees.getAll);
    const attendees = data || [];

    // Print Config State (Default values will be overwritten by API)
    const [config, setConfig] = useState({
        width: 9,      // cm
        height: 13,    // cm
        margin: 0.5,   // cm (gap between items)
        pageMargin: 1  // cm (page padding)
    });

    // Load initial config
    React.useEffect(() => {
        const loadConfig = async () => {
            const saved = await api.content.getPrintConfig();
            if (saved) setConfig(saved);
        };
        loadConfig();
    }, []);

    const handleSaveConfig = async () => {
        await api.content.savePrintConfig(config);
        showSuccess('Las dimensiones han sido guardadas correctamente.', 'Configuración guardada');
    };

    // Selection State
    const [selectedAttendees, setSelectedAttendees] = useState([]);
    // Zoom State for Preview
    const [zoomLevel, setZoomLevel] = useState(0.5);
    // Pagination State
    const [currentPage, setCurrentPage] = useState(0);

    // Pagination Logic
    // A4 Dimensions in cm: 21.0 x 29.7
    const A4_WIDTH = 21.0;
    const A4_HEIGHT = 29.7;

    // Calculate items per row and column based on config
    const w = config.width || 9;
    const h = config.height || 13;
    const m = config.margin || 0.5;
    const pm = config.pageMargin || 1;

    // Avail width = A4_WIDTH - (pageMargin * 2)
    const availWidth = A4_WIDTH - (pm * 2);
    const availHeight = A4_HEIGHT - (pm * 2);

    const cols = Math.floor((availWidth + m) / (w + m));
    const rows = Math.floor((availHeight + m) / (h + m));
    const itemsPerPage = Math.max(1, cols * rows);

    // Chunk selected attendees into pages
    const pages = [];
    if (selectedAttendees.length > 0 && itemsPerPage > 0) {
        for (let i = 0; i < selectedAttendees.length; i += itemsPerPage) {
            pages.push(selectedAttendees.slice(i, i + itemsPerPage));
        }
    }

    // Reset page if out of bounds
    React.useEffect(() => {
        if (currentPage >= pages.length && pages.length > 0) {
            setCurrentPage(0);
        }
    }, [pages.length]);

    const printRef = useRef(null);

    const handlePrint = () => {
        printContent(printRef.current, `Fotochecks_Batch_${new Date().toISOString().split('T')[0]}`);
    };

    // Search State
    const [searchQuery, setSearchQuery] = useState("");

    // Filtered Attendees
    const filteredAttendees = attendees.filter(att =>
        att.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (att.role && att.role.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Helpers
    const toggleSelection = (attendee) => {
        if (selectedAttendees.find(a => a.id === attendee.id)) {
            setSelectedAttendees(selectedAttendees.filter(a => a.id !== attendee.id));
        } else {
            setSelectedAttendees([...selectedAttendees, attendee]);
        }
    };

    const selectAll = () => {
        // If search is active, only select/deselect filtered results
        const targets = searchQuery ? filteredAttendees : attendees;

        // Check if all targets are already selected
        const allSelected = targets.every(t => selectedAttendees.find(a => a.id === t.id));

        if (allSelected) {
            // Deselect all targets
            setSelectedAttendees(selectedAttendees.filter(a => !targets.find(t => t.id === a.id)));
        } else {
            // Select all targets (avoid duplicates)
            const newSelection = [...selectedAttendees];
            targets.forEach(t => {
                if (!newSelection.find(a => a.id === t.id)) {
                    newSelection.push(t);
                }
            });
            setSelectedAttendees(newSelection);
        }
    };

    return (
        <Card className="p-6">
            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2">
                <Printer size={20} className="text-gray-500" />
                Configuración de Impresión / Batch
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controls */}
                <div className="space-y-6">
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h5 className="font-bold text-sm text-gray-700 flex items-center gap-2">
                            <Settings size={16} /> Dimensiones (Centímetros)
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Ancho (cm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.width}
                                    onChange={(e) => setConfig({ ...config, width: parseFloat(e.target.value) })}
                                    className="w-full p-2 border rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Alto (cm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.height}
                                    onChange={(e) => setConfig({ ...config, height: parseFloat(e.target.value) })}
                                    className="w-full p-2 border rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Espacio (cm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.margin}
                                    onChange={(e) => setConfig({ ...config, margin: parseFloat(e.target.value) })}
                                    className="w-full p-2 border rounded text-sm"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button onClick={handleSaveConfig} variant="outline" size="sm" className="w-full text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200">
                                    Guardar Config
                                </Button>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 italic mt-2 bg-yellow-50 p-2 rounded text-yellow-800 border border-yellow-100">
                            Capacidad: {cols} x {rows} = {itemsPerPage} por hoja A4
                        </div>
                    </div>

                    <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex justify-between items-center mb-2">
                            <h5 className="font-bold text-sm text-blue-800 flex items-center gap-2">
                                <Users size={16} /> Selección ({selectedAttendees.length})
                            </h5>
                            <button onClick={selectAll} className="text-xs text-blue-600 underline">
                                {searchQuery ? 'Selec. Filtrados' : 'Todos'}
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="mb-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar participante..."
                                className="w-full p-1.5 text-xs border border-blue-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="h-64 overflow-y-auto bg-white border border-gray-200 rounded p-2 text-sm space-y-1">
                            {filteredAttendees.length > 0 ? (
                                filteredAttendees.map(att => (
                                    <div
                                        key={att.id}
                                        onClick={() => toggleSelection(att)}
                                        className={`p-2 rounded cursor-pointer flex justify-between items-center ${selectedAttendees.find(a => a.id === att.id) ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-50 text-gray-700'}`}
                                    >
                                        <span className="truncate">{att.name}</span>
                                        <span className="text-xs opacity-70 ml-2 whitespace-nowrap">{att.role}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-400 py-4 text-xs">
                                    No se encontraron resultados
                                </div>
                            )}
                        </div>
                    </div>

                    <Button
                        onClick={handlePrint}
                        disabled={selectedAttendees.length === 0}
                        className="w-full bg-gray-900 text-white flex justify-center items-center gap-2 hover:bg-black transition-colors shadow-lg"
                    >
                        <Printer size={18} /> Imprimir Selección
                    </Button>
                </div>

                {/* Preview Area (Right Panel) */}
                <div className="lg:col-span-2 bg-gray-200 rounded-xl flex flex-col items-center relative border-inner shadow-inner overflow-hidden h-[700px]">
                    {/* Toolbar */}
                    <div className="w-full bg-white/80 backdrop-blur border-b border-gray-200 p-2 flex justify-between items-center z-20">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-600 px-2">Vista Previa</span>
                            <div className="bg-gray-100 rounded-lg p-1 flex gap-1">
                                <button
                                    onClick={() => setZoomLevel(0.5)}
                                    className={`px-3 py-1 text-xs rounded-md transition-all ${zoomLevel === 0.5 ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Ajustar
                                </button>
                                <button
                                    onClick={() => setZoomLevel(0.75)}
                                    className={`px-3 py-1 text-xs rounded-md transition-all ${zoomLevel === 0.75 ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    75%
                                </button>
                                <button
                                    onClick={() => setZoomLevel(1)}
                                    className={`px-3 py-1 text-xs rounded-md transition-all ${zoomLevel === 1 ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    100%
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-xs font-medium text-gray-600 w-16 text-center">
                                Pág. {pages.length > 0 ? currentPage + 1 : 0} / {pages.length}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
                                disabled={currentPage >= pages.length - 1}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Container with Fixed Left Alignment for Zoom */}
                    <div className={`flex-grow w-full flex items-start bg-gray-200 p-8 ${zoomLevel <= 0.6 ? 'overflow-hidden' : 'overflow-auto'}`}>
                        {/* Wrapper for Scaling - Centered via margin-auto to allow scroll start from left */}
                        <div
                            className="transition-all duration-200 ease-out m-auto origin-top-left"
                            style={{ zoom: zoomLevel }}
                        >
                            {/* Detailed Print Ref Container */}
                            <div ref={printRef} className="print-root">
                                <style type="text/css" media="print">
                                    {`
                                        @page { size: A4; margin: 0; }
                                        body { margin: 0; }
                                        .print-container { page-break-after: always; height: 100vh; display: flex !important; }
                                        .print-container:last-child { page-break-after: auto; }
                                        /* Force show all pages when printing */
                                        .print-page { display: flex !important; }
                                    `}
                                </style>
                                {/* Only render current page as visible, others as hidden but printable */}
                                {pages.map((pageItems, pageIndex) => (
                                    <div
                                        key={pageIndex}
                                        className={`bg-white shadow-2xl relative print-container mb-8 mx-auto print-page origin-top
                                            ${pageIndex === currentPage ? 'flex' : 'hidden print:flex'}
                                        `}
                                        style={{
                                            width: '210mm',
                                            height: '297mm',
                                            padding: `${config.pageMargin || 1}cm`,
                                            flexWrap: 'wrap',
                                            gap: `${config.margin}cm`,
                                            alignContent: 'start',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        {pageItems.map(att => (
                                            <Photocheck
                                                key={att.id}
                                                attendee={att}
                                                width={config.width}
                                                height={config.height}
                                            />
                                        ))}

                                        <div className="absolute bottom-2 right-4 text-[10px] text-gray-300 print:hidden">
                                            Pág. {pageIndex + 1}
                                        </div>
                                    </div>
                                ))}
                                {pages.length === 0 && (
                                    <div className="w-[210mm] h-[297mm] bg-white shadow-xl flex items-center justify-center text-gray-300 mx-auto">
                                        <div className="text-center">
                                            <Grid size={48} className="mx-auto mb-2 opacity-20" />
                                            Sin selección
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default PrintSettingsManager;
