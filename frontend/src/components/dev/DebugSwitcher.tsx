import React from 'react';
import { useAuth, User } from '../../context/AuthContext';
import { Shield, User as UserIcon, Settings, Users } from 'lucide-react';
import Button from '../ui/Button'; // Assuming we have a UI Button component

export const DebugSwitcher = () => {
    const { login, user } = useAuth();

    const MOCK_USERS: Record<string, User> = {
        SUPER_ADMIN: {
            name: "Super Admin",
            role: "ADMIN",
            permissions: ["accounting:read", "accounting:write", "classroom:read", "classroom:write", "papers:read", "papers:write", "users:manage"],
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
        },
        TESORERO_R2: {
            name: "Dr. Tesorero (R2)",
            role: "R2_TESORERO",
            permissions: ["accounting:read", "accounting:write", "classroom:read"],
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tesorero"
        },
        R1_RESIDENT: {
            name: "Dr. Residente (R1)",
            role: "R1_RESIDENTE",
            permissions: ["papers:submit", "papers:read", "classroom:read"],
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=R1"
        },
        EXTERNAL: {
            name: "Visitante Externo",
            role: "EXTERNAL",
            permissions: ["classroom:read"],
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=External"
        }
    };

    return (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-xl shadow-2xl border border-gray-200 z-50 w-80">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <Shield size={18} className="text-purple-600" />
                <h3 className="font-bold text-sm text-gray-800">Debug Access Control</h3>
            </div>

            <div className="space-y-2">
                <div className="text-xs text-gray-500 mb-2">
                    Current: <span className="font-bold text-gray-800">{user ? user.role : 'Guest'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => login(MOCK_USERS.SUPER_ADMIN)}
                        className={`p-2 text-xs rounded border transition-all text-left flex items-center gap-2
               ${user?.role === 'ADMIN' ? 'bg-purple-100 border-purple-300 ring-1 ring-purple-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                    >
                        <Settings size={14} /> Admin
                    </button>

                    <button
                        onClick={() => login(MOCK_USERS.TESORERO_R2)}
                        className={`p-2 text-xs rounded border transition-all text-left flex items-center gap-2
               ${user?.role === 'R2_TESORERO' ? 'bg-blue-100 border-blue-300 ring-1 ring-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                    >
                        <Users size={14} /> Tesorero R2
                    </button>

                    <button
                        onClick={() => login(MOCK_USERS.R1_RESIDENT)}
                        className={`p-2 text-xs rounded border transition-all text-left flex items-center gap-2
               ${user?.role === 'R1_RESIDENTE' ? 'bg-green-100 border-green-300 ring-1 ring-green-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                    >
                        <UserIcon size={14} /> R1 Resident
                    </button>

                    <button
                        onClick={() => login(MOCK_USERS.EXTERNAL)}
                        className={`p-2 text-xs rounded border transition-all text-left flex items-center gap-2
               ${user?.role === 'EXTERNAL' ? 'bg-orange-100 border-orange-300 ring-1 ring-orange-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                    >
                        <UserIcon size={14} /> External
                    </button>
                </div>
            </div>
        </div>
    );
};
