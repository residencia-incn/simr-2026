import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Clock, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/ui';

const ResearchSubmission = ({ typeId, onCancel, onSuccess }) => {
    const [config, setConfig] = useState(null);
    const [specialties, setSpecialties] = useState([]);
    const [formData, setFormData] = useState({ specialty: '' });
    const [files, setFiles] = useState({}); // Stores file names for UI
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Load Configuration and Specialties
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [types, systemConfig] = await Promise.all([
                    api.research.getTypes(),
                    api.content.getConfig()
                ]);

                // 1. Set Specialties
                setSpecialties(systemConfig.allowed_specialties || []);

                // 2. Set Research Type Config
                const found = types.find(t => t.id === typeId);
                if (found) {
                    found.sections.sort((a, b) => a.section_order - b.section_order);
                    setConfig(found);
                } else {
                    Swal.fire('Error', 'No se encontró la configuración del trabajo.', 'error');
                    onCancel();
                }
            } catch (error) {
                console.error("Error loading initial data:", error);
                Swal.fire('Error', 'Error al cargar datos necesarios.', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (typeId) {
            loadInitialData();
        }
    }, [typeId, onCancel]);

    // Validation
    const handleTextChange = (sectionId, text, maxWords) => {
        const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

        setFormData(prev => ({ ...prev, [sectionId]: text }));

        if (maxWords && wordCount > maxWords) {
            setErrors(prev => ({ ...prev, [sectionId]: `Excede el límite (${wordCount}/${maxWords})` }));
        } else {
            const newErrors = { ...errors };
            delete newErrors[sectionId];
            setErrors(newErrors);
        }
    };

    const handleFileChange = async (sectionId, file) => {
        if (!file) return;

        // Basic validation
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            Swal.fire('Error', 'El archivo es muy pesado (Máx 10MB)', 'error');
            return;
        }

        // Delete previous file if exists
        if (files[sectionId]?.id) {
            try {
                console.log(`Deleting previous file: ${files[sectionId].id}`);
                await api.documents.delete(files[sectionId].id);
            } catch (err) {
                console.warn("Could not delete previous file:", err);
                // Continue with upload even if delete fails
            }
        }

        setFiles(prev => ({ ...prev, [sectionId]: { name: file.name, uploading: true } }));

        try {
            // Upload to Document Management (Drive) or Backend Local
            const response = await api.documents.upload(file);
            // Handle different response formats
            const fileUrl = response.webViewLink || response.web_view_link || response.file_id || response.id;
            const fileId = response.id || response.file_id; // Capture ID

            if (!fileUrl) throw new Error("No URL returned from upload service");

            setFormData(prev => ({ ...prev, [sectionId]: fileUrl }));
            setFiles(prev => ({
                ...prev,
                [sectionId]: {
                    name: file.name,
                    uploading: false,
                    id: fileId // Store ID for future replacement/deletion
                }
            }));

        } catch (err) {
            console.error("Upload process failed:", err);
            setFiles(prev => {
                const newFiles = { ...prev };
                delete newFiles[sectionId];
                return newFiles;
            });
            Swal.fire('Error', 'No se pudo subir el archivo. Intente nuevamente.', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final validation
        if (!formData.specialty) {
            Swal.fire('Atención', 'Debes seleccionar una subespecialidad.', 'warning');
            return;
        }

        setSubmitting(true);

        const payload = {
            type_id: config.id,
            specialty: formData.specialty,
            values: config.sections.map(section => ({
                section_config_id: section.id,
                content_text: section.data_type === 'TEXT' ? formData[section.id] : null,
                file_url: section.data_type === 'FILE' ? formData[section.id] : null,
                bool_value: section.data_type === 'BOOLEAN' ? formData[section.id] : null
            }))
        };

        try {
            await api.research.createSubmission(payload);

            await Swal.fire({
                title: '¡Enviado!',
                text: 'Tu trabajo ha sido enviado correctamente para revisión.',
                icon: 'success',
                confirmButtonText: 'Entendido'
            });

            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Submission error:", error);
            const msg = error.response?.data?.detail || "No se pudo enviar el trabajo.";
            Swal.fire('Error en el envío', msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner text="Cargando protocolo..." />;
    if (!config) return null;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl border-t-4 border-blue-600 animate-fadeIn">
            {/* Header */}
            <div className="mb-8 pb-4 border-b border-gray-100">
                <button
                    onClick={onCancel}
                    className="flex items-center text-gray-400 hover:text-gray-600 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Volver
                </button>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{config.name}</h1>
                <p className="text-gray-500">{config.description}</p>

                <div className="flex items-center gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Cierre: {new Date(config.deadline_standard).toLocaleDateString()} {new Date(config.deadline_standard).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {config.deadline_extended && (
                        <div className="text-gray-400 text-xs">
                            Prórroga hasta: {new Date(config.deadline_extended).toLocaleDateString()}
                        </div>
                    )}
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* GLOBAL FIELD: SPECIALTY */}
                <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-100">
                    <label className="block text-base font-bold text-gray-800 uppercase tracking-wide mb-2">
                        Subespecialidad del Sistema <span className="text-red-500">*</span>
                    </label>
                    <select
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-gray-700"
                        value={formData.specialty}
                        onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                        required
                    >
                        <option value="">-- Selecciona una Subespecialidad --</option>
                        {specialties.map((s, idx) => (
                            <option key={idx} value={s}>{s}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2 italic flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        Indica a qué área científica pertenece tu trabajo.
                    </p>
                </div>

                {config.sections.map((section) => (
                    <div key={section.id} className="p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <label className="block text-base font-bold text-gray-800">
                                {section.title} {section.is_required && <span className="text-red-500">*</span>}
                            </label>
                            {section.is_required && <span className="text-[10px] uppercase font-bold text-gray-400 bg-white px-2 py-1 rounded border">Obligatorio</span>}
                        </div>

                        {section.help_text && (
                            <p className="text-sm text-gray-500 mb-4 italic">{section.help_text}</p>
                        )}

                        {/* TEXT INPUT */}
                        {section.data_type === 'TEXT' && (
                            <div className="relative">
                                <textarea
                                    rows={section.max_words > 50 ? 8 : 3}
                                    className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${errors[section.id] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="Escribe aquí..."
                                    onChange={(e) => handleTextChange(section.id, e.target.value, section.max_words)}
                                ></textarea>
                                <div className="flex justify-between text-xs mt-2 text-gray-500 px-1">
                                    <span>{errors[section.id] && <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {errors[section.id]}</span>}</span>
                                    <span className={`${(formData[section.id]?.split(/\s+/).length || 0) > (section.max_words || 9999) ? "text-red-600 font-bold" : ""}`}>
                                        {formData[section.id]?.trim() ? formData[section.id].trim().split(/\s+/).length : 0} / {section.max_words || '∞'} palabras
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* FILE INPUT */}
                        {section.data_type === 'FILE' && (
                            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${files[section.id] ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:bg-gray-100 cursor-pointer'} relative`}>
                                <input
                                    type="file"
                                    accept={section.allowed_file_types}
                                    onChange={(e) => handleFileChange(section.id, e.target.files[0])}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    disabled={files[section.id]?.uploading}
                                />
                                <div className="flex flex-col items-center justify-center pointer-events-none">
                                    {files[section.id] ? (
                                        <>
                                            {files[section.id].uploading ? (
                                                <LoadingSpinner size="md" />
                                            ) : (
                                                <FileText className="w-10 h-10 text-blue-600 mb-2" />
                                            )}
                                            <span className="text-sm font-medium text-blue-800 truncate max-w-xs">{files[section.id].name}</span>
                                            {files[section.id].uploading && <span className="text-xs text-blue-500 mt-1">Subiendo...</span>}
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-10 h-10 text-gray-400 mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-sm text-gray-600 font-medium">Haz clic o arrastra tu archivo aqui</span>
                                            <span className="text-xs text-gray-400 mt-1">Formatos: {section.allowed_file_types || "Todos"}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* BOOLEAN INPUT */}
                        {section.data_type === 'BOOLEAN' && (
                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                <input
                                    type="checkbox"
                                    id={`check-${section.id}`}
                                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                    onChange={(e) => setFormData(prev => ({ ...prev, [section.id]: e.target.checked }))}
                                />
                                <label htmlFor={`check-${section.id}`} className="text-sm text-gray-700 cursor-pointer select-none">
                                    {section.help_text || "Confirmo esta declaración."}
                                </label>
                            </div>
                        )}

                    </div>
                ))}

                <div className="pt-6 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={submitting || Object.keys(errors).length > 0}
                        className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex justify-center items-center gap-3 ${submitting || Object.keys(errors).length > 0
                            ? 'bg-gray-400 cursor-not-allowed transform-none shadow-none'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-700'
                            }`}
                    >
                        {submitting ? 'Procesando Envío...' : 'Enviar Trabajo Final'}
                        {!submitting && <CheckCircle className="w-6 h-6" />}
                    </button>

                    {Object.keys(errors).length > 0 && (
                        <div className="mt-4 p-4 bg-red-50 text-red-700 text-sm rounded-xl flex items-center justify-center gap-2 border border-red-100">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Por favor corrige los errores resaltados antes de enviar.</span>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ResearchSubmission;
