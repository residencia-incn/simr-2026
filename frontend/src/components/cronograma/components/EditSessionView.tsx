
import React, { useState } from 'react';
import { Session, Speaker, SessionStatus } from '../types';
import { SPEAKERS } from '../data/mockData';

interface EditSessionViewProps {
  session: Session;
  onSave: (updatedSession: Session) => void;
  onCancel: () => void;
}

const EditSessionView: React.FC<EditSessionViewProps> = ({ session, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Session>(session);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, status: e.target.value as SessionStatus }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-start pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Editar Actividad</h1>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 ring-1 ring-inset ring-slate-500/10">
              ID: #{formData.id.toUpperCase()}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-sm">Última edición: hoy por Admin</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="bg-white dark:bg-card-dark border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            Cancelar
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            Guardar Cambios
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Info General */}
          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/20 font-bold text-slate-900 dark:text-white">
              <span className="material-symbols-outlined text-primary text-[20px]">edit_note</span>
              Información General
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div>
                <label className="block text-sm font-semibold leading-6 text-slate-900 dark:text-white mb-2">Título del Evento</label>
                <input 
                  className="block w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 dark:bg-slate-800/50 dark:ring-slate-700 dark:text-white" 
                  name="title" 
                  type="text" 
                  value={formData.title} 
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold leading-6 text-slate-900 dark:text-white mb-2">Descripción</label>
                <div className="rounded-lg ring-1 ring-inset ring-slate-300 dark:ring-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800/50">
                  <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <button className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
                    <button className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition"><span className="material-symbols-outlined text-[18px]">format_italic</span></button>
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                    <button className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition"><span className="material-symbols-outlined text-[18px]">link</span></button>
                  </div>
                  <textarea 
                    className="block w-full border-0 bg-transparent py-3 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6 dark:text-white" 
                    name="description" 
                    rows={6} 
                    value={formData.description || ''} 
                    onChange={handleChange}
                    placeholder="Escribe una descripción detallada..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ponentes */}
          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 font-bold text-slate-900 dark:text-white">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
                Ponentes Asignados
              </span>
              <button className="text-xs font-medium text-primary hover:text-blue-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">add</span>
                Nuevo Ponente
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">person_search</span>
                </span>
                <input className="block w-full rounded-lg border-0 py-2 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 dark:bg-slate-800/50 dark:ring-slate-700 dark:text-white" placeholder="Buscar ponente..." type="text"/>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Seleccionados</label>
                {formData.speakers.map(speaker => (
                  <div key={speaker.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className="bg-center bg-no-repeat bg-cover rounded-full size-10" style={{ backgroundImage: `url("${speaker.imageUrl}")` }}></div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{speaker.name}</h4>
                        <p className="text-xs text-slate-500">{speaker.role}</p>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Config */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold leading-6 text-slate-900 dark:text-white mb-2">Estado de Publicación</label>
              <select 
                className="block w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 dark:bg-slate-800/50 dark:ring-slate-700 dark:text-white"
                value={formData.status}
                onChange={handleStatusChange}
              >
                <option value="Publicado">Publicado</option>
                <option value="Borrador">Borrador</option>
                <option value="Programado">Programado</option>
                <option value="Archivado">Archivado</option>
              </select>
            </div>
            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg border ${
              formData.status === 'Publicado' 
                ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30'
                : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30'
            }`}>
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              <span>{formData.status === 'Publicado' ? 'Visible para todos los usuarios' : 'Solo visible para administradores'}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide">Horario</div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Inicio</label>
                <input 
                  className="block w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm dark:bg-slate-800/50 dark:ring-slate-700 dark:text-white" 
                  name="timeStart" 
                  type="time" 
                  value={formData.timeStart} 
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fin</label>
                <input 
                  className="block w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm dark:bg-slate-800/50 dark:ring-slate-700 dark:text-white" 
                  name="timeEnd" 
                  type="time" 
                  value={formData.timeEnd} 
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide">Clasificación</div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Trabajo</label>
                <select 
                  className="block w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm dark:bg-slate-800/50 dark:ring-slate-700 dark:text-white"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option>Conferencia Magistral</option>
                  <option>Trabajo Original</option>
                  <option>Reporte de Caso</option>
                  <option>Mesa Redonda</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sala / Plataforma</label>
                <input 
                  className="block w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm dark:bg-slate-800/50 dark:ring-slate-700 dark:text-white" 
                  name="location" 
                  type="text" 
                  value={formData.location || ''} 
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSessionView;
