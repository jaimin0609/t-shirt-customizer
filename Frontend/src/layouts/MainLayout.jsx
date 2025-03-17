import { Routes, Route, Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Transition } from '@headlessui/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../components/Header/Header';
import LogoFooter from '../components/Header/LogoFooter';
import TShirtBrowser from '../components/MainContent/TShirtBrowser';
import OrdersPage from '../components/Orders/OrdersPage';
import CheckoutPage from '../components/Checkout/CheckoutPage';
import LoginPage from '../components/Auth/LoginPage';
import ForgotPassword from '../components/Auth/ForgotPassword';
import ResetPassword from '../components/Auth/ResetPassword';
import ProfilePage from '../components/Profile/ProfilePage';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ProductManagement from '../components/Admin/ProductManagement';
import PromotionManagement from '../components/Admin/PromotionManagement';
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

// Verify banner is imported
console.log('✅ MainLayout loaded, PromotionBanner import status:', !!PromotionBanner);

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

// Admin Route Component
const AdminRoute = ({ children }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/" state={{ from: location.pathname }} replace />;
    }

    return children;
};

const MainLayout = () => {
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();
    const { cart, cartCount } = useCart();

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

    // Add a style tag to ensure proper dropdown layering
    useEffect(() => {
        // Create a style element
        const style = document.createElement('style');
        style.innerHTML = `
            /* Aggressive z-index fixes injected directly in DOM */
            .dropdown-menu, [role="menu"], [data-headlessui-state="open"], .absolute {
                z-index: 1000 !important;
                position: relative !important;
            }
            
            /* Special rules for dropdown content */
            [data-headlessui-state="open"] > div,
            button[data-headlessui-state="open"] + div,
            [id^="headlessui-menu-items"],
            [id^="headlessui-listbox-options"] {
                z-index: 2000 !important;
                position: absolute !important;
            }
            
            /* Specific fixes for components we know have issues */
            #design-menu, .category-dropdown {
                z-index: 5000 !important;
                position: relative !important;
            }
            
            /* Force banner to lower z-index */
            .promotion-banner {
                z-index: 5 !important;
            }
            
            /* Force wrappers to respect z-index */
            .relative {
                position: relative !important;
            }
        `;

        // Add it to the head
        document.head.appendChild(style);

        // Also add a MutationObserver to ensure dropdowns added dynamically get the proper z-index
        const fixDropdowns = () => {
            const dropdowns = document.querySelectorAll('.dropdown-menu, [role="menu"], [data-headlessui-state="open"]');
            dropdowns.forEach(dropdown => {
                dropdown.style.zIndex = '2000';
                if (dropdown.parentElement) {
                    dropdown.parentElement.style.position = 'relative';
                }
            });
        };

        // Run once right away
        setTimeout(fixDropdowns, 1000);

        // Set up observer
        const observer = new MutationObserver(mutations => {
            fixDropdowns();
        });

        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => {
            // Clean up on unmount
            document.head.removeChild(style);
            observer.disconnect();
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
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

            <Header />
            <div style={{ position: 'relative', zIndex: 5 }}>
                <PromotionBanner />
            </div>

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
                    <div className="container mx-auto px-4 py-8">
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

                            {/* Admin Routes */}
                            <Route
                                path="/admin/*"
                                element={
                                    <AdminRoute>
                                        <Routes>
                                            <Route path="/" element={
                                                <div className="bg-white shadow rounded-lg p-6">
                                                    <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                                                        Admin Dashboard
                                                    </h1>
                                                    <p className="text-gray-600 mb-6">
                                                        Welcome to the admin dashboard. Use the links below to manage your store.
                                                    </p>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        <Link to="/admin/products" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg border border-blue-200 transition-colors">
                                                            <h2 className="text-lg font-medium text-blue-800 mb-2">Product Management</h2>
                                                            <p className="text-sm text-blue-600">Add, edit, and delete products in your store.</p>
                                                        </Link>

                                                        <Link to="/admin/orders" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg border border-green-200 transition-colors">
                                                            <h2 className="text-lg font-medium text-green-800 mb-2">Order Management</h2>
                                                            <p className="text-sm text-green-600">View and manage customer orders.</p>
                                                        </Link>

                                                        <Link to="/admin/users" className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg border border-purple-200 transition-colors">
                                                            <h2 className="text-lg font-medium text-purple-800 mb-2">User Management</h2>
                                                            <p className="text-sm text-purple-600">Manage user accounts and permissions.</p>
                                                        </Link>

                                                        <Link to="/admin/promotions" className="bg-orange-50 hover:bg-orange-100 p-4 rounded-lg border border-orange-200 transition-colors">
                                                            <h2 className="text-lg font-medium text-orange-800 mb-2">Promotion Management</h2>
                                                            <p className="text-sm text-orange-600">Create and manage promotional offers, discounts and sales.</p>
                                                        </Link>
                                                    </div>
                                                </div>
                                            } />
                                            <Route path="/products" element={<ProductManagement />} />
                                            <Route path="/promotions" element={<PromotionManagement />} />
                                            <Route path="/orders" element={
                                                <div className="bg-white shadow rounded-lg p-6">
                                                    <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                                                        Order Management
                                                    </h1>
                                                    <p className="text-gray-600">
                                                        Order management functionality coming soon.
                                                    </p>
                                                </div>
                                            } />
                                            <Route path="/users" element={
                                                <div className="bg-white shadow rounded-lg p-6">
                                                    <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                                                        User Management
                                                    </h1>
                                                    <p className="text-gray-600">
                                                        User management functionality coming soon.
                                                    </p>
                                                </div>
                                            } />
                                        </Routes>
                                    </AdminRoute>
                                }
                            />

                            <Route path="/test-promotions" element={<PromotionManagement />} />

                            {/* 404 Route */}
                            <Route
                                path="*"
                                element={
                                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                                        <div className="max-w-md px-4">
                                            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                                            <h2 className="text-3xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
                                            <p className="text-gray-600 mb-8">
                                                We couldn't find the page you're looking for. The page might have been removed or the link might be broken.
                                            </p>
                                            <div className="space-x-4">
                                                <button
                                                    onClick={() => window.history.back()}
                                                    className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
                                                >
                                                    Go Back
                                                </button>
                                                <a
                                                    href="/"
                                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 inline-block"
                                                >
                                                    Home Page
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                }
                            />
                        </Routes>
                    </div>
                </Transition>
            </main>

            <LogoFooter />
            <AiChatWidget />
        </div>
    );
};

export default MainLayout; 