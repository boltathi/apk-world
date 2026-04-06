/**
 * Generate PWA icons from SVG source.
 * Run: node scripts/generate-icons.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const PUBLIC = path.join(__dirname, "..", "public");
const ICONS_DIR = path.join(PUBLIC, "icons");
const SVG_PATH = path.join(PUBLIC, "icon.svg");

// Icon SVG without text (for small icons)
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#030712"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="amber" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fcd34d"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="#fbbf24" stroke-width="6" opacity="0.2"/>
  <path d="M256 100 L340 340 L296 340 L274 274 L238 274 L216 340 L172 340 Z" fill="url(#amber)"/>
  <rect x="220" y="240" width="72" height="18" rx="4" fill="#030712"/>
  <circle cx="256" cy="160" r="12" fill="#fef3c7" opacity="0.9"/>
</svg>`;

// Maskable icon needs safe zone (centered in larger canvas with padding)
const MASKABLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#030712"/>
  <g transform="translate(76, 76) scale(0.7)">
    <defs>
      <linearGradient id="amber2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fcd34d"/>
        <stop offset="100%" stop-color="#f59e0b"/>
      </linearGradient>
    </defs>
    <circle cx="256" cy="256" r="140" fill="none" stroke="#fbbf24" stroke-width="6" opacity="0.2"/>
    <path d="M256 100 L340 340 L296 340 L274 274 L238 274 L216 340 L172 340 Z" fill="url(#amber2)"/>
    <rect x="220" y="240" width="72" height="18" rx="4" fill="#030712"/>
    <circle cx="256" cy="160" r="12" fill="#fef3c7" opacity="0.9"/>
  </g>
</svg>`;

async function generate() {
  // Ensure icons directory exists
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  const svgBuffer = Buffer.from(ICON_SVG);
  const maskableBuffer = Buffer.from(MASKABLE_SVG);

  // Generate standard icons
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(ICONS_DIR, "icon-192x192.png"));
  console.log("✅ icon-192x192.png");

  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(ICONS_DIR, "icon-512x512.png"));
  console.log("✅ icon-512x512.png");

  // Generate maskable icons
  await sharp(maskableBuffer).resize(192, 192).png().toFile(path.join(ICONS_DIR, "icon-maskable-192x192.png"));
  console.log("✅ icon-maskable-192x192.png");

  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(ICONS_DIR, "icon-maskable-512x512.png"));
  console.log("✅ icon-maskable-512x512.png");

  // Apple touch icon (180x180)
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(PUBLIC, "apple-touch-icon.png"));
  console.log("✅ apple-touch-icon.png");

  // Favicon (32x32 PNG, served as favicon.ico)
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(PUBLIC, "favicon.ico"));
  console.log("✅ favicon.ico");

  // Also a 16x16 for older browsers
  await sharp(svgBuffer).resize(16, 16).png().toFile(path.join(ICONS_DIR, "icon-16x16.png"));
  console.log("✅ icon-16x16.png");

  // 32x32
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(ICONS_DIR, "icon-32x32.png"));
  console.log("✅ icon-32x32.png");

  console.log("\n🎉 All PWA icons generated!");
}

generate().catch(console.error);
