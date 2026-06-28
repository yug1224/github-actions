# GitHub Actions

個人用の GitHub Actions を集めるモノレポです。

## サブプロジェクト

| ディレクトリ                                      | 説明                                          |
| ------------------------------------------------- | --------------------------------------------- |
| [github-star-notifier](./github-star-notifier/)   | GitHub スター RSS を Bluesky / Webhook に通知 |
| [rss-feed-notifier](./rss-feed-notifier/)         | RSS フィード新着を Bluesky に通知             |
| [link-insight-notifier](./link-insight-notifier/) | 任意 URL を要約して Bluesky に投稿            |

## 必要な環境

- [mise](https://mise.jdx.dev/)（Node.js 26 / pnpm 11.9.0）
- [Vite+ `vp`](https://viteplus.dev/)（任意。`pnpm exec vp` でも可）

## セットアップ

```bash
mise trust
mise install
pnpm install
```

## 開発コマンド（ルート）

```bash
pnpm run check      # Oxfmt + Oxlint + 型チェック（CI と同じフルチェック）
pnpm run check:fix  # フォーマット自動修正 + Lint + 型チェック
pnpm run test       # Vitest（全プロジェクト）
pnpm run test:github-star-notifier
pnpm run test:rss-feed-notifier
pnpm run typecheck  # tsc --noEmit（手動実行用）
```

## Git hooks（lefthook）

| フック     | コマンド                                                      | 役割                                               |
| ---------- | ------------------------------------------------------------- | -------------------------------------------------- |
| pre-commit | `pnpm exec vp lint --fix` / `pnpm exec vp fmt`                | ステージ済みファイルの lint 自動修正とフォーマット |
| pre-push   | `pnpm exec vp check --no-fmt --no-lint` → `pnpm exec vp test` | 型チェックとテスト                                 |

## CI / GitHub Actions

CI と notifier デプロイ workflow は `pnpm/action-setup` + `actions/setup-node` で Node / pnpm をセットアップする（`setup-vp` は使用しない）。

| workflow      | 実行内容                                                              |
| ------------- | --------------------------------------------------------------------- |
| CI            | `pnpm install --frozen-lockfile` → `pnpm run check` → `pnpm run test` |
| Notifier 各種 | `pnpm install --frozen-lockfile` → `dotenvx run -- pnpm start`        |

## 依存関係の自動更新（Dependabot）

[`.github/dependabot.yml`](.github/dependabot.yml) により、以下を Dependabot が監視します。

| 対象                                   | ecosystem        |
| -------------------------------------- | ---------------- |
| GitHub Actions（`.github/workflows/`） | `github-actions` |
| npm パッケージ（pnpm モノレポ）        | `npm`            |

- **スケジュール**: 毎週
- **cooldown**: 7 日（version updates のみ。セキュリティ更新 PR は猶予なし）
- **手動管理**: Node.js / pnpm（[`.mise.toml`](.mise.toml)、`packageManager`）、dotenvx（ワークフロー内 curl インストール）

## 各 Notifier の実行

各 notifier は Vite の [Module Runner](https://vite.dev/guide/api-environment-runtimes)（`runnerImport`）経由で TypeScript を実行します。共通ランナーは [`scripts/run-module-runner.mjs`](scripts/run-module-runner.mjs) です。

```bash
cd github-star-notifier
dotenvx run -- pnpm start
```
