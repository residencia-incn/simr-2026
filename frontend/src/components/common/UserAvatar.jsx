import React from 'react';
import { User, UserCircle } from 'lucide-react';

/**
 * UserAvatar - Componente para mostrar avatar de usuario
 * Muestra la imagen personalizada o un icono por defecto basado en el género
 * 
 * @param {Object} props
 * @param {string} props.image - URL de la imagen del usuario (puede ser null)
 * @param {string} props.gender - Género del usuario: 'male', 'female', 'unspecified'
 * @param {string} props.name - Nombre del usuario (para mostrar inicial si no hay imagen)
 * @param {number} props.size - Tamaño del icono (default: 64)
 * @param {string} props.className - Clases CSS adicionales
 */
export const UserAvatar = ({ image, gender, name, size = 64, className = '' }) => {
    if (image) {
        return (
            <img
                src={image}
                alt={name || 'Usuario'}
                className={`w-full h-full object-cover ${className}`}
            />
        );
    }

    // Colores basados en género
    const getGenderColor = () => {
        switch (gender) {
            case 'male':
                return 'text-blue-400';
            case 'female':
                return 'text-pink-400';
            default:
                return 'text-gray-400';
        }
    };

    return (
        <UserCircle
            size={size}
            className={`${getGenderColor()} ${className}`}
        />
    );
};

/**
 * SmallUserAvatar - Avatar pequeño para header y listas
 * Muestra la imagen o la inicial del nombre con color basado en género
 */
export const SmallUserAvatar = ({ image, gender, name, className = '' }) => {
    if (image) {
        return (
            <img
                src={image}
                alt=""
                className={`w-full h-full object-cover ${className}`}
            />
        );
    }

    // Colores de fondo basados en género
    const getBgColor = () => {
        switch (gender) {
            case 'male':
                return 'bg-blue-100 text-blue-700';
            case 'female':
                return 'bg-pink-100 text-pink-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className={`w-full h-full flex items-center justify-center font-bold ${getBgColor()} ${className}`}>
            {name ? name.charAt(0).toUpperCase() : 'U'}
        </div>
    );
};

export default UserAvatar;
