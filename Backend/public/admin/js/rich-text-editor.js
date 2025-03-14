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
        
        // Simplify TinyMCE configuration for maximum compatibility
        tinymce.init({
            selector: '#productDescription',
            base_url: 'https://cdn.tiny.cloud/1/no-api-key/tinymce/6',
            plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
            toolbar: 'undo redo | bold italic | bullist numlist | link image',
            height: 400,
            menubar: false, // Disable menu to simplify
            inline: false,
            branding: false,
            promotion: false,
            statusbar: false, // Disable status bar to simplify
            resize: false,
            content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 16px; }',
            setup: function(editor) {
                console.log('Rich Text Editor: Editor setup phase');
                
                // Log when editor is initialized
                editor.on('init', function() {
                    console.log('Rich Text Editor: TinyMCE initialized successfully');
                    
                    // Force a check for UI visibility after initialization
                    setTimeout(function() {
                        checkForToolbar();
                    }, 500);
                });
                
                // Save content back to textarea on change
                editor.on('change', function() {
                    editor.save();
                    console.log('Rich Text Editor: Content updated');
                });
            }
        }).then(function(editors) {
            console.log('Rich Text Editor: Editor initialization promise resolved', editors);
        }).catch(function(error) {
            console.error('Rich Text Editor: Failed to initialize editor', error);
            createFallbackToolbar();
        });
    } else {
        console.warn('Rich Text Editor: #productDescription element not found');
    }
    
    // Set timeout to check if TinyMCE is working properly
    setTimeout(function() {
        checkForToolbar();
    }, 2000);
    
    // Handle modal editors
    setupModalEditors();
});

/**
 * Check if toolbar is visible, if not, create a fallback
 */
function checkForToolbar() {
    console.log('Rich Text Editor: Checking if toolbar is visible');
    const toolbar = document.querySelector('.tox-toolbar__primary');
    const editorArea = document.querySelector('.tox-edit-area');
    
    if (!toolbar && editorArea) {
        console.warn('Rich Text Editor: Toolbar not found but editor area exists - toolbar might be hidden');
        // Try setting style directly
        applyForcedStyles();
        
        // Show the fix button if issues persist
        const fixButton = document.getElementById('fixRichEditorBtn');
        if (fixButton) {
            fixButton.style.display = 'inline-block';
        }
    } else if (!toolbar && !editorArea) {
        console.error('Rich Text Editor: No TinyMCE UI elements found at all - initialization might have failed');
        createFallbackToolbar();
    } else {
        console.log('Rich Text Editor: Toolbar found and appears to be working');
    }
}

/**
 * Apply forced styles directly to TinyMCE elements
 */
function applyForcedStyles() {
    console.log('Rich Text Editor: Applying forced styles');
    
    // Get header element
    const header = document.querySelector('.tox-editor-header');
    if (header) {
        header.style.display = 'block';
        header.style.visibility = 'visible';
        header.style.opacity = '1';
    }
    
    // Get toolbar element
    const toolbar = document.querySelector('.tox-toolbar__primary');
    if (toolbar) {
        toolbar.style.display = 'flex';
        toolbar.style.visibility = 'visible';
        toolbar.style.opacity = '1';
        toolbar.style.position = 'relative';
        toolbar.style.zIndex = '100';
    }
    
    // Toolbar overflow
    const toolbarOverlord = document.querySelector('.tox-toolbar-overlord');
    if (toolbarOverlord) {
        toolbarOverlord.style.visibility = 'visible';
        toolbarOverlord.style.display = 'block';
    }
    
    // Find all button groups
    const buttonGroups = document.querySelectorAll('.tox-toolbar__group');
    buttonGroups.forEach(group => {
        group.style.visibility = 'visible';
        group.style.display = 'flex';
        group.style.opacity = '1';
    });
    
    // Find all buttons
    const buttons = document.querySelectorAll('.tox-tbtn');
    buttons.forEach(button => {
        button.style.visibility = 'visible';
        button.style.display = 'block';
        button.style.opacity = '1';
    });
}

/**
 * Create a simple fallback toolbar when TinyMCE fails
 */
