// Import React modules - we'll use these if available
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { NotificationProvider } from './contexts/NotificationContext';
import './index.css';
import './App.css';

/**
 * Client-side entry point for the application
 */

// Render the application
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
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
