import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ShoppingCart, Check, Loader } from 'lucide-react';
import Button from '../ui/Button';

const ProfileUpgrades = () => {
    const { user, updateUser } = useAuth();
    const [pricing, setPricing] = useState({ ticketTypes: [], workshops: [] });
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const data = await api.treasury.getPricing();
                setPricing(data);
            } catch (error) {
                console.error("Error fetching pricing", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPricing();
    }, []);

    const handlePurchase = async (item) => {
        setProcessingId(item.id);

        // SIMULATE PAYMENT PROCESS
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Update User Entitlements
        const currentItems = user.purchasedItems || [];
        const updatedItems = [...currentItems, item.id];

        // Also update eventRoles/profiles if needed based on the item type?
        // For simplicity, we just track the item ID now as per the new logic.
        // But if they buy "Virtual", they should get "aula_virtual" profile access.

        const updates = { purchasedItems: updatedItems };

        if (item.id === 'virtual' || item.id === 'presencial_cert') {
            // Add logic to grant virtual profile if purchasing virtual access
            const currentProfiles = user.profiles || [];
            if (!currentProfiles.includes('aula_virtual')) {
                updates.profiles = [...currentProfiles, 'aula_virtual'];
            }
        }

        await updateUser(updates);
        setProcessingId(null);
    };

    const purchasedItems = React.useMemo(() => {
        const items = new Set([
            ...(user?.purchasedItems || []),
            ...(user?.workshops || []),
            // Should we also add 'presencial', 'virtual' etc based on user.modality? 
            // Probably yes, to show the main ticket as an "Access" too.
            ...(user?.modality ? [user.modality.toLowerCase()] : []),
            ...(user?.ticketType ? [user.ticketType] : [])
        ]);
        return Array.from(items);
    }, [user]);

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando opciones...</div>;



    // Filter out items already purchased
    const availableWorkshops = pricing.workshops.filter(w => !purchasedItems.includes(w.id));

    // Logic for modalities: You usually upgrade, not buy "another" one. 
    // If I have 'presencial', I might want 'virtual' add-on if it's separate, 
    // or upgrade to 'presencial_cert'. 
    // For now, let's just show what they DON'T have.
    const availableModalities = pricing.ticketTypes.filter(t => !purchasedItems.includes(t.id));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-900">Mejora tu Experiencia</h2>
                <p className="text-gray-500">Adquiere accesos a talleres exclusivos o modalidades adicionales.</p>
            </div>

            {/* My Current Access */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-bold text-blue-900 mb-3">Tus Accesos Activos</h3>
                <div className="flex flex-wrap gap-2">
                    {purchasedItems.length > 0 ? purchasedItems.map(itemId => {
                        // Find label
                        const item = [...pricing.ticketTypes, ...pricing.workshops].find(i => i.id === itemId);
                        return (
                            <span key={itemId} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-medium text-blue-700 shadow-sm">
                                <Check className="w-3 h-3" />
                                {item ? (item.title || item.name) : itemId}
                            </span>
                        );
                    }) : (
                        <span className="text-sm text-blue-700 italic">No tienes inscripciones activas.</span>
                    )}
                </div>
            </div>

            {/* Available Workshops */}
            {availableWorkshops.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-l-4 border-purple-600 pl-3">Talleres Disponibles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableWorkshops.map(workshop => (
                            <div key={workshop.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-gray-900">{workshop.name}</h4>
                                        <p className="text-xs text-purple-600 font-medium">{workshop.date || 'Fecha por confirmar'}</p>
                                    </div>
                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">S/ {workshop.price}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{workshop.description}</p>
                                <Button
                                    className="w-full justify-center"
                                    size="sm"
                                    onClick={() => handlePurchase(workshop)}
                                    disabled={!!processingId}
                                >
                                    {processingId === workshop.id ? (
                                        <Loader className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <ShoppingCart className="w-4 h-4 mr-2" />
                                            Agregar al Carrito
                                        </>
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Available Modalities (Upgrades) */}
            {availableModalities.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-l-4 border-indigo-600 pl-3">Otras Modalidades</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="space-y-3">
                            {availableModalities.map(modality => (
                                <div key={modality.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{modality.title}</h4>
                                        <p className="text-xs text-gray-500">{modality.description}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-gray-900">S/ {modality.price}</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePurchase(modality)}
                                            disabled={!!processingId}
                                        >
                                            {processingId === modality.id ? <Loader className="w-3 h-3 animate-spin" /> : 'Agregar'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileUpgrades;
