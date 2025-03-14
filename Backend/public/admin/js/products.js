// Instead of import, use global variable from config.js (added to window.API_URL)
// Remove the import line above

// Ensure API_URL is available
if (typeof window.API_URL === 'undefined') {
    console.warn('API_URL not found on window object, using default value');
    window.API_URL = '/api'; // Fallback value
}

// Add global configuration for Cloudinary
if (typeof window.CLOUDINARY_CLOUD_NAME === 'undefined') {
    console.warn('CLOUDINARY_CLOUD_NAME not found on window object, using default value');
    window.CLOUDINARY_CLOUD_NAME = 'dopvs93sl'; // Default cloud name
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
function editProduct(id) {
    editingProductId = id;
    document.getElementById('productModalTitle').textContent = 'Edit Product';
    
    // Find the product in the products array
    const product = products.find(p => p.id === id);
    if (!product) {
        console.error(`Product with ID ${id} not found!`);
        return;
    }
    
    // Populate the form fields
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productStock').value = product.stock || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productGender').value = product.gender || 'unisex';
    document.getElementById('productAgeGroup').value = product.ageGroup || 'adult';
    document.getElementById('productStatus').value = product.status || 'active';
    document.getElementById('productCustomizable').checked = product.isCustomizable || false;
    
    // Set description in the textarea
    const descriptionTextarea = document.getElementById('productDescription');
    if (descriptionTextarea) {
        descriptionTextarea.value = product.description || '';
        
        // Also update TinyMCE content if initialized
        setTimeout(() => {
            if (tinymce.get('productDescription')) {
                tinymce.get('productDescription').setContent(product.description || '');
            }
        }, 300); // Delay slightly to ensure TinyMCE has initialized
    }
    
    // Show image preview if available
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewElement = document.getElementById('imagePreviewElement');
    if (imagePreview && imagePreviewElement && product.image) {
        imagePreviewElement.src = product.image;
        imagePreview.style.display = 'block';
    } else if (imagePreview) {
        imagePreview.style.display = 'none';
    }
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// Save Product
async function saveProduct() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('error', 'Authentication required');
            return;
        }
        
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        
        // Get TinyMCE content if editor is initialized
        if (tinymce.get('productDescription')) {
            formData.set('description', tinymce.get('productDescription').getContent());
        }
        
        // Check if customizable is checked and add it to formData
        const isCustomizable = document.getElementById('productCustomizable').checked;
        formData.set('isCustomizable', isCustomizable);
        
        // Add or remove the isCustomizable field
        if (!formData.has('isCustomizable')) {
            formData.append('isCustomizable', false);
        }
        
        // Prepare URL and method based on whether we're editing or adding
        let url = `${window.API_URL}/products`;
        let method = 'POST';
        
        if (editingProductId) {
            url = `${window.API_URL}/products/${editingProductId}`;
            method = 'PUT';
        }
        
        // Send request
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to save product');
        }
        
        // Show success message
        showToast('success', editingProductId ? 'Product updated successfully' : 'Product added successfully');
        
        // Close modal and refresh products
        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        showToast('error', 'Failed to save product');
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
        let originalImagePath = null; // Store original for debugging
        
        try {
            // Store all information about available images for debugging
            const imageInfo = {
                hasImagesArray: !!product.images,
                imagesType: typeof product.images,
                imagesContent: product.images,
                legacyImage: product.image,
                productId: product.id
            };
            console.log(`📷 Product ${product.id} image info:`, imageInfo);
            
            // Handle different image data formats
            if (product.images) {
                let imagesArray = product.images;
                
                // If it's a string, try to parse it as JSON
                if (typeof imagesArray === 'string') {
                    try {
                        imagesArray = JSON.parse(imagesArray);
                        console.log(`Parsed images JSON for product ${product.id}:`, imagesArray);
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
                        originalImagePath = mainImage; // Store original path
                        console.log(`Using image from images array: ${mainImage}`);
                    }
                }
                // If images is an object with properties (like {front: 'url', back: 'url'})
                else if (imagesArray && typeof imagesArray === 'object' && !Array.isArray(imagesArray)) {
                    // Try common image property names
                    const imageValue = imagesArray.front || imagesArray.main || imagesArray.default || imagesArray.url || Object.values(imagesArray)[0];
                    if (imageValue) {
                        mainImage = imageValue;
                        originalImagePath = mainImage; // Store original path
                        console.log(`Using image from images object property: ${mainImage}`);
                    }
                }
            }
            
            // Fallback to the legacy image field if images array didn't work
            if (mainImage === '/admin/assets/placeholder.png' && product.image) {
                mainImage = product.image;
                originalImagePath = mainImage; // Store original path
                console.log(`Using legacy image field: ${mainImage}`);
            }
            
            // ⚠️ CRITICAL: Process the image URL correctly
            if (mainImage && typeof mainImage === 'string') {
                console.log(`Processing image URL for product ${product.id}. Original:`, mainImage);
                
                // Handle different image URL formats
                if (mainImage.includes('cloudinary.com') || mainImage.includes('res.cloudinary.com')) {
                    // Already a full Cloudinary URL, ensure it uses HTTPS
                    if (mainImage.startsWith('http://')) {
                        mainImage = mainImage.replace('http://', 'https://');
                    }
                    console.log(`✅ Using Cloudinary URL: ${mainImage}`);
                }
                else if (mainImage.startsWith('http') || mainImage.startsWith('https')) {
                    // Already a full URL, no change needed
                    console.log(`✅ Using absolute URL: ${mainImage}`);
                } 
                else if (mainImage.startsWith('data:image')) {
                    // Data URL, no change needed
                    console.log(`✅ Using data URL (truncated): ${mainImage.substring(0, 30)}...`);
                } 
                // Check for Cloudinary ID patterns - crucial for persistence
                else if (mainImage.includes('/product-') || mainImage.includes('/v1/') || 
                         mainImage.includes('/upload/') || mainImage.includes('images-')) {
                    // This is likely a Cloudinary image with a partial path
                    // Extract the ID/filename part
                    let cloudinaryId = mainImage;
                    
                    // If it's a path with slashes, extract the last part as the filename
                    if (mainImage.includes('/')) {
                        const pathParts = mainImage.split('/');
                        cloudinaryId = pathParts[pathParts.length - 1];
                    }
                    
                    const cloudName = window.CLOUDINARY_CLOUD_NAME || 'dopvs93sl';
                    mainImage = `https://res.cloudinary.com/${cloudName}/image/upload/v1/${cloudinaryId}`;
                    console.log(`🔄 Constructed Cloudinary URL: ${mainImage}`);
                }
                else {
                    // Not a Cloudinary URL or absolute URL, handle as local path
                    // Ensure the image URL starts with a slash if it's a relative path
                    if (!mainImage.startsWith('/')) {
                        mainImage = '/' + mainImage;
                    }
                    console.log(`Using relative URL: ${mainImage}`);
                    
                    // If this URL starts with /uploads, it might be a backend URL
                    if (mainImage.startsWith('/uploads') && window.API_URL && window.API_URL.includes('://')) {
                        // Extract the base URL from the API URL
                        const baseUrlMatch = window.API_URL.match(/^(https?:\/\/[^\/]+)/);
                        if (baseUrlMatch && baseUrlMatch[1]) {
                            const fullUrl = `${baseUrlMatch[1]}${mainImage}`;
                            console.log(`Converted to full backend URL: ${fullUrl}`);
                            mainImage = fullUrl;
                        }
                    }
                }
            } else if (mainImage && typeof mainImage === 'object') {
                // If the image is an object (like a Cloudinary response), extract the URL
                if (mainImage.secure_url) {
                    mainImage = mainImage.secure_url;
                    console.log(`Extracted secure_url from image object: ${mainImage}`);
                } else if (mainImage.url) {
                    mainImage = mainImage.url;
                    console.log(`Extracted url from image object: ${mainImage}`);
                } else {
                    console.warn('Image is an object but has no URL property:', mainImage);
                    mainImage = '/admin/assets/placeholder.png';
                }
            }
        } catch (e) {
            console.error(`Error processing image for product ${product.id}:`, e);
            mainImage = '/admin/assets/placeholder.png';
        }
        
        // Log the final image URL for debugging
        console.log(`Final image URL for product ${product.id}: ${mainImage}`);
        if (originalImagePath && originalImagePath !== mainImage) {
            console.log(`Transformed from original: ${originalImagePath}`);
        }

        // Validate Cloudinary URL
        if (mainImage.includes('cloudinary.com')) {
            console.log(`✅ Valid Cloudinary URL detected for product ${product.id}`);
            try {
                // Try to fetch the image to verify it exists (via HEAD request only)
                fetch(mainImage, { method: 'HEAD' })
                    .then(response => {
                        if (response.ok) {
                            console.log(`✅ Cloudinary image verified accessible for product ${product.id}`);
                        } else {
                            console.warn(`⚠️ Cloudinary image might not be accessible for product ${product.id} - Status: ${response.status}`);
                        }
                    })
                    .catch(err => console.warn(`⚠️ Could not verify Cloudinary image for product ${product.id}:`, err));
            } catch (e) {
                console.warn('Failed to verify image URL:', e);
            }
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>
                <img src="${mainImage}" 
                     alt="${product.name}" 
                     class="product-thumbnail"
                     data-original-src="${originalImagePath || ''}"
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

// Add a diagnostic test function that can be called from the console
window.testImageUpload = async function(useConsoleLog = true) {
    try {
        // Create a small test image (1x1 pixel transparent GIF)
        const base64Image = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        const blob = await (await fetch(`data:image/gif;base64,${base64Image}`)).blob();
        const testFile = new File([blob], 'test-upload.gif', { type: 'image/gif' });
        
        const formData = new FormData();
        formData.append('testImage', testFile);
        
        const token = localStorage.getItem('token');
        if (!token) {
            const message = 'Authentication required for test';
            useConsoleLog ? console.error(message) : alert(message);
            return { success: false, error: message };
        }
        
        // Log what we're about to do
        useConsoleLog ? console.log('Testing image upload with diagnostic endpoint...') : null;
        useConsoleLog ? console.log('API URL:', window.API_URL) : null;
        
        // Make the request
        const startTime = Date.now();
        const response = await fetch(`${window.API_URL}/products/diagnostic-upload`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const endTime = Date.now();
        
        // Get the response content type
        const contentType = response.headers.get('content-type');
        
        // Check if response is OK and is JSON
        if (!response.ok) {
            let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
            
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
                useConsoleLog ? console.error('Server error:', errorData) : null;
            } else {
                const errorText = await response.text();
                useConsoleLog ? console.error('Server response:', errorText) : null;
            }
            
            const message = `Test failed: ${errorMessage}`;
            useConsoleLog ? console.error(message) : alert(message);
            
            return { 
                success: false, 
                error: errorMessage,
                status: response.status,
                responseTime: endTime - startTime,
                responseHeaders: Object.fromEntries(response.headers.entries())
            };
        }
        
        // Parse the response
        let responseData = {};
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
            useConsoleLog ? console.log('Test successful:', responseData) : alert('Test successful! Check console for details.');
        } else {
            const textResponse = await response.text();
            useConsoleLog ? console.log('Unexpected response format:', textResponse) : alert('Unexpected response format. Check console.');
            responseData = { rawText: textResponse };
        }
        
        return {
            success: true,
            data: responseData,
            status: response.status,
            responseTime: endTime - startTime,
            responseHeaders: Object.fromEntries(response.headers.entries())
        };
        
    } catch (error) {
        const message = `Network error during test: ${error.message}`;
        useConsoleLog ? console.error(message, error) : alert(message);
        return { success: false, error: error.message };
    }
};

