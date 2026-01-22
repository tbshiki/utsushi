# utsushi デプロイ手順

## Cloudflare Pages へのデプロイ

### 前提条件

- GitHubアカウント
- Cloudflareアカウント

### 手順

#### 1. GitHubリポジトリの準備

```bash
# リポジトリ初期化（未実施の場合）
cd utsushi
git init
git add .
git commit -m "Initial commit: utsushi v0.1.0"

# GitHubリポジトリを作成し、プッシュ
git remote add origin https://github.com/your-username/utsushi.git
git branch -M main
git push -u origin main
```

#### 2. Cloudflare Pages でプロジェクト作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 左メニューから「Pages」を選択
3. 「プロジェクトを作成」をクリック
4. 「Gitに接続」を選択

#### 3. リポジトリ連携

1. GitHubアカウントを連携
2. `utsushi` リポジトリを選択
3. 「セットアップを開始」をクリック

#### 4. ビルド設定

| 項目 | 設定値 |
|------|--------|
| プロジェクト名 | `utsushi`（任意） |
| 本番ブランチ | `main` |
| ビルドコマンド | (空欄のまま) |
| ビルド出力ディレクトリ | `/` |

#### 5. デプロイ実行

1. 「保存してデプロイ」をクリック
2. デプロイ完了まで数分待機
3. `https://utsushi.pages.dev` のようなURLが発行される

### カスタムドメイン設定（オプション）

1. Pagesプロジェクトの「カスタムドメイン」タブ
2. 「カスタムドメインを設定」をクリック
3. 使用したいドメインを入力
4. DNS設定を行う

### 環境変数

このプロジェクトでは環境変数は使用しません。

### 注意事項

- Functions（サーバーレス関数）は不要
- Workers連携は不要
- すべて静的配信で完結

## その他のホスティングサービス

### GitHub Pages

```bash
# gh-pages ブランチにデプロイ
git checkout -b gh-pages
git push origin gh-pages
```

リポジトリ設定 > Pages > Source から `gh-pages` ブランチを選択

### Netlify

1. [Netlify](https://www.netlify.com/) にログイン
2. 「Add new site」>「Import an existing project」
3. GitHubリポジトリを連携
4. ビルド設定:
   - Build command: (空欄)
   - Publish directory: `.`

### Vercel

```bash
# Vercel CLI でデプロイ
npx vercel
```

## トラブルシューティング

### CSPエラーが発生する

`connect-src 'none'` により外部通信が禁止されています。これは仕様です。

### フォントが読み込まれない

Google Fonts へのアクセスが必要です。CSPで `fonts.googleapis.com` と `fonts.gstatic.com` を許可しています。

### jsdiff が読み込まれない

CDN (`cdn.jsdelivr.net`) へのアクセスが必要です。CSPで許可済みです。

---

最終更新: 2026-01-22
