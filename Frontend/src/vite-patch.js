/**
 * Vite Module Resolution Patch
 * 
 * This file acts as a bridge to help resolve Vite in environments like Vercel
 * where module resolution can be problematic.
 */

// Re-export the entire vite module
import * as vite from 'vite';
export default vite;
export const { defineConfig } = vite; 