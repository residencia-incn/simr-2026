import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Filter, Upload, Maximize2, ImageIcon, X, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import Button from '../components/ui/Button';
import SectionHeader from '../components/ui/SectionHeader';
import { api } from '../services/api';

const GalleryView = () => {
    const [selectedYear, setSelectedYear] = useState(2026);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [galleryItems, setGalleryItems] = useState([]);

    useEffect(() => {
        const loadGallery = async () => {
            try {
                const data = await api.content.getGallery();
                setGalleryItems(data);
            } catch (err) {
                console.error("Failed to load gallery", err);
            }
        };
        loadGallery();
    }, []);

    const filteredItems = galleryItems.filter(item => item.year === selectedYear);
    const availableYears = [...new Set(galleryItems.map(item => item.year))].sort((a, b) => b - a);

    // Get unique categories for the selected year
    const categories = [...new Set(filteredItems.map(item => item.category))];

    // Get one cover image for each category
    const albumCovers = categories.map(category => {
        const coverItem = filteredItems.find(item => item.category === category);
        return { category, ...coverItem };
    });

    // Filter items by category if one is selected
    const displayItems = selectedCategory
        ? filteredItems.filter(item => item.category === selectedCategory)
        : [];

    // Ensure 2026 is always available in the list even if no photos yet
    if (!availableYears.includes(2026)) availableYears.unshift(2026);

    const openLightbox = (index) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);
    const nextImage = (e) => { e?.stopPropagation(); setLightboxIndex((prev) => (prev + 1) % displayItems.length); };
    const prevImage = (e) => { e?.stopPropagation(); setLightboxIndex((prev) => (prev - 1 + displayItems.length) % displayItems.length); };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (lightboxIndex === null) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };

        if (lightboxIndex !== null) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [lightboxIndex]);

    const handleShare = async (e) => {
        e?.stopPropagation();
        const item = displayItems[lightboxIndex];
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    text: item.description || `Mira esta foto del SIMR 2026: ${item.title}`,
                    url: window.location.href
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('¡Enlace copiado al portapapeles!');
        }
    };

    return (
        <div className="animate-fadeIn space-y-8">
            <SectionHeader title="Galería Multimedia" subtitle="Revive los mejores momentos de la Semana de Investigación." />

            <div className="flex flex-col items-center gap-4 mb-8">
                <div className="flex flex-wrap justify-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    {availableYears.map(year => (
                        <button
                            key={year}
                            onClick={() => { setSelectedYear(year); setSelectedCategory(null); setLightboxIndex(null); }}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${selectedYear === year
                                ? 'bg-blue-700 text-white shadow-md transform scale-105'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                                }`}
                        >
                            {year === 2026 ? 'Edición 2026 (Actual)' : `Edición ${year}`}
                        </button>
                    ))}
                </div>
            </div>

            {!selectedCategory ? (
                // Album Grid View
                filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {albumCovers.map((album) => (
                            <div
                                key={album.category}
                                onClick={() => setSelectedCategory(album.category)}
                                className="group cursor-pointer bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                            >
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    <img
                                        src={album.url}
                                        alt={album.category}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                                    <div className="absolute bottom-0 left-0 right-0 p-6">
                                        <h3 className="text-white text-xl font-bold mb-1">{album.category}</h3>
                                        <p className="text-white/80 text-sm">
                                            {filteredItems.filter(i => i.category === album.category).length} fotos
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <ImageIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-gray-900 font-bold text-lg mb-2">Aún no hay fotos de la Edición {selectedYear}</h3>
                        <p className="text-gray-500">Pronto se cargarán las imágenes de este evento.</p>
                    </div>
                )
            ) : (
                // Photo Grid View (Inside Album)
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => setSelectedCategory(null)} className="flex items-center gap-2">
                            <ChevronLeft size={16} /> Volver a Álbumes
                        </Button>
                        <h3 className="text-2xl font-bold text-gray-900">{selectedCategory}</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {displayItems.map((item, index) => (
                            <div key={item.id} onClick={() => openLightbox(index)} className="group relative overflow-hidden rounded-xl bg-gray-100 shadow-sm aspect-square cursor-pointer">
                                <img src={item.url} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <div className="absolute top-2 right-2 p-1 bg-white/20 rounded-full backdrop-blur-sm">
                                        <Maximize2 size={16} className="text-white" />
                                    </div>
                                    <span className="text-white font-bold text-sm mb-1">{item.title}</span>
                                    <div className="flex justify-between items-center text-xs text-white/80">
                                        <span>{item.year}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {lightboxIndex !== null && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col animate-fadeIn">
                    {/* Main Content Area */}
                    <div className="flex-1 flex overflow-hidden relative">
                        {/* Left: Image Area */}
                        <div className="flex-1 relative flex items-center justify-center p-4 md:p-8">
                            <button onClick={closeLightbox} className="absolute top-4 left-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-[110] md:hidden">
                                <X size={24} />
                            </button>

                            {displayItems.length > 1 && (
                                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-[110] hidden md:block">
                                    <ChevronLeft size={40} />
                                </button>
                            )}

                            <div className="relative max-h-full max-w-full">
                                <img
                                    src={displayItems[lightboxIndex]?.url}
                                    alt={displayItems[lightboxIndex]?.title}
                                    className="max-h-[calc(100vh-160px)] max-w-full object-contain rounded-lg shadow-2xl"
                                />
                                {/* Overlays */}
                                <div className="absolute top-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                                    <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-white text-sm border border-white/20 shadow-lg">{displayItems[lightboxIndex]?.year}</span>
                                    <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-white text-sm border border-white/20 shadow-lg">{displayItems[lightboxIndex]?.category}</span>
                                </div>
                                <button
                                    onClick={handleShare}
                                    className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors border border-white/20 shadow-lg z-10"
                                    title="Compartir"
                                >
                                    <Share2 size={20} />
                                </button>
                            </div>

                            {displayItems.length > 1 && (
                                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-[110] hidden md:block">
                                    <ChevronRight size={40} />
                                </button>
                            )}
                        </div>

                        {/* Right: Info Sidebar */}
                        <div className="w-full md:w-96 bg-gray-900/50 backdrop-blur-xl border-l border-white/10 flex flex-col overflow-y-auto absolute md:relative inset-0 md:inset-auto z-[120] md:z-auto translate-y-full md:translate-y-0 transition-transform duration-300 no-scrollbar">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-2xl font-bold text-white leading-tight">{displayItems[lightboxIndex]?.title}</h3>
                                    <button onClick={closeLightbox} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors -mr-2 -mt-2 hidden md:block">
                                        <X size={24} />
                                    </button>
                                </div>

                                {displayItems[lightboxIndex]?.description && (
                                    <div className="prose prose-invert prose-sm">
                                        <p className="text-gray-300 leading-relaxed text-base">{displayItems[lightboxIndex]?.description}</p>
                                    </div>
                                )}


                            </div>
                        </div>
                    </div>

                    {/* Bottom: Thumbnails Strip */}
                    <div className="h-24 bg-black/80 border-t border-white/10 p-4 flex items-center gap-3 overflow-x-auto z-[110] no-scrollbar">
                        {displayItems.map((item, index) => (
                            <button
                                key={item.id}
                                onClick={(e) => { e.stopPropagation(); openLightbox(index); }}
                                className={`relative h-16 aspect-square rounded-lg overflow-hidden transition-all flex-shrink-0 border-2 ${lightboxIndex === index ? 'border-blue-500 scale-105 ring-2 ring-blue-500/50' : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                            >
                                <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div >
    );
};

export default GalleryView;
