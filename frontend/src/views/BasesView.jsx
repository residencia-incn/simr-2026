import React, { useState } from 'react';
import { FileText, CheckSquare, File, Download, ExternalLink } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const BasesView = ({ activeTab = 'bases' }) => {
    const [tab, setTab] = useState(activeTab);

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="bg-blue-900 text-white p-8 rounded-2xl shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Bases y Requisitos</h1>
                <p className="text-blue-200">Información fundamental para la presentación de trabajos de investigación.</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
                <button
                    onClick={() => setTab('bases')}
                    className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 ${tab === 'bases' ? 'bg-white text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                    <FileText size={18} />
                    Bases del Concurso
                </button>
                <button
                    onClick={() => setTab('requisitos')}
                    className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 ${tab === 'requisitos' ? 'bg-white text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                    <CheckSquare size={18} />
                    Requisitos
                </button>
                <button
                    onClick={() => setTab('documentos')}
                    className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 ${tab === 'documentos' ? 'bg-white text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                    <File size={18} />
                    Documentos
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[400px]">
                {tab === 'bases' && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Bases del XXXI Concurso de Investigación</h2>
                        <div className="prose max-w-none text-gray-600 space-y-4">
                            <p>
                                El Comité Organizador del SIMR 2026 convoca a todos los médicos residentes del Instituto Nacional de Ciencias Neurológicas
                                a participar en el concurso de trabajos de investigación.
                            </p>
                            <h3 className="text-lg font-bold text-gray-800">1. De los Participantes</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Podrán participar médicos residentes de todas las especialidades (Neurología, Neurocirugía, Neuropediatría).</li>
                                <li>Se aceptan trabajos individuales o grupales (máximo 4 autores).</li>
                            </ul>
                            <h3 className="text-lg font-bold text-gray-800">2. De los Trabajos</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Los trabajos deben ser inéditos.</li>
                                <li>Categorías: Trabajo de Investigación Original, Reporte de Caso, Revisión Sistemática.</li>
                            </ul>
                        </div>
                        <div className="pt-6">
                            <Button className="flex items-center gap-2">
                                <Download size={18} /> Descargar Bases Completas (PDF)
                            </Button>
                        </div>
                    </div>
                )}

                {tab === 'requisitos' && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Requisitos de Postulación</h2>
                        <Card className="bg-blue-50 border-blue-100 p-6">
                            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <ExternalLink size={20} />
                                Curso de Conducta Responsable en Investigación (CRI)
                            </h3>
                            <p className="text-blue-800 mb-4">
                                Es obligatorio contar con la constancia vigente del curso de Ética en Investigación.
                                Recomendamos el curso ofrecido por el NIH o QUIPU.
                            </p>
                            <a href="https://cri.concytec.gob.pe/" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                                    Ir al Curso CITI / CONCYTEC
                                </Button>
                            </a>
                        </Card>

                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            <div className="border border-gray-200 rounded-lg p-6">
                                <h4 className="font-bold text-gray-900 mb-3">Documentación Obligatoria</h4>
                                <ul className="space-y-2 text-gray-600 text-sm">
                                    <li className="flex items-center gap-2"><CheckSquare size={16} className="text-green-500" /> Carta de aval del Jefe de Servicio</li>
                                    <li className="flex items-center gap-2"><CheckSquare size={16} className="text-green-500" /> Declaración jurada de autoría</li>
                                    <li className="flex items-center gap-2"><CheckSquare size={16} className="text-green-500" /> Constancia de aprobación de Comité de Ética</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'documentos' && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Documentos y Formatos</h2>
                        <p className="text-gray-600 mb-6">Descarga los formatos oficiales para la presentación de tu trabajo.</p>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { title: "Formato de Resumen Estructurado", type: "DOCX", size: "45 KB" },
                                { title: "Carta de Aval del Servicio", type: "PDF", size: "120 KB" },
                                { title: "Declaración Jurada de Autoría", type: "PDF", size: "85 KB" },
                                { title: "Plantilla de Póster Digital", type: "PPTX", size: "2.5 MB" },
                                { title: "Checklist de Requisitos", type: "PDF", size: "50 KB" },
                            ].map((doc, i) => (
                                <div key={i} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow flex items-start gap-4 cursor-pointer group">
                                    <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-blue-50 transition-colors">
                                        <FileText size={24} className="text-gray-500 group-hover:text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-blue-700">{doc.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span className="font-medium bg-gray-100 px-1.5 py-0.5 rounded">{doc.type}</span>
                                            <span>{doc.size}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BasesView;
