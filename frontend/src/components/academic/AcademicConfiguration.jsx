import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCcw, Info } from 'lucide-react';
import { api } from '../../services/api';
import { Button, Card, LoadingSpinner } from '../ui';
import { showSuccess, showError } from '../../utils/alerts';

const AcademicConfiguration = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await api.academic.getSettings();
            setSettings(data);
        } catch (error) {
            console.error("Error fetching settings:", error);
            showError("No se pudieron cargar los ajustes académicos.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSetting = async (key, newValue) => {
        setIsSaving(true);
        try {
            await api.academic.updateSetting(key, newValue);
            // Local update
            setSettings(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));
            showSuccess("Ajuste actualizado correctamente");
        } catch (error) {
            console.error(`Error updating setting ${key}:`, error);
            showError("Error al guardar el ajuste.");
        } finally {
            setIsSaving(false);
        }
    };

    const getSettingValue = (key, defaultValue = "") => {
        const setting = settings.find(s => s.key === key);
        return setting ? setting.value : defaultValue;
    };

    if (loading) return <LoadingSpinner text="Cargando configuración..." className="py-20" />;

    return (
        <div className="space-y-6 animate-fadeIn p-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Settings size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Configuración Académica</h2>
                    <p className="text-sm text-gray-500">Configure los parámetros generales para la gestión de trabajos y jurados.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Jurados por Trabajo */}
                <Card className="p-6 border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            Límite de Jurados
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Cantidad de evaluadores que deben ser asignados a cada trabajo de investigación aceptado.
                        </p>

                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                min="1"
                                max="10"
                                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={getSettingValue("jurados_por_trabajo", "3")}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSettings(prev => prev.map(s => s.key === "jurados_por_trabajo" ? { ...s, value: val } : s));
                                }}
                            />
                            <Button
                                size="sm"
                                disabled={isSaving}
                                onClick={() => handleUpdateSetting("jurados_por_trabajo", getSettingValue("jurados_por_trabajo"))}
                            >
                                <Save size={16} className="mr-2" />
                                {isSaving ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>

                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex gap-3">
                            <Info size={18} className="text-blue-500 shrink-0" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Este valor limita cuántos jurados se pueden asignar en la pestaña de "Aceptados". Si se reduce el valor, los trabajos que ya tienen más jurados no se verán afectados retroactivamente, pero no se podrán añadir nuevos.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Futuras Configuraciones */}
                <Card className="p-6 bg-gray-50 border-dashed border-2 border-gray-200 flex flex-col items-center justify-center text-center opacity-70">
                    <RefreshCcw size={32} className="text-gray-400 mb-2" />
                    <h3 className="font-bold text-gray-400">Más ajustes próximamente</h3>
                    <p className="text-xs text-gray-400 max-w-[200px] mt-1">
                        Estamos trabajando para añadir más opciones de personalización para el comité.
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default AcademicConfiguration;
