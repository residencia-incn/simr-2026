import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Printer, Download } from 'lucide-react';
import Button from '../ui/Button';
import Photocheck from './Photocheck';
import html2pdf from 'html2pdf.js';

const PhotocheckModal = ({ isOpen, onClose, attendee }) => {
    const printRef = useRef();

    const handleDownloadPDF = async () => {
        try {
            const element = printRef.current;
            const opt = {
                margin: 0,
                filename: `Photocheck-${attendee?.name || 'Participante'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a6', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Hubo un error al generar el PDF. Por favor intente nuevamente.");
        }
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
                <div className="p-6 bg-gray-50 flex-grow overflow-y-auto flex justify-center">
                    <div className="shadow-lg transform scale-90 sm:scale-100 origin-top">
                        <div ref={printRef}>
                            <Photocheck attendee={attendee} />
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-2xl">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800">
                        <Download size={18} /> Guardar PDF
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PhotocheckModal;
