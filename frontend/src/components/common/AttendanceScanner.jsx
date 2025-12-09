import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '../ui';
import { X, Camera } from 'lucide-react';

const AttendanceScanner = ({ onScan, onClose, onError }) => {
    const [cameraError, setCameraError] = useState(null);

    const handleScan = (result) => {
        if (result && result.length > 0) {
            onScan(result[0].rawValue);
        }
    };

    const handleError = (error) => {
        console.error("QR Scan Error:", error);
        setCameraError("No se pudo acceder a la cámara. Verifique los permisos.");
        if (onError) onError(error);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl overflow-hidden relative">
                {/* Header */}
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <Camera size={20} />
                        Escanear Código QR
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="relative aspect-square bg-black">
                    {!cameraError ? (
                        <Scanner
                            onScan={handleScan}
                            onError={handleError}
                            components={{
                                audio: false,
                                finder: true
                            }}
                            styles={{
                                container: { width: '100%', height: '100%' }
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white p-6 text-center">
                            <p>{cameraError}</p>
                        </div>
                    )}

                    {/* Visual Guide */}
                    <div className="absolute inset-0 pointer-events-none border-2 border-white/20"></div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 text-center">
                    <p className="text-sm text-gray-600 mb-3">
                        Encuadre el código QR dentro del marco para escanear automáticamente.
                    </p>
                    <Button variant="outline" onClick={onClose} className="w-full">
                        Cancelar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceScanner;
