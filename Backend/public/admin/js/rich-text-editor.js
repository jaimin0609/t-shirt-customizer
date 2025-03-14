/**
 * Rich Text Editor Configuration
 * Implements TinyMCE for product descriptions in the admin panel
 */

// Wait for document to fully load before initializing TinyMCE
document.addEventListener('DOMContentLoaded', function() {
    console.log('Rich Text Editor: Document ready, initializing TinyMCE...');
    
    // Force remove any existing TinyMCE instances to prevent conflicts
    if (typeof tinymce !== 'undefined') {
        tinymce.remove('#productDescription');
        console.log('Rich Text Editor: Removed any existing TinyMCE instances');
    }
    
    // Main product description in add-product.html
    const productDescription = document.getElementById('productDescription');
    if (productDescription) {
        console.log('Rich Text Editor: Found productDescription element, initializing editor');
        
        // Ensure TinyMCE is available
        if (typeof tinymce === 'undefined') {
            console.error('Rich Text Editor: TinyMCE not loaded! Adding script dynamically');
            loadTinyMCEScript();
            return;
        }
        
        // Initialize TinyMCE with robust configuration
        tinymce.init({
            selector: '#productDescription',
            plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
            toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
            height: 400, // Increased height for better visibility
            menubar: true, // Enable menubar for more options
            branding: false,
            promotion: false,
            statusbar: true,
            resize: true,
            elementpath: true,
            setup: function(editor) {
                console.log('Rich Text Editor: Editor setup phase');
                
                // Log when editor is initialized
                editor.on('init', function() {
                    console.log('Rich Text Editor: TinyMCE initialized successfully');
                    
                    // Force a check for UI visibility after initialization
                    setTimeout(function() {
                        if (document.querySelector('.tox-toolbar__primary')) {
                            console.log('Rich Text Editor: Toolbar is visible');
                        } else {
                            console.error('Rich Text Editor: Toolbar not visible, applying fix...');
                            
                            // Try to fix toolbar visibility issues
                            const editorContainer = document.querySelector('.tox-tinymce');
                            if (editorContainer) {
                                editorContainer.style.visibility = 'visible';
                                editorContainer.style.display = 'block';
                                editorContainer.style.opacity = '1';
                                editorContainer.style.height = '400px';
                                console.log('Rich Text Editor: Applied CSS fixes to editor container');
                            }
                        }
                    }, 500);
                });
                
                // Save content back to textarea on change
                editor.on('change', function() {
                    editor.save();
                    console.log('Rich Text Editor: Content updated');
                });
            },
            content_style: `
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; }
                .mce-content-body { font-size: 16px; color: #333; }
                .mce-content-body p { line-height: 1.6; margin-top: 0.5em; margin-bottom: 0.5em; }
                .mce-content-body h1 { font-size: 2em; }
                .mce-content-body h2 { font-size: 1.5em; }
                .mce-content-body h3 { font-size: 1.17em; }
            `
        }).then(function(editors) {
            console.log('Rich Text Editor: Editor initialization promise resolved', editors);
        }).catch(function(error) {
            console.error('Rich Text Editor: Failed to initialize editor', error);
        });
    } else {
        console.warn('Rich Text Editor: #productDescription element not found');
    }
    
    // Handle modal editors
    setupModalEditors();
});

/**
 * Setup TinyMCE for modal editors (for product edit popups)
 */
function setupModalEditors() {
    console.log('Rich Text Editor: Setting up modal editors');
    
    // Handle product modal initialization for editing products
    const productModal = document.getElementById('productModal');
    if (productModal) {
        productModal.addEventListener('shown.bs.modal', function() {
            console.log('Rich Text Editor: Product modal shown, initializing editor');
            
            // Remove existing instances to prevent duplication
            if (typeof tinymce !== 'undefined' && tinymce.get('productDescription')) {
                tinymce.remove('#productDescription');
                console.log('Rich Text Editor: Removed existing editor in modal');
            }
            
            // Ensure TinyMCE is available
            if (typeof tinymce === 'undefined') {
                console.error('Rich Text Editor: TinyMCE not loaded for modal!');
                return;
            }
            
            // Initialize TinyMCE on the modal's textarea
            setTimeout(function() {
                tinymce.init({
                    selector: '#productDescription',
                    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                    height: 300,
                    menubar: true,
                    branding: false,
                    promotion: false,
                    setup: function(editor) {
                        editor.on('init', function() {
                            console.log('Rich Text Editor: Modal editor initialized');
                        });
                        
                        editor.on('change', function() {
                            editor.save();
                        });
                    }
                });
            }, 100); // Short delay to ensure modal is fully rendered
        });
    } else {
        console.log('Rich Text Editor: Product modal element not found');
    }
}

