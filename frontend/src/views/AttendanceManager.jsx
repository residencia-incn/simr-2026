import React, { useState, useEffect } from 'react';
import { Card, Button, SectionHeader, LoadingSpinner } from '../components/ui';
import { QrCode, Scan, Users, Calendar, Clock, RotateCcw, Download, Search, RefreshCw } from 'lucide-react';
import { useApi } from '../hooks';
import { api } from '../services/api';
import { showConfirm } from '../utils/alerts';
import QRCode from 'react-qr-code';
import AttendanceScanner from '../components/common/AttendanceScanner';

const AttendanceManager = () => {
    const [stats, setStats] = useState(null);
    const [activeDay, setActiveDay] = useState('day1');
    const [dayToken, setDayToken] = useState(null);
    const [showStaffScanner, setShowStaffScanner] = useState(false);
    const [lastScannedUser, setLastScannedUser] = useState(null);
    const [scanMessage, setScanMessage] = useState(null);

    // Search and Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter Logic
    const filteredHistory = stats?.history?.filter(record =>
        searchTerm === '' ||
        record.userId?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Fetch initial stats
    const { execute: loadStats, loading } = useApi(async () => {
        const data = await api.attendance.getStats();
        setStats(data);
    });

    useEffect(() => {
        loadStats();
        // Generate/Fetch token for today
        const loadToken = async () => {
            const token = await api.attendance.generateDayToken(activeDay);
            setDayToken(token);
        };
        loadToken();

        // Refresh stats interval
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, [activeDay]);

    const handleGenerateNewToken = async () => {
        const result = await showConfirm(
            'El código anterior dejará de funcionar.',
            '¿Generar nuevo código para hoy?'
        );

        if (result.isConfirmed) {
            const token = await api.attendance.generateDayToken(activeDay);
            setDayToken(token);
        }
    };

    const handleStaffScan = async (data) => {
        try {
            // Parse user QR data
            const userData = JSON.parse(data);

            if (!userData.id) throw new Error("QR inválido (sin ID)");

            // Record attendance
            await api.attendance.record(userData.id, 'entry', new Date().toISOString(), 'staff_scan');

            setLastScannedUser(userData);
            setScanMessage({ type: 'success', text: `✅ Ingreso registrado: ${userData.name}` });

            // Refresh stats
            loadStats();

            // Clear message after delay
            setTimeout(() => {
                setScanMessage(null);
                setLastScannedUser(null);
            }, 3000);

        } catch (error) {
            console.error(error);
            setScanMessage({ type: 'error', text: '❌ Error: QR inválido o ilegible' });
            setTimeout(() => setScanMessage(null), 3000);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <SectionHeader
                title="Control de Asistencia"
                subtitle="Gestión de accesos, generación de códigos y monitoreo en tiempo real."
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-blue-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Inscritos Totales</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats?.totalRegistered || 0}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Users size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="p-4 border-l-4 border-green-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Asistentes Hoy</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats?.todayPresent || 0}</h3>
                        </div>
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <QrCode size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="p-4 border-l-4 border-purple-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Presencial</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats?.inPerson || 0}</h3>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <Users size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="p-4 border-l-4 border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">% Asistencia</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {stats?.totalRegistered ? Math.round((stats.todayPresent / stats.totalRegistered) * 100) : 0}%
                            </h3>
                        </div>
                        <div className="p-3 bg-gray-50 text-gray-600 rounded-lg">
                            <Calendar size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* QR Generation Panel */}
                <Card className="p-6 lg:col-span-1 flex flex-col items-center text-center">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <QrCode className="text-blue-600" size={20} />
                        QR del Día (Pantalla)
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Este código debe mostrarse en la pantalla gigante para que los asistentes registren su asistencia.
                    </p>

                    <div className="bg-white p-4 rounded-xl shadow-lg border-4 border-gray-900 mb-6">
                        {dayToken ? (
                            <QRCode value={dayToken} size={220} level="H" />
                        ) : (
                            <div className="w-[220px] h-[220px] bg-gray-100 flex items-center justify-center rounded text-gray-400">
                                <LoadingSpinner />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                        <div className="p-2 bg-gray-100 rounded text-xs font-mono break-all text-gray-600 border border-gray-200">
                            {dayToken || 'Generando...'}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateNewToken}
                            className="mt-2 w-full gap-2"
                        >
                            <RotateCcw size={14} />
                            Regenerar Código
                        </Button>
                    </div>
                </Card>

                {/* Staff Scanner & Recent Logs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Staff Actions */}
                    <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Registro Manual (Staff)</h3>
                                <p className="text-sm text-gray-600">Use esta opción para registrar asistentes que no trajeron celular.</p>
                            </div>
                            <Button
                                onClick={() => setShowStaffScanner(true)}
                                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 gap-2 whitespace-nowrap"
                            >
                                <Scan size={18} />
                                Abrir Escáner
                            </Button>
                        </div>
                    </Card>

                    {/* Scanner Modal */}
                    {showStaffScanner && (
                        <AttendanceScanner
                            onScan={handleStaffScan}
                            onClose={() => setShowStaffScanner(false)}
                        />
                    )}

                    {/* Scan Feedback Overlay */}
                    {scanMessage && (
                        <div className={`fixed top-4 right-4 z-[60] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slideIn ${scanMessage.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                            <div className="font-bold text-lg">{scanMessage.text}</div>
                        </div>
                    )}

                    {/* Recent Logs Table */}
                    <Card className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Clock size={20} className="text-gray-500" />
                                    Historial de Asistencia
                                </h3>
                                <p className="text-sm text-gray-500">Visualiza y busca registros</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar por ID..."
                                        className="pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Search size={16} />
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={loadStats}>
                                    <RefreshCw size={16} />
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-medium">
                                    <tr>
                                        <th className="p-3 rounded-l-lg">Hora</th>
                                        <th className="p-3">Usuario ID</th>
                                        <th className="p-3">Tipo</th>
                                        <th className="p-3">Método</th>
                                        <th className="p-3 rounded-r-lg">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentItems.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-3 text-gray-900 font-mono">
                                                {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-3 text-blue-600 font-medium">
                                                {record.userId || 'N/A'}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${record.type === 'entry' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {record.type === 'entry' ? 'ENTRADA' : 'SALIDA'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-500 capitalize">
                                                {record.method?.replace('_', ' ')}
                                            </td>
                                            <td className="p-3 text-green-600">
                                                <div className="flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    Registrado
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {currentItems.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-gray-500">
                                                {searchTerm ? 'No se encontraron registros con esa búsqueda.' : 'No hay registros de asistencia hoy.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
                                <div className="text-sm text-gray-500">
                                    Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredHistory.length)} de {filteredHistory.length}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="h-8 w-8 p-0 flex items-center justify-center"
                                    >
                                        &lt;
                                    </Button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => paginate(i + 1)}
                                            className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="h-8 w-8 p-0 flex items-center justify-center"
                                    >
                                        &gt;
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AttendanceManager;
