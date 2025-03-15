// Direct import React as fallback
import React from 'react';
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
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

export const CartProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Fetch user's cart from server
  const fetchUserCart = async () => {
    if (!token) return;

    setLoading(true);
    try {
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
      setError('Failed to load your cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save cart to localStorage and server if user is authenticated
  const saveCart = async (updatedCart) => {
    try {
      localStorage.setItem('cart', JSON.stringify(updatedCart));

      if (isAuthenticated && token) {
        await axios.put(`${API_URL}/cart`, { items: updatedCart }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Failed to save cart:', err);
    }
  };

  // Add item to cart
  const addToCart = useCallback(async (product, quantity = 1, options = {}) => {
    if (!product) {
      setError('Cannot add product to cart: Product information is missing');
      return;
    }

    try {
      setLoading(true);

      const existingItemIndex = cart.findIndex(
        item => item.product.id === product.id &&
          JSON.stringify(item.options) === JSON.stringify(options)
      );

      let updatedCart;

      if (existingItemIndex !== -1) {
        // Update existing item quantity
        updatedCart = [...cart];
        updatedCart[existingItemIndex].quantity += quantity;
        console.log(`Updated quantity of existing item in cart: ${product.name}`);
      } else {
        // Add new item
        updatedCart = [
          ...cart,
          {
            product,
            quantity,
            options,
            addedAt: new Date().toISOString()
          }
        ];
        console.log(`Added new item to cart: ${product.name}`);
      }

      setCart(updatedCart);
      await saveCart(updatedCart);

      // Clear applied coupon when cart changes
      if (appliedCoupon) {
        setAppliedCoupon(null);
      }

      return true;
    } catch (err) {
      console.error('Failed to add item to cart:', err);
      setError('Failed to add item to cart. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [cart, token, isAuthenticated, appliedCoupon]);

  // Remove item from cart
  const removeFromCart = useCallback(async (itemId, options = {}) => {
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
  }, [cart, token, isAuthenticated, appliedCoupon]);

  // Update item quantity in cart
  const updateQuantity = useCallback(async (itemId, quantity, options = {}) => {
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
  }, [cart, removeFromCart, token, isAuthenticated, appliedCoupon]);

  // Clear cart
  const clearCart = useCallback(async () => {
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
  }, [token, isAuthenticated]);

  // Apply coupon to cart
  const applyCoupon = useCallback(async (couponCode) => {
    if (!couponCode) {
      setError('Please enter a coupon code');
      return { success: false, error: 'Please enter a coupon code' };
    }

    try {
      setLoading(true);
      setError(null);

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
    if (!isAuthenticated || !token) {
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
    if (!isAuthenticated || !token) {
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
    if (!isAuthenticated || !token) {
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

  // Calculate cart total
  const getCartTotal = useCallback(() => {
    const subtotal = cart.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);

    // Apply discount if coupon is present
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        const discount = subtotal * (appliedCoupon.value / 100);
        return subtotal - discount;
      } else if (appliedCoupon.type === 'fixed') {
        return Math.max(0, subtotal - appliedCoupon.value);
      }
    }

    return subtotal;
  }, [cart, appliedCoupon]);

  // Get total number of items in cart
  const getCartCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        orders,
        appliedCoupon,
        loading,
        error,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        getOrderHistory,
        createOrder,
        getOrderDetails,
        getCartTotal,
        getCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext; 