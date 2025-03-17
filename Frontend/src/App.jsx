import React, { useEffect, useState, Suspense } from 'react';
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

// UI Components
import SkipLink from './components/UI/SkipLink';

// Loading spinner for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen w-full" aria-live="polite" aria-busy="true">
    <div className="spinner-optimized" role="status"></div>
    <p className="ml-2 sr-only">Loading components...</p>
  </div>
);

function App() {
  // Track loaded state and any errors
  const [isLoaded, setIsLoaded] = useState(false);
  const [initError, setInitError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(prefersReducedMotion.matches);

    const handleMotionPreferenceChange = (event) => {
      setReducedMotion(event.matches);
    };

    prefersReducedMotion.addEventListener('change', handleMotionPreferenceChange);
    return () => {
      prefersReducedMotion.removeEventListener('change', handleMotionPreferenceChange);
    };
  }, []);

  // Initialize app and set up error handling
  useEffect(() => {
    console.log('App component mounting - React version:', React.version);

    // Make sure we immediately update the loading state on mount
    // to prevent the blank screen issue
    setTimeout(() => {
      document.documentElement.classList.add('app-ready');
    }, 100);

    // Add global error handler for context initialization errors
    const errorHandler = (event) => {
      console.error('Global error in App.jsx:', event.error);
      if (event.error && (
        event.error.toString().includes('context') ||
        event.error.toString().includes('useState')
      )) {
        setLoadError(event.error);
      }
    };
    window.addEventListener('error', errorHandler);

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
              setTimeout(() => {
                if (loader.parentNode) {
                  loader.parentNode.removeChild(loader);
                }
              }, 300);
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

    // Ensure app is loaded after a timeout even if something fails
    const timeoutId = setTimeout(() => {
      if (!isLoaded) {
        console.warn('App not loaded after timeout - forcing loaded state');
        setIsLoaded(true);
      }
    }, 5000);

    // Cleanup function
    return () => {
      console.log('App component unmounting');
      window.removeEventListener('error', errorHandler);
      clearTimeout(timeoutId);
    };
  }, [isLoaded]);

  // Render error message if initialization failed
  if (initError || loadError) {
    const error = initError || loadError;
    return (
      <div className="error-message p-4 bg-red-50 text-red-700 rounded m-4">
        <h2 className="text-xl font-bold">Application Error</h2>
        <p>{error.message || 'An unknown error occurred'}</p>
        <div className="mt-2 text-sm text-gray-600">
          {error.stack && <pre className="overflow-auto max-h-40">{error.stack}</pre>}
        </div>
        <button
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => window.location.reload()}
        >
          Reload Application
        </button>
      </div>
    );
  }

  // Render main application with nested providers and error boundaries
  return (
    <ErrorBoundary>
      <Router>
        <div className={`app-container ${isLoaded ? 'app-loaded' : ''} ${reducedMotion ? 'reduced-motion' : ''}`}>
          {/* Skip link for keyboard users */}
          <SkipLink targetId="main-content" />

          <ErrorBoundary fallback={<div>Auth provider error</div>}>
            <AuthProvider>
              <ErrorBoundary fallback={<div>Cart provider error</div>}>
                <CartProvider>
                  <ErrorBoundary fallback={<div>Wishlist provider error</div>}>
                    <WishlistProvider>
                      <ErrorBoundary fallback={<div>Notification provider error</div>}>
                        <NotificationProvider>
                          <Suspense fallback={<LoadingSpinner />}>
                            <MainLayout />
                          </Suspense>
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
                      </ErrorBoundary>
                    </WishlistProvider>
                  </ErrorBoundary>
                </CartProvider>
              </ErrorBoundary>
            </AuthProvider>
          </ErrorBoundary>

          {/* Promotional banner is handled by the PromotionBanner component in MainLayout */}
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
