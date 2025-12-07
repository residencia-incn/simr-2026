import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Award, Download } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const CertificationManager = ({ attendees }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [localAttendees, setLocalAttendees] = useState(attendees);

    const toggleApproval = (id) => {
        setLocalAttendees(prev => prev.map(att =>
            att.id === id ? { ...att, certificationApproved: !att.certificationApproved } : att
        ));
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
                            {(localAttendees.reduce((acc, curr) => acc + (curr.grade || 0), 0) / localAttendees.filter(a => a.grade).length).toFixed(1)}
                        </div>
                    </div>
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
                                <tr key={attendee.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 font-medium text-gray-900">{attendee.name}</td>
                                    <td className="py-3 px-4 text-gray-600">{attendee.role}</td>
                                    <td className="py-3 px-4 text-center font-bold text-blue-700">
                                        {attendee.grade !== null ? attendee.grade : '-'}
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
                                                onClick={() => toggleApproval(attendee.id)}
                                                className={`p-2 rounded-lg transition-colors ${attendee.certificationApproved ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                                title={attendee.certificationApproved ? "Revocar Aprobación" : "Aprobar Certificado"}
                                            >
                                                {attendee.certificationApproved ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CertificationManager;
