import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Log environment info for debugging
console.log('App starting in environment:', process.env.NODE_ENV);
console.log('Browser details:', navigator.userAgent);

// Force CSS to be reprocessed in production
if (process.env.NODE_ENV === 'production') {
  console.log('Production build initialized:', new Date().toISOString());
} else {
  console.log('Development mode active - CSS hot reloading enabled');
}

// Enhanced loading indicator removal with fallback
const removeLoadingIndicator = () => {
  console.log('Attempting to remove loading indicator');
  try {
    const loadingElement = document.querySelector('.app-loading');
    if (loadingElement) {
      console.log('Loading indicator found, removing...');
      loadingElement.style.opacity = '0';
      loadingElement.style.transition = 'opacity 0.5s ease';

      // Ensure loading indicator is removed even if transition fails
      setTimeout(() => {
        if (document.body.contains(loadingElement)) {
          console.log('Removing loading indicator after transition');
          loadingElement.remove();
        }
      }, 600);

      // Force removal after 2 seconds regardless of transition
      setTimeout(() => {
        document.querySelectorAll('.app-loading').forEach(el => {
          if (document.body.contains(el)) {
            console.log('Force removing loading indicator');
            el.remove();
          }
        });
      }, 2000);
    } else {
      console.log('No loading indicator found');
    }
  } catch (error) {
    console.error('Error removing loading indicator:', error);
    // Try an alternative approach if the first method fails
    try {
      document.querySelectorAll('.app-loading').forEach(el => el.remove());
    } catch (e) {
      console.error('Alternative removal also failed:', e);
    }
  }
};

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Remove loading indicator after app has rendered
  console.log('App rendered, scheduling loading indicator removal');
  setTimeout(removeLoadingIndicator, 1000);
} catch (error) {
  console.error('Fatal error rendering app:', error);
  // Handle fatal rendering error - show error directly
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>Failed to load application</h2>
        <p>Please try refreshing the page. If the problem persists, contact support.</p>
        <p style="color: red;">${error.message}</p>
        <button onclick="window.location.reload()">Reload Page</button>
      </div>
    `;

    // Also try to remove the loader in this case
    removeLoadingIndicator();
  }
}
