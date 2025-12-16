import React, { useState } from 'react';
import { Folder, FileText, Plus, ExternalLink, Search, Clock, File } from 'lucide-react';
import { Button, Card, Table, FormField, Badge, EmptyState } from '../ui';

const DocumentsManager = () => {
    // Mock Data for Documents Registry
    const [documents, setDocuments] = useState([
        { id: 1, type: 'Oficio', code: 'OF-001-2025', title: 'Solicitud de Auditorio', recipient: 'Dirección General', date: '2025-01-10', status: 'Enviado' },
        { id: 2, type: 'Solicitud', code: 'SOL-015-2025', title: 'Requerimiento de Coffee Break', recipient: 'Logística', date: '2025-01-12', status: 'Pendiente' },
        { id: 3, type: 'Carta', code: 'CARTA-003-2025', title: 'Invitación a Ponente Internacional', recipient: 'Dr. Smith', date: '2025-01-15', status: 'Borrador' },
    ]);

    const [searchTerm, setSearchTerm] = useState('');

    const DRIVE_FOLDER_URL = "https://drive.google.com/drive/u/0/my-drive"; // Placeholder

    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.recipient.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { header: 'Código', key: 'code', className: 'font-mono text-xs' },
        { header: 'Tipo', key: 'type', render: (item) => <Badge variant="outline">{item.type}</Badge> },
        { header: 'Asunto', key: 'title', className: 'font-medium' },
        { header: 'Destinatario', key: 'recipient' },
        { header: 'Fecha', key: 'date', render: (item) => <span className="text-sm text-gray-500">{item.date}</span> },
        {
            header: 'Estado',
            key: 'status',
            render: (item) => {
                const colors = { 'Enviado': 'green', 'Pendiente': 'yellow', 'Borrador': 'gray' };
                return <Badge variant={colors[item.status] || 'gray'}>{item.status}</Badge>;
            }
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Google Drive Card */}
                <Card className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Folder className="text-blue-600" />
                                <h3 className="font-bold text-blue-900">Google Drive</h3>
                            </div>
                            <p className="text-sm text-blue-700 mb-4">
                                Acceso directo a la carpeta de documentos del evento.
                            </p>
                            <Button
                                onClick={() => window.open(DRIVE_FOLDER_URL, '_blank')}
                                className="bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
                            >
                                <ExternalLink size={16} className="mr-2" />
                                Abrir Carpeta Drive
                            </Button>
                        </div>
                        <div className="hidden md:block opacity-10">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo_%282020%29.svg" width="80" alt="Drive" />
                        </div>
                    </div>
                </Card>

                {/* Quick Stats or Actions */}
                <Card className="md:w-1/3">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-gray-400" />
                        Trámites Recientes
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Oficios Enviados</span>
                            <span className="font-bold">12</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Pendientes</span>
                            <span className="font-bold text-orange-600">3</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Documents Registry Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="text-blue-600" />
                            Registro de Documentos
                        </h3>
                        <p className="text-gray-500 text-sm">Gestión de oficios, solicitudes y cartas</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-grow md:w-64">
                            <input
                                type="text"
                                placeholder="Buscar documento..."
                                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        </div>
                        <Button>
                            <Plus size={16} className="mr-2" />
                            Nuevo Documento
                        </Button>
                    </div>
                </div>

                <Table
                    columns={columns}
                    data={filteredDocs}
                    emptyMessage="No hay documentos registrados"
                />
            </div>
        </div>
    );
};

export default DocumentsManager;
