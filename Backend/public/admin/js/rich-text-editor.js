/**
 * Custom Rich Text Editor
 * A lightweight rich text editor implementation without any external dependencies
 */

// Wait for document to fully load before initializing
document.addEventListener('DOMContentLoaded', function() {
    console.log('Rich Text Editor: Document ready, initializing custom editor...');
    
    // Main product description in add-product.html
    const productDescription = document.getElementById('productDescription');
    if (productDescription) {
        console.log('Rich Text Editor: Found productDescription element, initializing editor');
        createCustomRichEditor(productDescription);
    } else {
        console.warn('Rich Text Editor: #productDescription element not found');
    }
    
    // Handle modal editors
    setupModalEditors();
});

/**
 * Create a custom rich text editor
 * @param {HTMLTextAreaElement} textarea - The textarea to replace with rich editor
 */
function createCustomRichEditor(textarea) {
    // Create a container for our editor
    const container = document.createElement('div');
    container.id = 'custom-editor-container-' + textarea.id;
    container.className = 'custom-rich-editor';
    container.style.border = '1px solid #ced4da';
    container.style.borderRadius = '0.25rem';
    container.style.marginBottom = '1rem';
    
    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.style.display = 'flex';
    toolbar.style.flexWrap = 'wrap';
    toolbar.style.padding = '8px';
    toolbar.style.backgroundColor = '#f8f9fa';
    toolbar.style.borderBottom = '1px solid #dee2e6';
    
    // Add basic formatting buttons
    const buttonStyles = 'display:inline-block; margin-right:5px; margin-bottom:5px; padding:6px 12px; background:#fff; border:1px solid #dee2e6; border-radius:3px; cursor:pointer; font-size: 14px;';
    
    // Button configurations
    const buttons = [
        { html: '<strong>B</strong>', title: 'Bold', action: () => execFormatCommand('bold') },
        { html: '<em>I</em>', title: 'Italic', action: () => execFormatCommand('italic') },
        { html: '<u>U</u>', title: 'Underline', action: () => execFormatCommand('underline') },
        { html: 'H1', title: 'Heading 1', action: () => execFormatCommand('formatBlock', '<h1>') },
        { html: 'H2', title: 'Heading 2', action: () => execFormatCommand('formatBlock', '<h2>') },
        { html: 'P', title: 'Paragraph', action: () => execFormatCommand('formatBlock', '<p>') },
        { html: '&#x1F5CE;', title: 'Ordered List', action: () => execFormatCommand('insertOrderedList') },
        { html: '&#x1F5CB;', title: 'Unordered List', action: () => execFormatCommand('insertUnorderedList') },
        { html: '&#x1F517;', title: 'Insert Link', action: () => insertLink() },
        { html: '&#x21E4;', title: 'Undo', action: () => execFormatCommand('undo') },
        { html: '&#x21E5;', title: 'Redo', action: () => execFormatCommand('redo') }
    ];
    
    // Create and add all buttons to the toolbar
    buttons.forEach(button => {
        const btnElement = document.createElement('button');
        btnElement.type = 'button';
        btnElement.innerHTML = button.html;
        btnElement.style.cssText = buttonStyles;
        btnElement.title = button.title;
        btnElement.onclick = button.action;
        toolbar.appendChild(btnElement);
    });
    
    // Add content editable div
    const editableDiv = document.createElement('div');
    editableDiv.id = 'editor-content-' + textarea.id;
    editableDiv.className = 'editor-content';
    editableDiv.contentEditable = true;
    editableDiv.style.minHeight = '300px';
    editableDiv.style.padding = '15px';
    editableDiv.style.backgroundColor = '#fff';
    editableDiv.style.overflowY = 'auto';
    editableDiv.style.lineHeight = '1.5';
    editableDiv.style.outline = 'none';
    
    // Set initial content from textarea
    editableDiv.innerHTML = textarea.value || '';
    
    // Sync content back to textarea on edit
    editableDiv.addEventListener('input', function() {
        textarea.value = this.innerHTML;
        // Trigger change event on the textarea for form validations
        const event = new Event('change', { bubbles: true });
        textarea.dispatchEvent(event);
    });
    
    // Build editor
    container.appendChild(toolbar);
    container.appendChild(editableDiv);
    
    // Replace textarea with custom editor
    textarea.style.display = 'none';
    textarea.parentNode.insertBefore(container, textarea);
    
    // Initialize focus events
    editableDiv.addEventListener('focus', function() {
        container.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
    });
    
    editableDiv.addEventListener('blur', function() {
        container.style.boxShadow = 'none';
    });
    
    // Ensure we can tab out of the editor
    editableDiv.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            // Allow default behavior (tab out of editor)
            container.style.boxShadow = 'none';
        }
    });
    
    // Return the editor instance
    return {
        container,
        toolbar,
        editor: editableDiv,
        textarea: textarea,
        getContent: function() {
            return editableDiv.innerHTML;
        },
        setContent: function(content) {
            editableDiv.innerHTML = content;
            textarea.value = content;
        }
    };
}

