import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Printer, Download } from 'lucide-react';
import Button from '../ui/Button';
import Photocheck from './Photocheck';
import { api } from '../../services/api';
import { printContent } from '../../utils/printHandler';

const PhotocheckModal = ({ isOpen, onClose, attendee }) => {
    const printRef = useRef();
    const [printConfig, setPrintConfig] = React.useState({ width: 9, height: 13, pageMargin: 1 });

    useEffect(() => {
        if (isOpen) {
            api.content.getPrintConfig().then(config => {
                if (config) setPrintConfig(config);
            });
        }
    }, [isOpen]);

    const handlePrint = () => {
        printContent(printRef.current, `Fotocheck-${attendee?.name || 'Participante'}`);
    };

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !attendee) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Vista Previa de Fotocheck</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content - Scrollable if needed */}
                <div className="p-6 bg-gray-50 flex-grow overflow-y-auto flex flex-col items-center justify-center gap-4">
                    {/* 1. VISIBLE PREVIEW - Always standard size (9x13) so it looks "normal" */}
                    <div className="shadow-lg transform scale-90 sm:scale-100 origin-top">
                        <Photocheck
                            attendee={attendee}
                            width={9}
                            height={13}
                        />
                    </div>
                    <p className="text-xs text-gray-400 italic">Vista previa estandarizada</p>

                    {/* 2. HIDDEN PRINT SOURCE - Uses configured dims & A4 layout */}
                    <div className="hidden">
                        <div ref={printRef} className="print-root">
                            <style type="text/css" media="print">
                                {`
                                    @page { size: A4; margin: 0; }
                                    body { margin: 0; }
                                `}
                            </style>
                            <div
                                style={{
                                    width: '210mm',
                                    height: '297mm',
                                    padding: `${printConfig.pageMargin !== undefined ? printConfig.pageMargin : 1}cm`,
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'flex-start',
                                    justifyContent: 'flex-start',
                                    boxSizing: 'border-box',
                                    backgroundColor: 'white'
                                }}
                            >
                                <Photocheck
                                    attendee={attendee}
                                    width={printConfig.width}
                                    height={printConfig.height}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-2xl">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handlePrint} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800">
                        <Printer size={18} /> Imprimir / PDF
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PhotocheckModal;