// Also add a function to check CORS setup
window.testCORS = function() {
    const origins = [
        window.location.origin,
        window.API_URL,
        'https://t-shirt-customizer-backend.onrender.com',
        'https://res.cloudinary.com'
    ];
    
    console.log('Testing CORS from current origin:', window.location.origin);
    console.log('API URL configured as:', window.API_URL);
    
    // Test each origin with a simple OPTIONS request
    origins.forEach(async (origin) => {
        try {
            console.log(`Testing CORS with origin: ${origin}`);
            
            // Use fetch with no-cors mode first to see if the server is reachable
            const noCorsResponse = await fetch(`${window.API_URL}/health`, { 
                method: 'GET',
                mode: 'no-cors'
            });
            console.log(`No-CORS mode request to ${window.API_URL}/health:`, noCorsResponse.type);
            
            // Then try with normal CORS mode
            const response = await fetch(`${window.API_URL}/health`, {
                method: 'GET',
                headers: {
                    'Origin': origin
                }
            });
            
            console.log(`CORS test for ${origin}: ${response.ok ? '✅ Success' : '❌ Failed'}`);
            console.log('Status:', response.status);
            console.log('CORS headers:', {
                'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
                'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
                'access-control-allow-headers': response.headers.get('access-control-allow-headers')
            });
            
            // Try to get the response data
            const data = await response.text();
            console.log('Response data:', data.substring(0, 100) + (data.length > 100 ? '...' : ''));
            
        } catch (error) {
            console.error(`❌ CORS test failed for ${origin}:`, error.message);
        }
    });
    
    return 'CORS tests initiated. Check console for results.';
};

