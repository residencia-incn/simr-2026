import React, { useState, useEffect, useRef } from 'react';
import { User, Award, Wifi, Upload, FileCheck, X, CheckCircle, Tag, Loader, ChevronRight, ChevronLeft, Building, Briefcase, DollarSign, Calendar, AlertCircle, Send, Users } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { api } from '../services/api';
import { useForm, useFileUpload, useApi } from '../hooks';
import { showSuccess, showError, showWarning } from '../utils/alerts';

const RegistrationView = () => {
    const [config, setConfig] = useState(null);
    const [pricing, setPricing] = useState({ ticketTypes: [], workshops: [] }); // New pricing state
    const [couponError, setCouponError] = useState('');
    const [voucherError, setVoucherError] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedWorkshops, setSelectedWorkshops] = useState([]);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Work submission specific state
    const [viewMode, setViewMode] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('mode') === 'work_submission' ? 'work_submission' : 'registration';
    }); // 'registration' | 'work_submission'

    // New Author Mode State
    const [authorMode, setAuthorMode] = useState('single'); // 'single' | 'multiple'

    const [workForm, setWorkForm] = useState({
        type: '',
        specialty: '',
        title: '',
        introduccion: '',
        metodologia: '',
        resultados: '',
        conclusiones: ''
    });
    const [workDeclarations, setWorkDeclarations] = useState({});
    const [academicConfig, setAcademicConfig] = useState(null);
    const [treasuryData, setTreasuryData] = useState({ config: null, accounts: [] });
    const [selectedPaymentAccount, setSelectedPaymentAccount] = useState(null);
    const [specialties, setSpecialties] = useState([]);

    const { loading: isSubmitting, execute: submitRegistration } = useApi(api.registrations.add, false);

    useEffect(() => {
        const loadConfig = async () => {
            const [eventConfig, acConfig, trConfig, accs, pricingConfig] = await Promise.all([
                api.content.getConfig(),
                api.academic.getConfig(),
                api.treasury.getConfig(),
                api.treasury.getAccounts(),
                api.treasury.getPricing()
            ]);
            setConfig({ ...eventConfig, treasury: trConfig });
            setAcademicConfig(acConfig);
            setTreasuryData({ config: trConfig, accounts: accs });
            setPricing(pricingConfig || { ticketTypes: [], workshops: [] });
            setSpecialties(eventConfig.participantSpecialties || eventConfig.specialties || []);
        };
        loadConfig();
    }, []);

    // Local ref for file input
    const fileInputRef = useRef(null);
    const accountsRef = useRef(null); // Ref for scrolling to accounts section
    const [showAccountError, setShowAccountError] = useState(false);

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
        if (!couponCode) return;

        // EMERGENCY LOCAL FALLBACK FOR DEBUGGING
        if (couponCode === 'BECA100') {
            const mockCoupon = {
                code: 'BECA100',
                type: 'percentage',
                value: 100,
                description: 'Beca 100% (Local)',
                maxUses: 999,
                applicableModality: 't_presencial_certificado', // Update this ID based on your actual config if needed
                workshopDiscounts: {}
            };

            // Auto-select for fallback
            if (pricing.ticketTypes.find(t => t.id === mockCoupon.applicableModality)) {
                setSelectedTicket(mockCoupon.applicableModality);
            }

            setAppliedCoupon(mockCoupon);
            showSuccess('Beca Integral aplicada y modalidad actualizada.', 'Cupón BECA100 aplicado');
            return;
        }

        setValidatingCoupon(true);
        setCouponError('');

        try {
            console.log('Validating coupon:', couponCode);
            const coupon = await api.coupons.validate(couponCode);

            // --- AUTO-SELECTION LOGIC ---
            let changesMade = [];
            let benefitsList = [];

            // 1. Auto-Select Modality if specified
            if (coupon.applicableModality) {
                const targetTicket = pricing.ticketTypes.find(t => t.id === coupon.applicableModality);
                if (targetTicket) {
                    if (selectedTicket !== coupon.applicableModality) {
                        setSelectedTicket(coupon.applicableModality);
                        changesMade.push(`Modalidad actualizada a: <b>${targetTicket.title}</b>`);
                    }
                    benefitsList.push(`<li>Ticket: <b>${targetTicket.title}</b></li>`);
                }
            } else if (selectedTicket) {
                // If generic coupon, just mention current ticket
                const current = pricing.ticketTypes.find(t => t.id === selectedTicket);
                if (current) benefitsList.push(`<li>Ticket: <b>${current.title}</b></li>`);
            }

            // 2. Auto-Select Workshops if specified
            if (coupon.workshopDiscounts && Object.keys(coupon.workshopDiscounts).length > 0) {
                const newWorkshops = [...selectedWorkshops];
                let addedAny = false;

                Object.keys(coupon.workshopDiscounts).forEach(wsId => {
                    // Auto-add workshops if they are part of the coupon
                    // User request: "marcarse en automatico el acceso al que me dio el cupon"
                    if (!newWorkshops.includes(wsId)) {
                        newWorkshops.push(wsId);
                        addedAny = true;
                    }
                    // Use loose equality for safety with object key strings vs number IDs
                    const wsName = pricing.workshops.find(w => w.id == wsId)?.name || 'Taller';
                    benefitsList.push(`<li>Taller: <b>${wsName}</b></li>`);
                });

                if (addedAny) {
                    setSelectedWorkshops(newWorkshops);
                    changesMade.push('Se han agregado los talleres incluidos en el cupón.');
                }
            }

            // Message Construction
            let successHtml = `<div class="text-left"><p class="mb-2">${coupon.description}</p>`;

            if (benefitsList.length > 0) {
                successHtml += `<p class="text-sm font-bold mt-3 mb-1">Items Cubiertos / Descontados:</p><ul class="list-disc pl-5 text-sm space-y-1 text-gray-700">${benefitsList.join('')}</ul>`;
            }

            if (changesMade.length > 0) {
                successHtml += `<div class="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">✨ <b>Actualización Automática:</b><br/>${changesMade.join('<br/>')}</div>`;
            }

            successHtml += '</div>';

            setAppliedCoupon(coupon);
            showSuccess(successHtml, 'Cupón Válido', { html: true });

        } catch (error) {
            console.error('Coupon error:', error);
            setCouponError(error.message || 'Cupón inválido o expirado');
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
        let total = 0;

        // 1. Calculate Ticket Price
        const ticket = pricing.ticketTypes.find(t => t.id === selectedTicket);
        if (ticket) {
            let ticketPrice = parseFloat(ticket.price) || 0;

            // Check Granular Modality Discount
            if (appliedCoupon && appliedCoupon.applicableModality === selectedTicket) {
                const discountPercent = parseFloat(appliedCoupon.modalityDiscount) || 0;
                ticketPrice = Math.max(0, ticketPrice * (1 - discountPercent / 100));
            } else if (appliedCoupon && !appliedCoupon.applicableModality && !appliedCoupon.workshopDiscounts && appliedCoupon.type === 'percentage') {
                // Legacy Global Percentage
                ticketPrice = ticketPrice * (1 - appliedCoupon.value / 100);
            }
            total += ticketPrice;
        }

        // 2. Calculate Workshops Price
        selectedWorkshops.forEach(workshopId => {
            const ws = pricing.workshops.find(w => w.id === workshopId);
            if (ws) {
                let wsPrice = parseFloat(ws.price) || 0;

                // Check Granular Workshop Discount
                if (appliedCoupon && appliedCoupon.workshopDiscounts && appliedCoupon.workshopDiscounts[workshopId] !== undefined) {
                    const discountPercent = parseFloat(appliedCoupon.workshopDiscounts[workshopId]) || 0;
                    wsPrice = Math.max(0, wsPrice * (1 - discountPercent / 100));
                } else if (appliedCoupon && !appliedCoupon.workshopDiscounts && appliedCoupon.type === 'percentage') {
                    // Legacy Global Percentage
                    wsPrice = wsPrice * (1 - appliedCoupon.value / 100);
                }
                total += wsPrice;
            }
        });

        // 3. Legacy Fixed Discount (Global)
        if (appliedCoupon && appliedCoupon.type === 'fixed') {
            total = Math.max(0, total - appliedCoupon.value);
        }

        // Round to 2 decimals
        return Math.round(total * 100) / 100;
    };

    const amount = calculateAmount();
    const requiresPayment = amount > 0;

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    const handleNext = async () => {
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
                showWarning('Complete todos los campos obligatorios marcados en rojo.', 'Campos incompletos');
                return;
            }

            // --- REAL-TIME VALIDATION ---
            try {
                // Show loading indicator if possible, but for now simple await is fast enough.
                const check = await api.registrations.checkDuplicates(form);
                if (check.isDuplicate) {
                    setValidationErrors({ [check.field]: check.message });
                    // Removed window.alert to rely on inline message
                    // window.alert(`⚠️ Validación: ${check.message}`);
                    return; // Stop here, do not proceed to step 2
                }
            } catch (err) {
                console.error("Validation check failed", err);
                // Optional: decide if we block or proceed on API failure. Blocking is safer.
                showError('Intente nuevamente.', 'Error validando datos');
                return;
            }
            // -----------------------------
        }

        if (currentStep === 2) {
            if (!selectedTicket) {
                showWarning('Por favor selecciona un tipo de ticket.', 'Ticket requerido');
                return;
            }
        }

        // Clear errors and proceed
        setValidationErrors({});
        const maxSteps = viewMode === 'registration' ? 3 : 2;
        if (currentStep < maxSteps) setCurrentStep(currentStep + 1);
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
            setVoucherError(true);
            window.alert('⚠️ ATENCIÓN: Es obligatorio adjuntar el voucher de pago cuando hay un monto a pagar.\n\nPor favor sube la imagen de tu constancia en el recuadro "Validación de Pago".');
            // Scroll to voucher section if possible or just let the user see the red border
            return;
        }

        if (paymentNeeded && !selectedPaymentAccount) {
            setShowAccountError(true);
            showWarning('Por favor selecciona la cuenta donde realizaste el depósito.', 'Cuenta requerida');
            if (accountsRef.current) {
                accountsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Convert file to base64 if it exists
        let base64Voucher = null;
        if (voucherFile && convertToBase64) {
            try {
                base64Voucher = await convertToBase64(voucherFile);
            } catch (err) {
                console.error('Error converting voucher:', err);
                showError(err.message, 'Error al procesar el archivo del voucher');
                return;
            }
        }

        // Note: loading state is handled by useApi internally

        try {
            const currentTicket = pricing.ticketTypes.find(t => t.id === selectedTicket);
            const isVirtual = currentTicket?.title.toLowerCase().includes('virtual');
            // Check for certificate based on title or explicit flag if we add it later
            const wantsCert = currentTicket?.title.toLowerCase().includes('certificado');

            const registrationData = {
                ...form,
                name: `${form.lastName} ${form.firstName}`.trim(),
                ticketType: selectedTicket,
                workshops: selectedWorkshops,
                amount: currentAmount,
                modalidad: isVirtual ? 'Virtual' : 'Presencial',
                wantsCertification: wantsCert,
                coupon: appliedCoupon ? appliedCoupon.code : null,
                voucherData: base64Voucher,
                status: paymentNeeded ? 'pending_payment' : 'confirmed', // Auto-confirm if 0 amount
                processedAt: new Date().toISOString(),
                paymentAccountId: selectedPaymentAccount, // Pass the selected account ID

                // Add default Role 'asistente' explicitly if valid (or backend does it)
                // We'll let backend handle default role assignment, but we ensure status is confirmed.
            };

            const result = await submitRegistration(registrationData);

            if (result) {
                if (appliedCoupon) {
                    await api.coupons.redeem(appliedCoupon.code);
                }
                setShowSuccessModal(true);
            } else {
                showError('Por favor intenta nuevamente.', 'No se pudo guardar el registro');
            }
        } catch (error) {
            console.error('Submission error:', error);
            // Show specific API error message if available
            window.alert('⚠️ Error en la inscripción:\n\n' + (error.message || 'Ocurrió un error desconocido. Por favor intenta nuevamente.'));
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

    // Check if work submission is allowed based on deadlines
    const getDeadlineStatus = () => {
        if (!academicConfig?.submissionDeadline) {
            return { allowed: true, message: '', status: 'open' };
        }

        const now = new Date();
        const deadline = new Date(academicConfig.submissionDeadline);

        if (now <= deadline) {
            return {
                allowed: true,
                message: academicConfig.submissionDeadline,
                status: 'open',
                penalty: 0
            };
        }

        // Verificar si prórroga está ACTIVADA
        if (academicConfig.extensionEnabled && academicConfig.extensionDeadline) {
            const extension = new Date(academicConfig.extensionDeadline);
            if (now <= extension) {
                return {
                    allowed: true,
                    message: academicConfig.extensionDeadline,
                    status: 'extension',
                    penalty: academicConfig.latePenalty || 0
                };
            }
        }

        return {
            allowed: false,
            message: 'El plazo para envío de trabajos ha finalizado',
            status: 'closed'
        };
    };

    const handleSubmitWork = async () => {
        try {
            // Validate work form
            if (!workForm.type || !workForm.specialty || !workForm.title ||
                !workForm.introduccion || !workForm.metodologia ||
                !workForm.resultados || !workForm.conclusiones) {
                showWarning('Complete todos los campos del formulario de trabajo.', 'Campos incompletos');
                return;
            }

            // Validate required declarations
            const missingDeclarations = academicConfig?.declarations?.filter(
                d => d.required && !workDeclarations[d.id]
            ) || [];

            if (missingDeclarations.length > 0) {
                showWarning('Debe aceptar todas las declaraciones obligatorias.', 'Declaraciones requeridas');
                return;
            }

            // Check submission deadline
            const deadlineStatus = getDeadlineStatus();
            if (!deadlineStatus.allowed) {
                showError('El plazo para envío de trabajos ha finalizado.', 'Fuera de plazo');
                return;
            }

            // Create user with limited access (only 'trabajos' module)
            const newUser = await api.users.add({
                ...form,
                name: `${form.lastName} ${form.firstName}`.trim(),
                password: '123456', // Default password
                modules: ['trabajos'], // Only access to works module
                eventRoles: ['asistente'],
                status: 'registered_only' // Special status for work-only registration
            });

            // Create work linked to the new user
            await api.works.create({
                title: workForm.title,
                specialty: workForm.specialty,
                type: workForm.type,
                abstract: {
                    introduccion: workForm.introduccion,
                    metodologia: workForm.metodologia,
                    resultados: workForm.resultados,
                    conclusiones: workForm.conclusiones
                },
                authors: [{ id: newUser.id, name: newUser.name, role: 'Autor Principal' }],
                status: 'En Evaluación',
                date: new Date().toISOString(),
                penalty: deadlineStatus.penalty,
                declarations: Object.keys(workDeclarations).filter(k => workDeclarations[k])
            });

            showSuccess('Tu trabajo ha sido enviado correctamente. Recibirás un correo con tus credenciales de acceso.', 'Trabajo enviado con éxito');
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Work submission error:', error);
            showError(error.message || 'Ocurrió un error al enviar el trabajo.', 'Error en el envío');
        }
    };

    const ticketOptions = pricing.ticketTypes.map(ticket => {
        let icon = User;
        let color = 'blue';

        if (ticket.title.toLowerCase().includes('certificado')) {
            icon = Award;
        }

        if (ticket.title.toLowerCase().includes('virtual')) {
            icon = Wifi;
            color = 'purple';
        }

        if (ticket.price === 0) {
            color = 'gray';
        }

        return {
            id: ticket.id,
            title: ticket.title,
            subtitle: ticket.subtitle || `S/ ${ticket.price}`,
            price: ticket.price,
            icon: icon,
            color: color
        };
    });

    const availableWorkshops = pricing.workshops;

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
        <div className="animate-fadeIn max-w-6xl mx-auto px-4 pt-2 pb-8 flex justify-center min-h-[600px]">

            <div className="relative w-full max-w-5xl">

                {/* Main Card */}
                <Card className="p-0 shadow-2xl border-0 overflow-hidden rounded-3xl min-h-[600px] flex flex-col relative">

                    {/* Header INSIDE Card with Tab Navigation */}
                    <div className="bg-white border-b border-gray-100">
                        {/* Tab Navigation */}
                        <div className="flex border-b border-gray-200">
                            <button
                                type="button"
                                onClick={() => {
                                    setViewMode('registration');
                                    setCurrentStep(1);
                                }}
                                className={`flex-1 px-8 py-4 font-bold text-lg transition-all ${viewMode === 'registration'
                                    ? 'text-white bg-blue-700 border-b-4 border-blue-900'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 bg-white'
                                    }`}
                            >
                                Inscripción
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setViewMode('work_submission');
                                    setCurrentStep(1);
                                }}
                                className={`flex-1 px-8 py-4 font-bold text-lg transition-all ${viewMode === 'work_submission'
                                    ? 'text-white bg-blue-700 border-b-4 border-blue-900'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 bg-white'
                                    }`}
                            >
                                Enviar Trabajo
                            </button>
                        </div>

                        {/* Step Counter Only */}
                        <div className="p-4 flex justify-end bg-gray-50">
                            <div className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-md text-sm tracking-wide">
                                {currentStep} de {viewMode === 'registration' ? '3' : '2'}
                            </div>
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
                    {currentStep < (viewMode === 'registration' ? 3 : 2) && (
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
                                {/* Deadline Banner - Only for work submission mode */}
                                {viewMode === 'work_submission' && (() => {
                                    const deadlineStatus = getDeadlineStatus();
                                    return (
                                        <>
                                            {deadlineStatus.status === 'open' && (
                                                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white flex items-center justify-between shadow-md">
                                                    <div className="flex items-center gap-3">
                                                        <Calendar size={24} />
                                                        <div>
                                                            <p className="text-sm font-medium opacity-90">Fecha límite de envío</p>
                                                            <p className="text-lg font-bold">
                                                                {new Date(deadlineStatus.message).toLocaleDateString('es-PE', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {deadlineStatus.status === 'extension' && (
                                                <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-4 text-white flex items-center justify-between shadow-md">
                                                    <div className="flex items-center gap-3">
                                                        <AlertCircle size={24} />
                                                        <div>
                                                            <p className="text-sm font-medium opacity-90">⚠️ Prórroga - Envío con penalidad de {deadlineStatus.penalty} puntos</p>
                                                            <p className="text-lg font-bold">
                                                                Fecha límite: {new Date(deadlineStatus.message).toLocaleDateString('es-PE', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {deadlineStatus.status === 'closed' && (
                                                <div className="bg-gradient-to-r from-red-500 to-red-700 rounded-xl p-6 text-white shadow-lg">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-white/20 p-3 rounded-full">
                                                            <X size={32} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xl font-bold">Plazo Finalizado</p>
                                                            <p className="text-sm opacity-90 mt-1">{deadlineStatus.message}</p>
                                                            <p className="text-sm opacity-90 mt-2">Puede inscribirse al evento en la pestaña "Inscripción"</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}

                                {/* Form Content - Disabled if work submission is closed */}
                                <div className={`space-y-6 ${viewMode === 'work_submission' && !getDeadlineStatus().allowed ? 'opacity-50 pointer-events-none' : ''}`}>


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
                                            {typeof validationErrors.dni === 'string' && <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.dni}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                                            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="juan@ejemplo.com" required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white ${validationErrors.email ? 'border-red-500 border-2' : 'border-gray-200 focus:border-blue-500'}`} />
                                            {typeof validationErrors.email === 'string' && <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.email}</p>}
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
                                                    {typeof validationErrors.cmp === 'string' && <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.cmp}</p>}
                                                </div>

                                                {/* RNE - Only for Specialists */}
                                                {form.occupation === 'Médico Especialista' && (
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">N° RNE *</label>
                                                        <input type="number" name="rne" value={form.rne} onChange={handleChange} placeholder="54321" required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white ${validationErrors.rne ? 'border-red-500 border-2' : 'border-gray-200'}`} />
                                                        {typeof validationErrors.rne === 'string' && <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.rne}</p>}
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
                        {currentStep === 2 && viewMode === 'registration' && (
                            <div className="animate-fadeIn grid md:grid-cols-2 gap-12">
                                {/* Left Column: Tickets / Modalidad */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            <Award size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">Selecciona tu Modalidad</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {ticketOptions.map((ticket) => {
                                            const Icon = ticket.icon;
                                            const isSelected = selectedTicket === ticket.id;
                                            return (
                                                <div
                                                    key={ticket.id}
                                                    onClick={() => setSelectedTicket(ticket.id)}
                                                    className={`
                                                        relative cursor-pointer rounded-2xl border-2 p-5 flex items-center gap-4 transition-all duration-300
                                                        ${isSelected
                                                            ? `border-${ticket.color}-600 bg-${ticket.color}-50 shadow-md transform -translate-y-0.5`
                                                            : 'border-gray-100 hover:border-blue-300 hover:shadow-sm bg-white'
                                                        }
                                                    `}
                                                >
                                                    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${isSelected ? `bg-${ticket.color}-600` : 'bg-gray-100'}`}>
                                                        <Icon size={24} className={isSelected ? 'text-white' : 'text-gray-500'} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900">{ticket.title}</h4>
                                                        <p className={`text-sm font-semibold ${isSelected ? `text-${ticket.color}-600` : 'text-gray-500'}`}>{ticket.subtitle}</p>
                                                    </div>
                                                    {isSelected && <CheckCircle size={20} className={`text-${ticket.color}-600`} />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right Column: Workshops */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                            <Tag size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">Talleres (Opcional)</h3>
                                    </div>

                                    <div className="space-y-3">
                                        {availableWorkshops.map((workshop) => (
                                            <label key={workshop.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all bg-white shadow-sm">
                                                <input type="checkbox" checked={selectedWorkshops.includes(workshop.id)} onChange={() => handleWorkshopToggle(workshop.id)} className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500" />
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-700 leading-tight">{workshop.name}</p>
                                                    <p className="text-xs text-orange-600 font-bold mt-1">+ S/ {workshop.price}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2 Content - Work Submission */}
                        {currentStep === 2 && viewMode === 'work_submission' && (
                            <div className="animate-fadeIn space-y-6">
                                {/* Work Form */}
                                <div className="space-y-6">
                                    {/* Authorship Section */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <label className="block text-sm font-bold text-gray-700 mb-4">Autoría del Trabajo</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div
                                                onClick={() => setAuthorMode('single')}
                                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${authorMode === 'single'
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-blue-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${authorMode === 'single' ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    <User size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-base">Solo Autor (Yo)</p>
                                                    <p className="text-xs opacity-70">Soy el único autor del trabajo</p>
                                                </div>
                                                {authorMode === 'single' && (
                                                    <div className="ml-auto w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                                                        <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                                    </div>
                                                )}
                                            </div>

                                            <div
                                                onClick={() => setAuthorMode('multiple')}
                                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${authorMode === 'multiple'
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-blue-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${authorMode === 'multiple' ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    <Users size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-base">Varios Autores</p>
                                                    <p className="text-xs opacity-70">Hay co-autores involucrados</p>
                                                </div>
                                                {authorMode === 'multiple' && (
                                                    <div className="ml-auto w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                                                        <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Trabajo *</label>
                                            <select
                                                value={workForm.type}
                                                onChange={(e) => setWorkForm({ ...workForm, type: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white"
                                            >
                                                <option value="">Seleccione...</option>
                                                {academicConfig?.workTypes?.map((type, i) => (
                                                    <option key={i} value={type}>{type}</option>
                                                )) || (
                                                        <>
                                                            <option value="Trabajo Original">Trabajo Original</option>
                                                            <option value="Caso Clínico">Caso Clínico</option>
                                                            <option value="Revisión Sistemática">Revisión Sistemática</option>
                                                        </>
                                                    )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Subespecialidad (Tema) *</label>
                                            <select
                                                value={workForm.specialty}
                                                onChange={(e) => setWorkForm({ ...workForm, specialty: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white"
                                            >
                                                <option value="">Seleccione...</option>
                                                {specialties.map((spec, i) => (
                                                    <option key={i} value={spec}>{spec}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Título del Trabajo *</label>
                                        <input
                                            type="text"
                                            value={workForm.title}
                                            onChange={(e) => setWorkForm({ ...workForm, title: e.target.value })}
                                            placeholder="Ej: Síndrome de Miller Fisher post-COVID..."
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white"
                                        />
                                        <div className="text-xs text-right text-gray-400 mt-1">0 / 20 palabras</div>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                                        <h4 className="text-sm font-bold text-gray-700">Resumen Estructurado</h4>
                                        {academicConfig?.sections
                                            ?.filter(section => section.active && section.workTypes.includes(workForm.type))
                                            .map((section) => (
                                                <div key={section.id}>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
                                                        {section.label} <span className="text-gray-500 font-normal ml-1">({section.type === 'file' ? 'Archivo PDF/Img' : `${section.limit || 150} palabras máx.`})</span> *
                                                    </label>
                                                    {section.type === 'file' ? (
                                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
                                                            <input
                                                                type="file"
                                                                accept={section.acceptedFileTypes || ".pdf,.jpg,.jpeg,.png"}
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    // Handle file selection - In a real app, upload here or store file object
                                                                    // For now, storing fake path or file name to simulate
                                                                    if (file) {
                                                                        setWorkForm({ ...workForm, [section.id]: file.name });
                                                                    }
                                                                }}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            />
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Upload size={24} className="text-gray-400" />
                                                                <p className="text-sm text-gray-600 font-medium">
                                                                    {workForm[section.id] ? (
                                                                        <span className="text-blue-600 font-bold flex items-center gap-2">
                                                                            <FileCheck size={16} /> {workForm[section.id]}
                                                                        </span>
                                                                    ) : "Haga clic o arrastre para subir archivo"}
                                                                </p>
                                                                <p className="text-xs text-gray-400">Máx. 5MB (PDF, JPG, PNG)</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <textarea
                                                                value={workForm[section.id] || ''}
                                                                onChange={(e) => {
                                                                    const text = e.target.value;
                                                                    setWorkForm({ ...workForm, [section.id]: text });
                                                                }}
                                                                rows={4}
                                                                placeholder={`Escriba el contenido de ${section.label}...`}
                                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white resize-none"
                                                            />
                                                            <div className="flex justify-end mt-1">
                                                                <span className={`text-xs ${((workForm[section.id] || '').split(/\s+/).filter(w => w.length > 0).length) > (section.limit || 150) ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                                                    {(workForm[section.id] || '').split(/\s+/).filter(w => w.length > 0).length} / {section.limit || 150} palabras
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        {!workForm.type && (
                                            <div className="text-center py-8 text-gray-500 italic">
                                                Seleccione un tipo de trabajo para ver la estructura requerida.
                                            </div>
                                        )}
                                    </div>

                                    {/* Declaraciones Juradas */}
                                    <div className="pt-6 space-y-3">
                                        <h4 className="text-sm font-bold text-gray-700">Declaraciones Juradas</h4>
                                        {academicConfig?.declarations?.map(decl => (
                                            <div key={decl.id} className="flex items-start gap-2 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    id={`work-${decl.id}`}
                                                    checked={workDeclarations[decl.id] || false}
                                                    onChange={(e) => setWorkDeclarations({ ...workDeclarations, [decl.id]: e.target.checked })}
                                                    className="mt-1 rounded text-blue-700 focus:ring-blue-500"
                                                />
                                                <label htmlFor={`work-${decl.id}`} className="cursor-pointer select-none">
                                                    {decl.text} {decl.required && <span className="text-red-500">*</span>}
                                                </label>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="button"
                                            onClick={handleSubmitWork}
                                            className="bg-green-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg flex items-center gap-2"
                                        >
                                            <Send size={20} />
                                            Enviar Trabajo
                                        </button>
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

                                <div className={requiresPayment ? "grid md:grid-cols-2 gap-8" : "max-w-xl mx-auto space-y-6"}>
                                    {/* Left Col: Bank Info - Dynamic */}
                                    {requiresPayment && (
                                        <div className="space-y-4" ref={accountsRef}>
                                            <h4 className={`font-bold border-b pb-2 ${showAccountError ? 'text-red-600 border-red-300' : 'text-gray-800'}`}>
                                                Cuentas Disponibles {showAccountError && <span className="text-xs font-normal text-red-500 float-right mt-1">* Requerido</span>}
                                            </h4>
                                            <p className="text-sm text-gray-600 mb-2">Selecciona la cuenta donde realizaste el pago:</p>

                                            <div className="space-y-3">
                                                {(() => {
                                                    const inscriptionAccountIds = treasuryData.config?.contribution?.inscriptionAccounts ||
                                                        (treasuryData.config?.contribution?.defaultInscriptionAccount ? [treasuryData.config.contribution.defaultInscriptionAccount] : []);

                                                    const validAccounts = treasuryData.accounts.filter(acc => inscriptionAccountIds.includes(acc.id));

                                                    if (validAccounts.length === 0) {
                                                        return <p className="text-red-500 text-sm italic">No hay cuentas de inscripción configuradas.</p>;
                                                    }

                                                    return validAccounts.map(account => {
                                                        const isSelected = selectedPaymentAccount === account.id;

                                                        // Determine visual style based on account details
                                                        const name = account.bank_name || account.wallet_name || account.nombre || '';
                                                        const lowerName = name.toLowerCase();
                                                        const displayType = account.tipo === 'billetera' ? 'Billetera' : 'Banco';

                                                        // Try to find configured logo
                                                        let configuredLogo = null;
                                                        if (treasuryData.config?.banks && account.tipo === 'banco') {
                                                            const bank = treasuryData.config.banks.find(b => b.name === account.bank_name);
                                                            if (bank?.logo) configuredLogo = bank.logo;
                                                        } else if (treasuryData.config?.wallets && account.tipo === 'billetera') {
                                                            const wallet = treasuryData.config.wallets.find(w => w.name === account.wallet_name);
                                                            if (wallet?.logo) configuredLogo = wallet.logo;
                                                        }

                                                        let colorClass = 'bg-gray-50 border-gray-200';
                                                        let iconClass = 'bg-gray-200 text-gray-600';
                                                        let shortName = displayType;

                                                        if (lowerName.includes('yape')) {
                                                            colorClass = 'bg-purple-50 border-purple-200';
                                                            iconClass = 'bg-purple-600 text-white';
                                                            shortName = 'Yape';
                                                        }
                                                        else if (lowerName.includes('plin')) {
                                                            colorClass = 'bg-cyan-50 border-cyan-200';
                                                            iconClass = 'bg-cyan-500 text-white';
                                                            shortName = 'Plin';
                                                        }
                                                        else if (lowerName.includes('bcp') || lowerName.includes('crédito')) {
                                                            colorClass = 'bg-orange-50 border-orange-200';
                                                            iconClass = 'bg-orange-500 text-white';
                                                            shortName = 'BCP';
                                                        }
                                                        else if (lowerName.includes('interbank')) {
                                                            colorClass = 'bg-green-50 border-green-200';
                                                            iconClass = 'bg-green-600 text-white';
                                                            shortName = 'IB';
                                                        }
                                                        else if (lowerName.includes('bbva')) {
                                                            colorClass = 'bg-blue-50 border-blue-200';
                                                            iconClass = 'bg-blue-600 text-white';
                                                            shortName = 'BBVA';
                                                        }

                                                        if (isSelected) {
                                                            colorClass = colorClass.replace('bg-', 'bg-opacity-50 ring-2 ring-blue-500 border-blue-500');
                                                        }

                                                        return (
                                                            <div
                                                                key={account.id}
                                                                onClick={() => {
                                                                    setSelectedPaymentAccount(account.id);
                                                                    setShowAccountError(false);
                                                                }}
                                                                className={`p-4 rounded-xl border cursor-pointer transition-all ${colorClass} ${isSelected ? 'shadow-md' : 'hover:border-blue-300'} ${showAccountError && !isSelected ? 'border-red-300 bg-red-50' : ''}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden ${!configuredLogo ? iconClass : 'bg-white border border-gray-100'}`}>
                                                                        {configuredLogo ? (
                                                                            <img src={configuredLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                                                                        ) : (
                                                                            shortName.substring(0, 4)
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        {displayType === 'Billetera' ? (
                                                                            <>
                                                                                <p className="font-bold text-gray-900 text-2xl leading-none tracking-tight mb-1">
                                                                                    {account.phone_number || account.account_number}
                                                                                </p>
                                                                                <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                                                                                    {account.holder_name || 'Titular no registrado'}
                                                                                </p>
                                                                                <div className="mt-1 flex items-center gap-2">
                                                                                    <span className="text-[10px] uppercase bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-bold">
                                                                                        {name}
                                                                                    </span>
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <p className="font-bold text-gray-900 text-lg leading-tight mb-0.5">
                                                                                    {name || account.nombre}
                                                                                </p>
                                                                                <p className="text-xs text-gray-600 font-medium uppercase mb-2">
                                                                                    {account.holder_name || 'Titular no registrado'}
                                                                                </p>

                                                                                <div className="space-y-1">
                                                                                    <p className="flex items-center gap-2">
                                                                                        <span className="text-[10px] uppercase bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-bold tracking-wider min-w-[50px] text-center">Cuenta</span>
                                                                                        <span className="font-mono text-gray-800 text-xs tracking-wide">{account.account_number || account.numero_cuenta}</span>
                                                                                    </p>
                                                                                    {account.cci && (
                                                                                        <p className="flex items-center gap-2">
                                                                                            <span className="text-[10px] uppercase bg-blue-50 px-1.5 py-0.5 rounded text-blue-600 font-bold tracking-wider min-w-[50px] text-center">CCI</span>
                                                                                            <span className="font-mono text-gray-600 text-xs tracking-wide">{account.cci}</span>
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    {isSelected && <CheckCircle className="text-blue-600" size={24} />}
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Right Col: Validation */}
                                    <div className="space-y-4">
                                        <h4 className={`font-bold ${voucherError ? 'text-red-600' : 'text-gray-800'} border-b pb-2 flex justify-between`}>
                                            Validación de Pago
                                            {voucherError && <span className="text-red-500 text-xs font-normal flex items-center gap-1"><AlertCircle size={12} /> Requerido</span>}
                                        </h4>
                                        {requiresPayment ? (
                                            <div className="flex-grow">
                                                {!voucherPreview ? (
                                                    <div onClick={() => fileInputRef.current.click()} className={`h-full border-2 border-dashed ${voucherError ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'} rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer transition-all text-center group`}>
                                                        <Upload className={`${voucherError ? 'text-red-400' : 'text-gray-400'} mb-2 group-hover:scale-110 transition-transform`} size={24} />
                                                        <span className={`text-sm font-medium ${voucherError ? 'text-red-600' : 'text-gray-600'}`}>Subir Voucher</span>
                                                        <span className="text-xs text-gray-400">PDF, JPG, PNG</span>
                                                    </div>
                                                ) : (
                                                    <div className="h-full border-2 border-green-200 bg-green-50 rounded-xl p-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white rounded-lg border border-green-100"><FileCheck className="text-green-500" size={20} /></div>
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-900">Archivo cargado</p>
                                                                <button type="button" onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    clearVoucher();
                                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                                }} className="text-xs text-red-500 hover:underline">Eliminar</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => {
                                                        setVoucherError(false); // Clear error on interaction
                                                        handleFileChange(e);
                                                    }}
                                                />
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

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="CÓDIGO DE CUPÓN"
                                            value={couponCode}
                                            onChange={(e) => {
                                                setCouponCode(e.target.value.toUpperCase());
                                                if (couponError) setCouponError(''); // Clear error on typing
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleValidateCoupon();
                                                }
                                            }}
                                            disabled={!!appliedCoupon}
                                            className={`flex-1 px-4 py-3 border ${couponError ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'} rounded-xl focus:ring-2 outline-none transition-all`}
                                        />
                                        {!appliedCoupon ? (
                                            <button type="button" onClick={handleValidateCoupon} disabled={validatingCoupon || !couponCode} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors">{validatingCoupon ? <Loader className="animate-spin" size={20} /> : 'Aplicar'}</button>
                                        ) : (
                                            <button type="button" onClick={handleRemoveCoupon} className="bg-red-100 text-red-600 px-4 py-3 rounded-xl hover:bg-red-200"><X size={20} /></button>
                                        )}
                                    </div>
                                    {couponError && (
                                        <div className="flex items-center gap-2 mt-2 text-red-500 text-sm animate-fadeIn pl-1">
                                            <AlertCircle size={16} />
                                            <span className="font-medium">{couponError}</span>
                                        </div>
                                    )}
                                </div>

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
            {
                showSuccessModal && (
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
                )
            }
        </div >
    );
};

export default RegistrationView;
