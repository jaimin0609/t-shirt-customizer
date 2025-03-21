export default {
  plugins: {
    'postcss-import': {},
    tailwindcss: './node_modules/tailwindcss',
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: { preset: 'default' } } : {})
  }
} 