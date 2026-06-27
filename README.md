# GitHub Actions

個人用の GitHub Actions を集めるモノレポです。

## サブプロジェクト

| ディレクトリ                                      | 説明                                          |
| ------------------------------------------------- | --------------------------------------------- |
| [github-star-notifier](./github-star-notifier/)   | GitHub スター RSS を Bluesky / Webhook に通知 |
| [rss-feed-notifier](./rss-feed-notifier/)         | RSS フィード新着を Bluesky に通知             |
| [link-insight-notifier](./link-insight-notifier/) | 任意 URL を要約して Bluesky に投稿            |

## 必要な環境

- [mise](https://mise.jdx.dev/)（Node.js 24 / pnpm 11.9.0）
- [Vite+ `vp`](https://viteplus.dev/)（任意。`pnpm exec vp` でも可）

## セットアップ

```bash
mise trust
mise install
vp env off   # mise の Node/pnpm を優先（初回のみ）
pnpm install
```

## 開発コマンド（ルート）

```bash
pnpm run check      # Oxfmt + Oxlint + tsc 型チェック
pnpm run check:fix  # フォーマット自動修正 + Lint + 型チェック
pnpm run test       # Vitest（全プロジェクト）
pnpm run test:github-star-notifier
pnpm run test:rss-feed-notifier
pnpm run typecheck  # tsc --noEmit
```

## 各 Notifier の実行

```bash
cd github-star-notifier
dotenvx run -- pnpm start
```
