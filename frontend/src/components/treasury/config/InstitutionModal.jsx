import React, { useState, useEffect } from 'react';
import { Modal, FormField, Button } from '../../ui';
import { api } from '../../../services/api';
import { Building, Link, Type, Code, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';

const InstitutionModal = ({ isOpen, onClose, institutionToEdit, onSaveSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        short_name: '',
        code: '',
        type: 'bank',
        logo_url: ''
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const isEditMode = institutionToEdit && institutionToEdit.id;

    useEffect(() => {
        if (institutionToEdit) {
            setFormData({
                name: institutionToEdit.name || '',
                short_name: institutionToEdit.short_name || '',
                code: institutionToEdit.code || '',
                type: institutionToEdit.type || 'bank',
                logo_url: institutionToEdit.logo_url || ''
            });
        } else {
            setFormData({
                name: '',
                short_name: '',
                code: '',
                type: 'bank',
                logo_url: ''
            });
        }
        setError(null);
    }, [institutionToEdit, isOpen]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        try {
            const result = await api.treasuryConfig.uploadInstitutionLogo(file);
            setFormData(prev => ({ ...prev, logo_url: result.url }));
        } catch (err) {
            console.error('Error uploading logo:', err);
            setError("Error al subir el logo. Intente nuevamente.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEditMode) {
                await api.treasuryConfig.updateInstitution(institutionToEdit.id, formData);
            } else {
                await api.treasuryConfig.createInstitution(formData);
            }
            onSaveSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving institution:', err);
            // Ensure error is a string to prevent "Objects are not valid as a React child" crash
            const errorMsg = err.response?.data?.detail
                ? (typeof err.response.data.detail === 'object'
                    ? JSON.stringify(err.response.data.detail)
                    : err.response.data.detail)
                : (err.message || 'Error al guardar la institución');
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Editar Institución' : 'Nueva Institución Financiera'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <FormField
                    label="Nombre Completo"
                    icon={Building}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Banco de Crédito del Perú"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Nombre Corto (Alias)"
                        icon={Type}
                        value={formData.short_name}
                        onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                        placeholder="Ej. BCP"
                    />
                    <FormField
                        label="Código Interno"
                        icon={Code}
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="Ej. 002"
                    />
                </div>

                <FormField
                    label="Tipo de Entidad"
                    type="select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    options={[
                        { value: 'bank', label: 'Banco' },
                        { value: 'wallet', label: 'Billetera Digital' }
                    ]}
                    required
                />

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Logo de la Institución</label>
                    <div className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50 border-dashed border-gray-300">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer bg-white px-3 py-2 border rounded-md shadow-sm hover:bg-gray-50 flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors">
                                    <Upload size={16} />
                                    {uploading ? 'Subiendo...' : 'Subir Imagen'}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                    />
                                </label>
                                <span className="text-xs text-gray-500">
                                    {formData.logo_url ? 'Imagen cargada' : 'No se ha seleccionado archivo'}
                                </span>
                            </div>

                            {/* Fallback URL input */}
                            <div className="relative">
                                <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.logo_url}
                                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                    className="w-full text-xs pl-8 pr-2 py-1.5 border rounded bg-white text-gray-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    placeholder="O pega una URL directa..."
                                />
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="w-16 h-16 bg-white rounded-lg border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {formData.logo_url ? (
                                <img
                                    src={formData.logo_url}
                                    alt="Preview"
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            ) : (
                                <ImageIcon className="text-gray-300" size={24} />
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading || uploading} className="bg-blue-600 text-white">
                        {loading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Institución'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default InstitutionModal;
