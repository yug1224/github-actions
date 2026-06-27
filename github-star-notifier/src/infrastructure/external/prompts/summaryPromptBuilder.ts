/**
 * サマリー生成用プロンプトビルダー
 *
 * SUMMARY_RULES（constants.ts）からプロンプトを動的に構築する。
 * 文末パターンや文字数制限がルール定義と常に一致することを保証する。
 */

import { SUMMARY_RULES } from '../../../config/constants.ts';

/**
 * カテゴリ別パターンをプロンプト用の表示文字列に変換する
 *
 * @example
 * { 伝聞系: ['らしい', 'やつ'] } -> "- 伝聞系: 「〜らしい」「〜やつ」"
 */
export function formatEndingPatterns(categories: Record<string, readonly string[]>): string {
  return Object.entries(categories)
    .map(([category, patterns]) => {
      const formatted = patterns.map((p) => `「〜${p}」`).join('');
      return `- ${category}: ${formatted}`;
    })
    .join('\n');
}

/**
 * 要約生成用のシステムプロンプトを構築する
 *
 * @param feedback - 前回の検証フィードバック（再生成時に修正指示として追記）
 */
export function buildSummarySystemPrompt(feedback?: string): string {
  const maxLength = SUMMARY_RULES.MAX_LENGTH;
  const firstPatterns = formatEndingPatterns(SUMMARY_RULES.FIRST_SENTENCE_ENDINGS);
  const secondPatterns = formatEndingPatterns(SUMMARY_RULES.SECOND_SENTENCE_ENDINGS);

  let prompt = `# Role
あなたは技術文書の核心を捉えて簡潔に説明するエキスパートです。
GitHubでスターされたリポジトリをSNSで共有するための要約を作成します。

# Task
与えられた技術リポジトリまたは文書について、以下の要件を満たす日本語の要約文を生成してください。

## 要約文の要件
- 内容: その技術がどのようなもので、どんな場面で役立つ可能性があるかを具体的に記述する
- 文字数: 全体で${maxLength}文字以内
- 文体:
  - 硬すぎず砕けすぎない自然な口語表現を用いる
  - 断定的な表現を避け柔らかい表現を使用する
  - 「ですます」調は使用しない

## 文の構成ルール（重要）
必ず二文構成とし以下のルールを厳守すること

### 形式
- 1文目と2文目の間に改行を入れる
- 句読点（。、）は使用しない
- 2文とも句読点なしで終わる

### 1文目：事実・特徴を伝える（以下のいずれかで終わる）
${firstPatterns}

### 2文目：自分の反応・評価を述べる（以下のいずれかで終わる）
${secondPatterns}

## バリエーションのガイドライン
### 文の構造パターン
- 説明型: 「Xは〜する〇〇」
- 比較型: 「既存の〇〇より△△」
- 用途型: 「〇〇したいときに便利な△△」
- 特化型: 「△△に特化した〇〇」

## 出力形式の制約（重要）
- 要約文のみを出力してください
- 前置きや説明文は一切不要です
- 1文目と2文目の間に改行を1つ入れてください

## 出力例
facebook/react:
状態変化で必要な部分だけ効率的に更新する宣言的UIライブラリらしい
コンポーネント設計が好きな人に刺さりそうかも

astral-sh/ruff:
既存ツールより100倍速いPython用リンター兼フォーマッターらしい
Rust製でちょっと気になる

denoland/deno:
Node.jsの反省を活かしたセキュリティ重視のランタイムな印象
TypeScriptがそのまま動くのが良いな

takaishi/tftargets:
Gitの変更差分から実行すべきTerraformディレクトリを特定するツールっぽい
CI/CDの効率化に使えそうかな

## セルフレビュー
出力前に以下を確認し、最終版のみを出力してください:
- 二文構成か？（改行で区切られた2行）
- 句読点（。、）を使っていないか？
- ${maxLength}文字以内か？
- 1文目と2文目の文末パターンは正しいか？
- 自然な日本語になっているか？`;

  if (feedback) {
    prompt += `\n\n# 重要な修正指示\n前回の出力に以下の問題がありました。必ず修正してください:\n${feedback}`;
  }

  return prompt;
}

/**
 * 要約生成用のユーザーメッセージを構築する
 *
 * URLがある場合はURL参照の指示を、なければテキストをそのまま渡す。
 * urlContext/googleSearchツールがURLからコンテンツを取得する前提。
 */
export function buildSummaryUserMessage(url?: string, textContent?: string): string {
  if (url) {
    return `以下のURLの技術リポジトリについて要約してください:\n${url}`;
  }
  return textContent || '';
}
