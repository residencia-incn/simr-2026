import React, { useState } from 'react';

interface ReadingEditorProps {
    readingId: number | null;
    onCancel: () => void;
    onSave: () => void;
}

const ReadingEditor: React.FC<ReadingEditorProps> = ({ readingId, onCancel, onSave }) => {
    // Mock initial state for editing or default for new
    const [formData, setFormData] = useState({
        title: readingId ? 'Historia Clínica Neurológica: Protocolos Actualizados' : '',
        sourceType: 'editor', // editor, pdf, link
        content: readingId ? 'La historia clínica es la herramienta más importante en el diagnóstico neurológico...' : '',
        duration: 15,
        isMandatory: true,
        allowDownload: false,
        tags: ['Semiología', 'Protocolos', 'Diagnóstico'],
        tagInput: ''
    });

    const handleSourceChange = (type: string) => {
        setFormData({ ...formData, sourceType: type });
    };

    const handleTagAdd = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && formData.tagInput.trim()) {
            setFormData({
                ...formData,
                tags: [...formData.tags, formData.tagInput.trim()],
                tagInput: ''
            });
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(tag => tag !== tagToRemove)
        });
    };

    return (
        <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                            <span>Admin</span>
                            <span>/</span>
                            <span>Cursos</span>
                            <span>/</span>
                            <span>Plan de Estudios</span>
                            <span>/</span>
                            <span className="font-semibold text-slate-800">Editar Lectura</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">{readingId ? 'Editar Lectura' : 'Nueva Lectura'}</h1>
                        <p className="text-slate-500">Configura el contenido y los parámetros de esta unidad de aprendizaje.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        Guardar Cambios
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Título de la Lectura</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-medium"
                                placeholder="Ej. Introducción a la Neurología Clínica"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-3">Fuente de Contenido</label>
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={() => handleSourceChange('editor')}
                                    className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${formData.sourceType === 'editor'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                        }`}
                                >
                                    <span className="material-symbols-outlined mb-2">edit_document</span>
                                    <span className="text-xs font-bold uppercase tracking-wider">Editor</span>
                                </button>
                                <button
                                    onClick={() => handleSourceChange('pdf')}
                                    className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${formData.sourceType === 'pdf'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                        }`}
                                >
                                    <span className="material-symbols-outlined mb-2">upload_file</span>
                                    <span className="text-xs font-bold uppercase tracking-wider">PDF</span>
                                </button>
                                <button
                                    onClick={() => handleSourceChange('link')}
                                    className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${formData.sourceType === 'link'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                        }`}
                                >
                                    <span className="material-symbols-outlined mb-2">link</span>
                                    <span className="text-xs font-bold uppercase tracking-wider">Enlace</span>
                                </button>
                            </div>
                        </div>

                        {/* Dynamic Content Area based on Source Type */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Contenido</label>
                            {formData.sourceType === 'editor' && (
                                <div className="border border-slate-300 rounded-lg overflow-hidden">
                                    <div className="bg-slate-50 border-b border-slate-300 p-2 flex items-center gap-2">
                                        <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
                                        <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><span className="material-symbols-outlined text-[18px]">format_italic</span></button>
                                        <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><span className="material-symbols-outlined text-[18px]">format_underlined</span></button>
                                        <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                        <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><span className="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
                                        <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><span className="material-symbols-outlined text-[18px]">format_list_numbered</span></button>
                                        <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                        <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><span className="material-symbols-outlined text-[18px]">format_align_left</span></button>
                                        <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><span className="material-symbols-outlined text-[18px]">format_align_center</span></button>
                                        <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><span className="material-symbols-outlined text-[18px]">image</span></button>
                                        <div className="flex-1"></div>
                                        <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><span className="material-symbols-outlined text-[18px]">code</span></button>
                                    </div>
                                    <textarea
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full p-4 min-h-[300px] focus:outline-none resize-y"
                                        placeholder="Escribe el contenido de la lectura aquí..."
                                    />
                                </div>
                            )}

                            {formData.sourceType === 'pdf' && (
                                <div className="border border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">cloud_upload</span>
                                    <p className="font-medium text-slate-600">Arrastra tu archivo PDF aquí o haz clic para subir</p>
                                    <p className="text-sm text-slate-400 mt-1">Máximo 25MB (PDF)</p>
                                </div>
                            )}

                            {formData.sourceType === 'link' && (
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">link</span>
                                    <input
                                        type="url"
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        placeholder="https://ejemplo.com/recurso"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    {/* Settings Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600">settings</span>
                            Ajustes de la Lección
                        </h3>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duración Estimada</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                    className="w-full pl-4 pr-16 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50"
                                    min="1"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">minutos</span>
                            </div>
                        </div>

                        <div className="mb-4 flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div>
                                <p className="font-bold text-slate-700 text-sm">Obligatoria</p>
                                <p className="text-xs text-slate-500">Requerida para completar el módulo</p>
                            </div>
                            <button
                                onClick={() => setFormData({ ...formData, isMandatory: !formData.isMandatory })}
                                className={`w-11 h-6 rounded-full transition-colors relative ${formData.isMandatory ? 'bg-blue-600' : 'bg-slate-300'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.isMandatory ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div>
                                <p className="font-bold text-slate-700 text-sm">Permitir Descarga</p>
                                <p className="text-xs text-slate-500">Habilitar descarga como PDF</p>
                            </div>
                            <button
                                onClick={() => setFormData({ ...formData, allowDownload: !formData.allowDownload })}
                                className={`w-11 h-6 rounded-full transition-colors relative ${formData.allowDownload ? 'bg-blue-600' : 'bg-slate-300'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.allowDownload ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Tags Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600">label</span>
                            Etiquetas Temáticas
                        </h3>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {formData.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1 group">
                                    {tag}
                                    <button onClick={() => removeTag(tag)} className="hover:text-blue-900"><span className="material-symbols-outlined text-[14px]">close</span></button>
                                </span>
                            ))}
                        </div>

                        <div className="relative">
                            <input
                                type="text"
                                value={formData.tagInput}
                                onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                                onKeyDown={handleTagAdd}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="Añadir etiqueta..."
                            />
                            <button
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:bg-blue-100 p-1 rounded transition-colors"
                                onClick={() => handleTagAdd({ key: 'Enter', target: { value: formData.tagInput } } as any)}
                            >
                                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Presiona Enter para añadir una nueva etiqueta.</p>
                    </div>

                    {/* Pro Tip */}
                    <div className="bg-blue-600 p-6 rounded-xl text-white shadow-lg shadow-blue-600/20">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-2xl animate-pulse">lightbulb</span>
                            <div>
                                <p className="font-bold text-sm uppercase tracking-wider opacity-90 mb-1">Consejo Pro</p>
                                <p className="text-sm opacity-90 leading-relaxed mb-4">
                                    Puedes previsualizar cómo verá el estudiante este contenido antes de publicarlo haciendo clic en 'Vista Previa'.
                                </p>
                                <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg font-bold text-sm transition-colors border border-white/30">
                                    Ver Vista Previa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReadingEditor;
