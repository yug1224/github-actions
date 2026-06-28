# Link Insight Notifier

任意 URL を要約し、Bluesky と Webhook（X 投稿用）に通知する。

## Dev environment tips

- モノレポルートで `mise install && pnpm install` 済みであること
- このディレクトリで `.env` を作成する
- **DDD 未採用**: `src/` 直下のフラット構成。無理にレイヤー分割しない
- 設計詳細は `.cursor/rules/domain-rules.mdc` を参照

## 実行

```bash
dotenvx run -- pnpm start
```

`LINK` 環境変数に対象 URL を指定する（GitHub Actions から渡される想定）。

## 環境変数

| 変数                 | 必須   | 説明                               |
| -------------------- | ------ | ---------------------------------- |
| `LINK`               | はい   | 要約・投稿対象の URL               |
| `BLUESKY_IDENTIFIER` | はい   | Bluesky ハンドル                   |
| `BLUESKY_PASSWORD`   | はい   | Bluesky アプリパスワード           |
| `GOOGLE_AI_API_KEY`  | はい   | Google Gemini API キー（要約生成） |
| `GEMINI_MODEL`       | いいえ | デフォルト `gemini-2.0-flash-lite` |
| `WEBHOOK_URL`        | いいえ | X 投稿用 Webhook URL               |
| `CHROME_PATH`        | いいえ | PDF 生成用 Chrome 実行パス         |

## URL 種別による処理分岐

- YouTube URL → `createYouTubeSummary`
- PDF / Speaker Deck / Docswell → `createPDF` → `createPDFSummary`（40MB 未満のみ）
- その他 → `extractReadableContent` → `createSummary`

## Testing instructions

```bash
pnpm run type:check   # 型チェック（モノレポ全体、ルート経由）
```

- Vitest プロジェクト未登録。テスト追加時はルート `vite.config.ts` への登録を検討する
- マージ前はルートで `pnpm run fmt:check && pnpm run lint:check && pnpm run type:check` を通す
