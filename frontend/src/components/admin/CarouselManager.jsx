import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, Image as ImageIcon, Layout, Link as LinkIcon, ExternalLink, List, Upload } from 'lucide-react';
import { api } from '../../services/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';

const AVAILABLE_ROUTES = [
    { label: 'Inicio', value: 'home' },
    { label: 'Programa Académico', value: 'program' },
    { label: 'Registro / Inscripción', value: 'registration' },
    { label: 'Envío de Trabajos', value: 'submit-work' },
    { label: 'Bases del Concurso', value: 'bases' },
    { label: 'Panel de Residente', value: 'resident-dashboard' },
    { label: 'Login', value: 'login' },
    { label: 'Talleres', value: 'workshops' }
];

const INITIAL_SLIDES = [
    {
        id: 'main',
        tag: '22 - 24 Octubre 2026',
        title: 'SIMR 2026',
        subtitle: '31ª Semana de Investigación del Médico Residente',
        description: 'Instituto Nacional de Ciencias Neurológicas (INCN)',
        gradient: 'from-blue-900 via-indigo-900 to-blue-800',
        content: 'specialties',
        buttons: [
            { label: 'Enviar Trabajo', action: 'resident-dashboard', variant: 'secondary' },
            { label: 'Ver Programa', action: 'program', variant: 'outline' }
        ]
    },
    {
        id: 'contest',
        tag: 'Concurso 2026',
        title: 'Concurso de Investigación',
        subtitle: '',
        description: 'Presenta tu caso clínico o trabajo de investigación y compite por el reconocimiento a la excelencia académica.',
        gradient: 'from-purple-900 via-indigo-900 to-blue-900',
        content: 'icon-research',
        buttons: [
            { label: 'Ver Bases', action: 'bases', variant: 'secondary' },
            { label: 'Enviar Abstract', action: 'submit-work', variant: 'outline' }
        ]
    },
    {
        id: 'workshops',
        tag: 'Talleres Pre-Congreso',
        title: 'Talleres Especializados',
        subtitle: '',
        description: 'Potencia tus habilidades con nuestros talleres prácticos de Neurofisiología, Neurociencias y Redacción Científica.',
        gradient: 'from-teal-900 via-emerald-900 to-blue-900',
        content: 'icon-workshop',
        buttons: [
            { label: 'Ver Talleres', action: 'program', variant: 'secondary' },
            { label: 'Inscribirme', action: 'registration', variant: 'outline' }
        ]
    }
];

