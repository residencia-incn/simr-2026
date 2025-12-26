import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface PermissionGateProps {
    scopes: string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
    requireAll?: boolean; // If true, requires all scopes. If false (default helper uses logic usually), checking 'scopes' usually implies we need these. Let's make it configurable or default to "has all" for strictness? The user prompt said: "Scopes (permissions), NOT just role names". 
    // Often gates are OR (any of these roles) or AND (all of these permissions). 
    // Let's implement behavior: if multiple scopes provided, require ALL by default unless specified otherwise? 
    // Actually, standard RBAC gates often treat array as "Required Permissions". So "has all".
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
    scopes,
    children,
    fallback = null,
    requireAll = true
}) => {
    const { hasAllPermissions, hasAnyPermission } = useAuth();

    const hasAccess = requireAll ? hasAllPermissions(scopes) : hasAnyPermission(scopes);

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
