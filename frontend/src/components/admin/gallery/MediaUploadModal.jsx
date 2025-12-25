import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Video, Film, CheckCircle, Trash2, Save, Calendar, Folder, Type } from 'lucide-react';
import { Button, Modal } from '../../ui';

const MediaUploadModal = ({ isOpen, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState('image'); // 'image' | 'video'
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        visible: true
    });

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        processFile(selectedFile);
    };

    const processFile = (selectedFile) => {
        setFile(selectedFile);
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);

        // Auto-detect type
        if (selectedFile.type.startsWith('video/')) {
            setActiveTab('video');
            simulateUpload();
        } else {
            setActiveTab('image');
        }
    };

    const simulateUpload = () => {
        setUploadProgress(0);
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 5;
            });
        }, 100);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) processFile(droppedFile);
    };

    const handleSubmit = () => {
        // Mock save
        onSave({ ...formData, file, type: activeTab, preview });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-5xl bg-[#0e101b] rounded-2xl shadow-2xl border border-gray-800 flex flex-col h-[90vh] overflow-hidden animate-fadeIn">

                {/* Header */}
                <div className="px-8 py-5 flex items-center justify-between border-b border-gray-800 bg-[#1a1d2d] z-10">
                    <div>
                        <h1 className="text-xl font-bold text-white mb-1">Subir Contenido Multimedia</h1>
                        <p className="text-sm text-gray-400">Añade fotos o videos al muro interactivo.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                            Cancelar
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left Column: File Area */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-[#1e2330] rounded-2xl p-6 border border-gray-800 shadow-xl">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    {activeTab === 'image' ? <ImageIcon size={20} className="text-blue-500" /> : <Film size={20} className="text-blue-500" />}
                                    {activeTab === 'image' ? 'Archivo de Imagen' : 'Archivo de Video'}
                                </h3>

                                {!file ? (
                                    <div
                                        className="h-64 border-2 border-dashed border-gray-700 hover:border-blue-500/50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-all group"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="size-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Upload size={32} className="text-blue-500" />
                                        </div>
                                        <h4 className="text-white font-medium mb-1">Arrastra y suelta aquí</h4>
                                        <p className="text-gray-500 text-xs mb-4">JPG, PNG, MP4 (Máx. 50MB)</p>
                                        <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                                            Seleccionar Archivo
                                        </button>
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,video/*" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {activeTab === 'image' && (
                                            <div className="relative w-full h-80 bg-black/50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-700">
                                                <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
                                            </div>
                                        )}

                                        {activeTab === 'video' && (
                                            <div className="bg-[#0e101b] rounded-xl p-4 border border-gray-800">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded bg-blue-500/20 flex items-center justify-center text-blue-500">
                                                            <Video size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white max-w-[200px] truncate">{file.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {(file.size / (1024 * 1024)).toFixed(2)} MB • {uploadProgress}% Subido
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setFile(null)} className="text-gray-500 hover:text-red-400">
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => { setFile(null); setPreview(null); }}
                                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                                            >
                                                <Trash2 size={14} /> Eliminar y Reemplazar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Metadata */}
                        <div className="space-y-6">
                            <div className="bg-[#1e2330] rounded-2xl p-6 border border-gray-800 shadow-xl sticky top-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Type size={20} className="text-blue-500" />
                                    Detalles
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Título <span className="text-red-400">*</span></label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-[#0e101b] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            placeholder="Título del contenido"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Fecha del Evento <span className="text-red-400">*</span></label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full bg-[#0e101b] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            />
                                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Álbum / Categoría <span className="text-red-400">*</span></label>
                                        <div className="relative">
                                            <select
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-[#0e101b] border border-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-white appearance-none focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            >
                                                <option value="" disabled>Seleccionar...</option>
                                                <option value="pre-congress">Pre-Congreso</option>
                                                <option value="day-1">Día 1</option>
                                                <option value="day-2">Día 2</option>
                                                <option value="gala">Cena de Gala</option>
                                            </select>
                                            <Folder size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Descripción</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            rows={4}
                                            className="w-full bg-[#0e101b] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                                            placeholder="Descripción del contenido..."
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-gray-700">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!file || !formData.title}
                                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            <Save size={18} />
                                            Guardar Contenido
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaUploadModal;
