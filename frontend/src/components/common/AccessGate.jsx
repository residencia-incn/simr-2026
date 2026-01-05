import React from 'react';
import { useAccessControl } from '../../hooks/useAccessControl';
import { Lock } from 'lucide-react';

/**
 * Component to gate access to children based on entitlements.
 * @param {object} props
 * @param {string | string[]} props.requiredItems - IDs required to view content.
 * @param {boolean} props.any - If true, requires ANY of the items. Default FALSE (requires ALL).
 * @param {React.ReactNode} props.fallback - Content to show if access is denied. Default: Simple Lock message.
 * @param {React.ReactNode} props.children - Protected content.
 */
const AccessGate = ({ requiredItems, any = false, fallback, children }) => {
    const { hasAccess } = useAccessControl(requiredItems, { any });

    if (hasAccess) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    // Default Fallback
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">Contenido Restringido</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
                No tienes acceso a esta sección. Por favor revisa tus inscripciones o mejora tu plan.
            </p>
        </div>
    );
};

export default AccessGate;
