import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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

/**
 * App component - the main application wrapper
 * 
 * @param {Object} props Component props
 * @param {boolean} props.isSSR Whether the app is being rendered on the server
 * @param {Object} props.initialState Initial state data from server
 */
const App = ({ isSSR = false, initialState = {} }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [initError, setInitError] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Lazily load route components for code splitting in client
  // During SSR, these would be pre-rendered
  const HomePage = React.lazy(() => import('./pages/HomePage'));
  const ProductsPage = React.lazy(() => import('./pages/ProductsPage'));
  const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage'));
  const DesignStudioPage = React.lazy(() => import('./pages/DesignStudioPage'));
  const AboutPage = React.lazy(() => import('./pages/AboutPage'));
  const CartPage = React.lazy(() => import('./pages/CartPage'));
  const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
  const SignupPage = React.lazy(() => import('./pages/SignupPage'));
  const LoginPage = React.lazy(() => import('./pages/LoginPage'));
  const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
  const WishlistPage = React.lazy(() => import('./pages/WishlistPage'));
  const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

  useEffect(() => {
    // Skip client-side initialization if we're rendering on the server
    if (isSSR) return;

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
  }, [isLoaded, isSSR]);

  // Auto-scroll to top on page change
  const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
      if (!isSSR) {
        window.scrollTo(0, 0);
      }
    }, [pathname]);

    return null;
  };

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

  // On the server, we don't need to wrap in Router (StaticRouter is used in entry-server.jsx)
  const AppContent = () => (
    <>
      <SkipLink />
      <ToastContainer position="top-right" autoClose={5000} />
      <ErrorBoundary>
        <ScrollToTop />
        <MainLayout>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/product/:productId" element={<ProductDetailPage />} />
              <Route path="/custom-design-studio" element={<DesignStudioPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </MainLayout>
      </ErrorBoundary>
    </>
  );

  // If running on server or client has already initialized, render normally
  if (isSSR || isLoaded) {
    return <AppContent />;
  }

  // During client-side initialization, show the loading state
  return (
    <div className="app-initializing">
      <LoadingSpinner />
    </div>
  );
};

export default App;
