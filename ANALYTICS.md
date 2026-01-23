# Analytics Configuration

このプロジェクトではアナリティクスIDを環境変数で管理しています。

## 環境変数

| 変数名 | サービス | 取得場所 |
|--------|----------|----------|
| `GA_MEASUREMENT_ID` | Google Analytics 4 | [GA管理画面](https://analytics.google.com/) > 管理 > データストリーム > 測定ID |
| `CLARITY_PROJECT_ID` | Microsoft Clarity | [Clarity](https://clarity.microsoft.com/) > プロジェクト設定 |

## ローカルテスト

ローカルでアナリティクス挿入をテストする場合：

```bash
# 環境変数を設定してスクリプトを実行
GA_MEASUREMENT_ID=G-XXXXXXXXXX CLARITY_PROJECT_ID=abcdefghij node scripts/build.js
```

Windows (PowerShell):
```powershell
$env:GA_MEASUREMENT_ID="G-XXXXXXXXXX"; $env:CLARITY_PROJECT_ID="abcdefghij"; node scripts/build.js
```

## Cloudflare Pages での設定

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にアクセス
2. Pages > utsushi プロジェクトを選択
3. 「設定」タブ > 「環境変数」
4. 以下の変数を追加：
   - `GA_MEASUREMENT_ID`: Google Analytics の測定ID
   - `CLARITY_PROJECT_ID`: Microsoft Clarity のプロジェクトID
5. 環境を「本番環境」のみに設定（プレビュー環境では不要）

## ビルド設定

環境変数設定後、ビルドコマンドを更新：

| 項目 | 値 |
|------|-----|
| ビルドコマンド | `node scripts/build.js` |
| 出力ディレクトリ | `dist` |

## セキュリティ

- トラッキングIDは公開されても問題ありませんが、リポジトリに含めない運用としています
- 本番環境のみにアナリティクスを適用することで、開発時の誤ったデータ収集を防止できます
