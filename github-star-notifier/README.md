# GitHub Star Notifier

GitHubでスターしたリポジトリをRSSフィードから取得し、Blueskyと Webhookに自動投稿するツールです。

## 特徴

- GitHub RSSフィードからスター情報を取得
- Google Gemini AIによる記事要約の自動生成
- Bluesky への自動投稿（OGP画像付き）
- Webhook 経由での通知（IFTTT等）
- sharp による画像の自動最適化（AVIF形式）
- リトライ機能による堅牢な処理
- 構造化ログによる詳細な実行記録

## 必要な環境

- Node.js 26（[mise](https://mise.jdx.dev/) 推奨）
- pnpm 11
- モノレポルートで `pnpm install` 済みであること

## セットアップ

モノレポルートの [README](../README.md) を参照してください。

```bash
cd ..  # リポジトリルート
mise install && pnpm install
cd github-star-notifier
```

### 環境変数

`.env` ファイルを作成し、以下の環境変数を設定してください：

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

## 実行

```bash
dotenvx run -- pnpm start
```

## 開発コマンド

```bash
pnpm run test        # このプロジェクトの Vitest
pnpm run type:check  # 型チェック（モノレポ全体、ルート経由）
pnpm run lint:check  # Lint（モノレポ全体、ルート経由）
pnpm run fmt:check   # フォーマットチェック（モノレポ全体、ルート経由）
```

ルートから特定プロジェクトだけテストする場合:

```bash
pnpm run test:github-star-notifier
# または
pnpm --filter github-star-notifier test
```

## プロジェクト構造

DDD レイヤーアーキテクチャに従っています。

```
github-star-notifier/
├── src/
│   ├── domain/              # ドメイン層
│   │   ├── models/          # エンティティ・Value Object
│   │   └── repositories/    # リポジトリインターフェース
│   ├── application/         # アプリケーション層
│   │   ├── usecases/        # ユースケース
│   │   └── formatters/      # 投稿フォーマッター
│   ├── infrastructure/      # インフラストラクチャ層
│   │   ├── repositories/    # リポジトリ実装
│   │   └── external/        # 外部サービスクライアント
│   ├── config/              # 設定
│   ├── types/               # 型定義
│   └── utils/               # ユーティリティ
├── tests/                   # Vitest テスト
├── data/                    # 実行時データ（.timestamp）
├── temp/                    # .gitignore 対象（現状 ImageProcessor はディスク出力なし）
├── main.ts                  # エントリーポイント
├── package.json
└── tsconfig.json
```

## 主な機能

### RSSフィード監視

- GitHubのRSSフィードから新しいスター情報を取得
- タイムスタンプベースの重複チェック
- "starred"キーワードによるフィルタリング

### AI要約生成

- Google Gemini AIを使用した記事要約の自動生成
- 100文字以内の簡潔な日本語要約

### Bluesky投稿

- リッチテキスト形式での投稿
- OGP画像の自動取得と最適化
- リトライ機能による安定した投稿

### 画像処理

- **sharp** による in-memory リサイズ
- AVIF形式への自動変換
- ファイルサイズの最適化（約976KB以下）
- 品質の自動調整

## 設定のカスタマイズ

`src/config/constants.ts` で以下の設定を変更できます：

```typescript
export const PROCESSING_TIME_BUDGET_MS = 10 * 60 * 1000;
export const MAX_FEED_ITEMS = 20;

export const IMAGE_CONFIG = {
  MAX_WIDTH: 2000,
  MAX_HEIGHT: 2000,
  MAX_BYTE_LENGTH: 976_560,
  MIME_TYPE: 'image/avif',
};
```

## トラブルシューティング

### エラー: "Missing required environment variables"

`.env` が存在し、必須の変数がすべて設定されているか確認してください。

### エラー: "Authentication failed for Bluesky"

Bluesky のアプリパスワード（通常のパスワードではない）を使用しているか確認してください。

### タイムスタンプファイルが見つからない

初回実行時は自動的に作成されます。手動で作成する場合:

```bash
mkdir -p data
echo "0" > data/.timestamp
```

## GitHub Actions

詳細は [`.github/workflows/github-star-notifier.yml`](../.github/workflows/github-star-notifier.yml) を参照してください。

- Node.js 26 + pnpm 11
- `dotenvx run -- pnpm start` で実行（Vite Module Runner 経由）
- `data/.timestamp` を Actions cache で永続化

## ライセンス

[MIT License](../LICENSE)

## 関連リンク

- [Bluesky API Documentation](https://docs.bsky.app/)
- [Google Gemini API](https://ai.google.dev/)
