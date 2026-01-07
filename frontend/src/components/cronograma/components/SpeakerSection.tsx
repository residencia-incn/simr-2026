
import React from 'react';
import { SPEAKERS } from '../data/mockData';

const SpeakerSection: React.FC = () => {
  return (
    <div className="mt-12">
      <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">groups</span>
        Ponentes Destacados
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {SPEAKERS.slice(0, 4).map(speaker => (
          <div key={speaker.id} className="flex items-center gap-4 p-4 bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div 
              className="bg-center bg-no-repeat bg-cover rounded-full size-14 ring-2 ring-slate-50 dark:ring-slate-800 shrink-0" 
              style={{ backgroundImage: `url("${speaker.imageUrl}")` }}
            ></div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{speaker.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{speaker.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpeakerSection;
