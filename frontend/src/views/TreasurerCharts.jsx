import React from 'react';
import { Card } from '../components/ui';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Users, DollarSign, AlertCircle, Bookmark } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const CONTRIB_COLORS = ['#10b981', '#fcd34d']; // Paid, Pending
const PENALTY_COLORS = ['#fbbf24', '#f87171', '#94a3b8']; // Tardanza, Falta, Otros

const TreasurerCharts = ({ transactions, categories, stats }) => {
    if (!stats) return <div className="text-center p-10 text-gray-500">Cargando estadísticas...</div>;

    const { summary, contributions, penalties, registrationsByModality, workshopInscriptions, expenseDistribution } = stats;

    const summaryData = [
        { name: 'Ingresos', value: summary.total_income },
        { name: 'Egresos', value: summary.total_expenses }
    ];

    const contribData = [
        { name: 'Al Día', value: contributions.paid_count },
        { name: 'Pendientes', value: contributions.pending_count }
    ];

    const penaltyData = [
        { name: 'Tardanzas', value: penalties.tardanza_count },
        { name: 'Faltas', value: penalties.falta_count },
        { name: 'Otros', value: penalties.other_count }
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Top Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inscritos Totales</p>
                        <h4 className="text-xl font-black text-slate-800">
                            {registrationsByModality.reduce((acc, curr) => acc + curr.value, 0)}
                        </h4>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-emerald-500">
                    <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Balance Neto</p>
                        <h4 className="text-xl font-black text-emerald-600">S/ {summary.balance.toFixed(2)}</h4>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-amber-500">
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cuotas Pendientes</p>
                        <h4 className="text-xl font-black text-amber-600">{contributions.pending_count}</h4>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-purple-500">
                    <div className="p-3 bg-purple-50 text-purple-500 rounded-xl">
                        <Bookmark size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Talleres Activos</p>
                        <h4 className="text-xl font-black text-slate-800">{workshopInscriptions.length}</h4>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Balance Chart */}
                <Card className="p-6 md:col-span-1 shadow-sm border-gray-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-2 h-4 bg-emerald-500 rounded-full"></div>
                        Balance General
                    </h3>
                    <div className="h-64 w-full" style={{ minHeight: '256px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summaryData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {summaryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Contribution Status */}
                <Card className="p-6 md:col-span-1 shadow-sm border-gray-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-2 h-4 bg-blue-500 rounded-full"></div>
                        Cumplimiento de Aportes
                    </h3>
                    <div className="h-64 w-full" style={{ minHeight: '256px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={contribData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {contribData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CONTRIB_COLORS[index % CONTRIB_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Penalty Breakdown */}
                <Card className="p-6 md:col-span-1 shadow-sm border-gray-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-2 h-4 bg-rose-500 rounded-full"></div>
                        Factores de Multas
                    </h3>
                    <div className="h-64 w-full" style={{ minHeight: '256px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={penaltyData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label
                                >
                                    {penaltyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PENALTY_COLORS[index % PENALTY_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Registrations by Modality */}
                <Card className="p-6">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="w-2 h-4 bg-indigo-500 rounded-full"></div>
                        Inscripciones por Modalidad
                    </h3>
                    <div className="h-72 w-full" style={{ minHeight: '288px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={registrationsByModality} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Workshop Inscriptions */}
                <Card className="p-6">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="w-2 h-4 bg-cyan-500 rounded-full"></div>
                        Demanda de Talleres
                    </h3>
                    <div className="h-72 w-full" style={{ minHeight: '288px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={workshopInscriptions}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} height={60} interval={0} angle={-30} textAnchor="end" />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Expense Distribution Full Width */}
            <Card className="p-6">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <div className="w-2 h-4 bg-slate-800 rounded-full"></div>
                    Distribución de Egresos por Categoría
                </h3>
                {expenseDistribution.length > 0 ? (
                    <div className="h-80 w-full" style={{ minHeight: '320px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={expenseDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="value" fill="#475569" radius={[4, 4, 0, 0]} label={{ position: 'top', formatter: (val) => `S/ ${val.toFixed(2)}`, fill: '#64748b', fontSize: 10 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center text-gray-400">
                        No hay datos de distribución de gastos disponibles
                    </div>
                )}
            </Card>
        </div>
    );
};

export default TreasurerCharts;
