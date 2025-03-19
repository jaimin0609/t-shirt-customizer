// Use the API URL from config
import { API_URL, FALLBACK_API_URL, API_CONFIG, getCorsHeaders, getWorkingApiUrl } from '../config/api';
import axios from 'axios';

// Production code should not have console.log statements
const isProd = import.meta.env.PROD;
const log = (message, data) => {
  if (!isProd) {
    console.log(message, data);
  }
};

// Helper function to ensure product images and prices are properly formatted
const processProductData = (product) => {
    if (!product) return null;
    
    // Ensure we have a valid image path
    const processedProduct = {
        ...product,
        // Ensure both ID formats are available
        id: product.id || product._id,
        _id: product._id || product.id,
        // Normalize image property
        image: product.image || 
               (product.images && Array.isArray(product.images) && product.images.length > 0 
                  ? product.images[0] 
                  : '/assets/placeholder-product.jpg'),
        // Ensure stockCount is available (using stock from backend)
        stockCount: product.stockCount !== undefined ? product.stockCount : 
                  (product.stock !== undefined ? product.stock : 0)
    };
    
    // Ensure price is a valid number
    if (typeof processedProduct.price === 'string') {
        processedProduct.price = parseFloat(processedProduct.price);
        if (isNaN(processedProduct.price)) {
            processedProduct.price = 0;
        }
    }
    
    return processedProduct;
};

// Process an array of products to ensure all have proper image and price properties
const processProductsArray = (products) => {
    if (!Array.isArray(products)) return [];
    return products.map(processProductData).filter(Boolean);
};

// Utility function to handle fetch requests with CORS
const fetchWithCORS = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        ...getCorsHeaders(token),
        ...(options.headers || {})
    };
    
    const fetchOptions = {
        ...API_CONFIG,
        ...options,
        headers
    };
    
    try {
        const response = await fetch(url, fetchOptions);
        return response;
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        // Try fallback URL if main URL fails
        if (url.startsWith(API_URL) && API_URL !== FALLBACK_API_URL) {
            const fallbackUrl = url.replace(API_URL, FALLBACK_API_URL);
            console.log(`Trying fallback URL: ${fallbackUrl}`);
            return fetch(fallbackUrl, fetchOptions);
        }
        throw error;
    }
};

// Get featured products for homepage
const getFeaturedProducts = async () => {
    try {
        const apiUrl = await getWorkingApiUrl();
        const response = await axios.get(`${apiUrl}/api/products/featured`, {
            headers: getCorsHeaders()
        });
        
        if (response.data && Array.isArray(response.data)) {
            // Process products to ensure ID consistency
            return processProductsArray(response.data);
        }
        
        // Handle case where API returned success but invalid data format
        log('getFeaturedProducts: API returned invalid data format', response.data);
        
        // Return mocked data if API response is invalid
        return getMockedFeaturedProducts();
    } catch (error) {
        log('getFeaturedProducts: Error fetching featured products', error);
        
        // Fallback to mocked data if API request failed
        return getMockedFeaturedProducts();
    }
};

