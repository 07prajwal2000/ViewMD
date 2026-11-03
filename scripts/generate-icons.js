import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const logoSvg = fs.readFileSync(path.join(publicDir, 'logo.svg'), 'utf-8');

// Generate standard icons
function renderPng(svgString, size, outputPath) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: size },
  });
  const pngData = resvg.render();
  fs.writeFileSync(outputPath, pngData.asPng());
  console.log(`Rendered: ${outputPath} (${size}x${size})`);
}

// 1. Standard Icons
renderPng(logoSvg, 192, path.join(iconsDir, 'icon-192.png'));
renderPng(logoSvg, 512, path.join(iconsDir, 'icon-512.png'));
renderPng(logoSvg, 180, path.join(publicDir, 'apple-touch-icon.png'));

// 2. Maskable Icon SVG (with safe padding and dark background)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="mask-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#161b22" />
      <stop offset="100%" stop-color="#0d1117" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#mask-bg)" />
  <g transform="translate(64, 64) scale(1.5)">
    ${logoSvg.replace(/<\?xml[\s\S]*?\?>/i, '').replace(/<svg[\s\S]*?>/i, '').replace(/<\/svg>/i, '')}
  </g>
</svg>`;

renderPng(maskableSvg, 192, path.join(iconsDir, 'icon-maskable-192.png'));
renderPng(maskableSvg, 512, path.join(iconsDir, 'icon-maskable-512.png'));

console.log('All icons generated successfully!');
