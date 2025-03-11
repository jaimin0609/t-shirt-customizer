// Instead of import, use global variable from config.js (added to window.API_URL)
// Remove the import line above

// Ensure API_URL is available
if (typeof window.API_URL === 'undefined') {
    console.warn('API_URL not found on window object, using default value');
    window.API_URL = '/api'; // Fallback value
}

// Products Management
let products = [];
let editingProductId = null;

// Make functions globally available
window.showAddProductModal = showAddProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.saveProduct = saveProduct;

// Load Products
async function loadProducts(searchTerm = '') {
    try {
        console.log('Loading products...');
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            showToast('error', 'Authentication required');
            window.location.href = '/admin/login.html';
            return;
        }
        
        // Build query string
        let url = `${window.API_URL}/products`;
        if (searchTerm) {
            url += `?search=${encodeURIComponent(searchTerm)}`;
        }
        
        console.log('Fetching products from:', url);
        console.log('Using token:', token.substring(0, 10) + '...');
        
        // Fetch products
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to load products: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        // Parse response
        const data = await response.json();
        console.log('Received data:', data);
        
        // Handle both array and pagination object formats
        const products = Array.isArray(data) ? data : (data.products || []);
        console.log(`Processing ${products.length} products:`, products);
        
        // Display products
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('error', 'Failed to load products: ' + error.message);
        
        // Display error message in the table
        const tableBody = document.getElementById('productsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-danger">
                        Error loading products: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// Show Add Product Modal
function showAddProductModal() {
    editingProductId = null;
    const form = document.getElementById('productForm');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewElement = document.getElementById('imagePreviewElement');
    
    // Reset form and clear image preview
    if (form) {
        form.reset();
        if (imagePreview && imagePreviewElement) {
            imagePreview.style.display = 'none';
            imagePreviewElement.src = '';
        }
    }
    
    document.getElementById('productModalTitle').textContent = 'Add Product';
    
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// Edit Product
async function editProduct(productId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('error', 'Authentication required');
            return;
        }

        editingProductId = productId;
        const response = await fetch(`${window.API_URL}/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch product details');
        }
        const product = await response.json();
        
        // Fill the form with product details
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productStatus').value = product.status;
        
        // Set gender and age group if they exist
        if (document.getElementById('productGender')) {
            document.getElementById('productGender').value = product.gender || 'unisex';
        }
        
        if (document.getElementById('productAgeGroup')) {
            document.getElementById('productAgeGroup').value = product.ageGroup || 'adult';
        }
        
        // Set isCustomizable checkbox
        if (document.getElementById('productCustomizable')) {
            document.getElementById('productCustomizable').checked = product.isCustomizable || false;
        }

        // Show image preview if exists
        let mainImage = null;

        // Check for images array first
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            mainImage = product.images[0];
            console.log(`Edit mode: Using image from images array: ${mainImage}`);
        } 
        // Fall back to legacy image field
        else if (product.image) {
            mainImage = product.image;
            console.log(`Edit mode: Using legacy image field: ${mainImage}`);
        }

        if (mainImage) {
            // Ensure the image URL starts with a slash if it's a relative path
            if (!mainImage.startsWith('/') && !mainImage.startsWith('http')) {
                mainImage = '/' + mainImage;
            }
            
            console.log(`Edit mode: Setting image preview to: ${mainImage}`);
            
            // Set the preview image
            document.getElementById('imagePreviewElement').src = mainImage;
            document.getElementById('imagePreviewElement').onerror = function() {
                console.log('Edit mode: Image failed to load, using placeholder');
                this.onerror = null;
                this.src = '/admin/assets/placeholder.png';
            };
            document.getElementById('imagePreview').style.display = 'block';
        } else {
            document.getElementById('imagePreview').style.display = 'none';
        }

        // Update modal title
        document.getElementById('productModalTitle').textContent = 'Edit Product';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    } catch (error) {
        console.error('Error editing product:', error);
        showToast('error', 'Failed to load product details');
    }
}

// Save Product
async function saveProduct() {
    try {
        // Show loading indicator
        const saveButton = document.getElementById('saveProductBtn');
        const originalButtonText = saveButton.textContent;
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;
        
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('error', 'Authentication required');
            saveButton.textContent = originalButtonText;
            saveButton.disabled = false;
            return;
        }

        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        
        // Log form data contents
        console.log('Form data contents:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value}`);
        }
        
        // Check if there are image files and validate them
        const imageFiles = [];
        for (let [key, value] of formData.entries()) {
            if (key === 'images' && value instanceof File && value.size > 0) {
                imageFiles.push(value);
                
                // Validate file type
                const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!validTypes.includes(value.type)) {
                    showToast('error', `Invalid file type: ${value.name}. Only JPEG, PNG, GIF, and WebP are supported.`);
                    saveButton.textContent = originalButtonText;
                    saveButton.disabled = false;
                    return;
                }
                
                // Validate file size (max 5MB)
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (value.size > maxSize) {
                    showToast('error', `File too large: ${value.name}. Maximum size is 5MB.`);
                    saveButton.textContent = originalButtonText;
                    saveButton.disabled = false;
                    return;
                }
            }
        }
        
        console.log(`Found ${imageFiles.length} image files to upload`);
        
        const url = editingProductId ? 
            `${window.API_URL}/products/${editingProductId}` : 
            `${window.API_URL}/products`;
            
        const method = editingProductId ? 'PUT' : 'POST';

        console.log('Saving product...', {
            url,
            method,
            editingProductId,
            token: token.substring(0, 10) + '...',
            imageCount: imageFiles.length
        });

        const response = await fetch(url, {
            method: method,
            body: formData,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Save response status:', response.status);
        console.log('Save response headers:', Object.fromEntries(response.headers.entries()));

        // First check if the response is JSON
        const contentType = response.headers.get("content-type");
        
        // Check for error response
        if (!response.ok) {
            let errorMessage = 'Failed to save product';
            
            // Try to get detailed error from JSON response
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
                console.error('Server error:', errorData);
            } else {
                // If not JSON, try to get text
                const errorText = await response.text();
                console.error('Server response:', errorText);
            }
            
            // Handle specific HTTP status codes
            if (response.status === 401 || response.status === 403) {
                errorMessage = 'You do not have permission to perform this action';
            } else if (response.status === 400) {
                errorMessage = 'Invalid product data. Please check your inputs.';
            } else if (response.status === 413) {
                errorMessage = 'Image file too large. Maximum total size is 10MB.';
            } else if (response.status === 415) {
                errorMessage = 'Unsupported file type. Use JPG, PNG, GIF, or WebP images.';
            } else if (response.status === 500) {
                errorMessage = 'Server error while saving product. Try again later.';
            } else if (response.status === 0) {
                errorMessage = 'Network error. Check your internet connection or CORS settings.';
            }
            
            throw new Error(errorMessage);
        }

        // Get the response data
        let data = {};
        if (contentType && contentType.indexOf("application/json") !== -1) {
            try {
                data = await response.json();
                console.log('Save response data:', data);
            } catch (e) {
                console.warn('Could not parse JSON response:', e);
            }
        }

        // Show success message
        const message = editingProductId ? 'Product updated successfully' : 'Product added successfully';
        showToast('success', message);
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        modal.hide();
        
        // Reload products
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        showToast('error', error.message || 'Failed to save product');
    } finally {
        // Reset button state
        const saveButton = document.getElementById('saveProductBtn');
        saveButton.textContent = 'Save Product';
        saveButton.disabled = false;
    }
}