// Fallback function to get mocked featured products when API is unavailable
const getMockedFeaturedProducts = () => {
    const mockedProducts = [
        {
            id: 'featured-1',
            _id: 'featured-1', // Added _id to ensure consistency
            name: 'Classic Crew Neck T-shirt',
            description: 'Premium cotton t-shirt with comfortable fit',
            price: 24.99,
            discountPercentage: 10,
            discountedPrice: 22.49,
            rating: 4.8,
            category: 'Men\'s T-shirts',
            images: ['/images/products/classic-crew-tshirt.jpg'],
            colors: ['black', 'white', 'navy', 'gray'],
            sizes: ['S', 'M', 'L', 'XL', 'XXL']
        },
        {
            id: 'featured-2',
            _id: 'featured-2', // Added _id to ensure consistency
            name: 'Vintage Logo T-shirt',
            description: 'Retro-inspired design with our classic logo',
            price: 29.99,
            discountPercentage: 0,
            discountedPrice: 29.99,
            rating: 4.6,
            category: 'Graphic Tees',
            images: ['/images/products/vintage-logo-tshirt.jpg'],
            colors: ['white', 'gray', 'blue'],
            sizes: ['S', 'M', 'L', 'XL']
        },
        {
            id: 'featured-3',
            _id: 'featured-3', // Added _id to ensure consistency
            name: 'V-Neck Slim Fit',
            description: 'Modern slim fit v-neck in soft cotton blend',
            price: 26.99,
            discountPercentage: 15,
            discountedPrice: 22.94,
            rating: 4.7,
            category: 'Men\'s T-shirts',
            images: ['/images/products/vneck-slim-tshirt.jpg'],
            colors: ['black', 'white', 'red'],
            sizes: ['S', 'M', 'L', 'XL']
        },
        {
            id: 'featured-4',
            _id: 'featured-4', // Added _id to ensure consistency
            name: 'Eco-Friendly Organic Tee',
            description: 'Made from 100% organic cotton, sustainable and eco-friendly',
            price: 34.99,
            discountPercentage: 0,
            discountedPrice: 34.99,
            rating: 4.9,
            category: 'Sustainable Collection',
            images: ['/images/products/eco-friendly-tshirt.jpg'],
            colors: ['green', 'beige', 'blue'],
            sizes: ['S', 'M', 'L', 'XL']
        }
    ];
    
    // Process the mocked products to ensure they follow the same format
    return mockedProducts.map(processProductData);
};

