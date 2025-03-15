/**
 * TinyMCE Debug Utility
 * This script helps identify issues with TinyMCE loading and initialization
 * Add this to any page where TinyMCE is not working properly
 */

(function() {
    // Define a safe global debug function to prevent errors
    window.debugTinyMCE = function() {
        console.group('TinyMCE Debug Information');
        
        // Check if TinyMCE is loaded
        console.log('TinyMCE loaded:', typeof tinymce !== 'undefined');
        
        if (typeof tinymce !== 'undefined') {
            console.log('TinyMCE version:', tinymce.majorVersion + '.' + tinymce.minorVersion);
            
            // Safely get editor instances
            let editorCount = 0;
            try {
                // Modern way to get editors in TinyMCE 6+
                const editors = tinymce.get();
                editorCount = editors.length;
                console.log('Active editors:', editorCount);
                
                // List all editor instances
                editors.forEach((editor, index) => {
                    console.group(`Editor #${index + 1}: ${editor.id}`);
                    console.log('Initialized:', editor.initialized);
                    console.log('Settings:', editor.settings);
                    try {
                        console.log('Content preview:', editor.getContent().substring(0, 100) + '...');
                    } catch (e) {
                        console.log('Could not get content');
                    }
                    console.groupEnd();
                });
            } catch (e) {
                console.error('Error accessing editors:', e);
            }
            
            // If no editors are found, suggest fixes
            if (editorCount === 0) {
                console.warn('No active TinyMCE editors found. Initialization might have failed.');
                console.log('Try using the "Fix TinyMCE" button in the debug panel or reload the page.');
            }
        } else {
            console.error('TinyMCE is not loaded! Script might be missing or blocked.');
        }
        
        // Check DOM for editor elements
        const editorTextareas = document.querySelectorAll('textarea[id="productDescription"]');
        console.log('Editor textareas found:', editorTextareas.length);
        
        // Check for TinyMCE UI elements
        const editorContainers = document.querySelectorAll('.tox-tinymce');
        console.log('Editor containers found:', editorContainers.length);
        
        const toolbars = document.querySelectorAll('.tox-toolbar__primary');
        console.log('Toolbars found:', toolbars.length);
        
        console.groupEnd();
        return 'TinyMCE debug information logged to console';
    };

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('------------------ TinyMCE Debug Utility ------------------');
        
        // Create debug container
        const debugContainer = document.createElement('div');
        debugContainer.className = 'tinymce-debug-container';
        debugContainer.style.margin = '20px 0';
        debugContainer.style.padding = '15px';
        debugContainer.style.border = '2px dashed #dc3545';
        debugContainer.style.backgroundColor = '#f8f9fa';
        debugContainer.style.fontFamily = 'monospace';
        debugContainer.style.fontSize = '14px';
        
        // Add debug button to manually trigger debug info
        const debugButton = document.createElement('button');
        debugButton.textContent = 'Log Debug Info';
        debugButton.style.marginBottom = '15px';
        debugButton.style.padding = '8px 15px';
        debugButton.style.backgroundColor = '#ffc107';
        debugButton.style.color = 'black';
        debugButton.style.border = 'none';
        debugButton.style.borderRadius = '4px';
        debugButton.style.cursor = 'pointer';
        debugButton.onclick = function() {
            window.debugTinyMCE();
        };
        
        // Check if TinyMCE is loaded
        const isTinyMCELoaded = typeof window.tinymce !== 'undefined';
        console.log('TinyMCE loaded:', isTinyMCELoaded);
        
        // Get TinyMCE version (safely)
        let tinymceVersion = 'Not available';
        if (isTinyMCELoaded && window.tinymce.majorVersion) {
            tinymceVersion = window.tinymce.majorVersion + '.' + window.tinymce.minorVersion;
        }
        
        // Check editor instances (safely)
        let editorInstances = [];
        let activeEditors = 0;
        if (isTinyMCELoaded && typeof window.tinymce.get === 'function') {
            // In some TinyMCE versions, editors might not be an array
            try {
                editorInstances = window.tinymce.get();
                activeEditors = editorInstances.length;
            } catch (e) {
                console.error('Error checking editor instances:', e);
            }
        }
        
        // List all required DOM elements
        const textareaElement = document.getElementById('productDescription');
        const hasTextarea = !!textareaElement;
        console.log('Textarea element found:', hasTextarea);
        
        // Check for TinyMCE container elements
        const editorContainers = document.querySelectorAll('.tox-tinymce');
        const toolbars = document.querySelectorAll('.tox-toolbar__primary');
        console.log('TinyMCE containers found:', editorContainers.length);
        console.log('TinyMCE toolbars found:', toolbars.length);
        console.log('TinyMCE version:', tinymceVersion);
        console.log('Active TinyMCE editors:', activeEditors);
        
        // Check textarea visibility
        let textareaVisibility = 'Not found';
        if (hasTextarea) {
            const style = window.getComputedStyle(textareaElement);
            textareaVisibility = {
                display: style.display,
                visibility: style.visibility,
                height: style.height,
                width: style.width,
                opacity: style.opacity
            };
        }
        console.log('Textarea visibility:', textareaVisibility);
        
        // Create debug report HTML
        let debugReport = `
            <h3 style="color: #dc3545; margin-top: 0;">TinyMCE Debug Report</h3>
            <p><strong>TinyMCE loaded:</strong> ${isTinyMCELoaded}</p>
            <p><strong>TinyMCE version:</strong> ${tinymceVersion}</p>
            <p><strong>Active editors:</strong> ${activeEditors}</p>
            <p><strong>Textarea element found:</strong> ${hasTextarea}</p>
            <p><strong>TinyMCE containers found:</strong> ${editorContainers.length}</p>
            <p><strong>TinyMCE toolbars found:</strong> ${toolbars.length}</p>
            <p><strong>Textarea visibility:</strong> <pre>${JSON.stringify(textareaVisibility, null, 2)}</pre></p>
        `;
        
        // Check for CSP issues
        const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (cspMeta) {
            debugReport += `<p><strong>CSP Found:</strong> ${cspMeta.getAttribute('content')}</p>`;
            console.log('CSP Found:', cspMeta.getAttribute('content'));
        } else {
            debugReport += `<p><strong>CSP Found:</strong> No</p>`;
            console.log('CSP Found: No');
        }
        
        // Add script sources
        const scriptSources = Array.from(document.querySelectorAll('script[src*="tinymce"]'))
            .map(script => script.src);
        
        if (scriptSources.length > 0) {
            debugReport += `<p><strong>TinyMCE Script Sources:</strong></p><ul>`;
            scriptSources.forEach(src => {
                debugReport += `<li>${src}</li>`;
            });
            debugReport += `</ul>`;
        } else {
            debugReport += `<p><strong>TinyMCE Script Sources:</strong> None found</p>`;
        }
        
        // Check for Console errors
        debugReport += `<p><strong>Check browser console for errors</strong></p>`;
        
        // Add diagnostics about base_url and suffix
        if (isTinyMCELoaded) {
            let baseUrl = 'Not set';
            let suffix = 'Not set';
            
            try {
                // These might be internal and not accessible
                if (window.tinymce.baseURL) baseUrl = window.tinymce.baseURL;
                if (window.tinymce.suffix) suffix = window.tinymce.suffix;
            } catch (e) {
                console.warn('Could not access TinyMCE internal properties:', e);
            }
            
            debugReport += `<p><strong>Base URL:</strong> ${baseUrl}</p>`;
            debugReport += `<p><strong>Suffix:</strong> ${suffix}</p>`;
        }
        
        // Add direct fix button and diagnostic options
        debugReport += `
            <div style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 10px;">
                <button id="tinymceDebugFix" style="padding: 8px 15px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Fix TinyMCE
                </button>
                <button id="tinymceDebugForceBasic" style="padding: 8px 15px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Use Basic Editor
                </button>
                <button id="tinymceDebugReload" style="padding: 8px 15px; background-color: #0d6efd; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
        
        // Set initial content
        debugContainer.innerHTML = debugReport;
        
        // Add the debug button to the top of the container
        debugContainer.insertBefore(debugButton, debugContainer.firstChild);
        
        // Append container to page
        if (hasTextarea) {
            const parent = textareaElement.parentNode;
            parent.insertBefore(debugContainer, textareaElement);
        } else {
            document.body.insertBefore(debugContainer, document.body.firstChild);
        }
        
        // Add event listeners after container is added
        setTimeout(function() {
            document.getElementById('tinymceDebugFix').addEventListener('click', function() {
                fixTinyMCE();
            });
            
            document.getElementById('tinymceDebugForceBasic').addEventListener('click', function() {
                if (typeof createBasicEditor === 'function') {
                    // Remove any existing TinyMCE instances first
                    if (isTinyMCELoaded && typeof window.tinymce.remove === 'function') {
                        window.tinymce.remove('#productDescription');
                    }
                    
                    createBasicEditor();
                    debugReport += `<p style="color: blue;"><strong>Basic editor:</strong> Created</p>`;
                    debugContainer.innerHTML = debugReport;
                    
                    // Add the debug button again after updating content
                    debugContainer.insertBefore(debugButton.cloneNode(true), debugContainer.firstChild);
                    debugContainer.querySelector('button').onclick = function() {
                        window.debugTinyMCE();
                    };
                } else {
                    alert('Basic editor function not found. Try reloading the page first.');
                    debugReport += `<p style="color: red;"><strong>Basic editor:</strong> Function not found</p>`;
                    debugContainer.innerHTML = debugReport;
                    
                    // Add the debug button again after updating content
                    debugContainer.insertBefore(debugButton.cloneNode(true), debugContainer.firstChild);
                    debugContainer.querySelector('button').onclick = function() {
                        window.debugTinyMCE();
                    };
                }
            });
            
            document.getElementById('tinymceDebugReload').addEventListener('click', function() {
                window.location.reload();
            });
        }, 100);
        
        // Function to fix TinyMCE
        function fixTinyMCE() {
            debugReport += `<p><strong>Attempting to fix TinyMCE...</strong></p>`;
            debugContainer.innerHTML = debugReport;
            
            // Re-add the debug button after updating content
            debugContainer.insertBefore(debugButton.cloneNode(true), debugContainer.firstChild);
            debugContainer.querySelector('button').onclick = function() {
                window.debugTinyMCE();
            };
            
            // Create a new script element with the complete TinyMCE bundle
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tinymce@6.8.2/tinymce.min.js';
            script.integrity = 'sha256-Q5efEJ9LbVH8Ky/6iBQZ1PmVyQdT7QP7pVWa0ukIo1c=';
            script.crossOrigin = 'anonymous';
            
            script.onload = function() {
                debugReport += `<p style="color: green;"><strong>TinyMCE bundle loaded successfully</strong></p>`;
                debugContainer.innerHTML = debugReport;
                
                // Re-add the debug button after updating content
                debugContainer.insertBefore(debugButton.cloneNode(true), debugContainer.firstChild);
                debugContainer.querySelector('button').onclick = function() {
                    window.debugTinyMCE();
                };
                
                // Remove any existing instances
                if (typeof window.tinymce.remove === 'function') {
                    window.tinymce.remove('#productDescription');
                }
                
                // Initialize with minimal dependencies
                window.tinymce.init({
                    selector: '#productDescription',
                    height: 300,
                    base_url: 'https://cdn.jsdelivr.net/npm/tinymce@6.8.2',
                    suffix: '.min',
                    promotion: false,
                    branding: false,
                    menubar: false,
                    plugins: ['lists', 'link'],
                    toolbar: 'bold italic | bullist numlist | link',
                    setup: function(editor) {
                        editor.on('init', function() {
                            debugReport += `<p style="color: green;"><strong>TinyMCE initialized successfully</strong></p>`;
                            debugContainer.innerHTML = debugReport;
                            
                            // Re-add the debug button after updating content
                            debugContainer.insertBefore(debugButton.cloneNode(true), debugContainer.firstChild);
                            debugContainer.querySelector('button').onclick = function() {
                                window.debugTinyMCE();
                            };
                        });
                    }
                }).then(function() {
                    debugReport += `<p style="color: green;"><strong>TinyMCE initialization successful</strong></p>`;
                    debugContainer.innerHTML = debugReport;
                    
                    // Re-add the debug button after updating content
                    debugContainer.insertBefore(debugButton.cloneNode(true), debugContainer.firstChild);
                    debugContainer.querySelector('button').onclick = function() {
                        window.debugTinyMCE();
                    };
                    
                    // Hide the fix button in the main UI
                    const fixButton = document.getElementById('fixRichEditorBtn');
                    if (fixButton) fixButton.style.display = 'none';
                    
                }).catch(function(error) {
                    debugReport += `<p style="color: red;"><strong>TinyMCE initialization failed:</strong> ${error.message}</p>`;
                    debugContainer.innerHTML = debugReport;
                    
                    // Re-add the debug button after updating content
                    debugContainer.insertBefore(debugButton.cloneNode(true), debugContainer.firstChild);
                    debugContainer.querySelector('button').onclick = function() {
                        window.debugTinyMCE();
                    };
                    
                    if (typeof createBasicEditor === 'function') {
                        debugReport += `<p><strong>Falling back to basic editor...</strong></p>`;
                        debugContainer.innerHTML = debugReport;
                        
                        // Re-add the debug button after updating content
                        debugContainer.insertBefore(debugButton.cloneNode(true), debugContainer.firstChild);
                        debugContainer.querySelector('button').onclick = function() {
                            window.debugTinyMCE();
                        };
                        
                        createBasicEditor();
                    }
                });
            };
            
            script.onerror = function() {
                debugReport += `<p style="color: red;"><strong>Failed to load TinyMCE bundle</strong></p>`;
                debugContainer.innerHTML = debugReport;
                
                // Re-add the debug button after updating content
                debugContainer.insertBefore(debugButton.cloneNode(true), debugContainer.firstChild);
                debugContainer.querySelector('button').onclick = function() {
                    window.debugTinyMCE();
                };
                
                if (typeof createBasicEditor === 'function') {
                    debugReport += `<p><strong>Falling back to basic editor...</strong></p>`;
                    debugContainer.innerHTML = debugReport;
                    
                    // Re-add the debug button after updating content
                    debugContainer.insertBefore(debugButton.cloneNode(true), debugContainer.firstChild);
                    debugContainer.querySelector('button').onclick = function() {
                        window.debugTinyMCE();
                    };
                    
                    createBasicEditor();
                }
            };
            
            document.head.appendChild(script);
        }
        
        // Browser compatibility check
        const userAgent = navigator.userAgent;
        debugReport += `<p><strong>Browser:</strong> ${userAgent}</p>`;
        debugContainer.innerHTML = debugReport;
        console.log('Browser:', userAgent);
        
        // Network connectivity check
        const img = new Image();
        img.onload = function() {
            debugReport += `<p style="color: green;"><strong>Network connectivity:</strong> Good</p>`;
            debugContainer.innerHTML = debugReport;
            console.log('Network connectivity: Good');
        };
        img.onerror = function() {
            debugReport += `<p style="color: red;"><strong>Network connectivity:</strong> Poor or Restricted</p>`;
            debugContainer.innerHTML = debugReport;
            console.log('Network connectivity: Poor or Restricted');
        };
        img.src = 'https://cdn.jsdelivr.net/favicon.ico?_=' + Date.now();
    });

    // Function to create a basic editor if TinyMCE fails
    function createBasicEditor() {
        debugReport += `<p><strong>Creating basic editor fallback...</strong></p>`;
        debugContainer.innerHTML = debugReport;
        
        // Re-add the debug button after updating content
        debugContainer.insertBefore(debugButton.cloneNode(true), debugContainer.firstChild);
        debugContainer.querySelector('button').onclick = function() {
            window.debugTinyMCE();
        };
        
        // Hide the original textarea
        const textarea = document.getElementById('productDescription');
        if (!textarea) {
            debugReport += `<p style="color: red;"><strong>Error:</strong> Could not find product description textarea</p>`;
            debugContainer.innerHTML = debugReport;
            
            // Re-add the debug button after updating content
            debugContainer.insertBefore(debugButton.cloneNode(true), debugContainer.firstChild);
            debugContainer.querySelector('button').onclick = function() {
                window.debugTinyMCE();
            };
            return;
        }
        
        textarea.style.display = 'none';
        
        // Create an editable div
        const editorContainer = document.createElement('div');
        editorContainer.className = 'basic-editor-container';
        editorContainer.innerHTML = `
            <div class="basic-editor-toolbar">
                <button type="button" data-command="bold" title="Bold"><strong>B</strong></button>
                <button type="button" data-command="italic" title="Italic"><em>I</em></button>
                <button type="button" data-command="insertUnorderedList" title="Bullet List">• List</button>
                <button type="button" data-command="createLink" title="Insert Link">🔗 Link</button>
            </div>
            <div class="fallback-note">Fallback editor active. <button type="button" id="reloadPage">Try reloading</button> for full editor.</div>
            <div id="basicEditor" contenteditable="true" class="basic-editor-content">${textarea.value}</div>
        `;
        
        // Insert after textarea
        textarea.parentNode.insertBefore(editorContainer, textarea.nextSibling);
        
        // Style the basic editor
        const style = document.createElement('style');
        style.textContent = `
            .basic-editor-container {
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-bottom: 15px;
            }
            .basic-editor-toolbar {
                padding: 8px;
                background: #f5f5f5;
                border-bottom: 1px solid #ddd;
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
            }
            .basic-editor-toolbar button {
                padding: 5px 10px;
                background: white;
                border: 1px solid #ccc;
                border-radius: 3px;
                cursor: pointer;
            }
            .basic-editor-toolbar button:hover {
                background: #e9e9e9;
            }
            .basic-editor-content {
                min-height: 200px;
                padding: 10px;
                overflow-y: auto;
            }
            .fallback-note {
                background-color: #fff3cd;
                color: #856404;
                padding: 8px;
                font-size: 0.9em;
                border-bottom: 1px solid #ddd;
            }
            .fallback-note button {
                background: none;
                border: none;
                color: #0066cc;
                text-decoration: underline;
                cursor: pointer;
                padding: 0;
            }
        `;
        document.head.appendChild(style);
        
        // Add event listeners for the buttons
        editorContainer.querySelectorAll('.basic-editor-toolbar button').forEach(button => {
            button.addEventListener('click', function() {
                const command = this.getAttribute('data-command');
                if (command === 'createLink') {
                    const url = prompt('Enter the URL:', 'https://');
                    if (url) {
                        document.execCommand('createLink', false, url);
                    }
                } else {
                    document.execCommand(command, false, null);
                }
                // Update the textarea with the new content
                textarea.value = document.getElementById('basicEditor').innerHTML;
            });
        });
        
        // Update textarea when content changes in the editable div
        document.getElementById('basicEditor').addEventListener('input', function() {
            textarea.value = this.innerHTML;
        });
        
        // Add reload page functionality
        document.getElementById('reloadPage').addEventListener('click', function() {
            window.location.reload();
        });
        
        debugReport += `<p style="color: green;"><strong>Basic editor created successfully</strong></p>`;
        debugContainer.innerHTML = debugReport;
        
        // Re-add the debug button after updating content
        debugContainer.insertBefore(debugButton.cloneNode(true), debugContainer.firstChild);
        debugContainer.querySelector('button').onclick = function() {
            window.debugTinyMCE();
        };
    }
})(); 