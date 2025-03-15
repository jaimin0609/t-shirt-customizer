// Get React from the global scope if available or import it
const React = window.React || React; // Try global first

// Use an IIFE to handle async imports if needed
(function initializeModule() {
    if (!window.React) {
        // Only attempt to import if not already available
        import('react').then(module => {
            window.React = module.default || module;
            // Force a refresh if needed
            if (typeof forceRefresh === 'function') forceRefresh();
        }).catch(err => console.error('Failed to import React:', err));
    }
})();

const { useState, useEffect, useContext, createContext } = React || {
    useState: () => [null, () => { }],
    useEffect: () => { },
    useContext: () => ({}),
    createContext: (val) => ({ Provider: ({ children }) => children, Consumer: ({ children }) => children })
};

import { useAuth } from './AuthContext';

// Create the context with a safer pattern
const WishlistContext = createContext({
    wishlist: [],
    wishlistCount: 0,
    addToWishlist: () => { },
    removeFromWishlist: () => { },
    isInWishlist: () => false,
    clearWishlist: () => { }
});

// Custom hook for using wishlist context
export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);
    const { user } = useAuth();

    // Load wishlist when component mounts or user changes
    useEffect(() => {
        loadUserWishlist();
    }, [user]);

    const loadUserWishlist = () => {
        if (user) {
            // Load user's wishlist
            const userWishlist = localStorage.getItem(`wishlist_${user.email}`);
            if (userWishlist) {
                setWishlist(JSON.parse(userWishlist));
            } else {
                setWishlist([]);
            }
        } else {
            // Clear wishlist when no user is logged in
            setWishlist([]);
        }
    };

    // Save wishlist to localStorage whenever it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem(`wishlist_${user.email}`, JSON.stringify(wishlist));
        }
    }, [wishlist, user]);

    const addToWishlist = (product) => {
        console.log('addToWishlist called with:', product);

        if (!user) {
            console.error('Add to wishlist failed: User not logged in');
            alert('Please log in to add items to wishlist');
            return;
        }

        if (!product) {
            console.error('Add to wishlist failed: Product is undefined or null');
            return;
        }

        setWishlist(prevWishlist => {
            const existingItem = prevWishlist.find(item =>
                item.productId === product.productId
            );

            if (existingItem) {
                // Item already in wishlist, do nothing
                return prevWishlist;
            }

            // Add item to wishlist
            return [...prevWishlist, product];
        });
    };

    const removeFromWishlist = (productId) => {
        if (!user) return;
        setWishlist(prevWishlist => prevWishlist.filter(item => item.productId !== productId));
    };

    const isInWishlist = (productId) => {
        return wishlist.some(item => item.productId === productId);
    };

    const clearWishlist = () => {
        if (!user) return;
        setWishlist([]);
    };

    // Create a stable context value object
    const value = {
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        wishlistCount: wishlist.length
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};

// Export the context
export { WishlistContext }; 