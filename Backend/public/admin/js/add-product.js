// add-product.js - Handles product creation functionality
console.log('Loading add-product.js script...');

// Use global API_URL variable from window object instead of import

// Ensure API_URL is available
if (typeof window.API_URL === 'undefined') {
    console.warn('API_URL not found on window object, using default value');
    window.API_URL = '/api'; // Fallback value
}

// Initialize everything when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded in add-product.js');
    
    try {
        // Initialize the form
        initializeForm();
        
        // Load categories for the dropdown
        loadCategories();
        
        // Set up image upload functionality
        setupImageUpload();
        
        // Note: Variant functionality is handled by variants.js
        
        // Handle form submission
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) {
            addProductForm.addEventListener('submit', handleFormSubmit);
            console.log('Form submission handler attached');
        } else {
            console.error('Product form not found!');
        }
    } catch (error) {
        console.error('Error initializing add-product.js:', error);
        alert('Error initializing product page: ' + error.message);
    }
});

/**
 * Initialize the form with default values
 */
function initializeForm() {
    console.log('Initializing form...');
    
    const stockInput = document.getElementById('productStock');
    const priceInput = document.getElementById('productPrice');
    const customizableCheckbox = document.getElementById('productCustomizable');
    
    if (stockInput) stockInput.value = '0';
    if (priceInput) priceInput.value = '0.00';
    if (customizableCheckbox) customizableCheckbox.checked = false;
    
    console.log('Form initialized with default values');
}

/**
 * Load categories for the dropdown
 */
function loadCategories() {
    console.log('Loading categories...');
    
    // First try to load from the API
    fetch(`${window.API_URL}/products/categories/all`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            return response.json();
        })
        .then(categories => {
            console.log('Categories loaded from API:', categories);
            populateCategoriesDropdown(categories);
        })
        .catch(error => {
            console.warn('Error loading categories from API:', error);
            console.log('Using fallback categories');
            
            // Fallback sample categories if API fails
            const sampleCategories = [
                { id: 1, name: 'T-Shirts' },
                { id: 2, name: 'Hoodies' },
                { id: 3, name: 'Accessories' },
                { id: 4, name: 'Caps' },
                { id: 5, name: 'Mugs' }
            ];
            
            populateCategoriesDropdown(sampleCategories);
        });
}

/**
 * Populate the categories dropdown with data
 */
function populateCategoriesDropdown(categories) {
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) {
        console.error('Category select element not found!');
        return;
    }
    
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
    
    console.log('Categories dropdown populated with', categories.length, 'items');
}

/**
 * Set up image upload functionality
 */
function setupImageUpload() {
    console.log('Setting up image upload...');
    
    const productImages = document.getElementById('productImages');
    const previewsContainer = document.getElementById('productImagePreviews');
    const dropzoneContainer = document.querySelector('.dropzone-container');
    const dropzoneMessage = document.querySelector('.dz-message');
    
    if (!productImages || !previewsContainer || !dropzoneContainer || !dropzoneMessage) {
        console.error('Image upload elements not found!');
        return;
    }
    
    // Make sure dropzone is clickable
    dropzoneContainer.onclick = function(e) {
        console.log('Dropzone clicked');
        productImages.click();
    };
    
    // Handle file selection
    productImages.onchange = function(e) {
        console.log('Files selected:', this.files?.length || 0);
        previewsContainer.innerHTML = '';
        
        if (!this.files || this.files.length === 0) {
            dropzoneMessage.style.display = 'block';
            return;
        }
        
        // Hide the dropzone message when files are selected
        dropzoneMessage.style.display = 'none';
        
        // Process each file (up to 5)
        Array.from(this.files).slice(0, 5).forEach((file, index) => {
            console.log(`Processing file ${index + 1}:`, file.name);
            
            const reader = new FileReader();
            reader.onload = function(e) {
                // Create preview card
                const previewCol = document.createElement('div');
                previewCol.className = 'col-md-4 col-6';
                
                const previewCard = document.createElement('div');
                previewCard.className = 'card h-100';
                
                const previewImg = document.createElement('img');
                previewImg.src = e.target.result;
                previewImg.className = 'card-img-top';
                previewImg.style.height = '150px';
                previewImg.style.objectFit = 'cover';
                
                const cardBody = document.createElement('div');
                cardBody.className = 'card-body p-2';
                
                const fileName = document.createElement('p');
                fileName.className = 'card-text small text-truncate mb-0';
                fileName.textContent = file.name;
                
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn btn-sm btn-danger position-absolute top-0 end-0 m-1';
                removeBtn.innerHTML = '<i class="bi bi-x"></i>';
                removeBtn.onclick = function() {
                    previewCol.remove();
                };
                
                // Assemble the preview card
                cardBody.appendChild(fileName);
                previewCard.appendChild(previewImg);
                previewCard.appendChild(cardBody);
                previewCard.appendChild(removeBtn);
                previewCol.appendChild(previewCard);
                previewsContainer.appendChild(previewCol);
            };
            
            reader.readAsDataURL(file);
        });
    };
    
    console.log('Image upload setup complete');
}

