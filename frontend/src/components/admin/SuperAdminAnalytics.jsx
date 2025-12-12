import React from 'react';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Clock, TrendingUp, Users, Award, Download, Share2 } from 'lucide-react';
import { INITIAL_ANALYTICS } from '../../data/mockData';
import Card from '../ui/Card';

const SuperAdminAnalytics = () => {
    const { realTimeUsers, engagement, moduleAttendance, distribution } = INITIAL_ANALYTICS;
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Data y Analítica en Tiempo Real</h2>
                    <p className="text-gray-500">Monitoreo de métricas clave del evento (Powered by Python Backend)</p>
                </div>
                <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium">
                    <Download size={16} /> Exportar Reporte
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 border-l-4 border-indigo-500 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-gray-900">{engagement.avgStudyTime}</h3>
                            <p className="text-sm text-gray-500">Horas de estudio</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-emerald-500 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-gray-900">{engagement.completionRate}%</h3>
                            <p className="text-sm text-gray-500">Avance global</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-blue-500 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-gray-900">{engagement.avgTimePerStudent} h</h3>
                            <p className="text-sm text-gray-500">Promedio por estudiante</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-purple-500 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                            <Award size={24} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-gray-900">{engagement.certifiedProjects}</h3>
                            <p className="text-sm text-gray-500">Certificados emitidos</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Real-time Users Trend */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Usuarios en Tiempo Real
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={realTimeUsers}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                <Line type="monotone" dataKey="expected" stroke="#9CA3AF" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Distribution Pie Chart */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Modalidad de Participación</h3>
                    <div className="h-80 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Module Attendance Bar Chart */}
                <Card className="p-6 lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Asistencia por Módulo</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={moduleAttendance}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="attendance" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SuperAdminAnalytics;
