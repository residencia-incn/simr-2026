import React, { useState } from 'react';
import { Plus, Trash2, Edit2, User, Upload, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useApi, useModal } from '../../hooks';
import { Button, Modal, FormField, ConfirmDialog, LoadingSpinner, EmptyState } from '../ui';

const CommitteeManager = () => {
    // Use custom hook for API data loading
    const { data: groups, loading, refetch } = useApi(api.committee.getAll);

    const [activeGroup, setActiveGroup] = useState(null);
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [newGroupTitle, setNewGroupTitle] = useState('');
    const [editingGroupTitle, setEditingGroupTitle] = useState({ id: null, title: '' });

    // Use custom hook for modal management
    const {
        isOpen: isEditingMember,
        data: editingMember,
        open: openEditMember,
        close: closeEditMember,
        updateData: setEditingMember
    } = useModal();

    // Confirmation Dialog State
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, action: null, message: '' });
    const openConfirm = (action, message) => setConfirmConfig({ isOpen: true, action, message });
    const closeConfirm = () => setConfirmConfig({ ...confirmConfig, isOpen: false });

    const saveGroups = async (newGroups) => {
        await api.committee.save(newGroups);
        refetch(); // Reload data after save
    };

    const startEditingTitle = (group) => {
        setEditingGroupTitle({ id: group.id, title: group.title });
    };

    const saveGroupTitle = () => {
        if (!editingGroupTitle.title.trim()) return;
        const newGroups = (groups || []).map(g =>
            g.id === editingGroupTitle.id ? { ...g, title: editingGroupTitle.title } : g
        );
        saveGroups(newGroups);
        setEditingGroupTitle({ id: null, title: '' });
    };

    const cancelEditingTitle = () => {
        setEditingGroupTitle({ id: null, title: '' });
    };

    const handleAddGroup = () => {
        if (!newGroupTitle.trim()) return;
        const newGroup = {
            id: Date.now().toString(),
            title: newGroupTitle,
            members: []
        };
        saveGroups([...(groups || []), newGroup]);
        setNewGroupTitle('');
        setIsAddingGroup(false);
    };

    const handleDeleteGroup = (groupId) => {
        openConfirm(() => {
            saveGroups((groups || []).filter(g => g.id !== groupId));
            if (activeGroup === groupId) setActiveGroup(null);
            closeConfirm();
        }, '¿Eliminar esta comisión y sus miembros?');
    };

    const handleAddMember = (groupId) => {
        openEditMember({ groupId, id: Date.now().toString(), name: '', role: '', image: null, isNew: true });
    };

    const handleSaveMember = () => {
        const { groupId, isNew, ...memberData } = editingMember;
        const newGroups = (groups || []).map(g => {
            if (g.id === groupId) {
                let newMembers;
                if (isNew) {
                    newMembers = [...g.members, memberData];
                } else {
                    newMembers = g.members.map(m => m.id === memberData.id ? memberData : m);
                }
                return { ...g, members: newMembers };
            }
            return g;
        });
        saveGroups(newGroups);
        closeEditMember();
    };

    const handleDeleteMember = (groupId, memberId) => {
        openConfirm(() => {
            const newGroups = (groups || []).map(g => {
                if (g.id === groupId) {
                    return { ...g, members: g.members.filter(m => m.id !== memberId) };
                }
                return g;
            });
            saveGroups(newGroups);
            closeConfirm();
        }, '¿Eliminar miembro?');
    };

    const [isUploading, setIsUploading] = useState(false);

    // ... existing saveGroups ...

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsUploading(true);
            try {
                // Simulate Cloud Upload
                const reader = new FileReader();
                reader.onloadend = async () => {
                    // Simulate network delay
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    // In a real app, here we would receive the URL from the cloud service
                    // For now, we use the Base64 as our "Cloud URL"
                    setEditingMember({ ...editingMember, image: reader.result });
                    setIsUploading(false);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Upload failed", error);
                setIsUploading(false);
            }
        }
    };

    if (loading) return <LoadingSpinner text="Cargando comité..." className="py-12" />;

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users size={20} className="text-blue-600" />
                    Gestión del Comité
                </h3>
                <Button onClick={() => setIsAddingGroup(true)} size="sm">
                    <Plus size={16} className="mr-1" /> Nueva Comisión
                </Button>
            </div>

            {isAddingGroup && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl flex gap-2 animate-fadeIn">
                    <input
                        type="text"
                        placeholder="Nombre de la Comisión (ej. Comité Científico)"
                        className="flex-1 p-2 border rounded-lg"
                        value={newGroupTitle}
                        onChange={(e) => setNewGroupTitle(e.target.value)}
                        autoFocus
                    />
                    <Button onClick={handleAddGroup}>Crear</Button>
                    <Button variant="ghost" onClick={() => setIsAddingGroup(false)}>Cancelar</Button>
                </div>
            )}

            <div className="space-y-8 overflow-auto custom-scrollbar pb-10">
                {!groups || groups.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No hay comisiones"
                        description="Crea una comisión para empezar a agregar miembros."
                    />
                ) : (
                    groups.map((group, index) => (
                        <div key={group.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                                {editingGroupTitle.id === group.id ? (
                                    <div className="flex items-center gap-2 flex-1 mr-4">
                                        <input
                                            className="border rounded px-2 py-1 flex-1 text-sm text-gray-800"
                                            value={editingGroupTitle.title}
                                            onChange={e => setEditingGroupTitle({ ...editingGroupTitle, title: e.target.value })}
                                            autoFocus
                                        />
                                        <Button size="xs" onClick={saveGroupTitle}>Guardar</Button>
                                        <Button size="xs" variant="ghost" onClick={cancelEditingTitle}>Cancelar</Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-800">{group.title}</h4>
                                        <button onClick={() => startEditingTitle(group)} className="text-gray-400 hover:text-blue-600">
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                )}

                                {!group.isLocked && editingGroupTitle.id !== group.id && (
                                    <button onClick={() => handleDeleteGroup(group.id)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div className={`p-4 grid gap-4 ${index === 0 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                                {group.members.map(member => (
                                    <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors group relative">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                            {member.image ? (
                                                <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-full h-full p-2 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="font-bold text-sm text-gray-900">{member.name}</div>
                                            <div className="text-xs text-gray-500">{member.role}</div>
                                        </div>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded shadow-sm">
                                            <button onClick={() => openEditMember({ ...member, groupId: group.id })} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDeleteMember(group.id, member.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => handleAddMember(group.id)}
                                    className="flex flex-col items-center justify-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all h-[80px]"
                                >
                                    <Plus size={20} />
                                    <span className="text-xs font-medium">Agregar Miembro</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isEditingMember && (
                <Modal
                    isOpen={isEditingMember}
                    onClose={closeEditMember}
                    title={editingMember.isNew ? 'Nuevo Miembro' : 'Editar Miembro'}
                    size="md"
                >
                    <div className="space-y-4">
                        <div className="flex justify-center mb-6">
                            <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 group cursor-pointer hover:border-blue-500 transition-colors">
                                {isUploading ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
                                        <LoadingSpinner size="sm" />
                                        <span className="text-xs text-gray-500 mt-1">Subiendo...</span>
                                    </div>
                                ) : editingMember.image ? (
                                    <img src={editingMember.image} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-full h-full p-8 text-gray-300" />
                                )}

                                {!isUploading && (
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Upload className="text-white" size={24} />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                            </div>
                        </div>

                        <FormField
                            label="Nombre Completo"
                            value={editingMember.name}
                            onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                            placeholder="Ej. Dr. Juan Pérez"
                        />

                        <FormField
                            label="Cargo / Especialidad"
                            value={editingMember.role}
                            onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                            placeholder="Ej. R2 Neurología"
                        />

                        <div className="flex gap-3 pt-4">
                            <Button variant="ghost" onClick={closeEditMember} className="flex-1">Cancelar</Button>
                            <Button onClick={handleSaveMember} className="flex-1">Guardar</Button>
                        </div>
                    </div>
                </Modal>
            )}

            <ConfirmDialog
                isOpen={confirmConfig.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmConfig.action}
                message={confirmConfig.message}
                title="Confirmar eliminación"
            />
        </div>
    );
};

export default CommitteeManager;
