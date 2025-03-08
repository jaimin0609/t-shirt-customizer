import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { productService } from '../services/productService';
import { HeartIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/solid';

const WishlistPage = () => {
    const { wishlist, removeFromWishlist, wishlistCount } = useWishlist();
    const { addToCart } = useCart();
    const [similarProducts, setSimilarProducts] = useState([]);

    useEffect(() => {
        const fetchSimilarProducts = async () => {
            try {
                setSimilarProducts([]); // Reset similar products first
                if (wishlist.length > 0) {
                    // Use the first wishlist item to get similar products
                    const similar = await productService.getSimilarProducts(wishlist[0].productId);
                    if (similar && similar.length > 0) {
                        setSimilarProducts(similar);
                    } else {
                        console.log('No similar products found');
                    }
                }
            } catch (err) {
                console.error('Failed to fetch similar products:', err);
                // Don't show error to user - this is not critical functionality
            }
        };

        if (wishlist.length > 0) {
            fetchSimilarProducts();
        }
    }, [wishlist]);

    const handleAddToCart = (product) => {
        // Default values for size and color if not available
        const productToAdd = {
            productId: product.productId,
            name: product.name,
            price: product.price,
            image: product.image,
            size: product.size || 'M',
            color: product.color || 'white',
            quantity: 1
        };

        addToCart(productToAdd);
        alert('Product added to cart!');
    };

    if (wishlistCount === 0) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <HeartIcon className="h-16 w-16 mx-auto text-red-500 mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Wishlist</h1>
                    <p className="text-xl text-gray-600 mb-8">Your wishlist is empty.</p>
                    <Link
                        to="/"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <HeartIcon className="h-16 w-16 mx-auto text-red-500 mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Wishlist</h1>
                <p className="text-xl text-gray-600">Items you've added to your wishlist.</p>
            </div>

            {/* Wishlist Items */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-12">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {wishlist.map((item) => (
                                <tr key={item.productId}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-16 w-16 rounded overflow-hidden bg-gray-100">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="ml-4">
                                                <Link
                                                    to={`/product/${item.productId}`}
                                                    className="text-lg font-medium text-gray-900 hover:text-blue-600"
                                                >
                                                    {item.name}
                                                </Link>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-900">
                                        ${parseFloat(item.price).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex justify-center space-x-3">
                                            <button
                                                onClick={() => handleAddToCart(item)}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                Add to Cart
                                            </button>
                                            <button
                                                onClick={() => removeFromWishlist(item.productId)}
                                                className="bg-red-100 text-red-600 px-4 py-2 rounded-md hover:bg-red-200 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recommended Products Section */}
            {similarProducts.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
                    <div className="relative">
                        {/* Left arrow for mobile scrolling indicator */}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 p-2 rounded-full shadow-md hidden md:block">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </div>

                        {/* Scrollable container */}
                        <div className="flex overflow-x-auto pb-4 scrollbar-hide hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <div className="flex space-x-6">
                                {similarProducts.map(product => (
                                    <div key={product._id || product.id} className="bg-white rounded-lg shadow-md overflow-hidden min-w-[200px] md:min-w-[250px] flex-shrink-0">
                                        <Link to={`/product/${product._id || product.id}`} className="block">
                                            <div className="aspect-square bg-gray-200">
                                                <img
                                                    src={product.image || '/assets/placeholder-product.jpg'}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        console.error('Failed to load product image, using placeholder');
                                                        e.target.src = '/assets/placeholder-product.jpg';
                                                        e.target.onerror = null; // Prevent infinite error loops
                                                    }}
                                                />
                                            </div>
                                            <div className="p-4">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
                                                <p className="text-gray-700">${parseFloat(product.price).toFixed(2)}</p>
                                                {product.rating && (
                                                    <div className="flex items-center mt-1">
                                                        {[0, 1, 2, 3, 4].map((rating) => (
                                                            <StarIcon
                                                                key={rating}
                                                                className={`h-4 w-4 ${Math.round(product.rating) > rating ? 'text-yellow-400' : 'text-gray-300'
                                                                    }`}
                                                            />
                                                        ))}
                                                        <span className="ml-1 text-xs text-gray-500">
                                                            ({product.reviewCount || 0})
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right arrow for mobile scrolling indicator */}
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 p-2 rounded-full shadow-md hidden md:block">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Mobile scroll hint */}
                    <p className="text-center text-gray-500 text-sm mt-3 md:hidden">
                        Swipe to see more products
                    </p>
                </div>
            )}
        </div>
    );
};

export default WishlistPage; 