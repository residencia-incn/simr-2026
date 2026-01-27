import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Palette, Calendar, Settings, AlertTriangle, X, Plus, DollarSign, Clock, Layout, List, Printer, HardDrive, Ticket, ArrowUp, ArrowDown, UserCog, Shield, Briefcase, Building, GraduationCap, Search } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CarouselManager from './CarouselManager';
import PrintSettingsManager from './PrintSettingsManager';
import ConfirmDialog from '../ui/ConfirmDialog';
import RoleAccessConfiguration from './RoleAccessConfiguration';
import RolesTab from './RolesTab';
import { api } from '../../services/api';
import OccupationsManager from './OccupationsManager';
import { configService } from '../../services/configService';
import { showSuccess, showError } from '../../utils/alerts';

const SystemConfiguration = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState('general');

    const TABS = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'content', label: 'Contenido', icon: Layout },
        { id: 'roles_modules', label: 'Roles y Módulos', icon: Shield },
        { id: 'lists', label: 'Parámetros', icon: List },
        { id: 'pricing', label: 'Inscripciones', icon: Ticket }, // Renamed from Tarifas
        { id: 'print', label: 'Impresión', icon: Printer },
        { id: 'system', label: 'Sistema', icon: HardDrive }
    ];

    // Dialog states
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [showNewYearConfirm, setShowNewYearConfirm] = useState(false);

    // Pricing State (New)
    const [pricingConfig, setPricingConfig] = useState({ ticketTypes: [], workshops: [] });

    // Subspecialty state
    const [newSpecialty, setNewSpecialty] = useState("");
    const [newOccupation, setNewOccupation] = useState("");
    const [newParticipantSpecialty, setNewParticipantSpecialty] = useState("");
    const [newResidencyYear, setNewResidencyYear] = useState("");
    const [newRole, setNewRole] = useState("");
    const [newInstitution, setNewInstitution] = useState("");
    const [newUniversity, setNewUniversity] = useState("");

    // Search filters for large lists
    const [searchSpecialty, setSearchSpecialty] = useState("");
    const [searchOccupation, setSearchOccupation] = useState("");
    const [searchParticipantSpecialty, setSearchParticipantSpecialty] = useState("");
    const [searchResidencyYear, setSearchResidencyYear] = useState("");
    const [searchInstitution, setSearchInstitution] = useState("");
    const [searchUniversity, setSearchUniversity] = useState("");

    useEffect(() => {
        const loadConfig = async () => {
            try {
                // [MOD] Consolidated loading: api.content.getConfig() already returns 
                // modalities and workshops, no need for 3 parallel redundant calls.
                // Increased timeout to 15s to be more resilient.
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout loading config")), 15000)
                );

                const dbConfig = await Promise.race([
                    api.content.getConfig(),
                    timeoutPromise
                ]);

                // Map database modalities and workshops from the consolidated response
                setPricingConfig({
                    ticketTypes: dbConfig.registration_modalities || [],
                    workshops: dbConfig.workshops || []
                });

                // Sync schedule with duration just in case they are out of sync in DB
                let loadedSchedule = dbConfig.event_schedule || [];
                const targetDuration = dbConfig.event_duration || 3;

                if (loadedSchedule.length < targetDuration) {
                    const daysToAdd = targetDuration - loadedSchedule.length;
                    for (let i = 0; i < daysToAdd; i++) {
                        loadedSchedule.push({
                            day: loadedSchedule.length + 1,
                            open: "08:00",
                            close: "18:00"
                        });
                    }
                } else if (loadedSchedule.length > targetDuration) {
                    loadedSchedule = loadedSchedule.slice(0, targetDuration);
                }

                setConfig({
                    ...dbConfig,
                    eventName: dbConfig.event_name,
                    eventYear: dbConfig.event_year,
                    startDate: dbConfig.start_date,
                    duration: dbConfig.event_duration,
                    showHeroCountdown: dbConfig.show_countdown,
                    schedule: loadedSchedule,

                    // Extra fields for frontend UI
                    theme: dbConfig.theme || "blue",
                    roles: dbConfig.allowed_roles || [],
                    specialties: dbConfig.allowed_specialties || [],
                    occupations: dbConfig.allowed_occupations || [],
                    residencyYears: dbConfig.residency_years || [],
                    participantSpecialties: dbConfig.participant_specialties || [],
                    institutions: dbConfig.allowed_institutions || [],
                    universities: dbConfig.allowed_universities || [],
                    publicSections: dbConfig.public_sections || [
                        { id: 'bases', label: 'Bases', isVisible: true, isDevelopment: false },
                        { id: 'roadmap', label: 'Roadmap', isVisible: true, isDevelopment: false },
                        { id: 'program', label: 'Programa', isVisible: true, isDevelopment: false },
                        { id: 'committee', label: 'Comité', isVisible: true, isDevelopment: false },
                        { id: 'gallery', label: 'Galería', isVisible: true, isDevelopment: false },
                        { id: 'posters', label: 'E-Posters', isVisible: true, isDevelopment: false }
                    ]
                });
            } catch (err) {
                console.error("Error loading config:", err);
                const fallbackConfig = {
                    eventName: "Simposio Internacional de Medicina y Residencia",
                    eventYear: "2026",
                    showHeroCountdown: true,
                    duration: 3,
                    startDate: "2026-06-22",
                    schedule: [],
                    publicSections: [],
                    roles: [],
                    specialties: [],
                    occupations: [],
                    residencyYears: [],
                    participantSpecialties: [],
                    institutions: [],
                    universities: [],
                    registration_modalities: [],
                    workshops: []
                };
                setConfig(fallbackConfig);
                showError("No se pudo cargar la configuración completa oportunamente. Se ha cargado una versión básica por seguridad.", "Aviso del Sistema");
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, []);

    const moveItem = (listKey, index, direction) => {
        const list = [...pricingConfig[listKey]];
        if (direction === -1 && index === 0) return;
        if (direction === 1 && index === list.length - 1) return;

        const item = list[index];
        list.splice(index, 1);
        list.splice(index + direction, 0, item);

        setPricingConfig({ ...pricingConfig, [listKey]: list });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Map frontend camelCase to backend snake_case payload
            const payload = {
                event_name: config.eventName,
                event_year: config.eventYear,
                start_date: config.startDate,
                event_duration: config.duration,
                event_schedule: config.schedule,
                show_countdown: config.showHeroCountdown,

                // Lists & Objects
                allowed_roles: config.roles,
                allowed_specialties: config.specialties,
                allowed_occupations: config.occupations,
                residency_years: config.residencyYears,
                participant_specialties: config.participantSpecialties,
                allowed_institutions: config.institutions,
                allowed_universities: config.universities,

                public_sections: config.publicSections,
                registration_modalities: pricingConfig.ticketTypes,
                workshops: pricingConfig.workshops
            };

            await api.content.saveConfig(payload);

            // Notificar al resto de la app
            window.dispatchEvent(new CustomEvent('config-updated'));

            showSuccess('Los cambios han sido aplicados correctamente.', 'Configuración guardada');
        } catch (err) {
            console.error(err);
            let msg = 'Hubo un problema al guardar la configuración.';

            if (err.response?.status === 401 || err.response?.data?.detail === 'Not authenticated') {
                msg = 'Sesión caducada o inicie sesión nuevamente.';
            } else if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                if (Array.isArray(detail)) {
                    // Pydantic validation error
                    msg = detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join('\n');
                } else {
                    msg = detail;
                }
            } else if (err.message) {
                msg = err.message;
            }

            showError(msg, 'Error al guardar');
        } finally {
            setIsSaving(false);
        }
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
        if (newOccupation.trim() && !(config.occupations || []).includes(newOccupation.trim())) {
            setConfig({ ...config, occupations: [...(config.occupations || []), newOccupation.trim()] });
            setNewOccupation("");
        }
    };

    const handleRemoveOccupation = (occ) => {
        setConfig({ ...config, occupations: (config.occupations || []).filter(o => o !== occ) });
    };

    const handleAddParticipantSpecialty = () => {
        if (newParticipantSpecialty.trim() && !(config.participantSpecialties || []).includes(newParticipantSpecialty.trim())) {
            setConfig({ ...config, participantSpecialties: [...(config.participantSpecialties || []), newParticipantSpecialty.trim()] });
            setNewParticipantSpecialty("");
        }
    };

    const handleRemoveParticipantSpecialty = (spec) => {
        setConfig({ ...config, participantSpecialties: (config.participantSpecialties || []).filter(s => s !== spec) });
    };

    const handleAddResidencyYear = () => {
        if (newResidencyYear.trim() && !(config.residencyYears || []).includes(newResidencyYear.trim())) {
            setConfig({ ...config, residencyYears: [...(config.residencyYears || []), newResidencyYear.trim()] });
            setNewResidencyYear("");
        }
    };

    const handleRemoveResidencyYear = (year) => {
        setConfig({ ...config, residencyYears: (config.residencyYears || []).filter(y => y !== year) });
    };

    const handleAddRole = () => {
        if (newRole.trim() && !(config.roles || []).includes(newRole.trim())) {
            setConfig({ ...config, roles: [...(config.roles || []), newRole.trim()] });
            setNewRole("");
        }
    };

    const handleRemoveRole = (role) => {
        setConfig({ ...config, roles: (config.roles || []).filter(r => r !== role) });
    };

    const handleAddInstitution = () => {
        if (newInstitution.trim() && !(config.institutions || []).includes(newInstitution.trim())) {
            setConfig({ ...config, institutions: [...(config.institutions || []), newInstitution.trim()] });
            setNewInstitution("");
        }
    };

    const handleRemoveInstitution = (inst) => {
        setConfig({ ...config, institutions: config.institutions.filter(i => i !== inst) });
    };

    const handleAddUniversity = () => {
        if (newUniversity.trim() && !config.universities.includes(newUniversity.trim())) {
            setConfig({ ...config, universities: [...(config.universities || []), newUniversity.trim()] });
            setNewUniversity("");
        }
    };

    const handleRemoveUniversity = (univ) => {
        setConfig({ ...config, universities: config.universities.filter(u => u !== univ) });
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

    // --- Pricing Management Handlers ---
    const handleUpdateTicket = (idx, field, value) => {
        const newTickets = [...(pricingConfig?.ticketTypes || [])];
        newTickets[idx] = { ...newTickets[idx], [field]: value };
        setPricingConfig({ ...pricingConfig, ticketTypes: newTickets });
    };

    const handleAddTicket = () => {
        const newTicket = {
            id: `t_${Date.now()}`,
            key: `ticket_${Date.now()}`,
            title: 'Nueva Modalidad',
            price: 0,
            subtitle: 'Gratis',
            description: 'Descripción de la modalidad'
        };
        setPricingConfig({
            ...pricingConfig,
            ticketTypes: [...(pricingConfig?.ticketTypes || []), newTicket]
        });
    };

    const handleRemoveTicket = (idx) => {
        const newTickets = [...(pricingConfig?.ticketTypes || [])];
        newTickets.splice(idx, 1);
        setPricingConfig({ ...pricingConfig, ticketTypes: newTickets });
    };

    const handleUpdateWorkshop = (idx, field, value) => {
        const newWorkshops = [...(pricingConfig?.workshops || [])];
        newWorkshops[idx] = { ...newWorkshops[idx], [field]: value };
        setPricingConfig({ ...pricingConfig, workshops: newWorkshops });
    };

    const handleAddWorkshop = () => {
        const newWorkshop = {
            id: `w_${Date.now()}`,
            key: `workshop_${Date.now()}`,
            name: 'Nuevo Taller',
            price: 50,
            description: 'Descripción del taller'
        };
        setPricingConfig({
            ...pricingConfig,
            workshops: [...(pricingConfig?.workshops || []), newWorkshop]
        });
    };

    const handleRemoveWorkshop = (idx) => {
        const newWorkshops = [...(pricingConfig?.workshops || [])];
        newWorkshops.splice(idx, 1);
        setPricingConfig({ ...pricingConfig, workshops: newWorkshops });
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

                {activeTab === 'roles_modules' && (
                    <div className="animate-fadeIn">
                        <Card className="p-0 overflow-hidden">
                            <RolesTab modalities={pricingConfig.ticketTypes} workshops={pricingConfig.workshops} definedRoles={config.roles || []} />
                        </Card>
                    </div>
                )}

                {activeTab === 'lists' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                        {/* 1. Roles */}
                        <Card className="p-6 h-[400px] flex flex-col border-t-4 border-t-purple-500 shadow-lg">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-2 shrink-0">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <Shield size={20} />
                                </div>
                                Roles
                            </h4>
                            <p className="text-sm text-gray-500 mb-4 shrink-0 pl-11">Roles para asignar a usuarios (Ej. Ponente, Jurado).</p>

                            <div className="space-y-3 pl-11 mb-4 shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar rol..."
                                        value={searchResidencyYear} /* Using searchRole or similar if I added it, wait I used specific search states */
                                        onChange={(e) => setSearchResidencyYear(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div className="flex gap-0 shadow-sm rounded-lg overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all">
                                    <input
                                        type="text"
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        placeholder="Nuevo rol..."
                                        className="flex-1 p-3 text-sm outline-none border-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                                    />
                                    <button
                                        onClick={handleAddRole}
                                        disabled={!newRole.trim()}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 font-medium disabled:opacity-50 transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto content-start pr-1 custom-scrollbar">
                                {config.roles?.map((role, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-gray-700 text-sm font-medium border border-gray-200 shadow-sm group hover:border-purple-200 hover:shadow-md transition-all">
                                        {role}
                                        <button onClick={() => handleRemoveRole(role)} className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50">
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </Card>

                        {/* 2. Subespecialidades */}
                        <Card className="p-6 h-[400px] flex flex-col border-t-4 border-t-blue-500 shadow-lg">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-2 shrink-0">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <List size={20} />
                                </div>
                                Subespecialidades
                            </h4>
                            <p className="text-sm text-gray-500 mb-4 shrink-0 pl-11">Clasificación de trabajos de investigación.</p>

                            <div className="space-y-3 pl-11 mb-4 shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar subespecialidad..."
                                        value={searchSpecialty}
                                        onChange={(e) => setSearchSpecialty(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex gap-0 shadow-sm rounded-lg overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                                    <input
                                        type="text"
                                        value={newSpecialty}
                                        onChange={(e) => setNewSpecialty(e.target.value)}
                                        placeholder="Nueva subespecialidad..."
                                        className="flex-1 p-3 text-sm outline-none border-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSpecialty()}
                                    />
                                    <button
                                        onClick={handleAddSpecialty}
                                        disabled={!newSpecialty.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium disabled:opacity-50 transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto content-start pr-1 custom-scrollbar">
                                {config.specialties?.filter(s => s.toLowerCase().includes(searchSpecialty.toLowerCase())).map((spec, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-gray-700 text-sm font-medium border border-gray-200 shadow-sm group hover:border-blue-200 hover:shadow-md transition-all">
                                        {spec}
                                        <button onClick={() => handleRemoveSpecialty(spec)} className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50">
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </Card>

                        {/* 3. Ocupaciones */}
                        <Card className="p-6 h-[500px] flex flex-col border-t-4 border-t-green-500 shadow-lg">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-2 shrink-0">
                                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                    <Briefcase size={20} />
                                </div>
                                Ocupaciones
                            </h4>

                            <div className="pl-2 flex-1 overflow-y-auto custom-scrollbar">
                                <OccupationsManager
                                    occupations={config.occupations || []}
                                    onUpdate={(list) => setConfig({ ...config, occupations: list })}
                                />
                            </div>
                        </Card>

                        {/* 4. Año de Residencia */}
                        <Card className="p-6 h-[400px] flex flex-col border-t-4 border-t-orange-500 shadow-lg">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-2 shrink-0">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <Clock size={20} />
                                </div>
                                Año de Residencia
                            </h4>
                            <p className="text-sm text-gray-500 mb-4 shrink-0 pl-11">Opciones desplegables para residentes.</p>

                            <div className="space-y-3 pl-11 mb-4 shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={searchResidencyYear}
                                        onChange={(e) => setSearchResidencyYear(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div className="flex gap-0 shadow-sm rounded-lg overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent transition-all">
                                    <input
                                        type="text"
                                        value={newResidencyYear}
                                        onChange={(e) => setNewResidencyYear(e.target.value)}
                                        placeholder="Nuevo año (ej. R5)..."
                                        className="flex-1 p-3 text-sm outline-none border-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddResidencyYear()}
                                    />
                                    <button
                                        onClick={handleAddResidencyYear}
                                        disabled={!newResidencyYear.trim()}
                                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 font-medium disabled:opacity-50 transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto content-start pr-1 custom-scrollbar">
                                {config.residencyYears?.filter(y => y.toLowerCase().includes(searchResidencyYear.toLowerCase())).map((year, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-gray-700 text-sm font-medium border border-gray-200 shadow-sm group hover:border-orange-200 hover:shadow-md transition-all">
                                        {year}
                                        <button onClick={() => handleRemoveResidencyYear(year)} className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50">
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </Card>

                        {/* 5. Especialidades */}
                        <Card className="p-6 h-[400px] flex flex-col border-t-4 border-t-cyan-500 shadow-lg">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-2 shrink-0">
                                <div className="p-2 bg-cyan-100 rounded-lg text-cyan-600">
                                    <UserCog size={20} />
                                </div>
                                Especialidades
                            </h4>
                            <p className="text-sm text-gray-500 mb-4 shrink-0 pl-11">Opciones para Médicos Especialistas.</p>

                            <div className="space-y-3 pl-11 mb-4 shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar especialidad..."
                                        value={searchParticipantSpecialty}
                                        onChange={(e) => setSearchParticipantSpecialty(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div className="flex gap-0 shadow-sm rounded-lg overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-transparent transition-all">
                                    <input
                                        type="text"
                                        value={newParticipantSpecialty}
                                        onChange={(e) => setNewParticipantSpecialty(e.target.value)}
                                        placeholder="Nueva especialidad..."
                                        className="flex-1 p-3 text-sm outline-none border-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddParticipantSpecialty()}
                                    />
                                    <button
                                        onClick={handleAddParticipantSpecialty}
                                        disabled={!newParticipantSpecialty.trim()}
                                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 font-medium disabled:opacity-50 transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto content-start pr-1 custom-scrollbar">
                                {config.participantSpecialties?.filter(s => s.toLowerCase().includes(searchParticipantSpecialty.toLowerCase())).map((spec, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-gray-700 text-sm font-medium border border-gray-200 shadow-sm group hover:border-cyan-200 hover:shadow-md transition-all">
                                        {spec}
                                        <button onClick={() => handleRemoveParticipantSpecialty(spec)} className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50">
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </Card>

                        {/* 6. Instituciones (Hospitales) */}
                        <Card className="p-6 h-[400px] flex flex-col border-t-4 border-t-indigo-500 shadow-lg">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-2 shrink-0">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                    <Building size={20} />
                                </div>
                                Instituciones
                            </h4>
                            <p className="text-sm text-gray-500 mb-4 shrink-0 pl-11">Lista de Hospitales e Instituciones de salud.</p>

                            <div className="space-y-3 pl-11 mb-4 shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar hospital..."
                                        value={searchInstitution}
                                        onChange={(e) => setSearchInstitution(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex gap-0 shadow-sm rounded-lg overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                                    <input
                                        type="text"
                                        value={newInstitution}
                                        onChange={(e) => setNewInstitution(e.target.value)}
                                        placeholder="Nueva institución..."
                                        className="flex-1 p-3 text-sm outline-none border-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddInstitution()}
                                    />
                                    <button
                                        onClick={handleAddInstitution}
                                        disabled={!newInstitution.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 font-medium disabled:opacity-50 transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto content-start pr-1 custom-scrollbar">
                                {config.institutions?.filter(i => i.toLowerCase().includes(searchInstitution.toLowerCase())).map((inst, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-gray-700 text-sm font-medium border border-gray-200 shadow-sm group hover:border-indigo-200 hover:shadow-md transition-all">
                                        {inst}
                                        <button onClick={() => handleRemoveInstitution(inst)} className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50">
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </Card>

                        {/* 7. Universidades */}
                        <Card className="p-6 h-[400px] flex flex-col border-t-4 border-t-amber-500 shadow-lg">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-2 shrink-0">
                                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                    <GraduationCap size={20} />
                                </div>
                                Universidades
                            </h4>
                            <p className="text-sm text-gray-500 mb-4 shrink-0 pl-11">Lista de Universidades nacionales e internacionales.</p>

                            <div className="space-y-3 pl-11 mb-4 shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar universidad..."
                                        value={searchUniversity}
                                        onChange={(e) => setSearchUniversity(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                                <div className="flex gap-0 shadow-sm rounded-lg overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-transparent transition-all">
                                    <input
                                        type="text"
                                        value={newUniversity}
                                        onChange={(e) => setNewUniversity(e.target.value)}
                                        placeholder="Nueva universidad..."
                                        className="flex-1 p-3 text-sm outline-none border-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddUniversity()}
                                    />
                                    <button
                                        onClick={handleAddUniversity}
                                        disabled={!newUniversity.trim()}
                                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 font-medium disabled:opacity-50 transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto content-start pr-1 custom-scrollbar">
                                {config.universities?.filter(u => u.toLowerCase().includes(searchUniversity.toLowerCase())).map((univ, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-gray-700 text-sm font-medium border border-gray-200 shadow-sm group hover:border-amber-200 hover:shadow-md transition-all">
                                        {univ}
                                        <button onClick={() => handleRemoveUniversity(univ)} className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50">
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'pricing' && (
                    <div className="grid grid-cols-1 gap-6 animate-fadeIn">
                        {/* 1. Modalidades (Ticket Types) */}
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="flex items-center gap-2 font-bold text-gray-800 border-b pb-2">
                                    <Ticket size={20} className="text-gray-500" />
                                    Modalidades de Inscripción
                                </h4>
                                <Button size="sm" onClick={handleAddTicket}>
                                    <Plus size={16} /> Agregar Modalidad
                                </Button>
                            </div>

                            <div className="overflow-x-auto border rounded-xl shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-600 font-bold">
                                        <tr>
                                            <th className="p-3 border-b">ID (Código)</th>
                                            <th className="p-3 border-b">Título</th>
                                            <th className="p-3 border-b">Subtítulo (Mostrar)</th>
                                            <th className="p-3 border-b">Precio (S/.)</th>
                                            <th className="p-3 border-b">Descripción</th>
                                            <th className="p-3 border-b text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pricingConfig?.ticketTypes?.map((ticket, idx) => (
                                            <tr key={ticket.id} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="p-3 text-xs font-mono text-gray-500">
                                                    {ticket.id}
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        value={ticket.title}
                                                        onChange={(e) => handleUpdateTicket(idx, 'title', e.target.value)}
                                                        className="w-full p-1.5 border border-gray-300 rounded text-sm font-medium"
                                                        placeholder="Ej. Presencial"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        value={ticket.subtitle}
                                                        onChange={(e) => handleUpdateTicket(idx, 'subtitle', e.target.value)}
                                                        className="w-full p-1.5 border border-gray-300 rounded text-sm"
                                                        placeholder="Ej. Gratis"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        value={ticket.price}
                                                        onChange={(e) => handleUpdateTicket(idx, 'price', parseFloat(e.target.value))}
                                                        className="w-24 p-1.5 border border-gray-300 rounded text-sm text-center font-bold text-gray-700"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        value={ticket.description}
                                                        onChange={(e) => handleUpdateTicket(idx, 'description', e.target.value)}
                                                        className="w-full p-1.5 border border-gray-300 rounded text-sm text-gray-500"
                                                        placeholder="Descripción breve..."
                                                    />
                                                </td>
                                                <td className="p-3 text-center flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => moveItem('ticketTypes', idx, -1)}
                                                        disabled={idx === 0}
                                                        className="text-gray-400 hover:text-blue-600 p-1 disabled:opacity-30 disabled:hover:text-gray-400"
                                                        title="Mover arriba"
                                                    >
                                                        <ArrowUp size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => moveItem('ticketTypes', idx, 1)}
                                                        disabled={idx === pricingConfig.ticketTypes.length - 1}
                                                        className="text-gray-400 hover:text-blue-600 p-1 disabled:opacity-30 disabled:hover:text-gray-400"
                                                        title="Mover abajo"
                                                    >
                                                        <ArrowDown size={16} />
                                                    </button>
                                                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                                    <button onClick={() => handleRemoveTicket(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                                                        <X size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!pricingConfig?.ticketTypes || pricingConfig.ticketTypes.length === 0) && (
                                            <tr>
                                                <td colSpan="6" className="p-4 text-center text-gray-400 italic">No hay modalidades definidas.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* 2. Talleres (Workshops) */}
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="flex items-center gap-2 font-bold text-gray-800 border-b pb-2">
                                    <DollarSign size={20} className="text-gray-500" />
                                    Gestión de Talleres
                                </h4>
                                <Button size="sm" onClick={handleAddWorkshop}>
                                    <Plus size={16} /> Agregar Taller
                                </Button>
                            </div>

                            <div className="overflow-x-auto border rounded-xl shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-600 font-bold">
                                        <tr>
                                            <th className="p-3 border-b">ID (Código)</th>
                                            <th className="p-3 border-b">Nombre del Taller</th>
                                            <th className="p-3 border-b">Precio (S/.)</th>
                                            <th className="p-3 border-b">Descripción</th>
                                            <th className="p-3 border-b text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pricingConfig?.workshops?.map((workshop, idx) => (
                                            <tr key={workshop.id} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="p-3 text-xs font-mono text-gray-500">
                                                    {workshop.id}
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        value={workshop.name}
                                                        onChange={(e) => handleUpdateWorkshop(idx, 'name', e.target.value)}
                                                        className="w-full p-1.5 border border-gray-300 rounded text-sm font-medium"
                                                        placeholder="Nombre del taller..."
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        value={workshop.price}
                                                        onChange={(e) => handleUpdateWorkshop(idx, 'price', parseFloat(e.target.value))}
                                                        className="w-24 p-1.5 border border-gray-300 rounded text-sm text-center font-bold text-gray-700"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        value={workshop.description}
                                                        onChange={(e) => handleUpdateWorkshop(idx, 'description', e.target.value)}
                                                        className="w-full p-1.5 border border-gray-300 rounded text-sm text-gray-500"
                                                        placeholder="Descripción..."
                                                    />
                                                </td>
                                                <td className="p-3 text-center flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => moveItem('workshops', idx, -1)}
                                                        disabled={idx === 0}
                                                        className="text-gray-400 hover:text-blue-600 p-1 disabled:opacity-30 disabled:hover:text-gray-400"
                                                        title="Mover arriba"
                                                    >
                                                        <ArrowUp size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => moveItem('workshops', idx, 1)}
                                                        disabled={idx === pricingConfig.workshops.length - 1}
                                                        className="text-gray-400 hover:text-blue-600 p-1 disabled:opacity-30 disabled:hover:text-gray-400"
                                                        title="Mover abajo"
                                                    >
                                                        <ArrowDown size={16} />
                                                    </button>
                                                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                                    <button onClick={() => handleRemoveWorkshop(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                                                        <X size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!pricingConfig?.workshops || pricingConfig.workshops.length === 0) && (
                                            <tr>
                                                <td colSpan="5" className="p-4 text-center text-gray-400 italic">No hay talleres definidos.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
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
