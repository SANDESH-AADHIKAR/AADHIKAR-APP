const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// SVG source path inside assets/icons/
const svgPath = path.join(__dirname, "assets", "icons", "logo.svg");
const svgBuffer = fs.readFileSync(svgPath);

const targets = [
  // Icons directory (inside assets/icons/)
  { out: "assets/icons/logo.png", width: 48, height: 48 },
  { out: "assets/icons/logo@2x.png", width: 96, height: 96 },
  { out: "assets/icons/logo@4x.png", width: 192, height: 192 },

  // Expo / app assets (inside assets/images/)
  { out: "assets/images/icon.png", width: 1024, height: 1024 },
  { out: "assets/images/adaptive-icon.png", width: 1024, height: 1024 },
  { out: "assets/images/splash-icon.png", width: 200, height: 200 },
  { out: "assets/images/favicon.png", width: 48, height: 48 },
];

async function generate() {
  for (const { out, width, height } of targets) {
    const dest = path.join(__dirname, out);
    await sharp(svgBuffer).resize(width, height).png().toFile(dest);
    console.log(`✓ Generated: ${out} (${width}x${height})`);
  }
}

generate().catch(console.error);