export const productService = {
    getAllProducts: async () => {
        try {
            // Try to get a working API URL
            const baseUrl = await getWorkingApiUrl();
            console.log(`Using API URL for products: ${baseUrl}`);
            
            // Public endpoint - no token required
            const response = await fetchWithCORS(`${baseUrl}/products`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Failed to fetch products: ${response.status} ${response.statusText}`, errorData);
                return []; // Return empty array instead of throwing error
            }
            
            const data = await response.json();
            return processProductsArray(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            // Fallback to returning an empty array instead of throwing an error
            return [];
        }
    },

    getFilteredProducts: async (filters = {}) => {
        try {
            // Public endpoint - no token required
            
            // Build query string from filters
            const queryParams = new URLSearchParams();
            
            if (filters.categories && filters.categories.length > 0) {
                filters.categories.forEach(category => {
                    queryParams.append('category', category);
                });
            }
            
            if (filters.genders && filters.genders.length > 0) {
                filters.genders.forEach(gender => {
                    queryParams.append('gender', gender);
                });
            }
            
            if (filters.ageGroups && filters.ageGroups.length > 0) {
                filters.ageGroups.forEach(ageGroup => {
                    queryParams.append('ageGroup', ageGroup);
                });
            }
            
            if (filters.sortBy) {
                queryParams.append('sortBy', filters.sortBy);
            }
            
            // Add any other filters as needed
            const queryString = queryParams.toString();
            
            // Get a working API URL instead of using the default one directly
            const baseUrl = await getWorkingApiUrl();
            const url = `${baseUrl}/products${queryString ? `?${queryString}` : ''}`;
            
            console.log('Fetching products from:', url);
            const token = localStorage.getItem('token'); 
            console.log('Using token:', token ? token.substring(0, 10) + '...' : 'none');
            
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const response = await fetch(url, { headers });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Failed to fetch filtered products: ${response.status}`, errorData);
                return []; // Return empty array instead of throwing error
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            
            // Handle different response formats
            if (Array.isArray(data)) {
                // Backend returned an array directly
                return data;
            } else if (data && Array.isArray(data.products)) {
                // Backend returned an object with a products array property
                return data.products;
            } else {
                // Unexpected format, log error and return empty array
                console.error('Error response:', data);
                throw new Error(`Failed to load products: ${response.status} - ${JSON.stringify(data)}`);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            // Fallback to returning an empty array
            return [];
        }
    },

    getProductById: async (productId) => {
        try {
            // Validate product ID
            if (!productId || productId === 'undefined' || productId === 'null') {
                console.error('Invalid product ID provided:', productId);
                throw new Error('Invalid product ID');
            }
            
            console.log(`[ProductService] Fetching product with ID: ${productId}`);
            
            // Try to get a working API URL
            const baseUrl = await getWorkingApiUrl();
            console.log(`[ProductService] Using API URL: ${baseUrl}`);
            
            // Public endpoint - no token required
            const url = `${baseUrl}/products/${productId}`;
            console.log(`[ProductService] Making request to: ${url}`);
            
            const response = await fetchWithCORS(url);
            console.log(`[ProductService] Response status: ${response.status}`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Failed to fetch product details: ${response.status} ${response.statusText}`, errorData);
                
                // If we got a 404, try a fallback approach
                if (response.status === 404) {
                    console.log('[ProductService] Attempting fallback product fetch with alternative endpoint');
                    return fetchProductFallback(productId, baseUrl);
                }
                
                throw new Error(errorData.message || `Failed to fetch product details`);
            }
            
            const data = await response.json();
            console.log('[ProductService] Successfully fetched product data:', data);
            return processProductData(data);
        } catch (error) {
            console.error('[ProductService] Error in getProductById:', error);
            
            // If we hit an error that's not already from the fallback, try the fallback approach
            if (!error.message.includes('fallback failed')) {
                try {
                    console.log('[ProductService] Attempting fallback product fetch after error');
                    const baseUrl = await getWorkingApiUrl();
                    return await fetchProductFallback(productId, baseUrl);
                } catch (fallbackError) {
                    console.error('[ProductService] Fallback fetch also failed:', fallbackError);
                    // Re-throw the original error if fallback also fails
                    throw error;
                }
            }
            
            throw error;
        }
    },

    getSimilarProducts: async (productId, category) => {
        try {
            log(`[ProductService] Fetching similar products for: ${productId}, category: ${category}`);
            
            // Validate product ID
            if (!productId || productId === 'undefined' || productId === 'null') {
                console.error('[ProductService] Invalid product ID provided:', productId);
                return []; // Return empty array instead of throwing
            }
            
            // Get token if available, but don't require it for public product listing
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            // Try the dedicated similar products endpoint first
            const baseUrl = await getWorkingApiUrl();
            let url = `${baseUrl}/products/${productId}/similar`;
            
            if (category) {
                // If we have category, use that as a fallback
                url = `${baseUrl}/products?category=${encodeURIComponent(category)}&limit=4`;
            }
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                // If the similar products endpoint fails and we didn't try category yet, fall back to category
                if (!url.includes('category') && category) {
                    log('[ProductService] Similar products endpoint failed, trying category-based similar products');
                    const categoryUrl = `${baseUrl}/products?category=${encodeURIComponent(category)}&limit=4`;
                    const categoryResponse = await fetch(categoryUrl, {
                        method: 'GET',
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (categoryResponse.ok) {
                        const data = await categoryResponse.json();
                        // Process and filter out the current product
                        const processedProducts = processProductsArray(data)
                            .filter(p => 
                                (p.id && p.id.toString() !== productId.toString()) && 
                                (p._id && p._id.toString() !== productId.toString())
                            )
                            .slice(0, 4);
                        return processedProducts;
                    }
                }
                
                // If all else fails, return empty array
                log('[ProductService] Failed to get similar products, returning empty array');
                return [];
            }
            
            const data = await response.json();
            
            // Process and filter out the current product
            const processedProducts = processProductsArray(data)
                .filter(p => 
                    (p.id && p.id.toString() !== productId.toString()) && 
                    (p._id && p._id.toString() !== productId.toString())
                )
                .slice(0, 4);
            
            return processedProducts;
        } catch (error) {
            log('[ProductService] Error fetching similar products:', error);
            return []; // Return empty array instead of throwing
        }
    },

    getProductReviews: async (productId) => {
        try {
            const response = await fetch(`${API_URL}/products/${productId}/reviews`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Failed to fetch product reviews: ${response.status} ${response.statusText}`, errorData);
                // Return empty array instead of throwing error to avoid breaking the UI
                return [];
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getProductReviews:', error);
            // Return empty array instead of throwing error to avoid breaking the UI
            return [];
        }
    },

    addProductReview: async (productId, reviewData) => {
        try {
            // Token required for submitting reviews
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required to submit a review.');
            }
            
            // Add timestamp to reduce chance of duplicate submissions
            const reviewWithTimestamp = {
                ...reviewData,
                submittedAt: new Date().toISOString()
            };
            
            const response = await fetch(`${API_URL}/products/${productId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reviewWithTimestamp)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // Check for rate limiting or authentication errors
                if (response.status === 429 || (errorData.message && 
                    (errorData.message.includes('authentication') || 
                     errorData.message.includes('rate limit') || 
                     errorData.message.includes('too many')))) {
                    throw new Error('You\'re submitting too quickly. Please wait a moment before trying again.');
                }
                
                throw new Error(errorData.message || `Failed to submit review: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in addProductReview:', error);
            throw error;
        }
    },

    createProduct: async (productData) => {
        try {
            console.log('Creating new product:', productData);
            
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required to create products');
            }
            
            // Handle form data for file uploads
            let requestBody;
            let headers = { 'Authorization': `Bearer ${token}` };
            
            if (productData instanceof FormData) {
                requestBody = productData;
            } else {
                requestBody = JSON.stringify(productData);
                headers['Content-Type'] = 'application/json';
            }
            
            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers,
                body: requestBody
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to create product: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Product created successfully:', data);
            return data;
        } catch (error) {
            console.error('Error in createProduct:', error);
            throw error;
        }
    },

    updateProduct: async (id, productData) => {
        try {
            console.log('Updating product with ID:', id);
            
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required to update products');
            }
            
            // Handle form data for file uploads
            let requestBody;
            let headers = { 'Authorization': `Bearer ${token}` };
            
            if (productData instanceof FormData) {
                requestBody = productData;
            } else {
                requestBody = JSON.stringify(productData);
                headers['Content-Type'] = 'application/json';
            }
            
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers,
                body: requestBody
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to update product: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Product updated successfully:', data);
            return data;
        } catch (error) {
            console.error('Error in updateProduct:', error);
            throw error;
        }
    },

    deleteProduct: async (id) => {
        try {
            console.log('Deleting product with ID:', id);
            
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required to delete products');
            }
            
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to delete product: ${response.status} ${response.statusText}`);
            }
            
            console.log('Product deleted successfully');
            return true;
        } catch (error) {
            console.error('Error in deleteProduct:', error);
            throw error;
        }
    },

    getCategories: async () => {
        try {
            const response = await fetch(`${API_URL}/products/categories/all`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Failed to fetch categories: ${response.status} ${response.statusText}`, errorData);
                return []; // Return empty array instead of throwing error
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return []; // Return empty array instead of throwing error
        }
    },
    
    getGenders: async () => {
        try {
            const response = await fetch(`${API_URL}/products/genders/all`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Failed to fetch genders: ${response.status} ${response.statusText}`, errorData);
                return []; // Return empty array instead of throwing error
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching genders:', error);
            return []; // Return empty array instead of throwing error
        }
    },
    
    getAgeGroups: async () => {
        try {
            const response = await fetch(`${API_URL}/products/age-groups/all`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Failed to fetch age groups: ${response.status} ${response.statusText}`, errorData);
                return []; // Return empty array instead of throwing error
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching age groups:', error);
            return []; // Return empty array instead of throwing error
        }
    },

    // New method to get products on sale
    getProductsOnSale: async () => {
        try {
            const response = await fetch(`${API_URL}/promotions/products/on-sale`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Failed to fetch products on sale: ${response.status} ${response.statusText}`, errorData);
                return [];
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching products on sale:', error);
            return [];
        }
    },

    // New method to get active promotions
    getActivePromotions: async () => {
        try {
            const response = await fetch(`${API_URL}/promotions/active`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Failed to fetch active promotions: ${response.status} ${response.statusText}`, errorData);
                return [];
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching active promotions:', error);
            return [];
        }
    },

    // New method to apply a discount to a product (admin only)
    applyProductDiscount: async (productId, discountPercentage) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required to apply discounts');
            }
            
            const response = await fetch(`${API_URL}/products/${productId}/discount`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ discountPercentage })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to apply discount: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error applying product discount:', error);
            throw error;
        }
    },

    // New method to mark products for clearance (admin only)
    markProductsForClearance: async (productIds, discountPercentage) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required to mark products for clearance');
            }
            
            const response = await fetch(`${API_URL}/promotions/clearance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productIds, discountPercentage })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to mark products for clearance: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error marking products for clearance:', error);
            throw error;
        }
    },

    searchProducts: async (query, options = {}) => {
        try {
            // Build query string
            const queryParams = new URLSearchParams();
            if (query) {
                queryParams.append('search', query);
            }
            
            // Add fuzzy search option - this allows the backend to match similar terms
            queryParams.append('fuzzy', 'true');
            
            // Add any additional options
            if (options.limit) {
                queryParams.append('limit', options.limit);
            }
            
            if (options.categories && options.categories.length) {
                options.categories.forEach(category => {
                    queryParams.append('category', category);
                });
            }
            
            if (options.genders && options.genders.length) {
                options.genders.forEach(gender => {
                    queryParams.append('gender', gender);
                });
            }
            
            if (options.ageGroups && options.ageGroups.length) {
                options.ageGroups.forEach(ageGroup => {
                    queryParams.append('ageGroup', ageGroup);
                });
            }
            
            // Get a working API URL instead of using the default one directly
            const baseUrl = await getWorkingApiUrl();
            const url = `${baseUrl}/products?${queryParams.toString()}`;
            
            console.log('Searching products at:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Failed to search products: ${response.status} ${response.statusText}`, errorData);
                return []; // Return empty array instead of throwing error
            }
            
            const data = await response.json();
            console.log('Search API raw response:', {
                type: typeof data,
                isArray: Array.isArray(data),
                data
            });
            
            // Handle different response formats and ensure we always return an array
            if (Array.isArray(data)) {
                return data;
            } else if (data && Array.isArray(data.products)) {
                return data.products;
            } else if (data && data.results && Array.isArray(data.results)) {
                return data.results;
            } else if (data && typeof data === 'object') {
                // If it's an object but not in expected format, try to extract anything that might be products
                const possibleArrayProps = Object.values(data).find(val => Array.isArray(val));
                if (possibleArrayProps) {
                    return possibleArrayProps;
                }
            }
            
            // If we can't determine the format or it's invalid, return empty array
            console.warn('Received unexpected format from search API, returning empty array:', data);
            return [];
        } catch (error) {
            console.error('Error searching products:', error);
            // Fallback to returning an empty array
            return [];
        }
    },

    // Add a new method to get similar or recommended products
    getSimilarOrRecommendedProducts: async (searchTerm = '', limit = 10) => {
        try {
            // First try to get products by related categories or tags
            const queryParams = new URLSearchParams();
            
            // If we have a search term, use it for context
            if (searchTerm) {
                queryParams.append('related_to', searchTerm);
            }
            
            queryParams.append('limit', limit);
            queryParams.append('recommended', 'true');
            
            // Get a working API URL instead of using the default one directly
            const baseUrl = await getWorkingApiUrl();
            const url = `${baseUrl}/products?${queryParams.toString()}`;
            
            console.log('Fetching similar products at:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                // If specific recommendation fails, fall back to popular products
                return productService.getPopularProducts(limit);
            }
            
            const data = await response.json();
            console.log('Similar products API response:', {
                type: typeof data,
                isArray: Array.isArray(data),
                data
            });
            
            // Handle different response formats and ensure we always return an array
            if (Array.isArray(data)) {
                return data;
            } else if (data && Array.isArray(data.products)) {
                return data.products;
            } else if (data && data.results && Array.isArray(data.results)) {
                return data.results;
            } else if (data && data.recommendations && Array.isArray(data.recommendations)) {
                return data.recommendations;
            } else if (data && typeof data === 'object') {
                // If it's an object but not in expected format, try to extract anything that might be products
                const possibleArrayProps = Object.values(data).find(val => Array.isArray(val));
                if (possibleArrayProps) {
                    return possibleArrayProps;
                }
            }
            
            // If we can't determine the format or it's invalid, return empty array
            console.warn('Received unexpected format from similar products API, returning empty array:', data);
            return [];
        } catch (error) {
            console.error('Error getting similar products:', error);
            return productService.getPopularProducts(limit);
        }
    },
    
    // Fallback to popular products when no results are found
    getPopularProducts: async (limit = 10) => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('sort', 'popularity');
            queryParams.append('limit', limit);
            
            // Get a working API URL instead of using the default one directly
            const baseUrl = await getWorkingApiUrl();
            const url = `${baseUrl}/products?${queryParams.toString()}`;
            
            console.log('Fetching popular products at:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Failed to fetch popular products: ${response.status} ${response.statusText}`, errorData);
                return []; // Return empty array as last resort
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching popular products:', error);
            return [];
        }
    },

    // Get all products
    getProducts: async (filters = {}) => {
        try {
            const response = await axios.get(`${API_URL}/products`, {
                params: filters,
                withCredentials: true
            });
            
            // Handle both formats - either direct array or {products: [...]} 
            if (response.data && Array.isArray(response.data)) {
                // Legacy format - direct array
                return response.data;
            } else if (response.data && response.data.products && Array.isArray(response.data.products)) {
                // New format - object with products array
                return response.data.products;
            } else {
                // Fallback - return empty array
                console.warn("Unexpected API response format", response.data);
                return [];
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
            throw error;
        }
    },

    // Add product
    addProduct: async (productData) => {
        try {
            const response = await axios.post(`${API_URL}/products`, productData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Failed to add product:', error);
            throw error;
        }
    },

    // Update product
    updateProduct: async (id, productData) => {
        try {
            const response = await axios.put(`${API_URL}/products/${id}`, productData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error(`Failed to update product with ID ${id}:`, error);
            throw error;
        }
    },

    // Delete product
    deleteProduct: async (id) => {
        try {
            const response = await axios.delete(`${API_URL}/products/${id}`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error(`Failed to delete product with ID ${id}:`, error);
            throw error;
        }
    },

    getFeaturedProducts
};

// Add helper function for getting image URLs
export const getImageUrl = (imageSource) => {
    if (!imageSource) return '/assets/placeholder-product.jpg';
    
    // Handle Cloudinary URLs and other absolute URLs
    if (typeof imageSource === 'string' && (
        imageSource.startsWith('http') || 
        imageSource.startsWith('data:') ||
        imageSource.startsWith('/assets/')
    )) {
        return imageSource;
    }
    
    // Handle relative image paths that start with slash
    if (typeof imageSource === 'string' && imageSource.startsWith('/')) {
        return imageSource;
    }
    
    // Handle backend paths (assuming backend URL is available)
    const backendUrl = API_URL.split('/api')[0];
    return `${backendUrl}/${imageSource.replace(/^\//, '')}`;
};

// Add a fallback method to try alternative endpoints or approaches
const fetchProductFallback = async (productId, baseUrl) => {
    console.log(`[ProductService] Trying fallback product fetch for ID: ${productId}`);
    
    try {
        // Try the products endpoint
        const productsUrl = `${baseUrl}/products`;
        console.log(`[ProductService] Fetching all products from: ${productsUrl}`);
        
        const response = await fetch(productsUrl);
        
        if (!response.ok) {
            throw new Error('Fallback fetch failed: Could not retrieve products list');
        }
        
        const products = await response.json();
        console.log(`[ProductService] Retrieved ${products.length} products, searching for ID: ${productId}`);
        
        // Find the product with the matching ID - ensure consistent ID comparison
        const product = Array.isArray(products) ? 
            products.find(p => 
                (p.id && p.id.toString() === productId.toString()) || 
                (p._id && p._id.toString() === productId.toString())
            ) : null;
        
        if (product) {
            console.log('[ProductService] Found product in fallback list:', product);
            // Process data ensuring ID consistency
            const processedProduct = processProductData(product);
            // Double-check ID consistency for the found product
            if (processedProduct) {
                processedProduct.id = product.id || product._id;
                processedProduct._id = product._id || product.id;
            }
            return processedProduct;
        }
        
        throw new Error('Product not found in fallback data');
    } catch (error) {
        console.error('[ProductService] Fallback product fetch failed:', error);
        throw new Error(`Fallback fetch failed: ${error.message}`);
    }
}; 