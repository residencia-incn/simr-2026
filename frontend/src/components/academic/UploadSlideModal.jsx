import React, { useState } from 'react';
import { api } from '../../services/api';
import { Button, LoadingSpinner, Modal } from '../ui';
import { Upload, FileText, CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const UploadSlideModal = ({ isOpen, onClose, work, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    if (!work) return null;

    const latestSlide = work.latest_slide;
    const isApproved = latestSlide?.status === 'APPROVED';
    const isCorrectionRequested = latestSlide?.status === 'CORRECTION_REQUESTED';
    const isPending = latestSlide?.status === 'PENDING';

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        try {
            await api.research.files.upload(work.id, file);
            await Swal.fire({
                title: 'Subida Exitosa',
                text: 'La diapositiva ha sido enviada para revisión.',
                icon: 'success'
            });
            onClose();
            setFile(null);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Upload error:", error);
            Swal.fire('Error', 'No se pudo subir el archivo.', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Diapositiva - ${work.id}`}>
            <div className="p-4 space-y-6">

                {/* 1. Status Header */}
                <div className={`p-4 rounded-lg flex items-start gap-4 border ${isApproved ? 'bg-green-50 border-green-200' :
                    isCorrectionRequested ? 'bg-red-50 border-red-200' :
                        isPending ? 'bg-orange-50 border-orange-200' :
                            'bg-slate-50 border-slate-200'
                    }`}>
                    <div className="mt-1">
                        {isApproved && <CheckCircle className="w-6 h-6 text-green-600" />}
                        {isCorrectionRequested && <XCircle className="w-6 h-6 text-red-600" />}
                        {isPending && <Clock className="w-6 h-6 text-orange-600" />}
                        {!latestSlide && <Upload className="w-6 h-6 text-slate-500" />}
                    </div>
                    <div>
                        <h4 className={`font-bold ${isApproved ? 'text-green-800' :
                            isCorrectionRequested ? 'text-red-800' :
                                isPending ? 'text-orange-800' :
                                    'text-slate-800'
                            }`}>
                            {isApproved ? 'Versión Aprobada' :
                                isCorrectionRequested ? 'Se Requiere Corrección' :
                                    isPending ? 'En Revisión' :
                                        'Subir Archivo'}
                        </h4>
                        <p className="text-sm mt-1 text-slate-600">
                            {isApproved ? 'Tu archivo ha sido validado. No se requieren más acciones.' :
                                isCorrectionRequested ? 'El administrador ha solicitado cambios. Revisa los comentarios abajo.' :
                                    isPending ? 'Tu archivo está siendo revisado por el comité.' :
                                        'Sube tu presentación final (PPTX/PDF).'}
                        </p>
                    </div>
                </div>

                {/* 2. Admin Comments (If Correction Requested) */}
                {isCorrectionRequested && latestSlide?.admin_comment && (
                    <div className="bg-white border-l-4 border-red-500 p-4 shadow-sm rounded-r-lg">
                        <h5 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Comentarios del Revisor:
                        </h5>
                        <p className="text-slate-700 italic">"{latestSlide.admin_comment}"</p>
                    </div>
                )}

                {/* 3. Current File Info */}
                {latestSlide && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-100">
                        <div className="bg-white p-2 rounded shadow-sm">
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">{latestSlide.original_filename}</div>
                            <div className="text-xs text-slate-500">Versión {latestSlide.version} • Subido el {new Date().toLocaleDateString()}</div>
                        </div>
                        {/* Download Link could go here */}
                    </div>
                )}

                {/* 4. Upload Area (Hidden if Approved) */}
                {!isApproved && (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors relative">
                        <input
                            type="file"
                            accept=".pdf,.ppt,.pptx"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploading}
                        />

                        {file ? (
                            <div className="flex flex-col items-center">
                                <FileText className="w-12 h-12 text-blue-500 mb-2" />
                                <span className="font-medium text-slate-900">{file.name}</span>
                                <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-slate-400">
                                <Upload className="w-12 h-12 mb-2" />
                                <span className="font-medium">
                                    {latestSlide ? 'Subir Nueva Versión' : 'Arrastra o selecciona tu archivo'}
                                </span>
                                <span className="text-xs mt-1">PDF, PPT, PPTX (Máx 20MB)</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={onClose} disabled={uploading}>
                        {isApproved ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {!isApproved && (
                        <Button onClick={handleUpload} disabled={!file || uploading}>
                            {uploading ? <LoadingSpinner size="sm" /> : <><Upload className="w-4 h-4 mr-2" /> {latestSlide ? 'Enviar Corrección' : 'Subir Archivo'}</>}
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default UploadSlideModal;
