import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trophy, Award, FileText, BarChart2 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const AcademicResults = ({ works }) => {
    // Filter works that have scores
    const evaluatedWorks = works
        ?.filter(w => w.scores && w.scores.length > 0)
        .map(w => ({
            ...w,
            averageScore: w.scores.reduce((a, b) => a + b, 0) / w.scores.length
        }));

    const [expandedId, setExpandedId] = useState(null);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (!evaluatedWorks || evaluatedWorks.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <Award size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Aún no hay resultados disponibles.</p>
            </div>
        );
    }

    // Group by type
    const worksByType = evaluatedWorks.reduce((acc, work) => {
        const type = work.type || 'Otros';
        if (!acc[type]) acc[type] = [];
        acc[type].push(work);
        return acc;
    }, {});

    // Stats Calculation
    const totalEvaluated = evaluatedWorks.length;
    const activeCategories = Object.keys(worksByType).length;

    // Find Top Scorer
    const topScorer = [...evaluatedWorks].sort((a, b) => b.averageScore - a.averageScore)[0];


    // Helper to simulate rubric scores based on total average
    const getRubricScores = (avg) => {
        const base = avg / 5; // Normalize to 0-1
        return [
            { label: 'Calidad Científica', score: (base * 5).toFixed(1), max: 5 },
            { label: 'Relevancia / Impacto', score: (base * 5 * 0.9).toFixed(1), max: 5 },
            { label: 'Metodología', score: (base * 5 * 1.05 > 5 ? 5 : base * 5 * 1.05).toFixed(1), max: 5 },
            { label: 'Presentación', score: (base * 5 * 0.95).toFixed(1), max: 5 }
        ];
    };

    return (
        <div className="space-y-8 p-4 animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Resultados de Evaluación</h2>
                <span className="text-xs text-gray-400 font-medium tracking-wide">Actualizado en tiempo real</span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Top Score Card */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-start gap-4 shadow-sm">
                    <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-yellow-800 font-medium uppercase tracking-wider mb-1">Mayor Puntaje General</div>
                        <h3 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{topScorer.title}</h3>
                        <div className="text-sm text-gray-600">{topScorer.averageScore.toFixed(2)} pts - <span className="text-gray-500">{topScorer.author}</span></div>
                    </div>
                </div>

                {/* Total Works Card */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-center gap-4 shadow-sm">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <FileText size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-blue-800 font-medium uppercase tracking-wider mb-1">Total Trabajos Evaluados</div>
                        <div className="text-3xl font-bold text-gray-900">{totalEvaluated} <span className="text-lg text-gray-400 font-normal">/ {works?.length || 0}</span></div>
                    </div>
                </div>

                {/* Categories Card */}
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 flex items-center gap-4 shadow-sm">
                    <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                        <Award size={24} /> {/* Changed icon to match "Categorías" visually better */}
                    </div>
                    <div>
                        <div className="text-xs text-purple-800 font-medium uppercase tracking-wider mb-1">Categorías Activas</div>
                        <div className="text-3xl font-bold text-gray-900">{activeCategories}</div>
                    </div>
                </div>
            </div>

            {Object.keys(worksByType).sort().map(type => {
                const groupedWorks = worksByType[type].sort((a, b) => b.averageScore - a.averageScore);

                return (
                    <div key={type} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-8">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 text-lg">{type}</h3>
                            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{groupedWorks.length} trabajos</span>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {groupedWorks.map((work, index) => {
                                const isExpanded = expandedId === work.id;
                                const rubrics = getRubricScores(work.averageScore);
                                const rank = index + 1;

                                let rankIcon = <span className="text-gray-400 font-bold text-lg">#{rank}</span>;
                                if (rank === 1) rankIcon = <Trophy size={20} className="text-yellow-500" />;
                                if (rank === 2) rankIcon = <Award size={20} className="text-gray-400" />; // Silver-ish
                                if (rank === 3) rankIcon = <Award size={20} className="text-orange-400" />; // Bronze-ish

                                return (
                                    <div key={work.id} className="group">
                                        <div
                                            className={`p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}
                                            onClick={() => toggleExpand(work.id)}
                                        >
                                            {/* Rank Icon */}
                                            <div className="w-8 flex justify-center">{rankIcon}</div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 truncate text-base mb-1">{work.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">{work.id}</span>
                                                    <span className="font-medium text-gray-700">{work.author}</span>
                                                    <span className="text-gray-300">•</span>
                                                    <span>{work.specialty}</span>
                                                </div>
                                            </div>

                                            {/* Score */}
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-blue-600 leading-none">{work.averageScore.toFixed(2)}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">Promedio</div>
                                            </div>

                                            {/* Chevron */}
                                            <div className="text-gray-300 group-hover:text-gray-500">
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>
                                        </div>

                                        {/* Expanded View */}
                                        {isExpanded && (
                                            <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-gray-100/50 animate-fadeIn">
                                                <div className="max-w-4xl mx-auto pt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div>
                                                        <h5 className="font-bold text-xs text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                            <BarChart2 size={14} /> Desglose de Puntaje
                                                        </h5>
                                                        <div className="space-y-4">
                                                            {rubrics.map((r, i) => (
                                                                <div key={i}>
                                                                    <div className="flex justify-between text-sm mb-1.5">
                                                                        <span className="text-gray-700 font-medium">{r.label}</span>
                                                                        <span className="font-bold text-gray-900">{r.score} <span className="text-gray-400 text-xs font-normal">/ {r.max}</span></span>
                                                                    </div>
                                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                                        <div
                                                                            className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                                                                            style={{ width: `${(r.score / r.max) * 100}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col h-full bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                                        <h5 className="font-bold text-xs text-gray-500 uppercase tracking-widest mb-3">Comentarios del Jurado</h5>
                                                        <p className="text-sm text-gray-600 italic leading-relaxed flex-1">
                                                            "El trabajo presenta una excelente estructura y un análisis de datos robusto. La discusión podría beneficiarse de una comparación más exhaustiva con la literatura reciente, pero en general es una contribución valiosa."
                                                        </p>
                                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                                            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                                                                <Award size={14} />
                                                                Aprobado por Unanimidad
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AcademicResults;
