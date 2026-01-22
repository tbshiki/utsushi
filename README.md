# utsushi

> テキスト差分比較ツール - 完全ローカル処理

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 概要

**utsushi** は、複数のテキストをブラウザ内で比較できるツールです。すべての処理はローカルで行われ、入力内容がサーバーに送信されることはありません。

## 特徴

- 🔒 **完全ローカル処理** - データは一切外部に送信されません
- 📝 **最大3テキスト比較** - 基準テキストと2つの比較テキスト
- 🎨 **視覚的な差分表示** - 追加・削除・変更を色分け表示
- 📱 **レスポンシブ対応** - PC・タブレット・スマートフォンで利用可能
- ⚡ **高速処理** - 大量のテキストも快適に比較

## 使い方

1. **Text A** に基準となるテキストを入力
2. **Text B** / **Text C** に比較したいテキストを入力
3. 「差分を比較」ボタンをクリック
4. 差分がハイライト表示されます

## 色分け

| 色 | 意味 |
|----|------|
| 🟢 緑 | 追加された行 |
| 🔴 赤 | 削除された行 |
| 🟡 黄 | 変更された行 |

## 技術仕様

- **差分ライブラリ**: [jsdiff](https://github.com/kpdecker/jsdiff)
- **セキュリティ**: CSP `connect-src 'none'` で外部通信を完全禁止
- **デプロイ**: Cloudflare Pages

## ローカル開発

```bash
# リポジトリをクローン
git clone https://github.com/your-username/utsushi.git
cd utsushi

# ローカルサーバーを起動
npx serve .
```

ブラウザで http://localhost:3000 にアクセス

## ファイル構成

```
utsushi/
├── index.html      # メインHTML
├── style.css       # スタイルシート
├── main.js         # エントリーポイント
├── diff-engine.js  # 差分計算エンジン
├── ui.js           # UI制御
└── README.md       # このファイル
```

## Cloudflare Pages デプロイ

1. GitHubにリポジトリをプッシュ
2. Cloudflare Pages でプロジェクトを作成
3. リポジトリを連携
4. Build settings:
   - Build command: (空欄)
   - Output directory: `/`
5. デプロイ完了

## プライバシーについて

- ✅ 本ツールはすべてローカル処理です
- ✅ 入力内容はサーバーに送信されません
- ⚠️ 入力データの責任は利用者にあります

## ライセンス

MIT License

---

Made with ❤️ for better text comparison
