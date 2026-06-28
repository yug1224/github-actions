# RSS Feed Notifier

RSSフィードを監視し、新着記事を Bluesky に自動投稿するアプリケーションです。

## 機能

- RSSフィードの定期監視
- 新着記事の自動検出
- Bluesky への自動投稿（OGP画像付き）
- 投稿時間制御（UTC 1:00-15:00 のみ投稿）
- 未投稿記事の自動リトライ

## アーキテクチャ

このプロジェクトは **ドメイン駆動設計（DDD）** のプラクティスに従っています。

### レイヤー構造

```
src/
├── domain/              # ドメイン層（ビジネスロジック）
│   ├── models/         # エンティティとValue Object
│   └── repositories/   # リポジトリインターフェース
├── application/         # アプリケーション層（ユースケース）
│   ├── usecases/       # ビジネスユースケース
│   └── formatters/     # データフォーマッター
├── infrastructure/      # インフラストラクチャ層（技術的詳細）
│   ├── repositories/   # リポジトリ実装
│   └── external/       # 外部サービスクライアント
├── config/             # 設定
└── utils/              # ユーティリティ
```

詳細なアーキテクチャについては `.cursor/rules/domain-rules.mdc` を参照してください。

## セットアップ

### 必要な環境

- Node.js 26（[mise](https://mise.jdx.dev/) 推奨）
- pnpm 11
- モノレポルートで `pnpm install` 済みであること

### セットアップ

モノレポルートの [README](../README.md) を参照してください。

```bash
cd ..  # リポジトリルート
mise install && pnpm install
cd rss-feed-notifier
```

### 実行

```bash
dotenvx run -- pnpm start
```

### テスト

```bash
pnpm run test
```

### その他のコマンド

```bash
pnpm run check       # モノレポ全体（フォーマット + Lint + 型チェック）
pnpm run check:fix   # 同上（フォーマット自動修正）
pnpm run typecheck   # このプロジェクトのみ
```

### 環境変数

`.env` ファイルを作成し、以下の環境変数を設定してください：

```env
# RSS フィード URL（必須）
RSS_URL=https://example.com/feed.xml

# Bluesky 認証情報（必須）
BLUESKY_IDENTIFIER=your-handle.bsky.social
BLUESKY_PASSWORD=your-app-password
```

## 動作仕様

### 投稿制御

- 24時間いつでも投稿処理を実行する
- 1回の実行では処理時間予算（10分）以内でキューを消化する
- 予算内に処理しきれない記事は `.itemList.json` に残り、次回実行時に継続処理される

### データ保存

- `.timestamp`: 最終取得タイムスタンプ
- `.itemList.json`: 未投稿記事のリスト
- `*.avif`: 一時画像ファイル（デバッグ用に保持）

### エラーハンドリング

- 処理中にエラーが発生した場合、現在のアイテムを未投稿リストに戻して保存
- 次回実行時に自動的にリトライされます

## 開発

### コーディング規約

- **日本語でコメントとドキュメントを記述**
- DDDのプラクティスに従う
- ユビキタス言語を徹底する
- レイヤーアーキテクチャを遵守

詳細は以下のルールを参照：

- `@development-basic-rule.mdc`: 開発基本ルール
- `@github-star-notifier/domain-rules`: ドメインルール

## ライセンス

MIT License
