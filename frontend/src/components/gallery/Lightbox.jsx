import React, { useEffect } from 'react';


// Helper to disable scrolling when modal is open
const useLockBodyScroll = (isOpen) => {
    useEffect(() => {
        if (!isOpen) return;
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [isOpen]);
};

export default function Lightbox({
    isOpen,
    onClose,
    items = [],
    currentIndex = 0,
    onNext,
    onPrev,
    onSelect
}) {
    useLockBodyScroll(isOpen);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') onNext();
            if (e.key === 'ArrowLeft') onPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onNext, onPrev]);

    if (!isOpen || !items[currentIndex]) return null;

    const currentItem = items[currentIndex];

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#0b0e17]/90 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Close Button */}
            <button
                aria-label="Close Gallery"
                onClick={onClose}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors group"
            >
                <span className="material-symbols-outlined text-[28px] opacity-70 group-hover:opacity-100 transition-opacity">
                    close
                </span>
            </button>

            <div className="relative w-full max-w-7xl h-full flex flex-col justify-center gap-6 pointer-events-none">
                {/* Main Image Container */}
                <div className="relative w-full flex-1 min-h-0 bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group select-none pointer-events-auto">

                    {/* Main Image */}
                    <div
                        className="absolute inset-0 w-full h-full bg-contain bg-center bg-no-repeat transition-transform duration-700"
                        style={{ backgroundImage: `url("${currentItem.url}")` }}
                    >
                        {/* Blurred Background for Fill */}
                        <div
                            className="absolute inset-0 -z-10 bg-cover bg-center blur-3xl opacity-40"
                            style={{ backgroundImage: `url("${currentItem.url}")` }}
                        />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                    {/* Top Actions */}
                    <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
                        <button className="flex items-center gap-2 bg-black/40 hover:bg-blue-600/90 backdrop-blur-md text-white px-4 py-2 rounded-lg transition-all border border-white/10 shadow-lg">
                            <span className="material-symbols-outlined text-[20px]">share</span>
                            <span className="hidden sm:inline text-sm font-medium">Share</span>
                        </button>
                        <button
                            aria-label="Fullscreen"
                            onClick={() => {
                                const elem = document.documentElement;
                                if (!document.fullscreenElement) {
                                    elem.requestFullscreen().catch(err => {
                                        console.error(`Error attempting to enable fullscreen: ${err.message}`);
                                    });
                                } else {
                                    document.exitFullscreen();
                                }
                            }}
                            className="flex items-center justify-center size-10 bg-black/40 hover:bg-blue-600/90 backdrop-blur-md text-white rounded-lg transition-all border border-white/10 shadow-lg"
                        >
                            <span className="material-symbols-outlined text-[24px]">fullscreen</span>
                        </button>
                    </div>

                    {/* Navigation Buttons */}
                    <button
                        aria-label="Previous image"
                        onClick={onPrev}
                        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 size-14 flex items-center justify-center rounded-full bg-white/10 hover:bg-blue-600 backdrop-blur-md text-white border border-white/10 transition-all shadow-lg hover:scale-110 group/nav"
                    >
                        <span className="material-symbols-outlined text-[32px] opacity-80 group-hover/nav:opacity-100">
                            chevron_left
                        </span>
                    </button>
                    <button
                        aria-label="Next image"
                        onClick={onNext}
                        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 size-14 flex items-center justify-center rounded-full bg-white/10 hover:bg-blue-600 backdrop-blur-md text-white border border-white/10 transition-all shadow-lg hover:scale-110 group/nav"
                    >
                        <span className="material-symbols-outlined text-[32px] opacity-80 group-hover/nav:opacity-100">
                            chevron_right
                        </span>
                    </button>

                    {/* Content Info */}
                    <div className="absolute bottom-0 left-0 w-full p-6 lg:p-10 z-10 pointer-events-none">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-[95%] mx-auto">
                            <div className="flex flex-col gap-3 max-w-3xl pointer-events-auto">
                                <div className="flex items-center gap-3 animate-fade-in">
                                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded shadow-sm backdrop-blur-sm tracking-wide uppercase">
                                        {currentItem.category || 'Galería'}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-white/90 text-sm font-medium">
                                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                        {currentItem.year || '2024'}
                                    </span>
                                </div>
                                <h1 className="text-white text-2xl lg:text-4xl font-bold leading-tight drop-shadow-md">
                                    {currentItem.title || 'Sin Título'}
                                </h1>
                                <p className="text-white/80 text-base lg:text-lg font-normal leading-relaxed max-w-[700px] line-clamp-2 md:line-clamp-none drop-shadow-sm">
                                    {currentItem.description}
                                </p>
                            </div>

                            <div className="hidden md:flex shrink-0 pointer-events-auto">
                                <a
                                    href={currentItem.url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 px-5 py-2.5 rounded-lg transition-colors border border-transparent hover:border-white/10"
                                >
                                    <span className="material-symbols-outlined">download</span>
                                    <span className="text-sm font-medium">Download High-Res</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Thumbnail Strip */}
                <div className="h-auto shrink-0 w-full overflow-hidden pointer-events-auto">
                    <div className="flex justify-center w-full">
                        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-4 snap-x scrollbar-hide max-w-full mask-linear-fade">
                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    onClick={() => onSelect(index)}
                                    className={`
                    relative min-w-[100px] sm:min-w-[140px] h-[60px] sm:h-[80px] rounded-lg cursor-pointer transition-all
                    ${index === currentIndex
                                            ? 'ring-2 ring-blue-600 ring-offset-2 ring-offset-[#0b0e17]'
                                            : 'opacity-50 hover:opacity-100'
                                        }
                  `}
                                >
                                    <div
                                        className="w-full h-full rounded-md bg-cover bg-center"
                                        style={{ backgroundImage: `url("${item.url}")` }}
                                    />
                                    {index === currentIndex && (
                                        <div className="absolute inset-0 bg-blue-600/20 rounded-md" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
