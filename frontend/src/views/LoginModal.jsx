import React, { useState } from 'react';
import { X, Lock, User, AlertCircle } from 'lucide-react';
import { Button, FormField } from '../components/ui';
import { api } from '../services/api';

const LoginModal = ({ setCurrentView, handleLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const user = await api.auth.login(email, password);
            // handleLogin now expects the full user object, not just a role string
            handleLogin(user);
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative animate-fadeInUp">
                <button onClick={() => setCurrentView('home')} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
                    <p className="text-gray-600 mt-2">Accede a tu cuenta de SIMR 2026</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario / Email</label>
                        <div className="relative">
                            <FormField
                                type="text"
                                placeholder="admin"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                required
                            />
                            <User className="absolute left-3 top-3 text-gray-400" size={18} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <div className="relative">
                            <FormField
                                type="password"
                                placeholder="••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10"
                                required
                            />
                            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                        </div>
                    </div>

                    <Button type="submit" className="w-full justify-center bg-blue-900 hover:bg-blue-800" disabled={loading}>
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Credenciales de prueba:</p>
                    <p className="font-mono mt-1">Usuario: admin / Pass: admin</p>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
