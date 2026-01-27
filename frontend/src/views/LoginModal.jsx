import React, { useState } from 'react';
import { X, Lock, User, AlertCircle } from 'lucide-react';
import { Button, FormField } from '../components/ui';
import { api } from '../services/api';

const LoginModal = ({ setCurrentView, handleLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleEmailChange = (e) => {
        const value = e.target.value;
        // Search for a valid email within the text (handles "📧 test@email.com" or "Email: test@email.com")
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
        const match = value.match(emailRegex);

        if (match) {
            // If a full email is found, extract just the email
            setEmail(match[0]);
        } else {
            // While typing, strictly remove all whitespace (emails never have spaces)
            setEmail(value.replace(/\s/g, ''));
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const user = await api.auth.login({ email, password });
            // handleLogin now expects the full user object, not just a role string
            handleLogin(user);
        } catch (err) {
            // Personalizar mensaje para error 401 (No autorizado)
            if (err.response?.status === 401) {
                setError('Usuario o contraseña incorrectos');
            } else {
                setError(err.response?.data?.detail || err.message || 'Error al iniciar sesión');
            }
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
                                placeholder="usuario@email.com"
                                value={email}
                                onChange={handleEmailChange}
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

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-900 cursor-pointer"
                        />
                        <label htmlFor="rememberMe" className="text-sm text-gray-700 cursor-pointer select-none">
                            Mantener sesión iniciada (30 días)
                        </label>
                    </div>

                    <Button type="submit" className="w-full justify-center bg-blue-900 hover:bg-blue-800" disabled={loading}>
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Usa tus credenciales registradas para ingresar.</p>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
