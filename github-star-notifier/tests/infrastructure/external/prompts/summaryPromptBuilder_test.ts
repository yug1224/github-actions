/**
 * プロンプトビルダーのテスト
 */

import { test, expect } from 'vitest';
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

test('formatEndingPatterns - カテゴリ別にフォーマットされる', () => {
  const categories = {
    伝聞系: ['らしい', 'やつ'] as const,
    推測系: ['かも'] as const,
  };
  const result = formatEndingPatterns(categories);
  expect(result.includes('- 伝聞系: 「〜らしい」「〜やつ」')).toBeTruthy();
  expect(result.includes('- 推測系: 「〜かも」')).toBeTruthy();
});

// --- buildSummarySystemPrompt ---

test('buildSummarySystemPrompt - MAX_LENGTHが定数から反映される', () => {
  const prompt = buildSummarySystemPrompt();
  expect(prompt.includes(`${SUMMARY_RULES.MAX_LENGTH}文字以内`)).toBeTruthy();
});

test('buildSummarySystemPrompt - 1文目の文末パターンが含まれる', () => {
  const prompt = buildSummarySystemPrompt();
  for (const [category, patterns] of Object.entries(SUMMARY_RULES.FIRST_SENTENCE_ENDINGS)) {
    expect(prompt.includes(category)).toBeTruthy();
    for (const pattern of patterns) {
      expect(prompt.includes(`〜${pattern}`)).toBeTruthy();
    }
  }
});

test('buildSummarySystemPrompt - 2文目の文末パターンが含まれる', () => {
  const prompt = buildSummarySystemPrompt();
  for (const [category, patterns] of Object.entries(SUMMARY_RULES.SECOND_SENTENCE_ENDINGS)) {
    expect(prompt.includes(category)).toBeTruthy();
    for (const pattern of patterns) {
      expect(prompt.includes(`〜${pattern}`)).toBeTruthy();
    }
  }
});

test('buildSummarySystemPrompt - フィードバックなしでは修正指示が含まれない', () => {
  const prompt = buildSummarySystemPrompt();
  expect(prompt.includes('重要な修正指示')).toBeFalsy();
});

test('buildSummarySystemPrompt - フィードバックありで修正指示が追記される', () => {
  const feedback = '句読点が含まれています';
  const prompt = buildSummarySystemPrompt(feedback);
  expect(prompt.includes('重要な修正指示')).toBeTruthy();
  expect(prompt.includes(feedback)).toBeTruthy();
});

test('buildSummarySystemPrompt - Few-shot例が含まれる', () => {
  const prompt = buildSummarySystemPrompt();
  expect(prompt.includes('facebook/react:')).toBeTruthy();
  expect(prompt.includes('astral-sh/ruff:')).toBeTruthy();
  expect(prompt.includes('denoland/deno:')).toBeTruthy();
  expect(prompt.includes('takaishi/tftargets:')).toBeTruthy();
});

// --- buildSummaryUserMessage ---

test('buildSummaryUserMessage - URLありの場合はURL指示メッセージを返す', () => {
  const message = buildSummaryUserMessage('https://github.com/denoland/deno', 'テキスト');
  expect(message.includes('https://github.com/denoland/deno')).toBeTruthy();
  expect(message.includes('要約してください')).toBeTruthy();
});

test('buildSummaryUserMessage - URLなしの場合はテキストをそのまま返す', () => {
  const message = buildSummaryUserMessage(undefined, 'テキストコンテンツ');
  expect(message).toBe('テキストコンテンツ');
});

test('buildSummaryUserMessage - 両方なしの場合は空文字を返す', () => {
  const message = buildSummaryUserMessage(undefined, undefined);
  expect(message).toBe('');
});

// --- buildValidationSystemPrompt ---

test('buildValidationSystemPrompt - MAX_LENGTHが定数から反映される', () => {
  const prompt = buildValidationSystemPrompt();
  expect(prompt.includes(`${SUMMARY_RULES.MAX_LENGTH}文字以内`)).toBeTruthy();
});

test('buildValidationSystemPrompt - 文末パターンが生成プロンプトと一致する', () => {
  const summaryPrompt = buildSummarySystemPrompt();
  const validationPrompt = buildValidationSystemPrompt();

  for (const patterns of Object.values(SUMMARY_RULES.FIRST_SENTENCE_ENDINGS)) {
    for (const pattern of patterns) {
      expect(summaryPrompt.includes(`〜${pattern}`)).toBeTruthy();
      expect(validationPrompt.includes(`〜${pattern}`)).toBeTruthy();
    }
  }

  for (const patterns of Object.values(SUMMARY_RULES.SECOND_SENTENCE_ENDINGS)) {
    for (const pattern of patterns) {
      expect(summaryPrompt.includes(`〜${pattern}`)).toBeTruthy();
      expect(validationPrompt.includes(`〜${pattern}`)).toBeTruthy();
    }
  }
});

test('buildValidationSystemPrompt - 有効なJSON例が含まれる', () => {
  const prompt = buildValidationSystemPrompt();
  expect(prompt.includes('{"isValid": true, "feedback": ""}')).toBeTruthy();
  expect(prompt.includes('{"isValid": false, "feedback":')).toBeTruthy();
});

test('buildValidationSystemPrompt - 検証手順が明示されている', () => {
  const prompt = buildValidationSystemPrompt();
  expect(prompt.includes('検証手順')).toBeTruthy();
  expect(prompt.includes('二文構成か確認')).toBeTruthy();
  expect(prompt.includes('文末が許可パターンに一致するか')).toBeTruthy();
  expect(prompt.includes('文字数を確認')).toBeTruthy();
});

// --- buildValidationUserMessage ---

test('buildValidationUserMessage - サマリーテキストがラップされる', () => {
  const summary = 'テスト用サマリー\nテスト用2文目';
  const message = buildValidationUserMessage(summary);
  expect(message.includes('検証してください')).toBeTruthy();
  expect(message.includes(summary)).toBeTruthy();
});
