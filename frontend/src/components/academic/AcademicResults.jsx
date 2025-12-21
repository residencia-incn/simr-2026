import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trophy, Award, FileText, BarChart2 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const AcademicResults = ({ works }) => {
    // 1. Filter works that have evaluations
    const evaluatedWorks = works
        ?.filter(w => w.evaluations && w.evaluations.length > 0)
        .map(w => {
            const evals = w.evaluations;
            const evalCount = evals.length;

            // Calculate Total Average
            const averageScore = evals.reduce((sum, e) => sum + e.totalScore, 0) / evalCount;

            // Calculate Average per Criteria
            // Collect all unique criteria keys from the first evaluation (assuming consistency)
            // If inconsistent, we could aggregate all keys
            const criteriaKeys = evals[0].scores ? Object.keys(evals[0].scores) : [];

            const criteriaStats = criteriaKeys.map(key => {
                const totalKeyScore = evals.reduce((sum, e) => sum + (e.scores[key] || 0), 0);
                return {
                    label: key,
                    score: (totalKeyScore / evalCount).toFixed(1),
                    max: 5 // Assuming rubric max is 5, could be dynamic
                };
            });

            // Extract Comments
            const comments = evals
                .filter(e => e.comment && e.comment.trim() !== "")
                .map(e => ({
                    juror: e.jurorName,
                    text: e.comment
                }));

            return {
                ...w,
                averageScore,
                criteriaStats,
                comments,
                evalCount
            };
        });

    const [expandedId, setExpandedId] = useState(null);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (!evaluatedWorks || evaluatedWorks.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <Award size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Aún no hay resultados disponibles. Los trabajos deben ser evaluados por los jurados primero.</p>
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
                {topScorer && (
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
                )}

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
                        <Award size={24} />
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
                                                    <span className="ml-2 text-blue-600 bg-blue-50 px-2 rounded-full font-medium">
                                                        {work.evalCount} Evaluaciones
                                                    </span>
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
                                                            <BarChart2 size={14} /> Desglose de Puntaje Promedio
                                                        </h5>
                                                        <div className="space-y-4">
                                                            {work.criteriaStats.map((r, i) => (
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
                                                        <h5 className="font-bold text-xs text-gray-500 uppercase tracking-widest mb-3">Comentarios del Jurado ({work.comments.length})</h5>
                                                        {work.comments.length > 0 ? (
                                                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {work.comments.map((comment, i) => (
                                                                    <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                                        <p className="text-sm text-gray-600 italic leading-relaxed mb-2">
                                                                            "{comment.text}"
                                                                        </p>
                                                                        <div className="text-xs text-gray-400 font-medium flex justify-end">
                                                                            - {comment.juror}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-400 italic text-sm text-center py-4">No hay comentarios cualitativos.</div>
                                                        )}

                                                        {work.averageScore >= 3.5 && ( // Example threshold
                                                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                                                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                                                                    <Award size={14} />
                                                                    Trabajo Destacado
                                                                </div>
                                                            </div>
                                                        )}
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
