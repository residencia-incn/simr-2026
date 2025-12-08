import React, { useState, useEffect } from 'react';
import { Search, UserPlus, User, Mail, Shield, CheckCircle, XCircle, FileText, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const AcademicJurers = ({ works }) => {
    const [jurors, setJurors] = useState([]);
    const [selectedJurorId, setSelectedJurorId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Load jurors from API
    useEffect(() => {
        const loadJurors = async () => {
            setLoading(true);
            try {
                const data = await api.jurors.getAll();
                setJurors(data);
            } catch (error) {
                console.error("Error loading jurors", error);
            } finally {
                setLoading(false);
            }
        };
        loadJurors();
    }, []);

    const selectedJuror = jurors.find(j => j.id === selectedJurorId);

    // Filter works assigned to selected juror
    // Updated to handle array of jury IDs
    const assignedWorks = selectedJuror && works
        ? works.filter(w => {
            if (Array.isArray(w.jury)) {
                return w.jury.includes(selectedJuror.id);
            }
            return w.jury === selectedJuror.id || w.jury === selectedJuror.name; // Fallback for legacy
        })
        : [];

    const handleToggleStatus = (id) => {
        setJurors(prev => prev.map(j =>
            j.id === id ? { ...j, active: !j.active } : j
        ));
    };

    const handleRemoveJuror = (id) => {
        if (confirm("¿Está seguro de quitar a este usuario de la lista de jurados?")) {
            setJurors(prev => prev.filter(j => j.id !== id));
            if (selectedJurorId === id) setSelectedJurorId(null);
        }
    };

    const filteredJurors = jurors.filter(j =>
        j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[600px] flex gap-6 animate-fadeIn">
            {/* Left Panel: Juror List */}
            <div className="w-1/3 flex flex-col gap-4 bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Directorio de Jurados</h3>
                    <Button size="sm" variant="outline" className="text-xs">
                        <UserPlus size={14} className="mr-1" /> Nuevo Jurado
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o especialidad..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {filteredJurors.map(juror => (
                        <div
                            key={juror.id}
                            onClick={() => setSelectedJurorId(juror.id)}
                            className={`
                                p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm
                                ${selectedJurorId === juror.id
                                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                    : 'bg-white border-gray-100 hover:border-gray-200'
                                }
                            `}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${juror.active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {juror.name.charAt(4)}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm ${juror.active ? 'text-gray-900' : 'text-gray-500'}`}>{juror.name}</h4>
                                        <p className="text-xs text-gray-500">{juror.specialty}</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className={`text-gray-400 ${selectedJurorId === juror.id ? 'opacity-100' : 'opacity-0'}`} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel: Details & Assigned Works */}
            <div className="w-2/3 bg-gray-50 rounded-xl border border-gray-200 p-6 flex flex-col">
                {selectedJuror ? (
                    <>
                        <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center text-2xl font-bold text-blue-600 shadow-sm">
                                    {selectedJuror.name.charAt(4)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedJuror.name}</h2>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Shield size={14} className="text-purple-500" />
                                            <span>{selectedJuror.specialty}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Mail size={14} />
                                            <span>{selectedJuror.email}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleStatus(selectedJuror.id)}
                                    className={selectedJuror.active ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                                >
                                    {selectedJuror.active ? "Desactivar" : "Activar"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRemoveJuror(selectedJuror.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    Quitar
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FileText size={18} className="text-blue-500" />
                                Trabajos Asignados ({assignedWorks.length})
                            </h3>

                            {assignedWorks.length > 0 ? (
                                <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                    {assignedWorks.map(work => (
                                        <Card key={work.id} className="p-4 bg-white hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge size="sm">{work.type}</Badge>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${work.status === 'En Evaluación' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                    {work.status}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 mb-1">{work.title}</h4>
                                            <div className="text-xs text-gray-500 mb-3">{work.author}</div>

                                            {work.scores && work.scores.length > 0 ? (
                                                <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                                                    <span className="font-medium text-gray-600">Puntaje Otorgado:</span>
                                                    <span className="font-bold text-blue-700">
                                                        {(work.scores.reduce((a, b) => a + b, 0) / work.scores.length).toFixed(2)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs text-yellow-600 italic bg-yellow-50 p-2 rounded">
                                                    <Clock size={12} /> Pendiente de evaluación
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-white rounded-lg border border-dashed border-gray-200">
                                    <FileText size={32} className="mb-2 opacity-20" />
                                    <p className="text-sm">No tiene trabajos asignados actualmente.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <User size={48} className="mb-4 opacity-20" />
                        <p>Seleccione un jurado del directorio para ver sus detalles y trabajos asignados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper for Missing Icon
const Clock = ({ size = 16, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);

export default AcademicJurers;
