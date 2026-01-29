/**
 * Build script for Cloudflare Pages.
 * Copies only required assets into dist/.
 * CSP nonce replacement is handled at runtime by middleware unless opted in.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const CSP_NONCE_MODE = process.env.CSP_NONCE_MODE || 'dynamic';

const FILES_TO_COPY = [
  'index.html',
  'style.css',
  'main.js',
  'ui.js',
  'diff-engine.js',
  'i18n.js',
  'manifest.json',
  'logo.png',
  '_headers',
  'robots.txt',
  'sitemap.xml'
];

const DIRS_TO_COPY = [
  'locales'
];

function ensureCleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(srcPath, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      copyFile(srcPath, destPath);
    }
  }
}

function runCspNonceReplacement() {
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, 'replace-csp-nonce.js')],
    {
      stdio: 'inherit',
      env: { ...process.env, OUTPUT_DIR: DIST_DIR }
    }
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function main() {
  console.log('📦 Build started');
  ensureCleanDir(DIST_DIR);

  for (const file of FILES_TO_COPY) {
    const src = path.join(ROOT_DIR, file);
    const dest = path.join(DIST_DIR, file);
    copyFile(src, dest);
  }

  for (const dir of DIRS_TO_COPY) {
    const src = path.join(ROOT_DIR, dir);
    const dest = path.join(DIST_DIR, dir);
    copyDir(src, dest);
  }

  if (CSP_NONCE_MODE === 'static') {
    runCspNonceReplacement();
  } else {
    console.log('🔐 CSP nonce replacement skipped (dynamic middleware mode).');
  }
  console.log('✅ Build completed');
}

main();
