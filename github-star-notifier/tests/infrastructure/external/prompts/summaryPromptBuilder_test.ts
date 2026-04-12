/**
 * プロンプトビルダーのテスト
 */

import { assert, assertEquals } from 'jsr:@std/assert@^1.0.15';
import { SUMMARY_RULES } from '../../../../src/config/constants.ts';
import {
  buildSummarySystemPrompt,
  buildSummaryUserMessage,
  formatEndingPatterns,
} from '../../../../src/infrastructure/external/prompts/summaryPromptBuilder.ts';
import {
  buildValidationSystemPrompt,
  buildValidationUserMessage,
} from '../../../../src/infrastructure/external/prompts/validationPromptBuilder.ts';

// --- formatEndingPatterns ---

Deno.test('formatEndingPatterns - カテゴリ別にフォーマットされる', () => {
  const categories = {
    伝聞系: ['らしい', 'やつ'] as const,
    推測系: ['かも'] as const,
  };
  const result = formatEndingPatterns(categories);
  assert(result.includes('- 伝聞系: 「〜らしい」「〜やつ」'));
  assert(result.includes('- 推測系: 「〜かも」'));
});

// --- buildSummarySystemPrompt ---

Deno.test('buildSummarySystemPrompt - MAX_LENGTHが定数から反映される', () => {
  const prompt = buildSummarySystemPrompt();
  assert(
    prompt.includes(`${SUMMARY_RULES.MAX_LENGTH}文字以内`),
    'プロンプトにMAX_LENGTHが含まれる',
  );
});

Deno.test('buildSummarySystemPrompt - 1文目の文末パターンが含まれる', () => {
  const prompt = buildSummarySystemPrompt();
  for (const [category, patterns] of Object.entries(SUMMARY_RULES.FIRST_SENTENCE_ENDINGS)) {
    assert(prompt.includes(category), `カテゴリ「${category}」が含まれる`);
    for (const pattern of patterns) {
      assert(prompt.includes(`〜${pattern}`), `パターン「〜${pattern}」が含まれる`);
    }
  }
});

Deno.test('buildSummarySystemPrompt - 2文目の文末パターンが含まれる', () => {
  const prompt = buildSummarySystemPrompt();
  for (const [category, patterns] of Object.entries(SUMMARY_RULES.SECOND_SENTENCE_ENDINGS)) {
    assert(prompt.includes(category), `カテゴリ「${category}」が含まれる`);
    for (const pattern of patterns) {
      assert(prompt.includes(`〜${pattern}`), `パターン「〜${pattern}」が含まれる`);
    }
  }
});

Deno.test('buildSummarySystemPrompt - フィードバックなしでは修正指示が含まれない', () => {
  const prompt = buildSummarySystemPrompt();
  assert(!prompt.includes('重要な修正指示'));
});

Deno.test('buildSummarySystemPrompt - フィードバックありで修正指示が追記される', () => {
  const feedback = '句読点が含まれています';
  const prompt = buildSummarySystemPrompt(feedback);
  assert(prompt.includes('重要な修正指示'));
  assert(prompt.includes(feedback));
});

Deno.test('buildSummarySystemPrompt - Few-shot例が含まれる', () => {
  const prompt = buildSummarySystemPrompt();
  assert(prompt.includes('facebook/react:'));
  assert(prompt.includes('astral-sh/ruff:'));
  assert(prompt.includes('denoland/deno:'));
  assert(prompt.includes('takaishi/tftargets:'));
});

// --- buildSummaryUserMessage ---

Deno.test('buildSummaryUserMessage - URLありの場合はURL指示メッセージを返す', () => {
  const message = buildSummaryUserMessage('https://github.com/denoland/deno', 'テキスト');
  assert(message.includes('https://github.com/denoland/deno'));
  assert(message.includes('要約してください'));
});

Deno.test('buildSummaryUserMessage - URLなしの場合はテキストをそのまま返す', () => {
  const message = buildSummaryUserMessage(undefined, 'テキストコンテンツ');
  assertEquals(message, 'テキストコンテンツ');
});

Deno.test('buildSummaryUserMessage - 両方なしの場合は空文字を返す', () => {
  const message = buildSummaryUserMessage(undefined, undefined);
  assertEquals(message, '');
});

// --- buildValidationSystemPrompt ---

Deno.test('buildValidationSystemPrompt - MAX_LENGTHが定数から反映される', () => {
  const prompt = buildValidationSystemPrompt();
  assert(prompt.includes(`${SUMMARY_RULES.MAX_LENGTH}文字以内`));
});

Deno.test('buildValidationSystemPrompt - 文末パターンが生成プロンプトと一致する', () => {
  const summaryPrompt = buildSummarySystemPrompt();
  const validationPrompt = buildValidationSystemPrompt();

  for (const patterns of Object.values(SUMMARY_RULES.FIRST_SENTENCE_ENDINGS)) {
    for (const pattern of patterns) {
      assert(
        summaryPrompt.includes(`〜${pattern}`),
        `生成プロンプトに「〜${pattern}」が含まれる`,
      );
      assert(
        validationPrompt.includes(`〜${pattern}`),
        `検証プロンプトに「〜${pattern}」が含まれる`,
      );
    }
  }

  for (const patterns of Object.values(SUMMARY_RULES.SECOND_SENTENCE_ENDINGS)) {
    for (const pattern of patterns) {
      assert(
        summaryPrompt.includes(`〜${pattern}`),
        `生成プロンプトに「〜${pattern}」が含まれる`,
      );
      assert(
        validationPrompt.includes(`〜${pattern}`),
        `検証プロンプトに「〜${pattern}」が含まれる`,
      );
    }
  }
});

Deno.test('buildValidationSystemPrompt - 有効なJSON例が含まれる', () => {
  const prompt = buildValidationSystemPrompt();
  assert(prompt.includes('{"isValid": true, "feedback": ""}'));
  assert(prompt.includes('{"isValid": false, "feedback":'));
});

Deno.test('buildValidationSystemPrompt - 検証手順が明示されている', () => {
  const prompt = buildValidationSystemPrompt();
  assert(prompt.includes('検証手順'));
  assert(prompt.includes('二文構成か確認'));
  assert(prompt.includes('文末が許可パターンに一致するか'));
  assert(prompt.includes('文字数を確認'));
});

// --- buildValidationUserMessage ---

Deno.test('buildValidationUserMessage - サマリーテキストがラップされる', () => {
  const summary = 'テスト用サマリー\nテスト用2文目';
  const message = buildValidationUserMessage(summary);
  assert(message.includes('検証してください'));
  assert(message.includes(summary));
});
