import React from 'react';

const CreditBadge = ({ className = "" }) => {
    return (
        <div className={`relative flex items-center group animate-float ${className}`}>
            {/* The Seal (Star) */}
            <div className="relative z-20 flex-shrink-0">
                {/* Ribbons */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 flex justify-center z-0">
                    <div className="absolute w-6 h-16 bg-gradient-to-b from-yellow-600 to-yellow-800 -rotate-12 border-l border-r border-yellow-400 origin-top"></div>
                    <div className="absolute w-6 h-16 bg-gradient-to-b from-yellow-600 to-yellow-800 rotate-12 border-l border-r border-yellow-400 origin-top"></div>
                </div>

                {/* Star Shape */}
                <div className="w-32 h-32 relative flex items-center justify-center">
                    {/* SVG 20-point Star */}
                    <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full drop-shadow-xl text-yellow-500">
                        {/* Outer Glow/Stroke */}
                        <path
                            fill="currentColor"
                            d="M100,10 L112,35 L138,30 L140,56 L165,65 L158,90 L178,110 L160,130 L170,155 L145,162 L142,188 L118,178 L105,200 L95,178 L70,188 L68,162 L42,155 L52,130 L35,110 L55,90 L48,65 L72,56 L75,30 L100,35 Z" // Simplified approximation or use pure polygon
                            className="text-yellow-600"
                        />
                        {/* Actual Star Body - 20 points logic is complex, approximating with a rotate loop or just a nice SVG path */}
                        {/* Let's use a stacked element approach for css polygon or simpler svg path */}
                        <polygon points="100,5 110,30 135,25 135,50 160,60 150,85 170,105 150,125 160,150 135,160 135,185 110,180 100,205 90,180 65,185 65,160 40,150 50,125 30,105 50,85 40,60 65,50 65,25 90,30" fill="url(#goldGradient)" stroke="#B45309" strokeWidth="2" />
                        <defs>
                            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FCD34D" />
                                <stop offset="50%" stopColor="#F59E0B" />
                                <stop offset="100%" stopColor="#D97706" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Inner Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-yellow-900 leading-tight">RESOLUCIÓN<br />Nº 0285-22</span>
                        <span className="text-[9px] font-extrabold text-yellow-900/80 mt-0.5">SISTCERE/CMP</span>
                    </div>
                </div>
            </div>

            {/* The Banner */}
            <div className="relative z-10 -ml-10 flex-1">
                <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white pl-12 pr-5 py-2 rounded-r-xl shadow-lg border border-purple-500/30 flex items-center gap-3 min-w-[200px]">
                    <span className="text-5xl font-black text-yellow-400 drop-shadow-md" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}>5</span>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-purple-100 leading-tight tracking-tight uppercase">Válidos para la<br />Recertificación Médica</span>
                        <span className="text-sm font-black text-yellow-400 uppercase tracking-wider">PUNTOS</span>
                    </div>
                </div>
                <div className="absolute -bottom-5 left-12 text-[10px] text-yellow-200/80 italic font-serif tracking-wide hidden sm:block">
                    Válido para médicos colegiados
                </div>
            </div>
        </div>
    );
};

export default CreditBadge;
