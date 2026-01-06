import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../services/storage';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        return storage.get('simr_cart', []);
    });
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        storage.set('simr_cart', cartItems);
    }, [cartItems]);

    const addToCart = (item) => {
        setCartItems(prev => {
            if (prev.find(i => i.id === item.id)) return prev;
            return [...prev, item];
        });
        // setIsCartOpen(true); // Removed per user request to allow multiple adds
    };

    const removeFromCart = (itemId) => {
        setCartItems(prev => prev.filter(i => i.id !== itemId));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            cartTotal
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
