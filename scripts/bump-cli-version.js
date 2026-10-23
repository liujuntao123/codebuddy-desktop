#!/usr/bin/env node
// Bumps the bundled CLI version: updates package.json (app version + pinned CLI
// version) and prepends a CHANGELOG section. Used by the auto-update workflow.
//
//   node scripts/bump-cli-version.js <cli-version>
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const changelogPath = path.join(root, 'CHANGELOG.md');

const next = process.argv[2];
if (!next || !/^\d+\.\d+\.\d+/.test(next)) {
  console.error('usage: bump-cli-version.js <x.y.z>');
  process.exit(2);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const current = pkg.codebuddyCliVersion;
if (current === next) {
  console.log(`✓ bundled CLI already at ${next}`);
  process.exit(0);
}

const [major, minor, patch] = pkg.version.split('.').map(Number);
pkg.version = `${major}.${minor}.${patch + 1}`;
pkg.codebuddyCliVersion = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

const today = new Date().toISOString().slice(0, 10);
const section = [
  `## [${pkg.version}] - ${today}`,
  '',
  '### Changed',
  `- Bundled CodeBuddy CLI updated to \`${next}\``,
  '',
  '',
].join('\n');

const changelog = fs.readFileSync(changelogPath, 'utf8');
// Keep an "## [Unreleased]" section on top if the project uses one.
const unreleased = changelog.indexOf('## [Unreleased]');
const from = unreleased === -1 ? 0 : unreleased + 1;
const nextSection = changelog.slice(from).search(/^## \[/m);
const at = nextSection === -1 ? changelog.length : from + nextSection;
fs.writeFileSync(changelogPath, changelog.slice(0, at) + section + changelog.slice(at), 'utf8');

console.log(`✓ ${current} → ${next}; app version ${pkg.version}`);
