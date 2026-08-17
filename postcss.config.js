module.exports = {
  plugins: [
    // Adds vendor prefixes automatically for cross-browser speed
    require('autoprefixer'),
    // Compresses and minifies your CSS code to absolute minimum size
    require('cssnano')({
      preset: 'default',
    }),
  ],
};