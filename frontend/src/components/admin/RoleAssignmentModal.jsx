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
        { id: 'admin', label: 'Organización', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-100' },
        { id: 'secretary', label: 'Secretaría', icon: User, color: 'text-pink-600', bg: 'bg-pink-100' },
        { id: 'academic', label: 'Académica', icon: BookOpen, color: 'text-blue-700', bg: 'bg-blue-200' },
        { id: 'admission', label: 'Asistencia', icon: Users, color: 'text-teal-700', bg: 'bg-teal-200' },
        { id: 'jury', label: 'Jurado', icon: Award, color: 'text-amber-600', bg: 'bg-amber-100' },
        { id: 'treasurer', label: 'Contabilidad', icon: DollarSign, color: 'text-emerald-700', bg: 'bg-emerald-200' },
        { id: 'participant', label: 'Aula Virtual', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { id: 'resident', label: 'Trabajos', icon: User, color: 'text-cyan-600', bg: 'bg-cyan-100' },
        { id: 'superadmin', label: 'Super Admin', icon: Shield, color: 'text-red-600', bg: 'bg-red-100' },
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
