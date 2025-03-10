import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { Disclosure } from '@headlessui/react';
import { ChevronUpIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const ProductSearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const [products, setProducts] = useState([]);
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasExactMatches, setHasExactMatches] = useState(true);
    const [didYouMean, setDidYouMean] = useState('');
    const [filters, setFilters] = useState({
        categories: [],
        genders: [],
        ageGroups: []
    });
    const [appliedFilters, setAppliedFilters] = useState({
        categories: [],
        genders: [],
        ageGroups: []
    });
    const [availableFilters, setAvailableFilters] = useState({
        categories: [],
        genders: [],
        ageGroups: []
    });

    // Fetch products based on search query
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setHasExactMatches(true);
            setSuggestedProducts([]);
            setDidYouMean('');

            try {
                // Get filter values from URL params
                const categories = searchParams.getAll('category');
                const genders = searchParams.getAll('gender');
                const ageGroups = searchParams.getAll('ageGroup');

                // Update applied filters from URL params
                setAppliedFilters({
                    categories,
                    genders,
                    ageGroups
                });

                // Also update the filter state
                setFilters({
                    categories,
                    genders,
                    ageGroups
                });

                // Prepare options for search
                const searchOptions = {
                    categories,
                    genders,
                    ageGroups,
                };

                // Fetch available filters regardless of search results
                const [allCategories, allGenders, allAgeGroups] = await Promise.all([
                    productService.getCategories(),
                    productService.getGenders(),
                    productService.getAgeGroups()
                ]);

                // Update available filters with all possible options
                setAvailableFilters({
                    categories: allCategories || [],
                    genders: allGenders || [],
                    ageGroups: allAgeGroups || []
                });

                // Search with fuzzy matching
                const results = await productService.searchProducts(searchQuery, searchOptions);

                // If no results found or very few results, get alternative suggestions
                if (results.length === 0) {
                    setHasExactMatches(false);

                    // Get similar products as recommendations
                    const similarProducts = await productService.getSimilarOrRecommendedProducts(searchQuery, 12);
                    setSuggestedProducts(similarProducts);

                    // Suggest an alternative search term - this would normally come from the backend
                    // Here we're just simulating it with a basic correction
                    if (searchQuery && searchQuery.length > 3) {
                        // Create a simple "did you mean" suggestion by adding/removing a letter
                        // In a real app, this would use a proper spelling correction algorithm or API
                        const simulatedCorrection = generateDidYouMeanSuggestion(searchQuery);
                        setDidYouMean(simulatedCorrection !== searchQuery ? simulatedCorrection : '');
                    }
                } else {
                    // Extract additional available filters from results if we have results
                    // This keeps category-specific filters while still showing something when no results are found
                    const resultCategories = [...new Set(results.map(p => p.category).filter(Boolean))].map(category => ({
                        id: category,
                        name: category.charAt(0).toUpperCase() + category.slice(1)
                    }));

                    const resultGenders = [...new Set(results.map(p => p.gender).filter(Boolean))].map(gender => ({
                        id: gender,
                        name: gender.charAt(0).toUpperCase() + gender.slice(1)
                    }));

                    const resultAgeGroups = [...new Set(results.map(p => p.ageGroup).filter(Boolean))].map(ageGroup => ({
                        id: ageGroup,
                        name: ageGroup.charAt(0).toUpperCase() + ageGroup.slice(1)
                    }));

                    // Merge with existing filters to ensure we have both all options and result-specific ones
                    setAvailableFilters(prev => {
                        // Helper function to merge arrays of objects by id
                        const mergeById = (arr1, arr2) => {
                            const merged = [...arr1];
                            arr2.forEach(item => {
                                if (!merged.some(m => m.id === item.id)) {
                                    merged.push(item);
                                }
                            });
                            return merged;
                        };

                        return {
                            categories: mergeById(prev.categories, resultCategories),
                            genders: mergeById(prev.genders, resultGenders),
                            ageGroups: mergeById(prev.ageGroups, resultAgeGroups)
                        };
                    });
                }

                setProducts(results);
            } catch (error) {
                console.error('Error fetching search results:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [searchQuery, searchParams]);

    // Simple function to generate a "did you mean" suggestion
    // In a real application, this would use a proper spelling correction API
    const generateDidYouMeanSuggestion = (query) => {
        if (!query || query.length < 4) return query;

        // Common misspellings
        const commonMisspellings = {
            'shitr': 'shirt',
            'tshirt': 't-shirt',
            'tshrt': 't-shirt',
            'hoddie': 'hoodie',
            'hoodi': 'hoodie',
            'sweter': 'sweater',
            'jaket': 'jacket',
            'pantz': 'pants',
            'jenas': 'jeans',
            'capt': 'cap',
            'hatt': 'hat'
        };

        // Check for common misspellings
        const queryLower = query.toLowerCase();
        for (const [misspelled, correct] of Object.entries(commonMisspellings)) {
            if (queryLower.includes(misspelled)) {
                return query.replace(new RegExp(misspelled, 'i'), correct);
            }
        }

        // If no common misspelling found, make a simple modification
        // In reality, you would use a proper spell-checker algorithm or API
        const words = query.split(' ');
        if (words.length > 0 && words[0].length > 3) {
            // Simple character swap (just as a placeholder for real spell checking)
            if (Math.random() > 0.5) {
                return query;  // No suggestion sometimes is better than a bad suggestion
            }
            const chars = words[0].split('');
            if (chars.length > 3) {
                // Swap two adjacent characters
                const i = Math.floor(Math.random() * (chars.length - 1));
                [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
                words[0] = chars.join('');
                return words.join(' ');
            }
        }

        return query;
    };

    // Handle filter changes
    const handleFilterChange = (filterType, value) => {
        setFilters(prev => {
            const newFilters = { ...prev };

            if (newFilters[filterType].includes(value)) {
                newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
            } else {
                newFilters[filterType] = [...newFilters[filterType], value];
            }

            return newFilters;
        });
    };

    // Apply filters
    const applyFilters = () => {
        setAppliedFilters(filters);

        // Update URL search params
        const newSearchParams = new URLSearchParams();
        newSearchParams.set('search', searchQuery);

        Object.keys(filters).forEach(key => {
            filters[key].forEach(value => {
                newSearchParams.append(key === 'categories' ? 'category' :
                    key === 'genders' ? 'gender' : 'ageGroup',
                    value);
            });
        });

        setSearchParams(newSearchParams);
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            categories: [],
            genders: [],
            ageGroups: []
        });
        setAppliedFilters({
            categories: [],
            genders: [],
            ageGroups: []
        });

        const newSearchParams = new URLSearchParams();
        newSearchParams.set('search', searchQuery);
        setSearchParams(newSearchParams);
    };

    // Search with corrected term
    const searchWithCorrectedTerm = () => {
        if (!didYouMean) return;

        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('search', didYouMean);
        setSearchParams(newSearchParams);
    };

    // Clear specific filter
    const removeFilter = (filterType, value) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
            return newFilters;
        });

        // Update applied filters and URL immediately
        setAppliedFilters(prev => {
            const newAppliedFilters = { ...prev };
            newAppliedFilters[filterType] = newAppliedFilters[filterType].filter(item => item !== value);
            return newAppliedFilters;
        });

        const newSearchParams = new URLSearchParams(searchParams);

        // Remove the specific filter from URL
        if (filterType === 'categories') {
            // Get all category values
            const values = newSearchParams.getAll('category');
            // Remove all category params
            newSearchParams.delete('category');
            // Add back all except the one we're removing
            values.filter(v => v !== value).forEach(v => {
                newSearchParams.append('category', v);
            });
        } else if (filterType === 'genders') {
            const values = newSearchParams.getAll('gender');
            newSearchParams.delete('gender');
            values.filter(v => v !== value).forEach(v => {
                newSearchParams.append('gender', v);
            });
        } else if (filterType === 'ageGroups') {
            const values = newSearchParams.getAll('ageGroup');
            newSearchParams.delete('ageGroup');
            values.filter(v => v !== value).forEach(v => {
                newSearchParams.append('ageGroup', v);
            });
        }

        setSearchParams(newSearchParams);
    };

    // Helper function to get the correct image URL for a product
    const getImageUrl = (product) => {
        if (!product) return '/assets/placeholder-product.jpg';

        // Log available image fields for debugging
        console.log('ProductSearchPage - image data:', {
            id: product.id || product._id,
            name: product.name,
            image: product.image,
            imageUrl: product.imageUrl,
            imagesArray: product.images,
            thumbnail: product.thumbnail
        });

        let imagePath = null;

        // Check for images array first (our newest format)
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            // Use the first image from the array
            imagePath = product.images[0];
        }
        // Then look for legacy image fields
        else if (product.image) {
            imagePath = product.image;
        }
        // Then check for other possible image fields
        else if (product.imageUrl) {
            imagePath = product.imageUrl;
        }
        else if (product.images && product.images.front) {
            imagePath = product.images.front;
        }
        else if (product.thumbnail) {
            imagePath = product.thumbnail;
        }

        // If no image found, use placeholder
        if (!imagePath) {
            return '/assets/placeholder-product.jpg';
        }

        // If it's a Cloudinary URL, use it as is
        if (imagePath.includes('cloudinary.com')) {
            return imagePath;
        }

        // If it's already a full URL, use it
        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        // If it's a backend image path (starts with /uploads)
        if (imagePath.startsWith('/uploads')) {
            // Use placeholder instead of trying to load from backend
            return '/assets/placeholder-product.jpg';
        }

        // For relative paths
        if (imagePath.startsWith('/')) {
            return imagePath;
        }

        // Default case - assume it's a relative path without leading slash
        return `/${imagePath}`;
    };

    // Helper to render product card
    const renderProductCard = (product) => (
        <Link to={`/products/${product._id || product.id}`} key={product._id || product.id} className="group">
            <div className="bg-white rounded-lg shadow overflow-hidden transition-transform duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200">
                    {product.image ? (
                        <img
                            src={getImageUrl(product)}
                            alt={product.name}
                            className="w-full h-64 object-cover object-center group-hover:opacity-75"
                            onError={(e) => {
                                console.log(`Image error for ${product.name}. Using placeholder.`);
                                e.target.src = '/assets/placeholder-product.jpg';
                            }}
                        />
                    ) : (
                        <div className="w-full h-64 flex items-center justify-center bg-gray-200 text-gray-500">
                            No image
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                    <div className="mt-2 flex items-center justify-between">
                        <p className="text-lg font-semibold text-gray-900">
                            ${typeof product.price === 'number'
                                ? product.price.toFixed(2)
                                : typeof product.price === 'string' && !isNaN(parseFloat(product.price))
                                    ? parseFloat(product.price).toFixed(2)
                                    : 'N/A'}
                        </p>
                        {product.discount > 0 && (
                            <p className="text-sm font-medium text-white bg-red-500 py-1 px-2 rounded-full">
                                {product.discount}% OFF
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Filters Section */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                            {Object.values(appliedFilters).some(arr => arr.length > 0) && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        {/* Applied Filters */}
                        {Object.values(appliedFilters).some(arr => arr.length > 0) && (
                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Applied Filters:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {appliedFilters.categories.map(category => (
                                        <div key={category} className="inline-flex items-center bg-blue-100 px-2 py-1 rounded-full text-xs">
                                            {category}
                                            <button onClick={() => removeFilter('categories', category)} className="ml-1">
                                                <XMarkIcon className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {appliedFilters.genders.map(gender => (
                                        <div key={gender} className="inline-flex items-center bg-blue-100 px-2 py-1 rounded-full text-xs">
                                            {gender}
                                            <button onClick={() => removeFilter('genders', gender)} className="ml-1">
                                                <XMarkIcon className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {appliedFilters.ageGroups.map(ageGroup => (
                                        <div key={ageGroup} className="inline-flex items-center bg-blue-100 px-2 py-1 rounded-full text-xs">
                                            {ageGroup}
                                            <button onClick={() => removeFilter('ageGroups', ageGroup)} className="ml-1">
                                                <XMarkIcon className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Categories Filter */}
                            <Disclosure>
                                {({ open }) => (
                                    <>
                                        <Disclosure.Button className="flex w-full justify-between items-center px-4 py-2 text-left text-sm font-medium text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200">
                                            <span>Categories</span>
                                            <ChevronUpIcon
                                                className={`${open ? 'transform rotate-180' : ''} h-5 w-5 text-gray-500`}
                                            />
                                        </Disclosure.Button>
                                        <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
                                            {availableFilters.categories.length > 0 ? (
                                                <div className="space-y-2">
                                                    {availableFilters.categories.map(category => (
                                                        <div key={category.id} className="flex items-center">
                                                            <input
                                                                id={`category-${category.id}`}
                                                                name={`category-${category.id}`}
                                                                type="checkbox"
                                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                                checked={filters.categories.includes(category.id)}
                                                                onChange={() => handleFilterChange('categories', category.id)}
                                                            />
                                                            <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-900">
                                                                {category.name}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">No categories available</p>
                                            )}
                                        </Disclosure.Panel>
                                    </>
                                )}
                            </Disclosure>

                            {/* Genders Filter */}
                            <Disclosure>
                                {({ open }) => (
                                    <>
                                        <Disclosure.Button className="flex w-full justify-between items-center px-4 py-2 text-left text-sm font-medium text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200">
                                            <span>Genders</span>
                                            <ChevronUpIcon
                                                className={`${open ? 'transform rotate-180' : ''} h-5 w-5 text-gray-500`}
                                            />
                                        </Disclosure.Button>
                                        <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
                                            {availableFilters.genders.length > 0 ? (
                                                <div className="space-y-2">
                                                    {availableFilters.genders.map(gender => (
                                                        <div key={gender.id} className="flex items-center">
                                                            <input
                                                                id={`gender-${gender.id}`}
                                                                name={`gender-${gender.id}`}
                                                                type="checkbox"
                                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                                checked={filters.genders.includes(gender.id)}
                                                                onChange={() => handleFilterChange('genders', gender.id)}
                                                            />
                                                            <label htmlFor={`gender-${gender.id}`} className="ml-2 text-sm text-gray-900">
                                                                {gender.name}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">No genders available</p>
                                            )}
                                        </Disclosure.Panel>
                                    </>
                                )}
                            </Disclosure>

                            {/* Age Groups Filter */}
                            <Disclosure>
                                {({ open }) => (
                                    <>
                                        <Disclosure.Button className="flex w-full justify-between items-center px-4 py-2 text-left text-sm font-medium text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200">
                                            <span>Age Groups</span>
                                            <ChevronUpIcon
                                                className={`${open ? 'transform rotate-180' : ''} h-5 w-5 text-gray-500`}
                                            />
                                        </Disclosure.Button>
                                        <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
                                            {availableFilters.ageGroups.length > 0 ? (
                                                <div className="space-y-2">
                                                    {availableFilters.ageGroups.map(ageGroup => (
                                                        <div key={ageGroup.id} className="flex items-center">
                                                            <input
                                                                id={`ageGroup-${ageGroup.id}`}
                                                                name={`ageGroup-${ageGroup.id}`}
                                                                type="checkbox"
                                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                                checked={filters.ageGroups.includes(ageGroup.id)}
                                                                onChange={() => handleFilterChange('ageGroups', ageGroup.id)}
                                                            />
                                                            <label htmlFor={`ageGroup-${ageGroup.id}`} className="ml-2 text-sm text-gray-900">
                                                                {ageGroup.name}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">No age groups available</p>
                                            )}
                                        </Disclosure.Panel>
                                    </>
                                )}
                            </Disclosure>
                        </div>
                    </div>
                </div>

                {/* Products Section */}
                <div className="w-full md:w-2/3">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium text-gray-900">Products</h2>
                        {Object.values(appliedFilters).some(arr => arr.length > 0) && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <p className="text-center text-gray-500">Loading products...</p>
                    ) : (
                        <>
                            {products.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {products.map(product => renderProductCard(product))}
                                </div>
                            ) : (
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <div className="text-center">
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found for "{searchQuery}"</h3>
                                        <p className="text-gray-500 mb-4">Try a different search term or check out these suggested products.</p>

                                        {didYouMean && (
                                            <div className="my-4">
                                                <p className="text-gray-700">
                                                    Did you mean: <button
                                                        className="text-blue-600 font-medium hover:underline"
                                                        onClick={searchWithCorrectedTerm}
                                                    >
                                                        {didYouMean}
                                                    </button>?
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-center space-x-2 text-sm my-4">
                                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                                                Try searching for:
                                            </span>
                                            {['shirt', 'hoodie', 'pants', 'jacket'].map(term => (
                                                <Link
                                                    key={term}
                                                    to={`/products?search=${term}`}
                                                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200"
                                                >
                                                    {term}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    {suggestedProducts.length > 0 && (
                                        <div className="mt-8">
                                            <h4 className="text-lg font-medium text-gray-900 mb-4">You might be interested in:</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {suggestedProducts.map(product => renderProductCard(product))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductSearchPage;