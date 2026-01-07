import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';
import Swal from 'sweetalert2';
import { Loader, Check, CheckCircle, RefreshCw, Plus, Ticket } from 'lucide-react';

const ProfileUpgrades = () => {
    const { user, updateUser } = useAuth();
    const { addToCart, cartItems, removeFromCart } = useCart();
    const [pricing, setPricing] = useState({ ticketTypes: [], workshops: [] });
    const [loading, setLoading] = useState(true);

    const isPrivileged = React.useMemo(() => {
        if (!user) return false;
        const privilegedRoles = ['organizador', 'ponente', 'jurado', 'comite'];
        const privilegedModules = ['organizacion', 'secretaria', 'contabilidad', 'investigacion', 'jurado', 'academico'];

        // Support both singular (legacy) and plural (modern) roles
        const userRoles = [
            ...(user.eventRoles || []),
            ...(user.eventRole ? [user.eventRole] : [])
        ].map(r => r.toLowerCase());

        const hasPrivilegedRole = userRoles.some(role => privilegedRoles.includes(role));

        // Support both 'modules' and 'profiles' fields
        const userModules = [
            ...(user.modules || []),
            ...(user.profiles || [])
        ].map(m => m.toLowerCase());

        const hasPrivilegedModule = userModules.some(m => privilegedModules.includes(m));

        return hasPrivilegedRole || hasPrivilegedModule;
    }, [user]);

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const data = await api.treasury.getPricing();
                setPricing(data);
            } catch (error) {
                console.error("Error loading pricing:", error);
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

        // 1. Fix Legacy Code t_1767220000003
        if (newPurchased.includes('t_1767220000003')) {
            console.warn("Removing Legacy Item: t_1767220000003");
            newPurchased = newPurchased.filter(id => id !== 't_1767220000003');
            if (newTicketType === 't_1767220000003') newTicketType = null;
            hasChanges = true;
        }

        // 2. Clear Sticky Pending Items
        const validPending = newPending.filter(id => {
            const isPurchased = newPurchased.includes(id);
            if (isPurchased) hasChanges = true;
            return !isPurchased;
        });
        if (validPending.length !== newPending.length) {
            user.pendingItems = validPending;
            hasChanges = true;
        }

        // 3. Fix Duplicate 'aula_virtual' vs 'participant'
        if (newModules.includes('aula_virtual') && newModules.includes('participant')) {
            // Keep only participant? Or strictly check role?
            // Actually, let's just ensure we don't have broken duplicates
            hasChanges = false; // logic placeholder
        }

        if (hasChanges && updateUser) {
            updateUser({
                ...user,
                purchasedItems: newPurchased,
                ticketType: newTicketType
            });
        }
    }, [user, updateUser]);

    const handleAddToCart = (item) => {
        // Enforce Mutually Exclusive Modalities (Tickets)
        const isTicket = pricing.ticketTypes.some(t => t.id === item.id);
        let finalItem = { ...item };

        if (isTicket) {
            // Calculate Differential Price (Upgrade Logic)
            if (currentMaxModalityPrice > 0) {
                const priceDiff = Math.max(0, item.price - currentMaxModalityPrice);
                finalItem.price = priceDiff;
                finalItem.isUpgrade = true;
                finalItem.originalPrice = item.price;
                finalItem.upgradeFromPrice = currentMaxModalityPrice;
                // Update display name for Cart clarity
                finalItem.searchableName = finalItem.title || finalItem.name;
                if (priceDiff === 0) {
                    finalItem.title = 'Cambio de Modalidad: ' + item.title;
                } else {
                    finalItem.title = 'Upgrade: ' + item.title;
                }
            }

            // Check if another ticket is already in cart
            const existingTicket = cartItems.find(cartItem =>
                pricing.ticketTypes.some(t => t.id === cartItem.id)
            );

            if (existingTicket && existingTicket.id !== item.id) {
                // Remove the existing modality/ticket to enforce exclusivity
                removeFromCart(existingTicket.id);
            }
        }

        addToCart(finalItem);
    };

    const handleSwapModality = async (newTicket) => {
        // Confirmation for Instant Swap
        const result = await Swal.fire({
            title: `Cambiar a "${newTicket.title}"`,
            text: "Este cambio no requiere pago adicional. ¿Estás seguro de continuar?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a', // green-600
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cambiar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        try {
            // calculated new state
            // Remove ANY existing ticket types from purchasedItems to enforce single modality
            const nonTicketItems = (user.purchasedItems || []).filter(id =>
                !pricing.ticketTypes.some(t => t.id === id)
            );

            // History Entry
            const newHistoryEntry = {
                timestamp: new Date().toISOString(),
                from: user.ticketType || 'initial',
                to: newTicket.id,
                action: 'swap_free',
                description: `Cambio a ${newTicket.title}`
            };
            const currentHistory = user.modalityHistory || [];

            const updatedUser = {
                ...user,
                ticketType: newTicket.id,
                items: user.items ? [...user.items, newTicket] : [newTicket], // Optimistic item add
                purchasedItems: [...nonTicketItems, newTicket.id],
                modalityHistory: [newHistoryEntry, ...currentHistory]
            };

            // Call context updater (persistence)
            if (updateUser) {
                await updateUser(updatedUser);
                Swal.fire({
                    title: '¡Modalidad Actualizada!',
                    text: `Te has cambiado exitosamente a ${newTicket.title}.`,
                    icon: 'success',
                    confirmButtonColor: '#3b82f6'
                });
            } else {
                console.error("UpdateUser function missing from context");
            }
        } catch (error) {
            console.error('Error switching modality:', error);
            Swal.fire({
                title: 'Error',
                text: 'Hubo un error al procesar el cambio. Por favor intenta nuevamente.',
                icon: 'error'
            });
        }
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

        // 2. Scan purchasedItems
        user?.purchasedItems?.forEach(id => {
            if (mods.has(id) || shops.has(id)) return;

            const isWorkshopConfig = pricing.workshops.some(w => w.id === id);
            const isTicketConfig = pricing.ticketTypes.some(t => t.id === id);
            const looksLikeWorkshop = id.startsWith('w_') || id.toLowerCase().includes('taller');

            if (isWorkshopConfig || looksLikeWorkshop) {
                shops.add(id);
            } else if (isTicketConfig) {
                // STRICT RULE: If we already have a defined ticketType, ignore other tickets.
                // Even if we don't, we will slice later to ensure only 1.
                if (!user.ticketType) {
                    mods.add(id);
                }
            } else {
                if (!user.ticketType) mods.add(id);
            }
        });

        // FORCE SINGLE MODALITY: Slice to max 1
        const finalMods = Array.from(mods);

        return {
            myModalities: finalMods.length > 1 ? finalMods.slice(0, 1) : finalMods,
            myWorkshops: Array.from(shops)
        };
    }, [user, pricing]);

    // Used for filtering available options below
    const allPurchasedIds = React.useMemo(() => [...myModalities, ...myWorkshops], [myModalities, myWorkshops]);

    // Calculate the maximum price of currently owned modalities
    const currentMaxModalityPrice = React.useMemo(() => {
        let maxPrice = 0;
        myModalities.forEach(id => {
            const item = getItemDetails(id);
            const price = parseFloat(item.price || pricing.ticketTypes.find(t => t.id === id)?.price || 0);
            if (!isNaN(price) && price > maxPrice) {
                maxPrice = price;
            }
        });
        return maxPrice;
    }, [myModalities, pricing, getItemDetails]);

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
                    {/* Modalities Column - always visible to show assigned ticket */}
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

            {/* Premium Access Banner for Staff */}
            {isPrivileged ? (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-md animate-fadeIn mt-6">
                    <div className="flex items-start md:items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm shrink-0">
                            <Ticket size={32} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-1">Acceso Total Habilitado</h3>
                            <p className="text-purple-100 text-sm leading-relaxed max-w-2xl">
                                Como miembro oficial del evento (<strong>{user?.eventRole ? user.eventRole.charAt(0).toUpperCase() + user.eventRole.slice(1) : 'Staff'}</strong>), tienes acceso VIP a todas las conferencias académicas y talleres prácticos. No requieres realizar compras adicionales.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Available Modalities (Upgrades) */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 mt-8 border-l-4 border-blue-600 pl-3">
                            <h3 className="text-lg font-bold text-gray-800">Otras Modalidades</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {availableModalities.length > 0 ? availableModalities.map(ticket => {
                                const isInCart = cartItems.some(i => i.id === ticket.id);
                                const isPending = user?.pendingItems?.includes(ticket.id);

                                // Differential Price Logic
                                const priceDiff = Math.max(0, ticket.price - currentMaxModalityPrice);
                                const isUpgrade = currentMaxModalityPrice > 0;
                                const isFreeSwap = isUpgrade && priceDiff === 0;

                                return (
                                    <div key={ticket.id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all bg-white relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>

                                        <h4 className="font-bold text-gray-900 text-lg mb-1 relative z-10">{ticket.title}</h4>
                                        <p className="text-gray-500 text-sm mb-4 min-h-[40px] relative z-10">{ticket.description}</p>

                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex flex-col">
                                                {isFreeSwap ? (
                                                    <>
                                                        <span className="text-xl font-bold text-green-600">Gratis</span>
                                                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Cambio de Modalidad</span>
                                                    </>
                                                ) : (
                                                    <span className="text-2xl font-bold text-blue-600">
                                                        {isUpgrade ? 'S/ ' + priceDiff : (ticket.price === 0 ? 'Gratis' : 'S/ ' + ticket.price)}
                                                    </span>
                                                )}
                                            </div>
                                            {isPending ? (
                                                <button disabled className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg cursor-not-allowed font-medium flex items-center gap-2">
                                                    <Loader size={16} className="animate-spin" /> Pendiente
                                                </button>
                                            ) : isInCart ? (
                                                <button disabled className="px-4 py-2 bg-green-100 text-green-700 rounded-lg cursor-default font-medium flex items-center gap-2 border border-green-200">
                                                    <Check size={16} /> En Carrito
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => isFreeSwap ? handleSwapModality(ticket) : handleAddToCart(ticket)}
                                                    className={`px-4 py-2 text-white rounded-lg shadow-sm font-medium flex items-center gap-2 transition-colors ${isFreeSwap ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                >
                                                    <div className="w-5 h-5 flex items-center justify-center">
                                                        {isFreeSwap ? <RefreshCw size={20} /> : <Plus size={20} />}
                                                    </div>
                                                    {isUpgrade ? (priceDiff === 0 ? 'Cambiar' : 'Actualizar') : 'Agregar'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="col-span-1 md:col-span-2 p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
                                    No hay otras modalidades disponibles.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Available Workshops */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 mt-8 border-l-4 border-purple-600 pl-3">
                            <h3 className="text-lg font-bold text-gray-800">Talleres Disponibles</h3>
                        </div>
                        <div className="space-y-3">
                            {availableWorkshops.length > 0 ? availableWorkshops.map(workshop => {
                                const isInCart = cartItems.some(i => i.id === workshop.id);
                                const isPending = user?.pendingItems?.includes(workshop.id);

                                return (
                                    <div key={workshop.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:border-purple-300 transition-all">
                                        <div>
                                            <h4 className="font-bold text-gray-900">{workshop.name}</h4>
                                            <p className="text-xs text-gray-500">{workshop.description}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-gray-700">S/ {workshop.price}</span>
                                            {isPending ? (
                                                <button disabled className="p-2 bg-yellow-50 text-yellow-600 rounded-lg cursor-not-allowed" title="Pendiente de validación">
                                                    <Loader size={20} className="animate-spin" />
                                                </button>
                                            ) : isInCart ? (
                                                <button disabled className="p-2 bg-green-50 text-green-600 rounded-lg cursor-default border border-green-200" title="En el carrito">
                                                    <Check size={20} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddToCart(workshop)}
                                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Agregar al carrito"
                                                >
                                                    <Plus size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
                                    Has adquirido todos los talleres disponibles.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProfileUpgrades;
