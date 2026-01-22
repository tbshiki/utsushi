/**
 * utsushi - Diff Engine
 * jsdiff ライブラリのラッパー
 */

const DiffEngine = (function() {
    'use strict';

    /**
     * 2つのテキストを行単位で比較
     * @param {string} textA - 基準テキスト
     * @param {string} textB - 比較テキスト
     * @returns {Object} 差分結果
     */
    function compareLines(textA, textB) {
        const linesA = textA.split('\n');
        const linesB = textB.split('\n');

        // jsdiff を使用して行単位の差分を取得
        const diff = Diff.diffLines(textA, textB);

        const result = {
            left: [],   // 基準テキスト側の行情報
            right: [],  // 比較テキスト側の行情報
            stats: {
                added: 0,
                removed: 0,
                changed: 0,
                unchanged: 0
            }
        };

        let leftLineNum = 0;
        let rightLineNum = 0;

        diff.forEach(part => {
            const lines = part.value.split('\n');
            // 最後の空行を除去（split による余分な要素）
            if (lines[lines.length - 1] === '') {
                lines.pop();
            }

            if (part.added) {
                // 追加された行
                lines.forEach(line => {
                    rightLineNum++;
                    result.right.push({
                        lineNum: rightLineNum,
                        content: line,
                        type: 'added'
                    });
                    // 左側には空行を追加（同期表示用）
                    result.left.push({
                        lineNum: null,
                        content: '',
                        type: 'empty'
                    });
                    result.stats.added++;
                });
            } else if (part.removed) {
                // 削除された行
                lines.forEach(line => {
                    leftLineNum++;
                    result.left.push({
                        lineNum: leftLineNum,
                        content: line,
                        type: 'removed'
                    });
                    // 右側には空行を追加（同期表示用）
                    result.right.push({
                        lineNum: null,
                        content: '',
                        type: 'empty'
                    });
                    result.stats.removed++;
                });
            } else {
                // 変更なし
                lines.forEach(line => {
                    leftLineNum++;
                    rightLineNum++;
                    result.left.push({
                        lineNum: leftLineNum,
                        content: line,
                        type: 'unchanged'
                    });
                    result.right.push({
                        lineNum: rightLineNum,
                        content: line,
                        type: 'unchanged'
                    });
                    result.stats.unchanged++;
                });
            }
        });

        return result;
    }

    /**
     * 2つのテキストを単語単位で比較（行内の差分表示用）
     * @param {string} lineA - 基準行
     * @param {string} lineB - 比較行
     * @returns {Object} 差分結果
     */
    function compareWords(lineA, lineB) {
        const diff = Diff.diffWords(lineA, lineB);

        const leftParts = [];
        const rightParts = [];

        diff.forEach(part => {
            if (part.added) {
                rightParts.push({
                    text: part.value,
                    type: 'added'
                });
            } else if (part.removed) {
                leftParts.push({
                    text: part.value,
                    type: 'removed'
                });
            } else {
                leftParts.push({
                    text: part.value,
                    type: 'unchanged'
                });
                rightParts.push({
                    text: part.value,
                    type: 'unchanged'
                });
            }
        });

        return { left: leftParts, right: rightParts };
    }

    /**
     * 複数テキストを基準テキストと比較
     * @param {string} baseText - 基準テキスト (A)
     * @param {string[]} compareTexts - 比較テキストの配列 [B, C, ...]
     * @returns {Object[]} 各比較の差分結果
     */
    function compareMultiple(baseText, compareTexts) {
        return compareTexts.map((text, index) => {
            if (!text || text.trim() === '') {
                return null;
            }
            return {
                label: String.fromCharCode(66 + index), // B, C, D...
                diff: compareLines(baseText, text)
            };
        }).filter(result => result !== null);
    }

    /**
     * 行の変更タイプを判定（より詳細な分析）
     * @param {string} lineA - 基準行
     * @param {string} lineB - 比較行
     * @returns {string} 'identical', 'modified', 'different'
     */
    function getChangeType(lineA, lineB) {
        if (lineA === lineB) {
            return 'identical';
        }

        // 類似度を計算（簡易版）
        const similarity = calculateSimilarity(lineA, lineB);

        if (similarity > 0.5) {
            return 'modified'; // 50%以上の類似度なら変更
        }

        return 'different'; // 大幅に異なる
    }

    /**
     * 2つの文字列の類似度を計算
     * @param {string} str1
     * @param {string} str2
     * @returns {number} 0-1 の類似度
     */
    function calculateSimilarity(str1, str2) {
        if (str1 === str2) return 1;
        if (!str1 || !str2) return 0;

        const len1 = str1.length;
        const len2 = str2.length;
        const maxLen = Math.max(len1, len2);

        if (maxLen === 0) return 1;

        // 単純な文字一致率
        const diff = Diff.diffChars(str1, str2);
        let matchCount = 0;

        diff.forEach(part => {
            if (!part.added && !part.removed) {
                matchCount += part.value.length;
            }
        });

        return matchCount / maxLen;
    }

    // Public API
    return {
        compareLines,
        compareWords,
        compareMultiple,
        getChangeType,
        calculateSimilarity
    };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiffEngine;
}
