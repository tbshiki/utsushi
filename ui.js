/**
 * utsushi - UI Controller
 * 差分表示とUI制御
 */

const UI = (function () {
  'use strict';

  // DOM キャッシュ
  let elements = {};

  /**
   * 初期化
   */
  function init() {
    cacheElements();
    setupEventListeners();
    setupSyncScroll();
  }

  /**
   * DOM 要素をキャッシュ
   */
  function cacheElements() {
    elements = {
      textA: document.getElementById('text-a'),
      textB: document.getElementById('text-b'),
      textC: document.getElementById('text-c'),
      btnCompare: document.getElementById('btn-compare'),
      btnClearAll: document.getElementById('btn-clear-all'),
      resultsSection: document.getElementById('results-section'),
      diffAB: document.getElementById('diff-ab'),
      diffAC: document.getElementById('diff-ac'),
      diffABLeft: document.getElementById('diff-ab-left'),
      diffABRight: document.getElementById('diff-ab-right'),
      diffACLeft: document.getElementById('diff-ac-left'),
      diffACRight: document.getElementById('diff-ac-right'),
      statsAB: document.getElementById('stats-ab'),
      statsAC: document.getElementById('stats-ac'),
      charCounts: {
        a: document.querySelector('[data-count="a"]'),
        b: document.querySelector('[data-count="b"]'),
        c: document.querySelector('[data-count="c"]')
      },
      clearButtons: document.querySelectorAll('.btn-clear')
    };
  }

  /**
   * イベントリスナー設定
   */
  function setupEventListeners() {
    // 比較ボタン
    elements.btnCompare.addEventListener('click', handleCompare);

    // 全クリアボタン
    elements.btnClearAll.addEventListener('click', handleClearAll);

    // 個別クリアボタン
    elements.clearButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.dataset.target;
        handleClear(target);
      });
    });

    // 文字カウント
    ['textA', 'textB', 'textC'].forEach(key => {
      elements[key].addEventListener('input', (e) => {
        updateCharCount(key.replace('text', '').toLowerCase(), e.target.value);
      });
    });

    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
      // Ctrl + Enter で比較
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleCompare();
      }
    });
  }

  /**
   * 同期スクロール設定
   */
  function setupSyncScroll() {
    const pairs = [
      ['diff-ab-left', 'diff-ab-right'],
      ['diff-ac-left', 'diff-ac-right']
    ];

    pairs.forEach(([leftId, rightId]) => {
      const left = document.getElementById(leftId);
      const right = document.getElementById(rightId);

      if (left && right) {
        let isScrolling = false;

        left.addEventListener('scroll', () => {
          if (!isScrolling) {
            isScrolling = true;
            right.scrollTop = left.scrollTop;
            requestAnimationFrame(() => { isScrolling = false; });
          }
        });

        right.addEventListener('scroll', () => {
          if (!isScrolling) {
            isScrolling = true;
            left.scrollTop = right.scrollTop;
            requestAnimationFrame(() => { isScrolling = false; });
          }
        });
      }
    });
  }

  /**
   * 比較実行
   */
  function handleCompare() {
    const textA = elements.textA.value;
    const textB = elements.textB.value;
    const textC = elements.textC.value;

    // 最低限 A と B が必要
    if (!textA.trim()) {
      showError('基準テキスト（Text A）を入力してください');
      elements.textA.focus();
      return;
    }

    if (!textB.trim() && !textC.trim()) {
      showError('比較するテキスト（Text B または C）を入力してください');
      elements.textB.focus();
      return;
    }

    // 結果表示エリアを表示
    elements.resultsSection.classList.remove('hidden');

    // A vs B の比較
    if (textB.trim()) {
      const resultAB = DiffEngine.compareLines(textA, textB);
      renderDiff('ab', resultAB);
      elements.diffAB.classList.remove('hidden');
    } else {
      elements.diffAB.classList.add('hidden');
    }

    // A vs C の比較
    if (textC.trim()) {
      const resultAC = DiffEngine.compareLines(textA, textC);
      renderDiff('ac', resultAC);
      elements.diffAC.classList.remove('hidden');
    } else {
      elements.diffAC.classList.add('hidden');
    }

    // 結果エリアにスクロール
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * 差分をレンダリング
   * @param {string} pairId - 'ab' または 'ac'
   * @param {Object} result - 差分結果
   */
  function renderDiff(pairId, result) {
    const leftContainer = document.getElementById(`diff-${pairId}-left`);
    const rightContainer = document.getElementById(`diff-${pairId}-right`);
    const statsContainer = document.getElementById(`stats-${pairId}`);

    // 統計情報を表示
    statsContainer.innerHTML = `
            <span class="stat added">+${result.stats.added}</span>
            <span class="stat removed">-${result.stats.removed}</span>
        `;

    // 左側（基準テキスト）をレンダリング
    leftContainer.innerHTML = renderLines(result.left);

    // 右側（比較テキスト）をレンダリング
    rightContainer.innerHTML = renderLines(result.right);
  }

  /**
   * 行をHTML化
   * @param {Array} lines - 行情報の配列
   * @returns {string} HTML文字列
   */
  function renderLines(lines) {
    if (lines.length === 0) {
      return '<div class="diff-empty">テキストがありません</div>';
    }

    return lines.map(line => {
      const typeClass = getLineClass(line.type);
      const lineNumDisplay = line.lineNum !== null ? line.lineNum : '';
      const content = escapeHtml(line.content);

      return `
                <div class="diff-line ${typeClass}">
                    <span class="line-number">${lineNumDisplay}</span>
                    <span class="line-content">${content || '&nbsp;'}</span>
                </div>
            `;
    }).join('');
  }

  /**
   * 行タイプからCSSクラスを取得
   * @param {string} type
   * @returns {string}
   */
  function getLineClass(type) {
    switch (type) {
      case 'added': return 'added';
      case 'removed': return 'removed';
      case 'changed': return 'changed';
      case 'empty': return 'empty';
      default: return '';
    }
  }

  /**
   * HTMLエスケープ
   * @param {string} text
   * @returns {string}
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 文字カウント更新
   * @param {string} target - 'a', 'b', 'c'
   * @param {string} value
   */
  function updateCharCount(target, value) {
    const count = value.length;
    const lines = value.split('\n').length;
    elements.charCounts[target].textContent = `${count} 文字 / ${lines} 行`;
  }

  /**
   * 個別クリア
   * @param {string} target - 'a', 'b', 'c'
   */
  function handleClear(target) {
    const key = `text${target.toUpperCase()}`;
    if (elements[key]) {
      elements[key].value = '';
      updateCharCount(target, '');
    }
  }

  /**
   * 全クリア
   */
  function handleClearAll() {
    ['a', 'b', 'c'].forEach(target => {
      handleClear(target);
    });
    elements.resultsSection.classList.add('hidden');
  }

  /**
   * エラー表示（簡易版）
   * @param {string} message
   */
  function showError(message) {
    // シンプルなアラート（将来的にはトースト通知に）
    alert(message);
  }

  /**
   * 成功表示（簡易版）
   * @param {string} message
   */
  function showSuccess(message) {
    console.log('✓', message);
  }

  // Public API
  return {
    init,
    handleCompare,
    handleClearAll,
    showError,
    showSuccess
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UI;
}
