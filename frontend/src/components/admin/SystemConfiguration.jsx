import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Palette, Calendar, Settings, AlertTriangle, X, Plus } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CarouselManager from './CarouselManager';
import ConfirmDialog from '../ui/ConfirmDialog';
import { api } from '../../services/api';

const SystemConfiguration = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Dialog states
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [showNewYearConfirm, setShowNewYearConfirm] = useState(false);

    // Subspecialty state
    const [newSpecialty, setNewSpecialty] = useState("");

    useEffect(() => {
        const loadConfig = async () => {
            const data = await api.content.getConfig();
            setConfig({
                eventName: data.eventName || "Simposio Internacional de Medicina y Residencia",
                eventYear: data.eventYear || "2026",
                startDate: data.startDate,
                theme: "blue", // This is local UI state for now, or could be in config
                showHeroCountdown: data.showHeroCountdown,
                specialties: data.specialties || []
            });
            setLoading(false);
        };
        loadConfig();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        await api.content.saveConfig({
            ...config
        });
        setIsSaving(false);
        alert("Configuración guardada correctamente");
    };

    const handleArchive = async () => {
        // Mock archive logic
        alert(`Evento ${config.eventYear} archivado exitosamente.`);
        setShowArchiveConfirm(false);
    };

    const handleNewYear = async () => {
        // Mock new year logic
        const nextYear = parseInt(config.eventYear) + 1;
        setConfig(prev => ({ ...prev, eventYear: nextYear.toString() }));
        alert(`Sistema reiniciado para el año ${nextYear}.`);
        setShowNewYearConfirm(false);
    };

    if (loading || !config) return <div>Cargando configuración...</div>;

    const themes = [
        { id: 'blue', name: 'Azul Institucional (Default)', color: 'bg-blue-600' },
        { id: 'red', name: 'Rojo Pasión', color: 'bg-red-600' },
        { id: 'emerald', name: 'Esmeralda', color: 'bg-emerald-600' },
        { id: 'purple', name: 'Violeta', color: 'bg-purple-600' },
    ];



    const handleAddSpecialty = () => {
        if (newSpecialty.trim() && !config.specialties.includes(newSpecialty.trim())) {
            setConfig({ ...config, specialties: [...config.specialties, newSpecialty.trim()] });
            setNewSpecialty("");
        }
    };

    const handleRemoveSpecialty = (spec) => {
        setConfig({ ...config, specialties: config.specialties.filter(s => s !== spec) });
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Configuración del Sistema</h3>
                    <p className="text-sm text-gray-500">Administra los parámetros generales, apariencia y ciclo de vida del evento.</p>
                </div>
                <Button onClick={handleSave} className="bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2 shadow-sm">
                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    Guardar Cambios
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* General Settings */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2">
                            <Settings size={20} className="text-gray-500" />
                            Parámetros Generales
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Evento</label>
                                <input
                                    type="text"
                                    value={config.eventName}
                                    onChange={(e) => setConfig({ ...config, eventName: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <input
                                    type="checkbox"
                                    id="showCountdown"
                                    checked={config.showHeroCountdown}
                                    onChange={(e) => setConfig({ ...config, showHeroCountdown: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="showCountdown" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                                    Mostrar Contador de Cuenta Regresiva en Hero
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Año del Evento</label>
                                    <input
                                        type="text"
                                        value={config.eventYear}
                                        onChange={(e) => setConfig({ ...config, eventYear: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                                    <input
                                        type="datetime-local"
                                        value={config.startDate}
                                        onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2">
                            <Settings size={20} className="text-gray-500" />
                            Gestión de Subespecialidades
                        </h4>
                        <p className="text-sm text-gray-500 mb-4">Define las subespecialidades disponibles para la clasificación de trabajos de investigación.</p>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newSpecialty}
                                onChange={(e) => setNewSpecialty(e.target.value)}
                                placeholder="Nueva subespecialidad..."
                                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSpecialty()}
                            />
                            <Button onClick={handleAddSpecialty} disabled={!newSpecialty.trim()} size="sm">
                                <Plus size={16} /> Agregar
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {config.specialties?.map((spec, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                    {spec}
                                    <button onClick={() => handleRemoveSpecialty(spec)} className="hover:text-red-500 transition-colors">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            {(!config.specialties || config.specialties.length === 0) && (
                                <span className="text-gray-400 text-xs italic">No hay subespecialidades definidas.</span>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2">
                            <Palette size={20} className="text-gray-500" />
                            Apariencia y Tema
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {themes.map(theme => (
                                <div
                                    key={theme.id}
                                    onClick={() => setConfig({ ...config, theme: theme.id })}
                                    className={`cursor-pointer border-2 rounded-xl p-3 flex items-center gap-3 transition-all ${config.theme === theme.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className={`w-10 h-10 rounded-full ${theme.color} shadow-sm`}></div>
                                    <span className={`font-medium ${config.theme === theme.id ? 'text-blue-900' : 'text-gray-600'}`}>{theme.name}</span>
                                    {config.theme === theme.id && <div className="ml-auto text-blue-600"><Save size={16} /></div>}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Carousel Manager */}
                    <CarouselManager />
                </div>

                {/* System Lifecycle */}
                <div className="space-y-6">
                    <Card className="p-6 border-l-4 border-l-yellow-500">
                        <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2">
                            <Calendar size={20} className="text-gray-500" />
                            Ciclo de Vida
                        </h4>
                        <div className="space-y-4">
                            <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800 mb-4">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                    <p>Aperturar un nuevo año archivará automáticamente toda la data del evento actual (asistentes, trabajos, notas) y reiniciará el sistema para el {parseInt(config.eventYear) + 1}.</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                                onClick={() => setShowArchiveConfirm(true)}
                            >
                                Archivar Evento {config.eventYear}
                            </Button>
                            <Button
                                className="w-full bg-gray-900 hover:bg-black text-white shadow-lg"
                                onClick={() => setShowNewYearConfirm(true)}
                            >
                                Aperturar Año {parseInt(config.eventYear) + 1}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showArchiveConfirm}
                onClose={() => setShowArchiveConfirm(false)}
                onConfirm={handleArchive}
                title="¿Archivar Evento?"
                message={`Está a punto de archivar el evento del año ${config.eventYear}. Esta acción guardará una copia de seguridad y limpiará la base de datos activa. ¿Desea continuar?`}
                confirmText="Archivar"
            />

            <ConfirmDialog
                isOpen={showNewYearConfirm}
                onClose={() => setShowNewYearConfirm(false)}
                onConfirm={handleNewYear}
                title="¿Aperturar Nuevo Año?"
                message={`Está a punto de iniciar el ciclo para el año ${parseInt(config.eventYear) + 1}. Esto actualizará la configuración global y reiniciará los contadores. ¿Está seguro?`}
                confirmText="Iniciar Nuevo Año"
            />
        </div>
    );
};

export default SystemConfiguration;
