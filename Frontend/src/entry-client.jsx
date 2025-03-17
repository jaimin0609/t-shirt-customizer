import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { NotificationProvider } from './contexts/NotificationContext';

/**
 * Client-side entry point for hydration
 * 
 * This is responsible for hydrating the app after server-side rendering.
 * It gets the initial state from window.__INITIAL_STATE__ which was
 * injected by the server.
 */

// Wait for DOM to be loaded
window.addEventListener('DOMContentLoaded', () => {
    // Get initial state from the server
    const initialState = window.__INITIAL_STATE__ || {
        auth: { isAuthenticated: false },
        cart: { items: [] },
        wishlist: { items: [] },
        settings: { theme: 'light' }
    };

    // Render and hydrate the application
    const root = ReactDOM.createRoot(document.getElementById('root'));

    root.render(
        <BrowserRouter>
            <AuthProvider initialState={initialState.auth}>
                <CartProvider initialState={initialState.cart}>
                    <WishlistProvider initialState={initialState.wishlist}>
                        <NotificationProvider>
                            <App
                                isSSR={false}
                                initialState={initialState}
                            />
                        </NotificationProvider>
                    </WishlistProvider>
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    );

    // Remove loading indicator
    const removeLoadingIndicator = () => {
        try {
            const loadingElements = document.querySelectorAll('.app-loading, #initial-loading');
            loadingElements.forEach(el => {
                if (el) {
                    console.log('Removing loading indicator', el.id || 'unknown');
                    el.style.opacity = '0';

                    setTimeout(() => {
                        if (el && el.parentNode) {
                            el.parentNode.removeChild(el);
                        }
                    }, 500);
                }
            });
        } catch (error) {
            console.error('Error removing loading indicator:', error);
        }
    };

    // Handle loading indicator after hydration
    setTimeout(removeLoadingIndicator, 500);
}); 