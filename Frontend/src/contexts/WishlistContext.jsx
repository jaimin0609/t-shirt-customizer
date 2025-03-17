// Direct import React as fallback
import React from 'react';
import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

// Create wishlist context with safer pattern
const WishlistContext = createContext({
    wishlist: [],
    wishlistCount: 0,
    addToWishlist: () => { },
    removeFromWishlist: () => { },
    isInWishlist: () => false,
    clearWishlist: () => { }
});

// Export WishlistContext for direct use if needed
export { WishlistContext };

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
                try {
                    const parsedWishlist = JSON.parse(userWishlist);
                    setWishlist(parsedWishlist);
                    console.log('Loaded wishlist items:', parsedWishlist.length);
                } catch (err) {
                    console.error('Failed to parse wishlist data:', err);
                    localStorage.removeItem(`wishlist_${user.email}`);
                    setWishlist([]);
                }
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
            try {
                localStorage.setItem(`wishlist_${user.email}`, JSON.stringify(wishlist));
            } catch (err) {
                console.error('Failed to save wishlist to localStorage:', err);
            }
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

    return (
        <WishlistContext.Provider
            value={{
                wishlist,
                addToWishlist,
                removeFromWishlist,
                isInWishlist,
                clearWishlist,
                wishlistCount: wishlist.length
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};

// Custom hook to use the wishlist context
export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

// Export named export only to avoid build errors with duplicate exports
export { WishlistProvider }; 