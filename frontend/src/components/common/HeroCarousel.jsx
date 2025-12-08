import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, FileText, Activity, Microscope, Baby, Brain, Shield, Zap, Stethoscope } from 'lucide-react';
import Button from '../../components/ui/Button';
import Countdown from '../../components/ui/Countdown';
import { api } from '../../services/api';
import CreditBadge from './CreditBadge';

const INITIAL_SLIDES = [
    {
        id: 'main',
        tag: '22 - 24 Octubre 2026',
        title: (
            <>
                SIMR <span className="text-blue-300">2026</span>
            </>
        ),
        description: '31ª Semana de Investigación del Médico Residente del Instituto Nacional de Ciencias Neurológicas (INCN)',
        buttons: [
            { label: 'Enviar Trabajo', action: 'resident-dashboard', variant: 'secondary' },
            { label: 'Ver Programa', action: 'program', variant: 'outline' }
        ],
        gradient: 'from-blue-900 via-indigo-900 to-blue-800',
        content: 'credits'
    },
    {
        id: 'contest',
        tag: 'Concurso 2026',
        title: 'Concurso de Investigación',
        description: 'Presenta tu caso clínico o trabajo de investigación y compite por el reconocimiento a la excelencia académica.',
        buttons: [
            { label: 'Ver Bases', action: 'bases', variant: 'secondary' },
            { label: 'Enviar Abstract', action: 'submit-work', variant: 'outline' }
        ],
        gradient: 'from-purple-900 via-indigo-900 to-blue-900',
        content: 'icon-research'
    },
    {
        id: 'workshops',
        tag: 'Talleres Pre-Congreso',
        title: 'Talleres Especializados',
        description: 'Potencia tus habilidades con nuestros talleres prácticos de Neurofisiología, Neurociencias y Redacción Científica.',
        buttons: [
            { label: 'Ver Talleres', action: 'program', variant: 'secondary' },
            { label: 'Inscribirme', action: 'registration', variant: 'outline' }
        ],
        gradient: 'from-teal-900 via-emerald-900 to-blue-900',
        content: 'icon-workshop'
    }
];

