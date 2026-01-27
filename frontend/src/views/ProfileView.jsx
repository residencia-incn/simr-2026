import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Building, Save, Shield, CreditCard, FileText, Camera, Trash2, Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Ticket, Laptop, Smartphone, Globe, LogOut, Upload, Briefcase } from 'lucide-react';
import { Card, Button, FormField, SectionHeader, StyledDatePicker } from '../components/ui';
import { useForm, useFileUpload, useApi } from '../hooks';
import QRCode from 'react-qr-code';
import AttendanceScanner from '../components/common/AttendanceScanner';
import { api } from '../services/api';
import { showConfirm, showSuccess } from '../utils/alerts';
import { UserAvatar } from '../components/common/UserAvatar';
import ProfileUpgrades from '../components/profile/ProfileUpgrades';

const ProfileView = ({ user, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState(null);
    const [passwordMessage, setPasswordMessage] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'attendance'
    const [showScanner, setShowScanner] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [currentPage, setCurrentPage] = useState(1); // Added for pagination
    const [isDownloadsActive, setIsDownloadsActive] = useState(false);

    // Session & Device Management Logic
    const [sessionData, setSessionData] = useState({
        current: null,
        others: [
            { id: 1, device: 'iPhone 13 Pro', location: 'Lima, Peru', ip: '190.234.112.45', lastActive: 'Hace 2 horas', type: 'mobile' },
            { id: 2, device: 'MacBook Air', location: 'Arequipa, Peru', ip: '181.65.200.12', lastActive: 'Hace 1 día', type: 'desktop' }
        ],
        history: [
            { id: 101, device: 'Windows PC (Chrome)', location: 'Lima, Peru', ip: '190.234.xxx.xx', time: 'Hoy, 10:45 AM', status: 'active' },
            { id: 102, device: 'iPhone 13 Pro', location: 'Lima, Peru', ip: '190.234.xxx.xx', time: 'Ayer, 08:30 PM', status: 'success' },
            { id: 103, device: 'Windows PC (Firefox)', location: 'Trujillo, Peru', ip: '179.12.xxx.xx', time: '02 Ene, 03:15 PM', status: 'success' }
        ]
    });
    const [loadingLocation, setLoadingLocation] = useState(false);

    useEffect(() => {
        if (activeTab === 'devices') {
            const fetchLocation = async () => {
                setLoadingLocation(true);
                try {
                    const res = await fetch('https://ipapi.co/json/');
                    const data = await res.json();

                    // Simple UA parser (mock)
                    const ua = navigator.userAgent;
                    let deviceType = 'desktop';
                    let deviceName = 'Este Dispositivo';

                    if (/mobile/i.test(ua)) {
                        deviceType = 'mobile';
                        deviceName = 'Dispositivo Móvil';
                    }
                    if (/Mac/i.test(ua)) deviceName = 'Mac/iOS Device';
                    if (/Android/i.test(ua)) deviceName = 'Android Device';
                    if (/Windows/i.test(ua)) deviceName = 'Windows PC';

                    setSessionData(prev => ({
                        ...prev,
                        current: {
                            ip: data.ip,
                            city: data.city,
                            region: data.region,
                            country: data.country_name,
                            device: deviceName,
                            type: deviceType,
                            browser: 'Navegador Actual'
                        }
                    }));
                } catch (error) {
                    console.error("Failed to fetch location", error);
                    setSessionData(prev => ({
                        ...prev,
                        current: {
                            ip: 'No disponible',
                            location: 'Ubicación desconocida',
                            device: 'Este dispositivo',
                            type: 'desktop'
                        }
                    }));
                } finally {
                    setLoadingLocation(false);
                }
            };
            fetchLocation();
        }
    }, [activeTab]);

    const handleRevokeSession = (id) => {
        setSessionData(prev => ({
            ...prev,
            others: prev.others.filter(s => s.id !== id)
        }));
        showSuccess('La sesión ha sido cerrada correctamente.', 'Dispositivo desconectado');
    };

    // Fetch attendance history
    const { execute: loadHistory } = useApi(async () => {
        if (user?.id) {
            const history = await api.attendance.getUserHistory(user.id);
            setAttendanceHistory(history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        }
    });

    // Handle initial tab from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && ['personal', 'attendance', 'upgrades', 'devices'].includes(tab)) {
            setActiveTab(tab);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'attendance') {
            loadHistory();
            const checkConfig = async () => {
                const config = await api.content.getConfig();
                setIsDownloadsActive(config?.certificatesActivated || false);
            };
            checkConfig();
        }
    }, [activeTab, user]);

    // Password Form State
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Image handling
    const [currentImage, setCurrentImage] = useState(user?.image || null);

    // DNI Upload removed per user request
    const {
        file,
        preview: imagePreview,
        handleFileChange,
        clear,
        convertToBase64
    } = useFileUpload({
        acceptedTypes: ['image/jpeg', 'image/png', 'image/gif'],
        maxSize: 2 * 1024 * 1024 // 2MB
    });

    const countries = [
        "Perú", "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Ecuador", "México", "Paraguay", "Uruguay", "Venezuela", "Estados Unidos", "España", "Otro"
    ];

    const [participantSpecialties, setParticipantSpecialties] = useState([]);
    const [institutions, setInstitutions] = useState([]);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const config = await api.content.getConfig();
                // Specialties
                const specialitiesList = config?.participantSpecialties ||
                    ["Neurología", "Neurocirugía", "Psiquiatría", "Medicina Interna", "Pediatría", "Medicina Intensiva", "Otro"];
                setParticipantSpecialties(specialitiesList);

                // Institutions
                const institutionsList = config?.institutions || [];
                setInstitutions(institutionsList);
            } catch (error) {
                console.error("Error loading config:", error);
                setParticipantSpecialties(["Neurología", "Neurocirugía", "Psiquiatría", "Medicina Interna", "Pediatría", "Medicina Intensiva", "Otro"]);
                setInstitutions([]);
            }
        };
        fetchConfig();
    }, []);

    const { values: form, handleChange, setValues } = useForm({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        institution: user?.institution || '',
        dni: user?.dni || '',
        cmp: user?.cmp || '',
        rne: user?.rne || '',
        specialty: user?.specialty || '', // Added specialty
        birthDate: user?.birthDate || '',
        gender: user?.gender || 'unspecified',
        occupation: user?.occupation || '', // Added occupation
        residencyYear: user?.residencyYear || '', // Added residencyYear
        country: user?.country || 'Perú', // Added country with default
    }, null, 'user_profile_draft');

    useEffect(() => {
        if (user) {
            // Auto-split name mechanism if specific fields are missing
            let derivedFirstName = user.firstName || '';
            let derivedLastName = user.lastName || '';

            if ((!derivedFirstName || !derivedLastName) && user.name) {
                const parts = user.name.trim().split(/\s+/);
                if (parts.length === 1) {
                    derivedFirstName = parts[0];
                } else if (parts.length >= 2) {
                    // Start with basic assumption: First word is First Name, rest is Last Name
                    // This is a heuristic fallback. User should correct it if wrong.
                    derivedFirstName = parts[0];
                    derivedLastName = parts.slice(1).join(' ');
                }
            }

            setValues({
                firstName: derivedFirstName,
                lastName: derivedLastName,
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                institution: user.institution || '',
                dni: user.dni || '',
                cmp: user.cmp_number || user.cmp || '',
                rne: user.rne_number || user.rne || '',
                specialty: user.specialty || '',
                birthDate: user.birthDate || '',
                gender: user.gender || 'unspecified',
                occupation: user.occupation || '',
                residencyYear: user.residencyYear || '', // Added residencyYear
                country: user.country || '', // Leave empty to force selection if not set (default was 'Perú' but maybe we want validation)
            });
            setCurrentImage(user.image || null);
        }
    }, [user, setValues]);

    const handleRemoveImage = async () => {
        const result = await showConfirm(
            'Esta acción no se puede deshacer.',
            '¿Estás seguro de que quieres eliminar tu foto de perfil?'
        );

        if (result.isConfirmed) {
            setCurrentImage(null);
            clear();
            // Immediately update the parent component to sync across the app
            if (onSave) {
                onSave({ ...user, image: null });
            }
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
            return;
        }

        // Mock API call
        console.log("Changing password...", passwordForm);

        // Simulate success
        setTimeout(() => {
            setPasswordMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }, 800);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        // Sync name field from firstName and lastName for backward compatibility
        const fullName = `${form.lastName} ${form.firstName}`.trim();

        // Handle Profile Image conversion
        let imageBase64 = currentImage; // Default to current image
        if (file) {
            try {
                imageBase64 = await convertToBase64(file);
            } catch (error) {
                setMessage({ type: 'error', text: 'Error al procesar la imagen de perfil.' });
                return;
            }
        }

        // Map frontend fields back to backend expectations (snake_case)
        const mappedForm = {
            ...form,
            cmp_number: form.cmp,
            rne_number: form.rne,
            // residencyYear matches backend (camelCase)
        };

        // Preserve all existing user data and only update changed fields
        const updatedProfile = {
            ...user, // Preserve all existing user data (id, roles, profiles, etc.)
            ...mappedForm, // Update form fields (firstName, lastName, email, phone, institution, etc.)
            name: fullName, // Sync combined name field
            image: imageBase64 || null
        };

        try {
            // Call API to update the user in the database
            await api.users.update(updatedProfile);

            setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
            setIsEditing(false);

            // Call parent handler if provided to update context/state
            if (onSave) onSave(updatedProfile);

            // Update currentImage to reflect the saved state
            if (imagePreview) {
                setCurrentImage(imagePreview);
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: error.message || 'Error al guardar el perfil.' });
        }
    };

    const handleScanSuccess = async (data) => {
        setShowScanner(false);
        try {
            // Verify if it's a valid day token
            const isValid = await api.attendance.verifyDayToken(data);

            if (isValid) {
                await api.attendance.record(user.id, 'entry', new Date().toISOString(), 'self_scan');
                setMessage({ type: 'success', text: '¡Asistencia registrada correctamente!' });
                loadHistory();
            } else {
                setMessage({ type: 'error', text: 'Código QR inválido o expirado.' });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Error al registrar asistencia.' });
        }
    };


    const isFieldEmpty = (fieldName) => {
        // Required fields
        const required = ['firstName', 'lastName', 'dni', 'email', 'phone', 'gender', 'country'];
        if (!required.includes(fieldName)) return false;

        const val = form[fieldName];
        return !val || val === '' || val === 'unspecified';
    };

    const getFieldClass = (fieldName) => {
        const baseClass = "w-full p-2.5 rounded-lg border focus:ring-2 outline-none transition-all";
        if (isFieldEmpty(fieldName) && isEditing) {
            return `${baseClass} border-red-500 bg-red-50 focus:ring-red-200 text-red-900 placeholder:text-red-300`;
        }
        return `${baseClass} border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-gray-900`;
    };

    return (
        <div className="animate-fadeIn max-w-4xl mx-auto space-y-6">
            <SectionHeader title="Mi Perfil" subtitle="Administra tu información personal, profesional y asistencia." />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 mb-6 flex-wrap">
                <button
                    onClick={() => setActiveTab('personal')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'personal'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Información Personal
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'attendance'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Asistencia y QR
                </button>
                <button
                    onClick={() => setActiveTab('upgrades')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'upgrades'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Inscripciones y Talleres
                </button>
                <button
                    onClick={() => setActiveTab('devices')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'devices'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Mis Dispositivos
                </button>
            </div>

            {showScanner && (
                <AttendanceScanner
                    onScan={handleScanSuccess}
                    onClose={() => setShowScanner(false)}
                />
            )}

            <div className="grid md:grid-cols-3 gap-6">
                {/* Sidebar / Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="p-6 text-center border-t-4 border-t-blue-600 relative overflow-hidden group">
                        <div className="mx-auto w-32 h-32 relative mb-4">
                            {/* Image Container */}
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg bg-blue-100 flex items-center justify-center">
                                {imagePreview || currentImage ? (
                                    <img
                                        src={imagePreview || currentImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <UserAvatar
                                        image={null}
                                        gender={form.gender || user?.gender || 'unspecified'}
                                        name={user?.name}
                                        size={64}
                                    />
                                )}
                            </div>

                            {/* Edit Overlay */}
                            {isEditing && (
                                <>
                                    <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10">
                                        <div className="text-white flex flex-col items-center gap-1">
                                            <Camera size={24} />
                                            <span className="text-xs font-medium">Cambiar</span>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>

                                    {(imagePreview || currentImage) && (
                                        <button
                                            onClick={handleRemoveImage}
                                            className="absolute bottom-0 right-0 p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm z-20 border-2 border-white"
                                            title="Eliminar foto"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{user?.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{user?.role || 'Usuario'}</p>

                        <div className="border-t border-gray-100 pt-4 text-left space-y-3">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Mail size={16} className="text-gray-400" />
                                <span className="truncate" title={user?.email}>{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Building size={16} className="text-gray-400" />
                                <span className="truncate">{user?.institution || 'Sin institución'}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Roles Card */}
                    {user?.roles && user.roles.length > 0 && (
                        <Card className="p-4">
                            <h4 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
                                <Shield size={16} className="text-blue-500" />
                                Roles Asignados
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {user.roles.map(role => (
                                    <span key={role} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100 font-medium capitalize">
                                        {role}
                                    </span>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-2 space-y-6">
                    {/* Personal Info Tab */}
                    {activeTab === 'personal' && (
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                    <FileText size={20} className="text-blue-600" />
                                    Información Personal
                                </h3>
                                {!isEditing ? (
                                    <Button onClick={() => setIsEditing(true)}>
                                        Editar Información
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button variant="ghost" onClick={() => { setIsEditing(false); setMessage(null); }}>
                                            Cancelar
                                        </Button>
                                        <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                                            <Save size={18} className="mr-2" />
                                            Guardar Cambios
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {message && (
                                <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name Row */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField label="Apellidos" required>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={form.lastName}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className={getFieldClass('lastName')}
                                            placeholder="Tus apellidos completos"
                                        />
                                        {isEditing && isFieldEmpty('lastName') && (
                                            <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                                                <AlertTriangle size={12} /> Completar este campo
                                            </p>
                                        )}
                                    </FormField>

                                    <FormField label="Nombres" required>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={form.firstName}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className={getFieldClass('firstName')}
                                            placeholder="Tus nombres completos"
                                        />
                                        {isEditing && isFieldEmpty('firstName') && (
                                            <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                                                <AlertTriangle size={12} /> Completar este campo
                                            </p>
                                        )}
                                    </FormField>
                                </div>

                                {/* Birth Date & DNI Row */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <StyledDatePicker
                                        selected={form.birthDate ? new Date(form.birthDate) : null}
                                        onChange={(date) => {
                                            // Handle date clearing or selection
                                            setValues(prev => ({
                                                ...prev,
                                                birthDate: date ? date.toISOString() : ''
                                            }));
                                        }}
                                        disabled={!isEditing}
                                        className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:bg-gray-50"
                                        placeholderText="dd/mm/aaaa"
                                        dateFormat="dd/MM/yyyy"
                                        label="Fecha de Nacimiento"
                                        name="birthDate"
                                        readOnly={!isEditing}
                                    />

                                    <FormField
                                        label="DNI"
                                        name="dni"
                                        value={form.dni}
                                        onChange={handleChange}
                                        readOnly={!isEditing}
                                        className={!isEditing ? "bg-gray-100 opacity-75 cursor-not-allowed w-full" : "bg-white w-full"}
                                        subLabel={!isEditing ? "(No editable)" : ""}
                                    />

                                    <FormField
                                        label="Correo Electrónico"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        readOnly={!isEditing}
                                        required
                                    />

                                    <FormField
                                        label="Teléfono / Celular"
                                        name="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setValues(prev => ({ ...prev, phone: val }));
                                        }}
                                        readOnly={!isEditing}
                                        placeholder="Ej. 987654321"
                                    />

                                    {/* Gender */}
                                    <FormField label="Sexo">
                                        <div className="relative">
                                            <select
                                                name="gender"
                                                value={form.gender}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none ${!isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                                            >
                                                <option value="unspecified">No Especifica</option>
                                                <option value="male">Masculino</option>
                                                <option value="female">Femenino</option>
                                            </select>
                                            <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                            </div>
                                        </div>
                                    </FormField>

                                    {/* Country Field */}
                                    <FormField label="País">
                                        <div className="relative">
                                            <select
                                                name="country"
                                                value={form.country}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none ${!isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                                            >
                                                {countries.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                            </div>
                                        </div>
                                    </FormField>
                                </div>


                                {/* SECTION 2: Datos Profesionales */}
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                                        <Briefcase size={18} className="text-blue-600" />
                                        Información Profesional
                                    </h4>

                                    <div className="grid md:grid-cols-2 gap-5 mb-5">
                                        {/* Occupation Field - First choice drives the rest */}
                                        <div className="md:col-span-2">
                                            <FormField label="Ocupación / Cargo">
                                                <div className="relative">
                                                    <select
                                                        name="occupation"
                                                        value={form.occupation}
                                                        onChange={handleChange}
                                                        disabled={!isEditing}
                                                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none ${!isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                                                    >
                                                        <option value="">Seleccione...</option>
                                                        <option value="Médico Especialista">Médico Especialista</option>
                                                        <option value="Médico Residente">Médico Residente</option>
                                                        <option value="Médico General">Médico General</option>
                                                        <option value="Estudiante de Medicina">Estudiante de Medicina</option>
                                                        <option value="Otro">Otro Profesional de la Salud</option>
                                                    </select>
                                                    <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                                    </div>
                                                </div>
                                            </FormField>
                                        </div>

                                        {/* Institution Field - Always visible but smart label */}
                                        <div className="md:col-span-2">
                                            <FormField label={form.occupation === 'Estudiante de Medicina' ? "Universidad / Institución" : "Institución / Hospital"}>
                                                <div className="relative">
                                                    <input
                                                        list="institutions-list"
                                                        name="institution"
                                                        value={form.institution}
                                                        onChange={handleChange}
                                                        readOnly={!isEditing}
                                                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${!isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                                                        placeholder={form.occupation === 'Estudiante de Medicina' ? "Ej. Universidad Nacional Mayor de San Marcos" : "Ej. Instituto Nacional de Ciencias Neurológicas"}
                                                    />
                                                    <datalist id="institutions-list">
                                                        {institutions.map((inst, index) => (
                                                            <option key={index} value={inst} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                            </FormField>
                                        </div>

                                        {/* Smart Fields Logic */}
                                        {/* 1. Specialty: For Especialistas and Residentes */}
                                        {(form.occupation === 'Médico Especialista' || form.occupation === 'Médico Residente') && (
                                            <div className="md:col-span-2">
                                                <FormField label="Especialidad">
                                                    <div className="relative">
                                                        <select
                                                            name="specialty"
                                                            value={form.specialty}
                                                            onChange={handleChange}
                                                            disabled={!isEditing}
                                                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none ${!isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                                                        >
                                                            <option value="">Seleccione...</option>
                                                            {participantSpecialties.map((spec, index) => (
                                                                <option key={index} value={spec}>{spec}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                                        </div>
                                                    </div>
                                                </FormField>
                                            </div>
                                        )}

                                        {/* 2. CMP: For all Doctors (Especialista, Residente, General) */}
                                        {(form.occupation === 'Médico Especialista' || form.occupation === 'Médico Residente' || form.occupation === 'Médico General') && (
                                            <FormField
                                                label="CMP"
                                                name="cmp"
                                                value={form.cmp}
                                                onChange={handleChange}
                                                readOnly={!isEditing}
                                                className={!isEditing ? "bg-gray-100 opacity-75 cursor-not-allowed" : "bg-white"}
                                                placeholder="12345"
                                            />
                                        )}

                                        {/* 3. RNE: Only for Especialistas */}
                                        {form.occupation === 'Médico Especialista' && (
                                            <FormField
                                                label="RNE"
                                                name="rne"
                                                value={form.rne}
                                                onChange={handleChange}
                                                readOnly={!isEditing}
                                                placeholder="54321"
                                            />
                                        )}

                                        {/* 4. Residency Year: Only for Residentes */}
                                        {form.occupation === 'Médico Residente' && (
                                            <div>
                                                <FormField label="Año de Residencia">
                                                    <div className="relative">
                                                        <select
                                                            name="residencyYear"
                                                            value={form.residencyYear || ''}
                                                            onChange={handleChange}
                                                            disabled={!isEditing}
                                                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none ${!isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                                                        >
                                                            <option value="">Seleccione...</option>
                                                            <option value="R1">R1</option>
                                                            <option value="R2">R2</option>
                                                            <option value="R3">R3</option>
                                                            <option value="R4">R4</option>
                                                            <option value="R5">R5</option>
                                                        </select>
                                                        <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                                        </div>
                                                    </div>
                                                </FormField>
                                            </div>
                                        )}
                                    </div>

                                    {(form.occupation === 'Médico Especialista' || form.occupation === 'Médico Residente' || form.occupation === 'Médico General') && (
                                        <p className="text-xs text-gray-400 mt-2 ml-1 flex items-center gap-1">
                                            <Shield size={12} />
                                            Para modificar los datos de colegiatura certificados, contacte con el administrador.
                                        </p>
                                    )}
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end pt-4 border-t">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 gap-2">
                                            <Save size={18} />
                                            Guardar Cambios
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </Card>
                    )}
                    {activeTab === 'attendance' && (
                        <div className="md:col-span-2 space-y-6">
                            {/* Attendance Progress Card */}
                            <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100">
                                <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                                    <Camera size={20} className="text-blue-600" />
                                    Progreso de Asistencia
                                </h3>

                                {/* Progress Bar */}
                                <div className="mb-6">
                                    {(() => {
                                        // Mock attendance calculation - replace with actual data
                                        const totalSessions = 10;
                                        const attendedSessions = attendanceHistory.length;
                                        const attendancePercentage = totalSessions > 0
                                            ? Math.round((attendedSessions / totalSessions) * 100)
                                            : 0;
                                        const meetsRequirement = attendancePercentage >= 60;

                                        return (
                                            <>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Asistencia Total
                                                    </span>
                                                    <span className={`text-2xl font-bold ${meetsRequirement ? 'text-green-600' : 'text-orange-600'}`}>
                                                        {attendancePercentage}%
                                                    </span>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${meetsRequirement
                                                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                                                            : 'bg-gradient-to-r from-orange-400 to-orange-500'
                                                            }`}
                                                        style={{ width: `${attendancePercentage}%` }}
                                                    />
                                                    {/* 60% marker */}
                                                    <div
                                                        className="absolute top-0 h-full w-0.5 bg-gray-400"
                                                        style={{ left: '60%' }}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                                    <span>{attendedSessions} de {totalSessions} sesiones</span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="inline-block w-0.5 h-3 bg-gray-400"></span>
                                                        60% requerido
                                                    </span>
                                                </div>

                                                {/* Requirement Notice */}
                                                <div className={`mt-4 p-4 rounded-lg border ${meetsRequirement
                                                    ? 'bg-green-50 border-green-200 text-green-800'
                                                    : 'bg-orange-50 border-orange-200 text-orange-800'
                                                    }`}>
                                                    <p className="text-sm font-medium flex items-center gap-2">
                                                        {meetsRequirement ? (
                                                            <>
                                                                <CheckCircle size={16} />
                                                                ¡Felicidades! Cumples con el requisito de asistencia para obtener tu certificación.
                                                            </>
                                                        ) : (
                                                            <>
                                                                <AlertTriangle size={16} />
                                                                Requieres 60% de asistencia para obtener tu certificación. Sigue asistiendo a las sesiones.
                                                            </>
                                                        )}
                                                    </p>
                                                </div>

                                                {/* Justification Request Section */}
                                                {!meetsRequirement && (
                                                    <div className="mt-4 p-4 rounded-lg bg-orange-50 border border-orange-200">
                                                        <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                                                            <FileText size={16} />
                                                            Justificación de Inasistencia
                                                        </h4>

                                                        {user?.justificationStatus === 'pending' ? (
                                                            <div className="text-sm text-orange-800 bg-orange-100 p-3 rounded-lg border border-orange-200">
                                                                <p className="font-semibold">Solicitud Enviada</p>
                                                                <p className="opacity-90 mt-1">Tu justificación está siendo revisada por el comité académico.</p>
                                                            </div>
                                                        ) : user?.justificationStatus === 'approved' ? (
                                                            <div className="text-sm text-green-800 bg-green-100 p-3 rounded-lg border border-green-200 flex items-center gap-2">
                                                                <CheckCircle size={16} />
                                                                <span>Tu justificación ha sido aceptada. Se considera cumplido el requisito de asistencia.</span>
                                                            </div>
                                                        ) : isDownloadsActive ? (
                                                            <div className="text-sm text-red-800 bg-red-50 p-3 rounded-lg border border-red-200 flex items-center gap-2">
                                                                <Lock size={16} />
                                                                <span>El plazo para enviar justificaciones ha finalizado.</span>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                <p className="text-sm text-orange-800">
                                                                    Si tienes una razón válida para tu baja asistencia, puedes enviar una justificación para su evaluación.
                                                                </p>
                                                                {!isEditing ? (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="bg-white border-orange-300 text-orange-800 hover:bg-orange-100"
                                                                        onClick={() => setIsEditing(true)}
                                                                    >
                                                                        Redactar Justificación
                                                                    </Button>
                                                                ) : (
                                                                    <div className="space-y-3">
                                                                        <textarea
                                                                            className="w-full p-3 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                                                            rows="3"
                                                                            placeholder="Describe brevemente el motivo de tu inasistencia..."
                                                                            value={form.justification || ''}
                                                                            onChange={(e) => setValues(prev => ({ ...prev, justification: e.target.value }))}
                                                                        ></textarea>
                                                                        <div className="flex gap-2 justify-end">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => setIsEditing(false)}
                                                                                className="text-gray-600"
                                                                            >
                                                                                Cancelar
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                                                                onClick={() => {
                                                                                    // Simulate submission
                                                                                    console.log("Submitting justification:", form.justification);
                                                                                    showSuccess('Tu solicitud será revisada por el comité académico.', 'Justificación enviada');
                                                                                    setIsEditing(false);
                                                                                    // Ideally update local user state to show 'pending' status immediately
                                                                                    if (onSave) onSave({ ...user, justificationStatus: 'pending', justification: form.justification });
                                                                                }}
                                                                            >
                                                                                Enviar Solicitud
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Certificate Download Button */}
                                                <div className="mt-6 pt-6 border-t border-gray-200">
                                                    <h4 className="font-bold text-gray-900 mb-3">Certificado de Participación</h4>
                                                    {meetsRequirement && user?.paymentVerified ? (
                                                        <Button
                                                            className="w-full bg-green-600 hover:bg-green-700 justify-center gap-2"
                                                            onClick={() => showSuccess('Tu certificado se descargará en breve.', 'Descargando certificado')}
                                                        >
                                                            <FileText size={18} />
                                                            Descargar Certificado
                                                        </Button>
                                                    ) : (
                                                        <div>
                                                            <Button
                                                                disabled
                                                                className="w-full bg-gray-300 text-gray-500 cursor-not-allowed justify-center gap-2"
                                                            >
                                                                <Lock size={18} />
                                                                Certificado Bloqueado
                                                            </Button>
                                                            <p className="text-xs text-gray-500 mt-2 text-center">
                                                                {!meetsRequirement && !user?.paymentVerified
                                                                    ? 'Requieres 60% de asistencia y pago verificado'
                                                                    : !meetsRequirement
                                                                        ? 'Requieres 60% de asistencia'
                                                                        : 'Requieres pago verificado'
                                                                }
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </Card>

                            {/* QR Code Card */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                        <Camera size={20} className="text-blue-600" />
                                        Mi Código QR
                                    </h3>
                                    <Button onClick={() => setShowScanner(true)}>
                                        <Camera size={18} className="mr-2" />
                                        Escanear QR del Evento
                                    </Button>
                                </div>

                                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 mb-6">
                                    <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                                        <QRCode
                                            value={JSON.stringify({ id: user?.id, name: user?.name, role: user?.role })}
                                            size={200}
                                            level="H"
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500 text-center max-w-xs">
                                        Presenta este código QR al ingresar al evento para registrar tu asistencia automáticamente.
                                    </p>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <h4 className="font-bold text-gray-900 mb-4">Historial de Asistencia</h4>

                                    {attendanceHistory.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                            No hay registros de asistencia aún.
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-gray-50 text-gray-700 font-medium">
                                                        <tr>
                                                            <th className="p-3">Fecha y Hora</th>
                                                            <th className="p-3">Tipo</th>
                                                            <th className="p-3">Método</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">

                                                        {/* Using slice based on top-level state I will add */}
                                                        {attendanceHistory.slice((currentPage - 1) * 10, currentPage * 10).map((record) => (
                                                            <tr key={record.id} className="hover:bg-gray-50">
                                                                <td className="p-3 text-gray-900">
                                                                    {new Date(record.timestamp).toLocaleString('es-PE')}
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.type === 'entry'
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-orange-100 text-orange-700'
                                                                        }`}>
                                                                        {record.type === 'entry' ? 'Entrada' : 'Salida'}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 text-gray-600">
                                                                    {record.method === 'self_scan' ? 'Auto-escaneo' : 'Staff'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination Controls */}
                                            {Math.ceil(attendanceHistory.length / 10) > 1 && (
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm text-gray-500">
                                                        Mostrando {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, attendanceHistory.length)} de {attendanceHistory.length}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                            disabled={currentPage === 1}
                                                            className="h-8 w-8 p-0 flex items-center justify-center"
                                                        >
                                                            &lt;
                                                        </Button>
                                                        {[...Array(Math.ceil(attendanceHistory.length / 10))].map((_, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => setCurrentPage(i + 1)}
                                                                className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                                    : 'text-gray-600 hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                {i + 1}
                                                            </button>
                                                        ))}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(attendanceHistory.length / 10)))}
                                                            disabled={currentPage === Math.ceil(attendanceHistory.length / 10)}
                                                            className="h-8 w-8 p-0 flex items-center justify-center"
                                                        >
                                                            &gt;
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Upgrades Tab Content */}
                    {activeTab === 'upgrades' && (
                        <div className="md:col-span-2 space-y-6">
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                        <Ticket size={20} className="text-blue-600" />
                                        Gestionar Inscripciones
                                    </h3>
                                </div>
                                <ProfileUpgrades />
                            </Card>
                        </div>
                    )}



                    {/* Devices Tab Content */}
                    {activeTab === 'devices' && (
                        <div className="md:col-span-2 space-y-6">
                            {/* Current Session */}
                            <Card className="p-6 border-l-4 border-l-green-500">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                        <Laptop size={20} className="text-green-600" />
                                        Sesión Actual
                                    </h3>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 animate-pulse">
                                        Activa Ahora
                                    </span>
                                </div>

                                {loadingLocation ? (
                                    <div className="text-center py-4 text-gray-500">Obteniendo información de ubicación...</div>
                                ) : sessionData.current ? (
                                    <div className="flex flex-col md:flex-row gap-6 items-center">
                                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                            {sessionData.current.type === 'mobile' ? <Smartphone size={32} /> : <Laptop size={32} />}
                                        </div>
                                        <div className="flex-grow space-y-1 text-center md:text-left">
                                            <p className="font-bold text-gray-900 text-lg">{sessionData.current.device}</p>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 justify-center md:justify-start">
                                                <span className="flex items-center gap-1"><Globe size={14} /> {sessionData.current.ip}</span>
                                                <span className="flex items-center gap-1"><MapPin size={14} /> {sessionData.current.city}, {sessionData.current.country}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Información no disponible.</p>
                                )}
                            </Card>

                            {/* Active Sessions */}
                            <Card className="p-6">
                                <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                    <Shield size={20} className="text-blue-600" />
                                    Otras Sesiones Activas
                                </h3>

                                <div className="space-y-4">
                                    {sessionData.others.map(session => (
                                        <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 border border-gray-200">
                                                    {session.type === 'mobile' ? <Smartphone size={20} /> : <Laptop size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{session.device}</p>
                                                    <p className="text-xs text-gray-500">{session.location} • {session.ip} • {session.lastActive}</p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => handleRevokeSession(session.id)}
                                            >
                                                <LogOut size={16} className="mr-2" /> Cerrar Sesión
                                            </Button>
                                        </div>
                                    ))}
                                    {sessionData.others.length === 0 && (
                                        <p className="text-gray-500 text-sm italic">No tienes otras sesiones activas.</p>
                                    )}
                                </div>
                            </Card>

                            {/* History */}
                            <Card className="p-6">
                                <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText size={20} className="text-gray-600" />
                                    Historial de Accesos
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                                            <tr>
                                                <th className="p-3">Dispositivo</th>
                                                <th className="p-3">Ubicación</th>
                                                <th className="p-3">IP</th>
                                                <th className="p-3">Fecha</th>
                                                <th className="p-3">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {sessionData.history.map(log => (
                                                <tr key={log.id}>
                                                    <td className="p-3 font-medium text-gray-900">{log.device}</td>
                                                    <td className="p-3 text-gray-500">{log.location}</td>
                                                    <td className="p-3 text-gray-500 font-mono text-xs">{log.ip}</td>
                                                    <td className="p-3 text-gray-500">{log.time}</td>
                                                    <td className="p-3">
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Exitoso</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ProfileView;
