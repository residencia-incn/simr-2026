import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, DollarSign, Calendar, User, RefreshCw, Upload, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { Button, Card, FormField, Modal } from '../ui';
import { showError, showSuccess } from '../../utils/alerts';
import { api } from '../../services/api';

const ContributionsManager = ({
    contributionPlan,
    contributionStatus,
    config,
    accounts,
    onRecordContribution,
    onApproveContribution,
    onInitializePlan,
    onReload,
    onRecordFine
}) => {
    const [selectedMonths, setSelectedMonths] = useState([]); // Array of month IDs
    const [selectedOrganizer, setSelectedOrganizer] = useState(null);
    const [selectedFine, setSelectedFine] = useState(null); // New State for selected fine
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [isValidatingModalOpen, setIsValidatingModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [voucherUrl, setVoucherUrl] = useState('');
    const [voucherFile, setVoucherFile] = useState(null);
    const [voucherPreview, setVoucherPreview] = useState(null);
    const [fines, setFines] = useState([]);
    const [loadingFines, setLoadingFines] = useState(false);

    const organizers = contributionStatus || [];
    const months = config?.contribution?.months || [];

    // --- Helper Functions ---
    const getCellStatus = (organizadorId, mes) => {
        const contrib = contributionPlan.find(
            c => (c.organizador_id === organizadorId) && c.mes === mes
        );
        return contrib?.estado || 'pendiente';
    };

    const getStatusStyles = (estado, isSelected) => {
        if (isSelected) return 'bg-blue-600 border-blue-700 text-white ring-2 ring-blue-300 transform scale-105 z-10';

        switch (estado) {
            case 'pagado':
                return 'bg-green-50 border-green-200 text-green-800 opacity-90';
            case 'validando':
                return 'bg-yellow-50 border-yellow-300 text-yellow-800 animate-pulse';
            case 'pendiente':
                return 'bg-white border-dashed border-red-200 text-red-800 hover:border-red-400 hover:bg-red-50 cursor-pointer';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-500';
        }
    };

    // --- Debt Calculation Logic ---
    const calculateDebtStatus = () => {
        if (!selectedOrganizer || !months.length || !config) return null;

        const pendingMonths = months.filter(m => {
            const status = getCellStatus(selectedOrganizer.organizador_id, m.id);
            return status !== 'pagado' && status !== 'validando'; // 'pendiente' basically
        });

        if (pendingMonths.length === 0) {
            return { status: 'ok', label: 'Al Día', color: 'green', message: 'No tiene cuotas pendientes.' };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let isLate = false;
        let totalDebt = pendingMonths.length * (config.contribution.monthlyAmount || 0);

        // Check if any pending month is past deadline
        pendingMonths.forEach(m => {
            if (m.deadline) {
                // Parse "YYYY-MM-DD" safely (assuming local deadline or UTC, usually safer to treat as string comparison if format matches)
                // But let's use Date comparison
                const deadlineDate = new Date(m.deadline);
                // fix timezone offset issue by treating string as YYYY/MM/DD or just comparing timestamps
                // Simplest: comparison of strings YYYY-MM-DD works if ISO.
                // today.toISOString().split('T')[0] > m.deadline

                // Using Date object for safety:
                // Adjust deadline to end of day? No, usually end of day.
                deadlineDate.setHours(23, 59, 59, 999);
                // Actually parse properly to avoid timezone shifts (Date("2026-01-31") might vary).
                // Let's use string comparison for robustness with YYYY-MM-DD
                const todayStr = new Date().toISOString().split('T')[0];
                if (todayStr > m.deadline) {
                    isLate = true;
                }
            }
        });

        if (isLate) {
            return {
                status: 'late',
                label: 'Fuera de Fecha',
                color: 'red',
                message: `Tiene ${pendingMonths.length} cuotas pendientes (S/ ${totalDebt})`,
                amount: totalDebt
            };
        } else {
            return {
                status: 'debt',
                label: 'Por Pagar',
                color: 'blue',
                message: `Tiene ${pendingMonths.length} cuotas pendientes (S/ ${totalDebt})`,
                amount: totalDebt
            };
        }
    };

    const debtStatus = calculateDebtStatus();

    // Auto-select organizer from URL params (Notification link)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const organizerId = params.get('organizerId');

        if (organizerId && organizers.length > 0 && !selectedOrganizer) {
            const targetOrganizer = organizers.find(o => o.organizador_id === organizerId);
            if (targetOrganizer) {
                setSelectedOrganizer(targetOrganizer);

                // Find first pending validation to auto-open modal
                const firstPending = contributionPlan.find(c => c.organizador_id === organizerId && c.estado === 'validando');

                if (firstPending) {
                    const voucherGroup = firstPending.comprobante
                        ? contributionPlan.filter(c =>
                            c.organizador_id === organizerId &&
                            c.estado === 'validando' &&
                            c.comprobante === firstPending.comprobante
                        ).map(c => c.mes)
                        : [firstPending.mes];

                    if (voucherGroup.length > 0) {
                        setSelectedMonths(voucherGroup);
                        setIsValidatingModalOpen(true);
                    }
                }

                // Clear the param from URL to avoid re-selecting on refresh
                // but keep the other params
                params.delete('organizerId');
                const newQuery = params.toString();
                const newUrl = window.location.pathname + (newQuery ? '?' + newQuery : '');
                window.history.replaceState({}, '', newUrl);
            }
        }
    }, [organizers, selectedOrganizer, contributionPlan]);

    // Fetch Fines when Organizer is selected
    useEffect(() => {
        const fetchOrganizerFines = async () => {
            if (!selectedOrganizer) {
                setFines([]);
                return;
            }
            try {
                setLoadingFines(true);
                const results = await api.treasury.getFines(selectedOrganizer.organizador_id);
                setFines(results);
            } catch (error) {
                console.error("Error fetching fines:", error);
            } finally {
                setLoadingFines(false);
            }
        };

        fetchOrganizerFines();
    }, [selectedOrganizer]);

    // Simulate cloud upload - Replace this with your actual cloud storage service
    const uploadToCloud = async (file) => {
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In production, you would upload to your cloud storage (e.g., AWS S3, Cloudinary, etc.)
        // For now, we'll create a local object URL and simulate a cloud URL
        const simulatedCloudUrl = `https://storage.simr2026.com/vouchers/${Date.now()}_${file.name}`;

        console.log('📤 Uploading voucher to cloud:', file.name);
        console.log('✅ Simulated cloud URL:', simulatedCloudUrl);

        return simulatedCloudUrl;
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showError('Por favor selecciona un archivo de imagen válido.', 'Tipo de archivo inválido');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError('El archivo es demasiado grande. Máximo 5MB.', 'Archivo muy grande');
            return;
        }

        setVoucherFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setVoucherPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleOrganizerSelect = (org) => {
        setSelectedOrganizer(org);
        setSelectedMonths([]);
        setSelectedFine(null); // Reset fine selection
    };

    const handleFineClick = (fine) => {
        setSelectedFine(fine);
        setSelectedMonths([]); // Clear month selection
        setIsRecordModalOpen(true);
    };

    const handleCellClick = (monthId) => {
        if (!selectedOrganizer) return;

        const currentStatus = getCellStatus(selectedOrganizer.organizador_id, monthId);

        // If it's validating, open validation modal and select ALL months with same voucher
        if (currentStatus === 'validando' && selectedMonths.length === 0) {
            // Find the contribution for this month
            const clickedContrib = contributionPlan.find(
                c => c.organizador_id === selectedOrganizer.organizador_id && c.mes === monthId
            );

            if (clickedContrib && clickedContrib.comprobante) {
                // Find ALL months with the same voucher/comprobante
                const relatedMonths = contributionPlan
                    .filter(c =>
                        c.organizador_id === selectedOrganizer.organizador_id &&
                        c.estado === 'validando' &&
                        c.comprobante === clickedContrib.comprobante
                    )
                    .map(c => c.mes);

                console.log('📋 Seleccionando meses relacionados con el mismo voucher:', relatedMonths);
                setSelectedMonths(relatedMonths);
            } else {
                setSelectedMonths([monthId]);
            }

            setIsValidatingModalOpen(true);
            return;
        }

        if (currentStatus === 'pagado') return;

        // Multi-selection logic for 'pendiente'
        if (currentStatus === 'pendiente') {
            const isAlreadySelected = selectedMonths.includes(monthId);

            if (isAlreadySelected) {
                // If we deselect, we must deselect everything AFTER it as well to maintain sequence
                const monthIdx = months.findIndex(m => m.id === monthId);
                const newSelection = selectedMonths.filter(id => {
                    const idx = months.findIndex(m => m.id === id);
                    return idx < monthIdx;
                });
                setSelectedMonths(newSelection);
            } else {
                // If we select, we must ensure all previous months are either Green, Yellow, or already selected
                const monthIdx = months.findIndex(m => m.id === monthId);

                // Check if there are any gaps
                const pendingPreviousCount = months.slice(0, monthIdx).filter(m => {
                    const status = getCellStatus(selectedOrganizer.organizador_id, m.id);
                    return status === 'pendiente' && !selectedMonths.includes(m.id);
                }).length;

                if (pendingPreviousCount > 0) {
                    showError('Debes seleccionar los meses anteriores en orden secuencial.', 'Orden de Pago');
                    return;
                }

                setSelectedMonths([...selectedMonths, monthId]);
            }
        }
    };

    const handleStartPayment = () => {
        if (selectedMonths.length === 0) return;
        setSelectedFine(null); // Ensure no fine is selected
        setIsRecordModalOpen(true);
    };

    const handleRecordSubmit = async (e) => {
        e.preventDefault();

        // Validate voucher file is provided (unless approving validation)
        const isApproving = selectedFine?.estado === 'validando';
        if (!voucherFile && !isApproving) {
            showError('Debes subir el comprobante de pago (imagen).', 'Campo Obligatorio');
            return;
        }

        try {
            setIsUploading(true);

            // Upload file to cloud and get URL (or use existing if approving)
            let uploadedUrl = selectedFine?.voucher || '';
            if (voucherFile) {
                uploadedUrl = await uploadToCloud(voucherFile);
            }

            const totalAmount = selectedMonths.length * (config?.contribution?.monthlyAmount || 0);

            // Get accountId from form or default
            const formData = new FormData(e.target);
            const formAccountId = formData.get('accountId');
            const defaultAccountId = formAccountId || config?.contribution?.defaultContributionAccount || (accounts[0]?.id);

            if (!defaultAccountId) {
                showError('Debes seleccionar una cuenta de destino.', 'Cuenta Requerida');
                return;
            }

            const notes = selectedFine ? `Pago de penalidad: ${selectedFine.descripcion}` : null;

            if (selectedFine) {
                await onRecordFine(
                    selectedFine.id,
                    defaultAccountId,
                    uploadedUrl,
                    notes
                );
            } else {
                await onRecordContribution(
                    selectedOrganizer.organizador_id,
                    selectedMonths,
                    defaultAccountId,
                    totalAmount,
                    uploadedUrl
                );
            }

            setIsRecordModalOpen(false);
            setSelectedMonths([]);
            setSelectedFine(null);
            setVoucherUrl('');
            setVoucherFile(null);
            setVoucherPreview(null);
        } catch (error) {
            showError(error.message, 'Error al registrar pago');
        } finally {
            setIsUploading(false);
        }
    };

    const handleApproveSubmit = async () => {
        try {
            setIsUploading(true);
            const defaultAccountId = config?.contribution?.defaultContributionAccount || (accounts[0]?.id);

            await onApproveContribution(
                selectedOrganizer.organizador_id,
                selectedMonths,
                defaultAccountId
            );

            // Reload data to show updated status
            if (onReload) {
                await onReload();
            }

            // Show success alert with SweetAlert2
            const mesLabels = selectedMonths.map(id => months.find(m => m.id === id)?.label).join(', ');
            await showSuccess(
                `Organizador: ${selectedOrganizer.organizador_nombre}\nMeses validados: ${mesLabels}`,
                'Pago Validado Correctamente'
            );

            setIsValidatingModalOpen(false);
            setSelectedMonths([]);
        } catch (error) {
            showError(error.message, 'Error al validar pago');
        } finally {
            setIsUploading(false);
        }
    };



    // Calcular totales
    const [totalPaidFines, setTotalPaidFines] = useState(0);

    // Fetch global paid fines to add to revenue
    useEffect(() => {
        const fetchTotalFines = async () => {
            try {
                const allFines = await api.treasury.getFines();
                const paid = allFines
                    .filter(f => f.estado === 'pagado')
                    .reduce((sum, f) => sum + parseFloat(f.monto || 0), 0);
                setTotalPaidFines(paid);
            } catch (e) {
                console.error("Error fetching total fines:", e);
            }
        };
        fetchTotalFines();
    }, [contributionPlan, fines]); // Re-fetch when plan or fines update

    const totalExpected = organizers.reduce((sum, org) => sum + org.total_esperado, 0);
    const totalPaidQuotas = organizers.reduce((sum, org) => sum + org.total_pagado, 0);
    const totalPaid = totalPaidQuotas + totalPaidFines;
    const totalPending = totalExpected - totalPaidQuotas;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Gestión de Aportes</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Validación y registro de aportes mensuales de organizadores
                    </p>
                </div>
                {contributionPlan.length === 0 && (
                    <Button
                        onClick={onInitializePlan}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    >
                        <RefreshCw size={18} className="mr-2" />
                        Inicializar Plan
                    </Button>
                )}
            </div>

            {/* Summary Cards */}
            {contributionPlan.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 bg-white border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Esperado</p>
                                <p className="text-2xl font-bold text-gray-900">S/ {totalExpected.toLocaleString()}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-white border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-50 rounded-xl text-green-600">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Recaudado</p>
                                <p className="text-2xl font-bold text-green-600">S/ {totalPaid.toLocaleString()}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-white border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-50 rounded-xl text-red-600">
                                <XCircle size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pendiente</p>
                                <p className="text-2xl font-bold text-red-600">S/ {totalPending.toLocaleString()}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Master-Detail Layout */}
            {contributionPlan.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Organizer List */}
                    <Card className="lg:col-span-1 overflow-hidden flex flex-col h-[600px] p-0 border-gray-200">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar organizador..."
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {organizers.map((organizer) => {
                                const isSelected = selectedOrganizer?.organizador_id === organizer.organizador_id;
                                const progress = (organizer.total_pagado / organizer.total_esperado) * 100;

                                return (
                                    <button
                                        key={organizer.organizador_id}
                                        onClick={() => handleOrganizerSelect(organizer)}
                                        className={`w-full text-left p-4 rounded-xl transition-all border ${isSelected
                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                            : 'hover:bg-gray-50 border-transparent'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`font-bold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                                {organizer.organizador_nombre}
                                            </span>
                                            {progress >= 100 && <CheckCircle size={14} className="text-green-500" />}
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                            <span>S/ {organizer.total_pagado} / {organizer.total_esperado}</span>
                                            <span className="font-bold">{Math.round(progress)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Right Column: Details */}
                    <div className="lg:col-span-2 h-[600px]">
                        {selectedOrganizer ? (
                            <Card className="h-full flex flex-col p-0 overflow-hidden border-gray-200">
                                {/* Detail Header */}
                                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center border border-gray-200 shadow-sm text-blue-600">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 leading-tight">{selectedOrganizer.organizador_nombre}</h2>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                <Calendar size={12} />
                                                <span>Cronograma de Aportes</span>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedMonths.length > 0 && (
                                        <Button
                                            onClick={handleStartPayment}
                                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg animate-bounce-subtle"
                                        >
                                            <DollarSign size={18} className="mr-2" />
                                            Registrar {selectedMonths.length} {selectedMonths.length === 1 ? 'Mes' : 'Meses'}
                                        </Button>
                                    )}
                                </div>

                                {/* Detail Body (Months) */}
                                <div className="p-6 flex-1 overflow-y-auto bg-white/50">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {months.map(month => {
                                            const estado = getCellStatus(selectedOrganizer.organizador_id, month.id);
                                            const isSelected = selectedMonths.includes(month.id);
                                            const isPaid = estado === 'pagado';
                                            const isValidating = estado === 'validando';

                                            return (
                                                <button
                                                    key={month.id}
                                                    onClick={() => handleCellClick(month.id)}
                                                    className={`
                                                        relative p-4 rounded-2xl border-2 text-left transition-all duration-200 group
                                                        ${getStatusStyles(estado, isSelected)}
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-bold text-sm tracking-tight">
                                                            {month.label}
                                                        </span>
                                                        {isPaid ? (
                                                            <CheckCircle size={18} className="text-green-600" />
                                                        ) : isValidating ? (
                                                            <RefreshCw size={18} className="text-yellow-600 animate-spin" />
                                                        ) : isSelected ? (
                                                            <CheckCircle size={18} className="text-white" />
                                                        ) : (
                                                            <div className="h-5 w-5 rounded-full border-2 border-red-100 group-hover:border-red-300 transition-colors" />
                                                        )}
                                                    </div>

                                                    <div className="text-sm font-medium">
                                                        {isPaid ? (
                                                            <span className="text-green-700 text-xs py-0.5 px-2 bg-green-100 rounded-full">Validado</span>
                                                        ) : isValidating ? (
                                                            <span className="text-yellow-700 text-xs py-0.5 px-2 bg-yellow-100 rounded-full">Por Validar</span>
                                                        ) : (
                                                            <span className={`${isSelected ? 'text-white' : 'text-red-500'} text-xs font-bold`}>
                                                                S/ {config?.contribution?.monthlyAmount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Penalties Section */}
                                    {/* Penalties Section */}
                                    {fines.length > 0 && (
                                        <div className="mb-6 mt-6">
                                            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                <AlertTriangle size={16} />
                                                Penalidades ({fines.length})
                                            </h4>
                                            <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                {fines.map(fine => {
                                                    const isPaid = fine.estado === 'pagado';
                                                    const isValidating = fine.estado === 'validando';
                                                    const isPending = fine.estado === 'pendiente';

                                                    return (
                                                        <div
                                                            key={fine.id}
                                                            onClick={() => !isPaid && handleFineClick(fine)}
                                                            className={`
                                                            border rounded-lg p-3 flex justify-between items-center shadow-sm transition-colors group
                                                            ${isPaid ? 'bg-green-50 border-green-200' : 'bg-white border-red-200 cursor-pointer hover:bg-red-50'}
                                                        `}
                                                        >
                                                            <div>
                                                                <p className={`text-sm font-bold ${isPaid ? 'text-green-800' : 'text-red-800'}`}>{fine.descripcion}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${isPaid ? 'text-green-600 bg-green-100 border-green-200' : 'text-red-600 bg-red-50 border-red-100'}`}>
                                                                        {isPaid ? 'Pagado' : `Vence: ${new Date(fine.dueDate + 'T00:00:00').toLocaleDateString('es-PE')}`}
                                                                    </span>
                                                                    {isValidating && (
                                                                        <span className="text-[10px] text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full font-bold animate-pulse border border-yellow-200">
                                                                            En Validación
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] text-gray-400">
                                                                        {new Date(fine.fecha + 'T00:00:00').toLocaleDateString('es-PE')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className={`font-bold ${isPaid ? 'text-green-700' : 'text-red-700'}`}>S/ {parseFloat(fine.monto).toFixed(2)}</p>
                                                                {!isPaid && (
                                                                    <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider group-hover:underline">
                                                                        {isValidating ? 'Validar' : 'Pagar Ahora'}
                                                                    </span>
                                                                )}
                                                                {isPaid && (
                                                                    <span className="flex items-center justify-end gap-1 text-[10px] text-green-600 font-bold uppercase tracking-wider">
                                                                        <CheckCircle size={12} /> Pagado
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Status Banner */}
                                    {debtStatus && debtStatus.status !== 'ok' && (
                                        <div className={`px-4 py-2 rounded-xl text-sm font-bold flex flex-col items-end ${debtStatus.status === 'late' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            <span className="uppercase text-[10px] opacity-80">{debtStatus.status === 'late' ? 'Estado Crítico' : 'Estado de Cuenta'}</span>
                                            <span className="flex items-center gap-1">
                                                {debtStatus.status === 'late' ? <XCircle size={16} /> : <DollarSign size={16} />}
                                                {debtStatus.label}
                                            </span>
                                            <span className="text-xs font-normal mt-0.5">{debtStatus.message}</span>
                                        </div>
                                    )}
                                    {debtStatus && debtStatus.status === 'ok' && (
                                        <div className="px-4 py-2 rounded-xl text-sm font-bold bg-green-50 text-green-600 flex flex-col items-end">
                                            <span className="uppercase text-[10px] opacity-80">Estado de Cuenta</span>
                                            <span className="flex items-center gap-1"><CheckCircle size={16} /> {debtStatus.label}</span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                                <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center border border-gray-100 shadow-sm mb-6 text-gray-300">
                                    <User size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Selecciona un Organizador</h3>
                                <p className="text-gray-500 max-w-xs text-sm leading-relaxed">
                                    Busca y selecciona un miembro del comité en la lista izquierda para gestionar sus aportes mensuales.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <Card className="p-12 text-center border-gray-200 bg-gray-50/50 rounded-2xl border-2 border-dashed">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-6" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Plan de Aportes No Configurado</h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                        Inicializa el sistema de aportes para generar el cronograma de todos los miembros del comité organizador.
                    </p>
                    <Button
                        onClick={onInitializePlan}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl px-8"
                    >
                        <RefreshCw size={18} className="mr-2" />
                        Inicializar Ahora
                    </Button>
                </Card>
            )}

            {/* Record Payment Modal */}
            <Modal
                isOpen={isRecordModalOpen}
                onClose={() => setIsRecordModalOpen(false)}
                title={selectedFine?.estado === 'validando' ? "Validar Pago de Penalidad" : "Registrar Pago Directo"}
            >
                {selectedOrganizer && (
                    <form onSubmit={handleRecordSubmit} className="space-y-6">
                        {/* Validation Notice for Validating Fines */}
                        {selectedFine?.estado === 'validando' && (
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-yellow-100 rounded-full text-yellow-700 mt-0.5">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-yellow-900 text-sm">Pago en Revisión</h4>
                                        <p className="text-xs text-yellow-700 mt-1">
                                            Este pago ha sido enviado por el organizador y requiere tu aprobación.
                                            Verifica el comprobante antes de confirmar.
                                        </p>
                                        {selectedFine.voucher && (
                                            <a
                                                href={selectedFine.voucher}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-blue-600 hover:underline"
                                            >
                                                <ImageIcon size={14} /> Ver Comprobante Original
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Organizador</span>
                                <span className="font-bold text-gray-900">{selectedOrganizer.organizador_nombre}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">{selectedFine ? 'Concepto' : `Periodos (${selectedMonths.length})`}</span>
                                {selectedFine ? (
                                    <span className="font-bold text-red-600 uppercase tracking-tight">{selectedFine.descripcion}</span>
                                ) : (
                                    <span className="font-bold text-blue-600">
                                        {selectedMonths.map(id => months.find(m => m.id === id)?.label).join(', ')}
                                    </span>
                                )}
                            </div>
                            {selectedFine && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Categoría</span>
                                    <span className="font-bold text-gray-700 bg-gray-200 px-2 py-0.5 rounded text-xs">Penalidades</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Cuenta de Destino</span>
                                {config?.contribution?.defaultContributionAccount ? (
                                    <>
                                        <span className="font-bold text-gray-900 text-right">
                                            {(() => {
                                                const acc = accounts.find(a => a.id === config.contribution.defaultContributionAccount);
                                                return acc ? (acc.nombre || 'Cuenta sin nombre') : 'Cuenta no encontrada';
                                            })()}
                                        </span>
                                        <input type="hidden" name="accountId" value={config.contribution.defaultContributionAccount} />
                                    </>
                                ) : (
                                    <select
                                        name="accountId"
                                        className="font-bold text-gray-900 bg-transparent border-none focus:ring-0 text-right p-0 cursor-pointer"
                                        defaultValue={accounts[0]?.id}
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.nombre} ({acc.tipo})</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="h-px bg-gray-200" />
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm font-medium tracking-tight">Monto Total</span>
                                <span className={`text-2xl font-black ${selectedFine ? 'text-red-600' : 'text-green-600'}`}>
                                    S/ {(selectedFine ? parseFloat(selectedFine.monto) : selectedMonths.length * (config?.contribution?.monthlyAmount || 0)).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* File Upload Section */}
                        {/* Voucher Upload Section - Hide if validating an existing payment */}
                        {selectedFine?.estado !== 'validando' && (
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Comprobante de Pago (Imagen) <span className="text-red-500">*</span>
                                </label>
                                <label className="block cursor-pointer group">
                                    <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${voucherFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            required={!selectedFine}
                                        />
                                        <div className="space-y-3">
                                            {voucherFile ? (
                                                <>
                                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                                        <CheckCircle size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-green-800">{voucherFile.name}</p>
                                                        <p className="text-xs text-green-600">{(voucherFile.size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                    <p className="text-xs text-gray-400">Click para cambiar archivo</p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500 rounded-full flex items-center justify-center mx-auto transition-colors">
                                                        <Upload size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-700 group-hover:text-blue-700">
                                                            Click para subir <span className="font-normal text-gray-500">o arrastra la imagen</span>
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG hasta 5MB</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </label>
                            </div>
                        )}
                        {voucherPreview && (
                            <div className="w-32 h-32 border-2 border-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                                <img
                                    src={voucherPreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setIsRecordModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                type="submit"
                                loading={isUploading}
                            >
                                <CheckCircle size={18} className="mr-2" />
                                {selectedFine?.estado === 'validando' ? 'Aprobar Pago' : 'Confirmar Pago'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal >

            {/* Validation Modal */}
            < Modal
                isOpen={isValidatingModalOpen}
                onClose={() => setIsValidatingModalOpen(false)}
                title="Validar Aporte de Organizador"
            >
                {selectedOrganizer && selectedMonths.length > 0 && (
                    <div className="space-y-6">
                        {(() => {
                            // Find the specific contribution to get the voucher
                            const target = contributionPlan.find(c => c.organizador_id === selectedOrganizer.organizador_id && c.mes === selectedMonths[0]);
                            return (
                                <>
                                    <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-100 space-y-4 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-yellow-700">Organizador</span>
                                            <span className="font-bold text-yellow-900">{selectedOrganizer.organizador_nombre}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-yellow-700">Mes{selectedMonths.length > 1 ? 'es' : ''} a Validar</span>
                                            <span className="font-bold text-yellow-900">
                                                {selectedMonths.map(id => months.find(m => m.id === id)?.label).join(', ')}
                                            </span>
                                        </div>
                                        <div className="h-px bg-yellow-200" />
                                        <div>
                                            <p className="text-yellow-700 mb-2 font-medium">Comprobante enviado:</p>
                                            {target?.comprobante ? (
                                                <a
                                                    href={target.comprobante}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 p-3 bg-white border border-yellow-200 rounded-xl text-blue-600 hover:text-blue-700 font-bold transition-all w-full"
                                                >
                                                    <Calendar size={20} />
                                                    Ver Comprobante Adjunto
                                                </a>
                                            ) : (
                                                <div className="p-4 bg-white/50 border border-yellow-200 rounded-xl text-yellow-600 italic text-center">
                                                    No se adjuntó archivo visual
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setIsValidatingModalOpen(false)}
                                            className="flex-1"
                                        >
                                            Cerrar
                                        </Button>
                                        <Button
                                            onClick={handleApproveSubmit}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                                            loading={isUploading}
                                        >
                                            <CheckCircle size={18} className="mr-2" />
                                            Validar Pago
                                        </Button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </Modal >
        </div >
    );
};

export default ContributionsManager;
