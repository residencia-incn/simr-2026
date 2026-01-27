/**
 * Simulación de subida de archivos a la nube (Firebase Storage / Cloudinary)
 * En entorno real, esto enviaría el archivo al backend o directamente al bucket.
 */
export const uploadToCloud = async (file) => {
    return new Promise((resolve) => {
        console.log("Simulando subida de archivo...", file.name);
        // Simulamos un delay de red
        setTimeout(() => {
            // Retornamos una URL ficticia pero válida para el sistema
            const mockupUrl = `https://storage.googleapis.com/simr-2026/vouchers/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
            resolve(mockupUrl);
        }, 1500);
    });
};
