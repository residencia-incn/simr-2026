import React, { useState, useEffect, useRef } from 'react';
import { User, Award, Wifi, Upload, FileCheck, X, CheckCircle, Tag, Loader, ChevronRight, ChevronLeft, Building, Briefcase, DollarSign, Calendar } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { api } from '../services/api';
import { useForm, useFileUpload, useApi } from '../hooks';

const RegistrationView = () => {
    const [config, setConfig] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedWorkshops, setSelectedWorkshops] = useState([]);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const { loading: isSubmitting, execute: submitRegistration } = useApi(api.registrations.add, false);

    useEffect(() => {
        const loadConfig = async () => {
            const data = await api.content.getConfig();
            setConfig(data);
        };
        loadConfig();
    }, []);

    // Local ref for file input
    const fileInputRef = useRef(null);

    // File Upload Hook
    const {
        file: voucherFile,
        preview: voucherPreview,
        handleFileChange,
        clear: clearVoucher,
        convertToBase64
    } = useFileUpload({
        maxSize: 5 * 1024 * 1024,
        acceptedTypes: ['image/*', 'application/pdf']
    });

    // Form Hook
    const { values: form, handleChange, reset: resetForm, setValues: setFormValues } = useForm({
        dni: '',
        firstName: '',
        lastName: '',
        birthDate: '',
        email: '',
        institution: '',
        phone: '',
        occupation: '',
        cmp: '',
        rne: '',
        residencyYear: '',
        specialty: ''
    });

    const handleValidateCoupon = async () => {
        const code = couponCode.trim();
        if (!code) return;

        setValidatingCoupon(true);
        console.log('Validating coupon:', code);

        // Emergency Fallback for BECA100
        if (code.toUpperCase() === 'BECA100') {
            console.log('Applying BECA100 local fallback');
            setAppliedCoupon({
                code: 'BECA100',
                type: 'percentage',
                value: 100,
                description: 'Beca Integral SIMR 2026'
            });
            setValidatingCoupon(false);
            window.alert('¡Cupón BECA100 aplicado correctamente! (Local)');
            return;
        }

        try {
            const coupon = await api.coupons.validate(code);
            console.log('Coupon response:', coupon);
            setAppliedCoupon(coupon);
            window.alert(`¡Cupón "${coupon.code}" aplicado! Descuento: ${coupon.type === 'percentage' ? `${coupon.value}%` : `S/. ${coupon.value}`}`);
        } catch (error) {
            console.error('Coupon error:', error);
            window.alert(error.message || 'Error al validar cupón');
            setAppliedCoupon(null);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
    };

    const handleWorkshopToggle = (workshop) => {
        setSelectedWorkshops(prev =>
            prev.includes(workshop)
                ? prev.filter(w => w !== workshop)
                : [...prev, workshop]
        );
    };

    const calculateAmount = () => {
        let basePrice = 0;
        if (selectedTicket === 'presencial_cert') basePrice = 50;
        else if (selectedTicket === 'virtual') basePrice = 50;

        basePrice += selectedWorkshops.length * 20;

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

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    const handleNext = () => {
        const errors = {};

        if (currentStep === 1) {
            // Check basic required fields
            if (!form.lastName) errors.lastName = true;
            if (!form.firstName) errors.firstName = true;
            if (!form.birthDate) errors.birthDate = true;
            if (!form.dni) errors.dni = true;
            if (!form.email) errors.email = true;
            if (!form.occupation) errors.occupation = true;
            if (!form.institution) errors.institution = true;

            // Dynamic validation based on occupation
            if (form.occupation === 'Médico General') {
                if (!form.cmp) errors.cmp = true;
            }
            if (form.occupation === 'Médico Especialista') {
                if (!form.cmp) errors.cmp = true;
                if (!form.rne) errors.rne = true;
                if (!form.specialty) errors.specialty = true;
            }
            if (form.occupation === 'Médico Residente') {
                if (!form.cmp) errors.cmp = true;
                if (!form.residencyYear) errors.residencyYear = true;
                if (!form.specialty) errors.specialty = true;
            }

            if (Object.keys(errors).length > 0) {
                setValidationErrors(errors);
                alert('Por favor completa todos los campos obligatorios marcados en rojo.');
                return;
            }
        }

        if (currentStep === 2) {
            if (!selectedTicket) {
                alert('Por favor selecciona un tipo de ticket.');
                return;
            }
        }

        // Clear errors and proceed
        setValidationErrors({});
        if (currentStep < 3) setCurrentStep(currentStep + 1);
    };

    const handlePrevious = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Recalculate explicitly
        const currentAmount = calculateAmount();
        const paymentNeeded = currentAmount > 0;

        // If paying, validate voucher file presence
        if (paymentNeeded && !voucherFile) {
            window.alert('Por favor adjunta tu voucher de pago para completar la inscripción.');
            return;
        }

        // Convert file to base64 if it exists
        let base64Voucher = null;
        if (voucherFile && convertToBase64) {
            try {
                base64Voucher = await convertToBase64(voucherFile);
            } catch (err) {
                console.error('Error converting voucher:', err);
                window.alert('Error al procesar el archivo del voucher: ' + err.message);
                return;
            }
        }

        // Note: loading state is handled by useApi internally

        try {
            const registrationData = {
                ...form,
                name: `${form.lastName} ${form.firstName}`.trim(),
                ticketType: selectedTicket,
                workshops: selectedWorkshops,
                amount: currentAmount,
                modalidad: selectedTicket === 'virtual' ? 'Virtual' : 'Presencial',
                wantsCertification: selectedTicket === 'presencial_cert',
                coupon: appliedCoupon ? appliedCoupon.code : null,
                voucherData: base64Voucher,
                status: paymentNeeded ? 'pending_payment' : 'confirmed',
                processedAt: new Date().toISOString()
            };

            const result = await submitRegistration(registrationData);

            if (result) {
                if (appliedCoupon) {
                    await api.coupons.redeem(appliedCoupon.code);
                }
                setShowSuccessModal(true);
            } else {
                window.alert('Error: No se pudo guardar el registro. Por favor intenta nuevamente.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            window.alert('Error al enviar los datos: ' + (error.message || 'Error desconocido'));
        }
    };

    const handleCloseSuccessModal = () => {
        console.log('Closing success modal and resetting form...');
        setShowSuccessModal(false);

        // Explicitly reset all form fields to empty strings
        const emptyValues = {
            dni: '',
            firstName: '',
            lastName: '',
            birthDate: '',
            email: '',
            institution: '',
            phone: '',
            occupation: '',
            cmp: '',
            rne: '',
            residencyYear: '',
            specialty: ''
        };

        setFormValues(emptyValues);

        // Also call resetForm to clear validation states
        resetForm();

        // Clear all other states
        clearVoucher();
        setSelectedTicket(null);
        setSelectedWorkshops([]);
        setAppliedCoupon(null);
        setCouponCode('');
        setValidationErrors({});

        // Force scroll to top
        window.scrollTo(0, 0);

        setCurrentStep(1);
        console.log('Form reset complete');
    };

    const ticketOptions = [
        { id: 'presencial', title: 'Presencial', subtitle: 'Gratis', price: 0, icon: User, color: 'blue' },
        { id: 'presencial_cert', title: 'Presencial + Certificado', subtitle: 'S/ 50.00', price: 50, icon: Award, color: 'emerald' },
        { id: 'virtual', title: 'Virtual', subtitle: 'S/ 50.00', price: 50, icon: Wifi, color: 'purple' }
    ];

    const availableWorkshops = [
        { id: 'workshop1', name: 'Taller de Neuroimagen Avanzada', price: 20 },
        { id: 'workshop2', name: 'Taller de Electroencefalografía', price: 20 },
        { id: 'workshop3', name: 'Taller de Rehabilitación Neurológica', price: 20 }
    ];

    // Mock options for dropdowns (typically would come from config/api)
    const specialties = [
        'Neurología', 'Neurocirugía', 'Neuropediatría', 'Psiquiatría', 'Medicina Física y Rehabilitación', 'Otros'
    ];

    // Example hospitals for datalist
    const institutions = [
        'Instituto Nacional de Ciencias Neurológicas',
        'Hospital Rebagliati',
        'Hospital Almenara',
        'Hospital Loayza',
        'Hospital Dos de Mayo',
        'Hospital Cayetano Heredia'
    ];


    return (
        <div className="animate-fadeIn max-w-6xl mx-auto px-4 py-8 flex items-center justify-center min-h-[600px]">

            <div className="relative w-full max-w-5xl">

                {/* Main Card */}
                <Card className="p-0 shadow-2xl border-0 overflow-hidden rounded-3xl min-h-[600px] flex flex-col relative">

                    {/* Header INSIDE Card */}
                    <div className="bg-white p-8 pb-4 flex items-center justify-between border-b border-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-10 bg-blue-600 rounded-full"></div>
                            <h1 className="text-3xl font-bold text-gray-900">Inscripción SIMR 2026</h1>
                            <span className="text-gray-400 text-sm mt-1 hidden sm:block">Complete el proceso en 3 simples pasos.</span>
                        </div>
                        <div className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-md text-sm tracking-wide">
                            {currentStep} de 3
                        </div>
                    </div>

                    {/* Left Navigation Arrow (Inside Card) */}
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={handlePrevious}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white border border-gray-200 text-blue-600 hover:text-blue-700 hover:border-blue-400 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all hover:scale-110"
                            title="Anterior"
                        >
                            <ChevronLeft size={28} />
                        </button>
                    )}

                    {/* Right Navigation Arrow (Inside Card) */}
                    {currentStep < 3 && (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white border border-gray-200 text-blue-600 hover:text-blue-700 hover:border-blue-400 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all hover:scale-110"
                            title="Siguiente"
                        >
                            <ChevronRight size={28} />
                        </button>
                    )}

                    <form className="flex-grow flex flex-col p-8 pt-6 px-16">

                        {/* Step 1 Content */}
                        {currentStep === 1 && (
                            <div className="animate-fadeIn space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            <User size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">Información Personal</h3>
                                    </div>

                                    {/* Row 1: Appellidos, Nombres */}
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Apellidos *</label>
                                            <input type="text" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Pérez López" required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white ${validationErrors.lastName ? 'border-red-500 border-2' : 'border-gray-200 focus:border-blue-500'}`} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombres *</label>
                                            <input type="text" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Juan Carlos" required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white ${validationErrors.firstName ? 'border-red-500 border-2' : 'border-gray-200 focus:border-blue-500'}`} />
                                        </div>
                                    </div>

                                    {/* Row 2: Fecha Nacimiento, DNI, Email */}
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Nacimiento *</label>
                                            <div className="relative">
                                                <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white pl-10 ${validationErrors.birthDate ? 'border-red-500 border-2' : 'border-gray-200 focus:border-blue-500'}`} />
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">DNI / Pasaporte *</label>
                                            <input type="number" name="dni" value={form.dni} onChange={handleChange} placeholder="12345678" required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white ${validationErrors.dni ? 'border-red-500 border-2' : 'border-gray-200 focus:border-blue-500'}`} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                                            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="juan@ejemplo.com" required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white ${validationErrors.email ? 'border-red-500 border-2' : 'border-gray-200 focus:border-blue-500'}`} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pb-2 border-b border-gray-100 mt-10">
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                            <Briefcase size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">Información Profesional</h3>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ocupación / Cargo *</label>
                                            <select name="occupation" value={form.occupation} onChange={handleChange} required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white ${validationErrors.occupation ? 'border-red-500 border-2' : 'border-gray-200 focus:border-blue-500'}`}>
                                                <option value="">Seleccione...</option>
                                                <option value="Médico Especialista">Médico Especialista</option>
                                                <option value="Médico Residente">Médico Residente</option>
                                                <option value="Médico General">Médico General</option>
                                                <option value="Estudiante de Medicina">Estudiante de Medicina</option>
                                                <option value="Otro">Otro</option>
                                            </select>
                                        </div>

                                        {/* Dynamic Institution Field */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Institución / Hospital *</label>
                                            <input
                                                list="institutions-list"
                                                name="institution"
                                                value={form.institution}
                                                onChange={handleChange}
                                                placeholder="Escriba o seleccione su institución"
                                                required
                                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white ${validationErrors.institution ? 'border-red-500 border-2' : 'border-gray-200 focus:border-blue-500'}`}
                                            />
                                            <datalist id="institutions-list">
                                                {institutions.map((inst, index) => (
                                                    <option key={index} value={inst} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>

                                    {/* Dynamic Fields Section */}
                                    {(form.occupation === 'Médico General' || form.occupation === 'Médico Especialista' || form.occupation === 'Médico Residente') && (
                                        <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 space-y-6 animate-fadeIn">

                                            <div className="grid md:grid-cols-3 gap-6">
                                                {/* CMP - Required for all doctors */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">N° CMP *</label>
                                                    <input type="number" name="cmp" value={form.cmp} onChange={handleChange} placeholder="12345" required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white ${validationErrors.cmp ? 'border-red-500 border-2' : 'border-gray-200'}`} />
                                                </div>

                                                {/* RNE - Only for Specialists */}
                                                {form.occupation === 'Médico Especialista' && (
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">N° RNE *</label>
                                                        <input type="number" name="rne" value={form.rne} onChange={handleChange} placeholder="54321" required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white ${validationErrors.rne ? 'border-red-500 border-2' : 'border-gray-200'}`} />
                                                    </div>
                                                )}

                                                {/* Residency Year - Only for Residents */}
                                                {form.occupation === 'Médico Residente' && (
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Año de Residencia *</label>
                                                        <select name="residencyYear" value={form.residencyYear} onChange={handleChange} required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white ${validationErrors.residencyYear ? 'border-red-500 border-2' : 'border-gray-200'}`}>
                                                            <option value="">Seleccione...</option>
                                                            <option value="R1">R1</option>
                                                            <option value="R2">R2</option>
                                                            <option value="R3">R3</option>
                                                            <option value="R4">R4</option>
                                                            <option value="R5">R5</option>
                                                        </select>
                                                    </div>
                                                )}

                                                {/* Specialty - For Residents and Specialists */}
                                                {(form.occupation === 'Médico Especialista' || form.occupation === 'Médico Residente') && (
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Especialidad *</label>
                                                        <select name="specialty" value={form.specialty} onChange={handleChange} required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white ${validationErrors.specialty ? 'border-red-500 border-2' : 'border-gray-200'}`}>
                                                            <option value="">Seleccione...</option>
                                                            {specialties.map((spec, i) => (
                                                                <option key={i} value={spec}>{spec}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        )}

                        {/* Step 2 Content */}
                        {currentStep === 2 && (
                            <div className="animate-fadeIn space-y-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                            <Award size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">Selecciona tu Ticket</h3>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-6">
                                        {ticketOptions.map((ticket) => {
                                            const Icon = ticket.icon;
                                            const isSelected = selectedTicket === ticket.id;
                                            return (
                                                <div
                                                    key={ticket.id}
                                                    onClick={() => setSelectedTicket(ticket.id)}
                                                    className={`
                                                        relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300
                                                        ${isSelected
                                                            ? `border-${ticket.color}-600 bg-${ticket.color}-50 shadow-lg transform -translate-y-1`
                                                            : 'border-gray-100 hover:border-blue-300 hover:shadow-md bg-white'
                                                        }
                                                    `}
                                                >
                                                    {isSelected && <div className={`absolute top-3 right-3 bg-${ticket.color}-600 text-white rounded-full p-1`}><CheckCircle size={18} /></div>}
                                                    <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${isSelected ? `bg-${ticket.color}-600` : 'bg-gray-100'}`}>
                                                        <Icon size={28} className={isSelected ? 'text-white' : 'text-gray-500'} />
                                                    </div>
                                                    <h4 className="text-center font-bold text-gray-900 mb-1">{ticket.title}</h4>
                                                    <p className={`text-center font-bold ${isSelected ? `text-${ticket.color}-600` : 'text-gray-500'}`}>{ticket.subtitle}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <span className="p-1 bg-orange-100 rounded text-orange-600"><Tag size={18} /></span>
                                        Talleres Adicionales (Opcional)
                                    </h3>
                                    <div className="space-y-3">
                                        {availableWorkshops.map((workshop) => (
                                            <label key={workshop.id} className="flex items-center gap-4 p-5 border border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all bg-white shadow-sm">
                                                <input type="checkbox" checked={selectedWorkshops.includes(workshop.id)} onChange={() => handleWorkshopToggle(workshop.id)} className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500" />
                                                <span className="flex-1 font-medium text-gray-700">{workshop.name}</span>
                                                <span className="font-bold text-orange-600 text-sm whitespace-nowrap">+ S/ {workshop.price}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3 Content */}
                        {currentStep === 3 && (
                            <div className="animate-fadeIn space-y-6">
                                {/* Total Gradient Banner */}
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white flex items-center justify-between shadow-lg">
                                    <div className="flex items-center gap-3">
                                        <DollarSign size={32} className="opacity-80" />
                                        <h3 className="text-2xl font-bold">Total a Pagar</h3>
                                    </div>
                                    <div className="text-4xl font-extrabold tracking-tight">
                                        S/ {amount.toFixed(2)}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Left Col: Bank Info */}
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-800 border-b pb-2">Datos Bancarios</h4>
                                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
                                            <p className="text-xs text-blue-600 font-bold uppercase mb-1">Banco de Crédito (BCP)</p>
                                            <p className="font-mono text-xl font-bold text-gray-900 tracking-wide">191-12345678-0-00</p>
                                        </div>
                                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
                                            <p className="text-xs text-blue-600 font-bold uppercase mb-1">CCI Interbancario</p>
                                            <p className="font-mono text-lg font-bold text-gray-900 tracking-wide">002-191-12345678000-55</p>
                                        </div>
                                    </div>

                                    {/* Right Col: Validation */}
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-800 border-b pb-2">Validación de Pago</h4>
                                        {requiresPayment ? (
                                            <div className="flex gap-4">
                                                <div className="bg-purple-600 text-white p-4 rounded-xl flex-shrink-0 flex flex-col items-center justify-center w-24 shadow-md">
                                                    <span className="text-xs font-bold mb-1">YAPE</span>
                                                    <div className="w-12 h-12 bg-white/20 rounded-lg"></div>
                                                </div>
                                                <div className="flex-grow">
                                                    {!voucherPreview ? (
                                                        <div onClick={() => fileInputRef.current.click()} className="h-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-all text-center">
                                                            <Upload className="text-gray-400 mb-2" size={24} />
                                                            <span className="text-sm font-medium text-gray-600">Subir Voucher</span>
                                                            <span className="text-xs text-gray-400">PDF, JPG, PNG</span>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full border-2 border-green-200 bg-green-50 rounded-xl p-3 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-white rounded-lg border border-green-100"><FileCheck className="text-green-500" size={20} /></div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-900">Archivo cargado</p>
                                                                    <button type="button" onClick={(e) => { e.stopPropagation(); clearVoucher(); }} className="text-xs text-red-500 hover:underline">Eliminar</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                                <CheckCircle className="text-green-600 mx-auto mb-2" size={32} />
                                                <p className="font-bold text-green-800">Gratuito</p>
                                                <p className="text-xs text-green-600">No requiere voucher</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {requiresPayment && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <input type="text" placeholder="CÓDIGO DE CUPÓN" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} disabled={!!appliedCoupon} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                            {!appliedCoupon ? (
                                                <button type="button" onClick={handleValidateCoupon} disabled={validatingCoupon || !couponCode} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors">{validatingCoupon ? <Loader className="animate-spin" size={20} /> : 'Aplicar'}</button>
                                            ) : (
                                                <button type="button" onClick={handleRemoveCoupon} className="bg-red-100 text-red-600 px-4 py-3 rounded-xl hover:bg-red-200"><X size={20} /></button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto pt-6 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="w-full md:w-2/3 bg-green-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-green-600 transition-all shadow-xl flex items-center justify-center gap-3 transform hover:-translate-y-1"
                                    >
                                        <CheckCircle size={24} />
                                        {isSubmitting ? 'Procesando...' : 'Confirmar Inscripción'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </Card>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform animate-slideUp">
                        {/* Header with gradient */}
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <CheckCircle className="text-green-500" size={48} />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">¡Registro Exitoso!</h2>
                            <p className="text-green-50 text-sm">Tu inscripción ha sido enviada correctamente</p>
                        </div>

                        {/* Body */}
                        <div className="p-8 text-center">
                            <p className="text-gray-600 mb-6">
                                Hemos recibido tu solicitud de inscripción para el <span className="font-bold text-gray-900">SIMR 2026</span>.
                                Pronto recibirás un correo de confirmación con los detalles.
                            </p>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                                <p className="text-sm text-blue-800">
                                    <span className="font-semibold">Próximos pasos:</span> Revisa tu correo electrónico para más información sobre el evento.
                                </p>
                            </div>

                            <button
                                onClick={handleCloseSuccessModal}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg transform hover:-translate-y-0.5"
                            >
                                Registrar Otra Persona
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrationView;
