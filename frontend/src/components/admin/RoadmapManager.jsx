import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Plus, Trash2, Edit2, Calendar, Link as LinkIcon, Save, X, Search } from 'lucide-react';
import * as Icons from 'lucide-react';
import Button from '../ui/Button';
import { showDeleteConfirm } from '../../utils/alerts';

const RoadmapManager = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const initialForm = {
        title: '',
        date_display: '',
        description: '',
        icon_name: 'Calendar',
        cta_text: '',
        cta_link: '',
        sort_date: '',
        order: 0
    };
    const [form, setForm] = useState(initialForm);

    const iconOptions = ["Calendar", "FileText", "Users", "Mic", "Award", "BookOpen", "CreditCard", "CheckCircle", "Rocket", "Clock", "UserPlus"];

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await api.roadmap.getAll();
            setItems(data);
        } catch (e) {
            console.error(e);
            alert("Error al cargar los datos del Roadmap. Por favor, verifica la conexión o refresca la página.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...form,
                sort_date: form.sort_date ? `${form.sort_date}T00:00:00` : null
            };

            if (editingItem) {
                await api.roadmap.update({ ...editingItem, ...payload });
            } else {
                await api.roadmap.add(payload);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            setForm(initialForm);
            loadData();
        } catch (error) {
            console.error("Error saving", error);
            alert("Error al guardar");
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setForm({
            title: item.title || '',
            date_display: item.date_display || '',
            description: item.description || '',
            icon_name: item.icon_name || 'Calendar',
            cta_text: item.cta_text || '',
            cta_link: item.cta_link || '',
            sort_date: item.sort_date ? item.sort_date.split('T')[0] : '',
            order: item.order || 0
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const confirmed = await showDeleteConfirm('¿Estás seguro de eliminar este hito?', 'Eliminar Hito');
        if (confirmed) {
            try {
                await api.roadmap.delete(id);
                loadData();
            } catch (error) {
                console.error("Error deleting", error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 font-serif">Gestión del Roadmap</h1>
                    <p className="text-sm text-slate-500">Diseña la ruta clínica del residente SIMR 2026.</p>
                </div>
                <Button onClick={() => { setEditingItem(null); setForm(initialForm); setIsModalOpen(true); }}
                    className="flex items-center gap-2">
                    <Plus size={18} /> Nuevo Evento
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                        <tr>
                            <th className="px-6 py-4">Orden</th>
                            <th className="px-6 py-4">Hito / Evento</th>
                            <th className="px-6 py-4">Fecha Visible</th>
                            <th className="px-6 py-4">Estado Temporal</th>
                            <th className="px-6 py-4">Acción (CTA)</th>
                            <th className="px-6 py-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="6" className="py-10 text-center text-slate-400">Cargando eventos...</td></tr>
                        ) : items.map((item) => {
                            const now = new Date();
                            const itemDate = item.sort_date ? new Date(item.sort_date) : null;
                            const isPast = itemDate && itemDate < now;

                            return (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-400 font-bold">{item.order}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isPast ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                                                {React.createElement(Icons[item.icon_name] || Icons.Calendar, { size: 18 })}
                                            </div>
                                            <span className="font-bold text-slate-800">{item.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">{item.date_display}</td>
                                    <td className="px-6 py-4">
                                        {itemDate ? (
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase
                            ${isPast ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
                                                {isPast ? 'Pasado' : 'Próximo'}
                                            </span>
                                        ) : <span className="text-slate-300">N/A</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.cta_text ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 uppercase">
                                                <LinkIcon size={12} /> {item.cta_text}
                                            </span>
                                        ) : <span className="text-slate-300 text-xs">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {!loading && items.length === 0 && (
                            <tr><td colSpan="6" className="py-20 text-center text-slate-400"><Calendar className="mx-auto mb-2 opacity-20" size={48} /> No hay hitos configurados</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-800">{editingItem ? 'Editar Hito Clínico' : 'Nuevo Hito para el Roadmap'}</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Configuración del Sistema Nervioso del Evento</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[80vh] overflow-y-auto">

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título del Hito</label>
                                    <input required type="text" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej: Envío de Abstracts" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción / Detalles</label>
                                    <textarea className="w-full border border-slate-200 rounded-lg p-3 text-sm h-32 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Instrucciones breves para el residente..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Visible (Label)</label>
                                        <input required type="text" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={form.date_display} onChange={e => setForm({ ...form, date_display: e.target.value })} placeholder="Ej: Marzo 2026" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Orden (Prioridad)</label>
                                        <input type="number" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) })} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
                                <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">Personalización Avanzada</h4>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Icono Representativo</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {iconOptions.map(icon => (
                                            <button key={icon} type="button"
                                                onClick={() => setForm({ ...form, icon_name: icon })}
                                                className={`p-2 rounded-lg border transition-all flex items-center justify-center ${form.icon_name === icon ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white border-slate-200 hover:border-blue-300 text-slate-400'}`}
                                            >
                                                {React.createElement(Icons[icon], { size: 20 })}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Real de Control</label>
                                    <input type="date" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={form.sort_date} onChange={e => setForm({ ...form, sort_date: e.target.value })} />
                                    <p className="text-[10px] text-slate-400 mt-2 italic">Importante: Determina si el evento aparece como "Completado" o "Activo".</p>
                                </div>

                                <div className="pt-4 border-t border-slate-200 space-y-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Interactividad (Botón Acción)</label>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3">
                                            <Icons.Type size={16} className="text-slate-400" />
                                            <input type="text" className="w-full py-2 text-sm outline-none"
                                                value={form.cta_text} onChange={e => setForm({ ...form, cta_text: e.target.value })} placeholder="Texto (Inscribirse)" />
                                        </div>
                                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3">
                                            <Icons.LinkIcon size={16} className="text-slate-400" />
                                            <input type="text" className="w-full py-2 text-sm outline-none"
                                                value={form.cta_link} onChange={e => setForm({ ...form, cta_link: e.target.value })} placeholder="Link (/register)" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 flex gap-3 pt-6 border-t border-slate-100">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">Cancelar</Button>
                                <Button type="submit" className="flex-1 flex justify-center items-center gap-2 py-3">
                                    <Save size={18} /> Guardar Hito en Roadmap
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoadmapManager;
