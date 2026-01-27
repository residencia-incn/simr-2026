import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LoadingSpinner, Button, Badge } from '../components/ui';
import { FileText, CheckCircle, XCircle, MessageSquare, History } from 'lucide-react';
import Swal from 'sweetalert2';

const ResearchFilesView = () => {
    const [works, setWorks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWork, setSelectedWork] = useState(null);
    const [files, setFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    useEffect(() => {
        loadAcceptedWorks();
    }, []);

    const loadAcceptedWorks = async () => {
        try {
            const allWorks = await api.works.getAll();
            // Filter accepted works only
            const accepted = allWorks.filter(w => w.status === 'ACEPTADO');
            setWorks(accepted);
        } catch (error) {
            console.error("Error loading works:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectWork = async (work) => {
        setSelectedWork(work);
        setLoadingFiles(true);
        try {
            const workFiles = await api.research.files.getBySubmission(work.id);
            setFiles(workFiles);
        } catch (error) {
            console.error("Error loading files:", error);
        } finally {
            setLoadingFiles(false);
        }
    };

    const handleReview = async (file, action) => {
        let comment = '';
        if (action === 'CORRECTION_REQUESTED') {
            const { value: text, isDismissed } = await Swal.fire({
                title: 'Solicitar Corrección',
                input: 'textarea',
                inputLabel: 'Detalle las correcciones necesarias',
                inputPlaceholder: 'Ej: Mejorar legibilidad en slide 4...',
                showCancelButton: true,
                confirmButtonText: 'Enviar Solicitud',
                cancelButtonText: 'Cancelar'
            });
            if (isDismissed || !text) return;
            comment = text;
        } else {
            const result = await Swal.fire({
                title: '¿Aprobar Archivo?',
                text: "Esta versión será marcada como definitiva para la presentación.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, Aprobar'
            });
            if (!result.isConfirmed) return;
        }

        try {
            await api.research.files.review(file.id, action, comment);
            Swal.fire('Guardado', 'El estado del archivo ha sido actualizado.', 'success');
            handleSelectWork(selectedWork); // Reload
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar el estado.', 'error');
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            {/* List of Works */}
            <div className="w-1/3 bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="font-bold text-slate-800 dark:text-white">Trabajos Aceptados ({works.length})</h2>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {works.map(work => (
                        <div
                            key={work.id}
                            onClick={() => handleSelectWork(work)}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedWork?.id === work.id
                                ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-700'
                                : 'bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:border-primary-300'
                                }`}
                        >
                            <div className="text-xs font-mono text-slate-500 mb-1">{work.id}</div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">{work.title}</h3>
                            <div className="mt-2 text-xs text-slate-500">{work.author}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* File Details */}
            <div className="flex-1 bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                {selectedWork ? (
                    <>
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{selectedWork.title}</h2>
                            <p className="text-sm text-slate-500">Historial de archivos y versiones</p>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingFiles ? <LoadingSpinner /> : files.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                    No se han subido archivos para este trabajo.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {files.map((file) => (
                                        <div key={file.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex items-start gap-4">
                                            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                                                <FileText className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                                            {file.original_filename}
                                                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">v{file.version}</span>
                                                        </h4>
                                                        <p className="text-xs text-slate-500 mt-1">Subido el {new Date(file.created_at).toLocaleString()}</p>
                                                    </div>
                                                    <Badge variant={
                                                        file.status === 'APPROVED' ? 'success' :
                                                            file.status === 'CORRECTION_REQUESTED' ? 'warning' : 'default'
                                                    }>
                                                        {file.status === 'APPROVED' ? 'Aprobado' :
                                                            file.status === 'CORRECTION_REQUESTED' ? 'Corrección Solicitada' : 'Pendiente'}
                                                    </Badge>
                                                </div>

                                                {file.admin_comment && (
                                                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded text-sm text-amber-800 dark:text-amber-300">
                                                        <MessageSquare className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                                                        <strong>Comentario:</strong> {file.admin_comment}
                                                    </div>
                                                )}

                                                <div className="mt-4 flex gap-3">
                                                    <a
                                                        href={`http://localhost:8000/${file.file_path}`}
                                                        download
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center gap-2 h-8 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 rounded-md"
                                                    >
                                                        <FileText className="w-4 h-4" /> Ver Archivo
                                                    </a>

                                                    {file.status === 'PENDING' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700 text-white border-none"
                                                                onClick={() => handleReview(file, 'APPROVED')}
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-2" /> Aprobar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleReview(file, 'CORRECTION_REQUESTED')}
                                                            >
                                                                <XCircle className="w-4 h-4 mr-2" /> Solicitar Corrección
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <History className="w-16 h-16 mb-4 opacity-50" />
                        <p>Seleccione un trabajo para ver sus archivos</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResearchFilesView;
