import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    // Unique key per user to isolate carts (fixes shared cart issue)
    const cartKey = user ? `simr_cart_${user.id}` : 'simr_cart_guest';

    const [cartItems, setCartItems] = useState(() => {
        return storage.get(cartKey, []);
    });
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load cart when user changes
    useEffect(() => {
        const savedCart = storage.get(cartKey, []);
        setCartItems(savedCart);
    }, [cartKey]);

    const addToCart = (item) => {
        setCartItems(prev => {
            if (prev.find(i => i.id === item.id)) return prev;
            const newCart = [...prev, item];
            storage.set(cartKey, newCart); // Manual save
            return newCart;
        });
        // setIsCartOpen(true); 
    };

    const removeFromCart = (itemId) => {
        setCartItems(prev => {
            const newCart = prev.filter(i => i.id !== itemId);
            storage.set(cartKey, newCart); // Manual save
            return newCart;
        });
    };

    const clearCart = () => {
        setCartItems([]);
        storage.set(cartKey, []); // Manual save
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
