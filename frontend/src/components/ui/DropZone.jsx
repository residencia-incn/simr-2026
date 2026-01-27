import React, { useState, useCallback, useRef } from 'react';
import { Upload, File, X, Image as ImageIcon } from 'lucide-react';
import { showWarning } from '../../utils/alerts';

const DropZone = ({
    onFileSelect,
    file,
    label = "Voucher de Pago",
    helpText = "Arrastra un archivo, búscalo o pégalo directamente",
    accept = "image/*,application/pdf",
    maxSize = 10 * 1024 * 1024 // 10MB
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFiles = useCallback((selectedFiles) => {
        if (!selectedFiles || selectedFiles.length === 0) return;
        const selectedFile = selectedFiles[0];

        if (selectedFile.size > maxSize) {
            showWarning(`El archivo es muy grande. Máximo ${maxSize / 1024 / 1024}MB`, 'Archivo demasiado pesado');
            return;
        }

        onFileSelect(selectedFile);
    }, [onFileSelect, maxSize]);

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const onPaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const files = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                files.push(items[i].getAsFile());
            }
        }
        if (files.length > 0) {
            handleFiles(files);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>

            {!file ? (
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onPaste={onPaste}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
                        flex flex-col items-center justify-center gap-3
                        ${isDragging
                            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                            : 'border-gray-300 hover:border-gray-400 bg-gray-50'}
                    `}
                    tabIndex="0"
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFiles(e.target.files)}
                        accept={accept}
                        className="hidden"
                    />

                    <div className="p-3 bg-white rounded-full shadow-sm">
                        <Upload className={isDragging ? 'text-blue-500' : 'text-gray-400'} size={24} />
                    </div>

                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                            {isDragging ? '¡Suéltalo aquí!' : 'Haz clic o arrastra un archivo'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {helpText}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg animate-fadeIn">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-white rounded-lg border border-blue-100 shrink-0">
                            {file.type.startsWith('image/') ? <ImageIcon size={20} className="text-blue-600" /> : <File size={20} className="text-blue-600" />}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-blue-900 truncate">
                                {file.name}
                            </p>
                            <p className="text-xs text-blue-600">
                                {(file.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onFileSelect(null)}
                        className="p-1.5 hover:bg-blue-100 rounded-md text-blue-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default DropZone;
