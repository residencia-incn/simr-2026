import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '12:00 AM', users: 120 },
  { name: '4:00 AM', users: 200 },
  { name: '8:00 AM', users: 450 },
  { name: '12:00 PM', users: 980 },
  { name: '4:00 PM', users: 800 },
  { name: '8:00 PM', users: 500 },
  { name: '11:59 PM', users: 300 },
];

const AdminDashboard: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-background-light p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800">Panel de Actividad</h1>
            <p className="mt-2 text-gray-500">Supervisión en tiempo real del Congreso Internacional de Neurología y cursos asincrónicos.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold border border-green-200 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              Sistema Operativo
            </div>
            <button className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-blue-500/20 transition-all">
              <span className="material-symbols-outlined text-[20px]">download</span>
              Exportar Informe
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Usuarios Conectados', value: '1,245', sub: 'Pico de 1.4k a las 10:00 AM', icon: 'group', color: 'blue', trend: '+12%' },
            { title: 'Progreso Promedio', value: '68%', sub: 'Total acumulado', icon: 'school', color: 'purple', trend: '+5%' },
            { title: 'Actividad Chat', value: '45', sub: 'msg/min', icon: 'forum', color: 'orange', trend: 'High Vol' },
            { title: 'Promedio Exámenes', value: '82/100', sub: '340 intentos hoy', icon: 'assignment_turned_in', color: 'teal', trend: '-2%', trendColor: 'red' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-border-light shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 bg-${stat.color}-50 rounded-lg text-${stat.color}-600 border border-${stat.color}-100`}>
                  <span className="material-symbols-outlined">{stat.icon}</span>
                </div>
                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stat.trendColor === 'red' ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>
                  {stat.trend}
                </span>
              </div>
              <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
              <p className="text-xs text-gray-400 mt-2">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts & Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-border-light shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Actividad de Usuarios (24h)</h3>
              <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 text-gray-700 outline-none">
                <option>Últimas 24 horas</option>
              </select>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2b6cee" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2b6cee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stroke="#2b6cee" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-border-light shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Rendimiento por Curso</h3>
            <div className="flex-1 flex flex-col gap-6">
              {[
                { name: 'Neuroanatomía', val: 85, color: 'bg-primary' },
                { name: 'Epilepsia Clínica', val: 72, color: 'bg-teal-500' },
                { name: 'Cefaleas y Migraña', val: 94, color: 'bg-purple-500' },
                { name: 'Stroke Mgmt', val: 60, color: 'bg-orange-500' },
              ].map((course, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 font-medium">{course.name}</span>
                    <span className="text-gray-500">{course.val}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${course.color} h-2 rounded-full`} style={{ width: `${course.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;