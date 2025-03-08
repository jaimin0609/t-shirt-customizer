const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

export const productService = {
    getAllProducts: async () => {
        try {
            // Public endpoint - no token required
            const response = await fetch(`${API_URL}/products`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Failed to fetch products: ${response.status} ${response.statusText}`, errorData);
                return []; // Return empty array instead of throwing error
            }
            
            const data = await response.json();
            return data;
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
            const url = `${API_URL}/products${queryString ? `?${queryString}` : ''}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Failed to fetch filtered products: ${response.status} ${response.statusText}`, errorData);
                return []; // Return empty array instead of throwing error
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching filtered products:', error);
            // Fallback to returning an empty array
            return [];
        }
    },

    getProductById: async (productId) => {
        try {
            // Public endpoint - no token required
            const response = await fetch(`${API_URL}/products/${productId}`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Failed to fetch product details: ${response.status} ${response.statusText}`, errorData);
                throw new Error(errorData.message || `Failed to fetch product details`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getProductById:', error);
            throw error;
        }
    },

    getSimilarProducts: async (productId) => {
        try {
            console.log(`[ProductService] Fetching similar products for: ${productId}`);
            
            // Get token if available, but don't require it for public product listing
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            // Use the dedicated similar products endpoint
            const response = await fetch(`${API_URL}/products/${productId}/similar`, {
                headers
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`[ProductService] Failed to fetch similar products: ${response.status} ${response.statusText}`, errorData);
                // Return empty array instead of throwing error
                return [];
            }
            
            // Get similar products
            const data = await response.json();
            console.log(`[ProductService] Retrieved ${data.length} similar products`);
            
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('[ProductService] Error in getSimilarProducts:', error);
            // Return empty array instead of throwing error
            return [];
        }
    },

    getProductReviews: async (productId) => {
        try {
            // Get token if available, but don't require it for public reviews
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            console.log(`[ProductService] Fetching reviews for product: ${productId}`);
            
            const response = await fetch(`${API_URL}/products/${productId}/reviews`, {
                headers
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`[ProductService] Failed to fetch product reviews: ${response.status} ${response.statusText}`, errorData);
                // Return empty array instead of throwing error to avoid breaking the UI
                return [];
            }
            
            const data = await response.json();
            console.log(`[ProductService] Retrieved ${data.length} reviews for product: ${productId}`);
            return data;
        } catch (error) {
            console.error('[ProductService] Error in getProductReviews:', error);
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
            
            const response = await fetch(`${API_URL}/products/${productId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reviewData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
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
            
            // Use the standard products endpoint with search parameter
            const url = `${API_URL}/products?${queryParams.toString()}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Failed to search products: ${response.status} ${response.statusText}`, errorData);
                return []; // Return empty array instead of throwing error
            }
            
            const data = await response.json();
            return data;
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
            
            const url = `${API_URL}/products?${queryParams.toString()}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                // If specific recommendation fails, fall back to popular products
                return productService.getPopularProducts(limit);
            }
            
            const data = await response.json();
            return data;
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
            
            const url = `${API_URL}/products?${queryParams.toString()}`;
            
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
    }
}; 