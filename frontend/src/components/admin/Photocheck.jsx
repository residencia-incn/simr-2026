import React from 'react';
import { QrCode } from 'lucide-react';

const Photocheck = ({ attendee, width = 9, height = 13 }) => {
    // Helper to parse dimension to number (handles "9cm" or 9)
    const parseDim = (val) => {
        if (typeof val === 'number') return val;
        return parseFloat(val) || 0;
    };

    const w = parseDim(width);
    const h = parseDim(height);

    // Base Dimensions (Design optimal size)
    const BASE_W = 9;
    const BASE_H = 13;

    // Calculate Scale: "Fit" logic to ensure content is visible
    // We scale down/up based on the smaller ratio to ensure it fits inside
    // If aspect ratio changes, this preserves the content size relative to the closest boundary
    const scaleX = w / BASE_W;
    const scaleY = h / BASE_H;

    // Use the smaller scale to ensure we don't crop horizontally or vertically in a bad way
    // For a badge, usually we want to fit the content.
    // If the user makes it very tall and skinny (5x12), scaleX (0.55) < scaleY (0.9). We use 0.55.
    // The inner container will be standard width, but very tall. Flex gap will handle it.
    const scale = Math.min(scaleX, scaleY);

    // Format Name: First Name (first word) + Last Name (first word)
    const displayName = React.useMemo(() => {
        if (attendee?.firstName || attendee?.lastName) {
            const first = (attendee.firstName || '').trim().split(' ')[0];
            const last = (attendee.lastName || '').trim().split(' ')[0];
            return `${first} ${last}`.trim();
        }
        return attendee?.name || 'Nombre del Participante';
    }, [attendee]);

    // Dynamic Font Size based on name length
    const fontSizeClass = React.useMemo(() => {
        const len = displayName.length;
        if (len > 22) return 'text-lg uppercase';
        if (len > 16) return 'text-xl uppercase';
        if (len > 10) return 'text-2xl uppercase';
        return 'text-3xl uppercase';
    }, [displayName]);

    return (
        <>
            <style type="text/css" media="print">
                {`
                    @page { size: auto; margin: 0mm; }
                    body { margin: 0mm; }
                    .print-container { page-break-after: always; }
                    .print-container:last-child { page-break-after: auto; }
                `}
            </style>

            {/* Outer Physical Container: Sets the actual print dimensions */}
            <div
                className="bg-white border border-gray-200 relative overflow-hidden font-sans print:border print:border-gray-300"
                style={{
                    width: `${w}cm`,
                    height: `${h}cm`,
                }}
            >
                {/* Inner Logic Container: Scales the content to fit the physical container */}
                <div
                    style={{
                        width: `${w / scale}cm`,
                        height: `${h / scale}cm`,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center'
                    }}
                    className="h-full w-full"
                >
                    {/* Header */}
                    <div className="w-full h-[15%] bg-blue-900 flex items-center justify-center relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                        <div className="z-10 text-white font-bold text-3xl tracking-widest leading-none">SIMR 2026</div>
                    </div>

                    {/* Role Banner */}
                    <div className={`w-full py-2 text-white font-black text-3xl uppercase tracking-wider shadow-md shrink-0
                    ${attendee?.role === 'Comité Organizador' ? 'bg-purple-700' :
                            attendee?.role === 'Ponente' ? 'bg-amber-500' :
                                attendee?.role === 'Jurado' ? 'bg-red-600' :
                                    attendee?.role === 'Especialista' ? 'bg-blue-600' :
                                        'bg-green-600'}`}>
                        {attendee?.role || 'INVITADO'}
                    </div>

                    {/* Content */}
                    <div className="flex-grow flex flex-col items-center justify-center p-2 w-full min-h-0">
                        <h2 className={`${fontSizeClass} font-bold text-gray-900 mb-1 leading-tight line-clamp-2`}>{displayName}</h2>
                        <p className="text-2xl text-gray-600 font-medium mb-1 line-clamp-1">{attendee?.specialty || 'Especialidad'}</p>
                        <p className="text-lg text-gray-400 mb-4 line-clamp-1">{attendee?.institution || 'Institución'}</p>

                        {/* QR Code Placeholder */}
                        <div className="bg-white p-2 rounded-xl border-2 border-gray-100 shadow-sm mb-3 shrink-0">
                            {attendee?.id ? (
                                <QrCode size={140} className="text-gray-800" />
                            ) : (
                                <QrCode size={140} className="text-gray-300" />
                            )}
                        </div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest shrink-0">Escanear para asistencia</p>
                    </div>

                    {/* Footer */}
                    <div className="w-full py-2 bg-gray-100 border-t border-gray-200 text-[10px] text-gray-500 font-medium shrink-0">
                        Lima, Perú • Octubre 2026
                    </div>
                </div>
            </div>
        </>
    );
};

export default Photocheck;
