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

  // Initialize analytics and mark app as loaded
  useEffect(() => {
    try {
      initAnalytics();
    } catch (error) {
      console.error('Analytics initialization failed:', error);
      // Continue loading the app even if analytics fails
    }

    // Mark app as loaded after a short delay to ensure CSS is applied
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <NotificationProvider>
                <div className={`app-container ${isLoaded ? 'app-loaded' : ''}`}>
                  <MainLayout />
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
