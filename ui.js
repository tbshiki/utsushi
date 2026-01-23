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
  let lastFocusedElement = null;
  let wordSegmenter = null;

  /**
   * Intl.Segmenter を取得（対応していない場合は null）
   */
  function getWordSegmenter() {
    if (wordSegmenter) return wordSegmenter;
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      wordSegmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
      return wordSegmenter;
    }
    return null;
  }

  /**
   * 初期化
   */
  async function init() {
    cacheElements();
    setupTheme();
    setupEventListeners();
    updatePanelLayout();

    // i18n 初期化（非同期）
    if (typeof I18n !== 'undefined') {
      await I18n.init();
      updatePanelNames();
      refreshAllCounts();
      // 言語変更時にパネル名を更新
      window.addEventListener('languageChanged', () => {
        updatePanelNames();
        refreshAllCounts();
      });
    }
  }

  /**
   * DOM 要素をキャッシュ
   */
  function cacheElements() {
    elements = {
      skipLink: document.querySelector('.skip-link'),
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
      btnLangToggle: document.getElementById('btn-lang-toggle'),
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

    // 言語切り替えボタン
    if (elements.btnLangToggle) {
      elements.btnLangToggle.addEventListener('click', handleLangToggle);
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
      document.addEventListener('keydown', handleModalKeydown);
    }

    // イベントデリゲーション: 入力パネル内のイベントを集約
    elements.inputPanels.addEventListener('click', (e) => {
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
  }

  /**
   * パネル追加
   */
  function handleAddPanel() {
    const nextPanel = PANELS.find(p => !document.querySelector(`[data-panel="${p.id}"]`));

    if (!nextPanel) return;

    const panelEl = createPanelElement(nextPanel);
    if (!panelEl) return;

    // 追加ボタンの前にパネルを挿入
    elements.inputPanels.insertBefore(panelEl, elements.addPanelContainer);

    updatePanelLayout();
    updateAddButton();
    updatePanelNames();

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
   * パネル要素を生成
   */
  function createPanelElement(panel) {
    const t = typeof I18n !== 'undefined' ? I18n.t : (key) => key;
    const panelName = typeof I18n !== 'undefined' ? I18n.getPanelName(panel.id) : panel.name;
    const placeholder = t('input.placeholder.compare');
    const badgeText = t('input.label.badge');
    const removeTitle = t('input.remove.title');
    const removeAria = typeof I18n !== 'undefined' ? I18n.t('input.remove.aria', { panel: panelName }) : `Remove panel ${panelName}`;
    const charsLabel = t('count.chars');
    const wordsLabel = t('count.words');
    const linesLabel = t('count.lines');

    const panelEl = document.createElement('div');
    panelEl.className = 'input-panel';
    panelEl.dataset.panel = panel.id;

    const textarea = document.createElement('textarea');
    textarea.id = `text-${panel.id}`;
    textarea.className = 'text-input';
    textarea.placeholder = placeholder;
    textarea.dataset.clarityMask = 'true';
    textarea.dataset.i18n = 'input.placeholder.compare';
    textarea.dataset.i18nAttr = 'placeholder';
    panelEl.appendChild(textarea);

    const header = document.createElement('div');
    header.className = 'panel-header';

    const label = document.createElement('label');
    label.className = 'panel-label';
    label.setAttribute('for', `text-${panel.id}`);

    const badge = document.createElement('span');
    badge.className = 'label-badge compare';
    badge.dataset.i18n = 'input.label.badge';
    badge.textContent = badgeText;
    label.appendChild(badge);

    const labelName = document.createElement('span');
    labelName.dataset.i18n = `panel.${panel.id}`;
    labelName.textContent = panelName;
    label.appendChild(labelName);

    header.appendChild(label);

    const actions = document.createElement('div');
    actions.className = 'panel-actions';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove-panel';
    removeBtn.dataset.panel = panel.id;
    removeBtn.title = removeTitle;
    removeBtn.setAttribute('aria-label', removeAria);
    removeBtn.dataset.i18n = 'input.remove.title';
    removeBtn.dataset.i18nAttr = 'title';

    const removeIcon = document.createElement('span');
    removeIcon.setAttribute('aria-hidden', 'true');
    removeIcon.textContent = '🗑';
    removeBtn.appendChild(removeIcon);

    actions.appendChild(removeBtn);
    header.appendChild(actions);
    panelEl.appendChild(header);

    const footer = document.createElement('div');
    footer.className = 'panel-footer';

    const countEl = document.createElement('div');
    countEl.className = 'char-count';
    countEl.dataset.count = panel.id;
    renderCount(countEl, { chars: 0, words: 0, lines: 1 }, { charsLabel, wordsLabel, linesLabel });
    footer.appendChild(countEl);
    panelEl.appendChild(footer);

    return panelEl;
  }

  /**
   * パネル名を更新（言語切り替え時）
   */
  function updatePanelNames() {
    if (typeof I18n === 'undefined') return;

    // 既存のパネルのラベルを更新
    PANELS.forEach(panel => {
      const panelEl = document.querySelector(`[data-panel="${panel.id}"]`);
      if (!panelEl) return;

      const panelName = I18n.getPanelName(panel.id);
      const labelSpan = panelEl.querySelector(`.panel-label [data-i18n="panel.${panel.id}"]`);
      if (labelSpan) {
        labelSpan.textContent = panelName;
      }

      const removeBtn = panelEl.querySelector('.btn-remove-panel');
      if (removeBtn) {
        removeBtn.setAttribute('aria-label', I18n.t('input.remove.aria', { panel: panelName }));
      }
    });
  }

  /**
   * パネルレイアウト更新
   */
  function updatePanelLayout() {
    const currentPanels = document.querySelectorAll('.input-panel').length;
    if (!elements.inputPanels) return;
    elements.inputPanels.dataset.panels = String(currentPanels);
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
      const errorMsg = typeof I18n !== 'undefined' ? I18n.t('toast.error.single') : '比較するには少なくとも2つのテキストを入力してください';
      showToast(errorMsg, 'error');
      return;
    }

    // 結果表示エリアをクリアして表示
    elements.diffContainer.textContent = '';
    elements.resultsSection.classList.remove('hidden');

    // 全ペアの比較を生成
    const pairs = generatePairs(activePanels);

    pairs.forEach(([id1, id2]) => {
      const result = DiffEngine.compareLines(texts[id1], texts[id2]);
      const pairEl = createDiffPairElement(id1, id2, result);
      elements.diffContainer.appendChild(pairEl);
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
    if (typeof I18n !== 'undefined') {
      return I18n.getPanelName(id);
    }
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
   * 差分ペア要素生成
   */
  function createDiffPairElement(id1, id2, result) {
    const name1 = getPanelName(id1);
    const name2 = getPanelName(id2);
    const pairId = `${id1}-${id2}`;
    const vsText = typeof I18n !== 'undefined' ? I18n.t('diff.vs') : 'vs';

    const pairEl = document.createElement('div');
    pairEl.className = 'diff-pair';
    pairEl.id = `diff-${pairId}`;

    const header = document.createElement('div');
    header.className = 'diff-pair-header';

    const title = document.createElement('span');
    title.className = 'diff-pair-title';
    title.textContent = `${name1} ${vsText} ${name2}`;
    header.appendChild(title);

    const stats = document.createElement('div');
    stats.className = 'diff-stats';

    const added = document.createElement('span');
    added.className = 'stat added';
    added.textContent = `+${result.stats.added}`;
    stats.appendChild(added);

    const removed = document.createElement('span');
    removed.className = 'stat removed';
    removed.textContent = `-${result.stats.removed}`;
    stats.appendChild(removed);

    if (result.stats.changed > 0) {
      const changed = document.createElement('span');
      changed.className = 'stat changed';
      changed.textContent = `~${result.stats.changed}`;
      stats.appendChild(changed);
    }

    header.appendChild(stats);
    pairEl.appendChild(header);

    const panels = document.createElement('div');
    panels.className = 'diff-panels';

    const leftPanel = document.createElement('div');
    leftPanel.className = 'diff-panel';
    leftPanel.dataset.side = 'left';
    const leftHeader = document.createElement('div');
    leftHeader.className = 'diff-panel-header';
    leftHeader.textContent = name1;
    const leftContent = document.createElement('div');
    leftContent.className = 'diff-content';
    leftContent.id = `diff-${pairId}-left`;
    leftContent.appendChild(renderLinesFragment(result.left));
    leftPanel.appendChild(leftHeader);
    leftPanel.appendChild(leftContent);

    const rightPanel = document.createElement('div');
    rightPanel.className = 'diff-panel';
    rightPanel.dataset.side = 'right';
    const rightHeader = document.createElement('div');
    rightHeader.className = 'diff-panel-header';
    rightHeader.textContent = name2;
    const rightContent = document.createElement('div');
    rightContent.className = 'diff-content';
    rightContent.id = `diff-${pairId}-right`;
    rightContent.appendChild(renderLinesFragment(result.right));
    rightPanel.appendChild(rightHeader);
    rightPanel.appendChild(rightContent);

    panels.appendChild(leftPanel);
    panels.appendChild(rightPanel);
    pairEl.appendChild(panels);

    return pairEl;
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
  function renderLinesFragment(lines) {
    const fragment = document.createDocumentFragment();
    if (lines.length === 0) {
      const emptyText = typeof I18n !== 'undefined' ? I18n.t('diff.empty') : 'No text';
      const emptyEl = document.createElement('div');
      emptyEl.className = 'diff-empty';
      emptyEl.textContent = emptyText;
      fragment.appendChild(emptyEl);
      return fragment;
    }

    lines.forEach(line => {
      const typeClass = getLineClass(line.type);
      const lineNumDisplay = line.lineNum !== null ? String(line.lineNum) : '';

      const lineEl = document.createElement('div');
      lineEl.className = `diff-line ${typeClass}`.trim();

      const lineNum = document.createElement('span');
      lineNum.className = 'line-number';
      lineNum.textContent = lineNumDisplay;
      lineEl.appendChild(lineNum);

      const lineContent = document.createElement('span');
      lineContent.className = 'line-content';
      if (line.wordDiff && line.wordDiff.length > 0) {
        lineContent.appendChild(renderWordDiffFragment(line.wordDiff));
      } else {
        lineContent.textContent = line.content || '\u00a0';
      }
      lineEl.appendChild(lineContent);

      fragment.appendChild(lineEl);
    });

    return fragment;
  }

  /**
   * 単語レベル差分をHTML化
   */
  function renderWordDiffFragment(wordDiff) {
    const fragment = document.createDocumentFragment();
    wordDiff.forEach(part => {
      if (part.type === 'added') {
        const span = document.createElement('span');
        span.className = 'word-added';
        span.textContent = part.text;
        fragment.appendChild(span);
      } else if (part.type === 'removed') {
        const span = document.createElement('span');
        span.className = 'word-removed';
        span.textContent = part.text;
        fragment.appendChild(span);
      } else {
        fragment.appendChild(document.createTextNode(part.text));
      }
    });
    return fragment;
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
   * 文字カウント更新
   */
  function updateCharCount(panelId, value) {
    const countEl = document.querySelector(`[data-count="${panelId}"]`);
    if (countEl) {
      const stats = calculateTextStats(value);
      const charsLabel = typeof I18n !== 'undefined' ? I18n.t('count.chars') : 'chars';
      const wordsLabel = typeof I18n !== 'undefined' ? I18n.t('count.words') : 'words';
      const linesLabel = typeof I18n !== 'undefined' ? I18n.t('count.lines') : 'lines';
      renderCount(countEl, stats, { charsLabel, wordsLabel, linesLabel });
    }
  }

  /**
   * 文字カウントのDOMを描画
   */
  function renderCount(container, stats, labels) {
    container.textContent = '';
    container.appendChild(createCountItem(stats.chars, labels.charsLabel, 'count.chars'));
    container.appendChild(createCountSeparator());
    container.appendChild(createCountItem(stats.words, labels.wordsLabel, 'count.words'));
    container.appendChild(createCountSeparator());
    container.appendChild(createCountItem(stats.lines, labels.linesLabel, 'count.lines'));
  }

  function createCountItem(value, labelText, i18nKey) {
    const item = document.createElement('span');
    item.className = 'count-item';

    const valueSpan = document.createElement('span');
    valueSpan.className = 'count-value';
    valueSpan.textContent = String(value);
    item.appendChild(valueSpan);
    item.appendChild(document.createTextNode(' '));

    const labelSpan = document.createElement('span');
    labelSpan.dataset.i18n = i18nKey;
    labelSpan.textContent = labelText;
    item.appendChild(labelSpan);

    return item;
  }

  function createCountSeparator() {
    const sep = document.createElement('span');
    sep.className = 'count-separator';
    sep.textContent = '·';
    return sep;
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

    const segmenter = getWordSegmenter();
    if (segmenter) {
      let count = 0;
      for (const segment of segmenter.segment(text)) {
        if (segment.isWordLike) {
          count += 1;
        }
      }
      return count;
    }

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
    lastFocusedElement = document.activeElement;
    elements.privacyModal.hidden = false;
    document.body.style.overflow = 'hidden';
    setPageAriaHidden(true);
    // フォーカスをモーダルに移動
    const focusables = getFocusableElements(elements.privacyModal);
    (focusables[0] || elements.btnModalClose)?.focus();
  }

  /**
   * プライバシーポリシーモーダルを閉じる
   */
  function closePrivacyModal() {
    if (!elements.privacyModal) return;
    elements.privacyModal.hidden = true;
    document.body.style.overflow = '';
    setPageAriaHidden(false);
    // フォーカスを元のボタンに戻す
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    } else {
      elements.btnPrivacyPolicy?.focus();
    }
  }

  /**
   * 言語切り替え
   */
  function handleLangToggle() {
    if (typeof I18n !== 'undefined') {
      I18n.toggleLang();
    }
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

  /**
   * 文字カウントを再描画（言語切り替え用）
   */
  function refreshAllCounts() {
    PANELS.forEach(panel => {
      const textarea = document.getElementById(`text-${panel.id}`);
      if (textarea) {
        updateCharCount(panel.id, textarea.value);
      }
    });
  }

  /**
   * モーダル内フォーカストラップ
   */
  function handleModalKeydown(e) {
    if (!elements.privacyModal || elements.privacyModal.hidden) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closePrivacyModal();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusables = getFocusableElements(elements.privacyModal);
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /**
   * フォーカス可能要素を取得
   */
  function getFocusableElements(container) {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    return Array.from(container.querySelectorAll(selector)).filter(el => !el.hasAttribute('hidden'));
  }

  /**
   * モーダル表示中は背面をスクリーンリーダーから隠す
   */
  function setPageAriaHidden(isHidden) {
    ['header', 'main', 'footer'].forEach(tag => {
      const el = document.querySelector(tag);
      if (!el) return;
      if (isHidden) {
        el.setAttribute('aria-hidden', 'true');
        if ('inert' in el) {
          el.inert = true;
        }
      } else {
        el.removeAttribute('aria-hidden');
        if ('inert' in el) {
          el.inert = false;
        }
      }
    });
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
