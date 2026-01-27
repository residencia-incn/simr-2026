import React from 'react';
import { Ticket, Video, Users, CheckCircle } from 'lucide-react';

const Step2Modalities = ({
    selectedModality,
    setSelectedModality,
    selectedWorkshops,
    setSelectedWorkshops,
    allModalities, // Recibido desde el padre (RegistrationWizard)
    allWorkshops   // Recibido desde el padre
}) => {

    // --- LÓGICA DE SELECCIÓN ---

    // Seleccionar Modalidad (Excluyente)
    const handleModalitySelect = (modality) => {
        setSelectedModality(modality);
    };

    // Toggle Taller (Aditivo)
    const toggleWorkshop = (workshop) => {
        // Verificamos si ya está seleccionado por ID
        const exists = selectedWorkshops.find(w => w.id === workshop.id);

        if (exists) {
            // Si existe, lo sacamos (Filter)
            setSelectedWorkshops(prev => prev.filter(w => w.id !== workshop.id));
        } else {
            // Si no existe, lo agregamos
            setSelectedWorkshops(prev => [...prev, workshop]);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">

            {/* SECCIÓN A: MODALIDAD (OBLIGATORIO) */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Ticket className="text-blue-600" />
                    1. Selecciona tu Modalidad de Acceso *
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allModalities.map((mod) => {
                        const isSelected = selectedModality?.id === mod.id;
                        return (
                            <div
                                key={mod.id}
                                onClick={() => handleModalitySelect(mod)}
                                className={`
                  relative border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md
                  ${isSelected
                                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                        : 'border-slate-200 bg-white hover:border-blue-300'}
                `}
                            >
                                {/* Check icon si está seleccionado */}
                                {isSelected && (
                                    <div className="absolute top-3 right-3 text-blue-600">
                                        <CheckCircle size={24} fill="currentColor" className="text-white" />
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <div className={`p-3 rounded-lg ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {mod.title.toLowerCase().includes('virtual') ? <Video size={24} /> : <Users size={24} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{mod.title}</h4>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{mod.description}</p>
                                        <div className="mt-3 font-bold text-lg text-blue-700">
                                            {mod.price === 0 ? 'GRATIS' : `S/ ${mod.price.toFixed(2)}`}
                                        </div>
                                        {mod.includes_certificate && (
                                            <span className="inline-block mt-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                                Incluye Certificado
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="border-t border-slate-200"></div>

            {/* SECCIÓN B: TALLERES (OPCIONAL) */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Users className="text-amber-600" />
                    2. Talleres Pre-Congreso (Opcional)
                </h3>

                {allWorkshops.length === 0 ? (
                    <div className="p-4 bg-slate-50 text-slate-500 rounded-lg text-sm italic text-center">
                        No hay talleres disponibles por el momento.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {allWorkshops.map((ws) => {
                            const isSelected = selectedWorkshops.some(w => w.id === ws.id);
                            return (
                                <label
                                    key={ws.id}
                                    className={`
                    flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all
                    ${isSelected
                                            ? 'border-amber-500 bg-amber-50/50'
                                            : 'border-slate-200 hover:bg-slate-50'}
                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleWorkshop(ws)}
                                            className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 border-gray-300"
                                        />
                                        <div>
                                            <div className="font-bold text-slate-800">{ws.title || ws.name}</div>
                                            <div className="text-xs text-slate-500">{ws.description || 'Cupos limitados'}</div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-amber-700">
                                        S/ {(ws.price || 0).toFixed(2)}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
};

export default Step2Modalities;