// Delete Product
async function deleteProduct(productId) {
    try {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('error', 'Authentication required');
            return;
        }
        
        console.log(`Deleting product ${productId}...`);
        
        // Debug: Log the full URL and headers being sent
        const deleteUrl = `${window.API_URL}/products/${productId}`;
        console.log('DELETE request to:', deleteUrl);
        console.log('Authorization token (first 10 chars):', token.substring(0, 10) + '...');
        
        // First try to fetch the product to confirm it exists
        try {
            const checkResponse = await fetch(`${window.API_URL}/products/${productId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!checkResponse.ok) {
                console.error(`Product ${productId} not found or not accessible`);
                throw new Error(`Product not found or not accessible. Status: ${checkResponse.status}`);
            }
            
            const productData = await checkResponse.json();
            console.log(`Product ${productId} exists:`, productData.name || 'Unknown name');
            
            // Check if product has variants
            if (productData.hasVariants) {
                console.log('Product has variants that will be deleted');
            }
        } catch (checkError) {
            console.error('Error checking product existence:', checkError);
            // Continue with delete anyway
        }
        
        // Show loading state
        const deleteButton = document.querySelector(`button[onclick*="deleteProduct(${productId})"]`);
        if (deleteButton) {
            deleteButton.disabled = true;
            deleteButton.innerHTML = '<i class="bi bi-hourglass-split"></i>';
        }
        
        // Attempt to delete the product
        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        // Check response status
        console.log('Delete response status:', response.status);
        console.log('Delete response headers:', Object.fromEntries(response.headers.entries()));
        
        // Try to parse error message from response when available
        let errorMessage = 'Failed to delete product';
        let responseData = null;
        
        // Handle different error cases
        if (!response.ok) {
            // Try to get detailed error from JSON response
            try {
                const errorData = await response.json();
                responseData = errorData;
                errorMessage = errorData.message || errorMessage;
                console.error('Server error details:', errorData);
                
                // Format user-friendly error messages
                if (errorData.table === 'ProductVariants') {
                    errorMessage = 'Cannot delete product because it still has variants. Please delete all variants first.';
                } else if (errorData.table === 'OrderItems') {
                    errorMessage = 'Cannot delete product because it appears in customer orders.';
                }
                
                // Add more detailed context if available
                if (errorData.error && typeof errorData.error === 'string' && errorData.error.includes('Key')) {
                    console.log('Detailed error information available');
                }
            } catch (parseError) {
                // If not JSON, try to get text
                try {
                    const errorText = await response.text();
                    console.error('Server response (text):', errorText);
                } catch (textError) {
                    console.error('Could not parse error response:', textError);
                }
            }
            
            // Handle specific HTTP status codes
            if (response.status === 401 || response.status === 403) {
                errorMessage = 'You do not have permission to delete this product';
            } else if (response.status === 404) {
                errorMessage = 'Product not found. It may have been already deleted.';
            } else if (response.status === 500) {
                errorMessage = 'Server error while deleting product. Try again later.';
            }
            
            throw new Error(errorMessage);
        } else {
            // Successfully deleted
            try {
                // Try to parse success response
                responseData = await response.json();
                console.log('Success response:', responseData);
            } catch (e) {
                console.log('No JSON in success response (expected for 204 No Content)');
            }
        }
        
        console.log('Product deleted successfully');
        showToast('success', 'Product deleted successfully');
        loadProducts(); // Reload the table
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('error', error.message || 'Failed to delete product');
    } finally {
        // Reset any UI elements that were changed
        const deleteButton = document.querySelector(`button[onclick*="deleteProduct(${productId})"]`);
        if (deleteButton) {
            deleteButton.disabled = false;
            deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
        }
    }
}

// Show Toast Notification
function showToast(type, message) {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Loading products.js...');
    loadProducts();
    
    // Set up event listeners for search and filters if needed
    const searchInput = document.getElementById('navbarSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            loadProducts(this.value);
        }, 500));
    }

    const productImage = document.getElementById('productImage');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewElement = document.getElementById('imagePreviewElement');

    if (productImage) {
        productImage.addEventListener('change', function(e) {
            console.log('Image file selected:', e.target.files[0]);
            const file = e.target.files[0];
            
            if (file) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    console.error('Selected file is not an image');
                    showToast('error', 'Please select an image file');
                    productImage.value = '';
                    imagePreview.style.display = 'none';
                    return;
                }
                
                // Validate file size (5MB limit)
                if (file.size > 5 * 1024 * 1024) {
                    console.error('File size exceeds 5MB limit');
                    showToast('error', 'Image size should be less than 5MB');
                    productImage.value = '';
                    imagePreview.style.display = 'none';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    console.log('Image loaded successfully');
                    imagePreviewElement.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                
                reader.onerror = function(e) {
                    console.error('Error reading file:', e);
                    showToast('error', 'Error reading image file');
                    imagePreview.style.display = 'none';
                };
                
                reader.readAsDataURL(file);
            } else {
                imagePreview.style.display = 'none';
            }
        });
    } else {
        console.error('Product image input not found');
    }
});

// Display Products
function displayProducts(products) {
    const tableBody = document.getElementById('productsTableBody');
    if (!tableBody) {
        console.error('Products table body not found!');
        return;
    }
    
    if (!products || products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">No products found</td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = '';
    products.forEach(product => {
        // Get the main image from either images array or legacy image field
        let mainImage = '/admin/assets/placeholder.png';
        
        try {
            // Improved image URL handling to support all formats
            console.log(`Processing product ${product.id} images:`, {
                hasImagesArray: !!product.images,
                imagesType: typeof product.images,
                mainImage: product.image,
            });
            
            // Handle different image data formats
            if (product.images) {
                let imagesArray = product.images;
                
                // If it's a string, try to parse it as JSON
                if (typeof imagesArray === 'string') {
                    try {
                        imagesArray = JSON.parse(imagesArray);
                    } catch (e) {
                        console.warn(`Failed to parse images JSON for product ${product.id}:`, e);
                    }
                }
                
                // If we now have an array with contents, use the first image
                if (Array.isArray(imagesArray) && imagesArray.length > 0) {
                    // Filter out any null/undefined/empty values
                    const validImages = imagesArray.filter(img => img);
                    if (validImages.length > 0) {
                        mainImage = validImages[0];
                        console.log(`Using image from images array: ${mainImage}`);
                    }
                }
            }
            
            // Fallback to the legacy image field if images array didn't work
            if (mainImage === '/admin/assets/placeholder.png' && product.image) {
                mainImage = product.image;
                console.log(`Using legacy image field: ${mainImage}`);
            }
            
            // Ensure the image URL is correctly formatted
            if (mainImage && typeof mainImage === 'string') {
                // Handle different image URL formats
                if (mainImage.startsWith('http') || mainImage.startsWith('https')) {
                    // Already a full URL, no change needed
                    console.log(`Using absolute URL: ${mainImage}`);
                } else if (mainImage.startsWith('data:image')) {
                    // Data URL, no change needed
                    console.log(`Using data URL (truncated): ${mainImage.substring(0, 30)}...`);
                } else {
                    // Ensure the image URL starts with a slash if it's a relative path
                    if (!mainImage.startsWith('/')) {
                        mainImage = '/' + mainImage;
                    }
                    console.log(`Using relative URL: ${mainImage}`);
                    
                    // Check if this is a Cloudinary ID without the full URL
                    if (mainImage.includes('/v1/') || mainImage.includes('/upload/')) {
                        // This might be a Cloudinary ID without the domain
                        // Try to construct a full Cloudinary URL
                        if (window.CLOUDINARY_CLOUD_NAME) {
                            mainImage = `https://res.cloudinary.com/${window.CLOUDINARY_CLOUD_NAME}/image/upload${mainImage}`;
                            console.log(`Converted to full Cloudinary URL: ${mainImage}`);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(`Error processing image for product ${product.id}:`, e);
            mainImage = '/admin/assets/placeholder.png';
        }
        
        // Log the final image URL for debugging
        console.log(`Final image URL for product ${product.id}: ${mainImage}`);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>
                <img src="${mainImage}" 
                     alt="${product.name}" 
                     class="product-thumbnail"
                     onerror="this.onerror=null; this.src='/admin/assets/placeholder.png'; console.log('Image load error for product ${product.id}, using placeholder');"
                     style="width: 50px; height: 50px; object-fit: cover;">
            </td>
            <td>${product.name}</td>
            <td>${product.category || 'N/A'}</td>
            <td>$${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <span class="badge bg-${product.status === 'active' ? 'success' : 'danger'}">
                    ${product.status || 'inactive'}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary me-1" onclick="window.editProduct(${product.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteProduct(${product.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Utility function to debounce input events
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}