/**
 * Analytics スクリプト挿入ツール
 *
 * デプロイ時に環境変数からトラッキングIDを読み取り、
 * index.html に Google Analytics / Microsoft Clarity のコードを挿入します。
 *
 * 環境変数:
 *   GA_MEASUREMENT_ID  - Google Analytics 測定ID (例: G-XXXXXXXXXX)
 *   CLARITY_PROJECT_ID - Microsoft Clarity プロジェクトID
 *
 * 使用方法:
 *   node scripts/inject-analytics.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const INDEX_PATH = path.join(__dirname, '..', 'index.html');
const PLACEHOLDER = '<!-- __ANALYTICS_SCRIPTS__ -->';
const NONCE_PLACEHOLDER = '__CSP_NONCE__';

// 環境変数からIDを取得
const GA_ID = process.env.GA_MEASUREMENT_ID || '';
const CLARITY_ID = process.env.CLARITY_PROJECT_ID || '';

/**
 * Google Analytics スクリプトを生成
 */
function generateGAScript(measurementId, nonce) {
  if (!measurementId) return '';
  return `
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
    <script nonce="${nonce}">
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}');
    </script>`;
}

/**
 * Microsoft Clarity スクリプトを生成
 */
function generateClarityScript(projectId, nonce) {
  if (!projectId) return '';
  return `
    <!-- Microsoft Clarity -->
    <script nonce="${nonce}">
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${projectId}");
    </script>`;
}

function main() {
  console.log('📊 Analytics injection script started');
  console.log(`   GA_MEASUREMENT_ID: ${GA_ID ? '✓ Set' : '✗ Not set'}`);
  console.log(`   CLARITY_PROJECT_ID: ${CLARITY_ID ? '✓ Set' : '✗ Not set'}`);
  const nonce = crypto.randomBytes(16).toString('base64');
  console.log(`   CSP nonce: ${nonce}`);

  // index.html を読み込み
  let html = fs.readFileSync(INDEX_PATH, 'utf-8');

  // プレースホルダーが存在するか確認
  const hasPlaceholder = html.includes(PLACEHOLDER);
  if (!hasPlaceholder) {
    console.log('⚠️  Placeholder not found. Analytics scripts may already be injected.');
  }

  if (hasPlaceholder) {
    // Analytics スクリプトを生成
    const scripts = [
      generateGAScript(GA_ID, nonce),
      generateClarityScript(CLARITY_ID, nonce)
    ].filter(Boolean).join('\n');

    if (!scripts) {
      console.log('ℹ️  No analytics IDs provided. Removing placeholder.');
      html = html.replace(PLACEHOLDER, '');
    } else {
      html = html.replace(PLACEHOLDER, scripts);
      console.log('✅ Analytics scripts injected successfully!');
    }
  }

  if (html.includes(NONCE_PLACEHOLDER)) {
    html = html.split(NONCE_PLACEHOLDER).join(nonce);
  } else {
    console.log('⚠️  CSP nonce placeholder not found. CSP may block inline scripts.');
  }

  // ファイルを書き出し
  fs.writeFileSync(INDEX_PATH, html, 'utf-8');
  console.log('📝 index.html updated.');
}

main();
