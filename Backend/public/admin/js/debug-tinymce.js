/**
 * TinyMCE Debug Utility
 * This script helps diagnose issues with TinyMCE initialization
 * Add to an HTML page with:
 * <script src="/admin/js/debug-tinymce.js"></script>
 */

(function() {
    console.log('TinyMCE Debug Tool loaded');
    
    // Create debug button
    function createDebugButton() {
        // Check if button already exists
        if (document.getElementById('tinymce-debug-btn')) return;
        
        const btn = document.createElement('button');
        btn.id = 'tinymce-debug-btn';
        btn.innerText = 'Debug TinyMCE';
        btn.className = 'btn btn-warning btn-sm position-fixed';
        btn.style.bottom = '50px';
        btn.style.right = '10px';
        btn.style.zIndex = '9999';
        
        btn.addEventListener('click', function() {
            debugTinyMCE();
            this.innerText = 'Debug Info in Console';
            
            // Reset button text after 2 seconds
            setTimeout(() => {
                this.innerText = 'Debug TinyMCE';
            }, 2000);
        });
        
        document.body.appendChild(btn);
    }
    
    // Debug TinyMCE
    function debugTinyMCE() {
        console.group('TinyMCE Debug Information');
        
        // Check if TinyMCE is loaded
        console.log('TinyMCE loaded:', typeof tinymce !== 'undefined');
        
        if (typeof tinymce !== 'undefined') {
            console.log('TinyMCE version:', tinymce.majorVersion + '.' + tinymce.minorVersion);
            console.log('Active editors:', tinymce.editors.length);
            
            // List all editor instances
            tinymce.editors.forEach((editor, index) => {
                console.group(`Editor #${index + 1}: ${editor.id}`);
                console.log('Initialized:', editor.initialized);
                console.log('Hidden:', editor.hidden);
                console.log('Settings:', editor.settings);
                console.log('Content:', editor.getContent().substring(0, 100) + '...');
                console.groupEnd();
            });
            
            // Check for specific issues
            if (tinymce.editors.length === 0) {
                console.warn('No active TinyMCE editors found. Initialization might have failed.');
                attemptFixInitialization();
            }
        } else {
            console.error('TinyMCE is not loaded! Check script inclusion.');
            console.log('Attempting to load TinyMCE dynamically...');
            loadTinyMCEDynamically();
        }
        
        // Check DOM for editor elements
        const editorTextareas = document.querySelectorAll('textarea[id="productDescription"]');
        console.log('Editor textareas found:', editorTextareas.length);
        editorTextareas.forEach((textarea, i) => {
            console.log(`Textarea #${i+1}:`, textarea);
            console.log('- ID:', textarea.id);
            console.log('- Visible:', isElementVisible(textarea));
            console.log('- Parent:', textarea.parentElement);
        });
        
        // Check for TinyMCE UI elements
        const editorContainers = document.querySelectorAll('.tox-tinymce');
        console.log('Editor containers found:', editorContainers.length);
        editorContainers.forEach((container, i) => {
            console.log(`Container #${i+1}:`, container);
            console.log('- Visible:', isElementVisible(container));
            console.log('- Style:', window.getComputedStyle(container));
            console.log('- Parent:', container.parentElement);
        });
        
        // Check for toolbar elements
        const toolbars = document.querySelectorAll('.tox-toolbar__primary');
        console.log('Toolbars found:', toolbars.length);
        toolbars.forEach((toolbar, i) => {
            console.log(`Toolbar #${i+1}:`, toolbar);
            console.log('- Visible:', isElementVisible(toolbar));
            console.log('- Style:', window.getComputedStyle(toolbar));
        });
        
        console.groupEnd();
        return 'TinyMCE debug information logged to console';
    }
    
    // Check if element is visible
    function isElementVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' && 
               element.offsetParent !== null;
    }
    
    // Attempt to fix initialization issues
    function attemptFixInitialization() {
        console.log('Attempting to fix TinyMCE initialization...');
        
        const textareas = document.querySelectorAll('textarea[id="productDescription"]');
        if (textareas.length > 0) {
            console.log('Found textareas to initialize:', textareas.length);
            
            // Ensure TinyMCE is available
            if (typeof tinymce !== 'undefined') {
                console.log('Reinitializing TinyMCE...');
                
                // Remove any existing instances first
                tinymce.remove('textarea[id="productDescription"]');
                
                // Initialize TinyMCE on all product description textareas
                tinymce.init({
                    selector: 'textarea[id="productDescription"]',
                    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                    height: 300,
                    menubar: true,
                    statusbar: true,
                    branding: false,
                    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif; }'
                }).then(() => {
                    console.log('TinyMCE reinitialized successfully');
                }).catch(err => {
                    console.error('Error reinitializing TinyMCE:', err);
                });
            }
        } else {
            console.warn('No textarea elements found to initialize');
        }
    }
    
    // Dynamically load TinyMCE if not available
    function loadTinyMCEDynamically() {
        const script = document.createElement('script');
        script.src = 'https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js';
        script.referrerPolicy = 'origin';
        
        script.onload = function() {
            console.log('TinyMCE loaded dynamically!');
            setTimeout(attemptFixInitialization, 500); // Wait before initializing
        };
        
        script.onerror = function() {
            console.error('Failed to load TinyMCE dynamically');
        };
        
        document.head.appendChild(script);
    }
    
    // Initialize debug tool when document is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Add the debug button to the page
        createDebugButton();
        
        // When TinyMCE should be fully loaded, check status
        setTimeout(function() {
            const editorContainers = document.querySelectorAll('.tox-tinymce');
            const toolbars = document.querySelectorAll('.tox-toolbar__primary');
            
            if (toolbars.length === 0 && editorContainers.length > 0) {
                console.warn('TinyMCE container found but toolbar is missing. This might indicate an initialization issue.');
            }
        }, 2000);
    });
    
    // Add global debug function
    window.debugTinyMCE = debugTinyMCE;
    window.reinitializeTinyMCE = attemptFixInitialization;
})(); 