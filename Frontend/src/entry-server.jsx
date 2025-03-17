import React from 'react';
import App from './App';
import { StaticRouter } from 'react-router-dom/server';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { NotificationProvider } from './contexts/NotificationContext';

/**
 * Server entry point for SSR
 * 
 * This function creates a React element tree with all necessary providers
 * that will be rendered on the server side.
 * 
 * @param {Object} props - Props passed from the server
 * @param {string} props.url - The current URL being requested
 * @param {Object} props.initialState - Initial state to hydrate the app with
 * @returns {React.ReactElement} The app element ready for server rendering
 */
export function render(props) {
    const { url, initialState = {} } = props;

    // Create the application wrapped in all providers
    return (
        <StaticRouter location={url}>
            <AuthProvider initialState={initialState.auth}>
                <CartProvider initialState={initialState.cart}>
                    <WishlistProvider initialState={initialState.wishlist}>
                        <NotificationProvider>
                            <App
                                isSSR={true}
                                initialState={initialState}
                            />
                        </NotificationProvider>
                    </WishlistProvider>
                </CartProvider>
            </AuthProvider>
        </StaticRouter>
    );
}

// Export the App component directly for simpler imports
export default App; 