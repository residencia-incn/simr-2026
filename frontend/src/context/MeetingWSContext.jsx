import React, { createContext, useContext, useEffect, useState } from 'react';

const MeetingWSContext = createContext();

export const MeetingWSProvider = ({ children, meetingId }) => {
    const [lastJsonMessage, setLastJsonMessage] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!meetingId) return;

        let socketInstance = null;
        let reconnectTimeout = null;
        let reconnectionAttempts = 0;
        const maxReconnectionAttempts = 10;

        const connect = () => {
            let token = localStorage.getItem('token');
            // Fallback: Check if client uses a different key or if it's inside simr_user (improbable but possible)
            if (!token) {
                const userStr = localStorage.getItem('simr_user');
                if (userStr) {
                    try {
                        const u = JSON.parse(userStr);
                        // Some implementations store token in user object
                        if (u.token) token = u.token;
                    } catch (e) { }
                }
            }

            if (!token) {
                console.error("❌ WS Error: No token found in localStorage");
                return;
            }

            const cleanToken = token.replace('Bearer ', '');
            const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${host}/polls/ws/${meetingId}?token=${cleanToken}`;

            console.log(`🔌 Conectando WS (Intento ${reconnectionAttempts + 1}): ${wsUrl}`);
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log("✅ WebSocket Conectado");
                setIsConnected(true);
                reconnectionAttempts = 0; // Reset attempts on success
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log("📩 Mensaje WS recibido:", data);
                    setLastJsonMessage(data);
                } catch (e) {
                    console.error("❌ Error parseando mensaje WS:", e);
                }
            };

            socketInstance = ws;
            setSocket(ws);

            // [NUEVO] Latido para mantener conexión viva
            const heartbeat = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send("PONG");
                }
            }, 20000); // Cada 20s

            ws.onclose = (event) => {
                clearInterval(heartbeat);
                console.log("🔌 WebSocket Desconectado", event.reason);
                setIsConnected(false);

                // Reconectar si no fue un cierre intencional
                if (event.code !== 1000 && reconnectionAttempts < maxReconnectionAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectionAttempts), 30000);
                    reconnectionAttempts++;
                    console.log(`🔄 Reconectando en ${delay / 1000}s...`);
                    reconnectTimeout = setTimeout(connect, delay);
                }
            };
        };

        connect();

        return () => {
            if (socketInstance) socketInstance.close(1000);
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, [meetingId]);

    return (
        <MeetingWSContext.Provider value={{ lastJsonMessage, isConnected, socket, meetingId }}>
            {children}
        </MeetingWSContext.Provider>
    );
};

export const useMeetingWS = () => {
    const context = useContext(MeetingWSContext);
    if (!context) {
        // Fallback para evitar errores si se usa fuera del provider
        return { lastJsonMessage: null, isConnected: false, socket: null };
    }
    return context;
};
