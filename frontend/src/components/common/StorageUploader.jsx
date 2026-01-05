import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import useFileUpload from '../../hooks/useFileUpload';

/**
 * StorageUploader
 * Componente para subir archivos a "storage" (Simulado por ahora hasta conectar con API real).
 * 
 * Props:
 * - onUploadComplete: (url) => void - Callback con la URL del archivo subido.
 * - onDelete: () => void - Callback al eliminar el archivo.
 * - initialUrl: string - URL inicial si ya existe.
 * - maxSizeMB: number - Tamaño máximo en MB.
 * - acceptedFileTypes: string[] - Mime types aceptados.
 * - label: string - Texto del botón/zona.
 * - path: string - Ruta lógica de almacenamiento (opcional).
 * - prefix: string - Prefijo para el nombre del archivo (opcional).
 */
const StorageUploader = ({
    onUploadComplete,
    onDelete,
    initialUrl = '',
    maxSizeMB = 5,
    acceptedFileTypes = ['image/*', 'application/pdf'],
    label = 'Subir Archivo',
    path = 'uploads',
    prefix = ''
}) => {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedUrl, setUploadedUrl] = useState(initialUrl);

    // Mock Upload Logic
    const mockUpload = async (file) => {
        return new Promise((resolve) => {
            setUploadProgress(0);
            const interval = setInterval(() => {
                setUploadProgress(prev => {
                    const next = prev + 10;
                    if (next >= 100) {
                        clearInterval(interval);
                        // Generate mock URL
                        const mockUrl = `https://storage.googleapis.com/simr-2026/${path}/${prefix}_${Date.now()}_${file.name}`;
                        resolve(mockUrl);
                        return 100;
                    }
                    return next;
                });
            }, 150);
        });
    };

    const {
        file,
        preview,
        error,
        uploading,
        handleFileChange,
        clear
    } = useFileUpload({
        maxSize: maxSizeMB * 1024 * 1024,
        acceptedTypes: acceptedFileTypes,
        onUpload: async (file) => {
            const url = await mockUpload(file);
            setUploadedUrl(url);
            if (onUploadComplete) onUploadComplete(url);
        }
    });

    const handleDelete = () => {
        clear();
        setUploadedUrl('');
        setUploadProgress(0);
        if (onDelete) onDelete();
    };

    // If we have an initial URL but no file object (loaded from DB)
    const hasExistingFile = !file && uploadedUrl;

    return (
        <div className="w-full">
            {error && (
                <div className="mb-2 p-2 bg-red-50 text-red-600 text-sm rounded flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {!file && !hasExistingFile ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-1 text-sm text-gray-500 font-semibold">{label}</p>
                        <p className="text-xs text-gray-500">
                            {acceptedFileTypes.join(', ').replace('image/*', 'Imágenes').replace('application/pdf', 'PDF')} (Máx. {maxSizeMB}MB)
                        </p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept={acceptedFileTypes.join(',')}
                    />
                </label>
            ) : (
                <div className="relative border border-gray-200 rounded-lg p-4 bg-white shadow-sm">

                    {/* View: Uploading */}
                    {uploading && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <FileText className="text-blue-500" size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-700">Subiendo...</p>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                        <div
                                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View: Completed / Existing */}
                    {(!uploading && (file || hasExistingFile)) && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <CheckCircle className="text-green-500" size={20} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                        {file ? file.name : (decodeURIComponent(uploadedUrl.split('/').pop()) || 'Archivo subido')}
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Listo'}
                                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                        <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            Ver archivo
                                        </a>
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleDelete}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StorageUploader;
