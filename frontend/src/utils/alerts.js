import Swal from 'sweetalert2';

/**
 * Centralized alert utility using SweetAlert2
 * Provides consistent styling and behavior for all notifications
 */

const defaultConfig = {
    confirmButtonColor: '#2563eb', // blue-600
    cancelButtonColor: '#6b7280', // gray-500
    customClass: {
        popup: 'rounded-xl shadow-2xl',
        title: 'text-xl font-bold',
        confirmButton: 'px-6 py-2.5 rounded-lg font-medium transition-all',
        cancelButton: 'px-6 py-2.5 rounded-lg font-medium transition-all',
    }
};

/**
 * Show a success message
 * @param {string} message - The success message to display
 * @param {string} title - Optional title (default: "¡Éxito!")
 */
export const showSuccess = (message, title = '¡Éxito!') => {
    return Swal.fire({
        icon: 'success',
        title,
        text: message,
        confirmButtonText: 'Aceptar',
        ...defaultConfig,
        confirmButtonColor: '#16a34a', // green-600
    });
};

/**
 * Show an error message
 * @param {string} message - The error message to display
 * @param {string} title - Optional title (default: "Error")
 */
export const showError = (message, title = 'Error') => {
    return Swal.fire({
        icon: 'error',
        title,
        text: message,
        confirmButtonText: 'Aceptar',
        ...defaultConfig,
        confirmButtonColor: '#dc2626', // red-600
    });
};

/**
 * Show a warning message
 * @param {string} message - The warning message to display
 * @param {string} title - Optional title (default: "Advertencia")
 */
export const showWarning = (message, title = 'Advertencia') => {
    return Swal.fire({
        icon: 'warning',
        title,
        text: message,
        confirmButtonText: 'Entendido',
        ...defaultConfig,
        confirmButtonColor: '#ea580c', // orange-600
    });
};

/**
 * Show an info message
 * @param {string} message - The info message to display
 * @param {string} title - Optional title (default: "Información")
 */
export const showInfo = (message, title = 'Información') => {
    return Swal.fire({
        icon: 'info',
        title,
        text: message,
        confirmButtonText: 'Aceptar',
        ...defaultConfig,
    });
};

/**
 * Show a confirmation dialog
 * @param {string} message - The confirmation message
 * @param {string} title - Optional title (default: "¿Estás seguro?")
 * @param {object} options - Additional options (confirmText, cancelText, etc.)
 * @returns {Promise<boolean>} - True if confirmed, false if cancelled
 */
export const showConfirm = async (
    message,
    title = '¿Estás seguro?',
    options = {}
) => {
    const result = await Swal.fire({
        icon: 'question',
        title,
        text: message,
        showCancelButton: true,
        confirmButtonText: options.confirmText || 'Sí, continuar',
        cancelButtonText: options.cancelText || 'Cancelar',
        ...defaultConfig,
        confirmButtonColor: options.confirmColor || '#2563eb',
    });

    return result.isConfirmed;
};

/**
 * Show a delete confirmation dialog (red theme)
 * @param {string} message - The confirmation message
 * @param {string} title - Optional title
 * @returns {Promise<boolean>} - True if confirmed, false if cancelled
 */
export const showDeleteConfirm = async (
    message,
    title = '¿Eliminar?'
) => {
    const result = await Swal.fire({
        icon: 'warning',
        title,
        text: message,
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        ...defaultConfig,
        confirmButtonColor: '#dc2626', // red-600
    });

    return result.isConfirmed;
};

/**
 * Show a loading/processing message
 * @param {string} message - The loading message
 */
export const showLoading = (message = 'Procesando...') => {
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
};

/**
 * Close the current alert
 */
export const closeAlert = () => {
    Swal.close();
};

/**
 * Show a toast notification (non-blocking)
 * @param {string} message - The message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 */
export const showToast = (message, type = 'success') => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: type,
        title: message
    });
};

export default {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    confirm: showConfirm,
    deleteConfirm: showDeleteConfirm,
    loading: showLoading,
    close: closeAlert,
    toast: showToast,
};
