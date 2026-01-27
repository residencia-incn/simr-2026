import React, { useState, useMemo } from 'react';
import { Search, Printer, User, DollarSign, Calendar, FileText, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { Button, Card, EmptyState, Table, Badge } from '../ui';

const UserStatementReport = ({ allUsers = [], transactions = [], organizers = [], config }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    // 1. Search Logic
    const filteredResults = useMemo(() => {
        if (!searchTerm || searchTerm.length < 2) return [];
        const search = searchTerm.toLowerCase();
        return allUsers.filter(u =>
            u.firstName?.toLowerCase().includes(search) ||
            u.lastName?.toLowerCase().includes(search) ||
            u.dni?.includes(search) ||
            u.email?.toLowerCase().includes(search)
        ).slice(0, 5); // Limit results for selection
    }, [allUsers, searchTerm]);

    // 2. Data Synthesis for Selected User
    const userFinancialData = useMemo(() => {
        if (!selectedUser) return null;

        const userId = selectedUser.id;

        // Transactions related to this user
        // backend now returns userId in each transaction
        const userTransactions = transactions.filter(tx =>
            tx.userId === userId || tx.user_id === userId || tx.organizador_id === userId
        ).sort((a, b) => new Date(b.date) - new Date(a.date));

        // Contribution stats from matrix (organizers)
        const orgData = organizers.find(o => o.id === userId);

        let totalPaid = 0;
        let totalDebt = 0;
        let pendingMonths = [];

        if (orgData) {
            // Calculate from matrix data
            orgData.contributions?.forEach(c => {
                if (c.status === 'PAID') {
                    totalPaid += parseFloat(c.amount || 0);
                } else if (c.status === 'PENDING' || c.status === 'PENDIENTE') {
                    totalDebt += parseFloat(c.amount || 0);
                    pendingMonths.push(c.month);
                }
            });
        }

        // Add non-contribution payments (registrations, etc) to total paid
        const otherPayments = userTransactions.filter(tx =>
            tx.type === 'income' &&
            !tx.category?.toLowerCase().includes('aporte') &&
            !tx.category?.toLowerCase().includes('mensual')
        );
        const otherPaid = otherPayments.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

        return {
            transactions: userTransactions,
            summary: {
                totalPaid: totalPaid + otherPaid,
                contributionPaid: totalPaid,
                othersPaid: otherPaid,
                totalDebt: totalDebt,
                pendingMonths: pendingMonths
            }
        };
    }, [selectedUser, transactions, organizers]);

    const handlePrint = () => {
        window.print();
    };

    const columns = [
        {
            header: 'Fecha',
            key: 'date',
            render: (tx) => new Date(tx.date).toLocaleDateString('es-PE')
        },
        {
            header: 'Concepto',
            key: 'description',
            render: (tx) => (
                <div>
                    <div className="font-medium text-gray-900">{tx.description}</div>
                    <div className="text-xs text-gray-500 capitalize">{tx.category || 'Varios'}</div>
                </div>
            )
        },
        {
            header: 'Tipo',
            key: 'type',
            render: (tx) => (
                <Badge variant={tx.type === 'income' ? 'success' : 'danger'}>
                    {tx.type === 'income' ? 'Ingreso' : 'Egreso'}
                </Badge>
            )
        },
        {
            header: 'Monto',
            key: 'amount',
            className: 'text-right',
            render: (tx) => (
                <span className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    S/ {Math.abs(tx.amount || 0).toFixed(2)}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <style type="text/css" media="print">
                {`
                @page { size: portrait; margin: 1cm; }
                .no-print { display: none !important; }
                #printable-statement { visibility: visible !important; position: absolute; left: 0; top: 0; width: 100%; }
                body * { visibility: hidden; }
                #printable-statement * { visibility: visible; }
                `}
            </style>

            {/* Selection Area (No Print) */}
            <div className="no-print">
                <Card className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 w-full space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Buscar Usuario</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all shadow-sm"
                                    placeholder="Nombre, Apellido o DNI..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {/* Dropdown results */}
                                {filteredResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                                        {filteredResults.map(u => (
                                            <button
                                                key={u.id}
                                                onClick={() => {
                                                    setSelectedUser(u);
                                                    setSearchTerm('');
                                                }}
                                                className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-b last:border-0"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                                    {u.firstName?.[0]}{u.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{u.firstName} {u.lastName}</div>
                                                    <div className="text-xs text-gray-500">DNI: {u.documentId || '-'} • {u.email}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedUser && (
                            <Button
                                onClick={handlePrint}
                                className="bg-gray-900 text-white h-[52px] px-8"
                            >
                                <Printer size={20} className="mr-2" />
                                Imprimir Estado
                            </Button>
                        )}
                    </div>
                </Card>
            </div>

            {/* Results Area */}
            {selectedUser ? (
                <div id="printable-statement" className="space-y-6">
                    {/* User Header */}
                    <Card className="p-8 bg-gradient-to-br from-white to-gray-50 border-blue-100 shadow-md">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <User size={40} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                                        {selectedUser.firstName} {selectedUser.lastName}
                                    </h2>
                                    <div className="flex flex-wrap gap-4 mt-2 text-gray-600 font-medium">
                                        <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border shadow-sm">
                                            <FileText size={14} /> DNI: {selectedUser.dni || '-'}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border shadow-sm">
                                            <Calendar size={14} /> Rol: <span className="capitalize">{selectedUser.eventRole || 'Usuario'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Totals */}
                            <div className="flex gap-4">
                                <div className="text-right">
                                    <p className="text-xs font-bold text-green-600 uppercase tracking-widest">Saldo Pagado</p>
                                    <p className="text-3xl font-black text-green-700">S/ {userFinancialData.summary.totalPaid.toFixed(2)}</p>
                                </div>
                                <div className="w-px h-12 bg-gray-200"></div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Deuda Pendiente</p>
                                    <p className="text-3xl font-black text-red-700">S/ {userFinancialData.summary.totalDebt.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Deuda Details (Aportes) */}
                        {userFinancialData.summary.pendingMonths.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Meses de Aportes Pendientes</h4>
                                <div className="flex flex-wrap gap-2">
                                    {userFinancialData.summary.pendingMonths.map(m => (
                                        <span key={m} className="px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg font-bold text-sm shadow-sm">
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Transactions Table */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <TrendingUp className="text-blue-500" size={24} />
                            <h3 className="text-xl font-bold text-gray-900">Historial de Transacciones Detallado</h3>
                        </div>
                        <Card className="overflow-hidden border-0 shadow-xl">
                            <Table
                                columns={columns}
                                data={userFinancialData.transactions}
                                emptyMessage="No se registran transacciones para este usuario."
                            />
                        </Card>
                    </div>

                    {/* Footer / Signature (Print only) */}
                    <div className="hidden print:block mt-24">
                        <div className="flex justify-between items-end border-t-2 border-dashed border-gray-300 pt-12">
                            <div className="text-center w-64">
                                <div className="border-t border-gray-900 pt-2 font-bold text-gray-900">Tesorería SIMR 2026</div>
                            </div>
                            <div className="text-right text-gray-400 text-xs">
                                Fecha de generación del reporte: {new Date().toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <EmptyState
                    icon={User}
                    title="Selecciona un usuario"
                    description="Busca un usuario por su nombre o documento para generar su estado de cuenta detallado."
                />
            )}
        </div>
    );
};

export default UserStatementReport;
