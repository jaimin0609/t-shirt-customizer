/**
 * Rich Text Editor Configuration
 * Implements TinyMCE for product descriptions in the admin panel
 */

// Initialize TinyMCE on specific textareas
document.addEventListener('DOMContentLoaded', function() {
    // Initialize TinyMCE on product description fields
    initProductDescriptionEditors();
    
    // Handle modal events for inline editors
    setupModalEditors();
});

/**
 * Initialize TinyMCE on the main product description textarea
 */
function initProductDescriptionEditors() {
    // Main product description in add-product.html
    const productDescription = document.getElementById('productDescription');
    if (productDescription) {
        console.log('Initializing TinyMCE on product description');
        
        tinymce.init({
            selector: '#productDescription',
            plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
            toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
            height: 300,
            menubar: false,
            branding: false,
            promotion: false,
            setup: function(editor) {
                // Handle form submission to ensure content is saved
                editor.on('change', function() {
                    editor.save();
                });
            }
        });
    }
}

/**
 * Setup TinyMCE for modal editors (for product edit popups)
 */
function setupModalEditors() {
    // Handle product modal initialization for editing products
    const productModal = document.getElementById('productModal');
    if (productModal) {
        productModal.addEventListener('shown.bs.modal', function() {
            // Remove existing instances to prevent duplication
            if (tinymce.get('productDescription')) {
                tinymce.remove('#productDescription');
            }
            
            // Initialize TinyMCE on the modal's textarea
            tinymce.init({
                selector: '#productDescription',
                plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                height: 200,
                menubar: false,
                branding: false,
                promotion: false,
                setup: function(editor) {
                    editor.on('change', function() {
                        editor.save();
                    });
                }
            });
        });
    }
}

/**
 * Patch the product save functions to handle rich text content
 */
window.addEventListener('load', function() {
    // Patch the saveProduct function in products.js if it exists
    if (typeof window.saveProduct === 'function') {
        const originalSaveProduct = window.saveProduct;
        window.saveProduct = function() {
            // Get content from TinyMCE if it exists
            if (tinymce.get('productDescription')) {
                const content = tinymce.get('productDescription').getContent();
                document.getElementById('productDescription').value = content;
            }
            
            // Call the original function
            return originalSaveProduct.apply(this, arguments);
        };
    }
    
    // Patch the handleFormSubmit function in add-product.js
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        const originalSubmit = addProductForm.onsubmit;
        addProductForm.onsubmit = function(e) {
            // Get content from TinyMCE if it exists
            if (tinymce.get('productDescription')) {
                const content = tinymce.get('productDescription').getContent();
                document.getElementById('productDescription').value = content;
            }
            
            // Call the original submit handler if it exists
            if (typeof originalSubmit === 'function') {
                return originalSubmit.call(this, e);
            }
        };
    }
}); 