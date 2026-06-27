/**
 * サマリーフォーマット検証のテスト
 */

import { test, expect } from 'vitest';
import {
  flattenEndingPatterns,
  validateSummaryFormat,
} from '../../../../src/infrastructure/external/validators/summaryValidator.ts';

// --- flattenEndingPatterns ---

test('flattenEndingPatterns - カテゴリ別パターンをフラット化できる', () => {
  const categories = {
    伝聞系: ['らしい', 'やつ'] as const,
    推測系: ['かも'] as const,
  };
  const result = flattenEndingPatterns(categories);
  expect(result).toEqual(['らしい', 'やつ', 'かも']);
});

test('flattenEndingPatterns - 空のカテゴリは空配列を返す', () => {
  const result = flattenEndingPatterns({});
  expect(result).toEqual([]);
});

// --- validateSummaryFormat: 合格ケース ---

test('validateSummaryFormat - 正しい二文構成は合格する', () => {
  const text = 'Rust製で高速なビルドツールらしい\n開発体験の向上に期待';
  const result = validateSummaryFormat(text);
  expect(result.isValid).toBeTruthy();
  expect(result.errors.length).toBe(0);
});

test('validateSummaryFormat - 空行を含む二文構成も合格する', () => {
  const text = 'Rust製で高速なビルドツールらしい\n\n開発体験の向上に期待';
  const result = validateSummaryFormat(text);
  expect(result.isValid).toBeTruthy();
  expect(result.errors.length).toBe(0);
});

// --- validateSummaryFormat: 二文構成チェック ---

test('validateSummaryFormat - 一文のみは不合格', () => {
  const text = 'これは一文だけの要約です';
  const result = validateSummaryFormat(text);
  expect(result.isValid).toBeFalsy();
  expect(result.errors.some((e) => e.includes('二文構成'))).toBeTruthy();
});

test('validateSummaryFormat - 三文以上は不合格', () => {
  const text = '一文目\n二文目\n三文目';
  const result = validateSummaryFormat(text);
  expect(result.isValid).toBeFalsy();
  expect(result.errors.some((e) => e.includes('二文構成'))).toBeTruthy();
});

// --- validateSummaryFormat: 句読点チェック ---

test('validateSummaryFormat - 句点を含む場合は不合格', () => {
  const text = 'ビルドツールらしい。\n期待できそう';
  const result = validateSummaryFormat(text);
  expect(result.isValid).toBeFalsy();
  expect(result.errors.some((e) => e.includes('句読点'))).toBeTruthy();
});

test('validateSummaryFormat - 読点を含む場合は不合格', () => {
  const text = 'Rust製で、高速なツールらしい\n期待できそう';
  const result = validateSummaryFormat(text);
  expect(result.isValid).toBeFalsy();
  expect(result.errors.some((e) => e.includes('句読点'))).toBeTruthy();
});

// --- validateSummaryFormat: 文字数チェック ---

test('validateSummaryFormat - 100文字ちょうどは合格する', () => {
  // line1(49) + \n(1) + line2(50) = 100書記素クラスタ
  const line1 = 'あ'.repeat(46) + 'らしい';
  const line2 = 'い'.repeat(47) + 'に期待';
  const text = `${line1}\n${line2}`;
  const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
  expect([...segmenter.segment(text)].length).toBe(100);
  const result = validateSummaryFormat(text);
  const hasCharError = result.errors.some((e) => e.includes('文字以内'));
  expect(hasCharError, `文字数エラーが出てはいけない: ${JSON.stringify(result.errors)}`).toBeFalsy();
});

test('validateSummaryFormat - 101文字以上は不合格', () => {
  // line1(50) + \n(1) + line2(50) = 101書記素クラスタ
  const line1 = 'あ'.repeat(47) + 'らしい';
  const line2 = 'い'.repeat(47) + 'に期待';
  const text = `${line1}\n${line2}`;
  const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
  expect([...segmenter.segment(text)].length).toBe(101);
  const result = validateSummaryFormat(text);
  expect(result.isValid).toBeFalsy();
  expect(result.errors.some((e) => e.includes('文字以内'))).toBeTruthy();
});

// --- validateSummaryFormat: 複合エラー ---

test('validateSummaryFormat - 複数のルール違反を同時に検出する', () => {
  const text = 'これは一文だけで、句読点もあります。';
  const result = validateSummaryFormat(text);
  expect(result.isValid).toBeFalsy();
  expect(result.errors.length >= 2).toBeTruthy();
});

// --- validateSummaryFormat: 文末パターン（警告のみ、isValidには影響しない） ---

test('validateSummaryFormat - 文末パターンが合わなくてもisValidはtrue', () => {
  const text = '何か新しい技術です\n試してみたいと思います';
  const result = validateSummaryFormat(text);
  expect(result.isValid).toBeTruthy();
});