// Additional diagnostic function to show configuration
window.showConfig = function() {
    console.log('Current configuration:');
    console.log('API URL:', window.API_URL);
    console.log('Current origin:', window.location.origin);
    console.log('Is authenticated:', !!localStorage.getItem('token'));
    
    // Check if a token exists and show its expiration
    const token = localStorage.getItem('token');
    if (token) {
        try {
            // Split the JWT and decode the payload
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Token payload:', payload);
            
            // Show token expiration
            if (payload.exp) {
                const expDate = new Date(payload.exp * 1000);
                const now = new Date();
                console.log('Token expires:', expDate);
                console.log('Token expired:', expDate < now);
                console.log('Time until expiration:', Math.floor((expDate - now) / 1000 / 60), 'minutes');
            }
        } catch (e) {
            console.error('Error parsing token:', e);
        }
    }
    
    return 'Configuration displayed in console.';
};

// Add utility function for proper Cloudinary URL formatting
window.formatCloudinaryUrl = function(url) {
    if (!url) return null;
    
    // If it's already a full Cloudinary URL, ensure it uses HTTPS
    if (url.includes('cloudinary.com')) {
        if (url.startsWith('http://')) {
            return url.replace('http://', 'https://');
        }
        return url;
    }
    
    // If it's a partial Cloudinary path, construct full URL
    if (url.includes('/image/upload/') || url.includes('/product-')) {
        // Extract filename if needed
        let filename = url;
        if (url.includes('/')) {
            const parts = url.split('/');
            filename = parts[parts.length - 1];
        }
        
        // Build proper Cloudinary URL
        const cloudName = window.CLOUDINARY_CLOUD_NAME;
        return `https://res.cloudinary.com/${cloudName}/image/upload/v1/${filename}`;
    }
    
    return url;
};