// Import React modules directly, no conditional imports
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './App.css';

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

// Only import App and context providers after React is globally available
// This is crucial to avoid createContext errors
const App = React.lazy(() => import('./App'));
const { AuthProvider } = React.lazy(() => import('./contexts/AuthContext'));
const { CartProvider } = React.lazy(() => import('./contexts/CartContext'));
const { WishlistProvider } = React.lazy(() => import('./contexts/WishlistContext'));
const { NotificationProvider } = React.lazy(() => import('./contexts/NotificationContext'));

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

  // Simple loading component to use while React components are loading
  const SimpleLoading = () => {
    return React.createElement('div', {
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }
    }, [
      React.createElement('p', { key: 'text' }, 'Loading application components...'),
      React.createElement('div', {
        key: 'spinner',
        style: {
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #4a6cf7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }
      })
    ]);
  };

  try {
    // Create root and render app with all providers
    const root = ReactDOM.createRoot(rootElement);

    // Render with Suspense to handle the lazy loading
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(React.Suspense, { fallback: React.createElement(SimpleLoading) },
          React.createElement(BrowserRouter, null,
            React.createElement(AuthProvider, null,
              React.createElement(CartProvider, null,
                React.createElement(WishlistProvider, null,
                  React.createElement(NotificationProvider, null,
                    React.createElement(App, null)
                  )
                )
              )
            )
          )
        )
      )
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
