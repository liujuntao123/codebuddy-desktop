#!/usr/bin/env node
// Downloads the CodeBuddy CLI into vendor/codebuddy-code for local development.
// In CI this runs before electron-builder; locally run `npm run prepare`.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const vendor = path.join(root, 'vendor', 'codebuddy-code');

if (fs.existsSync(path.join(vendor, 'bin', 'codebuddy'))) {
  console.log('✓ vendor/codebuddy-code already exists, skipping');
  process.exit(0);
}

fs.mkdirSync(path.join(root, 'vendor'), { recursive: true });
const tmp = path.join(root, 'vendor', '.tmp');
fs.rmSync(tmp, { recursive: true, force: true });

console.log('⬇ Downloading @tencent-ai/codebuddy-code (latest) ...');
execSync(
  `npm install --prefix "${tmp}" @tencent-ai/codebuddy-code --no-save --ignore-scripts`,
  { stdio: 'inherit', cwd: root, timeout: 300000 }
);

const src = path.join(tmp, 'node_modules', '@tencent-ai', 'codebuddy-code');
if (!fs.existsSync(path.join(src, 'bin', 'codebuddy'))) {
  console.error('✗ Download failed: bin/codebuddy not found');
  process.exit(1);
}

fs.renameSync(src, vendor);
fs.rmSync(tmp, { recursive: true, force: true });

const sizeMB = (execSync(
  `powershell -NoProfile -Command "(Get-ChildItem '${vendor}' -Recurse -File | Measure-Object Length -Sum).Sum / 1MB"`,
  { encoding: 'utf8' }
) / 1).toFixed(0);

console.log(`✓ vendor/codebuddy-code ready (~${sizeMB} MB)`);
