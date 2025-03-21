/**
 * Critical CSS Generator
 * 
 * This utility generates critical CSS for above-the-fold content to improve
 * initial page load performance. It extracts and inlines essential styles
 * needed for the first render of the page.
 */

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import puppeteer from 'puppeteer';
import CleanCSS from 'clean-css';

/**
 * Extract critical CSS from a URL
 * 
 * @param {string} url - The URL to extract critical CSS from
 * @param {Object} options - Options for extraction
 * @returns {Promise<string>} - Critical CSS as a string
 */
export async function extractCriticalCss(url, options = {}) {
  const {
    width = 1200,
    height = 800,
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    timeout = 30000,
    ignore = [/print/, /\.print-/],
  } = options;
  
  // Launch headless browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport and user agent
  await page.setViewport({ width, height });
  await page.setUserAgent(userAgent);
  
  // Store CSS rules found in the page
  let criticalCSS = '';
  
  // Navigate to the URL
  await page.goto(url, { waitUntil: 'networkidle0', timeout });
  
  // Extract all styles from the page
  const extractedCSS = await page.evaluate(() => {
    let css = '';
    
    // Get all stylesheets from the document
    const styleSheets = Array.from(document.styleSheets);
    
    styleSheets.forEach(sheet => {
      try {
        // Get all CSS rules from the stylesheet
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        
        rules.forEach(rule => {
          css += rule.cssText + '\n';
        });
      } catch (e) {
        // Skip external stylesheets which can't be accessed due to CORS
        console.warn('Could not access stylesheet', e);
      }
    });
    
    // Also get inline styles from style tags
    const styleTags = Array.from(document.querySelectorAll('style'));
    styleTags.forEach(tag => {
      css += tag.textContent + '\n';
    });
    
    return css;
  });
  
  // Filter out CSS that matches the above-the-fold content
  const aboveFoldSelectors = await page.evaluate(() => {
    // Get all elements visible in the viewport
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Find all elements in the viewport
    const elements = Array.from(document.querySelectorAll('*'));
    const visibleElements = elements.filter(el => {
      const rect = el.getBoundingClientRect();
      
      // Check if the element is visible in the viewport
      return (
        rect.top < viewportHeight &&
        rect.left < viewportWidth &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        window.getComputedStyle(el).display !== 'none' &&
        window.getComputedStyle(el).visibility !== 'hidden'
      );
    });
    
    // Get all class names and IDs from visible elements
    const selectors = new Set();
    
    visibleElements.forEach(el => {
      // Add tag name
      selectors.add(el.tagName.toLowerCase());
      
      // Add ID if it exists
      if (el.id) {
        selectors.add(`#${el.id}`);
      }
      
      // Add classes
      if (el.classList && el.classList.length) {
        el.classList.forEach(className => {
          selectors.add(`.${className}`);
        });
      }
      
      // Add basic attribute selectors
      ['type', 'role', 'data-testid'].forEach(attr => {
        if (el.hasAttribute(attr)) {
          selectors.add(`[${attr}="${el.getAttribute(attr)}"]`);
        }
      });
    });
    
    return Array.from(selectors);
  });
  
  // Close browser
  await browser.close();
  
  // Parse the CSS to identify and filter rules that match above-fold elements
  const dom = new JSDOM('');
  const { window } = dom;
  
  // Create a style element to parse the CSS
  const styleEl = window.document.createElement('style');
  styleEl.textContent = extractedCSS;
  window.document.head.appendChild(styleEl);
  
  // Extract matching rules
  const { styleSheets } = window.document;
  
  // Helper to check if a selector matches the above fold selectors
  const isMatchingSelector = (selector) => {
    // Skip ignored patterns
    if (ignore.some(pattern => pattern.test(selector))) {
      return false;
    }
    
    // Simple exact matches (for basic selectors)
    if (aboveFoldSelectors.includes(selector)) {
      return true;
    }
    
    // Check if the selector is a compound selector that contains our above fold selectors
    return aboveFoldSelectors.some(aboveSelector => {
      // For class and ID selectors
      if (aboveSelector.startsWith('.') || aboveSelector.startsWith('#')) {
        return selector.includes(aboveSelector);
      }
      
      // For tag selectors - match as whole words (e.g., "div", not "divider")
      return selector.match(new RegExp(`\\b${aboveSelector}\\b`));
    });
  };
  
  // Process all stylesheets
  for (const sheet of Array.from(styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules || sheet.rules || []);
      
      for (const rule of rules) {
        // Handle style rules
        if (rule.type === 1) { // CSSStyleRule
          if (isMatchingSelector(rule.selectorText)) {
            criticalCSS += rule.cssText + '\n';
          }
        }
        // Handle media queries
        else if (rule.type === 4) { // CSSMediaRule
          // For simplicity, include all media queries for small viewports
          if (rule.conditionText.includes('max-width') || rule.conditionText.includes('min-width')) {
            criticalCSS += rule.cssText + '\n';
          }
        }
        // Handle keyframe animations used by above-fold elements
        else if (rule.type === 7) { // CSSKeyframesRule
          criticalCSS += rule.cssText + '\n';
        }
        // Handle import rules
        else if (rule.type === 3) { // CSSImportRule
          // Skip external imports for simplicity
        }
        // Include font face declarations
        else if (rule.type === 5) { // CSSFontFaceRule
          criticalCSS += rule.cssText + '\n';
        }
      }
    } catch (e) {
      console.warn('Error processing stylesheet:', e);
    }
  }
  
  // Minify the critical CSS
  const cleanCSS = new CleanCSS({ level: 2 });
  const minified = cleanCSS.minify(criticalCSS);
  
  return minified.styles;
}

