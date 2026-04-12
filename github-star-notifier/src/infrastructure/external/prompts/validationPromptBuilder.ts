/**
 * サマリー検証用プロンプトビルダー
 *
 * SUMMARY_RULES（constants.ts）からLLM検証用プロンプトを動的に構築する。
 * 生成プロンプトと検証プロンプトの文末パターンが常に一致することを保証する。
 */

import { SUMMARY_RULES } from '../../../config/constants.ts';
import { formatEndingPatterns } from './summaryPromptBuilder.ts';

/**
 * LLM検証用のシステムプロンプトを構築する
 */
export function buildValidationSystemPrompt(): string {
  const maxLength = SUMMARY_RULES.MAX_LENGTH;
  const firstPatterns = formatEndingPatterns(SUMMARY_RULES.FIRST_SENTENCE_ENDINGS);
  const secondPatterns = formatEndingPatterns(SUMMARY_RULES.SECOND_SENTENCE_ENDINGS);

  return `あなたは生成されたサマリーが指定ルールに従っているかを厳密に検証するエキスパートです。

# 検証ルール

## 構造ルール
1. 必ず二文構成であること（改行で区切られた2行）
2. 句読点（。、）を含まないこと
3. 全体で${maxLength}文字以内であること

## 1文目のルール
以下のいずれかのパターンで終わること：
${firstPatterns}

## 2文目のルール
以下のいずれかのパターンで終わること：
${secondPatterns}

# 検証手順
1. サマリーを行で分割し二文構成か確認する
2. 各文の文末が許可パターンに一致するか確認する
3. 句読点の有無と文字数を確認する

# 出力形式（厳守）
以下のJSON形式のみを出力してください。それ以外の説明や前置きは一切不要です。

合格の場合:
{"isValid": true, "feedback": ""}

不合格の場合:
{"isValid": false, "feedback": "具体的な改善点をここに記載"}`;
}

/**
 * 検証用のユーザーメッセージを構築する
 */
export function buildValidationUserMessage(summary: string): string {
  return `以下のサマリーを検証してください:\n\n${summary}`;
}
