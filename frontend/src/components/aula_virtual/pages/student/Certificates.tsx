import React from 'react';

const Certificates: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-background-light p-4 lg:p-8">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Mis Certificados y Diplomas</h1>
            <p className="mt-2 text-slate-500 text-lg max-w-2xl">Consulta y descarga los certificados de los cursos y congresos que has completado con éxito.</p>
          </div>
          <button className="bg-blue-50 text-primary hover:bg-blue-100 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined">verified</span> Verificar autenticidad
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: 'workspace_premium', label: 'Total Certificados', val: '12' },
            { icon: 'schedule', label: 'Horas Acreditadas', val: '145h' },
            { icon: 'star', label: 'Promedio Calificación', val: '9.8/10' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-slate-400">{stat.icon}</span>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stat.val}</p>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <span className="absolute left-3 top-2.5 text-slate-400 material-symbols-outlined text-[20px]">search</span>
            <input className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Buscar certificado..."/>
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-medium shadow-sm">Todos</button>
            <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">Congresos</button>
            <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">Cursos</button>
          </div>
        </div>

        {/* Certificate Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Neurología Clínica Avanzada: Actualización 2024', type: 'Curso', date: '15 Mar 2024', color: 'blue', icon: 'school' },
            { title: 'V Congreso Internacional de Investigación Neurológica', type: 'Congreso', date: '02 Feb 2024', color: 'purple', icon: 'groups' },
            { title: 'Epilepsia Refractaria: Nuevos Horizontes', type: 'Curso', date: '10 Dic 2023', color: 'blue', icon: 'school' },
            { title: 'Manejo del Ictus en Urgencias', type: 'Curso', date: '22 Nov 2023', color: 'blue', icon: 'school' },
            { title: 'Taller Práctico: Interpretación de EEG', type: 'Taller', date: '05 Oct 2023', color: 'emerald', icon: 'science' },
            { title: 'Fundamentos de Neuroanatomía', type: 'Curso', date: '14 Sep 2023', color: 'blue', icon: 'school' },
          ].map((cert, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-primary/30 transition-all group flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className={`size-12 rounded-lg bg-${cert.color}-50 text-${cert.color}-600 flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-[24px]">{cert.icon}</span>
                </div>
                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2.5 py-1 rounded uppercase border border-slate-200">{cert.type}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg leading-snug mb-2 line-clamp-2">{cert.title}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                <span>Emisión: {cert.date}</span>
              </div>
              <button className="mt-auto w-full py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium text-sm flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                <span className="material-symbols-outlined text-[20px]">download</span> Descargar PDF
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Certificates;