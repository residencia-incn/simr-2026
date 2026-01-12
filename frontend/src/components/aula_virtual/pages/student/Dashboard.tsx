import React from 'react';
import Button from '../../../ui/Button'; // Adjusted path
import { useAuth } from '../../../../context/AuthContext';
import { Calendar, Search, ChevronLeft, ChevronRight, Video, MoreHorizontal, Bell, Clock, HelpCircle, PlusCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Date State
  const [currentDate, setCurrentDate] = React.useState(new Date());

  // Dynamic Current Date String for Header
  const dateString = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  // Calendar Logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = new Date().getDate(); // For highlighting today
  const isCurrentMonthDisplay = new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;

  const totalDays = daysInMonth(currentYear, currentMonth);
  const startDay = firstDayOfMonth(currentYear, currentMonth);

  const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(currentDate);

  // Calendar Grid Generation
  const calendarDays = [];
  // Empty slots for days before start of month
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
  }
  // Days of month
  for (let d = 1; d <= totalDays; d++) {
    const isToday = isCurrentMonthDisplay && d === currentDay;
    // Mock events logic - In a real scenario, this would check against a list of events
    // Highlighting random days for demonstration as requested "resaltar los dias de nuestros cursos"
    const hasEvent = [5, 12, 20, 25].includes(d);
    const hasExam = [15, 28].includes(d);

    calendarDays.push(
      <div key={d} className={`h-10 w-10 rounded-full flex flex-col items-center justify-center text-sm cursor-pointer relative transition-colors ${isToday ? 'font-bold bg-primary text-white shadow-lg shadow-primary/50 z-10' : 'text-slate-700 hover:bg-slate-100'}`}>
        {d}
        {hasEvent && !isToday && <span className="absolute bottom-1.5 w-1 h-1 bg-primary rounded-full"></span>}
        {hasExam && !isToday && <span className="absolute bottom-1.5 w-1 h-1 bg-red-500 rounded-full"></span>}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Header */}
      <header className="w-full px-6 py-6 md:px-10 flex flex-col gap-6 shrink-0 z-10 bg-background-light">
        <div className="flex flex-wrap justify-between items-end gap-4">
          <div className="flex flex-col gap-1">
            {/* Removed "Planificación Académica" */}
            <h2 className="text-slate-900 text-3xl md:text-4xl font-black tracking-tight">Bienvenido {user?.name || 'Estudiante'}</h2>
            <p className="text-primary text-lg font-medium mt-1 flex items-center gap-2 capitalize">
              <Calendar className="w-5 h-5" />
              {dateString}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg leading-5 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 sm:text-sm" placeholder="Buscar eventos, exámenes o notas..." type="text" />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 px-1">
            <button className="whitespace-nowrap px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium transition-colors">
              Todos
            </button>
            <button className="whitespace-nowrap px-4 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-medium transition-colors">
              En Vivo
            </button>
            <button className="whitespace-nowrap px-4 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-medium transition-colors">
              Exámenes
            </button>
            <button className="whitespace-nowrap px-4 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-medium transition-colors">
              Recordatorios
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10">
        <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px]">

          {/* Left Column: Calendar & Notifications */}
          <div className="w-full lg:w-[360px] flex-shrink-0 flex flex-col gap-6">

            {/* Calendar Widget */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-900 font-bold text-lg capitalize">{monthName}</h3>
                <div className="flex gap-2">
                  <button onClick={handlePrevMonth} className="p-1 rounded hover:bg-slate-100 text-slate-500">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={handleNextMonth} className="p-1 rounded hover:bg-slate-100 text-slate-500">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => (
                  <span key={d} className="text-xs font-semibold text-slate-400 uppercase">{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-slate-500">Eventos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-slate-500">Exámenes</span>
                </div>
              </div>
            </div>

            {/* Vencimientos Widget */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Clock className="w-[100px] h-[100px] text-primary" />
              </div>
              <h3 className="text-slate-900 font-bold text-lg mb-4 relative z-10">Próximos Vencimientos</h3>
              <div className="flex flex-col gap-3 relative z-10">
                <div className="flex items-start gap-3">
                  <div className="mt-1 min-w-[4px] h-10 rounded-full bg-red-500"></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Neuroanatomía Clínica</p>
                    <p className="text-xs text-red-600 font-medium">Vence en 2 días</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 min-w-[4px] h-10 rounded-full bg-orange-500"></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Farmacología Avanzada</p>
                    <p className="text-xs text-orange-600 font-medium">Vence en 5 días</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Agenda */}
          <div className="flex-1 flex flex-col gap-8">

            {/* Today */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-slate-900">Hoy</h3>
                <div className="h-[1px] flex-1 bg-slate-200"></div>
              </div>
              <div className="flex flex-col gap-4">

                {/* Event Card */}
                <div className="bg-white rounded-xl p-5 border-l-4 border-primary shadow-sm hover:shadow-md transition-all group">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center justify-center min-w-[60px] px-2 py-1 bg-primary/10 rounded-lg text-primary">
                        <span className="text-xs font-bold uppercase">Ahora</span>
                        <span className="font-bold text-lg">14:30</span>
                      </div>
                      <div>
                        <div className="flex gap-2 mb-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/10 text-red-500 tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            En Vivo
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-500">Congreso</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 leading-tight mb-1">Simposio: Epilepsia Refractaria</h4>
                        <p className="text-sm text-slate-500">Dr. Roberto Fernández • Sala Principal A</p>
                      </div>
                    </div>
                    <Button
                      className="w-full md:w-auto px-6 py-2.5 rounded-lg"
                      onClick={() => { }}
                      loading={false}
                      disabled={false}
                    >
                      <Video className="w-5 h-5" />
                      Entrar al Evento
                    </Button>
                  </div>
                </div>

                {/* Task Card */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center min-w-[60px] pt-1">
                      <span className="text-slate-400 font-medium text-sm">16:00</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-base font-bold text-slate-700 mb-1">Revisión de Bibliografía</h4>
                          <p className="text-sm text-slate-500">Leer paper sobre nuevos tratamientos en Alzheimer para el módulo 3.</p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tomorrow */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-slate-900">Mañana</h3>
                <div className="h-[1px] flex-1 bg-slate-200"></div>
              </div>
              <div className="flex flex-col gap-4">

                {/* Course Card */}
                <div className="bg-white rounded-xl p-5 border-l-4 border-slate-300 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex gap-4 w-full">
                      <div className="flex flex-col items-center justify-center min-w-[60px] px-2 py-1 bg-slate-100 rounded-lg text-slate-600">
                        <span className="text-xs font-bold uppercase">MIE</span>
                        <span className="font-bold text-lg">09:00</span>
                      </div>
                      <div>
                        <div className="flex gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/10 text-purple-500">Curso</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 leading-tight mb-1">Taller: Interpretación de EEG</h4>
                        <p className="text-sm text-slate-500">Prof. Sarah Jenkins • Aula Virtual 3</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="flex -space-x-2 mr-2">
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 bg-cover" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBDk6Oyx39P4uNSxYtsaUSy_19UTgJDBDVHSiyboqoUfC6uQw8zPTf8IgfTG9CnweZJnUHavjKlFA1hYlOyNdvB8MEEW7Pk-LAfDctPdnh1B4M4tYugKrD7bysEtqdcWZONupnnUz3YUuuosE0aXVek9O675RMTH2nABSLpUaKCsITX0mslOhPNdjCqzPiCCcoAycXNg00gsCUNgpuJ7n-NzRvX_jieHRy4PXvxsLTjtkvkaXNwFpt2r2i_YEYw-Kicl6LzO6ZbAA')" }}></div>
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 bg-cover" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCs4rom65OZF3RCJQUKsDOXGhRLyjCJAowGN2Y-eOWSXdcnXUqsWPWDDPCt5alJvE7ewBWORD_HLSXkbJPl2xqGmvKnZLYddxXNLqAQ67-a0ipcaMgOq78M-cSxQ4nxv4tYiue7ZWmtjFVTVmqdy-EVcjbKdxS4o7coN8GPkbig-PHLugb7gW9hR_JdNB2RqDHqGF9S4UU6W4DF3zh3ykhWcOzh64jR9HXZhcE34NVUuO29uert03-pD8FSqTigrnCHiusN41rA7A')" }}></div>
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-700 text-white flex items-center justify-center text-xs font-bold">+42</div>
                      </div>
                      <button className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors" title="Activar recordatorio">
                        <Bell className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Exam Card */}
                <div className="bg-white rounded-xl p-5 border-l-4 border-orange-500 shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-orange-500/5 to-transparent pointer-events-none"></div>
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center relative z-10">
                    <div className="flex gap-4 w-full">
                      <div className="flex flex-col items-center justify-center min-w-[60px] px-2 py-1 bg-orange-500/10 rounded-lg text-orange-600">
                        <span className="text-xs font-bold uppercase">Vence</span>
                        <span className="font-bold text-lg">23:59</span>
                      </div>
                      <div>
                        <div className="flex gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-100 text-orange-600">Examen Final</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 leading-tight mb-1">Neuroinmunología Básica</h4>
                        <p className="text-sm text-slate-500">Módulo 4 • 25 Preguntas • 60 Minutos</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="border-orange-500 text-orange-600 hover:bg-orange-50"
                      onClick={() => { }}
                      loading={false}
                      disabled={false}
                    >
                      <HelpCircle className="w-5 h-5" />
                      Comenzar Examen
                    </Button>
                  </div>
                </div>

              </div>
            </div>

            <div className="py-8 text-center">
              <p className="text-slate-400 text-sm">No hay más eventos programados para esta semana.</p>
              <button className="mt-2 text-primary text-sm font-medium hover:underline">Ver calendario completo</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;