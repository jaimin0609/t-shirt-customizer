// This script ensures React is available globally before app code runs
(function() {
  // Grab React from the bundled version
  const waitForReact = function() {
    // Check if our bundled React is loaded
    if (window.__REACT_LOADED) {
      console.log("React already loaded and exposed globally");
      return;
    }

    // Try to expose the bundled React globally
    try {
      // Attempt to expose React even if not typically available as a global
      const exposeBundledReact = function() {
        const reactModules = window.__REACT_MODULES = window.__REACT_MODULES || {};
        
        // Some React contexts may be using these directly
        if (!window.React) {
          console.log("Exposing bundled React globally");
          // Wait for the bundled React to be available and expose it globally
          window.React = reactModules.React;
        }

        if (!window.ReactDOM) {
          console.log("Exposing bundled ReactDOM globally");
          window.ReactDOM = reactModules.ReactDOM;
        }
        
        window.__REACT_LOADED = true;
      };
      
      // Expose the global React object
      exposeBundledReact();
      
      // Recheck after a delay in case code loads asynchronously
      setTimeout(exposeBundledReact, 100);
      setTimeout(exposeBundledReact, 500);
    } catch (e) {
      console.error("Error in react-loader.js:", e);
    }
  };
  
  // Run immediately and also on DOM content loaded
  waitForReact();
  document.addEventListener('DOMContentLoaded', waitForReact);
})(); 