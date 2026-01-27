import React, { useState, useEffect, useRef } from 'react';
import { User, Award, Wifi, Upload, FileCheck, X, CheckCircle, Tag, Loader, ChevronRight, ChevronLeft, Building, Briefcase, DollarSign, Calendar, AlertCircle, Send, Users } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { api } from '../services/api';
import { useForm, useFileUpload, useApi } from '../hooks';
import { showSuccess, showError, showWarning } from '../utils/alerts';
import Step2Modalities from './steps/Step2Modalities'; // Import Step 2
import Step3Payment from './steps/Step3Payment'; // Import Step 3
import { toast } from 'react-hot-toast';

const RegistrationView = () => {
    const [config, setConfig] = useState(null);
    const [pricing, setPricing] = useState({ ticketTypes: [], workshops: [] });
    const [couponError, setCouponError] = useState('');
    const [couponCode, setCouponCode] = useState(''); // Moved up for sorting
    const [currentStep, setCurrentStep] = useState(1);

    // Step 2 State
    const [selectedModality, setSelectedModality] = useState(null);
    const [selectedWorkshops, setSelectedWorkshops] = useState([]);
    const [allModalities, setAllModalities] = useState([]);
    const [allWorkshops, setAllWorkshops] = useState([]);

    const [selectedTicket, setSelectedTicket] = useState(null); // Keep for legacy/compat if needed
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
    const [finalTotal, setFinalTotal] = useState(0); // State for Step 3 Total
    const [specialties, setSpecialties] = useState([]);

    const { loading: isSubmitting, execute: submitRegistration } = useApi(api.registrations.add, false);

    useEffect(() => {
        const loadConfig = async () => {
            const [eventConfig, acConfig, trConfig, accs, pricingConfig] = await Promise.all([
                api.content.getConfig(), // Returns full config including modalities/workshops
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

            // Set Step 2 Data
            setAllModalities(eventConfig.registration_modalities || []);
            setAllWorkshops(eventConfig.workshops || []);
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
        university: '',
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
            const response = await api.coupons.validate(couponCode);
            // Extract benefits for easier usage
            const coupon = response.benefits || response;

            // --- AUTO-SELECTION LOGIC ---
            let changesMade = [];
            let benefitsList = [];

            const targets = coupon.target_modules || [];

            // 1. Auto-Select Modality if specified in targets
            if (targets.length > 0) {
                // Find if any target is a ticket type
                const targetModalityId = targets.find(tId => pricing.ticketTypes.some(tt => tt.id === tId || tt.code === tId));

                if (targetModalityId) {
                    const targetTicket = pricing.ticketTypes.find(t => t.id === targetModalityId || t.code === targetModalityId);
                    if (targetTicket) {
                        if (selectedTicket !== targetTicket.id) { // selectedTicket is mapped to selectedModality usually
                            setSelectedModality(targetTicket); // Update object
                            setSelectedTicket(targetTicket.id); // Update ID just in case
                            changesMade.push(`Modalidad actualizada a: <b>${targetTicket.title}</b>`);
                        }
                        benefitsList.push(`<li>Ticket: <b>${targetTicket.title}</b></li>`);
                    }
                }
            } else if (coupon.applicableModality) {
                // Legacy Fallback
                const targetTicket = pricing.ticketTypes.find(t => t.id === coupon.applicableModality);
                if (targetTicket) {
                    if (selectedTicket !== coupon.applicableModality) {
                        setSelectedModality(targetTicket);
                        setSelectedTicket(coupon.applicableModality);
                        changesMade.push(`Modalidad actualizada a: <b>${targetTicket.title}</b>`);
                    }
                    benefitsList.push(`<li>Ticket: <b>${targetTicket.title}</b></li>`);
                }
            }

            // 2. Auto-Select Workshops
            if (targets.length > 0) {
                const newWorkshops = [...selectedWorkshops];
                let addedAny = false;

                targets.forEach(tId => {
                    // Check if it is a workshop
                    const ws = pricing.workshops.find(w => w.id === tId);
                    if (ws) {
                        if (!newWorkshops.some(existing => existing.id === ws.id)) {
                            newWorkshops.push(ws);
                            addedAny = true;
                        }
                        benefitsList.push(`<li>Taller: <b>${ws.name}</b></li>`);
                    }
                });

                if (addedAny) {
                    setSelectedWorkshops(newWorkshops);
                    changesMade.push('Se han agregado los talleres incluidos en el cupón.');
                }
            } else if (coupon.workshopDiscounts) {
                // Legacy Fallback
                // ... same old logic if needed, or assume migration handled it
            }

            // Message Construction
            let successHtml = `<div class="text-left"><p class="mb-2">${coupon.description || 'Cupón aplicado'}</p>`;

            const discVal = coupon.discount_value !== undefined ? coupon.discount_value : coupon.value;
            if (discVal) {
                successHtml += `<p class="mb-2 font-bold text-green-600">Beneficio: ${discVal === 100 ? 'GRATIS (100% OFF)' : `${discVal}% de Descuento`}</p>`;
            }

            if (benefitsList.length > 0) {
                successHtml += `<p class="text-sm font-bold mt-3 mb-1">Items Cubiertos:</p><ul class="list-disc pl-5 text-sm space-y-1 text-gray-700">${benefitsList.join('')}</ul>`;
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

        // --- Pricing Logic ---

        let modPrice = selectedModality ? (parseFloat(selectedModality.price) || 0) : 0;
        let wsPrices = selectedWorkshops.map(ws => ({ id: ws.id, price: parseFloat(ws.price) || 0 }));

        if (appliedCoupon) {
            const discValue = appliedCoupon.discount_value !== undefined ? appliedCoupon.discount_value : (appliedCoupon.value || 0);
            const targets = appliedCoupon.target_modules || [];
            const multiplier = Math.max(0, (100 - discValue) / 100);

            // 1. Modality Discount
            if (selectedModality) {
                let applyDiscount = false;

                // Check New System
                if (targets.length > 0) {
                    if (targets.includes(selectedModality.id) || targets.includes(selectedModality.code)) {
                        applyDiscount = true;
                    }
                }
                // Check Legacy
                else if (appliedCoupon.applicableModality === selectedModality.id) {
                    applyDiscount = true;
                    // Legacy specific percent override?
                    if (appliedCoupon.modalityDiscount) {
                        const legMult = Math.max(0, (100 - appliedCoupon.modalityDiscount) / 100);
                        modPrice = modPrice * legMult;
                        applyDiscount = false; // Already applied custom logic
                    }
                } else if (appliedCoupon.type === 'percentage' && !appliedCoupon.workshopDiscounts && !appliedCoupon.applicableModality) {
                    // Universal Legacy
                    applyDiscount = true;
                }

                if (applyDiscount) {
                    modPrice = modPrice * multiplier;
                }
            }

            // 2. Workshops Discount
            wsPrices = wsPrices.map(ws => {
                let applyDiscount = false;
                let price = ws.price;

                if (targets.length > 0) {
                    if (targets.includes(ws.id)) {
                        applyDiscount = true;
                    }
                } else if (appliedCoupon.workshopDiscounts) {
                    // Legacy specific map
                    if (appliedCoupon.workshopDiscounts[ws.id] !== undefined) {
                        const legacyDisc = appliedCoupon.workshopDiscounts[ws.id];
                        price = price * Math.max(0, (100 - legacyDisc) / 100);
                    }
                } else if (appliedCoupon.type === 'percentage' && !appliedCoupon.workshopDiscounts && !appliedCoupon.applicableModality) {
                    applyDiscount = true;
                }

                if (applyDiscount) {
                    price = price * multiplier;
                }
                return { ...ws, price };
            });

            // 3. Fixed Discount (Universal Legacy)
            if (appliedCoupon.type === 'fixed') {
                // Subtract from total at end
                // Handled below but logic complex if mixed. 
                // Assuming Fixed is applied to TOTAL.
            }
        }

        // Sum up
        total += modPrice;
        wsPrices.forEach(ws => total += ws.price);

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
            if (!form.phone) errors.phone = true;
            if (!form.occupation) errors.occupation = true;
            if (!form.institution) errors.institution = true;

            // Dynamic validation based on occupation
            // Dynamic validation based on occupation
            const getRules = (occName) => {
                if (!config?.allowed_occupations) return {};
                const entry = config.allowed_occupations.find(o =>
                    (typeof o === 'string' ? o : o.name) === occName
                );

                if (!entry) return {};

                // Fallback for legacy string-only configs
                if (typeof entry === 'string') {
                    if (entry === 'Médico General') return { cmp: true };
                    if (entry === 'Médico Especialista') return { cmp: true, rne: true, specialty: true };
                    if (entry === 'Médico Residente') return { cmp: true, year: true, specialty: true, university: true };
                    if (entry === 'Estudiante de Medicina') return { university: true };
                    return {};
                }

                return entry.rules || {};
            };

            const rules = getRules(form.occupation);

            if (rules.cmp && !form.cmp) errors.cmp = true;
            if (rules.rne && !form.rne) errors.rne = true;
            if (rules.year && !form.residencyYear) errors.residencyYear = true;
            if (rules.specialty && !form.specialty) errors.specialty = true;

            // University logic
            if (rules.university && !form.university) errors.university = true;

            // Institution logic (Required unless explicit rule says otherwise? Or just standard?)
            // Assuming Institution is always required for now as per previous logic, 
            // unless we decide University REPLACES Institution for some roles. 
            // The user said "If Resident or Student, asks ALSO for the university".
            // So Institution remains.
            if (!form.institution) errors.institution = true;

            if (Object.keys(errors).length > 0) {
                setValidationErrors(errors);
                showWarning('Complete todos los campos obligatorios marcados en rojo.', 'Campos incompletos');
                return;
            }

            // --- REAL-TIME VALIDATION ---
            try {
                // Show loading indicator
                // Assuming we can use a local loading state or simple toast

                // Map form fields to API expected params
                // Note: The form uses 'cmp' and 'rne', backend expectation in 'auth.validateIdentity' 
                // depends on how api.js constructs the call. 
                // Let's verify api.js call below, but generally we pass the object.
                await api.auth.validateIdentity({
                    email: form.email,
                    dni: form.dni,
                    cmp_number: form.cmp || null,
                    rne_number: form.rne || null
                });

                // If success, logic proceeds naturally below
            } catch (err) {
                console.error("Validation check failed", err);
                // 409 Conflict - show explicit message
                if (err.response && err.response.status === 409) {
                    // window.alert(`⚠️ ${err.response.data.detail}`);
                    showWarning(err.response.data.detail, 'Datos Duplicados');
                    return; // STOP execution
                }
                // Other errors
                showError('Error de red al validar datos.', 'Intente nuevamente');
                return;
            }
            // -----------------------------
        }

        if (currentStep === 2) {
            if (!selectedModality) {
                showWarning('Por favor selecciona una modalidad de acceso.', 'Modalidad requerida');
                return;
            }
        }

        // Clear errors and proceed
        setValidationErrors({});
        const maxSteps = viewMode === 'registration' ? 3 : 2;
        if (currentStep < maxSteps) setCurrentStep(currentStep + 1);
    };


    // --- FUNCIÓN FINAL DE REGISTRO (Paso 3) ---
    const handleFinalSubmit = async () => {
        // A. VALIDACIONES FINALES
        if (finalTotal > 0) {
            if (!selectedPaymentAccount) {
                showWarning("Seleccione una cuenta de pago", "Cuenta Requerida");
                return;
            }
            if (!voucherFile) {
                showWarning("Debe subir la foto del voucher", "Voucher Requerido");
                return;
            }
        }

        const toastId = toast.loading("Procesando inscripción...");

        try {
            // Validar campos básicos del form por seguridad
            if (!form.dni || !form.email) {
                toast.error("Faltan datos personales", { id: toastId });
                return;
            }

            // B. CONSTRUCCIÓN DEL SNAPSHOT (Lo que compra)
            const itemsSnapshot = {
                modality_id: selectedModality?.id,
                workshop_ids: selectedWorkshops.map(w => w.id),
                frozen_price: finalTotal
            };

            // C. PREPARAR FORMDATA
            const formDataPayload = new FormData();

            // Backend ahora espera una estructura "Sala de Espera" (Staging Area)
            // { personal_data: {...}, payment_info: {...}, items_detail: {...} }
            const stagingPayload = {
                personal_data: {
                    ...form,
                    // Campos adicionales o normalización si es necesario
                    lastname: form.lastName, // Backward compat with Schema
                    firstname: form.firstName,
                    residency_year: form.residency_year || form.residencyYear // Ensure mapping
                },
                payment_info: {
                    total_amount: finalTotal,
                    payment_account: selectedPaymentAccount, // ID o nombre de cuenta seleccionada
                    coupon_code: appliedCoupon ? appliedCoupon.code : null
                },
                items_detail: {
                    modality: selectedModality ? {
                        id: selectedModality.id,
                        title: selectedModality.title || selectedModality.name,
                        price: selectedModality.price
                    } : null,
                    workshops: selectedWorkshops.map(ws => ({
                        id: ws.id,
                        title: ws.title || ws.name,
                        price: ws.price
                    }))
                }
            };

            formDataPayload.append('registration_data', JSON.stringify(stagingPayload));

            if (voucherFile) {
                formDataPayload.append('voucher_file', voucherFile);
            }

            // D. ENVIAR AL BACKEND
            await api.auth.registerWithFile(formDataPayload);

            toast.success("¡Registro Exitoso!", { id: toastId });

            // Post-registro: canjear cupón si existe (backend podría hacerlo, pero mantenemos lógica frontend por si acaso)
            /* 
            if (appliedCoupon) {
                 try {
                     await api.coupons.redeem(appliedCoupon.code);
                 } catch (e) { console.warn("Error redeem coupon", e); }
            }
            */

            setShowSuccessModal(true);

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Error en el registro", { id: toastId });
        }
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
            showWarning('Es obligatorio adjuntar el voucher de pago cuando hay un monto a pagar. Por favor sube la imagen de tu constancia en el recuadro "Validación de Pago".', 'Voucher requerido');
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
            const currentModality = selectedModality; // Was selectedTicket
            const isVirtual = currentModality?.title.toLowerCase().includes('virtual');
            // Check for certificate based on title or explicit flag if we add it later
            const wantsCert = currentModality?.includes_certificate || currentModality?.title.toLowerCase().includes('certificado');

            const registrationData = {
                ...form,
                name: `${form.lastName} ${form.firstName}`.trim(),
                ticketType: currentModality?.id || currentModality?.code, // Use Modality ID
                workshops: selectedWorkshops.map(w => w.id), // Send IDs
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
            showError(error.message || 'Ocurrió un error desconocido. Por favor intenta nuevamente.', 'Error en la inscripción');
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
            university: '',
            specialty: ''
        };

        setFormValues(emptyValues);

        // Also call resetForm to clear validation states
        resetForm();

        // Clear all other states
        clearVoucher();
        setSelectedModality(null);
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

        const title = ticket.title || '';
        const titleLower = title.toLowerCase();

        if (titleLower.includes('certificado')) {
            icon = Award;
        }

        if (titleLower.includes('virtual')) {
            icon = Wifi;
            color = 'purple';
        }

        if (ticket.price === 0) {
            color = 'gray';
        }

        return {
            id: ticket.id,
            title: title || 'Entrada General',
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

                                    {/* Row 1: Apellidos, Nombres */}
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Apellidos *</label>
                                            <input type="text" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Pérez López" required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white ${validationErrors.lastName ? 'border-red-500 border-2' : 'border-gray-200 focus:border-blue-500'}`} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">📛 Nombres *</label>
                                            <input type="text" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Juan Carlos" required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white ${validationErrors.firstName ? 'border-red-500 border-2' : 'border-gray-200 focus:border-blue-500'}`} />
                                        </div>
                                    </div>

                                    {/* Row 2: Fecha Nacimiento, DNI, Email */}
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">🎂 Fecha de Nacimiento *</label>
                                            <div className="relative">
                                                <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white pl-10 ${validationErrors.birthDate ? 'border-red-500 border-2' : 'border-gray-200 focus:border-blue-500'}`} />
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">🆔 DNI / Pasaporte *</label>
                                            <input type="number" name="dni" value={form.dni} onChange={handleChange} placeholder="12345678" required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white ${validationErrors.dni ? 'border-red-500 border-2' : 'border-gray-200 focus:border-blue-500'}`} />
                                            {typeof validationErrors.dni === 'string' && <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.dni}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">📞 Teléfono / Celular *</label>
                                            <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="999 999 999" required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white ${validationErrors.phone ? 'border-red-500 border-2' : 'border-gray-200 focus:border-blue-500'}`} />
                                        </div>
                                    </div>

                                    {/* Row 3: Phone (New) */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">📧 Email *</label>
                                        <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="juan@ejemplo.com" required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white ${validationErrors.email ? 'border-red-500 border-2' : 'border-gray-200 focus:border-blue-500'}`} />
                                        {typeof validationErrors.email === 'string' && <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.email}</p>}
                                    </div>


                                    <div className="flex items-center gap-3 pb-2 border-b border-gray-100 mt-10">
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                            <Briefcase size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">Información Profesional</h3>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">💼 Ocupación / Cargo *</label>
                                            <select name="occupation" value={form.occupation} onChange={handleChange} required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white ${validationErrors.occupation ? 'border-red-500 border-2' : 'border-gray-200 focus:border-blue-500'}`}>
                                                <option value="">Seleccione...</option>
                                                {config?.allowed_occupations?.map((occ, i) => {
                                                    const val = typeof occ === 'string' ? occ : occ.name;
                                                    return <option key={i} value={val}>{val}</option>;
                                                })}
                                                {(!config?.allowed_occupations || config.allowed_occupations.length === 0) && (
                                                    <>
                                                        <option value="Médico Especialista">Médico Especialista</option>
                                                        <option value="Médico Residente">Médico Residente</option>
                                                        <option value="Médico General">Médico General</option>
                                                        <option value="Estudiante de Medicina">Estudiante de Medicina</option>
                                                        <option value="Otro">Otro</option>
                                                    </>
                                                )}
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
                                                {config?.allowed_institutions?.map((inst, index) => (
                                                    <option key={index} value={inst} />
                                                ))}
                                                {(!config?.allowed_institutions || config.allowed_institutions.length === 0) && institutions.map((inst, index) => (
                                                    <option key={index} value={inst} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>

                                    {/* Dynamic Fields Section */}
                                    {(() => {
                                        // Helper to determine rules
                                        const getRules = (occName) => {
                                            if (!config?.allowed_occupations) return {};
                                            const entry = config.allowed_occupations.find(o =>
                                                (typeof o === 'string' ? o : o.name) === occName
                                            );

                                            if (!entry) return {};

                                            // Fallback for legacy string-only configs
                                            if (typeof entry === 'string') {
                                                if (entry === 'Médico General') return { cmp: true };
                                                if (entry === 'Médico Especialista') return { cmp: true, rne: true, specialty: true };
                                                if (entry === 'Médico Residente') return { cmp: true, year: true, specialty: true, university: true };
                                                if (entry === 'Estudiante de Medicina') return { university: true };
                                                return {};
                                            }

                                            return entry.rules || {};
                                        };

                                        const rules = getRules(form.occupation);
                                        const hasAnyRule = Object.values(rules).some(r => r);

                                        return hasAnyRule && (
                                            <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 space-y-6 animate-fadeIn">
                                                <div className="grid md:grid-cols-3 gap-6">

                                                    {/* CMP */}
                                                    {rules.cmp && (
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700 mb-2">N° CMP *</label>
                                                            <input type="number" name="cmp" value={form.cmp} onChange={handleChange} placeholder="12345" required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white ${validationErrors.cmp ? 'border-red-500 border-2' : 'border-gray-200'}`} />
                                                            {typeof validationErrors.cmp === 'string' && <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.cmp}</p>}
                                                        </div>
                                                    )}

                                                    {/* RNE */}
                                                    {rules.rne && (
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700 mb-2">N° RNE *</label>
                                                            <input type="number" name="rne" value={form.rne} onChange={handleChange} placeholder="54321" required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white ${validationErrors.rne ? 'border-red-500 border-2' : 'border-gray-200'}`} />
                                                            {typeof validationErrors.rne === 'string' && <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.rne}</p>}
                                                        </div>
                                                    )}

                                                    {/* Residency Year */}
                                                    {rules.year && (
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Año de Residencia *</label>
                                                            <select name="residencyYear" value={form.residencyYear} onChange={handleChange} required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white ${validationErrors.residencyYear ? 'border-red-500 border-2' : 'border-gray-200'}`}>
                                                                <option value="">Seleccione...</option>
                                                                {config?.residency_years?.map((year, i) => (
                                                                    <option key={i} value={year}>{year}</option>
                                                                ))}
                                                                {(!config?.residency_years || config.residency_years.length === 0) && (
                                                                    <>
                                                                        <option value="R1">R1</option>
                                                                        <option value="R2">R2</option>
                                                                        <option value="R3">R3</option>
                                                                    </>
                                                                )}
                                                            </select>
                                                        </div>
                                                    )}

                                                    {/* Specialty */}
                                                    {rules.specialty && (
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Especialidad *</label>
                                                            <select name="specialty" value={form.specialty} onChange={handleChange} required className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white ${validationErrors.specialty ? 'border-red-500 border-2' : 'border-gray-200'}`}>
                                                                <option value="">Seleccione...</option>
                                                                {config?.participant_specialties?.map((spec, i) => (
                                                                    <option key={i} value={spec}>{spec}</option>
                                                                ))}
                                                                {(!config?.participant_specialties || config.participant_specialties.length === 0) && specialties.map((spec, i) => (
                                                                    <option key={i} value={spec}>{spec}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}

                                                    {/* University */}
                                                    {rules.university && (
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Universidad *</label>
                                                            <input
                                                                list="universities-list"
                                                                name="university"
                                                                value={form.university}
                                                                onChange={handleChange}
                                                                placeholder="Seleccione su universidad"
                                                                required
                                                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none  bg-white ${validationErrors.university ? 'border-red-500 border-2' : 'border-gray-200'}`}
                                                            />
                                                            <datalist id="universities-list">
                                                                {config?.allowed_universities?.map((univ, index) => (
                                                                    <option key={index} value={univ} />
                                                                ))}
                                                            </datalist>
                                                            {typeof validationErrors.university === 'string' && <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.university}</p>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                </div>
                            </div>
                        )}

                        {/* Step 2 Content */}
                        {currentStep === 2 && viewMode === 'registration' && (
                            <Step2Modalities
                                selectedModality={selectedModality}
                                setSelectedModality={setSelectedModality}
                                selectedWorkshops={selectedWorkshops}
                                setSelectedWorkshops={setSelectedWorkshops}
                                allModalities={allModalities}
                                allWorkshops={allWorkshops || []}
                            />
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

                        {/* Step 3 Content: Payment & Checkout */}
                        {currentStep === 3 && (
                            <div className="animate-fadeIn">
                                <Step3Payment
                                    selectedModality={selectedModality}
                                    selectedWorkshops={selectedWorkshops}
                                    coupon={appliedCoupon}
                                    setCoupon={setAppliedCoupon}
                                    voucherFile={voucherFile}
                                    setVoucherFile={handleFileChange} // useFileUpload hook returns handleFileChange which accepts event
                                    paymentAccount={selectedPaymentAccount}
                                    setPaymentAccount={setSelectedPaymentAccount}
                                    onTotalChange={setFinalTotal}
                                />

                                {/* FOOTER PROPIO DEL PASO 3 */}
                                <div className="mt-8 flex justify-end items-center border-t pt-6">
                                    <button
                                        type="button"
                                        onClick={handleFinalSubmit}
                                        className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg flex items-center gap-2 transform hover:scale-105"
                                    >
                                        {finalTotal === 0 ? (
                                            <>
                                                <CheckCircle size={20} />
                                                Confirmar Inscripción (Gratis)
                                            </>
                                        ) : (
                                            <>
                                                Pagar S/ {finalTotal.toFixed(2)} y Finalizar
                                                <ChevronRight size={20} />
                                            </>
                                        )}
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
