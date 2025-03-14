/**
 * TinyMCE Debug Utility
 * This script helps identify issues with TinyMCE loading and initialization
 * Add this to any page where TinyMCE is not working properly
 */

(function() {
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
        
        // Check if TinyMCE is loaded
        const isTinyMCELoaded = typeof window.tinymce !== 'undefined';
        console.log('TinyMCE loaded:', isTinyMCELoaded);
        
        // List all required DOM elements
        const textareaElement = document.getElementById('productDescription');
        const hasTextarea = !!textareaElement;
        console.log('Textarea element found:', hasTextarea);
        
        // Check for TinyMCE container elements
        const editorContainers = document.querySelectorAll('.tox-tinymce');
        const toolbars = document.querySelectorAll('.tox-toolbar__primary');
        console.log('TinyMCE containers found:', editorContainers.length);
        console.log('TinyMCE toolbars found:', toolbars.length);
        
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
        
        // Try to load TinyMCE dynamically
        console.log('Attempting to load TinyMCE dynamically...');
        
        // Create script element
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.7.2/tinymce.min.js';
        script.integrity = 'sha512-AzvIEbpsAxvXAR6AlL76VNSC7XFmeCK+KYYl1lQmm+MvZED4AlIAObfjCQbjZ+OLe5CF4aDV1EtDLP4FuDwE2JA==';
        script.crossOrigin = 'anonymous';
        
        // Create debug report HTML
        let debugReport = `
            <h3 style="color: #dc3545; margin-top: 0;">TinyMCE Debug Report</h3>
            <p><strong>TinyMCE loaded:</strong> ${isTinyMCELoaded}</p>
            <p><strong>Textarea element found:</strong> ${hasTextarea}</p>
            <p><strong>TinyMCE containers found:</strong> ${editorContainers.length}</p>
            <p><strong>TinyMCE toolbars found:</strong> ${toolbars.length}</p>
            <p><strong>Textarea visibility:</strong> ${JSON.stringify(textareaVisibility, null, 2)}</p>
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
        
        // Check for Console errors
        debugReport += `<p><strong>Check browser console for errors</strong></p>`;
        
        // Attempt to load script
        script.onload = function() {
            debugReport += `<p style="color: green;"><strong>Dynamic load:</strong> Success</p>`;
            debugContainer.innerHTML = debugReport;
            console.log('TinyMCE dynamically loaded successfully');
            
            // Try to initialize
            if (hasTextarea) {
                window.tinymce.init({
                    selector: '#productDescription',
                    height: 300,
                    menubar: false,
                    plugins: 'lists link',
                    toolbar: 'bold italic | bullist numlist | link'
                }).then(function() {
                    debugReport += `<p style="color: green;"><strong>Dynamic initialization:</strong> Success</p>`;
                    debugContainer.innerHTML = debugReport;
                    console.log('TinyMCE dynamically initialized successfully');
                }).catch(function(error) {
                    debugReport += `<p style="color: red;"><strong>Dynamic initialization:</strong> Failed - ${error.message}</p>`;
                    debugContainer.innerHTML = debugReport;
                    console.error('TinyMCE dynamic initialization failed:', error);
                });
            }
        };
        
        script.onerror = function() {
            debugReport += `<p style="color: red;"><strong>Dynamic load:</strong> Failed</p>`;
            debugContainer.innerHTML = debugReport;
            console.error('Failed to load TinyMCE dynamically');
        };
        
        // Add actions
        debugReport += `
            <div style="margin-top: 15px;">
                <button id="tinymceDebugForceCdn1" style="margin-right: 10px; padding: 5px 10px;">Try CDN #1</button>
                <button id="tinymceDebugForceCdn2" style="margin-right: 10px; padding: 5px 10px;">Try CDN #2</button>
                <button id="tinymceDebugForceBasic" style="padding: 5px 10px;">Use Basic Editor</button>
            </div>
        `;
        
        // Set initial content
        debugContainer.innerHTML = debugReport;
        
        // Append container to page
        if (hasTextarea) {
            const parent = textareaElement.parentNode;
            parent.insertBefore(debugContainer, textareaElement);
        } else {
            document.body.insertBefore(debugContainer, document.body.firstChild);
        }
        
        // Add script to page
        document.head.appendChild(script);
        
        // Add event listeners after container is added
        setTimeout(function() {
            document.getElementById('tinymceDebugForceCdn1').addEventListener('click', function() {
                loadFromCdn('https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js');
            });
            
            document.getElementById('tinymceDebugForceCdn2').addEventListener('click', function() {
                loadFromCdn('https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js');
            });
            
            document.getElementById('tinymceDebugForceBasic').addEventListener('click', function() {
                if (typeof createBasicEditor === 'function') {
                    createBasicEditor();
                    debugReport += `<p style="color: blue;"><strong>Basic editor:</strong> Created</p>`;
                    debugContainer.innerHTML = debugReport;
                } else {
                    debugReport += `<p style="color: red;"><strong>Basic editor:</strong> Function not found</p>`;
                    debugContainer.innerHTML = debugReport;
                }
            });
        }, 100);
        
        // Function to load TinyMCE from a different CDN
        function loadFromCdn(cdnUrl) {
            const newScript = document.createElement('script');
            newScript.src = cdnUrl;
            
            newScript.onload = function() {
                debugReport += `<p style="color: green;"><strong>Alternative CDN:</strong> Loaded from ${cdnUrl}</p>`;
                debugContainer.innerHTML = debugReport;
                console.log('TinyMCE loaded from alternative CDN:', cdnUrl);
                
                if (hasTextarea) {
                    window.tinymce.init({
                        selector: '#productDescription',
                        height: 300,
                        menubar: false,
                        plugins: 'lists link',
                        toolbar: 'bold italic | bullist numlist | link'
                    });
                }
            };
            
            newScript.onerror = function() {
                debugReport += `<p style="color: red;"><strong>Alternative CDN:</strong> Failed to load from ${cdnUrl}</p>`;
                debugContainer.innerHTML = debugReport;
                console.error('Failed to load TinyMCE from alternative CDN:', cdnUrl);
            };
            
            document.head.appendChild(newScript);
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
})(); 