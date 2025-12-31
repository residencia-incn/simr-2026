import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { storage } from '../services/storage';

// Define the User type
export interface User {
    id?: string | number;
    name: string;
    email?: string;
    avatar?: string;

    // Event Role (función en el evento)
    eventRole: 'asistente' | 'organizador' | 'jurado' | 'ponente';

    // Organizer Function (solo para organizadores)
    organizerFunction?: 'tesorero' | 'secretaria' | 'investigacion' | 'academico' | 'admin' | 'asistencia';

    // Payment status (solo para asistentes)
    hasPaid?: boolean;
    modality?: 'virtual' | 'presencial' | 'presencial_certificado';

    // Modules (áreas de acceso)
    modules: string[];

    // Permissions (scopes granulares)
    permissions: string[];

    // Legacy support
    role?: string;
    roles?: string[];
    profiles?: string[];
}

// Define the Context type
interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    hasPermission: (scope: string) => boolean;
    hasAllPermissions: (scopes: string[]) => boolean;
    hasAnyPermission: (scopes: string[]) => boolean;
    hasModule: (module: string) => boolean;
    updateUserPermissions: (permissions: string[]) => void;
}

// MODULE PERMISSIONS MAPPING
export const MODULE_PERMISSIONS: Record<string, string[]> = {
    // Módulos básicos
    'mi_perfil': ['profile:read', 'profile:write'],
    'aula_virtual': ['classroom:read'],
    'trabajos': ['papers:submit', 'papers:read'],

    // Módulos de gestión
    'secretaria': ['planning:read', 'planning:write', 'secretary:read'],
    'contabilidad': ['accounting:read', 'accounting:write'],
    'academico': ['academic:read', 'academic:write', 'papers:manage', 'jury:assign'],
    'investigacion': ['research:read', 'research:write', 'papers:read'],
    'jurado': ['jury:evaluate', 'jury:read', 'papers:grade'],
    'organizacion': ['admin:all', 'users:manage'],
    'asistencia': ['attendance:read', 'attendance:write']
};

// ROLE TO MODULES MAPPING
export const ROLE_MODULE_MAPPING: Record<string, any> = {
    'asistente': {
        base: ['mi_perfil'],
        conditional: {
            // Si pagó modalidad virtual o presencial+certificado
            hasPaid: ['aula_virtual']
        }
    },
    'organizador': {
        base: ['mi_perfil', 'aula_virtual', 'trabajos'],
        byFunction: {
            'tesorero': ['contabilidad'],
            'secretaria': ['secretaria'],
            'investigacion': ['investigacion'],
            'academico': ['academico'],
            'admin': ['organizacion'],
            'asistencia': ['asistencia']
        }
    },
    'jurado': {
        base: ['mi_perfil', 'jurado', 'aula_virtual']
    },
    'ponente': {
        base: ['mi_perfil', 'aula_virtual']
    }
};

