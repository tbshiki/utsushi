/**
 * utsushi - Main Entry Point
 * アプリケーション初期化
 */

(function () {
  'use strict';

  /**
   * アプリケーション初期化
   */
  async function initApp() {
    console.log('🔍 utsushi v0.2.4 - Text Diff Tool');
    console.log('🔒 完全ローカル処理 - サーバー通信なし');

    // UI 初期化（非同期）
    if (typeof UI !== 'undefined') {
      await UI.init();
      console.log('✓ UI initialized');
    } else {
      console.error('✗ UI module not found');
    }

    // DiffEngine 確認
    if (typeof DiffEngine !== 'undefined') {
      console.log('✓ DiffEngine ready');
    } else {
      console.error('✗ DiffEngine module not found');
    }

    // jsdiff 確認
    if (typeof Diff !== 'undefined') {
      console.log('✓ jsdiff library loaded');
    } else {
      console.error('✗ jsdiff library not found');
    }
  }

  // DOM 読み込み完了後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
