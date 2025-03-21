/**
 * CSS Optimizer
 * 
 * This utility helps optimize CSS by:
 * 1. Generating class names only when needed
 * 2. Combining styles efficiently 
 * 3. Creating conditional styles
 * 4. Handling style purging for production builds
 */

// Style cache to prevent duplicate styles
const styleCache = new Map();

/**
 * Creates a unique hash for a style object
 * @param {Object} obj - Style object to hash
 * @returns {string} - Hash string
 */
function hashObject(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

/**
 * Combine multiple style objects, with later styles overriding earlier ones
 * @param {...Object} styles - Style objects to combine
 * @returns {Object} - Combined style object
 */
export function combineStyles(...styles) {
  return styles.reduce((acc, style) => {
    if (!style) return acc;
    
    // Handle arrays of styles
    if (Array.isArray(style)) {
      return { ...acc, ...combineStyles(...style) };
    }
    
    // Handle objects
    if (typeof style === 'object') {
      const result = { ...acc };
      
      for (const key in style) {
        const value = style[key];
        
        // Handle nested selectors (like '&:hover')
        if (key.startsWith('&') && typeof value === 'object') {
          result[key] = { ...(result[key] || {}), ...value };
        } 
        // Handle media queries or other nested objects
        else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          result[key] = { ...(result[key] || {}), ...value };
        } 
        // Handle normal properties
        else {
          result[key] = value;
        }
      }
      
      return result;
    }
    
    return acc;
  }, {});
}

/**
 * Create conditional styles based on a condition
 * @param {boolean} condition - Whether to include these styles
 * @param {Object} trueStyles - Styles to use if condition is true
 * @param {Object} falseStyles - Styles to use if condition is false (optional)
 * @returns {Object} - Selected style object
 */
export function conditionalStyles(condition, trueStyles, falseStyles = {}) {
  return condition ? trueStyles : falseStyles;
}

/**
 * Create a style object only if condition is true
 * @param {boolean} condition - Whether to include these styles
 * @param {Object} styles - Styles to conditionally include
 * @returns {Object|null} - Style object or null
 */
export function includeIf(condition, styles) {
  return condition ? styles : null;
}

/**
 * Optimize styles by caching and deduplicating
 * @param {Object} styles - Style object to optimize
 * @returns {Object} - Optimized style object with a unique className
 */
export function optimizeStyles(styles) {
  if (!styles) return { styles: {} };
  
  const hash = hashObject(styles);
  
  // Return cached version if available
  if (styleCache.has(hash)) {
    return styleCache.get(hash);
  }
  
  // Generate a unique class name based on hash
  const className = `c-${hash.slice(0, 8)}`;
  
  const result = {
    styles,
    className,
    // Function to apply these styles as inline styles
    toInlineStyles: () => styles,
    // Join with additional class names
    cx: (...classNames) => [className, ...classNames].filter(Boolean).join(' '),
  };
  
  // Cache the result
  styleCache.set(hash, result);
  
  return result;
}

/**
 * Creates a function to dynamically generate optimized styles
 * @param {Function} styleFactory - Function that generates styles based on props
 * @returns {Function} - Function that returns optimized styles
 */
export function createStyleFactory(styleFactory) {
  return (...args) => {
    const styles = styleFactory(...args);
    return optimizeStyles(styles);
  };
}

/**
 * Creates a component-specific style function with variants
 * @param {Object} baseStyles - Base styles for the component
 * @param {Object} variants - Object containing style variants
 * @returns {Function} - Function to generate component styles
 */
export function createComponentStyles(baseStyles, variants = {}) {
  return (variantProps = {}) => {
    let result = { ...baseStyles };
    
    // Apply variants
    Object.keys(variantProps).forEach(variantName => {
      const variantValue = variantProps[variantName];
      if (variantValue && variants[variantName] && variants[variantName][variantValue]) {
        result = combineStyles(result, variants[variantName][variantValue]);
      }
    });
    
    return optimizeStyles(result);
  };
}

/**
 * Tag function for template literals to create styles
 * @param {Array} strings - Template literal strings
 * @param {...any} values - Template literal values
 * @returns {Object} - Style object
 */
export function css(strings, ...values) {
  let cssString = '';
  
  // Combine strings and values
  strings.forEach((str, i) => {
    cssString += str;
    if (i < values.length) {
      cssString += values[i];
    }
  });
  
  // Convert CSS string to object (simple version)
  const result = {};
  
  cssString
    .split(';')
    .filter(Boolean)
    .forEach(rule => {
      const [property, value] = rule.split(':').map(s => s.trim());
      if (property && value) {
        // Convert kebab-case to camelCase
        const camelProperty = property.replace(/-([a-z])/g, g => g[1].toUpperCase());
        result[camelProperty] = value;
      }
    });
  
  return result;
}

/**
 * Function to purge unused styles for production builds
 * Should be called during the build process
 * @param {Object} allStyles - Collection of all styles
 * @param {Array} usedClasses - Array of class names that are actually used
 * @returns {Object} - Purged style collection
 */
export function purgeUnusedStyles(allStyles, usedClasses) {
  const purgedStyles = {};
  
  // Only keep styles that have class names in the usedClasses array
  for (const [hash, styleData] of styleCache.entries()) {
    if (usedClasses.includes(styleData.className)) {
      purgedStyles[hash] = styleData;
    }
  }
  
  return purgedStyles;
}

/**
 * Utility to find all used class names in components
 * @param {Array} componentFiles - Array of component file contents 
 * @returns {Array} - Array of used class names
 */
export function findUsedClasses(componentFiles) {
  const usedClasses = new Set();
  const classRegex = /className\s*=\s*["']([^"']+)["']/g;
  
  componentFiles.forEach(fileContent => {
    let match;
    while ((match = classRegex.exec(fileContent)) !== null) {
      match[1].split(' ').forEach(cls => usedClasses.add(cls.trim()));
    }
  });
  
  return Array.from(usedClasses);
}

/**
 * Generates critical CSS for above-the-fold content
 * @param {Array} components - Array of components in the critical rendering path
 * @returns {string} - Critical CSS as a string
 */
export function generateCriticalCSS(components) {
  const criticalStyles = new Set();
  
  // Extract styles from critical components
  components.forEach(component => {
    if (component.styles && component.className) {
      criticalStyles.add({
        className: component.className,
        styles: component.styles
      });
    }
  });
  
  // Convert to CSS string (simple implementation)
  let cssString = '';
  
  criticalStyles.forEach(({ className, styles }) => {
    cssString += `.${className} {\n`;
    
    Object.entries(styles).forEach(([prop, value]) => {
      // Skip nested selectors/objects for this simple implementation
      if (typeof value !== 'object') {
        // Convert camelCase back to kebab-case
        const kebabProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        cssString += `  ${kebabProp}: ${value};\n`;
      }
    });
    
    cssString += '}\n';
  });
  
  return cssString;
}

export default {
  combineStyles,
  conditionalStyles,
  includeIf,
  optimizeStyles,
  createStyleFactory,
  createComponentStyles,
  css,
  purgeUnusedStyles,
  findUsedClasses,
  generateCriticalCSS
}; 