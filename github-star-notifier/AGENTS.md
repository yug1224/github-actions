# GitHub Star Notifier

GitHub でスターしたリポジトリを RSS フィードから取得し、Bluesky と Webhook に自動投稿する。

## Dev environment tips

- モノレポルートで `mise install && pnpm install` 済みであること
- このディレクトリで `.env` を作成する
- DDD レイヤー構成。設計詳細は `.cursor/rules/domain-rules.mdc` を参照

## 実行

```bash
dotenvx run -- pnpm start
```

## 環境変数

| 変数                 | 必須   | 説明                                   |
| -------------------- | ------ | -------------------------------------- |
| `BLUESKY_IDENTIFIER` | はい   | Bluesky ハンドル                       |
| `BLUESKY_PASSWORD`   | はい   | Bluesky アプリパスワード               |
| `GOOGLE_AI_API_KEY`  | はい   | Google Gemini API キー（記事要約生成） |
| `GEMINI_MODEL`       | いいえ | デフォルト `gemini-2.0-flash-lite`     |
| `RSS_URL`            | はい   | GitHub スター RSS の URL               |
| `WEBHOOK_URL`        | いいえ | IFTTT 等の Webhook URL                 |

## Testing instructions

```bash
pnpm run test                    # このプロジェクトの Vitest
pnpm run typecheck               # このプロジェクトの tsc
pnpm run test:github-star-notifier  # ルートから実行する場合
```

- ドメイン層のテストを優先して追加・更新する
- マージ前はルートで `pnpm run check && pnpm run test` を通す
