import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const ProductsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });
    const [sortBy, setSortBy] = useState('newest');

    // Get filter params from URL
    useEffect(() => {
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
            setSelectedCategories(categoryParam.split(','));
        }

        const sortParam = searchParams.get('sort');
        if (sortParam) {
            setSortBy(sortParam);
        }
    }, [searchParams]);

    // Fetch products and categories
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch categories
                const categoriesData = await productService.getCategories();
                setCategories(categoriesData);

                // Fetch products with filters
                const filters = {
                    categories: selectedCategories,
                    sortBy: sortBy
                };
                const productsData = await productService.getFilteredProducts(filters);
                setProducts(productsData);
                setError(null);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Failed to load products. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedCategories, sortBy]);

    // Update URL when filters change
    const updateFilters = (categories, sort) => {
        const params = new URLSearchParams();

        if (categories && categories.length > 0) {
            params.set('category', categories.join(','));
        }

        if (sort) {
            params.set('sort', sort);
        }

        setSearchParams(params);
        setSelectedCategories(categories);
        setSortBy(sort);
    };

    // Toggle category selection
    const toggleCategory = (category) => {
        const newCategories = selectedCategories.includes(category)
            ? selectedCategories.filter(c => c !== category)
            : [...selectedCategories, category];

        updateFilters(newCategories, sortBy);
    };

    // Change sort option
    const handleSortChange = (event) => {
        const newSort = event.target.value;
        updateFilters(selectedCategories, newSort);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 p-4 rounded-md text-red-600">
                    <p>{error}</p>
                    <button
                        className="mt-2 text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">All Products</h1>

            <div className="flex flex-col md:flex-row">
                {/* Filters Sidebar */}
                <div className="w-full md:w-1/4 mb-6 md:mb-0 md:pr-6">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <h2 className="text-lg font-semibold mb-4">Filters</h2>

                        {/* Categories */}
                        <div className="mb-6">
                            <h3 className="font-medium mb-2">Categories</h3>
                            <div className="space-y-2">
                                {categories.map(category => (
                                    <div key={category} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`category-${category}`}
                                            checked={selectedCategories.includes(category)}
                                            onChange={() => toggleCategory(category)}
                                            className="h-4 w-4 text-blue-600 rounded"
                                        />
                                        <label htmlFor={`category-${category}`} className="ml-2 text-gray-700">
                                            {category}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Price Range */}
                        <div className="mb-6">
                            <h3 className="font-medium mb-2">Price Range</h3>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={priceRange.max}
                                    onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex justify-between mt-2">
                                <span>${priceRange.min}</span>
                                <span>${priceRange.max}</span>
                            </div>
                        </div>

                        {/* Clear Filters */}
                        <button
                            onClick={() => updateFilters([], 'newest')}
                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="w-full md:w-3/4">
                    {/* Sort Options */}
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-gray-600">Showing {products.length} products</p>
                        <div className="flex items-center">
                            <label htmlFor="sort" className="mr-2 text-gray-700">Sort by:</label>
                            <select
                                id="sort"
                                value={sortBy}
                                onChange={handleSortChange}
                                className="border rounded-md p-2"
                            >
                                <option value="newest">Newest</option>
                                <option value="price-low-high">Price: Low to High</option>
                                <option value="price-high-low">Price: High to Low</option>
                                <option value="popularity">Popularity</option>
                            </select>
                        </div>
                    </div>

                    {/* Products Grid */}
                    {products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map(product => (
                                <Link
                                    to={`/products/${product.id}`}
                                    key={product.id}
                                    className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                                >
                                    <div className="relative pb-[100%] overflow-hidden">
                                        <img
                                            src={product.images?.[0] || '/images/product-placeholder.jpg'}
                                            alt={product.name}
                                            className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                        {product.discountPercentage > 0 && (
                                            <div className="absolute top-2 right-2 bg-red-500 text-white text-sm font-bold rounded-full px-3 py-1">
                                                {product.discountPercentage}% OFF
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                                            {product.name}
                                        </h3>
                                        <p className="text-gray-600 text-sm mt-1">{product.category}</p>
                                        <div className="flex justify-between items-center mt-3">
                                            <div className="flex items-center">
                                                {product.discountPercentage > 0 ? (
                                                    <>
                                                        <span className="text-gray-800 font-semibold">${product.discountedPrice?.toFixed(2) || (product.price * (1 - product.discountPercentage / 100)).toFixed(2)}</span>
                                                        <span className="text-gray-500 line-through text-sm ml-2">${product.price?.toFixed(2)}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-800 font-semibold">${product.price?.toFixed(2)}</span>
                                                )}
                                            </div>
                                            {product.rating && (
                                                <div className="flex items-center text-yellow-400">
                                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                                    </svg>
                                                    <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-4">No products found matching your filters.</p>
                            <button
                                onClick={() => updateFilters([], 'newest')}
                                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductsPage; 