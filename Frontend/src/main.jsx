// Import React modules directly, no conditional imports
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './App.css';
// Import CSS fixes
import './styles/reset.css';
import './styles/accessibility.css';
import './styles/responsive.css';
import './styles/animations.css';
import './styles/fixes.css'; // Import the new fixes
import './styles/dropdown-fixes.css'; // Import dropdown-specific fixes
import './styles/filter-sidebar-fixes.css'; // Import filter sidebar fixes

// Ensure React is globally available in case any modules are looking for it
// This needs to happen before importing any components that might use createContext
window.React = React;
window.ReactDOM = ReactDOM;

// Explicitly make createContext globally available
if (React && React.createContext) {
  console.log('Making React.createContext globally available');
  window.React.createContext = React.createContext;
} else {
  console.error('React.createContext is not available!');
}

// Store these in a global variable for the react-loader script
window.__REACT_MODULES = {
  React,
  ReactDOM
};

// Mark React as loaded and dispatch an event other scripts can listen for
window.__REACT_LOADED = true;
window.dispatchEvent(new Event('react-loaded'));

console.log('Main.jsx - React version:', React.version);

// IMPORTANT: Import directly to avoid lazy loading issues with context providers
// Lazy loading doesn't work correctly with named exports from context files
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { NotificationProvider } from './contexts/NotificationContext';

/**
 * Client-side entry point for the application
 */

// Ensure DOM is ready before rendering
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('Root element not found!');
    return;
  }

  try {
    // Create root and render app with all providers
    const root = ReactDOM.createRoot(rootElement);

    // Use JSX directly instead of createElement to avoid transformation issues
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

    console.log('React app rendered successfully');
  } catch (error) {
    console.error('Error rendering React application:', error);

    // Display error on the page for better debugging
    const errorDiv = document.createElement('div');
    errorDiv.style.padding = '20px';
    errorDiv.style.margin = '20px';
    errorDiv.style.backgroundColor = '#fee2e2';
    errorDiv.style.border = '1px solid #ef4444';
    errorDiv.style.borderRadius = '4px';
    errorDiv.innerHTML = `
      <h2 style="color: #b91c1c;">React Rendering Error</h2>
      <p>${error.message}</p>
      <pre style="background: #f9fafb; padding: 10px; overflow: auto;">${error.stack}</pre>
      <button onclick="window.location.reload()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px; cursor: pointer;">
        Reload Page
      </button>
    `;

    // Add to document body for visibility
    if (rootElement.parentNode) {
      rootElement.parentNode.insertBefore(errorDiv, rootElement.nextSibling);
    }
  }

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
  setTimeout(removeLoadingIndicator, 1000);
});