/**
 * Dynamically load TinyMCE script if not available
 */
function loadTinyMCEScript() {
    console.log('Rich Text Editor: Attempting to load TinyMCE script dynamically');
    
    const script = document.createElement('script');
    script.src = 'https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js';
    script.referrerPolicy = 'origin';
    script.onload = function() {
        console.log('Rich Text Editor: TinyMCE script loaded dynamically');
        // Re-initialize once loaded
        setTimeout(function() {
            if (typeof tinymce !== 'undefined') {
                document.dispatchEvent(new Event('DOMContentLoaded'));
            }
        }, 500);
    };
    script.onerror = function() {
        console.error('Rich Text Editor: Failed to load TinyMCE script dynamically');
    };
    
    document.head.appendChild(script);
}

/**
 * Patch the product save functions to handle rich text content
 */
window.addEventListener('load', function() {
    console.log('Rich Text Editor: Window loaded, patching save functions');
    
    // Patch the saveProduct function in products.js if it exists
    if (typeof window.saveProduct === 'function') {
        const originalSaveProduct = window.saveProduct;
        window.saveProduct = function() {
            console.log('Rich Text Editor: Patched saveProduct function called');
            
            // Get content from TinyMCE if it exists
            if (typeof tinymce !== 'undefined' && tinymce.get('productDescription')) {
                const content = tinymce.get('productDescription').getContent();
                console.log('Rich Text Editor: Getting content from TinyMCE for saveProduct');
                document.getElementById('productDescription').value = content;
            } else {
                console.warn('Rich Text Editor: TinyMCE not found when saving');
            }
            
            // Call the original function
            return originalSaveProduct.apply(this, arguments);
        };
        console.log('Rich Text Editor: Patched window.saveProduct function');
    }
    
    // Patch the form submission in add-product.html
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        console.log('Rich Text Editor: Found addProductForm, patching submission');
        
        addProductForm.addEventListener('submit', function(e) {
            console.log('Rich Text Editor: Form submission intercepted');
            
            // Get content from TinyMCE if it exists
            if (typeof tinymce !== 'undefined' && tinymce.get('productDescription')) {
                const content = tinymce.get('productDescription').getContent();
                console.log('Rich Text Editor: Getting content from TinyMCE for form submission');
                document.getElementById('productDescription').value = content;
            } else {
                console.warn('Rich Text Editor: TinyMCE not found during form submission');
            }
        }, true); // Use capturing to ensure this runs before other handlers
        
        console.log('Rich Text Editor: Added submit event listener to addProductForm');
    } else {
        console.log('Rich Text Editor: addProductForm not found');
    }
});

// Debug function - can be called from console to check the status
window.checkTinyMCEStatus = function() {
    console.log('Rich Text Editor Status Check:');
    console.log('- TinyMCE loaded:', typeof tinymce !== 'undefined');
    
    if (typeof tinymce !== 'undefined') {
        console.log('- Active editors:', tinymce.editors);
        console.log('- productDescription editor instance:', tinymce.get('productDescription'));
        
        const editorInstance = tinymce.get('productDescription');
        if (editorInstance) {
            console.log('- Editor initialized:', editorInstance.initialized);
            console.log('- Editor content:', editorInstance.getContent());
        }
    }
    
    console.log('- productDescription element:', document.getElementById('productDescription'));
    
    // Check for visible TinyMCE elements
    const editorContainer = document.querySelector('.tox-tinymce');
    console.log('- Editor container:', editorContainer);
    
    const toolbar = document.querySelector('.tox-toolbar__primary');
    console.log('- Toolbar element:', toolbar);
    
    if (editorContainer && window.getComputedStyle) {
        const style = window.getComputedStyle(editorContainer);
        console.log('- Container visibility:', style.visibility);
        console.log('- Container display:', style.display);
        console.log('- Container opacity:', style.opacity);
        console.log('- Container z-index:', style.zIndex);
    }
    
    return 'TinyMCE status check complete - see console for details';
}; 