const CarouselManager = () => {
    const [slides, setSlides] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(null);
    const [loading, setLoading] = useState(true);

    // Route selector state
    const [showRouteSelector, setShowRouteSelector] = useState(false);
    const [activeButtonIndex, setActiveButtonIndex] = useState(null);

    // Load slides from API on mount
    useEffect(() => {
        const loadSlides = async () => {
            const savedSlides = await api.content.getHeroSlides();
            if (savedSlides && savedSlides.length > 0) {
                setSlides(savedSlides);
            } else {
                setSlides(INITIAL_SLIDES);
                // Optionally save initial slides only if we want to persist them immediately
                // but let's just use them as default state for now.
            }
            setLoading(false);
        };
        loadSlides();
    }, []);

    const saveSlides = async (newSlides) => {
        setSlides(newSlides);
        await api.content.saveHeroSlides(newSlides);
    };

    const handleEdit = (slide) => {
        // Ensure buttons array exists
        const updatedSlide = {
            ...slide,
            buttons: slide.buttons || [
                { label: 'Ver Detalles', action: 'program', variant: 'secondary' },
                { label: 'Inscribirse', action: 'registration', variant: 'outline' }
            ]
        };
        setCurrentSlide(updatedSlide);
        setIsEditing(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta diapositiva?')) {
            const newSlides = slides.filter(s => s.id !== id);
            saveSlides(newSlides);
        }
    };

    const handleSaveSlide = () => {
        if (!currentSlide.id) {
            currentSlide.id = Date.now().toString();
            saveSlides([...slides, currentSlide]);
        } else {
            const newSlides = slides.map(s => s.id === currentSlide.id ? currentSlide : s);
            saveSlides(newSlides);
        }
        setIsEditing(false);
        setCurrentSlide(null);
    };

    const handleAddNew = () => {
        setCurrentSlide({
            id: '',
            tag: 'Nuevo Anuncio',
            title: 'Título Principal',
            subtitle: '',
            description: 'Descripción breve del anuncio',
            gradient: 'from-blue-900 via-blue-800 to-indigo-900',
            content: 'none',
            buttons: [
                { label: 'Botón 1', action: 'home', variant: 'secondary' },
                { label: 'Botón 2', action: 'home', variant: 'outline' }
            ]
        });
        setIsEditing(true);
    };

    const updateButton = (index, field, value) => {
        const newButtons = [...currentSlide.buttons];
        newButtons[index] = { ...newButtons[index], [field]: value };
        setCurrentSlide({ ...currentSlide, buttons: newButtons });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCurrentSlide({ ...currentSlide, bottomImage: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setCurrentSlide({ ...currentSlide, bottomImage: null });
    };

    const openRouteSelector = (index) => {
        setActiveButtonIndex(index);
        setShowRouteSelector(true);
    };

    const selectRoute = (routeValue) => {
        if (activeButtonIndex !== null) {
            updateButton(activeButtonIndex, 'action', routeValue);
            setShowRouteSelector(false);
            setActiveButtonIndex(null);
        }
    };

    return (
        <>
            <Card className="p-6">
                <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-6 border-b pb-2">
                    <Layout size={20} className="text-gray-500" />
                    Carrusel Interactivo
                </h4>

                {!isEditing ? (
                    <div className="space-y-4">
                        {slides.map((slide, index) => (
                            <div key={slide.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded w-6 text-center">{index + 1}</span>
                                    <div className={`w-10 h-10 rounded bg-gradient-to-br ${slide.gradient} shrink-0`}></div>
                                    <div>
                                        <h5 className="font-bold text-gray-900 text-sm">{slide.title}</h5>
                                        <p className="text-xs text-gray-500">{slide.tag}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(slide)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(slide.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <Button onClick={handleAddNew} variant="outline" className="w-full border-dashed border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 text-gray-500 py-4">
                            <Plus size={18} className="mr-2" /> Agregar Nueva Diapositiva
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h5 className="font-bold text-gray-800">Editar Diapositiva</h5>
                            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-red-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Etiqueta Superior</label>
                                <input
                                    type="text"
                                    value={currentSlide?.tag || ''}
                                    onChange={(e) => setCurrentSlide({ ...currentSlide, tag: e.target.value })}
                                    className="w-full p-2 border rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Título Principal</label>
                                <input
                                    type="text"
                                    value={currentSlide?.title || ''}
                                    onChange={(e) => setCurrentSlide({ ...currentSlide, title: e.target.value })}
                                    className="w-full p-2 border rounded text-sm font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Descripción</label>
                                <textarea
                                    value={currentSlide?.description || ''}
                                    onChange={(e) => setCurrentSlide({ ...currentSlide, description: e.target.value })}
                                    className="w-full p-2 border rounded text-sm h-20"
                                />
                            </div>

                            {/* Button Editing Section */}
                            <div className="border-t border-b border-gray-100 py-3 my-2 bg-gray-50/50 rounded-lg px-2">
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Botones de Acción</label>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Botón Principal (Relleno)</label>
                                        <input
                                            type="text"
                                            placeholder="Texto del botón"
                                            value={currentSlide?.buttons?.[0]?.label || ''}
                                            onChange={(e) => updateButton(0, 'label', e.target.value)}
                                            className="w-full p-2 border rounded text-sm mb-1"
                                        />
                                        <div className="relative flex items-center gap-1">
                                            <LinkIcon size={12} className="absolute left-2 top-2.5 text-gray-400 z-10" />
                                            <input
                                                type="text"
                                                placeholder="Ruta (ej: registration)"
                                                value={currentSlide?.buttons?.[0]?.action || ''}
                                                onChange={(e) => updateButton(0, 'action', e.target.value)}
                                                className="w-full p-2 pl-6 border rounded text-sm font-mono text-xs text-blue-600"
                                            />
                                            <button
                                                onClick={() => openRouteSelector(0)}
                                                className="p-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-500"
                                                title="Seleccionar ruta"
                                            >
                                                <List size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Botón Secundario (Borde)</label>
                                        <input
                                            type="text"
                                            placeholder="Texto del botón"
                                            value={currentSlide?.buttons?.[1]?.label || ''}
                                            onChange={(e) => updateButton(1, 'label', e.target.value)}
                                            className="w-full p-2 border rounded text-sm mb-1"
                                        />
                                        <div className="relative flex items-center gap-1">
                                            <LinkIcon size={12} className="absolute left-2 top-2.5 text-gray-400 z-10" />
                                            <input
                                                type="text"
                                                placeholder="Ruta (ej: program)"
                                                value={currentSlide?.buttons?.[1]?.action || ''}
                                                onChange={(e) => updateButton(1, 'action', e.target.value)}
                                                className="w-full p-2 pl-6 border rounded text-sm font-mono text-xs text-blue-600"
                                            />
                                            <button
                                                onClick={() => openRouteSelector(1)}
                                                className="p-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-500"
                                                title="Seleccionar ruta"
                                            >
                                                <List size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Gradiente de Fondo (Tailwind Classes)</label>
                                <select
                                    value={currentSlide?.gradient || 'from-blue-900 via-indigo-900 to-blue-800'}
                                    onChange={(e) => setCurrentSlide({ ...currentSlide, gradient: e.target.value })}
                                    className="w-full p-2 border rounded text-sm"
                                >
                                    <option value="from-blue-900 via-indigo-900 to-blue-800">Azul Institucional</option>
                                    <option value="from-purple-900 via-indigo-900 to-blue-900">Violeta Investigación</option>
                                    <option value="from-teal-900 via-emerald-900 to-blue-900">Turquesa Talleres</option>
                                    <option value="from-red-900 via-orange-900 to-red-900">Rojo Evento</option>
                                    <option value="from-gray-900 via-gray-800 to-black">Oscuro Neutro</option>
                                </select>
                            </div>

                            {/* Image Upload Section */}
                            <div className="border-t border-gray-100 pt-3 mt-2">
                                <label className="block text-xs font-bold text-gray-500 mb-2">Imagen Inferior Derecha (PNG/SVG)</label>
                                <div className="flex items-start gap-4">
                                    {currentSlide?.bottomImage ? (
                                        <div className="relative group w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                                            <img src={currentSlide.bottomImage} alt="Preview" className="max-w-full max-h-full object-contain" />
                                            <button
                                                onClick={removeImage}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 bg-gray-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300 text-gray-400">
                                            <ImageIcon size={24} className="mb-1" />
                                            <span className="text-[10px]">Sin imagen</span>
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                                            <Upload size={16} />
                                            <span>Subir Imagen</span>
                                            <input
                                                type="file"
                                                accept="image/png, image/svg+xml"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Recomendado: Imágenes con fondo transparente (PNG o SVG). Se mostrará en la esquina inferior derecha del banner.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleSaveSlide} className="w-full mt-2">
                                <Save size={16} className="mr-2" /> Guardar Cambios
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={showRouteSelector}
                onClose={() => setShowRouteSelector(false)}
                title="Seleccionar Destino"
                size="md"
            >
                <div className="grid grid-cols-1 gap-2">
                    {AVAILABLE_ROUTES.map((route) => (
                        <button
                            key={route.value}
                            onClick={() => selectRoute(route.value)}
                            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all text-left group"
                        >
                            <span className="font-medium text-gray-700 group-hover:text-blue-700">{route.label}</span>
                            <span className="text-xs font-mono text-gray-400 group-hover:text-blue-500 bg-gray-50 group-hover:bg-blue-100 px-2 py-0.5 rounded">
                                {route.value}
                            </span>
                        </button>
                    ))}
                </div>
            </Modal>
        </>
    );

};

export default CarouselManager;
