import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Log environment info for debugging
console.log('App starting in environment:', process.env.NODE_ENV);
console.log('Browser details:', navigator.userAgent);

// Quick function to show a visible error message without relying on React
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
  console.error('Global error caught:', event.error);
  showFatalError('An unexpected error occurred', event.error);
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

// Render the app with simplified error handling
try {
  console.log('Creating React root element');
  const root = ReactDOM.createRoot(document.getElementById('root'));

  // Render with error catching
  console.log('Rendering React application');
  root.render(
    // Removed StrictMode temporarily as it can cause double-mounting and confuse debugging
    <App />
  );

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
