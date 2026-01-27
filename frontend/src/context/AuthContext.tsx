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
    updateUser: (updates: Partial<User>) => Promise<void>;
    refreshProfile: () => Promise<void>;
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
        base: ['mi_perfil', 'jurado']
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
    'aula_virtual': ['classroom:read', 'virtual_access']
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to derive modules and permissions from user data
const deriveModulesAndPermissions = (userData: User): { modules: string[], permissions: string[] } => {
    let modules = new Set<string>();
    let permissions = new Set<string>();

    // PRIORITY 1: Use explicit modules if they exist (set by PermissionsModal)
    // Do NOT auto-derive from role if user has explicit modules assigned
    const hasExplicitModules = userData.modules && userData.modules.length > 0;

    if (hasExplicitModules) {
        // User has explicitly assigned modules - use them directly
        userData.modules.forEach(m => modules.add(m));

        // Add explicit permissions if they exist
        if (userData.permissions) {
            userData.permissions.forEach(p => permissions.add(p));
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
    }

    // No explicit modules - derive from eventRole (legacy/fallback behavior)
    if (userData.eventRole) {
        const roleKey = userData.eventRole.toLowerCase();
        const roleMapping = ROLE_MODULE_MAPPING[roleKey];

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

    // Add extra permissions for legacy flows
    if (userData.permissions) {
        userData.permissions.forEach(p => permissions.add(p));
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
        userData.roles.forEach(r => {
            const role = r.toLowerCase();
            if (role !== 'participant' && role !== 'organizador') {
                modules.add(role);
            }
            const perms = LEGACY_ROLE_PERMISSIONS[role] || [];
            perms.forEach(p => permissions.add(p));
        });
    }

    if (userData.role) {
        if (userData.role === 'admin') {
            modules.add('organizacion');
        } else {
            if (userData.role !== 'participant' && userData.role !== 'organizador') {
                modules.add(userData.role);
            }
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
            // 1. ALWAYS re-derive derived fields to fix stale/corrupt local state
            // This fixes cases where 'modules' in storage is out of sync with 'eventRole'
            const { modules, permissions } = deriveModulesAndPermissions(storedUser);
            const hydratedUser = { ...storedUser, modules, permissions };

            setUser(hydratedUser);
            storage.set('simr_user', hydratedUser); // Up-date storage immediately

            // 2. Background refresh from Server to ensure total sync
            if (hydratedUser.id) {
                api.users.getById(hydratedUser.id)
                    .then(freshUser => {
                        const { modules: freshModules, permissions: freshPerms } = deriveModulesAndPermissions(freshUser);
                        const fullUser = { ...freshUser, modules: freshModules, permissions: freshPerms };

                        // Only update if something changed to avoid unnecessary renders
                        if (JSON.stringify(fullUser) !== JSON.stringify(hydratedUser)) {
                            console.log('[Auth] Profile refreshed from server. Updating state.');
                            setUser(fullUser);
                            storage.set('simr_user', fullUser);
                        }
                    })
                    .catch(err => console.error('[Auth] Failed to refresh profile on mount:', err));
            }
        }

        // Listen for global logout events (triggered by 401s in client.js)
        const handleForceLogout = () => {
            logout();
        };
        window.addEventListener('auth:logout', handleForceLogout);

        return () => {
            window.removeEventListener('auth:logout', handleForceLogout);
        };
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

    const updateUser = async (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        storage.set('simr_user', updatedUser);

        // Persist to backend if needed
        if (user.id) {
            try {
                // api.users.update supports partial updates or full object
                await api.users.update(updatedUser);
            } catch (error) {
                console.error('Failed to update user:', error);
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

    const refreshProfile = async () => {
        if (!user || (!user.id && user.id !== 0)) return;
        try {
            // Fetch fresh data from backend
            const freshUser = await api.users.getById(user.id);

            // Re-calculate derived permissions logic
            const { modules, permissions } = deriveModulesAndPermissions(freshUser);
            const fullUser = { ...freshUser, modules, permissions };

            setUser(fullUser);
            storage.set('simr_user', fullUser);
            console.log("Profile refreshed successfully", fullUser.modules);
        } catch (error) {
            console.error('Failed to refresh user profile:', error);
        }
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
            updateUserPermissions,
            updateUser,
            refreshProfile
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