const HeroCarousel = ({ navigate, user }) => {
    const [slides, setSlides] = useState(INITIAL_SLIDES);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showCountdown, setShowCountdown] = useState(true);
    const [eventConfig, setEventConfig] = useState(null);
    const [specialties, setSpecialties] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load critical config first
                const config = await api.content.getConfig();
                if (config) {
                    setEventConfig(config);
                    setShowCountdown(config.showHeroCountdown);
                }

                // Load optional data separately to prevent config load failure
                const [savedSlides, specialtiesList] = await Promise.all([
                    api.content.getHeroSlides().catch(() => null),
                    api.content.getSpecialties().catch(() => [])
                ]);

                if (savedSlides && savedSlides.length > 0) {
                    setSlides(savedSlides);
                }
                if (specialtiesList) {
                    setSpecialties(specialtiesList);
                }

            } catch (error) {
                console.error("Failed to load hero carousel data", error);
            }
        };

        loadData();

        // Listen for updates - mostly for admin changes
        const handleUpdate = () => loadData();

        window.addEventListener('hero-slides-updated', handleUpdate);
        window.addEventListener('config-updated', handleUpdate);

        return () => {
            window.removeEventListener('hero-slides-updated', handleUpdate);
            window.removeEventListener('config-updated', handleUpdate);
        };
    }, []);

    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [isPaused, slides.length]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    const handleAction = (action) => {
        if (action === 'resident-dashboard' && !user) {
            navigate('login');
        } else {
            navigate(action || 'home');
        }
    };

    if (!slides || slides.length === 0) return null;

    return (
        <section
            className="relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ease-in-out h-[600px] md:h-[500px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}></div>

                    {/* Abstract Shapes/Background Images */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full mix-blend-overlay filter blur-[100px] opacity-10 animate-blob"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white rounded-full mix-blend-overlay filter blur-[80px] opacity-10 animate-blob animation-delay-2000"></div>

                    {/* Content Container - Split Grid */}
                    <div className="relative z-10 px-16 py-8 md:px-24 md:py-12 h-full flex flex-col lg:flex-row gap-8 items-center">

                        {/* Left Column: Text */}
                        <div className="flex-1 flex flex-col justify-center items-start text-white w-full">
                            <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/20 w-fit">
                                {slide.tag}
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
                                {slide.title}
                            </h1>
                            <p className="text-lg md:text-xl mb-8 text-blue-100 font-light max-w-xl">
                                {slide.description}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                {(slide.buttons || [
                                    { label: 'Ver Detalles', action: 'program', variant: 'secondary' },
                                    { label: 'Inscribirse', action: 'registration', variant: 'outline' }
                                ]).map((btn, idx) => (
                                    <Button
                                        key={idx}
                                        onClick={() => handleAction(btn.action)}
                                        variant={btn.variant}
                                        className={btn.variant === 'secondary' ? 'font-bold border-none text-lg px-8 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all' : 'text-white border-white hover:bg-white/10 text-lg px-8 py-3'}
                                    >
                                        {btn.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Split Top/Bottom */}
                        <div className="flex-1 w-full h-full flex flex-col justify-between items-center lg:pl-12">

                            {/* Top: Countdown (Centered and higher) */}
                            <div className="h-1/3 w-full flex justify-center items-start pt-0 -mt-2 lg:-mt-4">
                                {showCountdown && (
                                    <div className="transform scale-90 md:scale-75 origin-top">
                                        <div className="bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg py-2 px-6">
                                            {/* Fallback date if config not yet loaded */}
                                            {(() => {
                                                const baseDate = eventConfig?.startDate;
                                                const openTime = eventConfig?.schedule?.[0]?.open?.replace(' a.m.', '').replace(' p.m.', '') || '08:00';

                                                // Function to convert 12h to 24h format if needed
                                                const formatTime = (timeStr) => {
                                                    // Simple heuristic for "08:00", "08:00 AM", or "20:00"
                                                    if (timeStr.includes(':')) return timeStr.trim();
                                                    return '08:00';
                                                };

                                                // If date is "2026-10-22" make it "2026-10-22T08:00:00"
                                                // Handle potential 12h formats from the new schedule UI just in case
                                                const target = baseDate
                                                    ? `${baseDate}T${formatTime(openTime)}:00`
                                                    : '2026-10-22T08:00:00';

                                                return <Countdown key={target} targetDate={target} darkMode={true} showLabel={false} />;
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bottom: Dynamic Content (Icons/Grid) */}
                            <div className="h-2/3 w-full flex justify-center items-center pb-8">
                                {slide.content === 'custom-image' && slide.image && (
                                    <div className="hidden md:flex bg-white/5 backdrop-blur-md rounded-full p-8 border border-white/10 shadow-2xl animate-float">
                                        <img
                                            src={slide.image}
                                            alt={slide.title}
                                            className="w-48 h-48 object-contain drop-shadow-glow"
                                        />
                                    </div>
                                )}

                                {slide.content === 'specialties' && (
                                    <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                        {specialties.slice(0, 6).map((spec, idx) => {
                                            let Icon = Brain;
                                            if (spec.includes('Neurovasculares')) Icon = Activity;
                                            if (spec.includes('Neuroinmunología')) Icon = Shield;
                                            if (spec.includes('Epilepsia')) Icon = Zap;
                                            if (spec.includes('Neuroinfectología')) Icon = Microscope;
                                            if (spec.includes('Neuropediatría')) Icon = Baby;
                                            if (spec.includes('Neurocirugía')) Icon = Stethoscope;

                                            return (
                                                <div key={idx} className="flex flex-col items-center text-center gap-2 p-2 rounded-xl bg-blue-900/30 hover:bg-blue-800/50 transition-colors border border-blue-500/20 group cursor-default">
                                                    <Icon size={20} className="text-blue-200 group-hover:text-white transition-colors" />
                                                    <span className="text-xs font-medium text-blue-100 leading-tight">{spec}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {slide.content === 'icon-research' && (
                                    <div className="hidden md:flex bg-white/5 backdrop-blur-md rounded-full p-12 border border-white/10 shadow-2xl animate-float">
                                        <FileText size={120} className="text-blue-200 drop-shadow-glow" />
                                    </div>
                                )}

                                {slide.content === 'icon-workshop' && (
                                    <div className="hidden md:flex bg-white/5 backdrop-blur-md rounded-full p-12 border border-white/10 shadow-2xl animate-float">
                                        <Microscope size={120} className="text-emerald-200 drop-shadow-glow" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Navigation Arrows (Transparent / Visible on Hover) */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/30 hover:text-white hover:bg-black/20 transition-all z-20"
            >
                <ChevronLeft size={32} />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/30 hover:text-white hover:bg-black/20 transition-all z-20"
            >
                <ChevronRight size={32} />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default HeroCarousel;
