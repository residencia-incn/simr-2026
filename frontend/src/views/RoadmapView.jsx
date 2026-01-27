import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import * as Icons from 'lucide-react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const RoadmapView = ({ navigate }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState(null);
    const [progressHeight, setProgressHeight] = useState(0);
    const [visibleItems, setVisibleItems] = useState([]);

    const scrollPerformed = useRef(false);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.roadmap.getAll();

                const now = new Date();
                let currentActiveId = null;
                let activeIndex = 0;

                const sortedData = [...data].sort((a, b) => (a.order - b.order) || (new Date(a.sort_date) - new Date(b.sort_date)));

                sortedData.forEach((item, index) => {
                    if (!item.sort_date) return;
                    const itemDate = new Date(item.sort_date);
                    if (itemDate <= now) {
                        currentActiveId = item.id;
                        activeIndex = index;
                    }
                });

                if (!currentActiveId && sortedData.length > 0) {
                    currentActiveId = sortedData[0].id;
                    activeIndex = 0;
                }

                setItems(sortedData);
                setActiveId(currentActiveId);

                // Animación de la línea
                if (sortedData.length > 0) {
                    setTimeout(() => {
                        const percentage = ((activeIndex) / (Math.max(1, sortedData.length - 1))) * 100;
                        setProgressHeight(percentage);
                    }, 500);

                    // Animación de aparición escalonada
                    sortedData.forEach((item, index) => {
                        setTimeout(() => {
                            setVisibleItems(prev => [...prev, item.id]);
                        }, index * 150 + 300);
                    });
                }

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!loading && activeId && !scrollPerformed.current && visibleItems.includes(activeId)) {
            const timer = setTimeout(() => {
                const element = document.getElementById(`roadmap-item-${activeId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    scrollPerformed.current = true;
                }
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [loading, activeId, visibleItems]);

    const renderIcon = (iconName) => {
        const IconComponent = Icons[iconName] || Icons.Calendar;
        return <IconComponent size={20} />;
    };

    const getItemStatus = (itemId, sortDate) => {
        if (itemId === activeId) return 'active';
        const now = new Date();
        if (!sortDate) return 'future';
        const itemDate = new Date(sortDate);
        if (itemDate < now) return 'completed';
        return 'future';
    };

    const handleCTAClick = (link) => {
        if (!link) return;
        if (link.startsWith('http')) {
            window.open(link, '_blank', 'noopener,noreferrer');
        } else {
            const internalView = link.startsWith('/') ? link.substring(1) : link;
            if (navigate) navigate(internalView);
        }
    };

    return (
        <div className="bg-white min-h-screen py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-reveal {
                    animation: fadeInUp 0.6s ease-out forwards;
                }
            `}</style>

            <div className="max-w-3xl mx-auto">

                <div className="text-center mb-16 transition-all duration-700 opacity-100 translate-y-0">
                    <h2 className="text-blue-600 font-bold tracking-wide uppercase text-sm">Cronograma</h2>
                    <h1 className="mt-2 text-4xl font-extrabold text-slate-900 sm:text-5xl font-serif">
                        Ruta hacia el SIMR 2026
                    </h1>
                    <p className="mt-4 text-xl text-slate-500">
                        Sigue paso a paso las etapas clave del evento.
                    </p>
                </div>

                <div className="relative pl-4 sm:pl-0">

                    {/* LÍNEA BASE */}
                    <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-100 rounded-full"></div>

                    {/* LÍNEA DE PROGRESO */}
                    <div
                        className="absolute left-8 top-0 w-1 bg-blue-600 rounded-full transition-all duration-[1500ms] ease-in-out z-0 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                        style={{ height: `${progressHeight}%` }}
                    >
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full blur-sm animate-pulse"></div>
                    </div>

                    <div className="space-y-12 relative z-10">
                        {loading ? (
                            <div className="flex justify-center py-20 text-slate-400 animate-pulse font-medium">Cargando línea de tiempo...</div>
                        ) : items.map((item, index) => {
                            const status = getItemStatus(item.id, item.sort_date);
                            const isVisible = visibleItems.includes(item.id);

                            return (
                                <div
                                    id={`roadmap-item-${item.id}`}
                                    key={item.id}
                                    className={`relative flex gap-8 group transition-all duration-500 ${isVisible ? 'animate-reveal' : 'opacity-0'}`}
                                >

                                    <div className={`relative flex-shrink-0 w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-500 bg-white
                                        ${status === 'completed' ? 'border-blue-600 text-blue-600' :
                                            status === 'active' ? 'border-blue-600 text-white shadow-xl shadow-blue-200 scale-110 ring-4 ring-blue-50' :
                                                'border-slate-100 text-slate-300'}`}>

                                        {status === 'active' && <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-20"></div>}
                                        {status === 'active' && <div className="absolute inset-0 bg-blue-600 rounded-full"></div>}

                                        <div className="relative z-10">
                                            {status === 'completed' ? <CheckCircle2 size={24} /> : renderIcon(item.icon_name)}
                                        </div>
                                    </div>

                                    <div className={`flex-1 pt-2 transition-all duration-500 
                                        ${status === 'future' ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100' : ''}
                                        ${status === 'active' ? 'transform translate-x-2' : ''}
                                    `}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                                            <h3 className={`text-xl font-bold ${status === 'active' ? 'text-blue-700' : 'text-slate-800'}`}>
                                                {item.title}
                                                {status === 'active' && <span className="ml-3 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-200">En Curso</span>}
                                            </h3>
                                            <span className={`text-sm font-mono font-bold px-3 py-1 rounded-full w-fit mt-2 sm:mt-0 border
                                                ${status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                {item.date_display}
                                            </span>
                                        </div>

                                        <p className="text-slate-600 leading-relaxed mb-4">
                                            {item.description}
                                        </p>

                                        {item.cta_text && item.cta_link && (
                                            <button
                                                onClick={() => handleCTAClick(item.cta_link)}
                                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all
                                                    ${status === 'active'
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 hover:-translate-y-1'
                                                        : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-600 hover:text-blue-600'}`}
                                            >
                                                {item.cta_text} <ArrowRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RoadmapView;