// LEGACY ROLE PERMISSIONS (for backward compatibility)
export const LEGACY_ROLE_PERMISSIONS: Record<string, string[]> = {
    'organizacion': ['admin:all'],
    'admin': ['admin:all'],
    'contabilidad': ['accounting:read', 'accounting:write'],
    'treasurer': ['accounting:read', 'accounting:write'],
    'investigacion': ['research:read', 'research:write', 'papers:read'],
    'academico': ['academic:read', 'academic:write', 'papers:read'],
    'asistencia': ['attendance:read', 'attendance:write'],
    'trabajos': ['papers:read', 'papers:submit', 'papers:write'],
    'resident': ['papers:read', 'papers:submit'],
    'jurado': ['jury:read', 'jury:evaluate', 'papers:read'],
    'secretaria': ['secretary:read', 'planning:read', 'planning:write'],
    'aula_virtual': ['classroom:read'],
    'participant': ['classroom:read']
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to derive modules and permissions from user data
const deriveModulesAndPermissions = (userData: User): { modules: string[], permissions: string[] } => {
    let modules = new Set<string>();
    let permissions = new Set<string>();

    // Add explicit modules and permissions if they exist
    if (userData.modules) {
        userData.modules.forEach(m => modules.add(m));
    }
    if (userData.permissions) {
        userData.permissions.forEach(p => permissions.add(p));
    }

    // Derive from eventRole
    if (userData.eventRole) {
        const roleMapping = ROLE_MODULE_MAPPING[userData.eventRole];

        if (roleMapping) {
            // Add base modules
            roleMapping.base?.forEach((m: string) => modules.add(m));

            // Add conditional modules (for asistente)
            if (userData.eventRole === 'asistente' && userData.hasPaid) {
                roleMapping.conditional?.hasPaid?.forEach((m: string) => modules.add(m));
            }

            // Add function-specific modules (for organizador)
            if (userData.eventRole === 'organizador' && userData.organizerFunction) {
                const funcModules = roleMapping.byFunction?.[userData.organizerFunction];
                funcModules?.forEach((m: string) => modules.add(m));
            }
        }
    }

    // Legacy support: derive from profiles/roles
    if (userData.profiles && Array.isArray(userData.profiles)) {
        userData.profiles.forEach(profile => {
            modules.add(profile);
            const perms = LEGACY_ROLE_PERMISSIONS[profile] || [];
            perms.forEach(p => permissions.add(p));
        });
    }

    if (userData.roles && Array.isArray(userData.roles)) {
        userData.roles.forEach(role => {
            const perms = LEGACY_ROLE_PERMISSIONS[role] || [];
            perms.forEach(p => permissions.add(p));
        });
    }

    if (userData.role) {
        // Add legacy role as a module if it makes sense (or map it)
        // Most legacy roles map directly to module names (e.g., 'contabilidad', 'organizacion')
        // Special case for 'admin' -> 'organizacion'
        if (userData.role === 'admin') {
            modules.add('organizacion');
        } else {
            modules.add(userData.role);
        }

        const perms = LEGACY_ROLE_PERMISSIONS[userData.role] || [];
        perms.forEach(p => permissions.add(p));
    }

    // Convert modules to permissions
    Array.from(modules).forEach(module => {
        const modulePerms = MODULE_PERMISSIONS[module] || [];
        modulePerms.forEach(p => permissions.add(p));
    });

    return {
        modules: Array.from(modules),
        permissions: Array.from(permissions)
    };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    // Load from local storage on mount
    useEffect(() => {
        const storedUser = storage.get('simr_user');
        if (storedUser) {
            // Hydrate modules and permissions if missing
            if (!storedUser.modules || !storedUser.permissions) {
                const { modules, permissions } = deriveModulesAndPermissions(storedUser);
                const hydratedUser = { ...storedUser, modules, permissions };
                setUser(hydratedUser);
            } else {
                setUser(storedUser);
            }
        }
    }, []);

    const login = (userData: User) => {
        // Calculate modules and permissions on login
        const { modules, permissions } = deriveModulesAndPermissions(userData);
        const fullUser = { ...userData, modules, permissions };

        setUser(fullUser);
        storage.set('simr_user', fullUser);
    };

    const logout = () => {
        setUser(null);
        storage.remove('simr_user');
        storage.remove('simr_active_role');
    };

    const updateUserPermissions = async (newPermissions: string[]) => {
        if (!user) return;
        const updatedUser = { ...user, permissions: newPermissions };
        setUser(updatedUser);
        storage.set('simr_user', updatedUser);

        // Persist to backend
        if (user.id) {
            try {
                await api.users.update({ ...user, permissions: newPermissions });
            } catch (error) {
                console.error('Failed to update user permissions:', error);
            }
        }
    };

    const hasPermission = (scope: string): boolean => {
        if (!user || !user.permissions) return false;
        if (user.permissions.includes('admin:all')) return true;
        return user.permissions.includes(scope);
    };

    const hasAllPermissions = (scopes: string[]): boolean => {
        if (!user || !user.permissions) return false;
        if (user.permissions.includes('admin:all')) return true;
        return scopes.every(scope => user.permissions!.includes(scope));
    };

    const hasAnyPermission = (scopes: string[]): boolean => {
        if (!user || !user.permissions) return false;
        if (user.permissions.includes('admin:all')) return true;
        return scopes.some(scope => user.permissions!.includes(scope));
    };

    const hasModule = (module: string): boolean => {
        if (!user || !user.modules) return false;
        return user.modules.includes(module);
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            hasPermission,
            hasAllPermissions,
            hasAnyPermission,
            hasModule,
            updateUserPermissions
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
