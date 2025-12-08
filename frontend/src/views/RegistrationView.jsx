import React, { useState, useEffect } from 'react';
import { FileText, Upload, FileCheck, X, DollarSign, CreditCard, Mail, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button, Card, SectionHeader, InfoIcon, Modal, FormField, Table } from '../components/ui';
import { api } from '../services/api';
import { useForm, useModal, useFileUpload, useApi } from '../hooks';
import { MOCK_INCN_RESIDENTS } from '../data/mockData';

const RegistrationView = () => {
    // Hooks
    const { isOpen: isCostsModalOpen, open: openCostsModal, close: closeCostsModal } = useModal();
    const { loading: isSubmitting, execute: submitRegistration } = useApi(api.registrations.add, false);
    const [config, setConfig] = useState(null);
    const [userType, setUserType] = useState('external'); // 'incn' or 'external'
    const [verifiedResident, setVerifiedResident] = useState(null);
    const [verificationDni, setVerificationDni] = useState('');
    const [wantsCertification, setWantsCertification] = useState(false);

    useEffect(() => {
        const loadConfig = async () => {
            const data = await api.content.getConfig();
            setConfig(data);
        };
        loadConfig();
    }, []);

    // File Upload Hook
    const {
        file: voucherFile,
        preview: voucherPreview,
        handleFileChange,
        clearFile: clearVoucher,
        base64: voucherBase64,
        fileInputRef
    } = useFileUpload({
        maxSize: 5 * 1024 * 1024,
        acceptedTypes: ['image/*', 'application/pdf']
    });

    // Form Hook
    const { values: form, handleChange, setValues, reset: resetForm } = useForm({
        dni: '',
        cmp: '',
        name: '',
        specialty: '',
        year: '',
        institution: '',
        email: '',
        phone: '',
        modalidad: 'Presencial',
        category: '' // New explicit category
    });

    const verifyINCNResident = () => {
        const resident = MOCK_INCN_RESIDENTS.find(r => r.dni === verificationDni);
        if (resident) {
            setVerifiedResident(resident);
            setValues({
                ...form,
                dni: resident.dni,
                name: resident.name,
                specialty: resident.specialty,
                year: resident.year,
                email: resident.email,
                institution: 'Instituto Nacional de Ciencias Neurológicas',
                modalidad: 'Presencial',
                category: 'resident_incn'
            });
        } else {
            alert('DNI no encontrado en el padrón de residentes INCN. Por favor verifique o regístrese como externo.');
            setVerifiedResident(null);
        }
    };

    const calculateAmount = () => {
        if (!config?.prices) return 0;

        // INCN Residents
        if (userType === 'incn') {
            return config.prices.incn || 50;
        }

        // External Logic
        const isPresencial = form.modalidad === 'Presencial';
        const isVirtual = form.modalidad === 'Virtual';

        if (isPresencial) {
            // Presencial is free unless certification is requested
            return wantsCertification ? (config.prices.certification || 50) : 0;
        }

        if (isVirtual) {
            // Virtual pricing based on explicit category
            switch (form.category) {
                case 'specialist':
                    return config.prices.specialist || 120;
                case 'external_resident':
                    return config.prices.external_resident || 80;
                case 'student':
                    return config.prices.student || 30;
                case 'other':
                    return config.prices.student || 30; // Assuming 'other' pays student rate or similar
                default:
                    return 0;
            }
        }

        return 0;
    };

    const amount = calculateAmount();
    const requiresPayment = amount > 0;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate voucher if payment is required
        if (requiresPayment && !voucherFile) {
            alert('Por favor adjunta tu voucher de pago para completar la inscripción.');
            return;
        }

        try {
            const registrationData = {
                ...form,
                amount,
                role: userType === 'incn' ? 'Residente INCN' : (form.year ? 'Residente Externo' : 'Asistente'),
                voucherData: requiresPayment ? voucherBase64 : null,
                wantsCertification: requiresPayment // Implicitly true if paying
            };

            const result = await submitRegistration(registrationData);

            if (result) {
                alert('¡Inscripción enviada exitosamente!');
                resetForm();
                clearVoucher();
                setVerifiedResident(null);
                setUserType('external');
                setWantsCertification(false);
            } else {
                alert('Hubo un error al guardar tu inscripción. Intenta nuevamente.');
            }
        } catch (error) {
            console.error(error);
            alert('Error al procesar el archivo o enviar los datos.');
        }
    };

    return (
        <div className="animate-fadeIn space-y-8 max-w-4xl mx-auto">
            <SectionHeader title="Inscripciones" subtitle="Regístrate para participar en el SIMR 2026." />

            {/* Type Selection */}
            <div className="grid md:grid-cols-2 gap-4">
                <div
                    onClick={() => { setUserType('incn'); setVerifiedResident(null); }}
                    className={`cursor-pointer p-6 rounded-xl border-2 transition-all flex items-center gap-4 ${userType === 'incn' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                >
                    <div className={`p-3 rounded-full ${userType === 'incn' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Soy Residente INCN</h3>
                        <p className="text-sm text-gray-500">Validación automática con DNI</p>
                    </div>
                </div>

                <div
                    onClick={() => { setUserType('external'); setVerifiedResident(null); resetForm(); }}
                    className={`cursor-pointer p-6 rounded-xl border-2 transition-all flex items-center gap-4 ${userType === 'external' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}
                >
                    <div className={`p-3 rounded-full ${userType === 'external' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Público General / Externo</h3>
                        <p className="text-sm text-gray-500">Médicos, Residentes de otros hospitales</p>
                    </div>
                </div>
            </div>

            {userType === 'incn' && (
                <Card className="p-6 border-blue-200 bg-blue-50/30">
                    <h3 className="font-bold text-blue-900 mb-4">Validación de Residente INCN</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Ingrese su DNI"
                            value={verificationDni}
                            onChange={(e) => setVerificationDni(e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <Button onClick={verifyINCNResident} className="bg-blue-700">Validar</Button>
                    </div>
                    {verifiedResident && (
                        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
                            <CheckCircle size={20} />
                            <span>Hola <strong>{verifiedResident.name}</strong>, sus datos han sido cargados.</span>
                        </div>
                    )}
                </Card>
            )}

            {(userType === 'external' || verifiedResident) && (
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card>
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><FileText className="text-blue-700" /> Ficha de Inscripción</h3>
                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <div className="grid md:grid-cols-2 gap-5">
                                    <FormField
                                        label="DNI / Pasaporte"
                                        name="dni"
                                        value={form.dni}
                                        onChange={handleChange}
                                        placeholder="Número de documento"
                                        required
                                        readOnly={!!verifiedResident}
                                    />
                                    <FormField
                                        label="N° CMP (Colegiatura)"
                                        name="cmp"
                                        value={form.cmp}
                                        onChange={handleChange}
                                        placeholder="Si aplica"
                                    />
                                </div>

                                <FormField
                                    label="Nombre Completo"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Apellidos y Nombres"
                                    required
                                    readOnly={!!verifiedResident}
                                />

                                <div className="grid md:grid-cols-2 gap-5">
                                    <FormField
                                        label="Especialidad / Profesión"
                                        name="specialty"
                                        value={form.specialty}
                                        onChange={handleChange}
                                        placeholder="Ej. Neurología, Estudiante..."
                                        required
                                        readOnly={!!verifiedResident}
                                    />
                                    <FormField
                                        label="Año de Residencia"
                                        name="year"
                                        type="select"
                                        value={form.year}
                                        onChange={handleChange}
                                        options={[
                                            { value: "", label: "No aplica" },
                                            { value: "R1", label: "R1" },
                                            { value: "R2", label: "R2" },
                                            { value: "R3", label: "R3" },
                                            { value: "R4", label: "R4" }
                                        ]}
                                        readOnly={!!verifiedResident}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-5">
                                    <FormField
                                        label="Categoría"
                                        name="category"
                                        type="select"
                                        value={form.category}
                                        onChange={handleChange}
                                        options={[
                                            { value: "", label: "Seleccione..." },
                                            { value: "specialist", label: "Médico Especialista" },
                                            { value: "external_resident", label: "Residente (Externo)" },
                                            { value: "student", label: "Estudiante / Interno" },
                                            { value: "other", label: "Otro Profesional Salud" }
                                        ]}
                                        required
                                        readOnly={!!verifiedResident}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-5">
                                    <FormField
                                        label="Modalidad"
                                        name="modalidad"
                                        type="select"
                                        value={form.modalidad}
                                        onChange={handleChange}
                                        options={config?.eventType === 'Híbrido' ? [
                                            { value: "Presencial", label: "Presencial" },
                                            { value: "Virtual", label: "Virtual" }
                                        ] : (config?.eventType === 'Virtual' ? [{ value: "Virtual", label: "Virtual" }] : [{ value: "Presencial", label: "Presencial" }])}
                                    />
                                    <FormField
                                        label="Institución Laboral / Universidad"
                                        name="institution"
                                        value={form.institution}
                                        onChange={handleChange}
                                        placeholder="Hospital, Clínica o Universidad"
                                        required
                                        readOnly={!!verifiedResident}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-5">
                                    <FormField
                                        label="Correo Electrónico"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        readOnly={!!verifiedResident}
                                    />
                                    <FormField
                                        label="Teléfono / Celular"
                                        name="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* External Presencial Logic */}
                                {userType === 'external' && form.modalidad === 'Presencial' && (
                                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="text-orange-500 mt-1" />
                                            <div>
                                                <h4 className="font-bold text-orange-900">Ingreso Libre</h4>
                                                <p className="text-sm text-orange-800 mb-3">El ingreso presencial al evento es gratuito.</p>

                                                <label className="flex items-center gap-3 bg-white p-3 rounded-lg border border-orange-200 cursor-pointer hover:border-orange-400 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={wantsCertification}
                                                        onChange={(e) => setWantsCertification(e.target.checked)}
                                                        className="w-5 h-5 text-orange-600 rounded"
                                                    />
                                                    <span className="text-gray-800 font-medium">Deseo obtener certificación CMP (Costo: S/. {config?.prices?.certification || 50})</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {requiresPayment && (
                                    <div className="pt-4 border-t border-gray-100 animate-fadeIn">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Cargar Voucher de Pago (S/. {amount}.00)
                                        </label>
                                        {!voucherPreview ? (
                                            <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors">
                                                <Upload className="text-gray-400 mb-2" size={32} />
                                                <span className="text-sm text-gray-600 font-medium">Clic para subir imagen o PDF</span>
                                                <span className="text-xs text-gray-400 mt-1">Máx. 5MB</span>
                                            </div>
                                        ) : (
                                            <div className="relative border border-gray-200 rounded-xl overflow-hidden p-2 bg-gray-50 flex items-center gap-4">
                                                <div className="h-16 w-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0"><FileCheck className="text-green-500" /></div>
                                                <div className="flex-grow"><p className="text-sm font-bold text-gray-800">Voucher cargado</p><p className="text-xs text-gray-500">Listo para enviar</p></div>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); clearVoucher(); }} className="p-2 hover:bg-red-100 text-red-500 rounded-full"><X size={18} /></button>
                                            </div>
                                        )}
                                        <input required={!voucherPreview} type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                                    </div>
                                )}

                                <div className="pt-2">
                                    <Button disabled={isSubmitting} type="submit" className="w-full justify-center text-lg h-12 bg-blue-700 hover:bg-blue-800">
                                        {isSubmitting ? 'Enviando...' : `Confirmar Inscripción ${requiresPayment ? `(S/. ${amount})` : '(Gratuita)'}`}
                                    </Button>
                                    {!requiresPayment && (
                                        <p className="text-center text-xs text-gray-500 mt-2">No se requiere pago para esta modalidad.</p>
                                    )}
                                </div>
                            </form>
                        </Card>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-700/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <h4 className="font-bold text-xl mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                                <div className="p-2 bg-blue-600/20 rounded-lg">
                                    <CreditCard size={20} className="text-blue-400" />
                                </div>
                                Resumen
                            </h4>
                            <ul className="space-y-4 text-sm text-slate-300">
                                <li className="flex justify-between items-center group">
                                    <span>Evento</span>
                                    <span className="font-bold text-white bg-white/10 px-3 py-1 rounded-full text-xs">{config?.eventAcronym || 'SIMR 2026'}</span>
                                </li>
                                <li className="flex justify-between items-center">
                                    <span>Modalidad</span>
                                    <span className="font-medium text-blue-200">{form.modalidad}</span>
                                </li>
                                <li className="flex justify-between items-center">
                                    <span>Tipo</span>
                                    <span className="font-medium text-white">{userType === 'incn' ? 'Residente INCN' : 'Externo'}</span>
                                </li>
                                <li className="flex justify-between items-center border-t border-white/10 pt-3 mt-2">
                                    <span className="text-lg font-bold text-white">Total a Pagar</span>
                                    <span className="text-2xl font-bold text-emerald-400">S/. {amount}.00</span>
                                </li>
                            </ul>

                            <Button onClick={openCostsModal} className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white border-0">
                                <InfoIcon size={16} className="mr-2" /> Ver Tarifario Completo
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {
                isCostsModalOpen && (
                    <Modal
                        isOpen={isCostsModalOpen}
                        onClose={closeCostsModal}
                        title="Tarifario 2026"
                        size="xl"
                    >
                        <div className="p-2">
                            <p className="text-blue-600 text-sm mb-4 text-center">Inversión para certificación y materiales</p>

                            <Table
                                columns={[
                                    { header: 'Categoría', key: 'category' },
                                    { header: 'Inversión', key: 'price', tdClassName: 'text-right font-bold text-blue-700' }
                                ]}
                                data={[
                                    { category: 'Residentes INCN', price: `S/. ${config?.prices?.incn || 50}.00` },
                                    { category: 'Residentes Externos', price: `S/. ${config?.prices?.external_resident || 80}.00` },
                                    { category: 'Médicos Especialistas', price: `S/. ${config?.prices?.specialist || 120}.00` },
                                    { category: 'Estudiantes / Otros', price: `S/. ${config?.prices?.student || 30}.00` },
                                    { category: 'Solo Certificación (Presencial)', price: `S/. ${config?.prices?.certification || 50}.00` }
                                ]}
                                className="mb-0 shadow-none border-0"
                            />

                            <div className="mt-6 text-center">
                                <Button onClick={closeCostsModal} className="w-full justify-center bg-blue-700">Entendido</Button>
                            </div>
                        </div>
                    </Modal>
                )
            }
        </div >
    );
};

export default RegistrationView;
