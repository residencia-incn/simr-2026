import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { api } from '../../services/api';

const ManageRoomsModal = ({ isOpen, onClose, onConfirm, initialLocation, initialVirtualLocation }) => {
    const [activeTab, setActiveTab] = useState('physical'); // 'physical' | 'virtual'
    const [rooms, setRooms] = useState({ physical: [], virtual: [] });
    const [selectedPhysical, setSelectedPhysical] = useState(initialLocation || '');
    const [selectedVirtual, setSelectedVirtual] = useState(initialVirtualLocation || '');
    const [isLoading, setIsLoading] = useState(true);
    const [editingRoom, setEditingRoom] = useState(null); // null | { id, name, type }
    const [newRoomName, setNewRoomName] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadRooms();
            setSelectedPhysical(initialLocation || '');
            setSelectedVirtual(initialVirtualLocation || '');
        }
    }, [isOpen, initialLocation, initialVirtualLocation]);

    const loadRooms = async () => {
        setIsLoading(true);
        try {
            const config = await api.academic.getConfig();
            if (config && config.rooms) {
                setRooms(config.rooms);
            } else {
                // Initialize if missing
                setRooms({ physical: [], virtual: [] });
            }
        } catch (error) {
            console.error("Error loading rooms:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveRooms = async (updatedRooms) => {
        try {
            const config = await api.academic.getConfig();
            const newConfig = { ...config, rooms: updatedRooms };
            await api.academic.saveConfig(newConfig);
            setRooms(updatedRooms);
        } catch (error) {
            console.error("Error saving rooms:", error);
        }
    };

    const handleAddRoom = () => {
        if (!newRoomName.trim()) return;
        const newRoom = { id: `${activeTab === 'physical' ? 'r' : 'v'}-${Date.now()}`, name: newRoomName.trim() };
        const updatedRooms = {
            ...rooms,
            [activeTab]: [...rooms[activeTab], newRoom]
        };
        handleSaveRooms(updatedRooms);
        setNewRoomName('');
    };

    const handleDeleteRoom = (roomId) => {
        if (!window.confirm('¿Estás seguro de eliminar esta sala?')) return;
        const updatedRooms = {
            ...rooms,
            [activeTab]: rooms[activeTab].filter(r => r.id !== roomId)
        };
        handleSaveRooms(updatedRooms);
        // Clear selection if deleted
        if (activeTab === 'physical' && selectedPhysical === rooms[activeTab].find(r => r.id === roomId)?.name) {
            setSelectedPhysical('');
        }
        if (activeTab === 'virtual' && selectedVirtual === rooms[activeTab].find(r => r.id === roomId)?.name) {
            setSelectedVirtual('');
        }
    };

    const handleStartEdit = (room) => {
        setEditingRoom({ ...room, type: activeTab });
        setNewRoomName(room.name);
    };

    const handleUpdateRoom = () => {
        if (!editingRoom || !newRoomName.trim()) return;
        const updatedRooms = {
            ...rooms,
            [activeTab]: rooms[activeTab].map(r => r.id === editingRoom.id ? { ...r, name: newRoomName.trim() } : r)
        };

        // Update selection if name changed
        if (activeTab === 'physical' && selectedPhysical === editingRoom.name) {
            setSelectedPhysical(newRoomName.trim());
        }
        if (activeTab === 'virtual' && selectedVirtual === editingRoom.name) {
            setSelectedVirtual(newRoomName.trim());
        }

        handleSaveRooms(updatedRooms);
        setEditingRoom(null);
        setNewRoomName('');
    };

    const handleCancelEdit = () => {
        setEditingRoom(null);
        setNewRoomName('');
    };

    const handleConfirm = () => {
        onConfirm({
            physical: selectedPhysical,
            virtual: selectedVirtual
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">meeting_room</span>
                        Gestión de Salas y Auditorios
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <span className="material-symbols-outlined text-[24px]">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => { setActiveTab('physical'); handleCancelEdit(); }}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'physical' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">apartment</span>
                                Auditorios (Presencial)
                            </div>
                        </button>
                        <button
                            onClick={() => { setActiveTab('virtual'); handleCancelEdit(); }}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'virtual' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">videocam</span>
                                Salas Virtuales
                            </div>
                        </button>
                    </div>

                    {/* Room List & Actions */}
                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                {editingRoom ? 'Editar Nombre' : 'Agregar Nueva Sala'}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    placeholder={activeTab === 'physical' ? "Ej. Auditorio Principal" : "Ej. Sala Zoom 1"}
                                    className="flex-1 rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-700 dark:text-white"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') editingRoom ? handleUpdateRoom() : handleAddRoom();
                                    }}
                                />
                                {editingRoom ? (
                                    <>
                                        <Button onClick={handleUpdateRoom} disabled={!newRoomName.trim()} variant="solid" className="bg-green-600 hover:bg-green-700">
                                            Actualizar
                                        </Button>
                                        <Button onClick={handleCancelEdit} variant="outline">
                                            Cancelar
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={handleAddRoom} disabled={!newRoomName.trim()} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900">
                                        Agregar
                                    </Button>
                                )}
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                    Seleccionar {activeTab === 'physical' ? 'Auditorio' : 'Sala Virtual'}
                                </h3>

                                <div className="space-y-2">
                                    {/* Option: None */}
                                    <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${(activeTab === 'physical' ? selectedPhysical : selectedVirtual) === ''
                                            ? 'bg-primary-50 border-primary ring-1 ring-primary dark:bg-primary-900/20 dark:border-primary-800'
                                            : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700'
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="roomSelection"
                                                checked={(activeTab === 'physical' ? selectedPhysical : selectedVirtual) === ''}
                                                onChange={() => activeTab === 'physical' ? setSelectedPhysical('') : setSelectedVirtual('')}
                                                className="h-4 w-4 text-primary border-slate-300 focus:ring-primary"
                                            />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Sin asignar
                                            </span>
                                        </div>
                                    </label>

                                    {/* List Rooms */}
                                    {rooms[activeTab].map(room => (
                                        <div
                                            key={room.id}
                                            className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${(activeTab === 'physical' ? selectedPhysical : selectedVirtual) === room.name
                                                    ? 'bg-primary-50 border-primary ring-1 ring-primary z-10 dark:bg-primary-900/20 dark:border-primary-800'
                                                    : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            <label className="flex flex-1 items-center gap-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="roomSelection"
                                                    checked={(activeTab === 'physical' ? selectedPhysical : selectedVirtual) === room.name}
                                                    onChange={() => activeTab === 'physical' ? setSelectedPhysical(room.name) : setSelectedVirtual(room.name)}
                                                    className="h-4 w-4 text-primary border-slate-300 focus:ring-primary"
                                                />
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {room.name}
                                                </span>
                                            </label>
                                            <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleStartEdit(room)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRoom(room.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {rooms[activeTab].length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        No hay salas registradas. Añade una arriba.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center rounded-b-xl">
                    <div className="flex flex-col text-xs text-slate-500">
                        <span><strong className="text-slate-700 dark:text-slate-300">Auditorio:</strong> {selectedPhysical || 'Sin asignar'}</span>
                        <span><strong className="text-slate-700 dark:text-slate-300">Sala Virtual:</strong> {selectedVirtual || 'Sin asignar'}</span>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleConfirm} className="bg-primary hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                            Confirmar Selección
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageRoomsModal;
