export default {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' 
      ? { 
          cssnano: { 
            preset: ['default', { 
              discardComments: { removeAll: true },
              normalizeWhitespace: false, // Keep some whitespace for readability
              cssDeclarationSorter: true,
              reduceIdents: false, // Avoid breaking keyframe animations
              minifyFontValues: true,
              colormin: true
            }]
          } 
        } 
      : {})
  }
} 