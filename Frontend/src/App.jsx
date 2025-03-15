import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { NotificationProvider } from './contexts/NotificationContext';
import MainLayout from './layouts/MainLayout';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from 'react';
import { initAnalytics } from './services/analyticsService';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Initialize analytics and mark app as loaded
  useEffect(() => {
    console.log('App mounting, initializing...');

    try {
      // Attempt to initialize analytics
      initAnalytics();
      console.log('Analytics initialized successfully');
    } catch (error) {
      console.error('Analytics initialization failed:', error);
      // Continue loading the app even if analytics fails
    }

    // Force the app to be marked as loaded regardless of any internal errors
    // This ensures users don't get stuck on the loading screen
    const timer = setTimeout(() => {
      console.log('Setting isLoaded to true');
      setIsLoaded(true);
    }, 2000); // Increased timeout to ensure everything has time to initialize

    return () => clearTimeout(timer);
  }, []);

  // Log when the loaded state changes
  useEffect(() => {
    console.log('isLoaded state changed to:', isLoaded);
  }, [isLoaded]);

  return (
    <ErrorBoundary fallbackRender={({ error }) => (
      <div className="error-container p-4">
        <h2>Something went wrong</h2>
        <p>{error?.message || 'Unknown error'}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    )}>
      <Router>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <NotificationProvider>
                <div className={`app-container ${isLoaded ? 'app-loaded' : ''}`}>
                  {loadError ? (
                    <div className="error-message">
                      <h2>Failed to load application</h2>
                      <p>{loadError.message}</p>
                      <button onClick={() => window.location.reload()}>Reload</button>
                    </div>
                  ) : (
                    <MainLayout />
                  )}
                  <ToastContainer
                    position="bottom-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                  />
                </div>
              </NotificationProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
