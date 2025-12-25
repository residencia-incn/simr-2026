import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Lightbox from '../components/gallery/Lightbox';

const GalleryView = () => {
    const [selectedYear, setSelectedYear] = useState(2026);
    const [selectedFilter, setSelectedFilter] = useState('Todos');
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [galleryItems, setGalleryItems] = useState([]);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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

    const availableYears = [...new Set(galleryItems.map(item => parseInt(item.year || 2024)))].sort((a, b) => b - a);
    if (!availableYears.includes(2024)) availableYears.push(2024);
    if (!availableYears.includes(selectedYear)) availableYears.push(selectedYear);
    availableYears.sort((a, b) => b - a);

    const filteredItems = galleryItems.filter(item => {
        const yearMatch = parseInt(item.year) === parseInt(selectedYear);
        const filterMatch = selectedFilter === 'Todos' ||
            (selectedFilter === 'Videos' && item.type === 'video') ||
            item.category === selectedFilter;
        return yearMatch && filterMatch;
    });

    const displayItems = filteredItems.length > 0 ? filteredItems : [
        { id: 'hero', title: 'Memorias del Congreso', description: 'Una colección inmersiva de los momentos que definieron el avance neurológico de este año.', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADPK2mVjGFZY6xGF_CEyKjk-gN77LZZLs0KuaCAeEb8Ijxr77wTiIKyz2Vi_5mcKGDAsyqpPJWUy9OHIiOsp5sGpC-3ng6c3mm8fI0VJhBlRwlWd22_yzsSIM4W98s_xHBkuI6WRMweVhYSUIraw4WQYGTWdNNNpi6y_LbuFzAw0XP5PqHGoftBL9-VSexTyF_VA70y3da8fiChW1T7jH1WB6hu29RAk9fU-9PYDmW1kj7bjnohMQZozpSk_CEf1-phRwwMewLxRo', isHero: true, tag: 'Destacado', year: 2026 },
        { id: 1, title: 'Conferencia Magistral', category: 'Video', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtvPeZtSUjtZDd6tbvOuAjPc3976zucBhrkXq-i9mI-VdhzUfWdJWomsyreWdWqVpRZQZfJPhbfZQ1xFSkuL8pZ2rYP2KkZcWPCSK05mqSp0CLMzcs7qK_kOIFgGsI8LPHuNDUHWid_nRZSpfB2bfLBPs74h5BM9s4zaYYEydAq1NXDzbpavoim64hcP6iZYe3FKGuKHzJsohzNDsQg7B7sTwHKURSJ4ZP-Eh3SvuC_KVWrO4smERBhPfvgwcmfmiJkhc0Pn8EUgg', type: 'video', duration: '4:20', year: 2026 },
        { id: 2, title: 'Talleres Prácticos', category: 'Día 2', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMubpJEz1skzdKVAn7XpZ55_f__mjPYfDv3XeI5JDIIadufdYhezP9fPfpWQDvwnEMX_LZG7tRSRH1IMHbztRyyD5tEDXjxKt5kNi1LxUt-k8PytWhY0sdwyx64smWtOd9CC_8rk6bSO_lnJPXMhIx8-r_tVflMnOWbMMEITvmPRNGKdDJQ7xm_0YjPHAsDFjHAsYE6VxiFkfJ7bYAcGy3WnTwdjcuqrHjDtuZrL55nKpUUqB0e0N3b9PdSxjCgXrXIj6h5bjNWHk', year: 2026 },
        { id: 3, title: 'Sesiones Interactivas', category: 'Día 2', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCz87gg95B7nsM-oAGapGX5hd5S90e_K86B1dF0CtfUwBWm6M_AQN2vjafuQm8SC0LM_Gkh_mvXcI2MtgLH4SCK-hs1G440bv9OHrUQWVvOP_6taIOpzZmwHOciFNqJUJb7ayRXw9kxb9WXklag2n1zxkSx4cYIE8NE_C0F8lhMls-CSFpU0x1391FJPdtWvSTfx_PabQFSclnNBI7NWf7BNcKd5tO0Q7XsOBodaLYtNRkyfGNa1RbNDOHPXwoSCYhyqqL3PBXaRnw', year: 2026 },
        { id: 4, title: 'Avances Neurocirugía', category: 'Video', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTEFn0_CMU144N0EW6WbxNcR_oPwTzF7n4jpPg9PG-sK3y6HFzy3-LFoXnAi0nBAZRIFgqa_7lKHxp_ZghEPO4fAInhngUP9u9RXk8ezPjg4owMmOvMnIIukSWLvv7RHue3udpJlFKN7TQbNwwF_xk4t3ShqmbsQDQlr3urgFV32JEIkv169H9np5VWusqO6Prg0Cnjz9aCrNBV6nvSHmoJrDF0QRPa7JIKFyENtaNfkWGh0ooGofFGvzuajIfS-tYzY3Vi63cv5E', type: 'video', duration: '12:05', year: 2026 },
        { id: 5, title: 'Cena de Gala & Networking', category: 'Gala', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANylifLNbfHb9giT5iCrIVd_zEpwMhWmhoIvYjk15_DK7qxpBPPLoVpd9AsDCUycCBvS_P8hYD6JxkoYJR8vKg140ZnI2KCVndiTPH5o2bMV9JMKIej_JUTiQJ5dzFOL6Lx8-Ak3_vDWjEsx9LCSOGWI2cePNUlQYgKkzvUpMCAw8tuMc_iaFVE68d9yCpwKpC5QsISsGu0Y2lUOOVGZdoZlaqL0mniNtq6FG2zrW996GGh_eaYyQmJGgIYqRBO8E4y0455kHo37c', span: 'col-span-2', year: 2026 },
        { id: 6, title: 'Registro', category: 'Pre-Congreso', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCY9bgrdXAT8P7nzlKFDBAuL1icuyikmfLKsoza11bxjJ-DviJPX3eedt233uQOQslqqUUl6TwobC6qdRXK1Swgg0fiF7nfmYkKtQo51qFmt8Gawtv0R_ZA4F-X10d_XyJ5hGdJDr7VyyzoeD9yZ6O1U-FQGTQUpj2nm-kulGXxwDyPDR7hd50RMAgAu34P5CuZSV9Psg58e3onX0ip8fLcxW28DnZ3fYv4jd3meis31JVdlvqv3qicKroOzeQv5o1VZp0uatQgsJU', year: 2026 },
        { id: 7, title: 'Casos Clínicos', category: 'Día 1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYlhQa2WU3Qom3oiNz_rtddlc8Z8WgyU5oK4EbUmWq4WOz_VEUzp1duToCyG9OAMWdLzSIDxtE-ctJEtY4Mna5Z8EFc8NUVrF1z8qx82_4Z4AhZ77wVQsbyDaIau8MNIMpqqyJoie31vjtogTJXw4InW4S5AEE1fp1LYQvZzjptjBAyRnkftQTZZDRU_soQkVpZLpWzR0sSi4uf8yHZvfMP_Ki6RVcQWaKpY76fEsHtsjWeTa1JVaP2OGfMwPJOXbNREJ7K6T8uqs', year: 2026 },
        { id: 8, title: 'Clausura', category: 'Video', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxjlAMlslgCCt2eWVAZaiaXRJe5JPxDXrzSjmm2MsVrHixAbgjAdcoj5i_e2LwcA--sjKfE7fIkLeolNOAB3iTnMvTo3PdnVKukUaAqFVXGp8BOfoot8lT7IHyxulUpTXVgANJan6PsNVQa1e7oHSbOvGq_W-2pIgKPqVyXjsLl0y43Om8mStjmnP-s6LV894BjS5hzd708FCIeK4VF8ovz7W4VFUMio1bNUkERnG9MTknxUQh-a_SPnLSUXq_-SjA0eEx4nrPvWs', type: 'video', year: 2026 },
        { id: 9, title: 'Networking', category: 'Gala', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdXR-iOg9msTHZZjYgVTKQ05bL68T2pNvM3e0FrC2S6hIIU_scjw7Vo3BKiT7VpUWuGChHuA4o7jH7LrJWl-pAkLwWJSAFArc8YFSYSDdEVF0FXCPbwcVFSuyBB-DZXLvpC8xi9tQEBa0XCy5uff6Vbb9fjATwZrW-KEW2O8H-hiuVUL4wY93IHZErwTZXG1TIGjQGrpb3dipl2bgeicYFlnFYDl2cwqigVDruWkv4ppQbEuXonuJGo-1ecAsO6dw9aRvP1yk7EKw', year: 2026 },
        { id: 10, title: 'Comité', category: 'Trabajo', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAYeg-34njjkHnoXsOxfVg0fnUBtNjR9XtLKPKucWBeOSA7hkruARdT4KzQngajI5t6cZEAolGfme9tEfjlCpJiLOhnFBp1gd1mjdARmf1s1APkSKZUdLciKLJFZk7jZ3DyCDceKfdS8phNypMOgDzMFKNEAf9k1d8ZWwP60CK_1rBd88e4h_97OX0Z9Msf33nDoZiAWgYthrCGNSvgrKZVN8cfgDABkC8zw0MhpA0av_a9jxPwdgLaTDcHzl0sB3tSXYLznmPwOY', year: 2026 },
        { id: 11, title: 'Exhibición', category: 'Tecnología', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBq3EhOneP2-XgW2u6CDsLCHtf4sIfz5I3UoH2KPv4CDexq_q4fhfctp2mHpQXMjhgQHCFmUNqMhleRlhQP5jmSwyrsgDLZmaSx_TJqmpnmCZlxtkWJJmtVeNgIpMAFkgpR-IkeLFBDU4aPGxzyvKSlaIteRn2Q1w0CbpOioKD_zbj7rS6Egh6LEiCdr8pZeK2HoOQALlt_Rm55UCqEIJesd3d50XZHmGNic4d1c1aFoXFjuXaNSanqkmBKF_JwL-6bb-FTo4QECVc', year: 2026 }
    ];

    const openLightbox = (index) => {
        setLightboxIndex(index);
        setIsLightboxOpen(true);
    };

    const filters = ['Todos', 'Videos', 'Pre-Congreso', 'Día 1', 'Día 2', 'Gala'];

    return (
        <div className="flex flex-col h-screen w-full bg-[#0e101b] text-white font-sans overflow-hidden">
            <style>{`
                .wall-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    grid-template-rows: repeat(3, 1fr);
                    gap: 0.5rem;
                    height: 100%;
                    width: 100%;
                }
                @media (max-width: 1024px) {
                    .wall-grid {
                        grid-template-columns: repeat(3, 1fr);
                        grid-template-rows: repeat(4, 1fr);
                    }
                }
                .wall-item {
                    position: relative;
                    overflow: hidden;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .wall-item:hover img {
                    transform: scale(1.1);
                }
                .wall-item::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%);
                    opacity: 0.6;
                    transition: opacity 0.3s ease;
                }
                .wall-item:hover::after {
                    opacity: 0.8;
                }
                .item-content {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    padding: 1rem;
                    z-index: 20;
                    transform: translateY(10px);
                    opacity: 0;
                    transition: all 0.3s ease;
                }
                .wall-item:hover .item-content {
                    transform: translateY(0);
                    opacity: 1;
                }
                .hero-item .item-content {
                    transform: translateY(0);
                    opacity: 1;
                    padding: 2rem;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    background: linear-gradient(135deg, rgba(23, 54, 207, 0.8), rgba(14, 16, 27, 0.6));
                }
                .video-indicator {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(1);
                    z-index: 10;
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(4px);
                    border-radius: 50%;
                    padding: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.3s ease, background 0.3s ease;
                }
                .wall-item:hover .video-indicator {
                    transform: translate(-50%, -50%) scale(1.1);
                    background: rgba(23, 54, 207, 0.8);
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Header */}
            <header className="relative z-50 w-full h-14 bg-[#0e101b]/95 backdrop-blur-md flex items-center justify-between px-6 border-b border-white/5 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="size-8 text-[#1736cf] flex items-center justify-center bg-[#1736cf]/10 rounded-md">
                        <span className="material-symbols-outlined text-xl">neurology</span>
                    </div>
                    <h2 className="text-sm font-bold tracking-wide text-gray-200">CNN <span className="text-gray-500 font-normal ml-2 hidden sm:inline">Congreso Nacional de Neurología</span></h2>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300 transition-colors border border-white/10">
                        <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                        <span className="hidden sm:inline">Subir Contenido</span>
                    </button>
                    <div className="h-4 w-px bg-white/10"></div>
                    <button className="text-xs font-bold text-white hover:text-[#1736cf] transition-colors">ACCESO</button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow relative w-full h-[calc(100vh-3.5rem)] bg-[#0e101b]">
                {/* Floating Filters */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-5xl">
                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xl">

                        {/* Edition Selector */}
                        <div className="relative group w-full md:w-auto min-w-[180px]">
                            <button
                                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                                className="flex items-center justify-between w-full gap-3 px-4 py-2 rounded-xl bg-[#1736cf] hover:bg-[#1736cf]/90 text-white text-sm font-bold transition-all shadow-lg shadow-[#1736cf]/20"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                    Edición: {selectedYear}
                                </span>
                                <span className="material-symbols-outlined text-[18px]">arrow_drop_down</span>
                            </button>

                            {isYearDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-full md:w-64 bg-[#1e2330] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                                    <div className="p-2 space-y-1">
                                        {availableYears.map(year => (
                                            <button
                                                key={year}
                                                onClick={() => { setSelectedYear(year); setIsYearDropdownOpen(false); }}
                                                className={`block w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${selectedYear === year ? 'bg-[#1736cf]/10 text-[#1736cf]' : 'hover:bg-white/5 text-gray-400'
                                                    }`}
                                            >
                                                {year} {year === 2026 ? '(Actual)' : ''}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filter Pills */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto px-2">
                            {filters.map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setSelectedFilter(filter)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border ${selectedFilter === filter
                                            ? 'bg-white/10 text-white border-white/10 ring-1 ring-[#1736cf]/50'
                                            : 'text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        <button className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors hidden md:block">
                            <span className="material-symbols-outlined text-[20px]">filter_list</span>
                        </button>
                    </div>
                </div>

                {/* Gallery Grid */}
                <div className="w-full h-full p-2 md:p-3 overflow-y-auto">
                    <div className="wall-grid pb-20">
                        {/* Render Display Items */}
                        {displayItems.map((item, index) => (
                            <div
                                key={item.id}
                                onClick={() => openLightbox(index)}
                                className={`wall-item group ${item.isHero ? 'col-span-2 row-span-2 hero-item' : ''} ${item.span === 'col-span-2' ? 'col-span-2' : ''}`}
                            >
                                <img
                                    src={item.url}
                                    alt={item.title}
                                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${item.isHero ? 'opacity-60' : ''}`}
                                />

                                {item.isHero && (
                                    <div className="item-content relative z-10">
                                        <span className="inline-block px-2 py-1 mb-2 rounded border border-white/30 bg-black/20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-blue-200">
                                            {item.tag || 'Destacado'}
                                        </span>
                                        <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight text-white mb-2 drop-shadow-xl">
                                            {item.title}
                                        </h1>
                                        <p className="text-blue-100 text-sm md:text-base font-medium max-w-md drop-shadow-md">
                                            {item.description}
                                        </p>
                                    </div>
                                )}

                                {item.type === 'video' && !item.isHero && (
                                    <>
                                        <div className="video-indicator">
                                            <span className="material-symbols-outlined text-white text-3xl">play_arrow</span>
                                        </div>
                                        {item.duration && (
                                            <div className="absolute top-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1">
                                                <span className="size-1.5 rounded-full bg-red-500 animate-pulse"></span> {item.duration}
                                            </div>
                                        )}
                                    </>
                                )}

                                {!item.isHero && (
                                    <div className="item-content">
                                        <p className="text-white font-bold text-sm">{item.title}</p>
                                        <span className="text-gray-300 text-xs">
                                            {item.type === 'video' ? 'Video • ' : ''}{item.category || 'General'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Lightbox
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                items={displayItems}
                currentIndex={lightboxIndex}
                onNext={() => setLightboxIndex((prev) => (prev + 1) % displayItems.length)}
                onPrev={() => setLightboxIndex((prev) => (prev - 1 + displayItems.length) % displayItems.length)}
                onSelect={setLightboxIndex}
            />
        </div>
    );
};

export default GalleryView;