/**
 * Get tags from input for product submission
 * Simple utility to extract tags from a comma-separated string
 */
function getTagsFromInput() {
    const tagsInput = document.getElementById('productTags');
    if (!tagsInput || !tagsInput.value) return [];
    
    // Split tags by comma and trim whitespace
    return tagsInput.value.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
}

/**
 * Show loading indicator during form submission
 */
function showLoading() {
    // Add a simple loading overlay if it doesn't exist
    let loadingOverlay = document.getElementById('loadingOverlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.innerHTML = `
            <div class="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75" style="z-index: 1060;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    }
    loadingOverlay.style.display = 'block';
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading();
        
        const formData = new FormData(e.target);
        
        // Add status as boolean
        formData.set('status', document.getElementById('productStatus').checked ? 'active' : 'inactive');
        
        // Add featured as boolean
        formData.set('featured', document.getElementById('productFeatured').checked ? 'true' : 'false');
        
        // Add customization options if any are present
        const customizationOptions = [];
        document.querySelectorAll('.customization-option:checked').forEach(option => {
            customizationOptions.push(option.value);
        });
        formData.append('customizationOptions', JSON.stringify(customizationOptions));
        
        // Add variant data from the variant system
        if (window.variantSystem && typeof window.variantSystem.areVariantsEnabled === 'function') {
            const hasVariants = window.variantSystem.areVariantsEnabled();
            formData.append('hasVariants', hasVariants ? 'true' : 'false');
            
            if (hasVariants) {
                // Get color variants
                const colorVariants = window.variantSystem.getColorVariants();
                formData.append('colorVariantsData', JSON.stringify(colorVariants));
                
                // Get size variants
                const sizeVariants = window.variantSystem.getSizeVariants();
                formData.append('sizeVariantsData', JSON.stringify(sizeVariants));
                
                console.log('Added variant data:', { colorVariants, sizeVariants });
            }
        } else {
            formData.append('hasVariants', 'false');
            console.warn('Variant system not available');
        }
        
        // Add tags if the tag input exists
        const tags = getTagsFromInput();
        if (tags.length > 0) {
            formData.append('tags', JSON.stringify(tags));
        }
        
        // Make the API request to create the product
        const response = await fetch(`${window.API_URL}/products`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to add product');
        }
        
        showToast('success', 'Product added successfully!');
        
        // Reset form and redirect after a short delay
        setTimeout(() => {
            window.location.href = 'products.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error adding product:', error);
        showToast('error', error.message || 'Failed to add product');
    } finally {
        hideLoading();
    }
}

/**
 * Show a toast notification
 */
function showToast(type, message) {
    console.log(`${type} toast:`, message);
    
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastTitle || !toastMessage) {
        alert(message);
        return;
    }
    
    // Set toast title based on type
    let title = 'Notification';
    
    switch (type) {
        case 'success': title = 'Success'; break;
        case 'error': title = 'Error'; break;
        case 'warning': title = 'Warning'; break;
        case 'info': title = 'Information'; break;
    }
    
    // Set toast content
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // Show the toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

console.log('add-product.js loaded successfully!'); 