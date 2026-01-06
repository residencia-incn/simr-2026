import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ShoppingCart, Check, Loader, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';

import { useCart } from '../../context/CartContext.jsx';

const ProfileUpgrades = () => {
    const { user, updateUser } = useAuth();
    const { addToCart, removeFromCart, cartItems } = useCart();
    const [pricing, setPricing] = useState({ ticketTypes: [], workshops: [] });
    const [loading, setLoading] = useState(true);

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

    // Self-Healing / Migration Script for Legacy Data
    useEffect(() => {
        if (!user) return;

        let hasChanges = false;
        let newPurchased = [...(user.purchasedItems || [])];
        let newPending = [...(user.pendingItems || [])];
        let newModules = [...(user.modules || [])];
        let newTicketType = user.ticketType;

        // 1. Fix Legacy Code `t_1767220000003`
        if (newPurchased.includes('t_1767220000003')) {
            console.warn("Removing Legacy Item: t_1767220000003");
            newPurchased = newPurchased.filter(id => id !== 't_1767220000003');
            if (newTicketType === 't_1767220000003') newTicketType = null;
            hasChanges = true;
        }

        // 2. Clear Sticky Pending Items (If actually purchased/owned)
        // Also check against workshops and resolved modalities
        const ownedIds = new Set([...newPurchased, ...(user.workshops || []), user.ticketType]);
        const pendingCount = newPending.length;
        newPending = newPending.filter(id => !ownedIds.has(id));

        if (newPending.length !== pendingCount) hasChanges = true;

        // 3. Fix Duplicate Aula Virtual (Remove 'participant' if 'aula_virtual' exists)
        if (newModules.includes('aula_virtual') && newModules.includes('participant')) {
            newModules = newModules.filter(m => m !== 'participant');
            hasChanges = true;
        }

        if (hasChanges) {
            console.log("Applying Auto-Fixes to User Profile...");
            updateUser({
                purchasedItems: newPurchased,
                pendingItems: newPending,
                modules: newModules,
                ticketType: newTicketType
            });
        }
    }, [user, updateUser]);

    const handleAddToCart = (item) => {
        // Enforce Mutually Exclusive Modalities (Tickets)
        const isTicket = pricing.ticketTypes.some(t => t.id === item.id);

        if (isTicket) {
            // Check if another ticket is already in cart
            const existingTicket = cartItems.find(cartItem =>
                pricing.ticketTypes.some(t => t.id === cartItem.id)
            );

            if (existingTicket && existingTicket.id !== item.id) {
                // Remove the existing modality/ticket to enforce exclusivity
                removeFromCart(existingTicket.id);
            }
        }

        addToCart(item);
    };

    // Helper to resolve item details (Name, Title, etc.)
    const getItemDetails = (id) => {
        // 1. Try persisted user items (Gold Source - preserves snapshot data)
        const userItem = user?.items?.find(i => i.id === id);
        if (userItem) return userItem;

        // 2. Try global pricing config (Silver Source - for live catalog items)
        const catalogItem = [...pricing.ticketTypes, ...pricing.workshops].find(i => i.id === id);
        if (catalogItem) return catalogItem;

        // 3. Fallback
        return { id, name: id, title: id };
    };

    const { myModalities, myWorkshops } = React.useMemo(() => {
        const mods = new Set();
        const shops = new Set();

        // 1. Explicit Fields
        if (user?.ticketType) mods.add(user.ticketType);
        if (user?.workshops) user.workshops.forEach(w => shops.add(w));

        // 2. Scan purchasedItems for anything missed or legacy
        user?.purchasedItems?.forEach(id => {
            // Avoid duplicates if already added via explicit fields
            if (mods.has(id) || shops.has(id)) return;

            // Classification Heuristics
            const isWorkshopConfig = pricing.workshops.some(w => w.id === id);
            const isTicketConfig = pricing.ticketTypes.some(t => t.id === id);
            const looksLikeWorkshop = id.startsWith('w_') || id.toLowerCase().includes('taller');

            if (isWorkshopConfig || looksLikeWorkshop) {
                shops.add(id);
            } else if (isTicketConfig) {
                // STRICT RULE: If we already have a defined ticketType (active modality), ignore other tickets (legacy/superseded)
                if (!user.ticketType) {
                    mods.add(id);
                }
            } else {
                // Default fallback
                if (!user.ticketType) {
                    mods.add(id);
                }
            }
        });

        return {
            myModalities: Array.from(mods),
            myWorkshops: Array.from(shops)
        };
    }, [user, pricing]);

    // Used for filtering available options below
    const allPurchasedIds = React.useMemo(() => [...myModalities, ...myWorkshops], [myModalities, myWorkshops]);

    // Calculate the maximum price of currently owned modalities to prevent downgrades
    const currentMaxModalityPrice = React.useMemo(() => {
        let maxPrice = 0;
        myModalities.forEach(id => {
            const item = getItemDetails(id);
            // Try to find price in pricing config if not in item details (legacy)
            const price = parseFloat(item.price || pricing.ticketTypes.find(t => t.id === id)?.price || 0);
            if (!isNaN(price) && price > maxPrice) {
                maxPrice = price;
            }
        });
        return maxPrice;
    }, [myModalities, pricing, getItemDetails]); // Added dependencies

    // Filter out items already purchased AND items cheaper than current holding (Upgrade Logic)
    const availableWorkshops = pricing.workshops.filter(w => !allPurchasedIds.includes(w.id));
    const availableModalities = pricing.ticketTypes.filter(t => {
        const isNotOwned = !allPurchasedIds.includes(t.id);
        const isUpgradeOrEqual = parseFloat(t.price || 0) >= currentMaxModalityPrice;
        return isNotOwned && isUpgradeOrEqual;
    });

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando opciones...</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-900">Mejora tu Experiencia</h2>
                <p className="text-gray-500">Adquiere accesos a talleres exclusivos o modalidades adicionales.</p>
            </div>

            {/* My Current Access (Redesigned) */}
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                <h3 className="text-base font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Mis Accesos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Modalities Column */}
                    <div className="bg-white/50 rounded-lg p-3 border border-blue-100/50">
                        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 border-b border-blue-100 pb-1">Modalidades</h4>
                        <div className="flex flex-wrap gap-2">
                            {myModalities.length > 0 ? myModalities.map(id => {
                                const item = getItemDetails(id);
                                return (
                                    <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-700 shadow-sm">
                                        <Check className="w-3.5 h-3.5" />
                                        {item.title || item.name || id}
                                    </span>
                                );
                            }) : (
                                <span className="text-xs text-gray-400 italic">Sin modalidades activas.</span>
                            )}
                        </div>
                    </div>

                    {/* Workshops Column */}
                    <div className="bg-white/50 rounded-lg p-3 border border-blue-100/50">
                        <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-3 border-b border-purple-100 pb-1">Talleres</h4>
                        <div className="flex flex-col gap-2">
                            {myWorkshops.length > 0 ? myWorkshops.map(id => {
                                const item = getItemDetails(id);
                                return (
                                    <div key={id} className="flex items-center gap-2 px-3 py-2 bg-white border border-purple-100 rounded-lg shadow-sm">
                                        <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                                            <Check className="w-3.5 h-3.5 text-purple-600" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">
                                            {item.name || item.title || id}
                                        </span>
                                    </div>
                                );
                            }) : (
                                <span className="text-xs text-gray-400 italic">Sin talleres inscritos.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Available Workshops */}
            {availableWorkshops.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-l-4 border-purple-600 pl-3">Talleres Disponibles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableWorkshops.map(workshop => {
                            const isInCart = cartItems.some(i => i.id === workshop.id);
                            const isPending = user?.pendingItems?.includes(workshop.id);
                            return (
                                <div key={workshop.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-900">{workshop.name}</h4>
                                            <p className="text-xs text-purple-600 font-medium">{workshop.date || 'Fecha por confirmar'}</p>
                                        </div>
                                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">S/ {workshop.price}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{workshop.description}</p>

                                    {isPending ? (
                                        <Button className="w-full justify-center bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200 cursor-default" size="sm" disabled>
                                            Pendiente Validación
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full justify-center"
                                            size="sm"
                                            onClick={() => handleAddToCart(workshop)}
                                            disabled={isInCart}
                                            variant={isInCart ? 'secondary' : 'primary'}
                                        >
                                            {isInCart ? (
                                                <>
                                                    <Check className="w-4 h-4 mr-2" />
                                                    En el Carrito
                                                </>
                                            ) : (
                                                <>
                                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                                    Agregar al Carrito
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Available Modalities (Upgrades) */}
            {availableModalities.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-l-4 border-indigo-600 pl-3">Otras Modalidades</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="space-y-3">
                            {availableModalities.map(modality => {
                                const isInCart = cartItems.some(i => i.id === modality.id);
                                const isPending = user?.pendingItems?.includes(modality.id);
                                return (
                                    <div key={modality.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                                        <div>
                                            <h4 className="font-semibold text-gray-800">{modality.title}</h4>
                                            <p className="text-xs text-gray-500">{modality.description}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-900">S/ {modality.price}</span>
                                            {isPending ? (
                                                <Button size="sm" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200 cursor-default" disabled>
                                                    Pendiente Validación
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant={isInCart ? 'secondary' : 'outline'}
                                                    size="sm"
                                                    onClick={() => handleAddToCart(modality)}
                                                    disabled={isInCart}
                                                >
                                                    {isInCart ? <Check className="w-3 h-3" /> : 'Agregar'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileUpgrades;
