import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
    // Configuración de demostración para el emulador
    // En producción, estas serían las credenciales reales
    apiKey: "demo-simr-key",
    authDomain: "demo-simr-2026.firebaseapp.com",
    projectId: "demo-simr-2026",
    storageBucket: "demo-simr-2026.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// 🛡️ LÓGICA DE INTERCEPTACIÓN
// Si estamos desarrollando en local, redirigir al emulador
// Ajustado para Vite (import.meta.env) o detección de host
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.log("🔧 Modo Desarrollo: Conectado a Emulador Firestore");
    try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log("✅ Conexión exitosa al emulador en localhost:8080");
    } catch (e) {
        console.error("⚠️ Error conectando al emulador de Firestore:", e);
        console.warn("Asegúrate de ejecutar 'firebase emulators:start' en una terminal separada.");
    }
}
