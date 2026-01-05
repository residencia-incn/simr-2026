import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, DollarSign, Calendar, User, RefreshCw, Upload, Image as ImageIcon, AlertTriangle, Search, Printer, FileText } from 'lucide-react';
import { Button, Card, FormField, Modal } from '../ui';
import { showError, showSuccess } from '../../utils/alerts';
import Swal from 'sweetalert2';
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
    const [searchTerm, setSearchTerm] = useState('');
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

    useEffect(() => {
        console.log('📊 ContributionsManager: Config updated. Months:', months.length);
    }, [config]);

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

    // --- Account Status Calculation ---
    const calculateAccountStatus = () => {
        if (!selectedOrganizer || !months.length) return null;

        // Contributions
        const totalContributionsExpected = months.length * (config?.contribution?.monthlyAmount || 0);
        const paidMonthsCount = contributionPlan.filter(
            c => c.organizador_id === selectedOrganizer.organizador_id && c.estado === 'pagado'
        ).length;
        const totalContributionsPaid = paidMonthsCount * (config?.contribution?.monthlyAmount || 0);
        const pendingContributionsCount = months.length - paidMonthsCount;

        // Fines (Assuming 'fines' state contains all unpaid and paid fines for selected organizer)
        const unpaidFines = fines.filter(f => f.estado === 'pendiente');
        const totalFinesPending = unpaidFines.reduce((sum, f) => sum + parseFloat(f.monto), 0);

        const totalPending = (totalContributionsExpected - totalContributionsPaid) + totalFinesPending;

        return {
            totalPending,
            pendingContributionsCount,
            totalFinesPending,
            isClean: totalPending === 0
        };
    };

    const accountStatus = calculateAccountStatus();

    const handlePrintReport = () => {
        if (!selectedOrganizer) return;

        const printWindow = window.open('', '_blank');
        const status = accountStatus;

        const htmlContent = `
            <html>
                <head>
                    <title>Estado de Cuenta - ${selectedOrganizer.organizador_nombre}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                        
                        body { 
                            font-family: 'Inter', sans-serif; 
                            background: white;
                            color: #111827;
                            padding: 20px 40px;
                        }

                        /* Print Settings */
                        @page {
                            size: A4;
                            margin: 10mm 15mm;
                        }

                        /* Header */
                        .header { 
                            display: flex; 
                            justify-content: space-between; 
                            align-items: center; 
                            border-bottom: 2px solid #2563eb; 
                            padding-bottom: 15px; 
                            margin-bottom: 25px;
                        }
                        .header h1 { 
                            margin: 0; 
                            font-size: 24px; 
                            color: #1e3a8a; 
                            font-weight: 800;
                        }
                        .header p { 
                            margin: 5px 0 0; 
                            color: #6b7280; 
                            font-size: 12px; 
                            text-transform: uppercase; 
                            letter-spacing: 0.05em;
                        }

                        /* Card Info */
                        .card { 
                            background: #f9fafb; 
                            border: 1px solid #e5e7eb; 
                            padding: 15px 20px; 
                            border-radius: 12px; 
                            margin-bottom: 25px; 
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        .card h2 { margin: 0; font-size: 18px; color: #111827; }
                        .card p { margin: 2px 0 0; color: #4b5563; font-size: 13px; }

                        /* Status Box */
                        .status-box { 
                            background-color: ${status.isClean ? '#f0fdf4' : '#fef2f2'}; 
                            border: 1px solid ${status.isClean ? '#bbf7d0' : '#fecaca'}; 
                            padding: 15px 20px; 
                            border-radius: 12px; 
                            margin-bottom: 30px; 
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        .status-label { font-weight: 600; color: #374151; font-size: 14px; }
                        .total { 
                            font-size: 28px; 
                            font-weight: 800; 
                            color: ${status.isClean ? '#166534' : '#dc2626'}; 
                            text-align: right;
                        }
                        .status-sub { font-size: 12px; color: #6b7280; text-align: right; margin-top: 4px; }

                        /* Section Titles */
                        h3 { 
                            font-size: 16px; 
                            color: #111827; 
                            margin-bottom: 12px; 
                            border-left: 4px solid #2563eb; 
                            padding-left: 10px;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }

                        /* Tables */
                        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
                        th { 
                            background-color: #f3f4f6; 
                            color: #374151; 
                            font-weight: 600; 
                            text-align: left; 
                            padding: 10px 12px;
                            border-bottom: 2px solid #e5e7eb;
                        }
                        td { 
                            padding: 10px 12px; 
                            border-bottom: 1px solid #e5e7eb; 
                            color: #4b5563; 
                        }
                        tr:last-child td { border-bottom: none; }
                        
                        /* Status Badges */
                        .badge {
                            display: inline-block;
                            padding: 2px 8px;
                            border-radius: 9999px;
                            font-size: 11px;
                            font-weight: 600;
                            text-transform: uppercase;
                        }
                        .badge-paid { background: #dcfce7; color: #166534; }
                        .badge-pending { background: #fee2e2; color: #991b1b; }
                        .badge-validating { background: #fef9c3; color: #854d0e; }

                        /* Footer */
                        .footer { 
                            margin-top: 40px; 
                            padding-top: 20px;
                            border-top: 1px solid #e5e7eb;
                            font-size: 11px; 
                            text-align: center; 
                            color: #9ca3af; 
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1>SIMR 2026</h1>
                            <p>Reporte de Tesorería</p>
                        </div>
                        <div style="text-align: right;">
                            <p><strong>Generado:</strong> ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}</p>
                        </div>
                    </div>

                    <div class="card">
                        <div>
                            <h2>${selectedOrganizer.organizador_nombre}</h2>
                            <p>${selectedOrganizer.organizador_rol || 'Miembro del Comité Organizador'}</p>
                        </div>
                        <div style="text-align: right">
                             <p><strong>Cód:</strong> ${selectedOrganizer.organizador_id.substring(0, 8)}...</p>
                        </div>
                    </div>

                    <h3>Estado Financiero</h3>
                    <div class="status-box">
                        <span class="status-label">Balance Total Pendiente</span>
                        <div>
                            <div class="total">S/ ${status.totalPending.toFixed(2)}</div>
                            <div class="status-sub">
                                ${status.isClean ? '¡Cuenta al día!' : `Incluye ${status.pendingContributionsCount} cuotas y S/ ${status.totalFinesPending} en penalidades`}
                            </div>
                        </div>
                    </div>

                    <h3>Registro de Aportes Mensuales</h3>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 40%">Mes</th>
                                <th style="width: 30%">Estado</th>
                                <th style="width: 30%; text-align: right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${months.map(m => {
            const st = getCellStatus(selectedOrganizer.organizador_id, m.id);
            const badgeClass = st === 'pagado' ? 'badge-paid' : st === 'pendiente' ? 'badge-pending' : 'badge-validating';
            return `
                                    <tr>
                                        <td><strong>${m.label}</strong></td>
                                        <td><span class="badge ${badgeClass}">${st}</span></td>
                                        <td style="text-align: right; font-family: monospace; font-size: 14px">S/ ${config?.contribution?.monthlyAmount}</td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>

                    ${fines.length > 0 ? `
                        <h3>Historial de Penalidades</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 40%">Concepto</th>
                                    <th style="width: 20%">Fecha</th>
                                    <th style="width: 20%">Estado</th>
                                    <th style="width: 20%; text-align: right">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${fines.map(f => `
                                    <tr>
                                        <td>${f.descripcion}</td>
                                        <td>${new Date(f.dueDate || f.fecha).toLocaleDateString()}</td>
                                        <td><span class="badge ${f.estado === 'pagado' ? 'badge-paid' : f.estado === 'pendiente' ? 'badge-pending' : 'badge-validating'}">${f.estado}</span></td>
                                        <td style="text-align: right; font-family: monospace; font-size: 14px">S/ ${f.monto}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : ''}

                    <div class="footer">
                        <p>Documento generado automáticamente por el Sistema de Gestión SIMR 2026</p>
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
    };

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
        if (currentStatus === 'validando') {
            // Check if we have 'pendiente' items selected - Prevent mixing
            const hasPendingSelected = selectedMonths.some(id => getCellStatus(selectedOrganizer.organizador_id, id) === 'pendiente');
            if (hasPendingSelected) {
                showError('No puedes mezclar meses pendientes con validaciones en curso.', 'Selección Inválida');
                return;
            }
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
                // Check if we have 'validando' items selected - Prevent mixing
                const hasValidatingSelected = selectedMonths.some(id => getCellStatus(selectedOrganizer.organizador_id, id) === 'validando');
                if (hasValidatingSelected) {
                    showError('No puedes mezclar meses pendientes con validaciones en curso.', 'Selección Inválida');
                    return;
                }

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

                // Refetch fines immediately to reflect status change
                const updatedFines = await api.treasury.getFines(selectedOrganizer.organizador_id);
                setFines(updatedFines);
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

    const handleReject = async () => {
        try {
            if (!selectedOrganizer) return;

            const { value: reason, isDismissed } = await Swal.fire({
                title: 'Motivo del Rechazo',
                text: 'Ingresa la razón por la cual se rechaza este pago (opcional):',
                input: 'text',
                inputPlaceholder: 'Ej. Voucher ilegible, monto incorrecto...',
                showCancelButton: true,
                confirmButtonText: 'Rechazar Pago',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#dc2626', // red-600
                cancelButtonColor: '#6b7280'
            });

            if (isDismissed || reason === undefined) return; // Cancelled

            setIsUploading(true);
            await api.treasury.rejectContribution(selectedOrganizer.organizador_id, selectedMonths, reason);

            // Reload data to show updated status
            if (onReload) {
                await onReload();
            }

            await showSuccess('El pago ha sido rechazado y regresado a pendiente.', 'Pago Rechazado');
            setIsValidatingModalOpen(false);
            setSelectedMonths([]);
        } catch (error) {
            showError(error.message, 'Error al rechazar');
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
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {organizers.filter(org => org.organizador_nombre.toLowerCase().includes(searchTerm.toLowerCase())).map((organizer) => {
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
                                        (() => {
                                            // Determine if we are validating or paying based on first selected month
                                            const firstMonthId = selectedMonths[0];
                                            const status = getCellStatus(selectedOrganizer.organizador_id, firstMonthId);
                                            const isValidating = status === 'validando';

                                            return (
                                                <Button
                                                    onClick={isValidating ? () => setIsValidatingModalOpen(true) : handleStartPayment}
                                                    className={`${isValidating ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'} text-white shadow-lg animate-bounce-subtle`}
                                                >
                                                    {isValidating ? <CheckCircle size={18} className="mr-2" /> : <DollarSign size={18} className="mr-2" />}
                                                    {isValidating ? 'Validar' : 'Registrar'} {selectedMonths.length} {selectedMonths.length === 1 ? 'Mes' : 'Meses'}
                                                </Button>
                                            );
                                        })()
                                    )}

                                    <button
                                        onClick={handlePrintReport}
                                        className="ml-2 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Imprimir Estado de Cuenta"
                                    >
                                        <Printer size={20} />
                                    </button>
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

                                </div>

                                {/* Account Status Footer */}
                                {accountStatus && (
                                    <div className={`p-4 border-t border-gray-200 ${accountStatus.isClean ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Estado de Cuenta</p>
                                                <div className={`text-2xl font-black ${accountStatus.isClean ? 'text-green-700' : 'text-red-700'}`}>
                                                    {accountStatus.isClean ? '¡Al Día!' : `S/ ${accountStatus.totalPending.toFixed(2)}`}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {accountStatus.isClean
                                                        ? 'No hay pagos pendientes.'
                                                        : `Debes: ${accountStatus.pendingContributionsCount} cuotas y S/ ${accountStatus.totalFinesPending} en penalidades`
                                                    }
                                                </p>
                                            </div>
                                            {!accountStatus.isClean && (
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-blue-600">Por Pagar</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
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
                        {/* Voucher Upload Section - Hide if validating an existing payment */}
                        {selectedFine?.estado !== 'validando' && (
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Comprobante de Pago (Imagen) <span className="text-red-500">*</span>
                                </label>

                                <div className="flex gap-4">
                                    {/* Left Column: Dropzone */}
                                    <label className="flex-1 block cursor-pointer group">
                                        <div className={`h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all ${voucherFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                required={!selectedFine}
                                            />
                                            <div className="space-y-2">
                                                {voucherFile ? (
                                                    <>
                                                        <div className="flex items-center justify-center gap-2 text-green-600">
                                                            <CheckCircle size={20} />
                                                            <span className="text-sm font-bold truncate max-w-[150px]">{voucherFile.name}</span>
                                                        </div>
                                                        <p className="text-xs text-green-600">{(voucherFile.size / 1024).toFixed(1)} KB</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                                                            <Upload size={24} className="mx-auto mb-1" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-700 group-hover:text-blue-700">
                                                                Click para subir
                                                            </p>
                                                            <p className="text-xs text-gray-400">PNG, JPG</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </label>

                                    {/* Right Column: Preview */}
                                    {voucherPreview && (
                                        <div className="w-32 h-32 border-2 border-gray-200 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center shadow-sm">
                                            <img
                                                src={voucherPreview}
                                                alt="Preview"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Footer Buttons for Fine Validation */}
                        {selectedFine?.estado === 'validando' && (
                            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setIsRecordModalOpen(false);
                                        setSelectedFine(null);
                                    }}
                                    className="flex-1"
                                >
                                    Cerrar
                                </Button>
                                <Button
                                    type="button"
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100 border border-red-200"
                                    onClick={async () => {
                                        const { value: reason, isDismissed } = await Swal.fire({
                                            title: 'Motivo del Rechazo',
                                            text: '¿Por qué rechazas este pago de penalidad?',
                                            input: 'text',
                                            showCancelButton: true,
                                            confirmButtonText: 'Rechazar',
                                            confirmButtonColor: '#dc2626'
                                        });
                                        if (isDismissed || reason === undefined) return;

                                        try {
                                            setIsUploading(true);
                                            await api.treasury.rejectFine(selectedFine.id, reason);
                                            const updatedFines = await api.treasury.getFines(selectedOrganizer.organizador_id);
                                            setFines(updatedFines);
                                            if (onReload) await onReload();
                                            showSuccess('Penalidad rechazada.', 'Rechazado');
                                            setIsRecordModalOpen(false);
                                        } catch (e) { showError(e.message); }
                                        finally { setIsUploading(false); }
                                    }}
                                >
                                    <XCircle size={18} className="mr-2" /> Rechazar
                                </Button>
                                <Button
                                    type="button"
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                                    onClick={async () => {
                                        try {
                                            setIsUploading(true);
                                            await api.treasury.validateFine(selectedFine.id, formAccountId || accounts[0]?.id);
                                            const updatedFines = await api.treasury.getFines(selectedOrganizer.organizador_id);
                                            setFines(updatedFines);
                                            if (onReload) await onReload();
                                            showSuccess('Penalidad validada correctamente.', 'Validado');
                                            setIsRecordModalOpen(false);
                                        } catch (e) { showError(e.message); }
                                        finally { setIsUploading(false); }
                                    }}
                                >
                                    <CheckCircle size={18} className="mr-2" /> Validar
                                </Button>
                            </div>
                        )}

                        {/* Footer Buttons for Record/Upload */}
                        {selectedFine?.estado !== 'validando' && (
                            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setIsRecordModalOpen(false);
                                        setSelectedFine(null);
                                    }}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleApproveSubmit}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                                    loading={isUploading}
                                    disabled={!voucherFile && !selectedFine}
                                >
                                    <Upload size={18} className="mr-2" />
                                    {selectedFine ? 'Enviar Pago' : 'Registrar Pago'}
                                </Button>
                            </div>
                        )}
                    </form>
                )}
            </Modal >

            {/* Validation Modal */}
            < Modal
                isOpen={isValidatingModalOpen}
                onClose={() => {
                    setIsValidatingModalOpen(false);
                    setSelectedMonths([]); // Clear selection when closing validation modal
                }}
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
                                            onClick={() => {
                                                setIsValidatingModalOpen(false);
                                                setSelectedMonths([]); // Clear selection on cancel
                                            }}
                                            className="flex-1"
                                        >
                                            Cerrar
                                        </Button>

                                        <Button
                                            type="button"
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100 border border-red-200"
                                            onClick={handleReject}
                                            disabled={isUploading}
                                        >
                                            <XCircle size={18} className="mr-2" /> Rechazar
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
