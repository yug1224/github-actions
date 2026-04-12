/**
 * サマリーフォーマット検証のテスト
 */

import { assert, assertEquals } from 'jsr:@std/assert@^1.0.15';
import {
  flattenEndingPatterns,
  validateSummaryFormat,
} from '../../../../src/infrastructure/external/validators/summaryValidator.ts';

// --- flattenEndingPatterns ---

Deno.test('flattenEndingPatterns - カテゴリ別パターンをフラット化できる', () => {
  const categories = {
    伝聞系: ['らしい', 'やつ'] as const,
    推測系: ['かも'] as const,
  };
  const result = flattenEndingPatterns(categories);
  assertEquals(result, ['らしい', 'やつ', 'かも']);
});

Deno.test('flattenEndingPatterns - 空のカテゴリは空配列を返す', () => {
  const result = flattenEndingPatterns({});
  assertEquals(result, []);
});

// --- validateSummaryFormat: 合格ケース ---

Deno.test('validateSummaryFormat - 正しい二文構成は合格する', () => {
  const text = 'Rust製で高速なビルドツールらしい\n開発体験の向上に期待';
  const result = validateSummaryFormat(text);
  assert(result.isValid);
  assertEquals(result.errors.length, 0);
});

Deno.test('validateSummaryFormat - 空行を含む二文構成も合格する', () => {
  const text = 'Rust製で高速なビルドツールらしい\n\n開発体験の向上に期待';
  const result = validateSummaryFormat(text);
  assert(result.isValid);
  assertEquals(result.errors.length, 0);
});

// --- validateSummaryFormat: 二文構成チェック ---

Deno.test('validateSummaryFormat - 一文のみは不合格', () => {
  const text = 'これは一文だけの要約です';
  const result = validateSummaryFormat(text);
  assert(!result.isValid);
  assert(result.errors.some((e) => e.includes('二文構成')));
});

Deno.test('validateSummaryFormat - 三文以上は不合格', () => {
  const text = '一文目\n二文目\n三文目';
  const result = validateSummaryFormat(text);
  assert(!result.isValid);
  assert(result.errors.some((e) => e.includes('二文構成')));
});

// --- validateSummaryFormat: 句読点チェック ---

Deno.test('validateSummaryFormat - 句点を含む場合は不合格', () => {
  const text = 'ビルドツールらしい。\n期待できそう';
  const result = validateSummaryFormat(text);
  assert(!result.isValid);
  assert(result.errors.some((e) => e.includes('句読点')));
});

Deno.test('validateSummaryFormat - 読点を含む場合は不合格', () => {
  const text = 'Rust製で、高速なツールらしい\n期待できそう';
  const result = validateSummaryFormat(text);
  assert(!result.isValid);
  assert(result.errors.some((e) => e.includes('句読点')));
});

// --- validateSummaryFormat: 文字数チェック ---

Deno.test('validateSummaryFormat - 100文字ちょうどは合格する', () => {
  // line1(49) + \n(1) + line2(50) = 100書記素クラスタ
  const line1 = 'あ'.repeat(46) + 'らしい';
  const line2 = 'い'.repeat(47) + 'に期待';
  const text = `${line1}\n${line2}`;
  const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
  assertEquals([...segmenter.segment(text)].length, 100);
  const result = validateSummaryFormat(text);
  const hasCharError = result.errors.some((e) => e.includes('文字以内'));
  assert(!hasCharError, `文字数エラーが出てはいけない: ${JSON.stringify(result.errors)}`);
});

Deno.test('validateSummaryFormat - 101文字以上は不合格', () => {
  // line1(50) + \n(1) + line2(50) = 101書記素クラスタ
  const line1 = 'あ'.repeat(47) + 'らしい';
  const line2 = 'い'.repeat(47) + 'に期待';
  const text = `${line1}\n${line2}`;
  const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
  assertEquals([...segmenter.segment(text)].length, 101);
  const result = validateSummaryFormat(text);
  assert(!result.isValid);
  assert(result.errors.some((e) => e.includes('文字以内')));
});

// --- validateSummaryFormat: 複合エラー ---

Deno.test('validateSummaryFormat - 複数のルール違反を同時に検出する', () => {
  const text = 'これは一文だけで、句読点もあります。';
  const result = validateSummaryFormat(text);
  assert(!result.isValid);
  assert(result.errors.length >= 2, '二文構成と句読点の両方を検出する');
});

// --- validateSummaryFormat: 文末パターン（警告のみ、isValidには影響しない） ---

Deno.test('validateSummaryFormat - 文末パターンが合わなくてもisValidはtrue', () => {
  const text = '何か新しい技術です\n試してみたいと思います';
  const result = validateSummaryFormat(text);
  assert(result.isValid, '文末パターン不一致は警告のみでisValidには影響しない');
});
