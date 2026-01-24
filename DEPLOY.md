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


「保存してデプロイ」をクリック
デプロイ完了まで数分待機
`https://utsushi.pages.dev` のようなURLが発行される


### カスタムドメイン設定（オプション）

1. Pagesプロジェクトの「カスタムドメイン」タブ
2. 「カスタムドメインを設定」をクリック
3. 使用したいドメインを入力
4. DNS設定を行う

### アナリティクス（Zaraz）

GA4 と Microsoft Clarity は Cloudflare Zaraz で管理します。
ビルド時の環境変数は不要です。

**Cloudflare Pages での設定方法：**
1. Cloudflare Dashboard > Pages > utsushi プロジェクト
2. 「設定」タブ > 「Zaraz」
3. Google Analytics 4 / Microsoft Clarity を追加して ID を設定

**ビルドコマンドの設定：**
ビルドコマンドは同じです：

| 項目 | 設定値 |
|------|--------|
| ビルドコマンド | `node scripts/build.js` |
| ビルド出力ディレクトリ | `dist` |

> **注意**: CSPは `_headers` に移行しています。nonceはビルド時に自動注入されます。
> **注意**: ローカル開発時はCSPヘッダーが付与されないため、本番と挙動が異なる場合があります。

### 注意事項

- Functions（サーバーレス関数）は不要
- Workers連携は不要
- すべて静的配信で完結
- CDNスクリプトのバージョンを変更した場合は、SRIハッシュも更新する

---

最終更新: 2026-01-23