/**
 * Execute a formatting command on the current editor
 * @param {string} command - The document.execCommand command to execute
 * @param {string} [value] - Optional value for the command
 */
function execFormatCommand(command, value = null) {
    // Save current selection
    saveSelection();
    
    // Focus back to the editor before executing command
    restoreSelection();
    
    // Execute the command
    document.execCommand(command, false, value);
    
    // Update the original textarea with new content
    const activeEditor = document.activeElement;
    if (activeEditor && activeEditor.classList.contains('editor-content')) {
        const textareaId = activeEditor.id.replace('editor-content-', '');
        const textarea = document.getElementById(textareaId);
        if (textarea) {
            textarea.value = activeEditor.innerHTML;
            
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            textarea.dispatchEvent(event);
        }
    }
}

// Store the current selection range
let savedSelection = null;

/**
 * Save the current selection (for restoring after dialogs)
 */
function saveSelection() {
    if (window.getSelection) {
        const sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            savedSelection = sel.getRangeAt(0);
        }
    }
}

/**
 * Restore the previously saved selection
 */
function restoreSelection() {
    const activeEditor = document.querySelector('.editor-content:focus') || 
                          document.querySelector('.editor-content');
    
    if (activeEditor && savedSelection) {
        activeEditor.focus();
        
        if (window.getSelection) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedSelection);
        }
    }
}

/**
 * Insert a link at the current cursor position
 */
function insertLink() {
    // Save current selection
    saveSelection();
    
    // Get selected text
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    // Prompt for URL
    const url = prompt('Enter the URL:', 'https://');
    if (url && url !== 'https://') {
        // Restore selection
        restoreSelection();
        
        // If text was selected, create link with that text
        if (selectedText) {
            document.execCommand('createLink', false, url);
        } else {
            // If no text selected, create link with URL as text
            const linkText = prompt('Enter link text:', url);
            const link = `<a href="${url}">${linkText || url}</a>`;
            document.execCommand('insertHTML', false, link);
        }
    }
}

/**
 * Set up rich text editors in modal dialogs
 */
function setupModalEditors() {
    // Look for product modals that might contain editors
    const productModal = document.getElementById('productModal');
    if (productModal) {
        console.log('Rich Text Editor: Found product modal, setting up editor');
        
        // Find the description field in the modal
        const modalDescription = productModal.querySelector('#modalProductDescription');
        if (modalDescription) {
            // Create editor when modal is shown
            productModal.addEventListener('shown.bs.modal', function() {
                console.log('Rich Text Editor: Modal shown, initializing editor');
                
                // Check if editor already exists
                const existingEditor = productModal.querySelector('.custom-rich-editor');
                if (!existingEditor) {
                    createCustomRichEditor(modalDescription);
                }
            });
        }
    } else {
        console.log('Rich Text Editor: Product modal element not found');
    }
}

/**
 * Patch global functions to make sure they get content from the editor
 */
window.addEventListener('load', function() {
    console.log('Rich Text Editor: Window loaded, patching save functions');
    
    // Patch saveProduct function if it exists
    if (typeof window.saveProduct === 'function') {
        const originalSaveProduct = window.saveProduct;
        window.saveProduct = function() {
            console.log('Rich Text Editor: Patched saveProduct function called');
            
            // Get content from editor before saving
            const editor = document.querySelector('.editor-content');
            if (editor) {
                console.log('Rich Text Editor: Getting content from editor for saveProduct');
                const textarea = document.getElementById('productDescription');
                if (textarea) {
                    textarea.value = editor.innerHTML;
                }
            } else {
                console.warn('Rich Text Editor: Editor not found when saving, using fallback');
            }
            
            // Call original function
            return originalSaveProduct.apply(this, arguments);
        };
        console.log('Rich Text Editor: Patched window.saveProduct function');
    }
    
    // Patch form submission
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        console.log('Rich Text Editor: Found addProductForm, patching submission');
        
        addProductForm.addEventListener('submit', function(e) {
            console.log('Rich Text Editor: Form submission intercepted');
            
            // Get content from editor before submitting
            const editor = document.querySelector('.editor-content');
            if (editor) {
                console.log('Rich Text Editor: Getting content from editor for form submission');
                const textarea = document.getElementById('productDescription');
                if (textarea) {
                    textarea.value = editor.innerHTML;
                }
            } else {
                console.warn('Rich Text Editor: Editor not found during form submission, using fallback');
            }
        });
        console.log('Rich Text Editor: Added submit event listener to addProductForm');
    } else {
        console.log('Rich Text Editor: addProductForm not found');
    }
}); 