// Direct import React as fallback
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useAuth } from './AuthContext';

// Create cart context with safer pattern
const CartContext = createContext({
  cart: [],
  orders: [],
  appliedCoupon: null,
  loading: false,
  error: null,
  cartCount: 0,
  addToCart: () => { },
  removeFromCart: () => { },
  updateQuantity: () => { },
  clearCart: () => { },
  applyCoupon: () => { },
  getOrderHistory: () => { },
  createOrder: () => { },
  getOrderDetails: () => { },
  getCartTotal: () => 0,
  getCartCount: () => 0
});

// Check if we're running on the server
const isServer = typeof window === 'undefined' || process.env.IS_SSR === 'true';

// Provider component
export const CartProvider = ({ children, initialState = null }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [cart, setCart] = useState(() => {
    if (initialState) {
      return initialState.items || [];
    }

    if (!isServer) {
      const storedCart = localStorage.getItem('cart');
      return storedCart ? JSON.parse(storedCart) : [];
    }

    return [];
  });
  const [orders, setOrders] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  // Load cart from localStorage on mount and when user changes
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (err) {
        console.error('Failed to load cart from localStorage:', err);
      }
    };

    loadCart();

    // If user is authenticated, we could fetch their cart from the server
    if (isAuthenticated && user) {
      fetchUserCart();
    }
  }, [isAuthenticated, user]);

  // Update cartCount when cart changes
  useEffect(() => {
    const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    setCartCount(count);
  }, [cart]);

  // Fetch user's cart from server
  const fetchUserCart = async () => {
    if (!token) return;

    setLoading(true);
    try {
      console.log('Fetching cart from API URL:', API_URL);
      const response = await axios.get(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.items) {
        setCart(response.data.items);
        localStorage.setItem('cart', JSON.stringify(response.data.items));

        if (response.data.coupon) {
          setAppliedCoupon(response.data.coupon);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user cart:', err);
      // Don't show error to user for this background operation
      // Instead, fall back to local storage cart
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        try {
          setCart(JSON.parse(localCart));
        } catch (parseErr) {
          console.error('Failed to parse local cart:', parseErr);
          setCart([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Save cart to localStorage and server if user is authenticated
  const saveCart = async (updatedCart) => {
    try {
      localStorage.setItem('cart', JSON.stringify(updatedCart));

      if (isAuthenticated && token) {
        console.log('Saving cart to API URL:', API_URL);
        await axios.put(`${API_URL}/cart`, { items: updatedCart }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Failed to save cart:', err);
      // Still maintain local cart even if server update fails
    }
  };

  // Add item to cart
  const addToCart = useCallback((product, quantity = 1, options = {}) => {
    console.log('Adding to cart:', product, 'quantity:', quantity, 'options:', options);

    if (!product) {
      console.error('Cannot add undefined product to cart');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ensure product has valid ID
      const productId = product.id || product._id || product.productId;

      if (!productId) {
        throw new Error('Product ID is missing');
      }

      // Create a standardized item object
      const newItem = {
        productId: productId,
        name: product.name || 'Unknown Product',
        price: parseFloat(product.price) || 0,
        image: product.image || product.images?.[0] || null,
        quantity: parseInt(quantity) || 1,
        ...options
      };

      setCart(prevCart => {
        // Check if product already exists in cart
        const existingItemIndex = prevCart.findIndex(item =>
          item.productId === newItem.productId &&
          // If we have options like size/color, check those too
          (!newItem.size || item.size === newItem.size) &&
          (!newItem.color || item.color === newItem.color)
        );

        let updatedCart;

        if (existingItemIndex >= 0) {
          // Update existing item quantity
          updatedCart = [...prevCart];
          updatedCart[existingItemIndex].quantity += newItem.quantity;
        } else {
          // Add new item to cart
          updatedCart = [...prevCart, newItem];
        }

        // Save to localStorage
        if (!isServer) {
          localStorage.setItem('cart', JSON.stringify(updatedCart));
        }

        // If user is authenticated, sync with server
        if (isAuthenticated && token) {
          syncCartWithServer(updatedCart);
        }

        return updatedCart;
      });
    } catch (err) {
      console.error('Failed to add item to cart:', err);
      setError(err.message || 'Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // Remove item from cart
  const removeFromCart = useCallback(async (itemId, options = {}) => {
    if (isServer) return;

    try {
      setLoading(true);

      const updatedCart = cart.filter(
        item => !(item.product.id === itemId &&
          JSON.stringify(item.options) === JSON.stringify(options))
      );

      setCart(updatedCart);
      await saveCart(updatedCart);

      // Clear applied coupon when cart changes
      if (appliedCoupon) {
        setAppliedCoupon(null);
      }

      return true;
    } catch (err) {
      console.error('Failed to remove item from cart:', err);
      setError('Failed to remove item from cart. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [cart, saveCart, appliedCoupon]);

  // Update item quantity in cart
  const updateQuantity = useCallback(async (itemId, quantity, options = {}) => {
    if (isServer) return;

    try {
      setLoading(true);

      if (quantity <= 0) {
        return removeFromCart(itemId, options);
      }

      const updatedCart = cart.map(item => {
        if (item.product.id === itemId &&
          JSON.stringify(item.options) === JSON.stringify(options)) {
          return { ...item, quantity };
        }
        return item;
      });

      setCart(updatedCart);
      await saveCart(updatedCart);

      // Clear applied coupon when cart changes
      if (appliedCoupon) {
        setAppliedCoupon(null);
      }

      return true;
    } catch (err) {
      console.error('Failed to update item quantity:', err);
      setError('Failed to update item quantity. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [cart, removeFromCart, saveCart, appliedCoupon]);

  // Clear cart
  const clearCart = useCallback(async () => {
    if (isServer) return;

    try {
      setLoading(true);
      setCart([]);
      localStorage.removeItem('cart');

      if (isAuthenticated && token) {
        await axios.delete(`${API_URL}/cart`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setAppliedCoupon(null);

      return true;
    } catch (err) {
      console.error('Failed to clear cart:', err);
      setError('Failed to clear cart. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [saveCart, isAuthenticated, token]);

  // Apply coupon to cart
  const applyCoupon = useCallback(async (couponCode) => {
    if (isServer) return;

    if (!couponCode) {
      setError('Please enter a coupon code');
      return { success: false, error: 'Please enter a coupon code' };
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Applying coupon to API URL:', API_URL);
      const response = await axios.post(
        `${API_URL}/cart/apply-coupon`,
        { couponCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.coupon) {
        setAppliedCoupon(response.data.coupon);
        console.log('Coupon applied successfully', response.data.coupon);
        return { success: true, coupon: response.data.coupon };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Failed to apply coupon:', err);
      const errorMessage = err.response?.data?.message || 'Failed to apply coupon. Please try again.';
      setError(errorMessage);
      setAppliedCoupon(null);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch user's order history
  const getOrderHistory = useCallback(async () => {
    if (isServer || !isAuthenticated || !token) {
      setError('You must be logged in to view your orders');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.orders) {
        setOrders(response.data.orders);
        return { success: true, orders: response.data.orders };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Failed to fetch order history:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load your orders. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // Get order details
  const getOrderDetails = useCallback(async (orderId) => {
    if (isServer || !isAuthenticated || !token) {
      setError('You must be logged in to view order details');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.order) {
        return { success: true, order: response.data.order };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load order details. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // Create a new order
  const createOrder = useCallback(async (orderData) => {
    if (isServer || !isAuthenticated || !token) {
      setError('You must be logged in to place an order');
      return { success: false, error: 'Not authenticated' };
    }

    if (cart.length === 0) {
      setError('Your cart is empty');
      return { success: false, error: 'Cart is empty' };
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${API_URL}/orders`,
        { ...orderData, items: cart, coupon: appliedCoupon },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.order) {
        // Clear cart after successful order
        await clearCart();

        return { success: true, order: response.data.order };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Failed to create order:', err);
      const errorMessage = err.response?.data?.message || 'Failed to place your order. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [cart, appliedCoupon, clearCart, isAuthenticated, token]);

  // Get cart total amount
  const getCartTotal = useCallback(() => {
    const subtotal = cart.reduce((total, item) => {
      // Ensure price is treated as a number
      let price;

      if (item.product && typeof item.product.price !== 'undefined') {
        price = typeof item.product.price === 'string'
          ? parseFloat(item.product.price)
          : item.product.price;
      } else {
        price = typeof item.price === 'string'
          ? parseFloat(item.price)
          : item.price;
      }

      // Check if price is a valid number
      const validPrice = !isNaN(price) ? price : 0;

      return total + (validPrice * item.quantity);
    }, 0);

    // Apply discount if coupon is present
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        const discount = subtotal * ((appliedCoupon.value || 0) / 100);
        return subtotal - discount;
      } else if (appliedCoupon.type === 'fixed') {
        return Math.max(0, subtotal - (appliedCoupon.value || 0));
      }
    }

    return subtotal;
  }, [cart, appliedCoupon]);

  // Get total number of items in cart
  const getCartCount = useCallback(() => {
    return cart.reduce((count, item) => count + (item.quantity || 1), 0);
  }, [cart]);

  // Sync cart with the server for logged-in users
  const syncCartWithServer = useCallback(async (updatedCart) => {
    if (isServer || !isAuthenticated || !token) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Syncing cart with server, API URL:', API_URL);
      const response = await axios.post(`${API_URL}/cart`,
        { items: updatedCart },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.items) {
        setCart(response.data.items);
      }

      return true;
    } catch (err) {
      console.error('Error syncing cart:', err);
      setError('Failed to sync cart with server');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // Load cart from server when user logs in
  useEffect(() => {
    if (isServer || !isAuthenticated || !token) return;

    const fetchCartFromServer = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('Fetching cart from server, API URL:', API_URL);
        const response = await axios.get(`${API_URL}/cart`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.items && response.data.items.length > 0) {
          // Merge server cart with local cart (implementation depends on your business logic)
          setCart(prevItems => {
            // Simple merge strategy: prefer server items, add local items that aren't on server
            const serverItemIds = response.data.items.map(item => item.productId);
            const localItemsToKeep = prevItems.filter(item =>
              !serverItemIds.includes(item.productId)
            );

            return [...response.data.items, ...localItemsToKeep];
          });
        }
      } catch (err) {
        console.error('Error fetching cart:', err);
        // Don't show error, instead just fall back to local storage cart
      } finally {
        setLoading(false);
      }
    };

    fetchCartFromServer();
  }, [isAuthenticated, token]);

  // Context value
  const contextValue = {
    cart,
    orders,
    appliedCoupon,
    loading,
    error,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    getOrderHistory,
    createOrder,
    getOrderDetails,
    getCartTotal,
    getCartCount,
    syncCartWithServer
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Export CartContext for direct use if needed
export { CartContext };

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 