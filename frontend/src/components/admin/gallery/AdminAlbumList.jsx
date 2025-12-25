import React from 'react';
import { api } from '../../../services/api';

const AdminAlbumList = ({ onSelectAlbum, onCreateAlbum }) => {
    // Mock data based on code6.html
    const albums = [
        { id: 1, title: "Memorias 2024", date: "12 Oct, 2024", count: 124, type: "destacado", cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuADPK2mVjGFZY6xGF_CEyKjk-gN77LZZLs0KuaCAeEb8Ijxr77wTiIKyz2Vi_5mcKGDAsyqpPJWUy9OHIiOsp5sGpC-3ng6c3mm8fI0VJhBlRwlWd22_yzsSIM4W98s_xHBkuI6WRMweVhYSUIraw4WQYGTWdNNNpi6y_LbuFzAw0XP5PqHGoftBL9-VSexTyF_VA70y3da8fiChW1T7jH1WB6hu29RAk9fU-9PYDmW1kj7bjnohMQZozpSk_CEf1-phRwwMewLxRo", description: "Colección general de los mejores momentos del congreso." },
        { id: 2, title: "Conferencias Magistrales", date: "13 Oct, 2024", count: 45, type: "dia1", cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuAtvPeZtSUjtZDd6tbvOuAjPc3976zucBhrkXq-i9mI-VdhzUfWdJWomsyreWdWqVpRZQZfJPhbfZQ1xFSkuL8pZ2rYP2KkZcWPCSK05mqSp0CLMzcs7qK_kOIFgGsI8LPHuNDUHWid_nRZSpfB2bfLBPs74h5BM9s4zaYYEydAq1NXDzbpavoim64hcP6iZYe3FKGuKHzJsohzNDsQg7B7sTwHKURSJ4ZP-Eh3SvuC_KVWrO4smERBhPfvgwcmfmiJkhc0Pn8EUgg", description: "Fotos de la sala principal durante las ponencias de apertura." },
        { id: 3, title: "Talleres Prácticos", date: "13 Oct, 2024", count: 82, type: "talleres", cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMubpJEz1skzdKVAn7XpZ55_f__mjPYfDv3XeI5JDIIadufdYhezP9fPfpWQDvwnEMX_LZG7tRSRH1IMHbztRyyD5tEDXjxKt5kNi1LxUt-k8PytWhY0sdwyx64smWtOd9CC_8rk6bSO_lnJPXMhIx8-r_tVflMnOWbMMEITvmPRNGKdDJQ7xm_0YjPHAsDFjHAsYE6VxiFkfJ7bYAcGy3WnTwdjcuqrHjDtuZrL55nKpUUqB0e0N3b9PdSxjCgXrXIj6h5bjNWHk", description: "Sesiones interactivas de la tarde en las salas B y C." },
        { id: 4, title: "Cena de Gala", date: "14 Oct, 2024", count: 210, type: "social", cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuANylifLNbfHb9giT5iCrIVd_zEpwMhWmhoIvYjk15_DK7qxpBPPLoVpd9AsDCUycCBvS_P8hYD6JxkoYJR8vKg140ZnI2KCVndiTPH5o2bMV9JMKIej_JUTiQJ5dzFOL6Lx8-Ak3_vDWjEsx9LCSOGWI2cePNUlQYgKkzvUpMCAw8tuMc_iaFVE68d9yCpwKpC5QsISsGu0Y2lUOOVGZdoZlaqL0mniNtq6FG2zrW996GGh_eaYyQmJGgIYqRBO8E4y0455kHo37c", description: "Evento social de cierre en el Hotel Hilton. Incluye premiación." },
        { id: 5, title: "Registro y Acreditación", date: "12 Oct, 2024", count: 56, type: "pre", cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuCY9bgrdXAT8P7nzlKFDBAuL1icuyikmfLKsoza11bxjJ-DviJPX3eedt233uQOQslqqUUl6TwobC6qdRXK1Swgg0fiF7nfmYkKtQo51qFmt8Gawtv0R_ZA4F-X10d_XyJ5hGdJDr7VyyzoeD9yZ6O1U-FQGTQUpj2nm-kulGXxwDyPDR7hd50RMAgAu34P5CuZSV9Psg58e3onX0ip8fLcxW28DnZ3fYv4jd3meis31JVdlvqv3qicKroOzeQv5o1VZp0uatQgsJU", description: "Llegada de asistentes y entrega de kits de bienvenida." },
        { id: 6, title: "Exposición Comercial", date: "Sin fecha", count: 0, type: "expo", cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuBq3EhOneP2-XgW2u6CDsLCHtf4sIfz5I3UoH2KPv4CDexq_q4fhfctp2mHpQXMjhgQHCFmUNqMhleRlhQP5jmSwyrsgDLZmaSx_TJqmpnmCZlxtkWJJmtVeNgIpMAFkgpR-IkeLFBDU4aPGxzyvKSlaIteRn2Q1w0CbpOioKD_zbj7rS6Egh6LEiCdr8pZeK2HoOQALlt_Rm55UCqEIJesd3d50XZHmGNic4d1c1aFoXFjuXaNSanqkmBKF_JwL-6bb-FTo4QECVc", description: "Fotos de stands y patrocinadores (Pendiente de carga).", isDraft: true }
    ];

    const getTypeColor = (type) => {
        const colors = {
            'destacado': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'dia1': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            'talleres': 'bg-green-500/10 text-green-400 border-green-500/20',
            'social': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
            'pre': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            'expo': 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        };
        return colors[type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    };

    return (
        <div className="h-full w-full bg-[#0e101b] flex flex-col overflow-hidden">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #111421;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #374151;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #4b5563;
                }
            `}</style>

            {/* Header (Secondary) */}
            <div className="h-12 shrink-0 w-full bg-[#111421]/95 backdrop-blur px-6 flex items-center justify-between border-b border-gray-800 z-40">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase mr-1">Edición:</span>
                        <div className="flex bg-gray-800 rounded-md p-0.5">
                            <button className="px-3 py-1 rounded text-[10px] font-bold bg-white text-black shadow-sm">2026</button>
                            <button className="px-3 py-1 rounded text-[10px] font-bold text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">2025</button>
                            <button className="px-3 py-1 rounded text-[10px] font-bold text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">2024</button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-800 rounded-md p-0.5">
                        <button className="p-1 rounded bg-gray-700 text-white shadow"><span className="material-symbols-outlined text-[16px]">grid_view</span></button>
                        <button className="p-1 rounded hover:bg-gray-700 text-gray-400"><span className="material-symbols-outlined text-[16px]">view_list</span></button>
                    </div>
                </div>
            </div>

            {/* Album Grid */}
            <main className="flex-grow w-full bg-[#0e101b] custom-scrollbar overflow-y-auto p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">

                    {/* Create New Card */}
                    <button onClick={onCreateAlbum} className="group relative flex flex-col items-center justify-center h-full min-h-[320px] rounded-xl border-2 border-dashed border-gray-700 bg-gray-800/20 hover:bg-gray-800/40 hover:border-primary/50 transition-all cursor-pointer">
                        <div className="h-16 w-16 rounded-full bg-gray-800 group-hover:bg-[#1736cf]/20 flex items-center justify-center mb-4 transition-colors">
                            <span className="material-symbols-outlined text-3xl text-gray-500 group-hover:text-[#1736cf]">add</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-400 group-hover:text-white">Crear Nuevo Álbum</h3>
                        <p className="text-xs text-gray-600 mt-1">Categoría, día o evento</p>
                    </button>

                    {/* Album Cards */}
                    {albums.map((album) => (
                        <div key={album.id} onClick={() => onSelectAlbum(album)} className="group bg-[#1e2330] rounded-xl overflow-hidden border border-gray-800 shadow-lg hover:border-[#1736cf]/50 hover:shadow-[#1736cf]/10 transition-all flex flex-col cursor-pointer">
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    alt="Cover"
                                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${album.isDraft ? 'grayscale group-hover:grayscale-0' : ''}`}
                                    src={album.cover}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1e2330] to-transparent opacity-60"></div>

                                {album.isDraft && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                                        <span className="px-3 py-1 bg-gray-800 rounded-full text-xs font-bold text-gray-300 border border-gray-600">Borrador</span>
                                    </div>
                                )}

                                <div className="absolute top-2 right-2 flex gap-1">
                                    <span className="bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">image</span> {album.count}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 flex-grow flex flex-col">
                                <div className="mb-2">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border ${getTypeColor(album.type)}`}>
                                        {album.type === 'destacado' ? 'Destacado' : album.type.toUpperCase()}
                                    </span>
                                    <h3 className="text-base font-bold text-white leading-tight group-hover:text-[#1736cf] transition-colors">{album.title}</h3>
                                </div>
                                <p className="text-xs text-gray-400 line-clamp-2 mb-4 flex-grow">{album.description}</p>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-700/50 mt-auto">
                                    <span className="text-[10px] text-gray-500">{album.date}</span>
                                    <div className="flex items-center gap-1">
                                        <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors" title="Editar"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                                        <button className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors" title="Eliminar"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default AdminAlbumList;
