# AGENTS Guidelines for This Repository

個人用 GitHub Actions モノレポ。3 つの notifier パッケージを pnpm workspace で管理する。

## Dev environment tips

- 初回セットアップ: `mise trust && mise install && pnpm install`
- mise の Node/pnpm を優先する: `vp env off`（初回のみ）
- サブプロジェクトへ移動して作業する。ルートから `pnpm --filter <package-name>` でも実行可能
- 各パッケージ名は各ディレクトリの `package.json` の `name` フィールドを参照

## Subprojects

| ディレクトリ             | 説明                                          |
| ------------------------ | --------------------------------------------- |
| `github-star-notifier/`  | GitHub スター RSS を Bluesky / Webhook に通知 |
| `rss-feed-notifier/`     | RSS フィード新着を Bluesky に通知             |
| `link-insight-notifier/` | 任意 URL を要約して Bluesky に投稿            |

各サブプロジェクトの起動方法・環境変数は、それぞれの `AGENTS.md` を参照。

## Commands

| コマンド                             | 用途                                     |
| ------------------------------------ | ---------------------------------------- |
| `pnpm run check`                     | Oxfmt + Oxlint + tsc 型チェック（全体）  |
| `pnpm run check:fix`                 | フォーマット自動修正 + Lint + 型チェック |
| `pnpm run test`                      | Vitest（全プロジェクト）                 |
| `pnpm run test:github-star-notifier` | github-star-notifier のみテスト          |
| `pnpm run test:rss-feed-notifier`    | rss-feed-notifier のみテスト             |
| `pnpm run typecheck`                 | 全パッケージの tsc --noEmit              |

## Testing instructions

- CI 定義: `.github/workflows/`
- コミット前: lefthook pre-commit がステージファイルに対し fmt / lint / tsc を実行（glob に一致するファイルのみ）
- プッシュ前: lefthook pre-push が CI と同じ `pnpm run check` → `pnpm run test` → `pnpm run typecheck` を順に実行
- マージ前に `pnpm run check && pnpm run test` を通すこと
- 単体テストの絞り込み: `pnpm exec vitest run --project <project-name> -t "<test name>"`

## PR instructions

- ブランチ名: `type/description`（例: `feat/add-feed-filter`）。詳細は `.cursor/rules/branch-name-rule.mdc`
- コミットメッセージ: 日本語 + Conventional Commits。詳細は `.cursor/rules/commit-message-rule.mdc`
- マージ前チェック: `pnpm run check && pnpm run test`

## Architecture

- DDD レイヤーアーキテクチャに従う（`github-star-notifier`, `rss-feed-notifier`）
- `link-insight-notifier` はフラット構成（DDD 未採用）
- 設計詳細は `.cursor/rules/development-basic-rule.mdc` および各サブプロジェクトの `.cursor/rules/domain-rules.mdc` を参照
