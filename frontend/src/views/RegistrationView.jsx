import React, { useState, useEffect } from 'react';
import { FileText, Upload, FileCheck, X, DollarSign, CreditCard, Mail, Search, CheckCircle, AlertTriangle, Tag, Loader } from 'lucide-react';
import { Button, Card, SectionHeader, InfoIcon, Modal, FormField, Table } from '../components/ui';
import { api } from '../services/api';
import { useForm, useModal, useFileUpload, useApi } from '../hooks';
import { MOCK_INCN_RESIDENTS } from '../data/mockData';

const getActivePricingColumnId = (matrix) => {
    if (!matrix || !matrix.columns) return null;
    const today = new Date();
    for (const col of matrix.columns) {
        if (!col.deadline) continue;
        const deadline = new Date(col.deadline);
        deadline.setHours(23, 59, 59, 999);
        if (today <= deadline) {
            return col.id;
        }
    }
    return matrix.columns[matrix.columns.length - 1]?.id;
};

const RegistrationView = () => {
    // Hooks
    const { isOpen: isCostsModalOpen, open: openCostsModal, close: closeCostsModal } = useModal();
    const { loading: isSubmitting, execute: submitRegistration } = useApi(api.registrations.add, false);
    const [config, setConfig] = useState(null);
    const [userType, setUserType] = useState('external'); // 'incn' or 'external'
    const [verifiedResident, setVerifiedResident] = useState(null);
    const [verificationDni, setVerificationDni] = useState('');
    const [wantsCertification, setWantsCertification] = useState(false);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);

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
        rne: '',
        firstName: '',
        lastName: '',
        birthDate: '',
        occupation: '',
        participantSpecialty: '',
        year: '',
        institution: '',
        email: '',
        phone: '',
        modalidad: 'Presencial',
    });

    const verifyINCNResident = () => {
        const resident = MOCK_INCN_RESIDENTS.find(r => r.dni === verificationDni);
        if (resident) {
            setVerifiedResident(resident);
            const names = resident.name.split(' ');
            setValues({
                ...form,
                dni: resident.dni,
                firstName: names[0],
                lastName: names.slice(1).join(' '),
                birthDate: '', // Mock data doesn't have this, user must fill
                occupation: 'Médico Residente',
                year: resident.year,
                email: resident.email,
                institution: 'Instituto Nacional de Ciencias Neurológicas',
                modalidad: 'Presencial',
            });
        } else {
            alert('DNI no encontrado en el padrón de residentes INCN. Por favor verifique o regístrese como externo.');
            setVerifiedResident(null);
        }
    };

    const handleValidateCoupon = async () => {
        if (!couponCode.trim()) return;
        setValidatingCoupon(true);
        try {
            const coupon = await api.coupons.validate(couponCode);
            setAppliedCoupon(coupon);
            alert(`¡Cupón "${coupon.code}" aplicado! Descuento: ${coupon.type === 'percentage' ? `${coupon.value}%` : `S/. ${coupon.value}`}`);
        } catch (error) {
            console.error(error);
            alert(error.message || 'Error al validar cupón');
            setAppliedCoupon(null);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
    };

    const calculateAmount = () => {
        if (!config) return 0;
        const matrix = config.pricingMatrix;
        if (!matrix) {
            // Fallback for safety if matrix isn't loaded yet but prices exist (legacy)
            if (config.prices) {
                if (userType === 'incn') return config.prices.incn || 50;
                if (form.modalidad === 'Presencial' && wantsCertification) return config.prices.certification || 50;
                // ... simplistic fallback or just 0
                return 0;
            }
            return 0;
        }

        let basePrice = 0;

        // INCN Logic
        if (userType === 'incn') {
            basePrice = parseInt(matrix.incnRate || 50);
        } else {
            // Find the matrix row based on occupation/status
            let rowId = null;
            const occupation = form.occupation;
            const rows = matrix.rows || [];

            // Helper to find row by loose match
            const findRow = (keywords) => rows.find(r => keywords.some(k => r.label.toLowerCase().includes(k.toLowerCase())));

            if (occupation === 'Médico Especialista' || occupation === 'Médico General') {
                // Try "Especialistas"
                const r = findRow(['Especialista', 'Médico']);
                rowId = r ? r.id : rows[0]?.id;
            } else if (occupation === 'Médico Residente') {
                // Try "Residente"
                const r = findRow(['Residente']);
                rowId = r ? r.id : (rows[1]?.id || rows[0]?.id);
            } else if (occupation === 'Estudiante de Medicina') {
                // Try "Estudiante"
                const r = findRow(['Estudiante']);
                rowId = r ? r.id : (rows[2]?.id || rows[0]?.id);
            } else {
                // Fallback "Otros" or "Residentes" usually
                const r = findRow(['Otro', 'General']);
                rowId = r ? r.id : (rows[1]?.id || rows[0]?.id);
            }

            if (rowId) {
                const colId = getActivePricingColumnId(matrix);
                if (colId) {
                    basePrice = parseInt(matrix.values[`${rowId}_${colId}`] || 0);
                }
            }
        }

        // Add Certification if applicable
        if (form.modalidad === 'Presencial' && wantsCertification) {
            basePrice += parseInt(matrix.certificationCost || 50);
        }

        // Handle virtual vs presencial logic separation if needed, 
        // but broadly pricing is now matrix-based.
        // If Presencial is "Free" but only certification costs money:
        // The matrix might have 0 for Presencial rows? 
        // Or we stick to the logic that Presencial = 0 base price unless Matrix says otherwise?
        // User said: "prices match user type". 
        // Let's assume Matrix covers the base participation cost. 
        // If Presencial is free, the matrix values for those rows should be 0 or handled here.
        // For now, adhering to matrix values is safest.

        // However, existing logic said Presencial is free. 
        // Let's keep matrix authority. If matrix has price, we charge it.

        // Apply Coupon logic (existing)
        if (basePrice > 0 && appliedCoupon) {
            if (appliedCoupon.type === 'percentage') {
                const discount = (basePrice * appliedCoupon.value) / 100;
                return Math.max(0, basePrice - discount);
            } else if (appliedCoupon.type === 'fixed') {
                return Math.max(0, basePrice - appliedCoupon.value);
            }
        }

        return basePrice;
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
                name: `${form.lastName} ${form.firstName}`.trim(),
                specialty: form.occupation === 'Médico Especialista' ? form.participantSpecialty : form.occupation,
                amount,
                role: userType === 'incn' ? 'Residente INCN' : (form.occupation === 'Médico Residente' ? 'Residente Externo' : 'Asistente'),
                voucherData: requiresPayment ? voucherBase64 : null,
                wantsCertification: requiresPayment // Implicitly true if paying
            };

            const result = await submitRegistration(registrationData);

            if (result) {
                if (appliedCoupon) {
                    await api.coupons.redeem(appliedCoupon.code);
                }
                alert('¡Inscripción enviada exitosamente!');
                resetForm();
                clearVoucher();
                setVerifiedResident(null);
                setUserType('external');
                setWantsCertification(false);
                setAppliedCoupon(null);
                setCouponCode('');
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
                                {/* 1. Datos Personales */}
                                <div className="grid md:grid-cols-2 gap-5">
                                    <FormField
                                        label="Apellidos"
                                        name="lastName"
                                        value={form.lastName}
                                        onChange={handleChange}
                                        placeholder="Apellidos Completos"
                                        required
                                        readOnly={!!verifiedResident}
                                    />
                                    <FormField
                                        label="Nombres"
                                        name="firstName"
                                        value={form.firstName}
                                        onChange={handleChange}
                                        placeholder="Nombres Completos"
                                        required
                                        readOnly={!!verifiedResident}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-5">
                                    <FormField
                                        label="Fecha de Nacimiento"
                                        name="birthDate"
                                        type="date"
                                        value={form.birthDate}
                                        onChange={handleChange}
                                        required
                                        readOnly={!!verifiedResident}
                                    />
                                    <FormField
                                        label="DNI / Pasaporte"
                                        name="dni"
                                        value={form.dni}
                                        onChange={handleChange}
                                        placeholder="Número de documento"
                                        required
                                        readOnly={!!verifiedResident}
                                    />
                                </div>

                                {/* 2. Datos Profesionales */}
                                <div className="grid md:grid-cols-2 gap-5">
                                    <FormField
                                        label="Ocupación"
                                        name="occupation"
                                        type="select"
                                        value={form.occupation}
                                        onChange={handleChange}
                                        options={[{ value: "", label: "Seleccione..." }, ...(config?.occupations?.map(o => ({ value: o, label: o })) || [])]}
                                        required
                                        readOnly={!!verifiedResident}
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

                                {/* Conditional Specialist Field */}
                                {form.occupation === 'Médico Especialista' && (
                                    <div className="grid md:grid-cols-1 gap-5 animate-fadeIn">
                                        <FormField
                                            label="Especialidad (Participante)"
                                            name="participantSpecialty"
                                            type="select"
                                            value={form.participantSpecialty}
                                            onChange={handleChange}
                                            options={[{ value: "", label: "Seleccione su especialidad..." }, ...(config?.participantSpecialties?.map(s => ({ value: s, label: s })) || [])]}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="grid md:grid-cols-3 gap-5">
                                    <FormField
                                        label="N° CMP"
                                        name="cmp"
                                        value={form.cmp}
                                        onChange={handleChange}
                                        placeholder="Si aplica"
                                        disabled={form.occupation === 'Estudiante de Medicina'}
                                    />
                                    <FormField
                                        label="N° RNE"
                                        name="rne"
                                        value={form.rne}
                                        onChange={handleChange}
                                        placeholder="Si aplica"
                                        disabled={form.occupation !== 'Médico Especialista'}
                                    />
                                    {form.occupation === 'Médico Residente' ? (
                                        <FormField
                                            label="Año de Residencia"
                                            name="year"
                                            type="select"
                                            value={form.year}
                                            onChange={handleChange}
                                            options={[{ value: "", label: "No aplica" }, ...(config?.residencyYears?.map(y => ({ value: y, label: y })) || [])]}
                                            readOnly={!!verifiedResident}
                                            required
                                        />
                                    ) : (
                                        <div className="hidden md:block"></div> /* Spacer to keep grid alignment if needed, or just let it flow */
                                    )}
                                </div>

                                {/* 3. Datos de Contacto y Modalidad */}
                                <div className="grid md:grid-cols-2 gap-5">
                                    <FormField
                                        label="Modalidad de Participación"
                                        name="modalidad"
                                        type="select"
                                        value={form.modalidad}
                                        onChange={handleChange}
                                        options={config?.eventType === 'Híbrido' ? [
                                            { value: "Presencial", label: "Presencial" },
                                            { value: "Virtual", label: "Virtual" }
                                        ] : (config?.eventType === 'Virtual' ? [{ value: "Virtual", label: "Virtual" }] : [{ value: "Presencial", label: "Presencial" }])}
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

                                {/* Coupon Section - Main Form */}
                                {!verifiedResident && (form.modalidad === 'Virtual' || (form.modalidad === 'Presencial' && wantsCertification)) && (
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">¿Tienes un cupón de descuento o beca?</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-grow">
                                                <input
                                                    type="text"
                                                    placeholder="Ingresa tu código (Ej: BECA100)"
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                    disabled={!!appliedCoupon}
                                                />
                                                <Tag size={18} className="absolute left-3 top-2.5 text-gray-400" />
                                            </div>
                                            {!appliedCoupon ? (
                                                <Button
                                                    type="button"
                                                    onClick={handleValidateCoupon}
                                                    disabled={validatingCoupon || !couponCode}
                                                    className="bg-gray-800 hover:bg-black"
                                                >
                                                    {validatingCoupon ? <Loader size={18} className="animate-spin" /> : 'Aplicar'}
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    onClick={handleRemoveCoupon}
                                                    className="bg-red-100 text-red-600 border border-red-200 hover:bg-red-200"
                                                >
                                                    <X size={18} />
                                                </Button>
                                            )}
                                        </div>
                                        {appliedCoupon && (
                                            <div className="mt-2 text-sm text-green-700 bg-green-50 p-2 rounded-lg flex items-center gap-2 border border-green-200">
                                                <CheckCircle size={16} />
                                                <span>
                                                    ¡Cupón <strong>{appliedCoupon.code}</strong> aplicado!
                                                    <span className="ml-1 opacity-75">
                                                        (-{appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `S/. ${appliedCoupon.value}`})
                                                    </span>
                                                </span>
                                            </div>
                                        )}
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

                                {/* Applied Coupon Indicator */}
                                {appliedCoupon && (
                                    <li className="flex justify-between items-center text-green-400">
                                        <span>Descuento ({appliedCoupon.code})</span>
                                        <span className="font-medium">
                                            -{appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `S/. ${appliedCoupon.value}`}
                                        </span>
                                    </li>
                                )}
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
                        <div className="overflow-hidden bg-white rounded-lg">
                            <div className="text-center pt-2 pb-2">
                                <h3 className="text-2xl font-black text-[#4a3b7d] uppercase tracking-wide">COSTOS DE INSCRIPCIÓN</h3>
                            </div>

                            <div className="flex flex-col md:flex-row gap-[15px] px-[15px] pb-[15px]">
                                <div className="flex-1">
                                    <div className="grid grid-cols-4 gap-2 mb-2 text-center text-white font-bold text-sm">
                                        <div className="bg-transparent"></div> {/* Spacer */}
                                        {config?.pricingMatrix?.columns?.map(col => (
                                            <div key={col.id} className="bg-[#4a3b7d] py-2 rounded-t-lg flex flex-col justify-center min-h-[44px]">
                                                <span className="leading-tight text-sm">{col.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Rows */}
                                    <div className="space-y-2">
                                        {config?.pricingMatrix?.rows?.map(row => (
                                            <div key={row.id} className="grid grid-cols-4 gap-2 items-stretch h-20">
                                                <div className="bg-gray-100 p-2 rounded-lg font-bold text-gray-700 text-sm leading-tight text-center flex items-center justify-center h-full">
                                                    {row.label}
                                                </div>
                                                {config?.pricingMatrix?.columns?.map(col => {
                                                    const price = config.pricingMatrix.values[`${row.id}_${col.id}`] || 0;
                                                    const activeColId = getActivePricingColumnId(config.pricingMatrix);
                                                    const isActive = col.id === activeColId;

                                                    return (
                                                        <div key={col.id} className={`rounded-lg flex items-center justify-center p-1 shadow-sm border border-gray-100 relative overflow-hidden group
                                                        ${isActive ? 'bg-[#4a3b7d] ring-2 ring-purple-400 ring-offset-1 z-10' : 'bg-[#4a3b7d]'}
                                                    `}>
                                                            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex flex-col items-center justify-center text-white relative z-10">
                                                                <span className="text-[10px] opacity-80 -mb-0.5">S/.</span>
                                                                <span className="text-xl font-bold tracking-tight">{price}</span>
                                                            </div>
                                                            <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-full -mr-2 -mt-2 blur-sm"></div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>

                                    <p className="text-xs text-gray-500 mt-3 text-center">* Incluye IGV. Residentes INCN: Tarifa Única S/. {config?.pricingMatrix?.incnRate || 50}.00</p>
                                </div>

                                <div className="w-full md:w-80 bg-gray-50 rounded-xl p-[15px] border border-gray-100 flex flex-col shrink-0">
                                    <h4 className="font-bold text-gray-900 text-lg border-b pb-2 mb-3">Cuentas Bancarias</h4>

                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">BBVA</span>
                                            <span className="font-bold text-base text-gray-800">Banco BBVA</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Cuenta Corriente Soles</p>
                                                <p className="font-mono text-lg font-bold text-gray-800 tracking-tight">0011-0117-0100084567</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">CCI</p>
                                                <p className="font-mono text-sm text-gray-600 tracking-tight">011-117-000100084567-90</p>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Titular: SIMR Eventos SAC</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">Y/P</span>
                                            <span className="font-bold text-base text-gray-800">Yape / Plin</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white border-2 border-dashed border-gray-200 rounded-lg w-20 h-20 flex items-center justify-center shrink-0">
                                                <span className="text-xs text-gray-400 text-center leading-none">QR<br />Code</span>
                                            </div>
                                            <p className="font-bold text-2xl text-gray-800">999 888 777</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-[15px] text-center border-t border-gray-100 bg-gray-50/50">
                                <Button onClick={closeCostsModal} size="lg" className="bg-blue-700 hover:bg-blue-800 px-10 rounded-full shadow-lg shadow-blue-700/20 text-base">Entendido</Button>
                            </div>
                        </div>
                    </Modal>
                )
            }
        </div >
    );
};

export default RegistrationView;

