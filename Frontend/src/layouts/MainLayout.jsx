import { Routes, Route, Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { Transition } from '@headlessui/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../components/Header/Header';
import LogoFooter from '../components/Header/LogoFooter';
import Logo from '../components/Header/Logo';
import TShirtBrowser from '../components/MainContent/TShirtBrowser';
import OrdersPage from '../components/Orders/OrdersPage';
import CheckoutPage from '../components/Checkout/CheckoutPage';
import LoginPage from '../components/Auth/LoginPage';
import ForgotPassword from '../components/Auth/ForgotPassword';
import ResetPassword from '../components/Auth/ResetPassword';
import ProfilePage from '../components/Profile/ProfilePage';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import PromotionBanner from '../components/Promotions/PromotionBanner';
import CartPage from '../components/Cart/CartPage';
import AboutPage from '../pages/AboutPage';
import CustomDesignStudioPage from '../pages/CustomDesignStudioPage';
import CustomProductDesignerPage from '../pages/CustomProductDesignerPage';
import DesignGalleryPage from '../pages/DesignGalleryPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import ProductSearchPage from '../pages/ProductSearchPage';
import WishlistPage from '../pages/WishlistPage';
import NotificationsPage from '../pages/NotificationsPage';
import ContactPage from '../pages/ContactPage';
import FAQPage from '../pages/FAQPage';
import ShippingInfoPage from '../pages/ShippingInfoPage';
import ReturnsPolicyPage from '../pages/ReturnsPolicyPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import TermsOfServicePage from '../pages/TermsOfServicePage';
import SitemapPage from '../pages/SitemapPage';
import AiChatWidget from '../components/AiAssistant/AiChatWidget';
import { useEffect } from 'react';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
};

const MainLayout = () => {
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();
    const { cart, cartCount } = useCart();
    const { wishlistCount } = useWishlist ? useWishlist() : { wishlistCount: 0 };

    // Add debugging for contexts
    useEffect(() => {
        console.log('MainLayout - Auth context:', {
            user,
            isAuthenticated,
            userExists: !!user
        });
        console.log('MainLayout - Cart context:', {
            cart,
            cartCount,
            cartExists: Array.isArray(cart)
        });
    }, [user, isAuthenticated, cart, cartCount]);

    return (
        <div className="app-container">
            {/* Toast notifications */}
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />

            {/* Skip to main content target */}
            <div id="main-content" tabIndex="-1"></div>

            {/* Main Header - Using unified styling approach */}
            <div className="main-header-container">
                <Header />
            </div>

            {/* Promotion banner */}
            <PromotionBanner />

            {/* Main content */}
            <main className="flex-1">
                <Transition
                    show={true}
                    appear={true}
                    enter="transition-opacity duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="main-content-container">
                        <Routes location={location}>
                            {/* Public Routes */}
                            <Route path="/" element={<TShirtBrowser />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />

                            {/* About Page */}
                            <Route path="/about" element={<AboutPage />} />

                            {/* Footer Pages */}
                            <Route path="/contact-us" element={<ContactPage />} />
                            <Route path="/faq" element={<FAQPage />} />
                            <Route path="/shipping-info" element={<ShippingInfoPage />} />
                            <Route path="/returns-policy" element={<ReturnsPolicyPage />} />
                            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                            <Route path="/sitemap" element={<SitemapPage />} />

                            {/* Design Gallery */}
                            <Route path="/designs" element={<DesignGalleryPage />} />

                            {/* Custom Design Studio */}
                            <Route path="/custom-design" element={<CustomDesignStudioPage />} />

                            {/* Product Pages */}
                            <Route path="/product/:productId" element={<ProductDetailPage />} />
                            <Route path="/products" element={<ProductSearchPage />} />

                            {/* Wishlist Page */}
                            <Route path="/wishlist" element={
                                <ProtectedRoute>
                                    <WishlistPage />
                                </ProtectedRoute>
                            } />

                            {/* Notifications Page */}
                            <Route path="/notifications" element={
                                <ProtectedRoute>
                                    <NotificationsPage />
                                </ProtectedRoute>
                            } />

                            {/* Add the specific route for product customization with URL parameters */}
                            <Route path="/custom-design-studio" element={<CustomDesignStudioPage />} />

                            {/* 3D Product Designer */}
                            <Route path="/3d-designer" element={<CustomProductDesignerPage />} />

                            {/* Settings */}
                            <Route path="/settings" element={
                                <ProtectedRoute>
                                    <div className="max-w-6xl mx-auto px-4 py-12">
                                        <div className="text-center mb-12">
                                            <h1 className="text-4xl font-bold text-gray-900 mb-4">Account Settings</h1>
                                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                                Manage your account preferences and settings.
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <h2 className="text-xl font-semibold mb-4">Settings Coming Soon</h2>
                                            <p className="text-gray-600 mb-6">
                                                We're working on building a comprehensive settings panel for your account.
                                            </p>
                                            <Link to="/profile" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
                                                Go to Profile
                                            </Link>
                                        </div>
                                    </div>
                                </ProtectedRoute>
                            } />

                            {/* Protected Routes */}
                            <Route
                                path="/cart"
                                element={
                                    <ProtectedRoute>
                                        <CartPage />
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
                                path="/checkout"
                                element={
                                    <ProtectedRoute>
                                        <CheckoutPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <ProfilePage />
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </div>
                </Transition>
            </main>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-200">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <LogoFooter />
                </div>
            </footer>

            {/* AI Chat Widget */}
            <AiChatWidget />
        </div>
    );
};

export default MainLayout; 