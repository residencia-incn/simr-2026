import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Trash2, User, Users, Layers, Edit2 } from 'lucide-react';

const CommitteeManager = () => {
    const [activeTab, setActiveTab] = useState('members');
    const [groups, setGroups] = useState([]);
    const [members, setMembers] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estado Modales
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);

    // Forms
    const [groupForm, setGroupForm] = useState({ id: null, name: '', description: '', order: 0 });
    const [memberForm, setMemberForm] = useState({ user_id: '', position: '', committee_id: '', priority: 10 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [gData, mData, cData] = await Promise.all([
                api.committee.getGroups(),
                api.committee.getAll(),
                api.committee.getCandidates()
            ]);
            setGroups(gData);
            setMembers(mData);
            setCandidates(cData);
        } catch (error) {
            console.error("Error cargando datos", error);
        } finally {
            setLoading(false);
        }
    };

    // --- GRUPO HANDLERS ---
    const handleEditGroup = (group) => {
        setGroupForm(group);
        setShowGroupModal(true);
    };

    const handleSaveGroup = async (e) => {
        e.preventDefault();
        try {
            if (groupForm.id) {
                await api.committee.updateGroup(groupForm.id, groupForm);
            } else {
                await api.committee.createGroup(groupForm);
            }
            setShowGroupModal(false);
            setGroupForm({ id: null, name: '', description: '', order: 0 });
            // Recargar solo grupos
            const gRes = await api.committee.getGroups();
            setGroups(gRes);
        } catch (error) {
            alert("Error guardando grupo");
        }
    };

    const handleDeleteGroup = async (id) => {
        if (!window.confirm("¿Eliminar este grupo? Esto podría afectar a los miembros asignados.")) return;
        try {
            await api.committee.deleteGroup(id);
            const gRes = await api.committee.getGroups();
            setGroups(gRes);
        } catch (error) {
            alert("Error eliminando grupo");
        }
    };

    // --- MIEMBRO HANDLERS ---
    const handleSaveMember = async (e) => {
        e.preventDefault();
        if (!memberForm.user_id) return alert("Seleccione un usuario");
        if (!memberForm.committee_id) return alert("Seleccione un comité");

        try {
            await api.committee.create(memberForm);
            setShowMemberModal(false);
            setMemberForm({ user_id: '', position: '', committee_id: '', priority: 10 });
            // Recargar miembros y candidatos
            const [mRes, cRes] = await Promise.all([api.committee.getAll(), api.committee.getCandidates()]);
            setMembers(mRes);
            setCandidates(cRes);
        } catch (error) {
            alert("Error al asignar miembro: " + (error.response?.data?.detail || ""));
        }
    };

    const handleDeleteMember = async (id) => {
        if (!window.confirm("¿Quitar a este miembro del comité?")) return;
        try {
            await api.committee.remove(id);
            const [mRes, cRes] = await Promise.all([api.committee.getAll(), api.committee.getCandidates()]);
            setMembers(mRes);
            setCandidates(cRes);
        } catch (error) {
            alert("Error al eliminar");
        }
    };

    const openMemberModal = () => {
        // Pre-seleccionar primer grupo si existe
        if (groups.length > 0 && !memberForm.committee_id) {
            setMemberForm(prev => ({ ...prev, committee_id: groups[0].id }));
        }
        setShowMemberModal(true);
    };

    return (
        <div className="p-6 max-w-6xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-blue-600" size={24} />
                        Gestión del Comité
                    </h3>
                    <p className="text-sm text-slate-500">Define los grupos y asigna a los miembros del comité.</p>
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-4 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('groups')}
                    className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'groups' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Layers size={18} /> Grupos (Comités)
                </button>
                <button
                    onClick={() => setActiveTab('members')}
                    className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'members' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <User size={18} /> Miembros Asignados
                </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-hidden flex flex-col">

                {/* --- TAB GRUPOS --- */}
                {activeTab === 'groups' && (
                    <div className="flex flex-col h-full animate-fadeIn">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => { setGroupForm({ id: null, name: '', description: '', order: 0 }); setShowGroupModal(true); }}
                                className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm text-sm font-semibold">
                                <Plus size={16} /> Crear Nuevo Grupo
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                                    <tr>
                                        <th className="px-6 py-3">Orden</th>
                                        <th className="px-6 py-3">Nombre del Grupo</th>
                                        <th className="px-6 py-3">Descripción</th>
                                        <th className="px-6 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {groups.map(g => (
                                        <tr key={g.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 font-mono text-slate-400">{g.order}</td>
                                            <td className="px-6 py-3 font-semibold text-slate-800">{g.name}</td>
                                            <td className="px-6 py-3 text-slate-500 text-sm truncate max-w-xs">{g.description || '-'}</td>
                                            <td className="px-6 py-3 text-right flex justify-end gap-2">
                                                <button onClick={() => handleEditGroup(g)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDeleteGroup(g.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {groups.length === 0 && !loading && <tr><td colSpan="4" className="p-8 text-center text-slate-400">No hay grupos definidos. Crea uno para empezar.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB MIEMBROS --- */}
                {activeTab === 'members' && (
                    <div className="flex flex-col h-full animate-fadeIn">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={openMemberModal}
                                disabled={groups.length === 0}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium ${groups.length === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                <Plus size={18} /> Asignar Miembro
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                                    <tr>
                                        <th className="px-6 py-3">Comité (Grupo)</th>
                                        <th className="px-6 py-3">Prioridad</th>
                                        <th className="px-6 py-3">Miembro</th>
                                        <th className="px-6 py-3">Cargo</th>
                                        <th className="px-6 py-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {members.map(m => (
                                        <tr key={m.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-3">
                                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md border border-indigo-100">
                                                    {m.committee?.name || '---'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 font-mono text-slate-400 text-xs">{m.priority}</td>
                                            <td className="px-6 py-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                                    {m.photoUrl ? <img src={m.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">{m.fullName?.[0]}</div>}
                                                </div>
                                                <div className="font-medium text-slate-900 text-sm">{m.fullName}</div>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-slate-600">{m.position}</td>
                                            <td className="px-6 py-3 text-center">
                                                <button onClick={() => handleDeleteMember(m.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {members.length === 0 && !loading && <tr><td colSpan="5" className="p-8 text-center text-slate-400">No hay miembros asignados.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL GRUPS */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-scaleIn">
                        <h3 className="text-lg font-bold mb-4">{groupForm.id ? 'Editar Grupo' : 'Nuevo Grupo'}</h3>
                        <form onSubmit={handleSaveGroup} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">NOMBRE</label>
                                <input className="w-full border rounded p-2 text-sm focus:border-indigo-500 outline-none"
                                    value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} required autoFocus />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">DESCRIPCIÓN</label>
                                <input className="w-full border rounded p-2 text-sm focus:border-indigo-500 outline-none"
                                    value={groupForm.description} onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">ORDEN (Menor va primero)</label>
                                <input type="number" className="w-full border rounded p-2 text-sm focus:border-indigo-500 outline-none"
                                    value={groupForm.order} onChange={e => setGroupForm({ ...groupForm, order: parseInt(e.target.value) })} />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowGroupModal(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL MIEMBROS */}
            {showMemberModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-scaleIn">
                        <h3 className="text-lg font-bold mb-4">Asignar Miembro</h3>
                        <form onSubmit={handleSaveMember} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">USUARIO</label>
                                <select className="w-full border rounded p-2 text-sm focus:border-indigo-500 outline-none"
                                    value={memberForm.user_id} onChange={e => setMemberForm({ ...memberForm, user_id: e.target.value })} required>
                                    <option value="">-- Seleccionar --</option>
                                    {candidates.map(c => <option key={c.id} value={c.id}>{c.name} ({c.role})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">COMITÉ (GRUPO)</label>
                                <select className="w-full border rounded p-2 text-sm focus:border-indigo-500 outline-none"
                                    value={memberForm.committee_id} onChange={e => setMemberForm({ ...memberForm, committee_id: e.target.value })} required>
                                    <option value="">-- Seleccionar Grupo --</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">CARGO VISIBLE</label>
                                <input className="w-full border rounded p-2 text-sm focus:border-indigo-500 outline-none" placeholder="Ej: Vocal, Presidente..."
                                    value={memberForm.position} onChange={e => setMemberForm({ ...memberForm, position: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">PRIORIDAD (1 = Arriba)</label>
                                <input type="number" className="w-full border rounded p-2 text-sm focus:border-indigo-500 outline-none"
                                    value={memberForm.priority} onChange={e => setMemberForm({ ...memberForm, priority: parseInt(e.target.value) })} />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowMemberModal(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommitteeManager;
