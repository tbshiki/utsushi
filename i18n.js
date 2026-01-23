/**
 * utsushi - Internationalization (i18n) Module
 * 日本語/英語の多言語対応
 * 翻訳データは locales/*.json から読み込み
 */

const I18n = (function () {
  'use strict';

  // 対応言語
  const SUPPORTED_LANGS = ['ja', 'en'];
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'utsushi-lang';

  // 現在の言語
  let currentLang = DEFAULT_LANG;

  // 言語データ（外部ファイルから読み込み）
  let translations = {};

  // 読み込み完了フラグ
  let isLoaded = false;

  /**
   * 翻訳ファイルを読み込み
   */
  async function loadTranslations() {
    try {
      const [jaResponse, enResponse] = await Promise.all([
        fetch('locales/ja.json'),
        fetch('locales/en.json')
      ]);

      if (!jaResponse.ok || !enResponse.ok) {
        throw new Error('Failed to load translation files');
      }

      translations = {
        ja: await jaResponse.json(),
        en: await enResponse.json()
      };

      isLoaded = true;
      return true;
    } catch (error) {
      console.error('Failed to load translations:', error);
      // フォールバック: 最小限の翻訳データ
      translations = {
        ja: { 'title': 'utsushi - テキスト差分比較ツール' },
        en: { 'title': 'utsushi - Text Diff Tool' }
      };
      isLoaded = true;
      return false;
    }
  }

  /**
   * 初期化
   */
  async function init() {
    // 翻訳ファイルを読み込み
    await loadTranslations();

    // 保存された言語設定を読み込み
    const savedLang = localStorage.getItem(STORAGE_KEY);
    if (savedLang && SUPPORTED_LANGS.includes(savedLang)) {
      currentLang = savedLang;
    } else {
      // ブラウザの言語設定から判定
      const browserLang = navigator.language.split('-')[0];
      currentLang = SUPPORTED_LANGS.includes(browserLang) ? browserLang : DEFAULT_LANG;
    }

    // 初回適用
    applyLanguage();
  }

  /**
   * 言語を取得
   */
  function getLang() {
    return currentLang;
  }

  /**
   * 言語を設定
   */
  function setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) {
      console.warn(`I18n: Unsupported language: ${lang}`);
      return;
    }
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyLanguage();
  }

  /**
   * 言語を切り替え
   */
  function toggleLang() {
    const nextLang = currentLang === 'ja' ? 'en' : 'ja';
    setLang(nextLang);
  }

  /**
   * 翻訳テキストを取得
   */
  function t(key, params = {}) {
    let text = translations[currentLang]?.[key] || translations[DEFAULT_LANG]?.[key] || key;

    // パラメータ置換（グローバル置換に対応）
    Object.keys(params).forEach(param => {
      text = text.replaceAll(`{${param}}`, params[param]);
    });

    return text;
  }

  /**
   * 言語を適用
   */
  function applyLanguage() {
    if (!isLoaded) {
      console.warn('I18n: translations not loaded yet');
      return;
    }

    // html lang 属性を更新
    document.documentElement.lang = currentLang;

    // data-i18n 属性を持つ要素を更新
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const text = t(key);
      // data-i18n-attr はキャメルケースで i18nAttr になる
      if (el.dataset.i18nAttr) {
        // 属性値として設定
        el.setAttribute(el.dataset.i18nAttr, text);
      } else if (el.dataset.i18nHtml) {
        // HTML として設定
        el.innerHTML = text;
      } else {
        // テキストコンテンツとして設定（子要素がない場合のみ）
        // 子要素を持つ場合はスキップ
        if (el.children.length === 0) {
          el.textContent = text;
        }
      }

      // aria-label の更新（data-i18n-aria 属性がある場合）
      if (el.dataset.i18nAria) {
        const ariaKey = el.dataset.i18nAria;
        el.setAttribute('aria-label', t(ariaKey));
      }
    });

    // title 要素を更新
    document.title = t('title');

    // 言語ボタンの表示を更新
    const langBtn = document.getElementById('btn-lang-toggle');
    if (langBtn) {
      const langIcon = langBtn.querySelector('.lang-icon');
      if (langIcon) {
        langIcon.textContent = currentLang === 'ja' ? 'EN' : 'JA';
      }
    }

    // カスタムイベントを発火
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
  }

  /**
   * パネル名を取得
   */
  function getPanelName(panelId) {
    return t(`panel.${panelId}`);
  }

  /**
   * 読み込み完了を確認
   */
  function isReady() {
    return isLoaded;
  }

  // Public API
  return {
    init,
    getLang,
    setLang,
    toggleLang,
    t,
    getPanelName,
    applyLanguage,
    isReady
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18n;
}
