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

function buildAnalyticsSnippet(gaId, clarityId) {
  const snippets = [];

  if (gaId) {
    snippets.push(
      `<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>`
    );
    snippets.push(
      `<script nonce="__CSP_NONCE__">` +
        `window.dataLayer=window.dataLayer||[];` +
        `function gtag(){dataLayer.push(arguments);}` +
        `gtag('js', new Date());` +
        `gtag('config','${gaId}',{'anonymize_ip':true});` +
      `</script>`
    );
  }

  if (clarityId) {
    snippets.push(
      `<script nonce="__CSP_NONCE__">` +
        `(function(c,l,a,r,i,t,y){` +
          `c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};` +
          `t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;` +
          `y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);` +
        `})(window,document,"clarity","script","${clarityId}");` +
      `</script>`
    );
  }

  if (snippets.length === 0) {
    return '';
  }

  return `\n    <!-- Analytics injected at build time -->\n    ${snippets.join('\n    ')}\n`;
}

function buildIndexHtml() {
  const srcPath = path.join(ROOT_DIR, 'index.html');
  const destPath = path.join(DIST_DIR, 'index.html');
  const gaId = (process.env.GA_ID || '').trim();
  const clarityId = (process.env.CLARITY_ID || '').trim();
  let html = fs.readFileSync(srcPath, 'utf-8');

  const analyticsSnippet = buildAnalyticsSnippet(gaId, clarityId);
  if (analyticsSnippet) {
    if (!html.includes('</head>')) {
      throw new Error('index.html is missing </head> for analytics injection.');
    }
    html = html.replace('</head>', `${analyticsSnippet}</head>`);
    console.log('📈 Analytics injected (GA/Clarity).');
  } else {
    console.log('📈 Analytics not configured (GA_ID/CLARITY_ID not set).');
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, html, 'utf-8');
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

  buildIndexHtml();

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
