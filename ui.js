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
  let activePanelCount = 2;
  const MAX_PANELS = 4;

  // DOM キャッシュ
  let elements = {};

  /**
   * 初期化
   */
  function init() {
    cacheElements();
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
      privacyDetails: document.getElementById('privacy-details')
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

    // 既存パネルのイベント設定
    setupPanelEvents();

    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleCompare();
      }
    });
  }

  /**
   * パネルのイベント設定
   */
  function setupPanelEvents() {
    // クリアボタン
    document.querySelectorAll('.btn-clear').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.dataset.target;
        handleClear(target);
      });
    });

    // 削除ボタン（ハ、ニ用）
    document.querySelectorAll('.btn-remove-panel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const panelId = e.currentTarget.dataset.panel;
        handleRemovePanel(panelId);
      });
    });

    // 文字カウント
    document.querySelectorAll('.text-input').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const panelId = e.target.id.replace('text-', '');
        updateCharCount(panelId, e.target.value);
      });
    });
  }

  /**
   * パネル追加
   */
  function handleAddPanel() {
    if (activePanelCount >= MAX_PANELS) return;

    const nextPanel = PANELS[activePanelCount];
    const panelHtml = createPanelHtml(nextPanel);

    // 追加ボタンの前にパネルを挿入
    elements.addPanelContainer.insertAdjacentHTML('beforebegin', panelHtml);

    activePanelCount++;

    // イベント再設定
    setupPanelEvents();
    updatePanelLayout();
    updateAddButton();
  }

  /**
   * パネル削除
   */
  function handleRemovePanel(panelId) {
    const panel = document.querySelector(`[data-panel="${panelId}"]`);
    if (panel) {
      panel.remove();
      activePanelCount--;
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
        <div class="panel-header">
          <label class="panel-label">
            <span class="label-badge compare">比較</span>
            ${panel.name}
          </label>
          <div class="panel-actions">
            <button class="btn-clear" data-target="${panel.id}" title="クリア">
              <span>×</span>
            </button>
            <button class="btn-remove-panel" data-panel="${panel.id}" title="パネル削除">
              <span>🗑</span>
            </button>
          </div>
        </div>
        <textarea id="text-${panel.id}" class="text-input" placeholder="比較するテキストを入力..."></textarea>
        <div class="panel-footer">
          <span class="char-count" data-count="${panel.id}">0 文字</span>
        </div>
      </div>
    `;
  }

  /**
   * パネルレイアウト更新
   */
  function updatePanelLayout() {
    const panelCount = activePanelCount + 1; // +1 for add button
    elements.inputPanels.style.gridTemplateColumns = `repeat(${Math.min(activePanelCount, 4)}, 1fr)`;
  }

  /**
   * 追加ボタン更新
   */
  function updateAddButton() {
    if (activePanelCount >= MAX_PANELS) {
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
    PANELS.slice(0, activePanelCount).forEach(panel => {
      const textarea = document.getElementById(`text-${panel.id}`);
      if (textarea) {
        texts[panel.id] = textarea.value;
      }
    });

    // 基準テキスト（イ）チェック
    if (!texts.i || !texts.i.trim()) {
      showError('基準テキスト（イ）を入力してください');
      document.getElementById('text-i').focus();
      return;
    }

    // 少なくとも1つの比較テキストが必要
    const compareTexts = Object.entries(texts).filter(([id, text]) => id !== 'i' && text.trim());
    if (compareTexts.length === 0) {
      showError('比較するテキスト（ロ、ハ、ニ）を少なくとも1つ入力してください');
      return;
    }

    // 結果表示エリアをクリアして表示
    elements.diffContainer.innerHTML = '';
    elements.resultsSection.classList.remove('hidden');

    // 全ペアの比較を生成
    const panelIds = Object.keys(texts).filter(id => texts[id].trim());
    const pairs = generatePairs(panelIds);

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
            <div class="diff-panel-header">${name1}${id1 === 'i' ? '（基準）' : ''}</div>
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
   */
  function setupSyncScroll() {
    const diffPairs = document.querySelectorAll('.diff-pair');
    diffPairs.forEach(pair => {
      const left = pair.querySelector('.diff-content[id$="-left"]');
      const right = pair.querySelector('.diff-content[id$="-right"]');

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
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 文字カウント更新
   */
  function updateCharCount(panelId, value) {
    const countEl = document.querySelector(`[data-count="${panelId}"]`);
    if (countEl) {
      const count = value.length;
      const lines = value.split('\n').length;
      countEl.textContent = `${count} 文字 / ${lines} 行`;
    }
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
      handleClear(panel.id);
    });
    elements.resultsSection.classList.add('hidden');
  }

  /**
   * プライバシー折りたたみ切り替え
   */
  function handlePrivacyToggle() {
    const isHidden = elements.privacyDetails.classList.contains('hidden');

    if (isHidden) {
      elements.privacyDetails.classList.remove('hidden');
      elements.btnPrivacyToggle.classList.add('active');
    } else {
      elements.privacyDetails.classList.add('hidden');
      elements.btnPrivacyToggle.classList.remove('active');
    }
  }

  /**
   * エラー表示
   */
  function showError(message) {
    alert(message);
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
