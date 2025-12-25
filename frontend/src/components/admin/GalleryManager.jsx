import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, Save } from 'lucide-react';
import { Button, Modal, FormField, ConfirmDialog, LoadingSpinner, EmptyState } from '../ui';
import { api } from '../../services/api';
import { useApi, useModal, useForm, useFileUpload } from '../../hooks';
import { showError } from '../../utils/alerts';
import AdminPhotoGrid from './gallery/AdminPhotoGrid';
import AdminAlbumList from './gallery/AdminAlbumList';
import MediaUploadModal from './gallery/MediaUploadModal';
import FilterDrawer from './gallery/FilterDrawer';

const GalleryManager = () => {
    // Hooks
    const { data: items, loading, refetch } = useApi(api.content.getGallery);
    const [view, setView] = useState('grid'); // 'grid' | 'albums'
    const [selectedAlbum, setSelectedAlbum] = useState(null);

    // UI State
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Filter State
    const [availableYears, setAvailableYears] = useState([2024, 2023, 2022, 2021]);
    const [activeFilters, setActiveFilters] = useState({
        sortOrder: 'desc',
        sortBy: 'date',
        year: '2024',
        categories: ['pre-congress', 'day-1', 'day-2'],
        tags: []
    });

    // Edit State (Legacy Form)
    const {
        isOpen: isEditing,
        open: openEdit,
        close: closeEdit,
        data: editingItem
    } = useModal();

    const {
        values: formData,
        handleChange,
        setValues: setFormData,
        reset
    } = useForm({
        title: '',
        year: new Date().getFullYear(),
        category: '',
        description: '',
        url: ''
    });

    const {
        file,
        uploading,
        handleFileChange,
        uploadFile,
        setFile: setUploadFile,
        fileInputRef
    } = useFileUpload();

    // Effects
    useEffect(() => {
        if (editingItem) {
            setFormData({
                title: editingItem.title || '',
                year: editingItem.year || new Date().getFullYear(),
                category: editingItem.category || '',
                description: editingItem.description || '',
                url: editingItem.url || ''
            });
        } else {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingItem]);

    const handleYearChange = (year) => {
        setActiveFilters(prev => ({ ...prev, year: year.toString() }));
    };

    const handleAddYear = () => {
        // Simple logic: Add the next logical year based on the max existing year
        const maxYear = Math.max(...availableYears);
        const newYear = maxYear + 1;
        setAvailableYears([newYear, ...availableYears]);
        handleYearChange(newYear);
    };

    const getFilteredItems = () => {
        if (!items) return [];

        let filtered = [...items];

        // 1. Filter by Year
        if (activeFilters.year !== 'all') {
            filtered = filtered.filter(item => item.year === parseInt(activeFilters.year));
        }

        // 2. Filter by Categories
        if (activeFilters.categories && activeFilters.categories.length > 0) {
            filtered = filtered.filter(item => {
                if (!item.category) return false;
                const itemCat = item.category.toLowerCase().replace(' ', '-');
                return activeFilters.categories.includes(itemCat);
            });
        }

        // 3. Filter by Tags
        if (activeFilters.tags && activeFilters.tags.length > 0) {
            filtered = filtered.filter(item => {
                if (!item.tags) return true;
                return activeFilters.tags.some(tag => item.tags.includes(tag));
            });
        }

        // 4. Sorting
        filtered.sort((a, b) => {
            let valA, valB;

            switch (activeFilters.sortBy) {
                case 'date':
                    valA = new Date(a.date || 0).getTime();
                    valB = new Date(b.date || 0).getTime();
                    break;
                case 'event_date':
                    valA = new Date(a.eventDate || a.date || 0).getTime();
                    valB = new Date(b.eventDate || b.date || 0).getTime();
                    break;
                case 'title':
                    valA = (a.title || '').toLowerCase();
                    valB = (b.title || '').toLowerCase();
                    break;
                case 'popularity':
                    valA = a.views || 0;
                    valB = b.views || 0;
                    break;
                default:
                    valA = new Date(a.date || 0).getTime();
                    valB = new Date(b.date || 0).getTime();
            }

            if (activeFilters.sortOrder === 'asc') {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });

        return filtered;
    };

    const filteredItems = getFilteredItems();

    const handleSave = async (data) => {
        let payload = data || formData;

        // Handle File Upload if coming from MediaUploadModal with a File object
        if (data && data.file) {
            try {
                const uploadedUrl = await api.upload.image(data.file);
                payload = {
                    ...payload,
                    url: uploadedUrl,
                    type: data.type || 'image', // Ensure type is set
                };

                // Remove the file object before saving to gallery config
                delete payload.file;
                delete payload.preview;
            } catch (error) {
                console.error("Upload failed", error);
                showError('Error al subir el archivo', 'Intente nuevamente');
                return;
            }
        }

        let newItems;
        const currentItems = items || [];

        if (editingItem && !editingItem.isNew) {
            newItems = currentItems.map(item => item.id === editingItem.id ? { ...payload, id: item.id } : item);
        } else {
            // Create new item
            const newItem = {
                ...payload,
                id: Date.now(),
                // Ensure required fields
                year: parseInt(payload.year) || new Date().getFullYear(),
                likes: 0,
                views: 0
            };
            newItems = [newItem, ...currentItems];
        }

        try {
            await api.content.saveGallery(newItems);
            refetch(); // Reload data
            closeEdit();
            setIsUploadOpen(false); // Close upload modal if open
            reset();
        } catch (err) {
            console.error("Failed to save gallery", err);
            showError('No se pudo guardar la galería.', 'Error al guardar');
        }
    };

    const {
        isOpen: isConfirmOpen,
        open: openConfirm,
        close: closeConfirm,
        data: confirmData
    } = useModal();

    const handleDelete = async (id) => {
        openConfirm({
            message: '¿Estás seguro de eliminar esta imagen?',
            action: async () => {
                const currentItems = items || [];
                const newItems = currentItems.filter(item => item.id !== id);
                try {
                    await api.content.saveGallery(newItems);
                    refetch();
                } catch (err) {
                    console.error("Failed to delete item", err);
                }
                closeConfirm();
            }
        });
    };

    const startAdd = () => {
        setIsUploadOpen(true);
    };

    const handleViewAlbums = () => {
        setView('albums');
        setSelectedAlbum(null);
    };

    const handleSelectAlbum = (album) => {
        setSelectedAlbum(album);
        setView('grid');
    };

    const onFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileChange(e);
            // Auto upload for preview
            try {
                const url = await api.upload.image(file);
                setFormData(prev => ({ ...prev, url }));
            } catch (err) {
                console.error(err);
            }
        }
    };

    if (loading) return <LoadingSpinner text="Cargando galería..." className="py-12" />;

    return (
        <div className="h-full bg-[#0e101b] rounded-xl overflow-hidden shadow-2xl border border-gray-800">
            {view === 'grid' && (
                <AdminPhotoGrid
                    items={filteredItems}
                    selectedYear={parseInt(activeFilters.year)}
                    years={availableYears}
                    onYearChange={handleYearChange}
                    onAddYear={handleAddYear}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onUpload={startAdd}
                    onViewAlbums={handleViewAlbums}
                    onOpenFilters={() => setIsFilterOpen(true)}
                />
            )}

            {view === 'albums' && (
                <AdminAlbumList
                    onSelectAlbum={handleSelectAlbum}
                    onCreateAlbum={() => console.log("Create album clicked")}
                />
            )}

            <MediaUploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onSave={handleSave}
            />

            <FilterDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={(filters) => {
                    setActiveFilters(filters);
                    setIsFilterOpen(false);
                }}
                initialFilters={activeFilters}
            />

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
                                            disabled={uploading}
                                        >
                                            <ImageIcon size={18} className="mr-2" /> {uploading ? 'Subiendo...' : 'Subir'}
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
                isOpen={isConfirmOpen}
                onClose={closeConfirm}
                onConfirm={confirmData?.action}
                message={confirmData?.message || ''}
                title="Confirmar eliminación"
                variant="danger"
            />
        </div>
    );
};

export default GalleryManager;
