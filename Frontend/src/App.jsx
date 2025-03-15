import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context providers
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Main layout
import MainLayout from './layouts/MainLayout';

// Utilities
import { initAnalytics } from './services/analyticsService';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  // Track loaded state and any errors
  const [isLoaded, setIsLoaded] = useState(false);
  const [initError, setInitError] = useState(null);

  // Initialize app and set up error handling
  useEffect(() => {
    console.log('App component mounting');

    // Handle initialization in a safe way
    const initApp = async () => {
      try {
        // Try to initialize analytics
        await initAnalytics();
        console.log('Analytics initialized successfully');

        // Mark app as loaded after a delay to ensure CSS is applied
        setTimeout(() => {
          console.log('Setting app as loaded');
          setIsLoaded(true);

          // Force remove any loading screens that might still be present
          const loaders = document.querySelectorAll('.app-loading, #initial-loading');
          loaders.forEach(loader => {
            if (loader && loader.parentNode) {
              console.log('Removing loader from App component');
              loader.style.opacity = '0';
              setTimeout(() => loader.parentNode.removeChild(loader), 300);
            }
          });
        }, 500);
      } catch (error) {
        console.error('Error during app initialization:', error);
        setInitError(error);
        setIsLoaded(true); // Still set as loaded even if there's an error
      }
    };

    initApp();

    // Cleanup function
    return () => {
      console.log('App component unmounting');
    };
  }, []);

  // Render error message if initialization failed
  if (initError) {
    return (
      <div className="error-message p-4 bg-red-50 text-red-700 rounded m-4">
        <h2 className="text-xl font-bold">Initialization Error</h2>
        <p>{initError.message}</p>
        <button
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => window.location.reload()}
        >
          Reload Application
        </button>
      </div>
    );
  }

  // Render main application
  return (
    <ErrorBoundary>
      <Router>
        <div className={`app-container ${isLoaded ? 'app-loaded' : ''}`}>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <NotificationProvider>
                  <MainLayout />
                  <ToastContainer
                    position="bottom-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                  />
                </NotificationProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
