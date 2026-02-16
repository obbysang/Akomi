const sharp = require('sharp');
const fs = require('fs');

// Favicon generation script for Akomi
// Run: node generate-favicons.js

const sizes = [16, 32, 48, 64, 180, 192, 512];
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="240" fill="#004d4a"/>
  <text x="256" y="320" 
        font-family="Arial, sans-serif" 
        font-size="200" 
        font-weight="bold" 
        text-anchor="middle" 
        fill="white">AK</text>
</svg>
`;

// Create base SVG file
fs.writeFileSync('temp-favicon.svg', svgContent);

// Generate all PNG sizes
sizes.forEach(size => {
  sharp('temp-favicon.svg')
    .resize(size, size)
    .png()
    .toFile(`favicon-${size}x${size}.png`)
    .then(() => console.log(`Generated ${size}x${size} PNG`))
    .catch(err => console.error(`Error generating ${size}x${size}:`, err));
});

// Generate multi-size ICO file
const icoSizes = [16, 32, 48];
Promise.all(
  icoSizes.map(size => 
    sharp('temp-favicon.svg')
      .resize(size, size)
      .png()
      .toBuffer()
  )
).then(buffers => {
  // This would require a library like 'ico-endec' to combine into ICO
  console.log('ICO file generation would require additional library');
});

// Clean up
setTimeout(() => {
  fs.unlinkSync('temp-favicon.svg');
}, 5000);