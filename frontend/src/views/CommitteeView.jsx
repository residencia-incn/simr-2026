import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Briefcase } from 'lucide-react';

// --- UTILS: COLORES PASTEL VISIBLES ---
const PASTEL_COLORS = [
    {
        bg: 'bg-blue-50', border: 'border-blue-100',
        iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
        hoverBorder: 'hover:border-blue-200'
    },
    {
        bg: 'bg-emerald-50', border: 'border-emerald-100',
        iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
        hoverBorder: 'hover:border-emerald-200'
    },
    {
        bg: 'bg-violet-50', border: 'border-violet-100',
        iconBg: 'bg-violet-100', iconColor: 'text-violet-600',
        hoverBorder: 'hover:border-violet-200'
    },
    {
        bg: 'bg-amber-50', border: 'border-amber-100',
        iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
        hoverBorder: 'hover:border-amber-200'
    },
    {
        bg: 'bg-rose-50', border: 'border-rose-100',
        iconBg: 'bg-rose-100', iconColor: 'text-rose-600',
        hoverBorder: 'hover:border-rose-200'
    },
    {
        bg: 'bg-cyan-50', border: 'border-cyan-100',
        iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600',
        hoverBorder: 'hover:border-cyan-200'
    },
];

const getColor = (index) => PASTEL_COLORS[index % PASTEL_COLORS.length];

// --- COMPONENTES ---

const GroupCard = ({ title, members, color, className = "" }) => (
    // "Parallax" simplificado: movimiento suave al hover y sombra profunda
    <div className={`rounded-2xl shadow-sm border ${color.border} ${color.bg} overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 ${color.hoverBorder} ${className}`}>

        {/* Cabecera del Grupo */}
        <div className="px-6 py-4 border-b border-black/5 flex items-center gap-3 bg-white/50 backdrop-blur-sm">
            <div className={`w-10 h-10 rounded-xl ${color.iconBg} ${color.iconColor} flex items-center justify-center shadow-sm`}>
                <Briefcase size={20} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg font-serif">{title}</h3>
        </div>

        {/* Lista de Miembros - Grid estricto de 2 columnas (o 1 en móvil) */}
        <div className="p-6 grid gap-4 grid-cols-1 md:grid-cols-2">
            {members.map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/60 border border-transparent hover:bg-white hover:border-black/5 hover:shadow-md transition-all duration-300 group">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                            {member.photoUrl ? (
                                <img src={member.photoUrl} alt={member.fullName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-lg text-slate-400 font-bold">
                                    {member.fullName ? member.fullName.charAt(0) : 'U'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 leading-tight text-sm truncate">{member.fullName}</h4>
                        <p className={`font-medium text-xs mt-1 ${color.iconColor} uppercase tracking-wide`}>{member.position}</p>
                        {member.user && member.user.role && (
                            <p className="text-slate-400 text-[10px] mt-0.5 capitalize truncate">{member.user.role}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const CommitteeView = () => {
    const [groupedMembers, setGroupedMembers] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await api.committee.getAll();
                const grouped = data.reduce((acc, member) => {
                    const groupName = member.committee ? member.committee.name : "Otros";
                    if (!acc[groupName]) acc[groupName] = [];
                    acc[groupName].push(member);
                    return acc;
                }, {});
                setGroupedMembers(grouped);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Separar lógica de grupos (Junta Directiva)
    const allGroups = Object.keys(groupedMembers);
    const mainGroupKey = allGroups.find(g => g.toLowerCase().includes('directiva') || g.toLowerCase().includes('president'));
    const otherGroups = allGroups.filter(g => g !== mainGroupKey);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">

            {/* HEADER TIPO DASHBOARD */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Título Left con Borde Azul */}
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-1.5 bg-blue-600 rounded-full"></div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight font-serif">
                                Comité Organizador
                            </h1>
                        </div>

                        {/* Descripción Right */}
                        <p className="text-slate-500 text-sm md:text-base max-w-md text-right hidden md:block">
                            Conoce al equipo de residentes detrás de la organización del SIMR 2026.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-12">

                        {/* 1. SECCIÓN PRESIDENTE (CENTRADO Y TAMAÑO DE TARJETA ESTÁNDAR) */}
                        {mainGroupKey && groupedMembers[mainGroupKey] && (
                            <div className="flex justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                                {/* Se ajusta el ancho a w-full md:w-1/2 para imitar el tamaño de una columna del grid de abajo */}
                                <div className="w-full md:w-1/2">
                                    <GroupCard
                                        title={mainGroupKey}
                                        members={groupedMembers[mainGroupKey]}
                                        color={PASTEL_COLORS[0]} // Azul para Presidencia
                                    />
                                </div>
                            </div>
                        )}

                        {/* 2. GRID PARA LOS DEMÁS COMITÉS */}
                        {otherGroups.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
                                {otherGroups.map((groupName, index) => (
                                    <GroupCard
                                        key={groupName}
                                        title={groupName}
                                        members={groupedMembers[groupName]}
                                        color={PASTEL_COLORS[(index + 1) % PASTEL_COLORS.length]} // Offset color index
                                    />
                                ))}
                            </div>
                        )}

                        {allGroups.length === 0 && (
                            <div className="col-span-full text-center py-20 text-slate-400 italic">
                                No hay miembros asignados al comité.
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="text-center mt-20 pt-8 border-t border-slate-200/50">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Instituto Nacional de Ciencias Neurológicas
                    </p>
                </div>

            </div>
        </div>
    );
};

export default CommitteeView;
