import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import {
    MagnifyingGlassIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const SearchBar = ({ onSearch, placeholder = "Search products...", fullWidth = false }) => {
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
            if (onSearch) onSearch(searchTerm);
        }
    };

    const handleSuggestionClick = (productId, productName) => {
        navigate(`/product/${productId}`);
        setSearchTerm(productName);
        setShowSuggestions(false);
        if (onSearch) onSearch(productName);
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
        <div className={`search-container ${fullWidth ? 'w-full' : ''}`} ref={searchRef}>
            <form onSubmit={handleSubmit} className="search-form">
                <div className="search-input-wrapper">
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        className="search-input"
                        onFocus={() => searchTerm.trim().length >= 2 && setShowSuggestions(true)}
                        aria-label="Search for products"
                    />

                    <MagnifyingGlassIcon className="search-icon" aria-hidden="true" />

                    {searchTerm && (
                        <button
                            type="button"
                            className="clear-search-button"
                            onClick={clearSearch}
                            aria-label="Clear search"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </form>

            {/* Loading indicator */}
            {isLoading && showSuggestions && (
                <div className="suggestions-dropdown">
                    <div className="suggestions-message">Loading suggestions...</div>
                </div>
            )}

            {/* Suggestions dropdown */}
            {!isLoading && showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                    {noExactMatches && (
                        <div className="no-exact-matches">
                            No exact matches found. Showing similar products:
                        </div>
                    )}
                    <ul className="suggestions-list">
                        {suggestions.map((product) => (
                            <li
                                key={product._id || product.id}
                                className="suggestion-item"
                                onClick={() => handleSuggestionClick(product._id || product.id, product.name)}
                            >
                                {product.image && (
                                    <img
                                        src={getImageUrl(product)}
                                        alt={product.name}
                                        className="suggestion-image"
                                        onError={(e) => {
                                            console.log(`Image error for ${product.name} in search. Using placeholder.`);
                                            e.target.src = '/assets/placeholder-product.jpg';
                                        }}
                                    />
                                )}
                                <div className="suggestion-content">
                                    <div className="suggestion-title">
                                        {highlightMatch(product.name, searchTerm)}
                                    </div>
                                    <div className="suggestion-category">
                                        {product.category && highlightMatch(product.category, searchTerm)}
                                    </div>
                                </div>
                            </li>
                        ))}
                        <li className="see-all-results" onClick={handleSubmit}>
                            See all results for "{searchTerm}"
                        </li>
                    </ul>
                </div>
            )}

            {/* No results with suggestions for alternatives */}
            {!isLoading && showSuggestions && searchTerm.trim().length >= 2 && suggestions.length === 0 && (
                <div className="suggestions-dropdown">
                    <div className="no-results-message">
                        <p className="no-results-title">No products found matching "{searchTerm}"</p>
                        <p className="no-results-suggestion">Try checking your spelling or using more general terms</p>
                    </div>
                    <div className="search-anyway">
                        <button
                            onClick={handleSubmit}
                            className="search-anyway-button"
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