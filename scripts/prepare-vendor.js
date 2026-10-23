#!/usr/bin/env node
// Downloads the CodeBuddy CLI into vendor/codebuddy-code for local development.
// In CI this runs before electron-builder; locally run `npm run prepare`.
//
// The version is pinned in package.json ("codebuddyCliVersion") so a build is
// reproducible. Override with CLI_VERSION=x.y.z, or CLI_VERSION=latest.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const vendor = path.join(root, 'vendor', 'codebuddy-code');
const want =
  process.env.CLI_VERSION || require(path.join(root, 'package.json')).codebuddyCliVersion || 'latest';

function vendorVersion() {
  try {
    return JSON.parse(fs.readFileSync(path.join(vendor, 'package.json'), 'utf8')).version;
  } catch (_) {
    return null;
  }
}

if (fs.existsSync(path.join(vendor, 'bin', 'codebuddy'))) {
  const have = vendorVersion();
  if (want === 'latest' || have === want) {
    console.log(`✓ vendor/codebuddy-code ${have} already present, skipping`);
    process.exit(0);
  }
  console.log(`↻ vendor has ${have}, want ${want} — reinstalling`);
  fs.rmSync(vendor, { recursive: true, force: true });
}

fs.mkdirSync(path.join(root, 'vendor'), { recursive: true });
const tmp = path.join(root, 'vendor', '.tmp');
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`⬇ Downloading @tencent-ai/codebuddy-code@${want} ...`);
execSync(
  `npm install --prefix "${tmp}" "@tencent-ai/codebuddy-code@${want}" --no-save --ignore-scripts`,
  { stdio: 'inherit', cwd: root, timeout: 300000 }
);

const src = path.join(tmp, 'node_modules', '@tencent-ai', 'codebuddy-code');
if (!fs.existsSync(path.join(src, 'bin', 'codebuddy'))) {
  console.error('✗ Download failed: bin/codebuddy not found');
  process.exit(1);
}

fs.renameSync(src, vendor);
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`✓ vendor/codebuddy-code ${vendorVersion()} ready`);
