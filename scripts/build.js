#!/usr/bin/env node

/**
 * SafePrompt Build Script
 * Builds extension packages for Chrome, Firefox, and Edge.
 * Usage:
 *   node scripts/build.js          # Build all browsers
 *   node scripts/build.js chrome   # Chrome only
 *   node scripts/build.js firefox  # Firefox only
 *   node scripts/build.js edge     # Edge only
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST_BASE = path.join(ROOT, 'dist');

const INCLUDE = [
  'src/',
  'LICENSE',
  'PRIVACY_POLICY.md',
];

const EXCLUDE_PATTERNS = [
  'node_modules', 'tests', 'scripts', '.github', '.git',
  'package.json', 'package-lock.json', 'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md', 'SECURITY.md', 'TRADEMARK.md',
  'README.md', 'PROJECT_PLAN.md', 'COMPETITOR_ANALYSIS.md',
  '.gitignore', '.eslintrc',
];

const BROWSERS = {
  chrome: {
    manifest: 'manifest.json',
    label: 'Chrome / Edge',
  },
  firefox: {
    manifest: 'manifest.firefox.json',
    label: 'Firefox',
  },
  edge: {
    manifest: 'manifest.json', // Edge uses the same Chrome manifest
    label: 'Edge (Chromium)',
  },
};

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
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

function countFiles(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count += countFiles(path.join(dir, entry.name));
    else count++;
  }
  return count;
}

function buildBrowser(browserKey) {
  const config = BROWSERS[browserKey];
  if (!config) {
    console.error(`Unknown browser: ${browserKey}`);
    return;
  }

  const dist = path.join(DIST_BASE, browserKey);
  console.log(`\n--- Building for ${config.label} ---`);

  cleanDir(dist);

  // Copy manifest
  const manifestSrc = path.join(ROOT, config.manifest);
  if (!fs.existsSync(manifestSrc)) {
    console.error(`  ERROR: ${config.manifest} not found`);
    return;
  }

  // For Firefox, rename manifest.firefox.json to manifest.json in output
  const manifestDest = path.join(dist, 'manifest.json');
  fs.copyFileSync(manifestSrc, manifestDest);
  console.log(`  COPY: ${config.manifest} → manifest.json`);

  // Copy included files
  for (const item of INCLUDE) {
    const srcPath = path.join(ROOT, item);
    const destPath = path.join(dist, item);

    if (!fs.existsSync(srcPath)) {
      console.warn(`  SKIP: ${item} (not found)`);
      continue;
    }

    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
      console.log(`  COPY: ${item} (directory)`);
    } else {
      copyFile(srcPath, destPath);
      console.log(`  COPY: ${item}`);
    }
  }

  // For Firefox: patch background script to use scripts array format
  if (browserKey === 'firefox') {
    patchFirefoxBackground(dist);
  }

  const count = countFiles(dist);
  console.log(`  Done: ${count} files in dist/${browserKey}/`);
}

function patchFirefoxBackground(dist) {
  // Firefox MV3 uses background.scripts instead of service_worker
  // The manifest.firefox.json already handles this
  const bgPath = path.join(dist, 'src', 'background.js');
  if (fs.existsSync(bgPath)) {
    let bg = fs.readFileSync(bgPath, 'utf8');
    // Replace chrome.* with globalThis.SafePromptBrowser.* where needed
    // But keep it simple - the browser-compat.js polyfill handles the heavy lifting
    // Just add a Firefox-compatible wrapper at the top
    const patch = `// Firefox compatibility: use SafePromptBrowser if available
const _api = (typeof SafePromptBrowser !== 'undefined') ? SafePromptBrowser : (typeof chrome !== 'undefined' ? chrome : browser);

`;
    if (!bg.includes('SafePromptBrowser')) {
      fs.writeFileSync(bgPath, patch + bg, 'utf8');
      console.log('  PATCH: background.js (Firefox compat)');
    }
  }
}

function build() {
  const target = process.argv[2]?.toLowerCase();

  if (target && BROWSERS[target]) {
    buildBrowser(target);
  } else if (target === 'all' || !target) {
    console.log('Building SafePrompt for all browsers...');
    buildBrowser('chrome');
    buildBrowser('firefox');
    // Edge uses the same build as Chrome
    console.log('\n--- Edge ---');
    console.log('  Edge uses the Chrome build (same Chromium engine).');
    console.log('  Upload dist/chrome/ to Microsoft Edge Add-ons.');
  } else {
    console.error(`Unknown target: ${target}`);
    console.log('Usage: node scripts/build.js [chrome|firefox|edge|all]');
    process.exit(1);
  }

  console.log('\nBuild complete!');
}

build();
