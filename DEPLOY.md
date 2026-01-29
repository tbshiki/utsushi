# utsushi デプロイ手順

## Github リポジトリから Cloudflare Pages へのデプロイ

### 前提条件

- GitHubアカウント
- Cloudflareアカウント

### 手順

#### 1. GitHubリポジトリの準備

[utsushi GitHubリポジトリ](https://github.com/tbshiki/utsushi)

#### 2. Cloudflare Pages でプロジェクト作成


1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 左メニューから「コンピューティングとAI > Workers & Pages」を選択
3. 「アプリケーションを作成する」をクリック
4. Pages を導入しようとお考えですか? 始める をクリック
5. 既存の Git リポジトリをインポートするの始める をクリック
6. Github と連携してリポジトリを選択
7. セットアップの開始 をクリック


## ビルド・デプロイ

| 項目 | 設定値 |
|------|--------|
| プロジェクト名 | `utsushi` |
| プロダクションブランチ | `main` |

ビルドの設定
| 項目 | 設定値 |
|------|--------|
| フレームワークプリセット | なし |
| ビルドコマンド | `node scripts/build.js` |
| ビルド出力ディレクトリ | `dist` |

> **補足**: 通常は動的nonceのためビルド時の置換は不要です。旧方式が必要な場合のみ
> `CSP_NONCE_MODE=static node scripts/build.js` を使用してください。


「保存してデプロイ」をクリック
デプロイ完了まで数分待機
`https://utsushi.pages.dev` のようなURLが発行される


### カスタムドメイン設定（オプション）

1. Pagesプロジェクトの「カスタムドメイン」タブ
2. 「カスタムドメインを設定」をクリック
3. 使用したいドメインを入力
4. DNS設定を行う

### アナリティクス（GA4 / Clarity）

GA4 と Microsoft Clarity は **ビルド時に index.html へ注入**します。
Cloudflare Pages の環境変数に ID を設定してください（任意）。

**Cloudflare Pages での設定方法：**
1. Cloudflare Dashboard > Pages > utsushi プロジェクト
2. 「設定」タブ > 「環境変数」
3. 以下を追加
   - `GA_ID`（例: `G-XXXXXXXXXX`）
   - `CLARITY_ID`（例: `abcd1234ef`）

**ビルドコマンドの設定：**
ビルドコマンドは同じです：

| 項目 | 設定値 |
|------|--------|
| ビルドコマンド | `node scripts/build.js` |
| ビルド出力ディレクトリ | `dist` |

> **注意**: CSPは `_headers` にあります。nonceは Pages Functions の `_middleware.js` が動的に注入します。
> **注意**: ローカル開発時はCSPヘッダーが付与されないため、本番と挙動が異なる場合があります。

### 注意事項

- Functions（サーバーレス関数）を使用（`functions/_middleware.js`）
- Workers連携は不要
- すべて静的配信で完結
- CDNスクリプトのバージョンを変更した場合は、SRIハッシュも更新する

---

最終更新: 2026-01-23
