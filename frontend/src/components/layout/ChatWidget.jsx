import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Bot, Minimize2, Send } from 'lucide-react';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: '¡Hola! Soy el asistente IA del SIMR 2026 (Powered by Gemini). 🤖\n\nPuedo ayudarte con:\n• Fechas importantes\n• Envío de trabajos\n• Programa del evento\n\n¿Qué necesitas saber?' }
    ]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = { id: Date.now(), type: 'user', text: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        setTimeout(() => {
            const response = generateAIResponse(userMsg.text);
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: response }]);
            setIsTyping(false);
        }, 1500);
    };

    const generateAIResponse = (text) => {
        const lower = text.toLowerCase();
        if (lower.includes('fecha') || lower.includes('cuando') || lower.includes('cuándo') || lower.includes('dias')) {
            return "El SIMR 2026 se llevará a cabo del **22 al 27 de Junio de 2026**. ¡Reserva la semana!";
        }
        if (lower.includes('trabajo') || lower.includes('abstract') || lower.includes('envio') || lower.includes('enviar')) {
            return "Para enviar un trabajo, debes registrarte como Residente. Ve al panel 'Area Privada' y selecciona 'Nuevo Trabajo'. \n\nRecuerda que la fecha límite es el **15 de Marzo**.";
        }
        if (lower.includes('programa') || lower.includes('horario') || lower.includes('cronograma')) {
            return "Puedes ver el detalle completo en la sección 'Programa'. Tendremos actividades desde las 8:00 AM todos los días, divididas por subespecialidades.";
        }
        if (lower.includes('taller') || lower.includes('inscripcion')) {
            return "Los talleres tienen cupos limitados. Puedes inscribirte desde tu panel de usuario una vez que te hayas registrado.";
        }
        if (lower.includes('gracias') || lower.includes('chau')) {
            return "¡De nada! Aquí estaré si necesitas más ayuda. Éxitos en tu investigación. 🧠";
        }
        return "Entiendo. Como soy una versión demo, mi conocimiento es limitado, pero en la versión final estaré conectado a la API de Gemini para responder cualquier duda compleja sobre neurociencias o logística del evento.";
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${isOpen ? 'bg-red-500 rotate-90' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-110'}`}
            >
                {isOpen ? <X color="white" size={24} /> : <MessageCircle color="white" size={28} />}
            </button>

            <div className={`fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200 transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`} style={{ maxHeight: '600px', height: '70vh' }}>
                <div className="bg-gradient-to-r from-blue-900 to-indigo-800 p-4 rounded-t-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                            <Bot color="white" size={20} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">Asistente SIMR</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <span className="text-blue-100 text-xs">En línea (Gemini)</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                        <Minimize2 size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.type === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                }`}>
                                <p className="whitespace-pre-line">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start animate-fadeIn">
                            <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 rounded-b-2xl">
                    <div className="relative flex items-center gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Escribe tu pregunta..."
                            className="w-full bg-gray-100 text-gray-800 text-sm rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="absolute right-1.5 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <span className="text-[10px] text-gray-400">Powered by Google Gemini AI</span>
                    </div>
                </form>
            </div>
        </>
    );
};

export default ChatWidget;
