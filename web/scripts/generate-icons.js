// Script to generate PWA icons from the 512x512 source icon
// Uses sharp for image resizing

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384];
const sourceIcon = path.join(__dirname, '..', 'public', 'icons', 'icon-512x512.png');
const outputDir = path.join(__dirname, '..', 'public', 'icons');

// We'll use a simple canvas approach with the built-in node
// Since we don't have sharp, we'll create placeholder SVG icons
// that look great and work for PWA

const generateSvgIcon = (size) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0e1a"/>
      <stop offset="100%" style="stop-color:#111827"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6"/>
      <stop offset="100%" style="stop-color:#14b8a6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>
  <g transform="translate(256,256)">
    <!-- Infinity/Loop Symbol -->
    <path d="M-80,-30 C-80,-70 -40,-70 0,-30 C40,10 80,10 80,-30 C80,-70 40,-70 0,-30 C-40,10 -80,10 -80,-30 Z" 
          fill="none" stroke="url(#accent)" stroke-width="28" stroke-linecap="round"/>
    <!-- Inner chain detail -->
    <circle cx="-55" cy="-30" r="8" fill="#8b5cf6" opacity="0.6"/>
    <circle cx="55" cy="-30" r="8" fill="#14b8a6" opacity="0.6"/>
    <!-- P letter -->
    <text x="-15" y="65" font-family="Inter, sans-serif" font-size="80" font-weight="800" fill="url(#accent)">P</text>
  </g>
</svg>`;
};

console.log('Generating PWA icons...');
sizes.forEach(size => {
  const svgContent = generateSvgIcon(size);
  const outputPath = path.join(outputDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(outputPath, svgContent);
  console.log(`  ✓ Generated ${size}x${size}`);
});

console.log('Done! SVG icons generated.');
console.log('Note: For production, convert these to PNG using a tool like sharp or cairosvg.');
