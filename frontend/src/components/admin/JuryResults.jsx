import React, { useMemo } from 'react';
import { Trophy, Medal, Award, FileText } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const JuryResults = ({ works }) => {
    // Calculate average scores and sort
    const processedWorks = useMemo(() => {
        return works.map(work => {
            const totalScore = work.scores.reduce((a, b) => a + b, 0);
            const averageScore = work.scores.length > 0 ? (totalScore / work.scores.length).toFixed(2) : 0;
            return { ...work, averageScore: parseFloat(averageScore) };
        }).sort((a, b) => b.averageScore - a.averageScore);
    }, [works]);

    // Group by type
    const worksByType = useMemo(() => {
        const groups = {};
        processedWorks.forEach(work => {
            if (!groups[work.type]) {
                groups[work.type] = [];
            }
            groups[work.type].push(work);
        });
        return groups;
    }, [processedWorks]);

    const getRankIcon = (index) => {
        switch (index) {
            case 0: return <Trophy className="text-yellow-500" size={24} />;
            case 1: return <Medal className="text-gray-400" size={24} />;
            case 2: return <Medal className="text-amber-600" size={24} />;
            default: return <span className="font-bold text-gray-400 w-6 text-center">{index + 1}</span>;
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-full text-yellow-600"><Trophy size={24} /></div>
                        <div>
                            <div className="text-sm text-gray-600">Mayor Puntaje General</div>
                            <div className="text-xl font-bold text-gray-900">{processedWorks[0]?.title}</div>
                            <div className="text-xs text-gray-500">{processedWorks[0]?.averageScore} pts - {processedWorks[0]?.author}</div>
                        </div>
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600"><FileText size={24} /></div>
                        <div>
                            <div className="text-sm text-gray-600">Total Trabajos Evaluados</div>
                            <div className="text-2xl font-bold text-gray-900">{works.filter(w => w.scores.length > 0).length} / {works.length}</div>
                        </div>
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-full text-purple-600"><Award size={24} /></div>
                        <div>
                            <div className="text-sm text-gray-600">Categorías Activas</div>
                            <div className="text-2xl font-bold text-gray-900">{Object.keys(worksByType).length}</div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="space-y-8">
                {Object.entries(worksByType).map(([type, categoryWorks]) => (
                    <div key={type} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 text-lg">{type}</h3>
                            <Badge>{categoryWorks.length} trabajos</Badge>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {categoryWorks.map((work, index) => (
                                <div key={work.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex-shrink-0 w-12 flex justify-center">
                                        {getRankIcon(index)}
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-gray-900">{work.title}</h4>
                                        <div className="text-sm text-gray-600 flex gap-2 items-center mt-1">
                                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{work.id}</span>
                                            <span>{work.author}</span>
                                            <span className="text-gray-300">•</span>
                                            <span>{work.specialty}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-700">{work.averageScore}</div>
                                        <div className="text-xs text-gray-500">Promedio</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JuryResults;
