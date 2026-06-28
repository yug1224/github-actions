# AGENTS Guidelines for This Repository

個人用 GitHub Actions モノレポ。3 つの notifier パッケージを pnpm workspace で管理する。

## Dev environment tips

- 初回セットアップ（mise）: `mise trust && mise install && pnpm install`
- 初回セットアップ（mise なし）: `pnpm install`
- `.node-version`: Node 26 の正本（mise / CI が参照）
- `packageManager`: pnpm 11.9.0 の厳密ピン
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

| コマンド                             | 用途                            |
| ------------------------------------ | ------------------------------- |
| `pnpm run lint:check`                | Oxlint（全体）                  |
| `pnpm run lint:fix`                  | Oxlint 自動修正（全体）         |
| `pnpm run fmt:check`                 | Oxfmt チェック（全体）          |
| `pnpm run fmt:fix`                   | Oxfmt 自動修正（全体）          |
| `pnpm run type:check`                | 型チェック（全体）              |
| `pnpm run test`                      | Vitest（全プロジェクト）        |
| `pnpm run test:github-star-notifier` | github-star-notifier のみテスト |
| `pnpm run test:rss-feed-notifier`    | rss-feed-notifier のみテスト    |

## Testing instructions

- CI 定義: `.github/workflows/ci.yml`（`fmt` / `lint` / `type` / `test` の 4 並列 job）
- コミット前: lefthook pre-commit がステージ済みファイルに `pnpm run lint:fix` / `pnpm run fmt:fix` を実行
- マージ前に `pnpm run fmt:check && pnpm run lint:check && pnpm run type:check && pnpm run test` を通すこと
- 単体テストの絞り込み: `vp test --project <project-name> -t "<test name>"`

## PR instructions

- ブランチ名: `type/description`（例: `feat/add-feed-filter`）。詳細は `.cursor/rules/branch-name-rule.mdc`
- コミットメッセージ: 日本語 + Conventional Commits。詳細は `.cursor/rules/commit-message-rule.mdc`
- マージ前チェック: `pnpm run fmt:check && pnpm run lint:check && pnpm run type:check && pnpm run test`

## Architecture

- DDD レイヤーアーキテクチャに従う（`github-star-notifier`, `rss-feed-notifier`）
- `link-insight-notifier` はフラット構成（DDD 未採用）
- 設計詳細は `.cursor/rules/development-basic-rule.mdc` および各サブプロジェクトの `.cursor/rules/domain-rules.mdc` を参照
