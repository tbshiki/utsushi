/**
 * utsushi - UI Controller
 * 差分表示とUI制御（イロハニ対応・動的パネル）
 */

const UI = (function () {
  'use strict';

  // パネル設定
  const PANELS = [
    { id: 'i', name: 'イ', isBase: true },
    { id: 'ro', name: 'ロ', isBase: false },
    { id: 'ha', name: 'ハ', isBase: false },
    { id: 'ni', name: 'ニ', isBase: false }
  ];

  // 現在表示中のパネル数
  const MAX_PANELS = 4;

  // DOM キャッシュ
  let elements = {};

  /**
   * 初期化
   */
  function init() {
    cacheElements();
    setupTheme();
    setupEventListeners();
    updatePanelLayout();
  }

  /**
   * DOM 要素をキャッシュ
   */
  function cacheElements() {
    elements = {
      inputPanels: document.getElementById('input-panels'),
      addPanelContainer: document.getElementById('add-panel-container'),
      btnAddPanel: document.getElementById('btn-add-panel'),
      btnCompare: document.getElementById('btn-compare'),
      btnClearAll: document.getElementById('btn-clear-all'),
      resultsSection: document.getElementById('results-section'),
      diffContainer: document.getElementById('diff-container'),
      btnPrivacyToggle: document.getElementById('btn-privacy-toggle'),
      privacyDetails: document.getElementById('privacy-details'),
      btnThemeToggle: document.getElementById('btn-theme-toggle'),
      toastContainer: document.getElementById('toast-container'),
      // Privacy Policy Modal
      btnPrivacyPolicy: document.getElementById('btn-privacy-policy'),
      privacyModal: document.getElementById('privacy-modal'),
      btnModalClose: document.getElementById('btn-modal-close')
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

    // パネル追加ボタン
    elements.btnAddPanel.addEventListener('click', handleAddPanel);

    // プライバシー折りたたみボタン
    if (elements.btnPrivacyToggle) {
      elements.btnPrivacyToggle.addEventListener('click', handlePrivacyToggle);
    }

    // テーマ切り替えボタン
    if (elements.btnThemeToggle) {
      elements.btnThemeToggle.addEventListener('click', handleThemeToggle);
    }

    // プライバシーポリシーモーダル
    if (elements.btnPrivacyPolicy) {
      elements.btnPrivacyPolicy.addEventListener('click', openPrivacyModal);
    }
    // フッター内のインラインリンクからもモーダルを開ける
    const btnPrivacyPolicyInline = document.getElementById('btn-privacy-policy-inline');
    if (btnPrivacyPolicyInline) {
      btnPrivacyPolicyInline.addEventListener('click', openPrivacyModal);
    }
    if (elements.btnModalClose) {
      elements.btnModalClose.addEventListener('click', closePrivacyModal);
    }
    if (elements.privacyModal) {
      // 背景クリックで閉じる
      elements.privacyModal.querySelector('.modal-backdrop')?.addEventListener('click', closePrivacyModal);
      // Escキーで閉じる
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !elements.privacyModal.hidden) {
          closePrivacyModal();
        }
      });
    }

    // イベントデリゲーション: 入力パネル内のイベントを集約
    elements.inputPanels.addEventListener('click', (e) => {
      // クリアボタン
      const clearBtn = e.target.closest('.btn-clear');
      if (clearBtn) {
        const target = clearBtn.dataset.target;
        handleClear(target);
        return;
      }

      // 削除ボタン
      const removeBtn = e.target.closest('.btn-remove-panel');
      if (removeBtn) {
        const panelId = removeBtn.dataset.panel;
        handleRemovePanel(panelId);
        return;
      }
    });

    // 文字カウント (inputイベント)
    elements.inputPanels.addEventListener('input', (e) => {
      if (e.target.classList.contains('text-input')) {
        const panelId = e.target.id.replace('text-', '');
        updateCharCount(panelId, e.target.value);
      }
    });

    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleCompare();
      }
    });
  }

  /**
   * テーマ設定（初期化）
   */
  function setupTheme() {
    // ローカルストレージまたはシステム設定を確認
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // デフォルトはシステム設定に従う (nullの場合はシステム設定)
    const theme = savedTheme ? savedTheme : (prefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
  }

  /**
   * テーマ切り替え
   */
  function handleThemeToggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  }

  /**
   * テーマアイコン更新
   */
  function updateThemeIcon(theme) {
    if (!elements.btnThemeToggle) return;

    // アイコンのテキストまたはクラスを変更
    const text = theme === 'dark' ? '☀️' : '🌙';
    elements.btnThemeToggle.querySelector('.theme-icon').textContent = text;
    elements.btnThemeToggle.title = theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え';
  }

  /**
   * パネル追加
   */
  function handleAddPanel() {
    const nextPanel = PANELS.find(p => !document.querySelector(`[data-panel="${p.id}"]`));

    if (!nextPanel) return;

    const panelHtml = createPanelHtml(nextPanel);

    // 追加ボタンの前にパネルを挿入
    elements.addPanelContainer.insertAdjacentHTML('beforebegin', panelHtml);

    updatePanelLayout();
    updateAddButton();

    // 新しいパネルの入力エリアにフォーカス
    const newTextarea = document.getElementById(`text-${nextPanel.id}`);
    if (newTextarea) {
      newTextarea.focus();
    }
  }

  /**
   * パネル削除
   */
  function handleRemovePanel(panelId) {
    const panel = document.querySelector(`[data-panel="${panelId}"]`);
    if (panel) {
      panel.remove();
      updatePanelLayout();
      updateAddButton();
    }
  }

  /**
   * パネルHTML生成
   */
  function createPanelHtml(panel) {
    return `
      <div class="input-panel" data-panel="${panel.id}">
        <textarea id="text-${panel.id}" class="text-input" placeholder="比較するテキストを入力..." data-clarity-mask="true"></textarea>
        <div class="panel-header">
          <label class="panel-label" for="text-${panel.id}">
            <span class="label-badge compare">比較</span>
            ${panel.name}
          </label>
          <div class="panel-actions">
            <button class="btn-clear" data-target="${panel.id}" title="クリア" tabindex="-1" aria-label="${panel.name}のテキストをクリア">
              <span aria-hidden="true">×</span>
            </button>
            <button class="btn-remove-panel" data-panel="${panel.id}" title="パネル削除" tabindex="-1" aria-label="${panel.name}のパネルを削除">
              <span aria-hidden="true">🗑</span>
            </button>
          </div>
        </div>
        <div class="panel-footer">
          <div class="char-count" data-count="${panel.id}">
            <span class="count-item"><span class="count-value">0</span> 文字</span>
            <span class="count-separator">·</span>
            <span class="count-item"><span class="count-value">0</span> 単語</span>
            <span class="count-separator">·</span>
            <span class="count-item"><span class="count-value">1</span> 行</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * パネルレイアウト更新
   */
  function updatePanelLayout() {
    const currentPanels = document.querySelectorAll('.input-panel').length;
    elements.inputPanels.style.gridTemplateColumns = `repeat(${Math.min(currentPanels, 3)}, 1fr)`;
  }

  /**
   * 追加ボタン更新
   */
  function updateAddButton() {
    const currentPanels = document.querySelectorAll('.input-panel').length;
    if (currentPanels >= MAX_PANELS) {
      elements.addPanelContainer.style.display = 'none';
    } else {
      elements.addPanelContainer.style.display = 'flex';
    }
  }

  /**
   * 比較実行
   */
  function handleCompare() {
    // アクティブなパネルのテキストを取得
    const texts = {};
    PANELS.forEach(panel => {
      const textarea = document.getElementById(`text-${panel.id}`);
      if (textarea) {
        texts[panel.id] = textarea.value;
      }
    });

    // 有効なテキストを持つパネルを抽出
    const activePanels = Object.keys(texts).filter(id => texts[id] && texts[id].trim());

    if (activePanels.length < 2) {
      showToast('比較するには少なくとも2つのテキストを入力してください', 'error');
      return;
    }

    // 結果表示エリアをクリアして表示
    elements.diffContainer.innerHTML = '';
    elements.resultsSection.classList.remove('hidden');

    // 全ペアの比較を生成
    const pairs = generatePairs(activePanels);

    pairs.forEach(([id1, id2]) => {
      const result = DiffEngine.compareLines(texts[id1], texts[id2]);
      const pairHtml = createDiffPairHtml(id1, id2, result);
      elements.diffContainer.insertAdjacentHTML('beforeend', pairHtml);
    });

    // 同期スクロール設定
    setupSyncScroll();

    // 結果エリアにスクロール
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * パネルIDからラベル名を取得
   */
  function getPanelName(id) {
    const panel = PANELS.find(p => p.id === id);
    return panel ? panel.name : id;
  }

  /**
   * ペア生成（全組み合わせ）
   */
  function generatePairs(ids) {
    const pairs = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        pairs.push([ids[i], ids[j]]);
      }
    }
    return pairs;
  }

  /**
   * 差分ペアHTML生成
   */
  function createDiffPairHtml(id1, id2, result) {
    const name1 = getPanelName(id1);
    const name2 = getPanelName(id2);
    const pairId = `${id1}-${id2}`;

    return `
      <div class="diff-pair" id="diff-${pairId}">
        <div class="diff-pair-header">
          <span class="diff-pair-title">${name1} vs ${name2}</span>
          <div class="diff-stats">
            <span class="stat added">+${result.stats.added}</span>
            <span class="stat removed">-${result.stats.removed}</span>
            ${result.stats.changed > 0 ? `<span class="stat changed">~${result.stats.changed}</span>` : ''}
          </div>
        </div>
        <div class="diff-panels">
          <div class="diff-panel" data-side="left">
            <div class="diff-panel-header">${name1}</div>
            <div class="diff-content" id="diff-${pairId}-left">${renderLines(result.left)}</div>
          </div>
          <div class="diff-panel" data-side="right">
            <div class="diff-panel-header">${name2}</div>
            <div class="diff-content" id="diff-${pairId}-right">${renderLines(result.right)}</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 同期スクロール設定
   * マウスオーバーしている側をマスターとして同期
   */
  function setupSyncScroll() {
    const diffPairs = document.querySelectorAll('.diff-pair');
    diffPairs.forEach(pair => {
      const left = pair.querySelector('.diff-content[id$="-left"]');
      const right = pair.querySelector('.diff-content[id$="-right"]');

      if (left && right) {
        // 同期処理を共通化
        const sync = (source, target) => {
          // マウスが乗っている側のみをマスターとする（ループ防止）
          if (source.matches(':hover')) {
            target.scrollTop = source.scrollTop;
            target.scrollLeft = source.scrollLeft;
          }
        };

        // スクロールイベント
        left.addEventListener('scroll', () => requestAnimationFrame(() => sync(left, right)));
        right.addEventListener('scroll', () => requestAnimationFrame(() => sync(right, left)));
      }
    });
  }

  /**
   * 行をHTML化
   */
  function renderLines(lines) {
    if (lines.length === 0) {
      return '<div class="diff-empty">テキストがありません</div>';
    }

    return lines.map(line => {
      const typeClass = getLineClass(line.type);
      const lineNumDisplay = line.lineNum !== null ? line.lineNum : '';

      let content;
      if (line.wordDiff && line.wordDiff.length > 0) {
        content = renderWordDiff(line.wordDiff);
      } else {
        content = escapeHtml(line.content);
      }

      return `
        <div class="diff-line ${typeClass}">
          <span class="line-number">${lineNumDisplay}</span>
          <span class="line-content">${content || '&nbsp;'}</span>
        </div>
      `;
    }).join('');
  }

  /**
   * 単語レベル差分をHTML化
   */
  function renderWordDiff(wordDiff) {
    return wordDiff.map(part => {
      const text = escapeHtml(part.text);
      if (part.type === 'added') {
        return `<span class="word-added">${text}</span>`;
      } else if (part.type === 'removed') {
        return `<span class="word-removed">${text}</span>`;
      } else {
        return text;
      }
    }).join('');
  }

  /**
   * 行タイプからCSSクラスを取得
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
   */
  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * 文字カウント更新
   */
  function updateCharCount(panelId, value) {
    const countEl = document.querySelector(`[data-count="${panelId}"]`);
    if (countEl) {
      const stats = calculateTextStats(value);
      countEl.innerHTML = `
        <span class="count-item"><span class="count-value">${stats.chars}</span> 文字</span>
        <span class="count-separator">·</span>
        <span class="count-item"><span class="count-value">${stats.words}</span> 単語</span>
        <span class="count-separator">·</span>
        <span class="count-item"><span class="count-value">${stats.lines}</span> 行</span>
      `;
    }
  }

  /**
   * テキスト統計を計算
   * @param {string} text - テキスト
   * @returns {Object} 統計情報
   */
  function calculateTextStats(text) {
    // 文字数（改行除く）
    const chars = text.replace(/\n/g, '').length;

    // 行数
    const lines = text ? text.split('\n').length : 1;

    // 単語数（日本語・英語両対応）
    // 英単語: スペース区切り
    // 日本語: 文字単位でカウント（簡易的）
    const words = countWords(text);

    return { chars, lines, words };
  }

  /**
   * 単語数をカウント（日本語・英語対応）
   * @param {string} text - テキスト
   * @returns {number} 単語数
   */
  function countWords(text) {
    if (!text || !text.trim()) return 0;

    // 英語の単語（スペース区切り）
    const englishWords = text.match(/[a-zA-Z]+(?:'[a-zA-Z]+)?/g) || [];

    // 日本語の文字（ひらがな・カタカナ・漢字）
    const japaneseChars = text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g) || [];

    // 数字の連続
    const numbers = text.match(/\d+/g) || [];

    return englishWords.length + japaneseChars.length + numbers.length;
  }

  /**
   * 個別クリア
   */
  function handleClear(panelId) {
    const textarea = document.getElementById(`text-${panelId}`);
    if (textarea) {
      textarea.value = '';
      updateCharCount(panelId, '');
    }
  }

  /**
   * 全クリア
   */
  function handleClearAll() {
    PANELS.forEach(panel => {
      // イとロはクリアのみ、ハとニは削除
      if (panel.id === 'ha' || panel.id === 'ni') {
        handleRemovePanel(panel.id);
      } else {
        handleClear(panel.id);
      }
    });
    elements.resultsSection.classList.add('hidden');

    // 最初のパネルにフォーカス
    if (PANELS.length > 0) {
      const firstTextarea = document.getElementById(`text-${PANELS[0].id}`);
      if (firstTextarea) {
        firstTextarea.focus();
      }
    }
  }

  /**
   * プライバシー折りたたみ切り替え
   */
  function handlePrivacyToggle() {
    const isHidden = elements.privacyDetails.classList.contains('hidden');

    if (isHidden) {
      elements.privacyDetails.classList.remove('hidden');
      elements.btnPrivacyToggle.classList.add('active');
      elements.btnPrivacyToggle.setAttribute('aria-expanded', 'true');
    } else {
      elements.privacyDetails.classList.add('hidden');
      elements.btnPrivacyToggle.classList.remove('active');
      elements.btnPrivacyToggle.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * プライバシーポリシーモーダルを開く
   */
  function openPrivacyModal() {
    if (!elements.privacyModal) return;
    elements.privacyModal.hidden = false;
    document.body.style.overflow = 'hidden';
    // フォーカスをモーダルに移動
    elements.btnModalClose?.focus();
  }

  /**
   * プライバシーポリシーモーダルを閉じる
   */
  function closePrivacyModal() {
    if (!elements.privacyModal) return;
    elements.privacyModal.hidden = true;
    document.body.style.overflow = '';
    // フォーカスを元のボタンに戻す
    elements.btnPrivacyPolicy?.focus();
  }

  /**
   * トースト通知の表示
   */
  function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    elements.toastContainer.appendChild(toast);

    // アニメーション用
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // 3秒後に消去
    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => {
        toast.remove();
      });
    }, 3000);
  }

  /**
   * エラー表示 (後方互換性のため残すがToastを使用)
   */
  function showError(message) {
    showToast(message, 'error');
  }

  // Public API
  return {
    init,
    handleCompare,
    handleClearAll,
    handleAddPanel,
    showError
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UI;
}
