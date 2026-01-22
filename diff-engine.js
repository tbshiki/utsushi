/**
 * utsushi - Diff Engine
 * jsdiff ライブラリのラッパー
 */

const DiffEngine = (function () {
    'use strict';

    /**
     * 2つのテキストを行単位で比較（単語レベル差分対応）
     * @param {string} textA - 基準テキスト
     * @param {string} textB - 比較テキスト
     * @returns {Object} 差分結果
     */
    function compareLines(textA, textB) {
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

        // 差分を処理しやすい形に変換
        const parts = [];
        diff.forEach(part => {
            const lines = part.value.split('\n');
            if (lines[lines.length - 1] === '') {
                lines.pop();
            }
            lines.forEach(line => {
                parts.push({
                    content: line,
                    added: part.added || false,
                    removed: part.removed || false
                });
            });
        });

        let i = 0;
        while (i < parts.length) {
            const part = parts[i];

            if (!part.added && !part.removed) {
                // 変更なし
                leftLineNum++;
                rightLineNum++;
                result.left.push({
                    lineNum: leftLineNum,
                    content: part.content,
                    type: 'unchanged',
                    wordDiff: null
                });
                result.right.push({
                    lineNum: rightLineNum,
                    content: part.content,
                    type: 'unchanged',
                    wordDiff: null
                });
                result.stats.unchanged++;
                i++;
            } else if (part.removed) {
                // 削除された行 - 次に追加行があるかチェック
                const removedLines = [];
                while (i < parts.length && parts[i].removed) {
                    removedLines.push(parts[i].content);
                    i++;
                }

                const addedLines = [];
                while (i < parts.length && parts[i].added) {
                    addedLines.push(parts[i].content);
                    i++;
                }

                // ペアリングして変更行を生成
                const maxLen = Math.max(removedLines.length, addedLines.length);
                for (let j = 0; j < maxLen; j++) {
                    const removedLine = removedLines[j];
                    const addedLine = addedLines[j];

                    if (removedLine !== undefined && addedLine !== undefined) {
                        // 両方存在 - 類似度をチェック
                        const similarity = calculateSimilarity(removedLine, addedLine);

                        if (similarity > 0.3) {
                            // 類似している場合は変更行として単語レベル差分を計算
                            const wordDiff = compareWords(removedLine, addedLine);
                            leftLineNum++;
                            rightLineNum++;
                            result.left.push({
                                lineNum: leftLineNum,
                                content: removedLine,
                                type: 'changed',
                                wordDiff: wordDiff.left
                            });
                            result.right.push({
                                lineNum: rightLineNum,
                                content: addedLine,
                                type: 'changed',
                                wordDiff: wordDiff.right
                            });
                            result.stats.changed++;
                        } else {
                            // 類似度が低い場合は別々に処理
                            leftLineNum++;
                            result.left.push({
                                lineNum: leftLineNum,
                                content: removedLine,
                                type: 'removed',
                                wordDiff: null
                            });
                            result.right.push({
                                lineNum: null,
                                content: '',
                                type: 'empty',
                                wordDiff: null
                            });
                            result.stats.removed++;

                            rightLineNum++;
                            result.left.push({
                                lineNum: null,
                                content: '',
                                type: 'empty',
                                wordDiff: null
                            });
                            result.right.push({
                                lineNum: rightLineNum,
                                content: addedLine,
                                type: 'added',
                                wordDiff: null
                            });
                            result.stats.added++;
                        }
                    } else if (removedLine !== undefined) {
                        // 削除のみ
                        leftLineNum++;
                        result.left.push({
                            lineNum: leftLineNum,
                            content: removedLine,
                            type: 'removed',
                            wordDiff: null
                        });
                        result.right.push({
                            lineNum: null,
                            content: '',
                            type: 'empty',
                            wordDiff: null
                        });
                        result.stats.removed++;
                    } else if (addedLine !== undefined) {
                        // 追加のみ
                        rightLineNum++;
                        result.left.push({
                            lineNum: null,
                            content: '',
                            type: 'empty',
                            wordDiff: null
                        });
                        result.right.push({
                            lineNum: rightLineNum,
                            content: addedLine,
                            type: 'added',
                            wordDiff: null
                        });
                        result.stats.added++;
                    }
                }
            } else if (part.added) {
                // 追加行のみ（削除行が先に来なかった場合）
                rightLineNum++;
                result.left.push({
                    lineNum: null,
                    content: '',
                    type: 'empty',
                    wordDiff: null
                });
                result.right.push({
                    lineNum: rightLineNum,
                    content: part.content,
                    type: 'added',
                    wordDiff: null
                });
                result.stats.added++;
                i++;
            }
        }

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
