// This script polyfills React.createContext for immediate availability
(function() {
  console.log("React polyfill initializing");

  // Define a basic createContext implementation to use until the real one loads
  const createTemporaryContext = function(defaultValue) {
    console.log("Using polyfilled createContext");
    const contextValue = defaultValue;
    
    // Create a minimal Provider component
    const Provider = function({ value, children }) {
      this._value = value !== undefined ? value : contextValue;
      return children;
    };
    
    // Create a minimal Consumer component
    const Consumer = function({ children }) {
      return children(this._value !== undefined ? this._value : contextValue);
    };
    
    return {
      Provider: Provider,
      Consumer: Consumer,
      _currentValue: defaultValue,
      _currentValue2: defaultValue,
      // Fields required by some libraries
      $$typeof: Symbol.for('react.context'),
      _contextListener: null,
      _defaultValue: defaultValue
    };
  };
  
  // Ensure React object exists globally
  window.React = window.React || {};
  
  // Temporarily provide createContext if it doesn't exist
  if (!window.React.createContext) {
    console.log("Polyfilling React.createContext");
    window.React.createContext = createTemporaryContext;
  } else {
    console.log("Real React.createContext already available");
  }
  
  // Replace the polyfill with the real implementation when it loads
  const checkForRealReact = function() {
    const loadedReactModules = window.__REACT_MODULES;
    if (loadedReactModules && loadedReactModules.React && loadedReactModules.React.createContext) {
      console.log("Replacing polyfilled createContext with real implementation");
      window.React.createContext = loadedReactModules.React.createContext;
    }
  };
  
  // Check multiple times to ensure we catch the real React loading
  setTimeout(checkForRealReact, 50);
  setTimeout(checkForRealReact, 100);
  setTimeout(checkForRealReact, 300);
  
  // Also set up window event listener for our custom React loaded event
  window.addEventListener('react-loaded', function() {
    checkForRealReact();
  });
  
  console.log("React polyfill initialized");
})(); 