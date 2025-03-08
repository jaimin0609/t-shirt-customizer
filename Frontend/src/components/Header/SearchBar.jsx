import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import {
    MagnifyingGlassIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const SearchBar = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [noExactMatches, setNoExactMatches] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();

    // Helper function to get the correct image URL for a product
    const getImageUrl = (product) => {
        if (!product) return '/assets/placeholder-product.jpg';

        // Try different image properties
        const imagePath = product.image || product.imageUrl || product.images?.[0]?.front || product.thumbnail;

        if (!imagePath) return '/assets/placeholder-product.jpg';

        // If it's already a full URL, use it
        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        // If it's a backend image path (starts with /uploads)
        if (imagePath.startsWith('/uploads')) {
            // Use the backend URL to create a full image path
            return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5002'}${imagePath}`;
        }

        // Otherwise, assume it's a local asset
        return imagePath;
    };

    // Handle click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Debounced search function
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.trim().length >= 2) {
                fetchSuggestions(searchTerm);
            } else {
                setSuggestions([]);
                setNoExactMatches(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchSuggestions = async (query) => {
        if (!query.trim()) return;

        setIsLoading(true);
        setNoExactMatches(false);

        try {
            // First try with fuzzy search
            const results = await productService.searchProducts(query, { limit: 5 });

            if (results.length === 0) {
                // If no results, try getting recommendations or similar products
                const similarProducts = await productService.getSimilarOrRecommendedProducts(query, 5);
                setSuggestions(similarProducts);
                setNoExactMatches(true);
            } else {
                setSuggestions(results);
                setNoExactMatches(false);
            }

            setShowSuggestions(true);
        } catch (error) {
            console.error('Error fetching search suggestions:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        if (e.target.value.trim().length >= 2) {
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
        setSuggestions([]);
        setShowSuggestions(false);
        setNoExactMatches(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (productId, productName) => {
        navigate(`/products/${productId}`);
        setSearchTerm(productName);
        setShowSuggestions(false);
    };

    // Function to highlight matching text in suggestions
    const highlightMatch = (text, query) => {
        if (!query || !text) return text;

        try {
            // Case insensitive search
            const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
            const parts = text.split(regex);

            return parts.map((part, i) =>
                regex.test(part) ? <span key={i} className="bg-yellow-100 font-medium">{part}</span> : part
            );
        } catch (e) {
            // If regex fails for any reason, return the original text
            return text;
        }
    };

    return (
        <div className="relative flex-1 max-w-xs md:max-w-sm" ref={searchRef}>
            <form onSubmit={handleSubmit} className="relative">
                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleInputChange}
                        placeholder="Search products..."
                        className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onFocus={() => searchTerm.trim().length >= 2 && setShowSuggestions(true)}
                        aria-label="Search for products"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    {searchTerm && (
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            onClick={clearSearch}
                            aria-label="Clear search"
                        >
                            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        </button>
                    )}
                </div>
            </form>

            {/* Loading indicator */}
            {isLoading && showSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                    <div className="px-4 py-3 text-sm text-gray-500">Loading suggestions...</div>
                </div>
            )}

            {/* Suggestions dropdown */}
            {!isLoading && showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                    {noExactMatches && (
                        <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                            No exact matches found. Showing similar products:
                        </div>
                    )}
                    <ul className="py-1">
                        {suggestions.map((product) => (
                            <li
                                key={product._id || product.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                onClick={() => handleSuggestionClick(product._id || product.id, product.name)}
                            >
                                {product.image && (
                                    <img
                                        src={getImageUrl(product)}
                                        alt={product.name}
                                        className="h-8 w-8 object-cover rounded-sm mr-3"
                                        onError={(e) => {
                                            console.log(`Image error for ${product.name} in search. Using placeholder.`);
                                            e.target.src = '/assets/placeholder-product.jpg';
                                        }}
                                    />
                                )}
                                <div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {highlightMatch(product.name, searchTerm)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {product.category && highlightMatch(product.category, searchTerm)}
                                    </div>
                                </div>
                            </li>
                        ))}
                        <li className="px-4 py-2 text-xs text-blue-600 hover:bg-gray-100 cursor-pointer border-t border-gray-100"
                            onClick={handleSubmit}>
                            See all results for "{searchTerm}"
                        </li>
                    </ul>
                </div>
            )}

            {/* No results with suggestions for alternatives */}
            {!isLoading && showSuggestions && searchTerm.trim().length >= 2 && suggestions.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                    <div className="px-4 py-3 text-sm text-gray-700">
                        <p className="font-medium mb-1">No products found matching "{searchTerm}"</p>
                        <p className="text-xs text-gray-500">Try checking your spelling or using more general terms</p>
                    </div>
                    <div className="px-4 py-2 border-t border-gray-100">
                        <button
                            onClick={handleSubmit}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            Search anyway
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar; 