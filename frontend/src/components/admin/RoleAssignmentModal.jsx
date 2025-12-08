import React, { useState, useEffect } from 'react';
import { X, Save, User, Award, Shield, DollarSign, BookOpen, Users } from 'lucide-react';
import { Button } from '../ui';

const RoleAssignmentModal = ({ user, isOpen, onClose, onSave }) => {
    const [selectedRoles, setSelectedRoles] = useState([]);

    useEffect(() => {
        if (user && user.roles) {
            setSelectedRoles([...user.roles]);
        } else if (user && user.role) {
            // Fallback for legacy single-role users
            setSelectedRoles([user.role.toLowerCase()]);
        }
    }, [user]);

    const availableRoles = [
        { id: 'participant', label: 'Soy Asistente', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { id: 'resident', label: 'Soy Residente', icon: User, color: 'text-blue-600', bg: 'bg-blue-100' },
        { id: 'jury', label: 'Soy Jurado', icon: Award, color: 'text-purple-600', bg: 'bg-purple-100' },
        { id: 'academic', label: 'Soy Académico', icon: BookOpen, color: 'text-blue-700', bg: 'bg-blue-200' },
        { id: 'admin', label: 'Comité Organizador', icon: Users, color: 'text-gray-700', bg: 'bg-gray-200' },
        { id: 'treasurer', label: 'Soy Tesorero', icon: DollarSign, color: 'text-emerald-700', bg: 'bg-emerald-200' },
        { id: 'admission', label: 'Soy Admisión', icon: Users, color: 'text-teal-700', bg: 'bg-teal-200' },
        { id: 'superadmin', label: 'Soy Administrador', icon: Shield, color: 'text-red-600', bg: 'bg-red-100' },
    ];

    const toggleRole = (roleId) => {
        setSelectedRoles(prev =>
            prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
        );
    };

    const handleSave = () => {
        onSave({ ...user, roles: selectedRoles });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-fadeInUp">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>

                <h2 className="text-xl font-bold text-gray-900 mb-1">Gestión de Roles</h2>
                <p className="text-sm text-gray-500 mb-6">Configura los perfiles de acceso para {user.name}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-h-[60vh] overflow-y-auto">
                    {availableRoles.map((role) => {
                        const Icon = role.icon;
                        const isSelected = selectedRoles.includes(role.id);
                        return (
                            <button
                                key={role.id}
                                onClick={() => toggleRole(role.id)}
                                className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left
                                    ${isSelected
                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                            >
                                <div className={`p-2 rounded-full ${role.bg} ${role.color}`}>
                                    <Icon size={18} />
                                </div>
                                <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                    {role.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                        <Save size={18} /> Guardar Cambios
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RoleAssignmentModal;
