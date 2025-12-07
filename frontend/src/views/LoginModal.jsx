import React from 'react';
import { X, Users, User, Award, BarChart2, DollarSign, BookOpen } from 'lucide-react';

const LoginModal = ({ setCurrentView, handleLogin }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative animate-fadeInUp">
            <button onClick={() => setCurrentView('home')} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
            <div className="text-center mb-8"><h2 className="text-2xl font-bold text-gray-900">Bienvenido a SIMR 2026</h2><p className="text-gray-600 mt-2">Selecciona tu perfil para ingresar a la demo</p></div>
            <div className="space-y-3">
                <button onClick={() => handleLogin('participant')} className="w-full p-4 border border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 flex items-center gap-4 transition-all group"><div className="bg-emerald-100 p-3 rounded-full text-emerald-700 group-hover:bg-emerald-200"><Users size={24} /></div><div className="text-left"><div className="font-bold text-gray-900">Soy Asistente</div><div className="text-xs text-gray-600">Ver ponencias, programa y certificados</div></div></button>
                <button onClick={() => handleLogin('resident')} className="w-full p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 flex items-center gap-4 transition-all group"><div className="bg-blue-100 p-3 rounded-full text-blue-700 group-hover:bg-blue-200"><User size={24} /></div><div className="text-left"><div className="font-bold text-gray-900">Soy Residente</div><div className="text-xs text-gray-600">Enviar trabajos, inscribirme</div></div></button>
                <button onClick={() => handleLogin('jury')} className="w-full p-4 border border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 flex items-center gap-4 transition-all group"><div className="bg-purple-100 p-3 rounded-full text-purple-700 group-hover:bg-purple-200"><Award size={24} /></div><div className="text-left"><div className="font-bold text-gray-900">Soy Jurado</div><div className="text-xs text-gray-600">Evaluar trabajos asignados</div></div></button>
                <button onClick={() => handleLogin('academic')} className="w-full p-4 border border-gray-200 rounded-xl hover:border-blue-600 hover:bg-blue-50 flex items-center gap-4 transition-all group"><div className="bg-blue-100 p-3 rounded-full text-blue-700 group-hover:bg-blue-200"><BookOpen size={24} /></div><div className="text-left"><div className="font-bold text-gray-900">Soy Académico</div><div className="text-xs text-gray-600">Gestión de trabajos y jurados</div></div></button>
                <button onClick={() => handleLogin('admin')} className="w-full p-4 border border-gray-200 rounded-xl hover:border-gray-500 hover:bg-gray-50 flex items-center gap-4 transition-all group"><div className="bg-gray-100 p-3 rounded-full text-gray-700 group-hover:bg-gray-200"><BarChart2 size={24} /></div><div className="text-left"><div className="font-bold text-gray-900">Comité Organizador</div><div className="text-xs text-gray-600">Gestión y métricas</div></div></button>
                <button onClick={() => handleLogin('treasurer')} className="w-full p-4 border border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 flex items-center gap-4 transition-all group"><div className="bg-emerald-100 p-3 rounded-full text-emerald-700 group-hover:bg-emerald-200"><DollarSign size={24} /></div><div className="text-left"><div className="font-bold text-gray-900">Soy Tesorero</div><div className="text-xs text-gray-600">Caja y contabilidad</div></div></button>
                <button onClick={() => handleLogin('admission')} className="w-full p-4 border border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 flex items-center gap-4 transition-all group"><div className="bg-teal-100 p-3 rounded-full text-teal-700 group-hover:bg-teal-200"><Users size={24} /></div><div className="text-left"><div className="font-bold text-gray-900">Soy Admisión</div><div className="text-xs text-gray-600">Impresión de fotochecks</div></div></button>
            </div>
        </div>
    </div>
);

export default LoginModal;
