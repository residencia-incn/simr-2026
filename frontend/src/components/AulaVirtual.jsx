import { useEffect, useState } from 'react';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from '../config/firebase';

export default function AulaVirtual() {
    const [activeExam, setActiveExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Referencia al documento 'current_exam' de la colección 'event_status'
        const docRef = doc(db, "event_status", "current_exam");

        console.log("👂 Escuchando cambios en Firestore...");

        // Escuchar cambios en tiempo real
        const unsubscribe = onSnapshot(docRef,
            (docSnapshot) => {
                setLoading(false);
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    console.log("🔥 Datos recibidos de Firestore:", data);

                    if (data.status === "OPEN") {
                        setActiveExam({
                            id: data.activeExamId,
                            message: data.message || "Examen activo"
                        });
                        // Opcional: Feedback visual o sonoro
                    } else {
                        setActiveExam(null);
                    }
                } else {
                    console.log("⚠️ Documento 'current_exam' no existe aún.");
                    setActiveExam(null);
                }
            },
            (err) => {
                console.error("❌ Error en escucha Firestore:", err);
                setError("Error de conexión con el sistema de tiempo real.");
                setLoading(false);
            }
        );

        // Limpiar suscripción al desmontar (Evita fugas de memoria)
        return () => {
            console.log("🔇 Desconectando escucha Firestore...");
            unsubscribe();
        };
    }, []);

    return (
        <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex items-center space-x-4 border border-gray-200">
            <div className="flex-shrink-0">
                <span className="text-4xl">🎓</span>
            </div>
            <div>
                <div className="text-xl font-medium text-black">Aula Virtual</div>
                <p className="text-gray-500">Sincronización Híbrida</p>

                {loading && <p className="text-blue-500 text-sm mt-2">Connecting...</p>}
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                {!loading && !error && (
                    <div className="mt-3">
                        {activeExam ? (
                            <div className="animate-pulse">
                                <p className="text-green-600 font-bold mb-2">{activeExam.message}</p>
                                <button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                                    onClick={() => alert(`Navegando al examen ${activeExam.id}...`)}
                                >
                                    📝 INGRESAR AL EXAMEN
                                </button>
                            </div>
                        ) : (
                            <p className="text-gray-400 italic text-sm">Esperando inicio del examen...</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
