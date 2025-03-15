// Import React modules - we'll use these if available
import * as ReactImport from 'react';
import * as ReactDOMImport from 'react-dom/client';

// Create local references that we can assign to
let React = ReactImport;
let ReactDOM = ReactDOMImport;

// Check if we have a valid React instance
if (!React || !React.createElement) {
  console.warn('React not defined from import - using global fallback');
  // Use the globally available React from CDN
  const globalReact = window.React;
  if (globalReact && globalReact.createElement) {
    // Use the global version instead of the import
    React = globalReact;
  } else {
    console.error('React is not available globally or via import!');
    // Show a visible error on the page
    document.getElementById('root').innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2 style="color: red;">Critical Error</h2>
        <p>React library could not be loaded. Please check your internet connection and reload the page.</p>
        <button onclick="window.location.reload()">Reload Now</button>
      </div>
    `;
    throw new Error('React is not available!');
  }
}

// Similarly ensure ReactDOM is available
if (!ReactDOM || !ReactDOM.createRoot) {
  console.warn('ReactDOM not defined from import - using global fallback');
  const globalReactDOM = window.ReactDOM;
  if (globalReactDOM && globalReactDOM.createRoot) {
    // Use the global version instead of the import
    ReactDOM = globalReactDOM;
  } else {
    console.error('ReactDOM is not available globally or via import!');
    throw new Error('ReactDOM is not available!');
  }
}

// Make global references available to ensure modules can find them
window.React = React;
window.ReactDOM = ReactDOM;

// Import App and CSS
import App from './App.jsx';
import './index.css';

// Log environment info for debugging
console.log('App starting in environment:', import.meta.env.MODE);
console.log('Browser details:', navigator.userAgent);
console.log('React version:', React?.version || 'unknown');

// Function to show a visible error message without relying on React
function showFatalError(message, error) {
  console.error(message, error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; max-width: 800px; margin: 0 auto; text-align: center; font-family: sans-serif;">
        <h2 style="color: #e53e3e; margin-bottom: 16px;">Application Error</h2>
        <p style="margin-bottom: 16px;">We encountered a problem while loading the application.</p>
        <div style="background-color: #fed7d7; border: 1px solid #f56565; padding: 12px; border-radius: 4px; margin-bottom: 16px; text-align: left;">
          <strong>Error:</strong> ${message}
          ${error ? `<pre style="overflow-x: auto; background: #f8f8f8; padding: 8px; margin-top: 8px;">${error.toString()}</pre>` : ''}
        </div>
        <button onclick="window.location.reload()" style="background-color: #4a6cf7; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Reload Application
        </button>
      </div>
    `;
  }

  // Try to remove any loading indicators
  try {
    document.querySelectorAll('.app-loading').forEach(el => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
  } catch (e) {
    console.error('Error removing loading indicator:', e);
  }
}

// Remove the loading indicator
function removeLoadingIndicator() {
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
}

// Global error handlers
window.addEventListener('error', (event) => {
  // Check if this is a React-related error
  const errorString = event.error ? event.error.toString() : '';
  if (errorString.includes('React') ||
    errorString.includes('createContext') ||
    errorString.includes('Cannot read properties')) {
    console.error('React-related error caught:', event.error);

    // Add detail about the error
    let errorDetails = errorString;
    if (event.filename) {
      errorDetails += ` in ${event.filename}`;
    }

    // Show specific error message for createContext issues
    if (errorString.includes('createContext')) {
      showFatalError('React initialization error: Problem with context creation',
        'This is likely due to an issue with how React contexts are loaded. ' +
        'Please try clearing your browser cache and reloading.');
    } else {
      showFatalError('An unexpected React error occurred', errorDetails);
    }
  } else {
    console.error('Global error caught:', event.error);
    showFatalError('An unexpected error occurred', event.error);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showFatalError('An unexpected promise rejection occurred', event.reason);
});

// Simple feature detection to make sure browser supports basic features
try {
  if (!window.localStorage) {
    console.warn('LocalStorage not available');
  }

  if (!window.fetch) {
    console.warn('Fetch API not available');
  }
} catch (e) {
  console.warn('Feature detection error:', e);
}

// Make sure document is marked as ready before React starts
document.documentElement.classList.add('app-ready');

// Initialize the application
function initializeApp() {
  try {
    console.log('Creating React root element');
    const rootElement = document.getElementById('root');

    if (!rootElement) {
      throw new Error('Root element not found in the DOM');
    }

    // Create root and render app
    const root = ReactDOM.createRoot(rootElement);

    console.log('Rendering React application');
    root.render(React.createElement(App));

    // Handle loading indicator after a short delay to ensure React has mounted
    console.log('App rendered, scheduling loading indicator removal');
    setTimeout(removeLoadingIndicator, 1000);

    // Add a backup removal timeout in case the app stalls
    setTimeout(() => {
      if (document.querySelector('.app-loading')) {
        console.warn('Loader still present after 5s, forcing removal');
        removeLoadingIndicator();
      }
    }, 5000);
  } catch (error) {
    console.error('Fatal error rendering app:', error);
    showFatalError('Error initializing application', error);
  }
}

// Start the application
initializeApp();
