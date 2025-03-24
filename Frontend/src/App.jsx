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
import { notifyError } from './services/errorHandler';

// UI Components
import SkipLink from './components/UI/SkipLink';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import DesignStudioPage from './pages/DesignStudioPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/Router/ProtectedRoute';

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
  const HomePageLazy = React.lazy(() => import('./pages/HomePage'));
  const ProductsPageLazy = React.lazy(() => import('./pages/ProductsPage'));
  const ProductDetailPageLazy = React.lazy(() => import('./pages/ProductDetailPage'));
  const DesignStudioPageLazy = React.lazy(() => import('./pages/DesignStudioPage'));
  const AboutPageLazy = React.lazy(() => import('./pages/AboutPage'));
  const CartPageLazy = React.lazy(() => import('./pages/CartPage'));
  const CheckoutPageLazy = React.lazy(() => import('./pages/CheckoutPage'));
  const SignupPageLazy = React.lazy(() => import('./pages/SignupPage'));
  const LoginPageLazy = React.lazy(() => import('./pages/LoginPage'));
  const ProfilePageLazy = React.lazy(() => import('./pages/ProfilePage'));
  const WishlistPageLazy = React.lazy(() => import('./pages/WishlistPage'));
  const NotFoundPageLazy = React.lazy(() => import('./pages/NotFoundPage'));

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
        // Use our error notification system for uncaught errors
        notifyError('An application error occurred. Please try refreshing the page.');
      }
    };
    window.addEventListener('error', errorHandler);

    // Also handle unhandled promise rejections
    const rejectionHandler = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      notifyError('A network or server error occurred. Please check your connection.');
    };
    window.addEventListener('unhandledrejection', rejectionHandler);

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
        notifyError('Failed to initialize the application properly.');
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
      window.removeEventListener('unhandledrejection', rejectionHandler);
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
      <div className="error-message p-4 bg-red-50 text-red-700 rounded m-4" role="alert" aria-live="assertive">
        <h2 className="text-xl font-bold">Application Error</h2>
        <p>{error.message || 'An unknown error occurred'}</p>
        <div className="mt-2 text-sm text-gray-600">
          {process.env.NODE_ENV !== 'production' && error.stack &&
            <pre className="overflow-auto max-h-40">{error.stack}</pre>
          }
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
              <Route path="/" element={<HomePageLazy />} />
              <Route path="/products" element={<ProductsPageLazy />} />
              <Route path="/products/:id" element={<ProductDetailPageLazy />} />
              <Route path="/product/:productId" element={<ProductDetailPageLazy />} />
              <Route path="/product/:_id" element={<ProductDetailPageLazy />} />
              <Route path="/custom-design-studio" element={<DesignStudioPageLazy />} />
              <Route path="/about" element={<AboutPageLazy />} />
              <Route path="/cart" element={<CartPageLazy />} />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPageLazy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:orderId"
                element={
                  <ProtectedRoute>
                    <OrderDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/signup" element={<SignupPageLazy />} />
              <Route path="/login" element={<LoginPageLazy />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePageLazy />
                  </ProtectedRoute>
                }
              />
              <Route path="/wishlist" element={<WishlistPageLazy />} />
              <Route path="*" element={<NotFoundPageLazy />} />
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
