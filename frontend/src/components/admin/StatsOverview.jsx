import React from 'react';
import { Users, DollarSign, Award, Activity } from 'lucide-react';
import Card from '../ui/Card';

const StatsOverview = ({ attendees, totalIncome }) => {
    const totalAttendees = attendees.length;
    // const totalCollected = attendees.reduce((acc, curr) => acc + curr.amount, 0); // Removed internal calc
    const presencialCount = attendees.filter(a => a.modality === 'Presencial').length;
    const hibridoCount = attendees.filter(a => a.modality === 'Hibrido').length;

    // Group by Specialty
    const specialties = attendees.reduce((acc, curr) => {
        acc[curr.specialty] = (acc[curr.specialty] || 0) + 1;
        return acc;
    }, {});

    // Group by Role
    const roles = attendees.reduce((acc, curr) => {
        acc[curr.role] = (acc[curr.role] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-5 border-l-4 border-blue-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total Asistentes</p>
                            <h3 className="text-2xl font-bold text-gray-900">{totalAttendees}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-purple-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                            <Award size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Presenciales</p>
                            <h3 className="text-2xl font-bold text-gray-900">{presencialCount}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-amber-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Híbridos</p>
                            <h3 className="text-2xl font-bold text-gray-900">{hibridoCount}</h3>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts / Distributions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Asistentes por Rol</h3>
                    <div className="space-y-3">
                        {Object.entries(roles).map(([role, count]) => (
                            <div key={role}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700 font-medium">{role}</span>
                                    <span className="text-gray-500">{count} ({Math.round(count / totalAttendees * 100)}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(count / totalAttendees) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Top Especialidades</h3>
                    <div className="space-y-3">
                        {Object.entries(specialties).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([spec, count]) => (
                            <div key={spec} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-800">{spec}</span>
                                <span className="text-xs font-bold bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">{count}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StatsOverview;
