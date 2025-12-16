import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Building, Save, Shield, CreditCard, FileText, Camera, Trash2, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, Button, FormField, SectionHeader } from '../components/ui';
import { useForm, useFileUpload, useApi } from '../hooks';
import QRCode from 'react-qr-code';
import AttendanceScanner from '../components/common/AttendanceScanner';
import { api } from '../services/api';

const ProfileView = ({ user, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState(null);
    const [passwordMessage, setPasswordMessage] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'attendance'
    const [showScanner, setShowScanner] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [currentPage, setCurrentPage] = useState(1); // Added for pagination

    // Fetch attendance history
    const { execute: loadHistory } = useApi(async () => {
        if (user?.id) {
            const history = await api.attendance.getUserHistory(user.id);
            setAttendanceHistory(history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        }
    });

    useEffect(() => {
        if (activeTab === 'attendance') {
            loadHistory();
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

    const {
        file: imageFile,
        preview: imagePreview,
        handleFileChange,
        clear: clearImage,
        base64: imageBase64
    } = useFileUpload({
        acceptedTypes: ['image/*'],
        maxSize: 5 * 1024 * 1024 // 5MB
    });

    const { values: form, handleChange, setValues } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        institution: user?.institution || '',
        dni: user?.dni || '',
        cmp: user?.cmp || '',
        rne: user?.rne || '',
    }, null, 'user_profile_draft');

    useEffect(() => {
        if (user) {
            setValues({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                institution: user.institution || '',
                dni: user.dni || '',
                cmp: user.cmp || '',
                rne: user.rne || '',
            });
            setCurrentImage(user.image || null);
        }
    }, [user, setValues]);

    const handleRemoveImage = () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) {
            setCurrentImage(null);
            clearImage();
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

        const updatedProfile = {
            ...form,
            image: imageBase64 || currentImage
        };

        // Here we would call an API to update the user
        // For now, we'll simulate a save and call the parent handler if provided

        console.log("Saving profile:", updatedProfile);

        // Simulate success
        setTimeout(() => {
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
            setIsEditing(false);
            if (onSave) onSave(updatedProfile);
        }, 800);
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

    return (
        <div className="animate-fadeIn max-w-4xl mx-auto space-y-6">
            <SectionHeader title="Mi Perfil" subtitle="Administra tu información personal, profesional y asistencia." />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 mb-6">
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
                                    <User size={64} className="text-blue-400" />
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

                {/* Attendance Tab Content */}
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

                                            {/* Certificate Download Button */}
                                            <div className="mt-6 pt-6 border-t border-gray-200">
                                                <h4 className="font-bold text-gray-900 mb-3">Certificado de Participación</h4>
                                                {meetsRequirement && user?.paymentVerified ? (
                                                    <Button
                                                        className="w-full bg-green-600 hover:bg-green-700 justify-center gap-2"
                                                        onClick={() => alert('Descargando certificado...')}
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

                {/* Personal Info Tab Content */}
                {activeTab === 'personal' && (
                    <div className="md:col-span-2 space-y-6">
                        <Card className="p-6">
                            {/* ... existing personal info form ... */}
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                    <FileText size={20} className="text-blue-600" />
                                    Información Personal
                                </h3>
                                {!isEditing ? (
                                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                                        Editar Información
                                    </Button>
                                ) : (
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="text-gray-500">
                                        Cancelar
                                    </Button>
                                )}
                            </div>

                            {message && (
                                <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {message.type === 'success' ? <div className="w-2 h-2 rounded-full bg-green-500"></div> : <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-5">
                                    <FormField
                                        label="Nombre Completo"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        readOnly={!isEditing}
                                        required
                                        className="md:col-span-2"
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
                                        onChange={handleChange}
                                        readOnly={!isEditing}
                                        placeholder="Ej. 987654321"
                                    />
                                    <FormField
                                        label="Institución"
                                        name="institution"
                                        value={form.institution}
                                        onChange={handleChange}
                                        readOnly={!isEditing}
                                        className="md:col-span-2"
                                    />
                                </div>

                                <div className="border-t border-gray-100 pt-6 mt-2">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <CreditCard size={18} className="text-gray-500" />
                                        Datos Profesionales
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid md:grid-cols-3 gap-4">
                                        <FormField
                                            label="DNI"
                                            name="dni"
                                            value={form.dni}
                                            readOnly={true}
                                            className="bg-gray-100 opacity-75 cursor-not-allowed"
                                            subLabel="(No editable)"
                                        />
                                        <FormField
                                            label="CMP"
                                            name="cmp"
                                            value={form.cmp}
                                            readOnly={true}
                                            className="bg-gray-100 opacity-75 cursor-not-allowed"
                                            subLabel="(No editable)"
                                        />
                                        <FormField
                                            label="RNE"
                                            name="rne"
                                            value={form.rne}
                                            readOnly={true}
                                            className="bg-gray-100 opacity-75 cursor-not-allowed"
                                            subLabel="(No editable)"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 ml-1">
                                        * Para modificar estos datos, por favor contacte con el administrador del sistema.
                                    </p>
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 gap-2">
                                            <Save size={18} />
                                            Guardar Cambios
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </Card>

                        {/* Change Password Section */}
                        <Card className="p-6 mt-6">
                            <div className="mb-6">
                                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                    <Lock size={20} className="text-blue-600" />
                                    Seguridad
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Actualiza tu contraseña para mantener tu cuenta segura.</p>
                            </div>

                            {passwordMessage && (
                                <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {passwordMessage.type === 'success' ? <div className="w-2 h-2 rounded-full bg-green-500"></div> : <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                                    {passwordMessage.text}
                                </div>
                            )}

                            <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                <div className="relative">
                                    <FormField
                                        label="Contraseña Actual"
                                        name="currentPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={passwordForm.currentPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Ingrese su contraseña actual"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-5">
                                    <FormField
                                        label="Nueva Contraseña"
                                        name="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={passwordForm.newPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                    <FormField
                                        label="Confirmar Nueva Contraseña"
                                        name="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={passwordForm.confirmPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Reingrese la nueva contraseña"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-sm text-gray-600 flex items-center gap-2 hover:text-blue-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        {showPassword ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
                                    </button>

                                    <Button
                                        type="submit"
                                        variant="outline"
                                        className="border-gray-300 hover:bg-gray-50 text-gray-700"
                                        disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                                    >
                                        Actualizar Contraseña
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileView;