function createFallbackToolbar() {
    console.log('Rich Text Editor: Creating fallback toolbar');
    
    // Find the textarea
    const textarea = document.getElementById('productDescription');
    if (!textarea) return;
    
    // Create a container for our fallback editor
    const container = document.createElement('div');
    container.id = 'fallback-editor-container';
    container.style.border = '1px solid #ced4da';
    container.style.borderRadius = '0.25rem';
    container.style.marginBottom = '1rem';
    
    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'fallback-toolbar';
    toolbar.style.display = 'flex';
    toolbar.style.padding = '8px';
    toolbar.style.backgroundColor = '#f8f9fa';
    toolbar.style.borderBottom = '1px solid #dee2e6';
    
    // Add some basic formatting buttons
    const buttonStyles = 'display:inline-block; margin-right:5px; padding:5px 10px; background:#fff; border:1px solid #dee2e6; border-radius:3px; cursor:pointer;';
    
    const boldBtn = document.createElement('button');
    boldBtn.type = 'button';
    boldBtn.innerHTML = '<strong>B</strong>';
    boldBtn.style.cssText = buttonStyles;
    boldBtn.title = 'Bold';
    boldBtn.onclick = function() { insertFormatting('<strong>', '</strong>'); };
    
    const italicBtn = document.createElement('button');
    italicBtn.type = 'button';
    italicBtn.innerHTML = '<em>I</em>';
    italicBtn.style.cssText = buttonStyles;
    italicBtn.title = 'Italic';
    italicBtn.onclick = function() { insertFormatting('<em>', '</em>'); };
    
    const linkBtn = document.createElement('button');
    linkBtn.type = 'button';
    linkBtn.innerHTML = 'Link';
    linkBtn.style.cssText = buttonStyles;
    linkBtn.title = 'Insert Link';
    linkBtn.onclick = function() { 
        const url = prompt('Enter URL:');
        if (url) insertFormatting(`<a href="${url}">`, '</a>'); 
    };
    
    const ulBtn = document.createElement('button');
    ulBtn.type = 'button';
    ulBtn.innerHTML = 'List';
    ulBtn.style.cssText = buttonStyles;
    ulBtn.title = 'Insert List';
    ulBtn.onclick = function() { insertFormatting('<ul><li>', '</li></ul>'); };
    
    // Add all buttons to the toolbar
    toolbar.appendChild(boldBtn);
    toolbar.appendChild(italicBtn);
    toolbar.appendChild(linkBtn);
    toolbar.appendChild(ulBtn);
    
    // Create a message for the user
    const message = document.createElement('div');
    message.style.padding = '5px 10px';
    message.style.backgroundColor = '#fff3cd';
    message.style.color = '#856404';
    message.style.fontSize = '0.9rem';
    message.innerHTML = 'Basic editor mode: Rich text editor failed to load properly. <button type="button" onclick="window.location.reload()">Try Again</button>';
    
    // Add elements to the container
    container.appendChild(toolbar);
    container.appendChild(message);
    
    // Add a content editable div
    const editableDiv = document.createElement('div');
    editableDiv.id = 'fallback-editor-content';
    editableDiv.contentEditable = true;
    editableDiv.style.minHeight = '250px';
    editableDiv.style.padding = '10px';
    editableDiv.style.backgroundColor = '#fff';
    editableDiv.style.overflowY = 'auto';
    editableDiv.innerHTML = textarea.value || '';
    
    // Sync editable div with textarea
    editableDiv.addEventListener('input', function() {
        textarea.value = this.innerHTML;
    });
    
    container.appendChild(editableDiv);
    
    // Insert the fallback editor before the textarea
    textarea.style.display = 'none';
    textarea.parentNode.insertBefore(container, textarea);
    
    // Helper function to insert formatting
    function insertFormatting(openTag, closeTag) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        
        if (selectedText) {
            // Replace selected text with formatted version
            const formattedText = openTag + selectedText + closeTag;
            range.deleteContents();
            range.insertNode(document.createTextNode(formattedText));
        } else {
            // No selection, just insert tags
            range.insertNode(document.createTextNode(openTag + closeTag));
        }
        
        // Update textarea value
        textarea.value = editableDiv.innerHTML;
    }
}

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
            
            // Initialize TinyMCE on the modal's textarea with simplified configuration
            setTimeout(function() {
                tinymce.init({
                    selector: '#productDescription',
                    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                    toolbar: 'undo redo | bold italic | bullist numlist | link image',
                    height: 300,
                    menubar: false,
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
        createFallbackToolbar();
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
                // Check for fallback editor
                const fallbackEditor = document.getElementById('fallback-editor-content');
                if (fallbackEditor) {
                    document.getElementById('productDescription').value = fallbackEditor.innerHTML;
                }
                console.warn('Rich Text Editor: TinyMCE not found when saving, using fallback or default');
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
                // Check for fallback editor
                const fallbackEditor = document.getElementById('fallback-editor-content');
                if (fallbackEditor) {
                    document.getElementById('productDescription').value = fallbackEditor.innerHTML;
                }
                console.warn('Rich Text Editor: TinyMCE not found during form submission, using fallback or default');
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