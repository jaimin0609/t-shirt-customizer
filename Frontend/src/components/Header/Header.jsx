import { Fragment, useState } from 'react';
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

const Header = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const { cartCount } = useCart();
    const { wishlistCount } = useWishlist();
    const navigate = useNavigate();
    const location = useLocation();
    const [isDesignMenuOpen, setIsDesignMenuOpen] = useState(false);

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
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <Disclosure as="nav" className="bg-white shadow-md">
            {({ open }) => (
                <>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Logo />
                                </div>
                                <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                                    {navigation.map((item) =>
                                        item.isDropdown ? (
                                            <div key={item.name} className="relative">
                                                <button
                                                    onClick={() => setIsDesignMenuOpen(!isDesignMenuOpen)}
                                                    onBlur={() => setTimeout(() => setIsDesignMenuOpen(false), 100)}
                                                    className={`${designItems.some(subItem => location.pathname === subItem.href)
                                                        ? 'border-blue-500 text-gray-900'
                                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                                                >
                                                    {item.name}
                                                    <ChevronDownIcon className="ml-1 h-4 w-4" />
                                                </button>

                                                {isDesignMenuOpen && (
                                                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                                                        {designItems.map((designItem) => (
                                                            <Link
                                                                key={designItem.name}
                                                                to={designItem.href}
                                                                className={`${location.pathname === designItem.href
                                                                    ? 'bg-gray-100 text-gray-900'
                                                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                                    } block px-4 py-2 text-sm`}
                                                                onClick={() => setIsDesignMenuOpen(false)}
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
                                                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                                            >
                                                {item.name}
                                            </Link>
                                        )
                                    )}
                                </div>
                            </div>
                            <div className="hidden md:block mx-4 flex-1 max-w-md">
                                <SearchBar />
                            </div>
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/wishlist"
                                    className="p-2 text-gray-500 hover:text-red-500 relative group transition-colors duration-200"
                                >
                                    <HeartIcon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                                    {wishlistCount > 0 && (
                                        <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transition-all duration-300 transform group-hover:scale-110">
                                            {wishlistCount}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    to="/cart"
                                    className="p-2 text-gray-500 hover:text-blue-500 relative group transition-colors duration-200"
                                >
                                    <ShoppingCartIcon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                                    {cartCount > 0 && (
                                        <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transition-all duration-300 transform group-hover:scale-110">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>

                                {isAuthenticated ? (
                                    <Menu as="div" className="relative ml-3">
                                        <Menu.Button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 group">
                                            <UserCircleIcon className="h-8 w-8 group-hover:text-blue-500 transition-colors duration-200" />
                                            <span className="text-sm font-medium">{user?.name}</span>
                                            <ChevronDownIcon className="h-5 w-5 group-hover:text-blue-500 transition-colors duration-200" />
                                        </Menu.Button>
                                        <Transition
                                            as={Fragment}
                                            enter="transition ease-out duration-100"
                                            enterFrom="transform opacity-0 scale-95"
                                            enterTo="transform opacity-100 scale-100"
                                            leave="transition ease-in duration-75"
                                            leaveFrom="transform opacity-100 scale-100"
                                            leaveTo="transform opacity-0 scale-95"
                                        >
                                            <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none">
                                                <div className="py-1">
                                                    {userNavigation.map((item) => (
                                                        <Menu.Item key={item.name}>
                                                            {({ active }) => (
                                                                <Link
                                                                    to={item.href}
                                                                    className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                                        } block px-4 py-2 text-sm`}
                                                                >
                                                                    {item.name}
                                                                </Link>
                                                            )}
                                                        </Menu.Item>
                                                    ))}
                                                </div>
                                                <div className="py-1">
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <button
                                                                onClick={handleLogout}
                                                                className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                                    } block w-full text-left px-4 py-2 text-sm`}
                                                            >
                                                                Sign out
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                </div>
                                            </Menu.Items>
                                        </Transition>
                                    </Menu>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Sign in
                                    </Link>
                                )}
                            </div>

                            <div className="-mr-2 flex items-center sm:hidden">
                                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200">
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

                    <Disclosure.Panel className="sm:hidden">
                        <div className="px-2 pt-2 pb-3">
                            <SearchBar />
                        </div>
                        <div className="pt-2 pb-3 space-y-1">
                            {navigation.map((item) =>
                                item.isDropdown ? (
                                    <div key={item.name}>
                                        <Disclosure.Button
                                            as="div"
                                            className={`${designItems.some(subItem => location.pathname === subItem.href)
                                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                                                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                                        >
                                            <button
                                                className="flex justify-between items-center w-full"
                                                onClick={() => setIsDesignMenuOpen(!isDesignMenuOpen)}
                                            >
                                                {item.name}
                                                <ChevronDownIcon className={`h-5 w-5 transform ${isDesignMenuOpen ? 'rotate-180' : ''} transition-transform duration-200`} />
                                            </button>
                                        </Disclosure.Button>

                                        {isDesignMenuOpen && (
                                            <div className="pl-6">
                                                {designItems.map((designItem) => (
                                                    <Disclosure.Button
                                                        key={designItem.name}
                                                        as={Link}
                                                        to={designItem.href}
                                                        className={`${location.pathname === designItem.href
                                                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                                                            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
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
                                            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                                    >
                                        {item.name}
                                    </Disclosure.Button>
                                )
                            )}
                        </div>
                        <div className="pt-4 pb-3 border-t border-gray-200">
                            {isAuthenticated ? (
                                <>
                                    <div className="flex items-center px-4">
                                        <div className="flex-shrink-0">
                                            <UserCircleIcon className="h-10 w-10 text-gray-400" />
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-base font-medium text-gray-800">
                                                {user?.name || 'User'}
                                            </div>
                                            <div className="text-sm font-medium text-gray-500">
                                                {user?.email || ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-1">
                                        {userNavigation.map((item) => (
                                            <Disclosure.Button
                                                key={item.name}
                                                as={Link}
                                                to={item.href}
                                                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                                            >
                                                {item.name}
                                            </Disclosure.Button>
                                        ))}
                                        <Disclosure.Button
                                            as="button"
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                                        >
                                            Sign out
                                        </Disclosure.Button>
                                    </div>
                                </>
                            ) : (
                                <div className="mt-3 space-y-1">
                                    <Disclosure.Button
                                        as={Link}
                                        to="/login"
                                        className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
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