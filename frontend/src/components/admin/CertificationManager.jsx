import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Award, Download, Eye } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import CertificateDetailsModal from './CertificateDetailsModal';
import { api } from '../../services/api';

const CertificationManager = ({ attendees }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [localAttendees, setLocalAttendees] = useState(attendees);
    const [selectedAttendee, setSelectedAttendee] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDownloadsActive, setIsDownloadsActive] = useState(false);

    // Initial load
    React.useEffect(() => {
        const loadConfig = async () => {
            const config = await api.content.getConfig();
            setIsDownloadsActive(config.certificatesActivated || false);
        };
        loadConfig();
    }, []);

    const handleRowClick = (attendee) => {
        setSelectedAttendee(attendee);
        setIsModalOpen(true);
    };

    const handleActivateDownloads = async () => {
        if (window.confirm('¿Estás seguro? Al activar las descargas se bloqueará el envío de nuevas justificaciones para todos los usuarios.')) {
            const config = await api.content.getConfig();
            config.certificatesActivated = true;
            await api.content.saveConfig(config);
            setIsDownloadsActive(true);
            window.alert('Descarga de certificados ACTIVADA. Se han bloqueado las justificaciones.');
        }
    };

    const handleValidate = (id, type) => {
        setLocalAttendees(prev => prev.map(att => {
            if (att.id === id) {
                if (type === 'approval') {
                    return { ...att, certificationApproved: true };
                } else if (type === 'attendance') {
                    return { ...att, attendanceCertificateGenerated: true };
                } else if (type === 'approve_justification') {
                    return { ...att, justificationStatus: 'approved' };
                } else if (type === 'reject_justification') {
                    return { ...att, justificationStatus: 'rejected' };
                }
            }
            return att;
        }));

        if (type === 'approve_justification' || type === 'reject_justification') {
            setSelectedAttendee(prev => {
                if (type === 'approve_justification') return { ...prev, justificationStatus: 'approved' };
                if (type === 'reject_justification') return { ...prev, justificationStatus: 'rejected' };
                return prev;
            });
            return;
        }

        setIsModalOpen(false);
        const message = type === 'approval'
            ? 'Certificado de Aprobación generado validado con éxito.'
            : 'Constancia de Asistencia generada con éxito.';
        window.alert(message);
    };

    const filteredAttendees = localAttendees.filter(attendee =>
        attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendee.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full"><Award size={24} /></div>
                    <div>
                        <div className="text-sm text-gray-600">Certificados Aprobados</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {localAttendees.filter(a => a.certificationApproved).length}
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><CheckCircle size={24} /></div>
                    <div>
                        <div className="text-sm text-gray-600">Promedio General</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {(localAttendees.filter(a => a.grade).length > 0)
                                ? (localAttendees.reduce((acc, curr) => acc + (curr.grade || 0), 0) / localAttendees.filter(a => a.grade).length).toFixed(1)
                                : '0.0'
                            }
                        </div>
                    </div>
                </div>
                {/* Global Actions */}
                <div className="flex flex-col gap-3 justify-center">
                    <Button
                        onClick={handleActivateDownloads}
                        className={`w-full justify-center text-white ${isDownloadsActive ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                        disabled={isDownloadsActive}
                    >
                        <Award size={18} className="mr-2" />
                        {isDownloadsActive ? 'Descargas Activadas' : 'Activar Descargas'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.print()}
                        className="w-full justify-center"
                    >
                        <Download size={18} className="mr-2" />
                        Imprimir / Exportar Lista
                    </Button>
                </div>
            </div>

            {/* Search and Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex gap-4">
                    <div className="relative flex-grow max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar asistente..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="py-3 px-4">Nombre</th>
                                <th className="py-3 px-4">Rol</th>
                                <th className="py-3 px-4 text-center">Nota</th>
                                <th className="py-3 px-4 text-center">Estado</th>
                                <th className="py-3 px-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAttendees.map((attendee) => (
                                <tr
                                    key={attendee.id}
                                    onClick={() => handleRowClick(attendee)}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <td className="py-3 px-4 font-medium text-gray-900">{attendee.name}</td>
                                    <td className="py-3 px-4 text-gray-600">{attendee.role}</td>
                                    <td className="py-3 px-4 text-center font-bold text-blue-700">
                                        {attendee.grade !== null && attendee.grade !== undefined ? attendee.grade : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {attendee.certificationApproved ? (
                                            <Badge type="success">Aprobado</Badge>
                                        ) : (
                                            <Badge type="warning">Pendiente</Badge>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                title="Ver Detalles"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <CertificateDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                attendee={selectedAttendee}
                onValidate={handleValidate}
            />
        </div>
    );
};

export default CertificationManager;
