import React, { useState } from 'react';
import ManageRoomsModal from './ManageRoomsModal';
import ProgramSettingsModal from './ProgramSettingsModal';
import { api } from '../../services/api';
import { formatDateLabel } from '../../utils/formatters';

const AdminView = ({
    schedule,
    selectedDay,
    onDaySelect,
    onEditSession,
    onDeleteSession,
    onNewSession,
    availableRooms, // Assuming these are passed as props
    availableCategories, // Assuming these are passed as props
    refreshSchedule // Assuming this is passed as a prop
}) => {
    const [selectedType, setSelectedType] = useState('Todos');
    const [selectedRoom, setSelectedRoom] = useState('Todas');
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const currentDayData = schedule.find(d => d.dayNumber === selectedDay) || schedule[0];

    // Filter sessions based on selection
    const filteredSessions = currentDayData?.sessions.filter(session => {
        const matchesRoom = selectedRoom === 'Todas' ||
            session.location === selectedRoom ||
            session.virtualLocation === selectedRoom;
        const matchesType = selectedType === 'Todos' || session.category === selectedType;
        return matchesRoom && matchesType;
    }) || [];

    return (
        <div className="flex flex-col gap-6">
            {/* Filters & Tabs Wrapper */}
            <div className="sticky top-14 md:top-28 z-30 bg-background-light dark:bg-background-dark pt-4 pb-2 transition-all">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
                    <div className="overflow-x-auto hide-scrollbar">
                        <div className="flex p-1 bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700">
                            {schedule.map(day => (
                                <button
                                    key={day.dayNumber}
                                    onClick={() => onDaySelect(day.dayNumber)}
                                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${selectedDay === day.dayNumber
                                        ? 'bg-white dark:bg-slate-700 text-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        } `}
                                >
                                    Día {day.dayNumber} ({formatDateLabel(day.date)})
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Grouped Filters */}
                        <div className="flex bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                            <select
                                className="bg-transparent border-0 text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-0 py-1 pl-2 pr-8 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                            >
                                <option value="Todas">Todas las Salas</option>
                                {availableRooms?.physical?.length > 0 ? (
                                    availableRooms.physical.map(room => (
                                        <option key={room.id} value={room.name}>{room.name}</option>
                                    ))
                                ) : (
                                    <option value="Auditorio Principal">Auditorio Principal</option>
                                )}
                                {availableRooms?.virtual?.map(room => (
                                    <option key={room.id} value={room.name}>{room.name}</option>
                                ))}
                            </select>
                            <div className="w-px bg-slate-200 dark:bg-slate-700 my-1"></div>
                            <select
                                className="bg-transparent border-0 text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-0 py-1 pl-2 pr-8 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                            >
                                <option value="Todos">Todos los Tipos</option>
                                {availableCategories && availableCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Config Button */}
                        <button
                            onClick={() => setIsSettingsModalOpen(true)}
                            className="p-2 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-primary hover:border-primary shadow-sm transition-all"
                            title="Configuración General"
                        >
                            <span className="material-symbols-outlined text-[20px]">settings</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Admin Timeline */}
            <div className="relative flex flex-col gap-4 mt-2">
                <div className="absolute left-[70px] md:left-[90px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

                {filteredSessions.map((session) => (
                    <div key={session.id} className="relative flex flex-col sm:flex-row gap-4 sm:gap-8 group">
                        <div className="sm:w-[75px] flex-shrink-0 flex flex-col items-end pt-1 pr-4 sm:pr-0">
                            <div className="flex items-center gap-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -left-8 sm:left-auto sm:-ml-10 cursor-grab text-slate-400">
                                <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                            </div>
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{session.timeStart}</span>
                            <span className="text-xs text-slate-500 font-medium">{session.timeEnd}</span>
                        </div>

                        <div className="absolute left-[66px] md:left-[86px] top-3 size-2.5 rounded-full border-[2px] border-primary bg-white dark:bg-background-dark hidden sm:block z-10"></div>

                        <div className="flex-1 bg-white dark:bg-card-dark rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 relative">
                            <div className="flex flex-col md:flex-row justify-between gap-3 mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {session.category && session.category !== 'GENERAL' && (
                                            <span className={`inline-flex items-center rounded-md bg-${session.categoryColor}-50 dark:bg-${session.categoryColor}-900/20 px-2 py-0.5 text-xs font-medium text-${session.categoryColor}-700 dark:text-${session.categoryColor}-300 border border-${session.categoryColor}-100 dark:border-${session.categoryColor}-800`}>
                                                {session.category}
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-400 tracking-tighter">• ID: #{session.id.toUpperCase()}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                                        {session.title}
                                    </h3>
                                </div>
                                <div className="flex items-start gap-1">
                                    <button
                                        onClick={() => onEditSession(session.id)}
                                        className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        title="Editar"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button
                                        onClick={() => onDeleteSession(session.id)}
                                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        title="Eliminar"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    {session.speakers.length > 0 && (
                                        <>
                                            <div className="bg-center bg-no-repeat bg-cover rounded-full size-8 border border-slate-200" style={{ backgroundImage: `url("${session.speakers[0].imageUrl}")` }}></div>
                                            <div className="flex flex-col leading-none">
                                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{session.speakers[0].name}</span>
                                                <span className="text-[11px] text-slate-500">{session.speakers.length > 1 ? 'Panel de Expertos' : 'Ponente Principal'}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="sm:ml-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                    <div className="flex flex-wrap justify-end items-center gap-2 max-w-[300px]">
                                        {session.location && (
                                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded whitespace-nowrap">
                                                <span className="material-symbols-outlined text-[16px]">apartment</span>
                                                <span className="text-xs font-medium">{session.location}</span>
                                            </div>
                                        )}
                                        {session.virtualLocation && (
                                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded whitespace-nowrap">
                                                <span className="material-symbols-outlined text-[16px]">videocam</span>
                                                <span className="text-xs font-medium">{session.virtualLocation}</span>
                                            </div>
                                        )}
                                        {(!session.location && !session.virtualLocation) && (
                                            <div className="flex items-center gap-1 text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded border border-dashed border-slate-300">
                                                <span className="material-symbols-outlined text-[16px]">location_off</span>
                                                <span className="text-xs font-medium">Sin sala</span>
                                            </div>
                                        )}
                                    </div>
                                    {(() => {
                                        const isScheduledPassed = session.status === 'Programado' && session.scheduledAt && new Date(session.scheduledAt) <= new Date();
                                        const displayStatus = isScheduledPassed ? 'Publicado' : session.status;

                                        return (
                                            <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border ${displayStatus === 'Publicado'
                                                ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30'
                                                : displayStatus === 'Programado'
                                                    ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30'
                                                    : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30'
                                                } `}>
                                                <span className={`size-1.5 rounded-full ${displayStatus === 'Publicado' ? 'bg-green-600' :
                                                        displayStatus === 'Programado' ? 'bg-blue-600' : 'bg-amber-500'
                                                    } `}></span>
                                                {displayStatus}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={onNewSession}
                    className="group relative flex flex-col sm:flex-row gap-8 items-center justify-center py-6 mt-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer w-full"
                >
                    <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-3xl">add_circle</span>
                        <span className="font-medium text-sm">Añadir slot de tiempo en este día</span>
                    </div>
                </button>
            </div>

            <ProgramSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                onSave={refreshSchedule}
            />
        </div>
    );
};

export default AdminView;
