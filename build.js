/* ============================================
   SAFEPATH — Build Script
   ============================================
   Copies src/ into public/src/ for deployment.
   Firebase Hosting serves from public/.
   ============================================ */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const DEST = path.join(__dirname, 'public', 'src');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean previous build
if (fs.existsSync(DEST)) {
  fs.rmSync(DEST, { recursive: true });
}

copyDir(SRC, DEST);
console.log('✅ Copied src/ → public/src/');