/**
 * Save critical CSS to a file
 * 
 * @param {string} css - The critical CSS to save
 * @param {string} outputPath - The path to save the CSS to
 */
export function saveCriticalCss(css, outputPath) {
  const dir = path.dirname(outputPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write CSS to file
  fs.writeFileSync(outputPath, css);
  
  console.log(`Critical CSS saved to ${outputPath}`);
}

/**
 * Generate critical CSS and create an HTML template with it inlined
 * 
 * @param {string} url - The URL to extract critical CSS from
 * @param {string} templatePath - Path to the HTML template
 * @param {string} outputPath - Path to save the modified template
 * @param {Object} options - Options for extraction
 */
export async function generateInlinedTemplate(url, templatePath, outputPath, options = {}) {
  // Extract critical CSS
  const criticalCSS = await extractCriticalCss(url, options);
  
  // Read the HTML template
  const templateHTML = fs.readFileSync(templatePath, 'utf8');
  
  // Create a DOM to modify the HTML
  const dom = new JSDOM(templateHTML);
  const { document } = dom.window;
  
  // Create a style element for the critical CSS
  const styleEl = document.createElement('style');
  styleEl.id = 'critical-css';
  styleEl.textContent = criticalCSS;
  
  // Add the style element to the head
  document.head.insertBefore(styleEl, document.head.firstChild);
  
  // Add preload for the main stylesheet
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  links.forEach(link => {
    // Change render-blocking stylesheets to preload
    link.setAttribute('rel', 'preload');
    link.setAttribute('as', 'style');
    link.setAttribute('onload', "this.onload=null;this.rel='stylesheet'");
    
    // Add fallback for browsers that don't support onload for link
    const noscript = document.createElement('noscript');
    const fallbackLink = document.createElement('link');
    fallbackLink.setAttribute('rel', 'stylesheet');
    fallbackLink.setAttribute('href', link.getAttribute('href'));
    noscript.appendChild(fallbackLink);
    
    link.parentNode.insertBefore(noscript, link.nextSibling);
  });
  
  // Save the modified HTML
  const modifiedHTML = dom.serialize();
  saveCriticalCss(modifiedHTML, outputPath);
  
  console.log(`Inlined template saved to ${outputPath}`);
}

/**
 * Command line interface for the critical CSS generator
 */
function cli() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node generateCriticalCss.js <url> <outputPath> [options]');
    process.exit(1);
  }
  
  const url = args[0];
  const outputPath = args[1];
  
  // Parse options
  const options = {};
  for (let i = 2; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    
    if (key === 'width' || key === 'height' || key === 'timeout') {
      options[key] = parseInt(value, 10);
    } else {
      options[key] = value;
    }
  }
  
  // Run the critical CSS extraction
  extractCriticalCss(url, options)
    .then(css => {
      saveCriticalCss(css, outputPath);
    })
    .catch(err => {
      console.error('Error generating critical CSS:', err);
      process.exit(1);
    });
}

// Run the CLI if this script is executed directly
if (require.main === module) {
  cli();
}

export default {
  extractCriticalCss,
  saveCriticalCss,
  generateInlinedTemplate
}; 