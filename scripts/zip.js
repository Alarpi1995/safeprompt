#!/usr/bin/env node

/**
 * SafePrompt Zip Script
 * Creates .zip files for each browser build.
 * Usage:
 *   node scripts/zip.js          # Zip all browsers
 *   node scripts/zip.js chrome   # Chrome only
 *   node scripts/zip.js firefox  # Firefox only
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST_BASE = path.join(ROOT, 'dist');

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const version = manifest.version;

function zipBrowser(browserKey) {
  const dist = path.join(DIST_BASE, browserKey);

  if (!fs.existsSync(dist)) {
    console.log(`dist/${browserKey}/ not found, running build first...`);
    execSync(`node scripts/build.js ${browserKey}`, { cwd: ROOT, stdio: 'inherit' });
  }

  const zipName = `safeprompt-v${version}-${browserKey}.zip`;
  const zipPath = path.join(ROOT, zipName);

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  try {
    execSync(`cd "${dist}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
    const stats = fs.statSync(zipPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`Created: ${zipName} (${sizeKB} KB)`);
  } catch (e) {
    execSync(`cd "${dist}" && tar -czf "${zipPath.replace('.zip', '.tar.gz')}" .`, { stdio: 'inherit' });
    console.log(`Created: ${zipName.replace('.zip', '.tar.gz')}`);
  }
}

const target = process.argv[2]?.toLowerCase();

if (target === 'chrome' || target === 'firefox') {
  zipBrowser(target);
} else {
  console.log('Creating packages for all browsers...\n');
  zipBrowser('chrome');
  zipBrowser('firefox');
  console.log('\nEdge: Use the Chrome package for Microsoft Edge Add-ons.');
  console.log('All packages ready for store submission!');
}
