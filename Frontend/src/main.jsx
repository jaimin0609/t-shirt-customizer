// Ensure React is available globally first, before any imports
if (typeof window !== 'undefined') {
  // Make React available globally to help with context errors
  window.React = window.React || (typeof React !== 'undefined' ? React : null);
  window.ReactDOM = window.ReactDOM || (typeof ReactDOM !== 'undefined' ? ReactDOM : null);
}

// Function to handle React imports safely
function initializeReact() {
  return new Promise((resolve, reject) => {
    // If React is already available globally, use it
    if (window.React && window.ReactDOM) {
      resolve({
        React: window.React,
        ReactDOM: window.ReactDOM
      });
      return;
    }

    // Try to import React
    Promise.all([
      import('react').catch(e => console.error('Failed to import React:', e)),
      import('react-dom/client').catch(e => console.error('Failed to import ReactDOM:', e))
    ])
      .then(([reactModule, reactDomModule]) => {
        if (reactModule && reactDomModule) {
          window.React = reactModule.default || reactModule;
          window.ReactDOM = reactDomModule.default || reactDomModule;
          resolve({
            React: window.React,
            ReactDOM: window.ReactDOM
          });
        } else {
          console.error('Failed to import React or ReactDOM');
          reject(new Error('Failed to import React or ReactDOM'));
        }
      })
      .catch(err => {
        console.error('Error importing React:', err);
        reject(err);
      });
  });
}

// Import App using a dynamic import to avoid top-level await
function importApp() {
  return import('./App.jsx').catch(err => {
    console.error('Error importing App:', err);
    throw err;
  });
}

// Import CSS
import './index.css';

// Log environment info for debugging
console.log('App starting in environment:', process.env.NODE_ENV);
console.log('Browser details:', navigator.userAgent);

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
  // First, ensure React is available
  initializeReact()
    .then(({ React, ReactDOM }) => {
      // Log React version if available
      if (React.version) {
        console.log('React version:', React.version);
      }

      // Then import the App component
      return importApp().then(AppModule => {
        const App = AppModule.default;

        try {
          console.log('Creating React root element');
          const rootElement = document.getElementById('root');

          if (!rootElement) {
            throw new Error('Root element not found in the DOM');
          }

          // Use ReactDOM directly from the window global if createRoot is available
          const rootAPI = ReactDOM.createRoot;

          if (!rootAPI) {
            throw new Error('ReactDOM.createRoot is not available');
          }

          const root = rootAPI(rootElement);

          // Render with error catching
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
      });
    })
    .catch(error => {
      console.error('Failed to initialize React:', error);
      showFatalError('Failed to load React library', error);

      // Show a fallback error UI if React can't be loaded
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.innerHTML = `
          <div style="padding: 20px; text-align: center; font-family: sans-serif;">
            <h2 style="color: red;">React Loading Error</h2>
            <p>Failed to load React library. Please try refreshing the page or checking your connection.</p>
            <button onclick="window.location.reload()">Refresh Page</button>
          </div>
        `;
      }
    });
}

// Start the application
initializeApp();
