import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

// Create the context
export const CartContext = createContext({
    cart: [],
    orders: [],
    appliedCoupon: null,
    addToCart: () => { },
    removeFromCart: () => { },
    updateQuantity: () => { },
    clearCart: () => { },
    createOrder: () => { },
    applyCoupon: () => { },
    removeCoupon: () => { },
    cartCount: 0
});

// Custom hook for using cart context
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [orders, setOrders] = useState([]);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const { user } = useAuth();

    // Load cart and orders when component mounts or user changes
    useEffect(() => {
        loadUserData();
    }, [user]);

    const loadUserData = () => {
        if (user) {
            // Load user's cart
            const userCart = localStorage.getItem(`cart_${user.email}`);
            if (userCart) {
                setCart(JSON.parse(userCart));
            } else {
                setCart([]);
            }

            // Load user's orders
            const userOrders = localStorage.getItem(`orders_${user.email}`);
            if (userOrders) {
                setOrders(JSON.parse(userOrders));
            } else {
                setOrders([]);
            }

            // Load user's applied coupon
            const userCoupon = localStorage.getItem(`coupon_${user.email}`);
            if (userCoupon) {
                setAppliedCoupon(JSON.parse(userCoupon));
            } else {
                setAppliedCoupon(null);
            }
        } else {
            // Clear cart and orders when no user is logged in
            setCart([]);
            setOrders([]);
            setAppliedCoupon(null);
        }
    };

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem(`cart_${user.email}`, JSON.stringify(cart));
        }
    }, [cart, user]);

    // Save orders to localStorage whenever they change
    useEffect(() => {
        if (user) {
            localStorage.setItem(`orders_${user.email}`, JSON.stringify(orders));
        }
    }, [orders, user]);

    // Save applied coupon to localStorage whenever it changes
    useEffect(() => {
        if (user) {
            if (appliedCoupon) {
                localStorage.setItem(`coupon_${user.email}`, JSON.stringify(appliedCoupon));
            } else {
                localStorage.removeItem(`coupon_${user.email}`);
            }
        }
    }, [appliedCoupon, user]);

    const addToCart = (product) => {
        console.log('addToCart called with:', product);

        if (!user) {
            console.error('Add to cart failed: User not logged in');
            alert('Please log in to add items to cart');
            return;
        }

        if (!product) {
            console.error('Add to cart failed: Product is undefined or null');
            return;
        }

        console.log('Current cart before update:', cart);

        setCart(prevCart => {
            const existingItem = prevCart.find(item =>
                item.productId === product.productId &&
                item.color === product.color &&
                item.size === product.size
            );

            console.log('Existing item check:', existingItem);

            if (existingItem) {
                console.log('Updating existing item quantity');
                return prevCart.map(item =>
                    item === existingItem
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            console.log('Adding new item to cart');
            return [...prevCart, { ...product, quantity: 1 }];
        });

        // Clear applied coupon when cart changes
        setAppliedCoupon(null);
    };

    const removeFromCart = (productId) => {
        if (!user) return;
        setCart(prevCart => prevCart.filter(item => item.productId !== productId));

        // Clear applied coupon when cart changes
        setAppliedCoupon(null);
    };

    const updateQuantity = (productId, quantity) => {
        if (!user) return;

        if (quantity < 1) {
            removeFromCart(productId);
            return;
        }

        setCart(prevCart =>
            prevCart.map(item =>
                item.productId === productId
                    ? { ...item, quantity }
                    : item
            )
        );

        // Clear applied coupon when cart changes
        setAppliedCoupon(null);
    };

    const clearCart = () => {
        setCart([]);
        setAppliedCoupon(null);
        if (user) {
            localStorage.removeItem(`cart_${user.email}`);
            localStorage.removeItem(`coupon_${user.email}`);
        }
    };

    const applyCoupon = async (code, cartTotal) => {
        if (!user) return { success: false, message: 'You must be logged in' };

        // Try different possible backend URLs
        const possibleUrls = [
            'http://localhost:5001/api',
            'http://localhost:5002/api',
            'http://localhost:3001/api',
            '/api' // Relative URL in case the backend is served from the same origin
        ];

        for (const url of possibleUrls) {
            try {
                console.log(`Trying to validate coupon with: ${url}/coupons/validate`);

                const response = await fetch(`${url}/coupons/validate`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code: code,
                        cartTotal: cartTotal
                    }),
                    // Set a reasonable timeout
                    signal: AbortSignal.timeout(5000)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    return { success: false, message: errorData.message || 'Failed to apply coupon' };
                }

                const data = await response.json();
                setAppliedCoupon(data.coupon);

                console.log('Successfully applied coupon:', data);
                return { success: true, coupon: data.coupon };
            } catch (error) {
                console.error(`Error applying coupon with ${url}:`, error);
                // Continue to the next URL
            }
        }

        // If we get here, all URLs failed
        console.error('All API URLs failed to validate coupon');
        return { success: false, message: 'Could not connect to the server. Please try again later.' };
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
    };

    const createOrder = (shippingAddress = null) => {
        if (!user || cart.length === 0) return null;

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = subtotal >= 50 ? 0 : 5.99;
        const taxAmount = subtotal * 0.08;

        let discountAmount = 0;
        let total = subtotal + shippingCost + taxAmount;

        if (appliedCoupon) {
            discountAmount = parseFloat(appliedCoupon.discountAmount);
            total = parseFloat(appliedCoupon.newTotal) + shippingCost + taxAmount;
        }

        // Use provided shipping address or default to user info
        const orderShippingAddress = shippingAddress || {
            name: user.name,
            email: user.email,
            phone: user?.customer?.phone || '',
            address: user?.customer?.address || '',
            city: user?.customer?.city || '',
            state: user?.customer?.state || '',
            zipCode: user?.customer?.zipCode || '',
            country: user?.customer?.country || ''
        };

        const newOrder = {
            id: `ORDER_${Date.now()}`,
            items: [...cart],
            subtotal,
            discountAmount,
            shippingCost,
            taxAmount,
            total,
            couponCode: appliedCoupon ? appliedCoupon.code : null,
            status: 'processing',
            date: new Date().toISOString(),
            userEmail: user.email,
            shippingAddress: orderShippingAddress
        };

        setOrders(prevOrders => [...prevOrders, newOrder]);
        clearCart();
        return newOrder;
    };

    const PLACEHOLDER_IMAGE = '/assets/placeholder-product.jpg';

    return (
        <CartContext.Provider value={{
            cart,
            orders,
            appliedCoupon,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            createOrder,
            applyCoupon,
            removeCoupon,
            cartCount: cart.reduce((total, item) => total + item.quantity, 0)
        }}>
            {children}
        </CartContext.Provider>
    );
}; 