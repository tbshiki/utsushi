/**
 * CSP nonce replacement tool
 *
 * デプロイ時に index.html と _headers 内の __CSP_NONCE__ を置換します。
 *
 * 使用方法:
 *   node scripts/replace-csp-nonce.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_INDEX_PATH = path.join(__dirname, '..', 'index.html');
const DEFAULT_HEADERS_PATH = path.join(__dirname, '..', '_headers');
const NONCE_PLACEHOLDER = '__CSP_NONCE__';

const OUTPUT_DIR = process.env.OUTPUT_DIR || '';
const INDEX_ENV_PATH = process.env.INDEX_PATH || '';

function resolveIndexPath() {
  if (INDEX_ENV_PATH) {
    return path.resolve(process.cwd(), INDEX_ENV_PATH);
  }
  if (OUTPUT_DIR) {
    return path.resolve(process.cwd(), OUTPUT_DIR, 'index.html');
  }
  return DEFAULT_INDEX_PATH;
}

function resolveHeadersPath() {
  if (OUTPUT_DIR) {
    return path.resolve(process.cwd(), OUTPUT_DIR, '_headers');
  }
  return DEFAULT_HEADERS_PATH;
}

function replaceNonceInFile(filePath, nonce, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`✗ ${label} not found.`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  if (!content.includes(NONCE_PLACEHOLDER)) {
    console.error(`✗ CSP nonce placeholder not found in ${label}.`);
    return false;
  }

  content = content.split(NONCE_PLACEHOLDER).join(nonce);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`📝 ${label} updated.`);
  return true;
}

function main() {
  console.log('🔐 CSP nonce replacement started');
  const nonce = crypto.randomBytes(16).toString('base64');
  console.log(`   CSP nonce: ${nonce}`);

  const indexPath = resolveIndexPath();
  const headersPath = resolveHeadersPath();
  console.log(`   Target index.html: ${indexPath}`);
  console.log(`   Target _headers: ${headersPath}`);

  const indexOk = replaceNonceInFile(indexPath, nonce, 'index.html');
  const headersOk = replaceNonceInFile(headersPath, nonce, '_headers');
  if (!indexOk || !headersOk) {
    console.error('✗ CSP nonce replacement failed.');
    process.exit(1);
  }
}

main();
