import { Fragment, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { Menu, Transition, Disclosure } from '@headlessui/react';
import {
    ShoppingCartIcon,
    UserCircleIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import Logo from './Logo';
import SearchBar from './SearchBar';
import NotificationDropdown from './NotificationDropdown';

const Header = () => {
    const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
    const { cartCount } = useCart();
    const { wishlistCount } = useWishlist();
    const navigate = useNavigate();
    const location = useLocation();
    const [isDesignMenuOpen, setIsDesignMenuOpen] = useState(false);
    const [authError, setAuthError] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    // Log Header component mounting and rendering
    useEffect(() => {
        console.log('Header component mounted');
        return () => console.log('Header component unmounting');
    }, []);

    // Log when props change
    useEffect(() => {
        console.log('Header props updated:', { isAuthenticated, cartCount, wishlistCount });
    }, [isAuthenticated, cartCount, wishlistCount]);

    // Effect to check authentication state and recover if needed
    useEffect(() => {
        if (authError) {
            // If we detected an auth error, attempt to recover by checking localStorage
            const localToken = localStorage.getItem('token');
            if (isAuthenticated !== !!localToken) {
                console.log('Auth state mismatch detected, reloading page to recover');
                window.location.reload();
            }
        }
    }, [authError, isAuthenticated]);

    // Detect potential auth state inconsistencies
    useEffect(() => {
        const localToken = localStorage.getItem('token');
        if (!authLoading && localToken && !isAuthenticated) {
            console.warn('Auth state inconsistency: Token exists but not authenticated');
            setAuthError(true);
        }
    }, [isAuthenticated, authLoading]);

    // Check for visibility issues
    useEffect(() => {
        const checkVisibility = () => {
            try {
                const headerElement = document.querySelector('nav.header-main');
                if (headerElement) {
                    const styles = window.getComputedStyle(headerElement);
                    setIsHeaderVisible(
                        styles.display !== 'none' &&
                        styles.visibility !== 'hidden' &&
                        styles.opacity !== '0'
                    );

                    console.log('Header visibility check:', {
                        display: styles.display,
                        visibility: styles.visibility,
                        opacity: styles.opacity,
                        isVisible: isHeaderVisible
                    });
                } else {
                    console.error('Header element not found for visibility check');
                    setIsHeaderVisible(false);
                }
            } catch (error) {
                console.error('Error checking header visibility:', error);
            }
        };

        // Check visibility after a short delay to allow CSS to load
        const timeoutId = setTimeout(checkVisibility, 300);
        return () => clearTimeout(timeoutId);
    }, []);

    const navigation = [
        { name: 'Home', href: '/' },
        { name: 'Design', href: '#', isDropdown: true },
        { name: 'About Us', href: '/about' },
    ];

    const designItems = [
        { name: 'Design Gallery', href: '/designs' },
        { name: 'Custom Design', href: '/custom-design' },
        { name: '3D Designer', href: '/3d-designer' },
    ];

    const userNavigation = [
        { name: 'My Profile', href: '/profile' },
        { name: 'My Orders', href: '/orders' },
        { name: 'Settings', href: '/settings' },
    ];

    const handleLogout = async () => {
        try {
            await logout();
            // Clear local cart/wishlist state if needed
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
            // Force a clean logout even if the API call fails
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    };

    // Inline styles to ensure visibility
    const headerStyle = {
        display: 'block !important',
        visibility: 'visible !important',
        opacity: '1 !important',
        position: 'relative',
        zIndex: 1000,
        backgroundColor: '#ffffff',
        width: '100%',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    };

    const flexContainerStyle = {
        display: 'flex !important',
        visibility: 'visible !important',
        opacity: '1 !important'
    };

    return (
        <Disclosure as="nav" className="header-main bg-white shadow-md" style={headerStyle}>
            {({ open }) => (
                <>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 header-container" style={{ display: 'block', visibility: 'visible' }}>
                        <div className="flex items-center justify-between h-16 header-inner" style={flexContainerStyle}>
                            <div className="flex items-center header-left" style={flexContainerStyle}>
                                <div className="flex-shrink-0 logo-wrapper" style={{ display: 'block', visibility: 'visible' }}>
                                    <Logo />
                                </div>
                                <div className="hidden sm:ml-8 sm:flex sm:space-x-6 desktop-nav" style={flexContainerStyle}>
                                    {navigation.map((item) =>
                                        item.isDropdown ? (
                                            <div key={item.name} className="relative dropdown-container" style={{ position: 'relative', display: 'block' }}>
                                                <button
                                                    onClick={() => setIsDesignMenuOpen(!isDesignMenuOpen)}
                                                    onBlur={() => setTimeout(() => setIsDesignMenuOpen(false), 100)}
                                                    className={`${designItems.some(subItem => location.pathname === subItem.href)
                                                        ? 'border-blue-500 text-gray-900'
                                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 dropdown-trigger`}
                                                    style={{ display: 'inline-flex', visibility: 'visible' }}
                                                >
                                                    {item.name}
                                                    <ChevronDownIcon className="ml-1 h-4 w-4" />
                                                </button>

                                                {isDesignMenuOpen && (
                                                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5 dropdown-menu"
                                                        style={{
                                                            position: 'absolute',
                                                            display: 'block',
                                                            visibility: 'visible',
                                                            opacity: 1,
                                                            zIndex: 50
                                                        }}>
                                                        {designItems.map((designItem) => (
                                                            <Link
                                                                key={designItem.name}
                                                                to={designItem.href}
                                                                className={`${location.pathname === designItem.href
                                                                    ? 'bg-gray-100 text-gray-900'
                                                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                                    } block px-4 py-2 text-sm dropdown-item`}
                                                                onClick={() => setIsDesignMenuOpen(false)}
                                                                style={{ display: 'block', visibility: 'visible' }}
                                                            >
                                                                {designItem.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <Link
                                                key={item.name}
                                                to={item.href}
                                                className={`${location.pathname === item.href
                                                    ? 'border-blue-500 text-gray-900'
                                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 nav-link`}
                                                style={{ display: 'inline-flex', visibility: 'visible' }}
                                            >
                                                {item.name}
                                            </Link>
                                        )
                                    )}
                                </div>
                            </div>
                            <div className="hidden md:block mx-4 flex-1 max-w-md search-container" style={{ display: 'block', visibility: 'visible' }}>
                                <SearchBar />
                            </div>
                            <div className="flex items-center space-x-4 header-right" style={flexContainerStyle}>
                                <Link
                                    to="/wishlist"
                                    className="p-2 text-gray-500 hover:text-red-500 relative group transition-colors duration-200 wishlist-icon"
                                    style={{ display: 'inline-flex', visibility: 'visible' }}
                                >
                                    <HeartIcon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                                    {wishlistCount > 0 && (
                                        <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transition-all duration-300 transform group-hover:scale-110 wishlist-count">
                                            {wishlistCount}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    to="/cart"
                                    className="p-2 text-gray-500 hover:text-blue-500 relative group transition-colors duration-200 cart-icon"
                                    style={{ display: 'inline-flex', visibility: 'visible' }}
                                >
                                    <ShoppingCartIcon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                                    {cartCount > 0 && (
                                        <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transition-all duration-300 transform group-hover:scale-110 cart-count">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>

                                {isAuthenticated && <NotificationDropdown />}

                                {/* User Menu (when logged in) */}
                                {!authLoading && isAuthenticated && user ? (
                                    <Menu as="div" className="relative ml-3 user-menu" style={{ position: 'relative', display: 'block', visibility: 'visible' }}>
                                        <div>
                                            <Menu.Button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 user-menu-button"
                                                style={{ display: 'flex', visibility: 'visible' }}>
                                                <span className="sr-only">Open user menu</span>
                                                <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                                            </Menu.Button>
                                        </div>
                                        <Transition
                                            as={Fragment}
                                            enter="transition ease-out duration-100"
                                            enterFrom="transform opacity-0 scale-95"
                                            enterTo="transform opacity-100 scale-100"
                                            leave="transition ease-in duration-75"
                                            leaveFrom="transform opacity-100 scale-100"
                                            leaveTo="transform opacity-0 scale-95"
                                        >
                                            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none user-dropdown"
                                                style={{
                                                    position: 'absolute',
                                                    display: 'block',
                                                    visibility: 'visible',
                                                    zIndex: 10
                                                }}>
                                                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200 user-info">
                                                    <div className="font-medium">
                                                        {user?.name || 'User'}
                                                    </div>
                                                    <div className="truncate text-gray-500">
                                                        {user?.email || 'No email'}
                                                    </div>
                                                </div>
                                                {userNavigation.map((item) => (
                                                    <Menu.Item key={item.name}>
                                                        {({ active }) => (
                                                            <Link
                                                                to={item.href}
                                                                className={`${active ? 'bg-gray-100' : ''
                                                                    } block px-4 py-2 text-sm text-gray-700 dropdown-item`}
                                                                style={{ display: 'block', visibility: 'visible' }}
                                                            >
                                                                {item.name}
                                                            </Link>
                                                        )}
                                                    </Menu.Item>
                                                ))}
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <button
                                                            onClick={handleLogout}
                                                            className={`${active ? 'bg-gray-100' : ''
                                                                } block w-full text-left px-4 py-2 text-sm text-gray-700 dropdown-item`}
                                                            style={{ display: 'block', visibility: 'visible', width: '100%' }}
                                                        >
                                                            Sign out
                                                        </button>
                                                    )}
                                                </Menu.Item>
                                            </Menu.Items>
                                        </Transition>
                                    </Menu>
                                ) : !authLoading ? (
                                    <div className="ml-3 login-button" style={{ display: 'block', visibility: 'visible' }}>
                                        <Link
                                            to="/login"
                                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                            style={{ display: 'inline-flex', visibility: 'visible' }}
                                        >
                                            Sign in
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="ml-3 animate-pulse loading-indicator" style={{ display: 'block', visibility: 'visible' }}>
                                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                                    </div>
                                )}
                            </div>

                            <div className="-mr-2 flex items-center sm:hidden mobile-menu-button" style={flexContainerStyle}>
                                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
                                    style={{ display: 'inline-flex', visibility: 'visible' }}>
                                    <span className="sr-only">Open main menu</span>
                                    {open ? (
                                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                                    )}
                                </Disclosure.Button>
                            </div>
                        </div>
                    </div>

                    <Disclosure.Panel className="sm:hidden mobile-menu" style={{ display: 'block', visibility: 'visible' }}>
                        <div className="px-2 pt-2 pb-3 mobile-search" style={{ display: 'block', visibility: 'visible' }}>
                            <SearchBar />
                        </div>
                        <div className="pt-2 pb-3 space-y-1 mobile-nav" style={{ display: 'block', visibility: 'visible' }}>
                            {navigation.map((item) =>
                                item.isDropdown ? (
                                    <div key={item.name} style={{ display: 'block', visibility: 'visible' }}>
                                        <Disclosure.Button
                                            as="div"
                                            className={`${designItems.some(subItem => location.pathname === subItem.href)
                                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                                                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 mobile-dropdown-trigger`}
                                            style={{ display: 'block', visibility: 'visible' }}
                                        >
                                            <button
                                                className="flex justify-between items-center w-full"
                                                onClick={() => setIsDesignMenuOpen(!isDesignMenuOpen)}
                                                style={{ display: 'flex', visibility: 'visible', width: '100%' }}
                                            >
                                                {item.name}
                                                <ChevronDownIcon className={`h-5 w-5 transform ${isDesignMenuOpen ? 'rotate-180' : ''} transition-transform duration-200`} />
                                            </button>
                                        </Disclosure.Button>

                                        {isDesignMenuOpen && (
                                            <div className="pl-6 mobile-dropdown" style={{ display: 'block', visibility: 'visible', paddingLeft: '1.5rem' }}>
                                                {designItems.map((designItem) => (
                                                    <Disclosure.Button
                                                        key={designItem.name}
                                                        as={Link}
                                                        to={designItem.href}
                                                        className={`${location.pathname === designItem.href
                                                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                                                            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 mobile-dropdown-item`}
                                                        style={{ display: 'block', visibility: 'visible' }}
                                                    >
                                                        {designItem.name}
                                                    </Disclosure.Button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Disclosure.Button
                                        key={item.name}
                                        as={Link}
                                        to={item.href}
                                        className={`${location.pathname === item.href
                                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                                            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                                            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 mobile-nav-link`}
                                        style={{ display: 'block', visibility: 'visible' }}
                                    >
                                        {item.name}
                                    </Disclosure.Button>
                                )
                            )}
                        </div>
                        <div className="pt-4 pb-3 border-t border-gray-200 mobile-user-menu" style={{ display: 'block', visibility: 'visible', borderTop: '1px solid #e5e7eb' }}>
                            {isAuthenticated ? (
                                <>
                                    <div className="flex items-center px-4 mobile-user-info" style={flexContainerStyle}>
                                        <div className="flex-shrink-0" style={{ display: 'block', visibility: 'visible' }}>
                                            <UserCircleIcon className="h-10 w-10 text-gray-400" />
                                        </div>
                                        <div className="ml-3" style={{ display: 'block', visibility: 'visible', marginLeft: '0.75rem' }}>
                                            <div className="text-base font-medium text-gray-800">
                                                {user?.name || 'User'}
                                            </div>
                                            <div className="text-sm font-medium text-gray-500">
                                                {user?.email || ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-1 mobile-user-links" style={{ display: 'block', visibility: 'visible', marginTop: '0.75rem' }}>
                                        {userNavigation.map((item) => (
                                            <Disclosure.Button
                                                key={item.name}
                                                as={Link}
                                                to={item.href}
                                                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200 mobile-user-link"
                                                style={{ display: 'block', visibility: 'visible' }}
                                            >
                                                {item.name}
                                            </Disclosure.Button>
                                        ))}
                                        <Disclosure.Button
                                            as="button"
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200 mobile-logout"
                                            style={{ display: 'block', visibility: 'visible', width: '100%', textAlign: 'left' }}
                                        >
                                            Sign out
                                        </Disclosure.Button>
                                    </div>
                                </>
                            ) : (
                                <div className="mt-3 space-y-1 mobile-login" style={{ display: 'block', visibility: 'visible', marginTop: '0.75rem' }}>
                                    <Disclosure.Button
                                        as={Link}
                                        to="/login"
                                        className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200 mobile-login-link"
                                        style={{ display: 'block', visibility: 'visible' }}
                                    >
                                        Sign in
                                    </Disclosure.Button>
                                </div>
                            )}
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    );
};

export default Header; 