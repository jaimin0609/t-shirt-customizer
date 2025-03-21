module.exports = {
  plugins: {
    'postcss-import': {},
    tailwindcss: require.resolve('tailwindcss'),
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: { preset: 'default' } } : {})
  }
} 