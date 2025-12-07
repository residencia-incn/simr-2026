import React, { useState, useEffect } from 'react';
import { Briefcase, User } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';
import { api } from '../services/api';

const CommitteeView = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCommittee = async () => {
            try {
                const data = await api.committee.getAll();
                setGroups(data);
            } catch (err) {
                console.error("Error loading committee", err);
            } finally {
                setLoading(false);
            }
        };

        loadCommittee();
        window.addEventListener('committee-updated', loadCommittee);
        return () => window.removeEventListener('committee-updated', loadCommittee);
    }, []);

    if (loading && groups.length === 0) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando comité...</div>;

    return (
        <div className="animate-fadeIn space-y-12 max-w-7xl mx-auto">
            <SectionHeader
                title="Comité Organizador"
                subtitle="Conoce al equipo de residentes detrás de la organización del SIMR 2026."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {groups.map((group, idx) => (
                    <div key={group.id || idx} className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transform hover:-translate-y-1 transition-all duration-300 ${idx === 0 ? 'md:col-span-2' : ''}`}>
                        <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-blue-100 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                                <Briefcase size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{group.title || group.role}</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {group.members.map((member, mIdx) => (
                                    <div key={member.id || mIdx} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0 bg-gray-200 flex items-center justify-center mt-1">
                                            {(member.image || member.img) ? (
                                                <img src={member.image || member.img} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="text-gray-400" />
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors leading-tight">{member.name}</h4>
                                            <p className="text-sm text-blue-600 font-medium mt-1">{member.role || member.year}</p>
                                            {member.subRole && <p className="text-xs text-gray-500 mt-0.5">{member.subRole}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommitteeView;
