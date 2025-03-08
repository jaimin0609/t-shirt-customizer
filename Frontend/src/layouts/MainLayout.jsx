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

            <Header />
            <PromotionBanner />

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

            <footer className="bg-gray-900 text-white">
                <div className="container mx-auto px-4 py-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        <div className="col-span-1 sm:col-span-2">
                            <div className="mb-6">
                                <LogoFooter />
                            </div>
                            <p className="text-gray-400 mb-6">
                                Create unique, custom t-shirts that express your individual style. Our easy-to-use platform helps you design the perfect shirt for any occasion.
                            </p>
                            <div className="flex space-x-4">
                                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                    </svg>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                                    </svg>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-4">Shop</h3>
                            <ul className="space-y-3">
                                <li><a href="/" className="text-gray-400 hover:text-white transition-colors duration-200">All Products</a></li>
                                <li><a href="/designs" className="text-gray-400 hover:text-white transition-colors duration-200">Design Gallery</a></li>
                                <li><a href="/custom-design" className="text-gray-400 hover:text-white transition-colors duration-200">Custom Design</a></li>
                                <li><a href="/3d-designer" className="text-gray-400 hover:text-white transition-colors duration-200">3D Designer</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-4">Customer Service</h3>
                            <ul className="space-y-3">
                                <li><a href="/contact-us" className="text-gray-400 hover:text-white transition-colors duration-200">Contact Us</a></li>
                                <li><a href="/faq" className="text-gray-400 hover:text-white transition-colors duration-200">FAQ</a></li>
                                <li><a href="/shipping-info" className="text-gray-400 hover:text-white transition-colors duration-200">Shipping Info</a></li>
                                <li><a href="/returns-policy" className="text-gray-400 hover:text-white transition-colors duration-200">Returns Policy</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-4">Company</h3>
                            <ul className="space-y-3">
                                <li><a href="/about" className="text-gray-400 hover:text-white transition-colors duration-200">About Us</a></li>
                                <li><a href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors duration-200">Privacy Policy</a></li>
                                <li><a href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors duration-200">Terms of Service</a></li>
                                <li><a href="/sitemap" className="text-gray-400 hover:text-white transition-colors duration-200">Sitemap</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-12 border-t border-gray-800 pt-8">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <p className="text-gray-400 text-sm">
                                © {new Date().getFullYear()} UniQVerse. All rights reserved.
                            </p>
                            <div className="flex space-x-6 mt-4 md:mt-0">
                                <a href="/privacy-policy" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Privacy Policy</a>
                                <a href="/terms-of-service" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Terms of Service</a>
                                <a href="/sitemap" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Sitemap</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* AI Chat Widget */}
            <AiChatWidget />
        </div>
    );
};

export default MainLayout; 