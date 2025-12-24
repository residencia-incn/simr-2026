import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for file upload handling
 * @param {Object} options - Configuration options
 * @returns {Object} File state and control functions
 */
export const useFileUpload = (options = {}) => {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        acceptedTypes = ['image/*', '.pdf'],
        onUpload = null
    } = options;

    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);

    const validateFile = useCallback((file) => {
        // Check file size
        if (file.size > maxSize) {
            return `El archivo es muy grande. Máximo ${maxSize / 1024 / 1024}MB`;
        }

        // Check file type if specified
        if (acceptedTypes.length > 0) {
            const fileType = file.type;
            const fileExtension = '.' + file.name.split('.').pop();

            const isAccepted = acceptedTypes.some(type => {
                if (type.includes('*')) {
                    const baseType = type.split('/')[0];
                    return fileType.startsWith(baseType);
                }
                return type === fileType || type === fileExtension;
            });

            if (!isAccepted) {
                return `Tipo de archivo no permitido. Aceptados: ${acceptedTypes.join(', ')}`;
            }
        }

        return null;
    }, [maxSize, acceptedTypes]);

    const handleFileChange = useCallback(async (e) => {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) {
            return;
        }

        // Validate file
        const validationError = validateFile(selectedFile);
        if (validationError) {
            setError(validationError);
            setFile(null);
            setPreview(null);
            // Reset input so change event fires again for same file if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setError(null);
        setFile(selectedFile);

        // Create preview for images
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }

        // Call onUpload callback if provided
        if (onUpload) {
            setUploading(true);
            try {
                await onUpload(selectedFile);
            } catch (err) {
                setError(err.message || 'Error al subir archivo');
            } finally {
                setUploading(false);
                // Reset input to allow re-upload if needed
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    }, [validateFile, onUpload]);

    const convertToBase64 = useCallback((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    }, []);

    const clear = useCallback(() => {
        setFile(null);
        setPreview(null);
        setError(null);
        setUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    return {
        file,
        preview,
        error,
        uploading,
        handleFileChange,
        convertToBase64,
        clear,
        fileInputRef
    };
};

export default useFileUpload;
