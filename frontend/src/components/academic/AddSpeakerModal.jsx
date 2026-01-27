import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Building, Search, UserPlus, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import Button from '../ui/Button';
import { api } from '../../services/api';

const AddSpeakerModal = ({ isOpen, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('register'); // 'register' or 'search'

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        email: '',
        occupation: '',
        cmp: '',
        rne: '',
        residencyYear: '',
        specialty: '',
        institution: '',
        dni: '',
        country: 'Perú',
        customOccupation: '',
        customInstitution: '',
        customSpecialty: '',
        university: '',
        customUniversity: ''
    });

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Config State
    const [config, setConfig] = useState({
        occupations: ["Médico Especialista", "Médico General", "Médico Residente", "Estudiante de Medicina", "Otro"],
        institutions: ["INCN", "Hospital Almenara", "Hospital Rebagliati", "Otro"],
        specialties: []
    });

    // UI State
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    const countries = [
        "Perú", "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Ecuador", "México", "Paraguay", "Uruguay", "Venezuela", "Estados Unidos", "España", "Otro"
    ];

    useEffect(() => {
        if (isOpen) {
            // Reset state when opening
            setFormData({ name: '', lastName: '', email: '', occupation: '', cmp: '', rne: '', residencyYear: '', specialty: '', institution: '', country: 'Perú', dni: '' });
            setSearchQuery('');
            setSearchResults([]);
            setError(null);
            setSuccessMessage(null);
            setActiveTab('register');
        }
    }, [isOpen]);

    // Fetch config on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await api.system.getConfig();
                setConfig(data);
            } catch (e) {
                console.error("Config load error", e);
                // Fallback
                setConfig({
                    occupations: ["Médico Especialista", "Médico General", "Médico Residente", "Estudiante de Medicina", "Otro"],
                    institutions: ["INCN", "Hospital Almenara", "Hospital Rebagliati", "Otro"]
                });
            }
        };
        fetchConfig();
    }, []);

    // Search Logic
    useEffect(() => {
        const doSearch = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const results = await api.users.search(searchQuery);
                setSearchResults(results);
            } catch (error) {
                console.error("Search error", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeout = setTimeout(doSearch, 300); // Debounce
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    // Helper to get current occupation rules
    const currentOcc = (config.allowed_occupations || config.occupations || []).find(
        o => (typeof o === 'string' ? o : o.name) === formData.occupation
    );
    const rules = currentOcc?.rules || {};


    if (!isOpen) return null;

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.dni || formData.dni.length < 8) {
            setError("DNI inválido");
            setLoading(false);
            return;
        }

        try {
            await api.speakers.create({
                first_name: formData.name,
                last_name: formData.lastName,
                email: formData.email,
                dni: formData.dni,
                specialty: formData.specialty === 'Otro' ? formData.customSpecialty : formData.specialty,
                institution: formData.institution === 'Otro' ? formData.customInstitution : formData.institution,
                country: formData.country,
                university: formData.university === 'Otro' ? formData.customUniversity : formData.university,
                occupation: formData.occupation === 'Otro' ? formData.customOccupation : formData.occupation,
                cmp: formData.cmp,
                rne: formData.rne,
                residency_year: formData.residencyYear
            });

            setSuccessMessage("Ponente registrado correctamente");
            setTimeout(() => {
                onUpdate();
                onClose();
            }, 1000);
        } catch (err) {
            console.error("Error adding speaker:", err);
            setError(err.message || "Error al agregar ponente");
        } finally {
            setLoading(false);
        }
    };

    const handleAddExisting = async (user) => {
        setLoading(true);
        setError(null);
        try {
            // Check if already a speaker
            const roles = user.roles || user.eventRoles || [];
            if (roles.includes('ponente') || roles.includes('PONENTE')) {
                setError("Este usuario ya es ponente.");
                setLoading(false);
                return;
            }

            await api.speakers.create({
                email: user.email,
                specialty: user.specialty,
                institution: user.institution
            });

            setSuccessMessage(`Rol de ponente asignado a ${user.name}`);
            setTimeout(() => {
                onUpdate();
                onClose();
            }, 1000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper to check if user is already a speaker
    const isSpeaker = (user) => {
        const roles = user.roles || user.eventRoles || [];
        return roles.some(r => r.toLowerCase() === 'ponente');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-purple-600 px-6 py-4 flex justify-between items-center shrink-0">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <UserPlus size={20} />
                        Gestión de Ponentes
                    </h3>
                    <button onClick={onClose} className="text-purple-100 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 shrink-0">
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'register' ? 'border-purple-600 text-purple-600 bg-purple-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('register')}
                    >
                        Registrar Nuevo
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'search' ? 'border-purple-600 text-purple-600 bg-purple-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('search')}
                    >
                        Buscar Existente
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {successMessage ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center animate-fadeIn">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">¡Operación Exitosa!</h4>
                            <p className="text-gray-600">{successMessage}</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 mb-4 flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {activeTab === 'register' && (
                                <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fadeIn">
                                    <div className="bg-purple-50 p-3 rounded-lg text-xs text-purple-800 border border-purple-100 mb-4">
                                        <p>Se creará una cuenta de usuario nueva para esta persona.</p>
                                        <p className="mt-1 font-medium">Contraseña por defecto: 123456</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Ej. Juan"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                placeholder="Ej. Perez"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">DNI (Usuario/Pass)</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                value={formData.dni}
                                                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                                placeholder="Ej. 12345678"
                                                maxLength={8}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    required
                                                    type="email"
                                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    placeholder="correo@ejemplo.com"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <select
                                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none appearance-none bg-white"
                                                value={formData.country}
                                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            >
                                                {countries.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ocupación</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <select
                                                required
                                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none appearance-none bg-white"
                                                value={formData.occupation}
                                                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                                            >
                                                <option value="">Seleccione una ocupación</option>
                                                {(config.allowed_occupations || config.occupations)?.map((opt, idx) => {
                                                    const name = typeof opt === 'string' ? opt : opt.name;
                                                    return <option key={idx} value={name}>{name}</option>;
                                                })}
                                                <option value="Otro">Otro (Especificar)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Manual Occupation Entry */}
                                    {formData.occupation === 'Otro' && (
                                        <div className="animate-fadeIn">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Especifique Ocupación *</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                value={formData.customOccupation || ''}
                                                onChange={(e) => setFormData({ ...formData, customOccupation: e.target.value })}
                                                placeholder="Ej. Estudiante de Doctorado"
                                            />
                                        </div>
                                    )}

                                    {/* Dynamic Fields based on Occupation Rules */}
                                    {(rules.cmp || rules.rne || rules.year || rules.specialty || rules.university) && (
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4 animate-fadeIn">
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* CMP */}
                                                {rules.cmp && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">N° CMP *</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                            value={formData.cmp}
                                                            onChange={(e) => setFormData({ ...formData, cmp: e.target.value })}
                                                            placeholder="12345"
                                                        />
                                                    </div>
                                                )}

                                                {/* RNE */}
                                                {rules.rne && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">N° RNE *</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                            value={formData.rne}
                                                            onChange={(e) => setFormData({ ...formData, rne: e.target.value })}
                                                            placeholder="54321"
                                                        />
                                                    </div>
                                                )}

                                                {/* Residency Year */}
                                                {rules.year && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Año de Residencia *</label>
                                                        <select
                                                            required
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none appearance-none bg-white"
                                                            value={formData.residencyYear}
                                                            onChange={(e) => setFormData({ ...formData, residencyYear: e.target.value })}
                                                        >
                                                            <option value="">Seleccione...</option>
                                                            {(config.residency_years || ["R1", "R2", "R3", "R4", "R5"]).map((year, idx) => (
                                                                <option key={idx} value={year}>{year}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {/* University */}
                                                {rules.university && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Universidad *</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                            value={formData.university || ''}
                                                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                                            placeholder="Ej. UNMSM"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Specialty */}
                                            {rules.specialty && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad *</label>
                                                    <select
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none appearance-none bg-white"
                                                        value={formData.specialty}
                                                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                                    >
                                                        <option value="">Seleccione...</option>
                                                        {(config.participant_specialties || config.allowed_specialties || []).map((spec, idx) => {
                                                            const name = typeof spec === 'string' ? spec : spec.name;
                                                            return <option key={idx} value={name}>{name}</option>;
                                                        })}
                                                        <option value="Otro">Otro (Especificar)</option>
                                                    </select>
                                                </div>
                                            )}

                                            {/* Manual Specialty Entry */}
                                            {formData.specialty === 'Otro' && (
                                                <div className="animate-fadeIn">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Especifique Especialidad *</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                        value={formData.customSpecialty || ''}
                                                        onChange={(e) => setFormData({ ...formData, customSpecialty: e.target.value })}
                                                        placeholder="Ej. Neuropediatría"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Institución</label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <select
                                                required
                                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none appearance-none bg-white"
                                                value={formData.institution}
                                                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                            >
                                                <option value="">Seleccione una institución</option>
                                                {(config.allowed_institutions || config.institutions)?.map((opt, idx) => {
                                                    const name = typeof opt === 'string' ? opt : opt.name;
                                                    return <option key={idx} value={name}>{name}</option>;
                                                })}
                                                <option value="Otro">Otro (Especificar)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Manual Institution Entry */}
                                    {formData.institution === 'Otro' && (
                                        <div className="animate-fadeIn">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Especifique Institución *</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                value={formData.customInstitution || ''}
                                                onChange={(e) => setFormData({ ...formData, customInstitution: e.target.value })}
                                                placeholder="Ej. Clínica Internacional"
                                            />
                                        </div>
                                    )}

                                    <div className="pt-4 flex gap-3 justify-end">
                                        <Button type="button" variant="outline" onClick={onClose}>
                                            Cancelar
                                        </Button>
                                        <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                                            {loading ? 'Guardando...' : 'Crear Cuenta Ponente'}
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'search' && (
                                <div className="space-y-4 animate-fadeIn">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Buscar usuario por nombre o correo..."
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            autoFocus
                                        />
                                    </div>

                                    <div className="min-h-[200px] max-h-[300px] overflow-y-auto bg-gray-50 rounded-lg border border-gray-200">
                                        {isSearching ? (
                                            <div className="p-8 text-center text-gray-400">Buscando...</div>
                                        ) : searchQuery.length < 2 ? (
                                            <div className="p-8 text-center text-gray-400 text-sm">
                                                Ingrese al menos 2 caracteres para buscar.
                                            </div>
                                        ) : searchResults.length === 0 ? (
                                            <div className="p-8 text-center text-gray-400 text-sm">
                                                No se encontraron usuarios.
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-200">
                                                {searchResults.map(user => {
                                                    const alreadySpeaker = isSpeaker(user);
                                                    return (
                                                        <div key={user.id} className="p-3 bg-white flex justify-between items-center hover:bg-gray-50 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                                    {user.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-gray-800 text-sm">{user.name}</div>
                                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                                </div>
                                                            </div>

                                                            {alreadySpeaker ? (
                                                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 flex items-center gap-1">
                                                                    <CheckCircle size={10} /> Ya es ponente
                                                                </span>
                                                            ) : (
                                                                <Button
                                                                    size="xs"
                                                                    onClick={() => handleAddExisting(user)}
                                                                    disabled={loading}
                                                                    className="bg-purple-600 hover:bg-purple-700"
                                                                >
                                                                    Asignar Rol
                                                                </Button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                        <Button type="button" variant="outline" onClick={onClose}>
                                            Cerrar
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddSpeakerModal;
