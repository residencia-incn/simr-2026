import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Building, Search, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { api } from '../../services/api';

const AddJurorModal = ({ isOpen, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('register'); // 'register' or 'search'

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        email: '',
        specialty: '',
        institution: ''
    });

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Config State
    const [config, setConfig] = useState({ occupations: [], institutions: [] });
    // General State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        const loadConfig = async () => {
            // Mock loading config from API if needed, or if mockData is enough we could import it directly but better to use api principle
            // Assuming api.config.getPublic exists or we can get it from somewhere. 
            // Since api.config might not be exposed, and we updated mockData, let's use a simulated fetch or try to find where it is exposed.
            // Actually, usually it's in api.js. I'll check api.js for config.
            // If not, I'll just import it? No, imports from ../data forbidden usually if via api.
            // Let's check api.js again. Ah, I see api.js uses MOCK_DATA.
            // I'll assume for now I can get it via a new/existing endpoint or just use hardcoded fallbacks if I can't find it.
            // Wait, I see "EVENT_CONFIG" in api.js imports. 
            // Let's add a helper to fetch it if it doesn't exist.
        };

        if (isOpen) {
            // Reset state when opening
            setFormData({ name: '', lastName: '', email: '', specialty: '', institution: '' });
            setSearchQuery('');
            setSearchResults([]);
            setError(null);
            setSuccessMessage(null);
            setActiveTab('register');

            // Allow fetch
            // For now, let's direct fetch or use a known shared config if possible.
            // Since I edited mockData.js, I need to make sure I can access it.
            // I'll try to add a temporary fetcher here or use `api` if I can find the endpoint.
            // I'll add `api.config` to api.js if missing in next step. For now I'll write the logic assuming it exists or I'll add it.
        }
    }, [isOpen]);

    // Fetch config on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // Use a safe fallback or valid API
                const data = await api.system.getConfig(); // I'll add this to api.js
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


    if (!isOpen) return null;

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const fullName = `${formData.name} ${formData.lastName}`.trim();
            await api.jurors.create({
                ...formData,
                name: fullName,
                firstName: formData.name,
                lastName: formData.lastName
            });

            setSuccessMessage("Jurado registrado correctamente");
            setTimeout(() => {
                onUpdate();
                onClose();
            }, 1000);
        } catch (err) {
            console.error("Error adding juror:", err);
            setError(err.message || "Error al agregar jurado");
        } finally {
            setLoading(false);
        }
    };

    const handleAddExisting = async (user) => {
        setLoading(true);
        setError(null);
        try {
            // Check if already a juror just in case logic missed it
            const roles = user.eventRoles || [];
            if (roles.includes('jurado')) {
                setError("Este usuario ya es jurado.");
                setLoading(false);
                return;
            }

            await api.jurors.create({
                email: user.email,
                specialty: user.specialty, // Keep existing or update? create handles this
                institution: user.institution
            });

            setSuccessMessage(`Rol de jurado asignado a ${user.name}`);
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

    // Helper to check if user is already a juror
    const isJuror = (user) => {
        const roles = user.eventRoles || [];
        return roles.some(r => r.toLowerCase() === 'jurado');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-blue-600 px-6 py-4 flex justify-between items-center shrink-0">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <UserPlus size={20} />
                        Gestión de Jurados
                    </h3>
                    <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 shrink-0">
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'register' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('register')}
                    >
                        Registrar Nuevo
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'search' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
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
                                    <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 border border-blue-100 mb-4">
                                        <p>Se creará una cuenta de usuario nueva para esta persona.</p>
                                        <p className="mt-1 font-medium">Contraseña por defecto: 123456</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                placeholder="Ej. Perez"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                required
                                                type="email"
                                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="correo@ejemplo.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ocupación</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <select
                                                required
                                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                                                value={formData.specialty}
                                                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                            >
                                                <option value="">Seleccione una ocupación</option>
                                                {config.occupations?.map((opt, idx) => (
                                                    <option key={idx} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Institución</label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <select
                                                required
                                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                                                value={formData.institution}
                                                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                            >
                                                <option value="">Seleccione una institución</option>
                                                {config.institutions?.map((opt, idx) => (
                                                    <option key={idx} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3 justify-end">
                                        <Button type="button" variant="outline" onClick={onClose}>
                                            Cancelar
                                        </Button>
                                        <Button type="submit" disabled={loading}>
                                            {loading ? 'Guardando...' : 'Crear Cuenta Jurado'}
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
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
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
                                                    const alreadyJuror = isJuror(user);
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

                                                            {alreadyJuror ? (
                                                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 flex items-center gap-1">
                                                                    <CheckCircle size={10} /> Ya es jurado
                                                                </span>
                                                            ) : (
                                                                <Button
                                                                    size="xs"
                                                                    onClick={() => handleAddExisting(user)}
                                                                    disabled={loading}
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

export default AddJurorModal;
