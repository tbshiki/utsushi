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
| フレームワークプリセット | なし |
| ビルドコマンド | (空欄) |
アナリティクスを使わない場合でも `node scripts/inject-analytics.js` をビルドコマンドに設定することを推奨します。
| ビルド出力ディレクトリ | /(空欄) |


「保存してデプロイ」をクリック
デプロイ完了まで数分待機
`https://utsushi.pages.dev` のようなURLが発行される


### カスタムドメイン設定（オプション）

1. Pagesプロジェクトの「カスタムドメイン」タブ
2. 「カスタムドメインを設定」をクリック
3. 使用したいドメインを入力
4. DNS設定を行う

### 環境変数

アナリティクス機能を有効にするには、以下の環境変数を設定してください：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `GA_MEASUREMENT_ID` | Google Analytics 測定ID | `G-XXXXXXXXXX` |
| `CLARITY_PROJECT_ID` | Microsoft Clarity プロジェクトID | `abcdefghij` |

**Cloudflare Pages での設定方法：**
1. Cloudflare Dashboard > Pages > utsushi プロジェクト
2. 「設定」タブ > 「環境変数」
3. 「変数を追加」で上記の変数を設定
4. 「本番環境」にのみ設定することを推奨

**ビルドコマンドの設定：**
環境変数を設定した場合、ビルドコマンドを以下に変更してください：

| 項目 | 設定値 |
|------|--------|
| ビルドコマンド | `node scripts/inject-analytics.js` |
| ビルド出力ディレクトリ | `.` |

> **注意**: 環境変数が設定されていない場合、アナリティクス機能は無効になります（プレースホルダーは削除されます）。
> **注意**: CSPのnonceを適用するため、アナリティクスを使わない場合でも `node scripts/inject-analytics.js` をビルドコマンドに設定することを推奨します。

### 注意事項

- Functions（サーバーレス関数）は不要
- Workers連携は不要
- すべて静的配信で完結
- CDNスクリプトのバージョンを変更した場合は、SRIハッシュも更新する

---

最終更新: 2026-01-23
