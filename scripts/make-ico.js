// Generates build/icon.ico from build/icon-256.png (wraps PNG into ICO container).
// Run once: node scripts/make-ico.js
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'build');
const png256 = fs.readFileSync(path.join(dir, 'icon-256.png'));

function writeIco(target, pngBuf, width, height) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);  // type: icon
  header.writeUInt16LE(1, 4);  // 1 image
  const entry = Buffer.alloc(16);
  entry[0] = width >= 256 ? 0 : width;
  entry[1] = height >= 256 ? 0 : height;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4);       // color planes
  entry.writeUInt16LE(32, 6);      // bits per pixel
  entry.writeUInt32LE(pngBuf.length, 8);
  entry.writeUInt32LE(22, 12);     // data offset (6 + 16)
  const ico = Buffer.concat([header, entry, pngBuf]);
  fs.writeFileSync(target, ico);
}

writeIco(path.join(dir, 'icon.ico'), png256, 256, 256);

// main icon.png also needs to be >=256 for electron-builder
fs.copyFileSync(path.join(dir, 'icon-256.png'), path.join(dir, 'icon.png'));

console.log('✓ build/icon.ico (256x256) and build/icon.png regenerated');
