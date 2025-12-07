import React from 'react';
import { QrCode } from 'lucide-react';

const Photocheck = ({ attendee, ref }) => {
    return (
        <div className="w-[350px] h-[500px] bg-white border border-gray-200 relative overflow-hidden flex flex-col items-center text-center font-sans print:border-none print:w-full print:h-full print:absolute print:top-0 print:left-0 print:z-[9999]">
            {/* Header / Lanyard Hole Area */}
            <div className="w-full h-24 bg-blue-900 flex items-center justify-center relative">
                <div className="w-full h-full absolute top-0 left-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="z-10 text-white font-bold text-2xl tracking-widest">SIMR 2026</div>
            </div>

            {/* Role Banner */}
            <div className={`w-full py-4 text-white font-black text-3xl uppercase tracking-wider shadow-md
                ${attendee.role === 'Comité Organizador' ? 'bg-purple-700' :
                    attendee.role === 'Ponente' ? 'bg-amber-500' :
                        attendee.role === 'Jurado' ? 'bg-red-600' :
                            attendee.role === 'Especialista' ? 'bg-blue-600' :
                                'bg-green-600'}`}>
                {attendee.role}
            </div>

            {/* Content */}
            <div className="flex-grow flex flex-col items-center justify-center p-6 w-full">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{attendee.name}</h2>
                <p className="text-xl text-gray-600 font-medium mb-1">{attendee.specialty}</p>
                <p className="text-sm text-gray-400 mb-8">{attendee.institution}</p>

                {/* QR Code Placeholder */}
                <div className="bg-white p-2 rounded-xl border-2 border-gray-100 shadow-sm mb-4">
                    <QrCode size={120} className="text-gray-800" />
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-widest">Escanear para asistencia</p>
            </div>

            {/* Footer */}
            <div className="w-full py-3 bg-gray-100 border-t border-gray-200 text-xs text-gray-500 font-medium">
                Lima, Perú • Octubre 2026
            </div>
        </div>
    );
};

export default Photocheck;
