import React, { useState, useEffect } from 'react';
import {
    Folder, File, Upload, Plus,
    ArrowLeft, Trash2, ExternalLink, RefreshCw
} from 'lucide-react';
import { Button, Card, Badge, LoadingSpinner } from '../ui';
import { api } from '../../services/api';
import Swal from 'sweetalert2';

export default function DocumentsManager() {
    const [files, setFiles] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null); // null = Root
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Inicio' }]);
    const [loading, setLoading] = useState(false);

    // Cargar archivos
    const fetchDocuments = async (folderId) => {
        setLoading(true);
        try {
            const data = await api.documents.list(folderId);
            setFiles(data);
        } catch (error) {
            console.error("Error cargando documentos", error);
            Swal.fire('Error', 'No se pudieron cargar los documentos', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments(currentFolder);
    }, [currentFolder]);

    // Navegación
    const handleEnterFolder = (folder) => {
        setCurrentFolder(folder.id);
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
    };

    const handleNavigateBreadcrumb = (index) => {
        const target = breadcrumbs[index];
        const newCrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newCrumbs);
        setCurrentFolder(target.id);
    };

    // Crear Carpeta
    const handleCreateFolder = async () => {
        const { value: folderName } = await Swal.fire({
            title: 'Nueva Carpeta',
            input: 'text',
            inputLabel: 'Nombre de la carpeta',
            inputPlaceholder: 'Ej: Facturas, Oficios...',
            showCancelButton: true,
            confirmButtonText: 'Crear',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) return '¡Debes ingresar un nombre!';
            }
        });

        if (folderName) {
            setLoading(true);
            try {
                await api.documents.createFolder(folderName, currentFolder);
                fetchDocuments(currentFolder);
                Swal.fire('Éxito', 'Carpeta creada correctamente', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo crear la carpeta', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    // Subir Archivo
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            await api.documents.upload(file, currentFolder);
            fetchDocuments(currentFolder);
            Swal.fire('Éxito', 'Archivo subido correctamente', 'success');
        } catch (error) {
            Swal.fire('Error', 'No se pudo subir el archivo', 'error');
        } finally {
            setLoading(false);
            // Reset input
            e.target.value = null;
        }
    };

    // Eliminar
    const handleDelete = async (file) => {
        const result = await Swal.fire({
            title: '¿Eliminar elemento?',
            text: `Se moverá a la papelera: ${file.name}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await api.documents.delete(file.id);
                fetchDocuments(currentFolder);
                Swal.fire('Eliminado', 'El elemento ha sido movido a la papelera', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el elemento', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2.5 rounded-xl">
                        <img
                            src="https://cdn.worldvectorlogo.com/logos/google-drive-icon.svg"
                            width="28"
                            alt="Drive"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://www.gstatic.com/images/branding/product/1x/drive_48dp.png"
                            }}
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">Gestión Documental</h2>
                        <p className="text-xs text-gray-500 font-medium">
                            Repositorio Oficial SIMR 2026
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        onClick={handleCreateFolder}
                        className="flex-1 md:flex-none"
                    >
                        <Plus size={18} className="mr-2 text-blue-600" />
                        Nueva Carpeta
                    </Button>

                    <label className="flex-1 md:flex-none">
                        <div className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition cursor-pointer shadow-md shadow-blue-100 font-medium text-sm">
                            <Upload size={18} />
                            Subir Archivo
                        </div>
                        <input type="file" className="hidden" onChange={handleUpload} />
                    </label>

                    <Button variant="ghost" size="icon" onClick={() => fetchDocuments(currentFolder)} title="Refrescar">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </Button>
                </div>
            </div>

            {/* Breadcrumbs Navigation */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 overflow-x-auto text-sm no-scrollbar">
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                        {index > 0 && <span className="text-gray-400">/</span>}
                        <button
                            onClick={() => handleNavigateBreadcrumb(index)}
                            className={`whitespace-nowrap hover:text-blue-600 transition-colors ${index === breadcrumbs.length - 1 ? 'font-bold text-gray-900' : 'text-gray-500'
                                }`}
                        >
                            {index === 0 ? <Folder size={16} className="inline mr-1 text-yellow-500" /> : null}
                            {crumb.name}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* File Explorer Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {loading && files.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20">
                        <LoadingSpinner size="lg" text="Conectando con Google Drive..." />
                    </div>
                ) : files.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Folder size={48} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">Esta carpeta está vacía</p>
                        <p className="text-gray-400 text-sm">Sube archivos o crea subcarpetas</p>
                    </div>
                ) : (
                    files.map(file => (
                        <div
                            key={file.id}
                            className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-lg hover:border-blue-300 transition-all group relative flex flex-col items-center justify-center text-center gap-3 h-40 shadow-sm"
                        >
                            {/* File Icon / Thumbnail */}
                            <div
                                className="w-14 h-14 flex items-center justify-center cursor-pointer transform group-hover:scale-110 transition-transform duration-200"
                                onClick={() => file.type === 'FOLDER' ? handleEnterFolder(file) : window.open(file.link, '_blank')}
                            >
                                {file.type === 'FOLDER' ? (
                                    <Folder className="w-14 h-14 text-yellow-400 fill-yellow-100/50" />
                                ) : (
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                        <img
                                            src={file.icon || "https://www.gstatic.com/images/branding/product/1x/drive_48dp.png"}
                                            alt="file typic"
                                            className="w-10 h-10 object-contain"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Label */}
                            <div className="w-full mt-1">
                                <p className="text-xs font-bold text-gray-800 line-clamp-2 px-1 leading-snug" title={file.name}>
                                    {file.name}
                                </p>
                                <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1 font-semibold">
                                    {file.type === 'FOLDER' ? 'CARPETA' : 'ARCHIVO'}
                                </p>
                            </div>

                            {/* Hover Actions */}
                            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => window.open(file.link, '_blank')}
                                    className="p-1.5 bg-white shadow-md rounded-lg text-blue-600 hover:text-blue-700 hover:scale-110 transition"
                                    title="Ver en Drive"
                                >
                                    <ExternalLink size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(file)}
                                    className="p-1.5 bg-white shadow-md rounded-lg text-red-500 hover:text-red-600 hover:scale-110 transition"
                                    title="Eliminar"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Bottom Info */}
            <div className="flex justify-center">
                <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-100">
                    Sincronizado vía Google Drive API v3
                </Badge>
            </div>
        </div>
    );
}

