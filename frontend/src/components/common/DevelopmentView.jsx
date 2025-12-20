import React, { useEffect } from 'react';
import { Activity, Brain, Code, Cpu } from 'lucide-react';

const DevelopmentView = ({ title = "Sección en Desarrollo" }) => {
    useEffect(() => {
        // Add custom animations to the document head
        const styleId = 'development-view-animations';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.25; transform: scale(1.1); }
                }
                @keyframes ping-slow {
                    0% { transform: scale(1); opacity: 0.4; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes ping-slower {
                    0% { transform: scale(1); opacity: 0.2; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-pulse-slow { animation: pulse-slow 4s infinite ease-in-out; }
                .animate-ping-slow { animation: ping-slow 3s infinite cubic-bezier(0, 0, 0.2, 1); }
                .animate-ping-slower { animation: ping-slower 4s infinite cubic-bezier(0, 0, 0.2, 1); }
                .animate-float { animation: float 5s infinite ease-in-out; }
            `;
            document.head.appendChild(style);
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] animate-fadeIn px-4 text-center">
            {/* Neurology Animation Container */}
            <div className="relative mb-8">
                {/* Outer Glow / Pulse */}
                <div className="absolute inset-0 bg-blue-400 opacity-20 blur-2xl rounded-full animate-pulse-slow"></div>

                {/* Brain Icon with Neural Connections */}
                <div className="relative p-8 bg-blue-50 rounded-full border border-blue-100 shadow-xl shadow-blue-100/50">
                    <Brain size={80} className="text-blue-600 animate-float" />

                    {/* Floating Icons (Nodes) */}
                    <Activity size={20} className="absolute top-2 right-2 text-blue-400 animate-ping shadow-lg" />
                    <Cpu size={24} className="absolute bottom-4 left-0 text-indigo-400 animate-bounce shadow-md" />
                    <Code size={20} className="absolute top-8 left-2 text-sky-400 opacity-60" />
                </div>

                {/* Pulse Rings */}
                <div className="absolute inset-0 border-2 border-blue-200 rounded-full animate-ping-slow pointer-events-none"></div>
                <div className="absolute inset-4 border-2 border-indigo-100 rounded-full animate-ping-slower pointer-events-none"></div>
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                {title}
            </h2>

            <p className="max-w-md text-gray-500 text-lg leading-relaxed mb-8">
                Estamos afinando las conexiones neuronales de esta sección. Muy pronto estará lista para el simposio.
            </p>

            <div className="flex items-center gap-3 px-6 py-2 bg-blue-50 text-blue-700 rounded-full border border-blue-100 font-medium text-sm animate-pulse-slow">
                <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
                Sincronizando Conexiones...
            </div>
        </div>
    );
};

export default DevelopmentView;
