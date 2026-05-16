const postcss = require('postcss');
const tailwindCss = require('@tailwindcss/postcss');
const fs = require('fs');

// Read the input CSS
const inputCss = fs.readFileSync('./css/tailwind-input.css', 'utf8');

// Process with PostCSS and Tailwind
postcss([tailwindCss])
  .process(inputCss, { from: './css/tailwind-input.css', to: './css/tailwind.css' })
  .then(result => {
    fs.writeFileSync('./css/tailwind.css', result.css);
    console.log('CSS generated successfully!');
  })
  .catch(err => {
    console.error('Error generating CSS:', err);
    process.exit(1);
  });
