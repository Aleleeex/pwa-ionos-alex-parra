// Script to generate PNG icons from SVG using sharp
// Run: node scripts/generate-icons.mjs
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const iconsDir = join(projectRoot, 'public', 'icons');

if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
}

// Dynamic import of sharp (installed as dev dep)
const sharp = (await import('sharp')).default;

const svgPath = join(iconsDir, 'icon.svg');
const svgBuffer = readFileSync(svgPath);

const sizes = [192, 512];

for (const size of sizes) {
    const outPath = join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outPath);
    console.log(`Generated: icon-${size}x${size}.png`);
}

console.log('Icons generated successfully!');
