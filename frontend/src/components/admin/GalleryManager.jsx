import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, Save } from 'lucide-react';
import { Button, Modal, FormField, ConfirmDialog, LoadingSpinner, EmptyState } from '../ui';
import { api } from '../../services/api';
import { useApi, useModal, useForm, useFileUpload } from '../../hooks';
import { showError } from '../../utils/alerts';

const GalleryManager = () => {
    // Hooks
    const { data: items, loading, refetch } = useApi(api.content.getGallery);

    // Modal Hook
    const {
        isOpen: isEditing,
        data: editingItem,
        open: openEdit,
        close: closeEdit
    } = useModal();

    // Form Hook
    const {
        values: formData,
        handleChange,
        reset: resetForm,
        setValues
    } = useForm({
        title: '',
        year: new Date().getFullYear(),
        category: '',
        url: '',
        description: ''
    });

    // File Upload Hook
    const {
        preview,
        handleFileChange: onFileChange,
        fileInputRef
    } = useFileUpload({
        maxSize: 5 * 1024 * 1024,
        acceptedTypes: ['image/*']
    });

    // Confirmation Dialog State
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, action: null, message: '' });
    const openConfirm = (action, message) => setConfirmConfig({ isOpen: true, action, message });
    const closeConfirm = () => setConfirmConfig({ ...confirmConfig, isOpen: false });

    // Update form URL when file preview changes
    useEffect(() => {
        if (preview) {
            setValues(prev => ({ ...prev, url: preview }));
        }
    }, [preview, setValues]);

    // Initialize form when editing
    useEffect(() => {
        if (editingItem && !editingItem.isNew) {
            setValues(editingItem);
        } else if (editingItem && editingItem.isNew) {
            resetForm();
        }
    }, [editingItem, setValues, resetForm]);

    const handleSave = async () => {
        let newItems;
        // Ensure items is an array
        const currentItems = items || [];

        if (editingItem && !editingItem.isNew) {
            newItems = currentItems.map(item => item.id === editingItem.id ? { ...formData, id: item.id } : item);
        } else {
            newItems = [{ ...formData, id: Date.now() }, ...currentItems];
        }

        try {
            await api.content.saveGallery(newItems);
            refetch(); // Reload data
            closeEdit();
            resetForm();
        } catch (err) {
            console.error("Failed to save gallery", err);
            showError('No se pudo guardar la galería.', 'Error al guardar');
        }
    };

    const handleDelete = async (id) => {
        openConfirm(async () => {
            const currentItems = items || [];
            const newItems = currentItems.filter(item => item.id !== id);
            try {
                await api.content.saveGallery(newItems);
                refetch();
            } catch (err) {
                console.error("Failed to delete item", err);
            }
            closeConfirm();
        }, '¿Estás seguro de eliminar esta imagen?');
    };

    const startAdd = () => {
        resetForm();
        openEdit({ isNew: true });
    };

    if (loading) return <LoadingSpinner text="Cargando galería..." className="py-12" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Gestión de Galería</h3>
                {!isEditing && (
                    <Button onClick={startAdd} className="bg-blue-600 text-white flex items-center gap-2">
                        <Plus size={18} /> Nueva Foto
                    </Button>
                )}
            </div>

            {isEditing && (
                <Modal
                    isOpen={isEditing}
                    onClose={closeEdit}
                    title={editingItem?.isNew ? 'Agregar Nueva Foto' : 'Editar Foto'}
                    size="lg"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField
                            label="Título"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Ej. Ceremonia de Clausura"
                        />

                        <FormField
                            label="Año"
                            name="year"
                            type="select"
                            value={formData.year}
                            onChange={handleChange}
                            options={[2026, 2025, 2024, 2023, 2022].map(y => ({ value: y, label: y }))}
                        />

                        <div>
                            <FormField
                                label="Categoría (Álbum)"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="Ej. Conferencias, Social, Talleres"
                                list="categories-list"
                            />
                            <datalist id="categories-list">
                                {[...new Set((items || []).map(item => item.category))].map(cat => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
                            <div className="flex gap-4 items-start">
                                <div className="flex-1 space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            name="url"
                                            type="text"
                                            value={formData.url}
                                            onChange={handleChange}
                                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            placeholder="URL de la imagen o subir archivo..."
                                        />
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={onFileChange}
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="whitespace-nowrap"
                                        >
                                            <ImageIcon size={18} className="mr-2" /> Subir
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500">Puedes pegar una URL externa o subir una imagen local.</p>
                                </div>
                                {formData.url && (
                                    <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden shrink-0">
                                        <img src={formData.url} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <FormField
                                label="Descripción"
                                name="description"
                                type="textarea"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Breve descripción de la foto..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={closeEdit}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-blue-600 text-white flex items-center gap-2">
                            <Save size={18} /> Guardar
                        </Button>
                    </div>
                </Modal>
            )}

            <ConfirmDialog
                isOpen={confirmConfig.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmConfig.action}
                message={confirmConfig.message}
                title="Confirmar eliminación"
                variant="danger"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {!items || items.length === 0 ? (
                    <EmptyState
                        icon={ImageIcon}
                        title="Galería vacía"
                        description="No hay imágenes en la galería aún."
                    />
                ) : (
                    items.map(item => (
                        <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex gap-4 group hover:shadow-md transition-shadow">
                            <img src={item.url} alt={item.title} className="w-24 h-24 object-cover rounded-lg bg-gray-100" />
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{item.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{item.year}</span>
                                        <span className="text-xs text-gray-500">{item.category}</span>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(item)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GalleryManager;
