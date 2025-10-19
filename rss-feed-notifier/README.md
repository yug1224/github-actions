# RSS Feed Notifier

RSSフィードを監視し、新着記事を Bluesky と Webhook（X連携）に自動投稿するアプリケーションです。

## 機能

- RSSフィードの定期監視
- 新着記事の自動検出
- Bluesky への自動投稿（OGP画像付き）
- Webhook 経由での通知（X連携など）
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

- Deno 2.0 以上

### 環境変数

`.env` ファイルを作成し、以下の環境変数を設定してください：

```env
# RSS フィード URL（必須）
RSS_URL=https://example.com/feed.xml

# Bluesky 認証情報（必須）
BLUESKY_IDENTIFIER=your-handle.bsky.social
BLUESKY_PASSWORD=your-app-password

# Webhook URL（任意：X連携など）
WEBHOOK_URL=https://maker.ifttt.com/trigger/...
```

### インストール

```bash
# 依存関係のインストール（初回のみ）
deno cache main.ts
```

## 使い方

### 実行

```bash
# 通常実行
deno task start

# 開発モード（ファイル変更を監視）
deno task dev
```

### その他のコマンド

```bash
# 型チェック
deno task check

# フォーマット
deno task fmt

# フォーマットチェック
deno task fmt:check

# Lint
deno task lint

# テスト
deno task test
```

## 動作仕様

### 投稿時間制御

- 投稿可能時間: UTC 1:00 〜 15:00（日本時間 10:00 〜 24:00）
- この時間帯以外は実行しても投稿されません

### 投稿制限

- 1回の実行で最大 3 件まで投稿
- 残りの記事は次回実行時に処理されます

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

### テスト

```bash
deno task test
```

## ライセンス

MIT License
