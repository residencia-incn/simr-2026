import React from 'react';
import { Award, CheckCircle, XCircle, Clock, FileText, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const CertificateDetailsModal = ({ isOpen, onClose, attendee, onValidate }) => {
    if (!attendee) return null;

    // --- Logic for Status ---
    // Assuming passing grade is 14/20 and min attendance is 80% (mock logic)
    // "Pendiente" if grade is null/undefined (course ongoing)

    // NOTE: The user specified "Pendiente" while course is ongoing. 
    // "Desaprobado" if grade < 14.
    // "Aprobado" if grade >= 14 AND attendance ok.

    // We will assume data has `grade` (0-20) and `attendancePercentage` (0-100).
    // If data is missing these, we treat as Pending.

    const MIN_GRADE = 14;
    const MIN_ATTENDANCE = 70; // Example config

    let status = 'pending'; // pending, approved, failed

    if (attendee.grade !== undefined && attendee.grade !== null && attendee.attendancePercentage !== undefined) {
        if (attendee.grade >= MIN_GRADE && attendee.attendancePercentage >= MIN_ATTENDANCE) {
            status = 'approved';
        } else {
            status = 'failed';
        }
    }

    const getStatusConfig = () => {
        switch (status) {
            case 'approved':
                return {
                    label: 'APROBADO',
                    color: 'bg-green-100 text-green-700 border-green-200',
                    icon: CheckCircle,
                    description: 'Cumple con todos los requisitos académicos y de asistencia.'
                };
            case 'failed':
                return {
                    label: 'DESAPROBADO',
                    color: 'bg-red-100 text-red-700 border-red-200',
                    icon: XCircle,
                    description: 'No cumple con la nota mínima o el porcentaje de asistencia.'
                };
            default:
                return {
                    label: 'PENDIENTE',
                    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                    icon: Clock,
                    description: 'El curso está en progreso. Notas finales aún no disponibles.'
                };
        }
    };

    const config = getStatusConfig();
    const StatusIcon = config.icon;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalle de Certificación" size="md">
            <div className="space-y-6">

                {/* Header User Info */}
                <div className="text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-3">
                        <span className="text-2xl font-bold text-gray-500">
                            {attendee.name.charAt(0)}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{attendee.name}</h3>
                    <p className="text-gray-500 font-medium">{attendee.role}</p>
                </div>

                {/* Status Banner */}
                <div className={`p-4 rounded-xl border flex items-start gap-4 ${config.color}`}>
                    <div className="mt-1"><StatusIcon size={24} /></div>
                    <div>
                        <h4 className="font-bold text-lg">{config.label}</h4>
                        <p className="text-sm opacity-90">{config.description}</p>
                    </div>
                </div>

                {/* Requirements Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                        <div className="text-sm text-gray-500 mb-1">Nota Examen</div>
                        <div className={`text-2xl font-bold ${attendee.grade >= MIN_GRADE ? 'text-green-600' : (status === 'pending' ? 'text-gray-400' : 'text-red-600')}`}>
                            {attendee.grade !== undefined && attendee.grade !== null ? attendee.grade : '-'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Mínimo: {MIN_GRADE}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                        <div className="text-sm text-gray-500 mb-1">Asistencia</div>
                        <div className={`text-2xl font-bold ${attendee.attendancePercentage >= MIN_ATTENDANCE ? 'text-green-600' : (status === 'pending' ? 'text-gray-400' : 'text-red-600')}`}>
                            {attendee.attendancePercentage !== undefined ? `${attendee.attendancePercentage}%` : '-'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Mínimo: {MIN_ATTENDANCE}%</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                    {status === 'approved' && (
                        <Button
                            onClick={() => onValidate(attendee.id, 'approval')}
                            className="w-full justify-center bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle size={18} className="mr-2" />
                            Validar y Generar Certificado de Aprobación
                        </Button>
                    )}

                    {(status === 'failed' || status === 'approved') && (
                        <Button
                            variant="secondary"
                            onClick={() => onValidate(attendee.id, 'attendance')}
                            className="w-full justify-center"
                        >
                            <FileText size={18} className="mr-2" />
                            Generar Solo Constancia de Asistencia
                        </Button>
                    )}

                    {status === 'pending' && (
                        <p className="text-center text-sm text-gray-500 italic">
                            Opciones de validación disponibles al finalizar el curso.
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default CertificateDetailsModal;
