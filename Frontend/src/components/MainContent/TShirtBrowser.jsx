import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { categories as staticCategories, genders as staticGenders, ageGroups as staticAgeGroups } from '../../data/products';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import CustomizationModal from './CustomizationModal';
import { productService } from '../../services/productService';
import { Link } from 'react-router-dom';
import { getBatchProductPromotions, calculateProductPrice, calculateDiscountedPrice } from '../../services/discountService';
import { API_URL } from '../../config/api';
import { formatPrice } from '../../services/discountService';
import ProductCard from '../Product/ProductCard'; // Import the real ProductCard component
import { promotionLogger } from '../../services/promotionLogger';

const FilterSection = ({ title, options, selected, onChange }) => {
    return (
        <div className="mb-6">
            <h3 className="font-semibold mb-2">{title}</h3>
            <div className="space-y-2">
                {options.map(option => (
                    <label key={option.id} className="flex items-center">
                        <input
                            type="checkbox"
                            checked={selected.includes(option.id)}
                            onChange={() => onChange(option.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">{option.name}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

const TShirtBrowser = () => {
    const [searchParams] = useSearchParams();
    const promotionType = searchParams.get('promotion');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedGenders, setSelectedGenders] = useState([]);
    const [selectedAgeGroups, setSelectedAgeGroups] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [sortBy, setSortBy] = useState('featured');
    const { addToCart } = useCart();
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true); // State to control sidebar visibility on mobile

    // State for filter options from backend
    const [categoryOptions, setCategoryOptions] = useState(staticCategories);
    const [genderOptions, setGenderOptions] = useState(staticGenders);
    const [ageGroupOptions, setAgeGroupOptions] = useState(staticAgeGroups);

    // Define customizable and ready-made products
    const customizableProducts = products.filter(p => p.isCustomizable);
    const readyMadeProducts = products.filter(p => !p.isCustomizable);

    const handleAddToCart = (product, selectedSize, selectedColor) => {
        console.log('handleAddToCart called in TShirtBrowser with:', { product, selectedSize, selectedColor });

        const productToAdd = {
            productId: product._id,
            name: product.name,
            price: product.price,
            image: typeof product.image === 'string' ? product.image : product.image?.front || '/assets/placeholder-product.jpg',
            size: selectedSize,
            color: selectedColor || 'default', // Use 'default' if no color is selected
            quantity: 1
        };

        // Call add to cart from context
        addToCart(productToAdd);
        promotionLogger.logAddToCart(product._id, selectedSize, selectedColor, 1);
    };

    const toggleFilter = (type, id) => {
        const updateSelected = (prev) => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            }
            return [...prev, id];
        };

        switch (type) {
            case 'category':
                setSelectedCategories(updateSelected(selectedCategories));
                break;
            case 'gender':
                setSelectedGenders(updateSelected(selectedGenders));
                break;
            case 'ageGroup':
                setSelectedAgeGroups(updateSelected(selectedAgeGroups));
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        // Fetch products from the backend
        const fetchProducts = async () => {
            try {
                setLoading(true);
                console.log('[TShirtBrowser] Fetching products...');

                // Create filters object that includes all current filter settings
                const filters = {
                    categories: selectedCategories,
                    genders: selectedGenders,
                    ageGroups: selectedAgeGroups,
                    sortBy: sortBy === 'featured' ? undefined : sortBy // Only include if not the default
                };

                // Use productService with filters to correctly handle sorting on the backend
                const data = await productService.getFilteredProducts(filters);

                console.log(`[TShirtBrowser] Fetched ${data.length} products from API with filters:`, filters);

                // No longer creating fake promotions
                setProducts(data);

                // Log a sample product for debugging
                if (data.length > 0) {
                    console.log('[TShirtBrowser] Sample product:',
                        JSON.stringify({
                            id: data[0].id,
                            name: data[0].name,
                            price: data[0].price,
                            promotion: data[0].promotion
                        }, null, 2)
                    );
                }
            } catch (error) {
                console.error('[TShirtBrowser] Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [selectedCategories, selectedGenders, selectedAgeGroups, sortBy]);

    useEffect(() => {
        // Fetch filter options from backend
        const fetchFilterOptions = async () => {
            try {
                // Fetch categories
                try {
                    const categories = await productService.getCategories();
                    if (categories && categories.length > 0) {
                        setCategoryOptions(categories);
                    }
                } catch (catError) {
                    console.error('Failed to fetch categories, using static data:', catError);
                    // Keep using static categories if fetch fails
                }

                // Fetch genders
                try {
                    const genders = await productService.getGenders();
                    if (genders && genders.length > 0) {
                        setGenderOptions(genders);
                    }
                } catch (genderError) {
                    console.error('Failed to fetch genders, using static data:', genderError);
                    // Keep using static genders if fetch fails
                }

                // Fetch age groups
                try {
                    const ageGroups = await productService.getAgeGroups();
                    if (ageGroups && ageGroups.length > 0) {
                        setAgeGroupOptions(ageGroups);
                    }
                } catch (ageError) {
                    console.error('Failed to fetch age groups, using static data:', ageError);
                    // Keep using static age groups if fetch fails
                }
            } catch (error) {
                console.error('Error fetching filter options:', error);
                // Continue using static data if error
            }
        };

        fetchFilterOptions();
    }, []);

    useEffect(() => {
        const filterProducts = () => {
            console.log('[TShirtBrowser] Starting product filtering with', products.length, 'products');
            let filtered = [...products];

            // Apply category filters (client-side for immediate UI response, main filtering happens in API)
            if (selectedCategories.length > 0) {
                filtered = filtered.filter(p => p.category && selectedCategories.includes(p.category));
            }

            // Apply gender filters
            if (selectedGenders.length > 0) {
                filtered = filtered.filter(p => p.gender && selectedGenders.includes(p.gender));
            }

            // Apply age group filters
            if (selectedAgeGroups.length > 0) {
                filtered = filtered.filter(p => p.ageGroup && selectedAgeGroups.includes(p.ageGroup));
            }

            // PROMOTION FILTERING FIX: Handle promotions directly without API call
            if (promotionType) {
                console.log('[TShirtBrowser] Filtering by promotion type:', promotionType);

                // Only keep products that actually have valid promotions from the database
                if (promotionType === 'store_wide' || promotionType === 'all') {
                    filtered = filtered.filter(p => p.promotion && p.promotion.isActive && p.promotion.discountValue > 0);
                    console.log('[TShirtBrowser] Filtered to products with valid promotions:', filtered.length);
                } else if (promotionType === 'clearance') {
                    filtered = filtered.filter(p => p.isOnClearance);
                }
            }

            // Sorting is now handled by the API, but keep this as a fallback
            // and to ensure immediate UI response
            switch (sortBy) {
                case 'price-low-to-high':
                    filtered.sort((a, b) => {
                        const aPrice = a.promotion ? calculateDiscountedPrice(a.price, a.promotion).discountedPrice : parseFloat(a.price);
                        const bPrice = b.promotion ? calculateDiscountedPrice(b.price, b.promotion).discountedPrice : parseFloat(b.price);
                        return aPrice - bPrice;
                    });
                    break;
                case 'price-high-to-low':
                    filtered.sort((a, b) => {
                        const aPrice = a.promotion ? calculateDiscountedPrice(a.price, a.promotion).discountedPrice : parseFloat(a.price);
                        const bPrice = b.promotion ? calculateDiscountedPrice(b.price, b.promotion).discountedPrice : parseFloat(b.price);
                        return bPrice - aPrice;
                    });
                    break;
                case 'newest':
                    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    break;
                default:
                    // 'featured' sorting - prioritize products with active promotions
                    filtered.sort((a, b) => {
                        const aHasPromo = a.promotion && a.promotion.isActive;
                        const bHasPromo = b.promotion && b.promotion.isActive;
                        if (aHasPromo && !bHasPromo) return -1;
                        if (!aHasPromo && bHasPromo) return 1;
                        return 0;
                    });
            }

            setFilteredProducts(filtered);
            console.log('[TShirtBrowser] Final filtered products count:', filtered.length);
        };

        filterProducts();
    }, [products, selectedCategories, selectedGenders, selectedAgeGroups, sortBy, promotionType]);

    // Replace problematic API call with direct promotion handling
    useEffect(() => {
        console.log('[TShirtBrowser] Applying direct promotion handling');

        // No longer forcing store-wide promotion visibility
    }, [promotionType]);

    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Mobile Filter Toggle Button */}
                <button
                    className="md:hidden bg-blue-600 text-white px-4 py-2 rounded mb-4"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? 'Hide Filters' : 'Show Filters'}
                </button>

                {/* Sidebar Filters */}
                <div className={`md:w-1/4 ${sidebarOpen ? 'block' : 'hidden'} md:block`}>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold mb-6">Filters</h2>

                        {/* Categories Filter */}
                        <FilterSection
                            title="Categories"
                            options={categoryOptions}
                            selected={selectedCategories}
                            onChange={(id) => toggleFilter('category', id)}
                        />

                        {/* Gender Filter */}
                        <FilterSection
                            title="Gender"
                            options={genderOptions}
                            selected={selectedGenders}
                            onChange={(id) => toggleFilter('gender', id)}
                        />

                        {/* Age Group Filter */}
                        <FilterSection
                            title="Age Group"
                            options={ageGroupOptions}
                            selected={selectedAgeGroups}
                            onChange={(id) => toggleFilter('ageGroup', id)}
                        />

                        {/* Sort Options */}
                        <div className="mb-6">
                            <h3 className="font-semibold mb-2">Sort By</h3>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="featured">Featured</option>
                                <option value="price-low-to-high">Price: Low to High</option>
                                <option value="price-high-to-low">Price: High to Low</option>
                                <option value="newest">Newest</option>
                            </select>
                        </div>

                        {/* Clear Filters Button */}
                        <button
                            onClick={() => {
                                setSelectedCategories([]);
                                setSelectedGenders([]);
                                setSelectedAgeGroups([]);
                                setSortBy('featured');
                            }}
                            className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors mt-4"
                        >
                            Clear All Filters
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:w-3/4">
                    {loading ? (
                        <div className="flex justify-center items-center h-96">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
                            <p>{error}</p>
                            <p>Using static product data as fallback.</p>
                        </div>
                    ) : (
                        <>
                            {/* Results Count */}
                            <div className="mb-6 flex justify-between items-center">
                                <div>
                                    <h1 className="text-2xl font-bold mb-2">Products</h1>
                                    <p className="text-gray-600">{filteredProducts.length} results found</p>
                                </div>
                            </div>

                            {/* Products Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredProducts.map(product => {
                                    // Fix any potential image URL issues
                                    const enhancedProduct = {
                                        ...product,
                                        // Ensure image URL is properly set
                                        image: product.image || product.imageUrl || '/assets/placeholder-product.jpg'
                                    };

                                    // For debugging: log the product image URL
                                    console.log(`[TShirtBrowser] Product: ${product.name}, Image URL: ${enhancedProduct.image}`);

                                    return (
                                        <div key={product.id || product._id} className="h-full">
                                            <ProductCard
                                                product={enhancedProduct}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* No Results Message */}
                            {filteredProducts.length === 0 && (
                                <div className="text-center py-12">
                                    <h3 className="text-xl font-semibold mb-2">No products found</h3>
                                    <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Update ReadyMadeProductCard to handle size and color selection
const ReadyMadeProductCard = ({ product, onAddToCart }) => {
    const [selectedSize, setSelectedSize] = useState('');
    // Set default color to null if colors array is empty or undefined
    const [selectedColor, setSelectedColor] = useState(
        product.colors && product.colors.length > 0 ? product.colors[0] : null
    );
    const PLACEHOLDER_IMAGE = '/assets/placeholder-product.jpg';

    // Handle image loading errors by using a placeholder
    const handleImageError = (e) => {
        console.error('Failed to load product image, using placeholder');
        e.target.src = PLACEHOLDER_IMAGE;
        e.target.onerror = null; // Prevent infinite error loops
    };

    // Get the image URL, handling both backend and frontend image paths
    const getImageUrl = (imagePath) => {
        if (!imagePath) return PLACEHOLDER_IMAGE;

        // If it's a backend image path (starts with /uploads)
        if (imagePath.startsWith('/uploads')) {
            return `http://localhost:5002${imagePath}`;
        }

        // Otherwise, use the path as is (for frontend static images)
        return imagePath;
    };

    const handleAddToCartClick = () => {
        if (!selectedSize) {
            alert('Please select a size');
            return;
        }
        // Color is now optional - pass whatever is selected or null
        onAddToCart(product, selectedSize, selectedColor);
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-1">
            <div className="relative aspect-square">
                <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity" />
            </div>
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-2">${parseFloat(product.price).toFixed(2)}</p>

                {/* Size selector */}
                <div className="mb-3">
                    <select
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="w-full border rounded-md p-2"
                    >
                        <option value="">Select Size</option>
                        {product.sizes && product.sizes.map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>

                {/* Color selector - only show if colors are available */}
                {product.colors && product.colors.length > 0 && (
                    <div className="flex gap-2 mb-3">
                        {product.colors.map(color => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={`w-6 h-6 rounded-full border-2 ${selectedColor === color
                                    ? 'border-blue-500'
                                    : 'border-gray-300'
                                    }`}
                                style={{ backgroundColor: color.split('/')[0] }}
                                title={color}
                            />
                        ))}
                    </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                    {product.tags && product.tags.map(tag => (
                        <span
                            key={tag}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <button
                    onClick={handleAddToCartClick}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Add to Cart
                </button>
            </div>
        </div>
    );
};

export default TShirtBrowser; 