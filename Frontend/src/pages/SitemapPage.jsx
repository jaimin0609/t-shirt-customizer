import { MapIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const SitemapPage = () => {
    // Site structure data
    const siteStructure = [
        {
            title: 'Main Pages',
            links: [
                { name: 'Home', url: '/' },
                { name: 'Shop All Products', url: '/shop' },
                { name: 'About Us', url: '/about' },
                { name: 'Contact Us', url: '/contact-us' }
            ]
        },
        {
            title: 'Shop Categories',
            links: [
                { name: 'Men\'s T-Shirts', url: '/shop/mens-t-shirts' },
                { name: 'Women\'s T-Shirts', url: '/shop/womens-t-shirts' },
                { name: 'Hoodies & Sweatshirts', url: '/shop/hoodies-sweatshirts' },
                { name: 'Accessories', url: '/shop/accessories' },
                { name: 'Limited Edition', url: '/shop/limited-edition' },
                { name: 'New Arrivals', url: '/shop/new-arrivals' },
                { name: 'Best Sellers', url: '/shop/best-sellers' }
            ]
        },
        {
            title: 'Customer Account',
            links: [
                { name: 'Login / Register', url: '/login' },
                { name: 'My Account', url: '/account' },
                { name: 'Order History', url: '/account/orders' },
                { name: 'Wishlist', url: '/wishlist' },
                { name: 'Track Order', url: '/track-order' }
            ]
        },
        {
            title: 'Information',
            links: [
                { name: 'Shipping Information', url: '/shipping-info' },
                { name: 'Returns Policy', url: '/returns-policy' },
                { name: 'FAQ', url: '/faq' },
                { name: 'Size Guide', url: '/size-guide' },
                { name: 'Customization Guide', url: '/customization-guide' }
            ]
        },
        {
            title: 'Legal',
            links: [
                { name: 'Terms of Service', url: '/terms-of-service' },
                { name: 'Privacy Policy', url: '/privacy-policy' },
                { name: 'Cookie Policy', url: '/cookie-policy' }
            ]
        },
        {
            title: 'Company',
            links: [
                { name: 'About Us', url: '/about' },
                { name: 'Our Story', url: '/our-story' },
                { name: 'Careers', url: '/careers' },
                { name: 'Blog', url: '/blog' },
                { name: 'Press', url: '/press' }
            ]
        },
        {
            title: 'Support',
            links: [
                { name: 'Contact Us', url: '/contact-us' },
                { name: 'Help Center', url: '/help' },
                { name: 'Live Chat', url: '/chat' }
            ]
        }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Page Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Sitemap</h1>
                <div className="flex justify-center mb-4">
                    <MapIcon className="h-16 w-16 text-blue-600" />
                </div>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Navigate through our entire website with ease using this comprehensive site map.
                </p>
            </div>

            {/* Sitemap Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {siteStructure.map((section, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                        </div>
                        <ul className="px-6 py-4 space-y-2">
                            {section.links.map((link, linkIndex) => (
                                <li key={linkIndex} className="transition-all duration-200 hover:translate-x-1">
                                    <Link
                                        to={link.url}
                                        className="text-gray-700 hover:text-blue-600 flex items-center"
                                    >
                                        <svg className="h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Additional Pages Section */}
            <div className="mt-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Additional Resources</h2>

                <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Design Resources</h3>
                            <ul className="space-y-2">
                                <li className="transition-all duration-200 hover:translate-x-1">
                                    <Link to="/design-templates" className="text-gray-700 hover:text-blue-600 flex items-center">
                                        <svg className="h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Design Templates
                                    </Link>
                                </li>
                                <li className="transition-all duration-200 hover:translate-x-1">
                                    <Link to="/tutorials" className="text-gray-700 hover:text-blue-600 flex items-center">
                                        <svg className="h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Tutorials
                                    </Link>
                                </li>
                                <li className="transition-all duration-200 hover:translate-x-1">
                                    <Link to="/design-tips" className="text-gray-700 hover:text-blue-600 flex items-center">
                                        <svg className="h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Design Tips
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Inspiration</h3>
                            <ul className="space-y-2">
                                <li className="transition-all duration-200 hover:translate-x-1">
                                    <Link to="/gallery" className="text-gray-700 hover:text-blue-600 flex items-center">
                                        <svg className="h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Customer Gallery
                                    </Link>
                                </li>
                                <li className="transition-all duration-200 hover:translate-x-1">
                                    <Link to="/trending-designs" className="text-gray-700 hover:text-blue-600 flex items-center">
                                        <svg className="h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Trending Designs
                                    </Link>
                                </li>
                                <li className="transition-all duration-200 hover:translate-x-1">
                                    <Link to="/seasonal-collections" className="text-gray-700 hover:text-blue-600 flex items-center">
                                        <svg className="h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Seasonal Collections
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Business</h3>
                            <ul className="space-y-2">
                                <li className="transition-all duration-200 hover:translate-x-1">
                                    <Link to="/bulk-orders" className="text-gray-700 hover:text-blue-600 flex items-center">
                                        <svg className="h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Bulk Orders
                                    </Link>
                                </li>
                                <li className="transition-all duration-200 hover:translate-x-1">
                                    <Link to="/corporate-gifting" className="text-gray-700 hover:text-blue-600 flex items-center">
                                        <svg className="h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Corporate Gifting
                                    </Link>
                                </li>
                                <li className="transition-all duration-200 hover:translate-x-1">
                                    <Link to="/partnerships" className="text-gray-700 hover:text-blue-600 flex items-center">
                                        <svg className="h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Partnerships
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Community</h3>
                            <ul className="space-y-2">
                                <li className="transition-all duration-200 hover:translate-x-1">
                                    <Link to="/blog" className="text-gray-700 hover:text-blue-600 flex items-center">
                                        <svg className="h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Blog
                                    </Link>
                                </li>
                                <li className="transition-all duration-200 hover:translate-x-1">
                                    <Link to="/testimonials" className="text-gray-700 hover:text-blue-600 flex items-center">
                                        <svg className="h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Customer Testimonials
                                    </Link>
                                </li>
                                <li className="transition-all duration-200 hover:translate-x-1">
                                    <Link to="/social-media" className="text-gray-700 hover:text-blue-600 flex items-center">
                                        <svg className="h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Social Media
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Suggestion */}
            <div className="mt-16 text-center">
                <p className="text-gray-600 mb-4">
                    Can't find what you're looking for? Try our search feature!
                </p>
                <div className="max-w-xl mx-auto">
                    <div className="relative">
                        <input
                            type="text"
                            className="w-full py-3 px-4 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Search our website..."
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SitemapPage; 