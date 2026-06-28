# RSS Feed Notifier

RSS フィードを監視し、新着記事を Bluesky に自動投稿する。

## Dev environment tips

- モノレポルートで `mise install && pnpm install` 済みであること
- このディレクトリで `.env` を作成する
- DDD レイヤー構成。設計詳細は `.cursor/rules/domain-rules.mdc` を参照

## 実行

```bash
dotenvx run -- pnpm start
```

## 環境変数

| 変数                 | 必須 | 説明                        |
| -------------------- | ---- | --------------------------- |
| `RSS_URL`            | はい | 監視対象の RSS フィード URL |
| `BLUESKY_IDENTIFIER` | はい | Bluesky ハンドル            |
| `BLUESKY_PASSWORD`   | はい | Bluesky アプリパスワード    |

## Testing instructions

```bash
pnpm run test                  # このプロジェクトの Vitest
pnpm run type:check            # 型チェック（モノレポ全体、ルート経由）
pnpm run test:rss-feed-notifier  # ルートから実行する場合
```

- ドメイン層のテストを優先して追加・更新する
- マージ前はルートで `pnpm run fmt:check && pnpm run lint:check && pnpm run type:check && pnpm run test` を通す
