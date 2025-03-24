import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import productService from '../services/productService';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { FilterAccordion, FilterAccordionGroup } from '../components/UI/FilterAccordion';

// Import the new styled components
import SearchFilters from '../components/Product/SearchComponents/SearchFilters.styled';
import SearchResults from '../components/Product/SearchComponents/SearchResults.styled';
import ProductCard from '../components/Product/SearchComponents/ProductCard.styled';

// Import utilities
import {
    generateDidYouMeanSuggestion as generateSuggestion,
    getProductImageUrl,
    updateSearchParams
} from '../utils/searchUtils';

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

                // Ensure results is always an array
                const safeResults = Array.isArray(results) ? results : [];

                // If no results found or very few results, get alternative suggestions
                if (!safeResults.length) {
                    setHasExactMatches(false);

                    // Get similar products as recommendations
                    const similarProducts = await productService.getSimilarOrRecommendedProducts(searchQuery, 12);
                    const safeSimilarProducts = Array.isArray(similarProducts) ? similarProducts : [];
                    setSuggestedProducts(safeSimilarProducts);

                    // Suggest an alternative search term
                    if (searchQuery && searchQuery.length > 3) {
                        const simulatedCorrection = generateSuggestion(searchQuery);
                        setDidYouMean(simulatedCorrection !== searchQuery ? simulatedCorrection : '');
                    }
                } else {
                    // Extract additional available filters from results if we have results
                    // This keeps category-specific filters while still showing something when no results are found
                    const resultCategories = [...new Set(safeResults.map(p => p.category).filter(Boolean))].map(category => ({
                        id: category,
                        name: category.charAt(0).toUpperCase() + category.slice(1)
                    }));

                    const resultGenders = [...new Set(safeResults.map(p => p.gender).filter(Boolean))].map(gender => ({
                        id: gender,
                        name: gender.charAt(0).toUpperCase() + gender.slice(1)
                    }));

                    const resultAgeGroups = [...new Set(safeResults.map(p => p.ageGroup).filter(Boolean))].map(ageGroup => ({
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

                setProducts(safeResults);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching products:', error);
                setProducts([]);
                setLoading(false);
            }
        };

        fetchProducts();
    }, [searchParams, searchQuery]);

    // Handle filter checkbox changes
    const handleFilterChange = useCallback((filterType, value) => {
        setFilters(prev => {
            const filterList = [...prev[filterType]];
            if (filterList.includes(value)) {
                // Remove the filter
                return {
                    ...prev,
                    [filterType]: filterList.filter(item => item !== value)
                };
            } else {
                // Add the filter
                return {
                    ...prev,
                    [filterType]: [...filterList, value]
                };
            }
        });
    }, []);

    // Apply filters to the URL and trigger new search
    const applyFilters = useCallback(() => {
        updateSearchParams(filters, searchQuery, setSearchParams);
    }, [filters, searchQuery, setSearchParams]);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFilters({
            categories: [],
            genders: [],
            ageGroups: []
        });

        // Update URL to maintain only the search parameter
        const params = new URLSearchParams();
        if (searchQuery) {
            params.set('search', searchQuery);
        }
        setSearchParams(params);
    }, [searchQuery, setSearchParams]);

    // Use the "did you mean" suggestion
    const searchWithCorrectedTerm = useCallback(() => {
        const params = new URLSearchParams(searchParams);
        params.set('search', didYouMean);
        setSearchParams(params);
    }, [didYouMean, searchParams, setSearchParams]);

    // Remove a single filter
    const removeFilter = useCallback((filterType, value) => {
        // Remove from the applied filters
        const updatedFilters = {
            ...appliedFilters,
            [filterType]: appliedFilters[filterType].filter(item => item !== value)
        };

        // Update the filter state to match
        setFilters(updatedFilters);

        // Update the URL params
        const params = new URLSearchParams();
        if (searchQuery) {
            params.set('search', searchQuery);
        }

        // Add remaining filters to URL
        updatedFilters.categories.forEach(category => params.append('category', category));
        updatedFilters.genders.forEach(gender => params.append('gender', gender));
        updatedFilters.ageGroups.forEach(ageGroup => params.append('ageGroup', ageGroup));

        setSearchParams(params);
    }, [appliedFilters, searchQuery, setSearchParams]);

    // Render a product card - now using the ProductCard component
    const renderProductCard = useCallback((product) => (
        <ProductCard
            key={product.id}
            product={product}
            getImageUrl={getProductImageUrl}
        />
    ), []);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar with filters */}
                <div className="md:w-1/4">
                    <SearchFilters
                        availableFilters={availableFilters}
                        filters={filters}
                        handleFilterChange={handleFilterChange}
                        applyFilters={applyFilters}
                        clearFilters={clearFilters}
                        removeFilter={removeFilter}
                        appliedFilters={appliedFilters}
                    />
                </div>

                {/* Main content with search results */}
                <div className="md:w-3/4">
                    <SearchResults
                        loading={loading}
                        hasExactMatches={hasExactMatches}
                        products={products}
                        searchQuery={searchQuery}
                        didYouMean={didYouMean}
                        suggestedProducts={suggestedProducts}
                        searchWithCorrectedTerm={searchWithCorrectedTerm}
                        renderProductCard={renderProductCard}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProductSearchPage;