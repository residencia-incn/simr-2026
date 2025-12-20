import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Palette, Calendar, Settings, AlertTriangle, X, Plus, DollarSign, Clock, Layout, List, Printer, HardDrive } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CarouselManager from './CarouselManager';
import PrintSettingsManager from './PrintSettingsManager';
import ConfirmDialog from '../ui/ConfirmDialog';
import { api } from '../../services/api';
import { showSuccess } from '../../utils/alerts';

const SystemConfiguration = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState('general');

    const TABS = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'content', label: 'Contenido', icon: Layout },
        { id: 'lists', label: 'Listas', icon: List },
        { id: 'pricing', label: 'Tarifas', icon: DollarSign },
        { id: 'print', label: 'Impresión', icon: Printer },
        { id: 'system', label: 'Sistema', icon: HardDrive }
    ];

    // Dialog states
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [showNewYearConfirm, setShowNewYearConfirm] = useState(false);

    // Subspecialty state
    const [newSpecialty, setNewSpecialty] = useState("");
    const [newOccupation, setNewOccupation] = useState("");
    const [newParticipantSpecialty, setNewParticipantSpecialty] = useState("");
    const [newResidencyYear, setNewResidencyYear] = useState("");
    const [newRole, setNewRole] = useState("");

    useEffect(() => {
        const loadConfig = async () => {
            const data = await api.content.getConfig();
            setConfig({
                eventName: data.eventName || "Simposio Internacional de Medicina y Residencia",
                eventYear: data.eventYear || "2026",
                startDate: data.startDate,
                theme: "blue", // This is local UI state for now, or could be in config
                showHeroCountdown: data.showHeroCountdown,
                specialties: data.specialties || [],
                occupations: data.occupations || ["Médico Especialista", "Médico General", "Médico Residente", "Estudiante de Medicina", "Otro"],
                roles: data.roles || ["Participante", "Ponente", "Comité Organizador", "Asistente", "Jurado", "Residente"],
                participantSpecialties: data.participantSpecialties || ["Neurología", "Neurocirugía", "Psiquiatría", "Medicina Interna", "Pediatría", "Medicina Intensiva", "Otro"],
                residencyYears: data.residencyYears || ["R1", "R2", "R3", "R4"],
                prices: data.prices || {
                    incn: 50,
                    external_resident: 80,
                    specialist: 120,
                    student: 30,
                    certification: 50
                },
                duration: data.duration || 3,
                schedule: Array.isArray(data.schedule) ? data.schedule : [
                    { day: 1, open: "08:00", close: "18:00" },
                    { day: 2, open: "09:00", close: "18:00" },
                    { day: 3, open: "09:00", close: "13:00" }
                ],
                publicSections: data.publicSections || [
                    { id: 'bases', label: 'Bases', isVisible: true, isDevelopment: false },
                    { id: 'roadmap', label: 'Roadmap', isVisible: true, isDevelopment: false },
                    { id: 'program', label: 'Programa', isVisible: true, isDevelopment: false },
                    { id: 'committee', label: 'Comité', isVisible: true, isDevelopment: false },
                    { id: 'gallery', label: 'Galería', isVisible: true, isDevelopment: false },
                    { id: 'posters', label: 'E-Posters', isVisible: true, isDevelopment: false }
                ]
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
        showSuccess('Los cambios han sido aplicados correctamente.', 'Configuración guardada');
    };

    const handleArchive = async () => {
        // Mock archive logic
        showSuccess('Todos los datos han sido respaldados.', `Evento ${config.eventYear} archivado`);
        setShowArchiveConfirm(false);
    };

    const handleNewYear = async () => {
        // Mock new year logic
        const nextYear = parseInt(config.eventYear) + 1;
        setConfig(prev => ({ ...prev, eventYear: nextYear.toString() }));
        showSuccess('El sistema está listo para el nuevo evento.', `Sistema reiniciado para ${nextYear}`);
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

    const handleAddOccupation = () => {
        if (newOccupation.trim() && !config.occupations.includes(newOccupation.trim())) {
            setConfig({ ...config, occupations: [...config.occupations, newOccupation.trim()] });
            setNewOccupation("");
        }
    };

    const handleRemoveOccupation = (occ) => {
        setConfig({ ...config, occupations: config.occupations.filter(o => o !== occ) });
    };

    const handleAddParticipantSpecialty = () => {
        if (newParticipantSpecialty.trim() && !config.participantSpecialties.includes(newParticipantSpecialty.trim())) {
            setConfig({ ...config, participantSpecialties: [...config.participantSpecialties, newParticipantSpecialty.trim()] });
            setNewParticipantSpecialty("");
        }
    };

    const handleRemoveParticipantSpecialty = (spec) => {
        setConfig({ ...config, participantSpecialties: config.participantSpecialties.filter(s => s !== spec) });
    };

    const handleAddResidencyYear = () => {
        if (newResidencyYear.trim() && !config.residencyYears.includes(newResidencyYear.trim())) {
            setConfig({ ...config, residencyYears: [...config.residencyYears, newResidencyYear.trim()] });
            setNewResidencyYear("");
        }
    };

    const handleRemoveResidencyYear = (year) => {
        setConfig({ ...config, residencyYears: config.residencyYears.filter(y => y !== year) });
    };

    const handleAddRole = () => {
        if (newRole.trim() && !config.roles.includes(newRole.trim())) {
            setConfig({ ...config, roles: [...config.roles, newRole.trim()] });
            setNewRole("");
        }
    };

    const handleRemoveRole = (role) => {
        setConfig({ ...config, roles: config.roles.filter(r => r !== role) });
    };

    const handleDurationChange = (e) => {
        const newDuration = parseInt(e.target.value) || 1;
        let newSchedule = [...config.schedule];

        if (newDuration > newSchedule.length) {
            // Add days
            const daysToAdd = newDuration - newSchedule.length;
            for (let i = 0; i < daysToAdd; i++) {
                newSchedule.push({
                    day: newSchedule.length + 1,
                    open: "08:00",
                    close: "18:00"
                });
            }
        } else if (newDuration < newSchedule.length) {
            // Remove days
            newSchedule = newSchedule.slice(0, newDuration);
        }

        setConfig({ ...config, duration: newDuration, schedule: newSchedule });
    };

    const handleScheduleChange = (index, field, value) => {
        const newSchedule = [...config.schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setConfig({ ...config, schedule: newSchedule });
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h2>
                    <p className="text-sm text-gray-500">Panel de Organización SIMR 2026</p>
                </div>
                <Button onClick={handleSave} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white shadow-lg shadow-blue-700/20 px-6 py-2.5 rounded-xl transition-all">
                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    Guardar Cambios
                </Button>
            </div>

            {/* Navigation Bar */}
            <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                                ${isActive
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                        {/* General Parameters */}
                        <Card className="p-6 h-[500px] flex flex-col">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2 shrink-0">
                                <Settings size={20} className="text-gray-500" />
                                Parámetros Generales
                            </h4>
                            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
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
                                        <select
                                            value={config.eventYear}
                                            onChange={(e) => setConfig({ ...config, eventYear: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        >
                                            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                                        <input
                                            type="date"
                                            value={config.startDate}
                                            onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="col-span-2 mt-2">
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-2 text-sm text-blue-800">
                                            <Calendar size={16} />
                                            <span className="font-semibold">Fechas del Evento:</span>
                                            <span>
                                                {config.startDate ? (() => {
                                                    const start = new Date(config.startDate + 'T00:00:00');
                                                    const days = config.duration || 1;
                                                    const dates = [];
                                                    for (let i = 0; i < days; i++) {
                                                        const d = new Date(start);
                                                        d.setDate(start.getDate() + i);
                                                        dates.push(d);
                                                    }

                                                    const first = dates[0];
                                                    const last = dates[dates.length - 1];
                                                    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

                                                    if (dates.length === 1) {
                                                        return `${first.getDate()} de ${monthNames[first.getMonth()]}`;
                                                    }

                                                    const allSameMonth = dates.every(d => d.getMonth() === first.getMonth());

                                                    if (allSameMonth) {
                                                        const dayNums = dates.map(d => d.getDate());
                                                        const lastDay = dayNums.pop();
                                                        return `${dayNums.join(', ')} y ${lastDay} de ${monthNames[first.getMonth()]}`;
                                                    } else {
                                                        return `${first.getDate()} de ${monthNames[first.getMonth()]} al ${last.getDate()} de ${monthNames[last.getMonth()]}`;
                                                    }
                                                })() : "Configure la fecha de inicio"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Agenda del Evento */}
                                <div className="pt-4 border-t border-gray-200 mt-4">
                                    <h5 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
                                        <Clock size={18} className="text-gray-500" />
                                        Agenda del Evento
                                    </h5>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Duración (Días)</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="number"
                                                min="1"
                                                max="7"
                                                value={config.duration || 3}
                                                onChange={handleDurationChange}
                                                className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <span className="text-sm text-gray-500 italic">El horario se ajustará automáticamente.</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {config.schedule?.map((day, idx) => (
                                            <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="w-16 font-bold text-gray-700">Día {day.day}</div>
                                                <div className="flex-1 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Apertura</label>
                                                        <input
                                                            type="time"
                                                            value={day.open}
                                                            onChange={(e) => handleScheduleChange(idx, 'open', e.target.value)}
                                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Cierre</label>
                                                        <input
                                                            type="time"
                                                            value={day.close}
                                                            onChange={(e) => handleScheduleChange(idx, 'close', e.target.value)}
                                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Appearance settings */}
                        <Card className="p-6 h-[500px] flex flex-col">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2 shrink-0">
                                <Palette size={20} className="text-gray-500" />
                                Apariencia y Tema
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1 content-start">
                                {themes.map(theme => (
                                    <div
                                        key={theme.id}
                                        onClick={() => setConfig({ ...config, theme: theme.id })}
                                        className={`cursor-pointer border-2 rounded-xl p-3 flex items-center gap-3 transition-all h-20 ${config.theme === theme.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full ${theme.color} shadow-sm shrink-0`}></div>
                                        <span className={`font-medium ${config.theme === theme.id ? 'text-blue-900' : 'text-gray-600'}`}>{theme.name}</span>
                                        {config.theme === theme.id && <div className="ml-auto text-blue-600"><Save size={16} /></div>}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Public Sections Management */}
                        <Card className="p-6 md:col-span-2">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2 shrink-0">
                                <Layout size={20} className="text-gray-500" />
                                Gestión de Secciones Públicas
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {config.publicSections?.map((section, idx) => (
                                    <div key={section.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all group">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="font-bold text-gray-800">{section.label}</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`visible-${section.id}`}
                                                    checked={section.isVisible}
                                                    onChange={(e) => {
                                                        const newSections = [...config.publicSections];
                                                        newSections[idx] = { ...newSections[idx], isVisible: e.target.checked };
                                                        setConfig({ ...config, publicSections: newSections });
                                                    }}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor={`visible-${section.id}`} className="text-xs font-bold text-gray-500 uppercase cursor-pointer">Menú</label>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-3 border-t border-gray-200/60">
                                            <input
                                                type="checkbox"
                                                id={`dev-${section.id}`}
                                                checked={section.isDevelopment}
                                                onChange={(e) => {
                                                    const newSections = [...config.publicSections];
                                                    newSections[idx] = { ...newSections[idx], isDevelopment: e.target.checked };
                                                    setConfig({ ...config, publicSections: newSections });
                                                }}
                                                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                            />
                                            <label htmlFor={`dev-${section.id}`} className="text-xs font-medium text-gray-600 cursor-pointer">
                                                Marcar "En Desarrollo"
                                            </label>
                                        </div>

                                        {!section.isVisible && (
                                            <div className="mt-2 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full inline-block font-bold">
                                                OCULTO DEL PÚBLICO
                                            </div>
                                        )}
                                        {section.isVisible && section.isDevelopment && (
                                            <div className="mt-2 text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full inline-block font-bold">
                                                MODO DESARROLLO
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="animate-fadeIn">
                        <CarouselManager />
                    </div>
                )}

                {activeTab === 'lists' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                        {/* Roles Management (New) */}
                        <Card className="p-6 h-[500px] flex flex-col">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2 shrink-0">
                                <Settings size={20} className="text-gray-500" />
                                Gestión de Roles
                            </h4>
                            <p className="text-sm text-gray-500 mb-4 shrink-0">Define los roles disponibles para asignar a los usuarios (Ej. Ponente, Jurado).</p>

                            <div className="flex gap-2 mb-4 shrink-0">
                                <input
                                    type="text"
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    placeholder="Nuevo rol..."
                                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                                />
                                <Button onClick={handleAddRole} disabled={!newRole.trim()} size="sm">
                                    <Plus size={16} /> Agregar
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto content-start pr-1">
                                {config.roles?.map((role, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100 h-8">
                                        {role}
                                        <button onClick={() => handleRemoveRole(role)} className="hover:text-red-500 transition-colors">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </Card>

                        {/* Subspecialties */}
                        <Card className="p-6 h-[500px] flex flex-col">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2 shrink-0">
                                <Settings size={20} className="text-gray-500" />
                                Gestión de Subespecialidades
                            </h4>
                            <p className="text-sm text-gray-500 mb-4 shrink-0">Define las subespecialidades disponibles para la clasificación de trabajos de investigación.</p>

                            <div className="flex gap-2 mb-4 shrink-0">
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

                            <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto content-start pr-1">
                                {config.specialties?.map((spec, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100 h-8">
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

                        {/* Occupations */}
                        <Card className="p-6 h-[500px] flex flex-col">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2 shrink-0">
                                <Settings size={20} className="text-gray-500" />
                                Gestión de Ocupaciones
                            </h4>
                            <p className="text-sm text-gray-500 mb-4 shrink-0">Define las opciones para el campo Ocupación en la inscripción.</p>

                            <div className="flex gap-2 mb-4 shrink-0">
                                <input
                                    type="text"
                                    value={newOccupation}
                                    onChange={(e) => setNewOccupation(e.target.value)}
                                    placeholder="Nueva ocupación..."
                                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddOccupation()}
                                />
                                <Button onClick={handleAddOccupation} disabled={!newOccupation.trim()} size="sm">
                                    <Plus size={16} /> Agregar
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto content-start pr-1">
                                {config.occupations?.map((occ, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100 h-8">
                                        {occ}
                                        <button onClick={() => handleRemoveOccupation(occ)} className="hover:text-red-500 transition-colors">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </Card>

                        {/* Residency Years */}
                        <Card className="p-6 h-[500px] flex flex-col">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2 shrink-0">
                                <Settings size={20} className="text-gray-500" />
                                Años de Residencia
                            </h4>
                            <p className="text-sm text-gray-500 mb-4 shrink-0">Opciones desplegables para el año de residencia.</p>

                            <div className="flex gap-2 mb-4 shrink-0">
                                <input
                                    type="text"
                                    value={newResidencyYear}
                                    onChange={(e) => setNewResidencyYear(e.target.value)}
                                    placeholder="Nuevo año (ej. R5)..."
                                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddResidencyYear()}
                                />
                                <Button onClick={handleAddResidencyYear} disabled={!newResidencyYear.trim()} size="sm">
                                    <Plus size={16} /> Agregar
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto content-start pr-1">
                                {config.residencyYears?.map((year, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100 h-8">
                                        {year}
                                        <button onClick={() => handleRemoveResidencyYear(year)} className="hover:text-red-500 transition-colors">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </Card>

                        {/* Participant Specialties */}
                        <Card className="p-6 h-[500px] flex flex-col">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2 shrink-0">
                                <Settings size={20} className="text-gray-500" />
                                Gestión de Especialidades (Participantes)
                            </h4>
                            <p className="text-sm text-gray-500 mb-4 shrink-0">Opciones de especialidad para Médicos Especialistas.</p>

                            <div className="flex gap-2 mb-4 shrink-0">
                                <input
                                    type="text"
                                    value={newParticipantSpecialty}
                                    onChange={(e) => setNewParticipantSpecialty(e.target.value)}
                                    placeholder="Nueva especialidad..."
                                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddParticipantSpecialty()}
                                />
                                <Button onClick={handleAddParticipantSpecialty} disabled={!newParticipantSpecialty.trim()} size="sm">
                                    <Plus size={16} /> Agregar
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto content-start pr-1">
                                {config.participantSpecialties?.map((spec, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100 h-8">
                                        {spec}
                                        <button onClick={() => handleRemoveParticipantSpecialty(spec)} className="hover:text-red-500 transition-colors">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'pricing' && (
                    <div className="grid grid-cols-1 gap-6 animate-fadeIn">
                        <Card className="p-6">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2">
                                <DollarSign size={20} className="text-gray-500" />
                                Gestión de Matriz de Precios
                            </h4>

                            <div className="space-y-8">
                                {/* Columns Management */}
                                <div>
                                    <h5 className="font-bold text-sm text-gray-700 mb-3 flex items-center justify-between">
                                        Columnas (Fechas / Etapas)
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                const newId = `col_${Date.now()}`;
                                                setConfig({
                                                    ...config,
                                                    pricingMatrix: {
                                                        ...config.pricingMatrix,
                                                        columns: [...config.pricingMatrix.columns, { id: newId, label: 'Nueva Etapa', deadline: '' }]
                                                    }
                                                });
                                            }}
                                        >
                                            <Plus size={14} /> Agregar Columna
                                        </Button>
                                    </h5>
                                    <div className="grid gap-3">
                                        {config.pricingMatrix?.columns?.map((col, idx) => (
                                            <div key={col.id} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                                <span className="text-xs font-bold text-gray-400 w-6">#{idx + 1}</span>
                                                <input
                                                    type="text"
                                                    value={col.label}
                                                    onChange={(e) => {
                                                        const newCols = [...config.pricingMatrix.columns];
                                                        newCols[idx].label = e.target.value;
                                                        setConfig({ ...config, pricingMatrix: { ...config.pricingMatrix, columns: newCols } });
                                                    }}
                                                    className="flex-1 p-1.5 border border-gray-300 rounded text-sm"
                                                    placeholder="Etiqueta (Ej. Hasta 15 Ene)"
                                                />
                                                <input
                                                    type="date"
                                                    value={col.deadline}
                                                    onChange={(e) => {
                                                        const newCols = [...config.pricingMatrix.columns];
                                                        newCols[idx].deadline = e.target.value;
                                                        setConfig({ ...config, pricingMatrix: { ...config.pricingMatrix, columns: newCols } });
                                                    }}
                                                    className="p-1.5 border border-gray-300 rounded text-sm w-40"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newCols = config.pricingMatrix.columns.filter(c => c.id !== col.id);
                                                        setConfig({ ...config, pricingMatrix: { ...config.pricingMatrix, columns: newCols } });
                                                    }}
                                                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Rows Management */}
                                <div>
                                    <h5 className="font-bold text-sm text-gray-700 mb-3 flex items-center justify-between">
                                        Filas (Categorías)
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                const newId = `row_${Date.now()}`;
                                                setConfig({
                                                    ...config,
                                                    pricingMatrix: {
                                                        ...config.pricingMatrix,
                                                        rows: [...config.pricingMatrix.rows, { id: newId, label: 'Nueva Categoría' }]
                                                    }
                                                });
                                            }}
                                        >
                                            <Plus size={14} /> Agregar Fila
                                        </Button>
                                    </h5>
                                    <div className="grid gap-3">
                                        {config.pricingMatrix?.rows?.map((row, idx) => (
                                            <div key={row.id} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                                <span className="text-xs font-bold text-gray-400 w-6">#{idx + 1}</span>
                                                <input
                                                    type="text"
                                                    value={row.label}
                                                    onChange={(e) => {
                                                        const newRows = [...config.pricingMatrix.rows];
                                                        newRows[idx].label = e.target.value;
                                                        setConfig({ ...config, pricingMatrix: { ...config.pricingMatrix, rows: newRows } });
                                                    }}
                                                    className="flex-1 p-1.5 border border-gray-300 rounded text-sm"
                                                    placeholder="Categoría"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newRows = config.pricingMatrix.rows.filter(r => r.id !== row.id);
                                                        setConfig({ ...config, pricingMatrix: { ...config.pricingMatrix, rows: newRows } });
                                                    }}
                                                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Matrix Values */}
                                <div>
                                    <h5 className="font-bold text-sm text-gray-700 mb-3">Matriz de Precios (S/.)</h5>
                                    <div className="overflow-x-auto border rounded-xl shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-100 text-gray-600 font-bold">
                                                <tr>
                                                    <th className="p-3 border-b">Categoría / Etapa</th>
                                                    {config.pricingMatrix?.columns?.map(col => (
                                                        <th key={col.id} className="p-3 border-b text-center border-l w-32">{col.label}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {config.pricingMatrix?.rows?.map(row => (
                                                    <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50">
                                                        <td className="p-3 font-medium text-gray-900">{row.label}</td>
                                                        {config.pricingMatrix?.columns?.map(col => {
                                                            const cellId = `${row.id}_${col.id}`;
                                                            return (
                                                                <td key={col.id} className="p-2 border-l text-center">
                                                                    <div className="flex items-center justify-center">
                                                                        <span className="text-gray-400 text-xs mr-1">S/.</span>
                                                                        <input
                                                                            type="number"
                                                                            value={config.pricingMatrix.values?.[cellId] || 0}
                                                                            onChange={(e) => {
                                                                                const newValues = { ...config.pricingMatrix.values, [cellId]: parseInt(e.target.value) || 0 };
                                                                                setConfig({ ...config, pricingMatrix: { ...config.pricingMatrix, values: newValues } });
                                                                            }}
                                                                            className="w-16 p-1 border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500"
                                                                        />
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Additional Costs */}
                                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Costo Certificado (Solo Presencial)</label>
                                        <div className="flex items-center">
                                            <span className="bg-gray-100 border border-gray-300 border-r-0 rounded-l-lg p-2 text-gray-500">S/.</span>
                                            <input
                                                type="number"
                                                value={config.pricingMatrix?.certificationCost || 0}
                                                onChange={(e) => setConfig({ ...config, pricingMatrix: { ...config.pricingMatrix, certificationCost: parseInt(e.target.value) } })}
                                                className="w-full p-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Tarifa Plana INCN</label>
                                        <div className="flex items-center">
                                            <span className="bg-blue-100 border border-blue-200 border-r-0 rounded-l-lg p-2 text-blue-600 font-bold">S/.</span>
                                            <input
                                                type="number"
                                                value={config.pricingMatrix?.incnRate || 0}
                                                onChange={(e) => setConfig({ ...config, pricingMatrix: { ...config.pricingMatrix, incnRate: parseInt(e.target.value) } })}
                                                className="w-full p-2 border border-blue-200 bg-blue-50 rounded-r-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-700"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'print' && (
                    <div className="animate-fadeIn">
                        <PrintSettingsManager />
                    </div>
                )}

                {activeTab === 'system' && (
                    <div className="animate-fadeIn">
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
                                <div className="flex gap-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                                        onClick={() => setShowArchiveConfirm(true)}
                                    >
                                        Archivar Evento {config.eventYear}
                                    </Button>
                                    <Button
                                        className="flex-1 bg-gray-900 hover:bg-black text-white shadow-lg"
                                        onClick={() => setShowNewYearConfirm(true)}
                                    >
                                        Aperturar Año {parseInt(config.eventYear) + 1}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
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
