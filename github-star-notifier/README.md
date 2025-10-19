# GitHub Star Notifier

GitHubでスターしたリポジトリをRSSフィードから取得し、Blueskyと Webhookに自動投稿するツールです。

## 特徴

- 📡 GitHub RSSフィードからスター情報を取得
- 🤖 Google Gemini AIによる記事要約の自動生成
- 🦋 Blueskyへの自動投稿（OGP画像付き）
- 🪝 Webhook経由での通知（IFTTT等）
- 🖼️ 画像の自動最適化（AVIF形式）
- ♻️ リトライ機能による堅牢な処理
- 📝 構造化ログによる詳細な実行記録

## 必要な環境

- [Deno](https://deno.land/) v1.40以上

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/yourusername/github-actions.git
cd github-actions/github-star-notifier
```

### 2. 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定してください：

```env
# Bluesky認証情報（必須）
BLUESKY_IDENTIFIER=your.handle.bsky.social
BLUESKY_PASSWORD=your-app-password

# Google AI API（必須）
GOOGLE_AI_API_KEY=your-google-ai-api-key
GEMINI_MODEL=gemini-2.0-flash-lite

# GitHub RSS Feed URL（必須）
RSS_URL=https://github.com/yourusername.atom

# Webhook URL（オプション - IFTTTなど）
WEBHOOK_URL=https://maker.ifttt.com/trigger/your-event/with/key/your-key
```

### 3. 依存関係のインストール

```bash
deno cache main.ts
```

## 使い方

### 基本的な実行

```bash
deno run --allow-env --allow-net --allow-read --allow-write main.ts
```

### テストの実行

```bash
# 全テストを実行
deno task test

# ウォッチモードでテストを実行
deno task test:watch

# カバレッジレポートを生成
deno task test:coverage

# HTML形式のカバレッジレポートを生成
deno task test:coverage:html
```

### コードフォーマット

```bash
deno fmt
```

### リンター

```bash
deno lint
```

## プロジェクト構造

```
github-star-notifier/
├── src/
│   ├── config/                  # 設定ファイル
│   │   ├── constants.ts         # 定数定義
│   │   └── env.ts               # 環境変数の検証
│   ├── types/                   # 型定義
│   │   └── index.ts
│   ├── utils/                   # ユーティリティ
│   │   ├── errors.ts            # エラークラス
│   │   ├── logger.ts            # ロギング
│   │   ├── retry.ts             # リトライ処理
│   │   └── url.ts               # URL処理
│   ├── extractArticleContent.ts # 記事本文の抽出
│   ├── fetchFeedItems.ts        # RSSフィード取得
│   ├── fetchOpenGraphData.ts    # OGPデータ取得
│   ├── formatBlueskyPost.ts     # Bluesky投稿フォーマット
│   ├── formatWebhookMessage.ts  # Webhook メッセージフォーマット
│   ├── generateSummary.ts       # AI要約生成
│   ├── processImage.ts          # 画像処理
│   ├── publishToBluesky.ts      # Bluesky投稿
│   └── sendWebhookNotification.ts # Webhook通知送信
├── tests/                       # テストコード
│   ├── config/
│   ├── utils/
│   ├── formatBlueskyPost_test.ts
│   └── formatWebhookMessage_test.ts
├── data/                        # 実行時データ
│   └── .timestamp               # 最終実行時刻
├── temp/                        # 一時ファイル
├── main.ts                      # エントリーポイント
├── deno.jsonc                   # Deno設定
└── README.md
```

## 主な機能

### RSSフィード監視

- GitHubのRSSフィードから新しいスター情報を取得
- タイムスタンプベースの重複チェック
- "starred"キーワードによるフィルタリング

### AI要約生成

- Google Gemini AIを使用した記事要約の自動生成
- 100文字以内の簡潔な日本語要約
- URLコンテキストとGoogle検索機能を活用

### Bluesky投稿

- リッチテキスト形式での投稿
- OGP画像の自動取得と最適化
- リンクプレビューの自動生成
- リトライ機能による安定した投稿

### 画像処理

- ImageMagickによる画像リサイズ
- AVIF形式への自動変換
- ファイルサイズの最適化（約976KB以下）
- 品質の自動調整

### エラーハンドリング

- カスタムエラークラスによる詳細なエラー情報
- リトライ機能による一時的なエラーの自動回復
- 構造化ログによるデバッグ支援

## 設定のカスタマイズ

`src/config/constants.ts`で以下の設定を変更できます：

```typescript
// 投稿設定
export const MAX_POST_COUNT = 3; // 1回の実行で投稿する最大数
export const MAX_FEED_ITEMS = 20; // RSSから取得する最大アイテム数

// 画像設定
export const IMAGE_CONFIG = {
  MAX_WIDTH: 2000,
  MAX_HEIGHT: 2000,
  MAX_BYTE_LENGTH: 976_560, // 約976.56KB
  MIME_TYPE: 'image/avif',
};

// リトライ設定
export const RETRY_CONFIG = {
  SUMMARY_MAX_RETRIES: 5,
  IMAGE_UPLOAD_MAX_RETRIES: 3,
  IMAGE_FETCH_MAX_RETRIES: 5,
  IMAGE_UPLOAD_TIMEOUT_MS: 10000,
};
```

## トラブルシューティング

### エラー: "Missing required environment variables"

環境変数が正しく設定されているか確認してください。`.env`ファイルが存在し、必須の変数が全て設定されている必要があります。

### エラー: "Authentication failed for Bluesky"

Blueskyのアプリパスワードが正しいか確認してください。通常のパスワードではなく、アプリパスワードを使用する必要があります。

### 画像のアップロードに失敗する

- ネットワーク接続を確認
- 画像のサイズ制限（976KB以下）を確認
- リトライ設定を調整

### タイムスタンプファイルが見つからない

初回実行時は自動的に作成されます。手動で作成する場合は：

```bash
mkdir -p data
echo "0" > data/.timestamp
```

## GitHub Actions での使用

`.github/workflows/star-notifier.yml`の例：

```yaml
name: GitHub Star Notifier

on:
  schedule:
    - cron: '0 */6 * * *' # 6時間ごとに実行
  workflow_dispatch: # 手動実行も可能

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x

      - name: Run notifier
        env:
          BLUESKY_IDENTIFIER: ${{ secrets.BLUESKY_IDENTIFIER }}
          BLUESKY_PASSWORD: ${{ secrets.BLUESKY_PASSWORD }}
          GOOGLE_AI_API_KEY: ${{ secrets.GOOGLE_AI_API_KEY }}
          GEMINI_MODEL: gemini-2.0-flash-lite
          RSS_URL: ${{ secrets.RSS_URL }}
          WEBHOOK_URL: ${{ secrets.WEBHOOK_URL }}
        run: |
          cd github-star-notifier
          deno run --allow-env --allow-net --allow-read --allow-write main.ts
```

## 貢献

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## ライセンス

[MIT License](../LICENSE)

## 関連リンク

- [Bluesky API Documentation](https://docs.bsky.app/)
- [Google Gemini API](https://ai.google.dev/)
- [Deno Documentation](https://deno.land/manual)
