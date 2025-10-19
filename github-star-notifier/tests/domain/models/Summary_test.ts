/**
 * Summary Value Object のテスト
 */

import { assert, assertEquals, assertThrows } from 'https://deno.land/std@0.218.0/assert/mod.ts';
import { InvalidSummaryError, Summary } from '../../../src/domain/models/Summary.ts';

Deno.test('Summary - 有効な要約文から生成できる', () => {
  const summary = Summary.create('これは記事の要約です。');
  assertEquals(summary.getText(), 'これは記事の要約です。');
});

Deno.test('Summary - 空文字の場合はエラーをスローする', () => {
  assertThrows(
    () => Summary.create(''),
    InvalidSummaryError,
    '要約文は空にできません',
  );
});

Deno.test('Summary - 空白のみの場合はエラーをスローする', () => {
  assertThrows(
    () => Summary.create('   '),
    InvalidSummaryError,
    '要約文は空にできません',
  );
});

Deno.test('Summary - 最大文字数を超える場合はエラーをスローする', () => {
  const longText = 'x'.repeat(Summary.MAX_LENGTH + 1);
  assertThrows(
    () => Summary.create(longText),
    InvalidSummaryError,
    `要約文は${Summary.MAX_LENGTH}文字以内にしてください`,
  );
});

Deno.test('Summary - 前後の空白は自動的にトリムされる', () => {
  const summary = Summary.create('  要約文  ');
  assertEquals(summary.getText(), '要約文');
});

Deno.test('Summary - createForBluesky() で短縮された要約を生成できる', () => {
  const longText = 'あ'.repeat(250);
  const summary = Summary.createForBluesky(longText);

  assert(summary.isSuitableForBluesky());
  assertEquals(
    summary.getLength(),
    Summary.BLUESKY_RECOMMENDED_LENGTH,
  );
  assert(summary.getText().endsWith('...'));
});

Deno.test('Summary - createForBluesky() で短い要約はそのまま生成される', () => {
  const shortText = '短い要約文です。';
  const summary = Summary.createForBluesky(shortText);

  assertEquals(summary.getText(), shortText);
  assert(summary.isSuitableForBluesky());
});

Deno.test('Summary - equals() で等価性を判定できる', () => {
  const summary1 = Summary.create('同じ要約文');
  const summary2 = Summary.create('同じ要約文');
  const summary3 = Summary.create('異なる要約文');

  assert(summary1.equals(summary2));
  assert(!summary1.equals(summary3));
});

Deno.test('Summary - getLength() で文字数を取得できる', () => {
  const summary = Summary.create('12345');
  assertEquals(summary.getLength(), 5);
});

Deno.test('Summary - isSuitableForBluesky() でBluesky投稿に適しているか判定できる', () => {
  const shortSummary = Summary.create('短い要約');
  const longSummary = Summary.create(
    'あ'.repeat(Summary.BLUESKY_RECOMMENDED_LENGTH + 1),
  );

  assert(shortSummary.isSuitableForBluesky());
  assert(!longSummary.isSuitableForBluesky());
});

Deno.test('Summary - truncate() で指定した文字数に切り詰められる', () => {
  const summary = Summary.create('これは長い要約文です。');
  const truncated = summary.truncate(10);

  assertEquals(truncated.getLength(), 10);
  assertEquals(truncated.getText(), 'これは長い要約...');
});

Deno.test('Summary - truncate() で短い要約はそのまま返される', () => {
  const summary = Summary.create('短い要約');
  const truncated = summary.truncate(100);

  assertEquals(truncated, summary);
});

Deno.test('Summary - toString() で文字列表現を取得できる', () => {
  const summary = Summary.create('要約文');
  assertEquals(summary.toString(), '要約文');
});

Deno.test('Summary - toJSON() でJSON表現を取得できる', () => {
  const now = new Date();
  const summary = Summary.create('要約文', now);
  const json = summary.toJSON();

  assertEquals(json.text, '要約文');
  assertEquals(json.generatedAt, now.toISOString());
});

Deno.test('Summary - getGeneratedAt() で生成日時を取得できる', () => {
  const now = new Date();
  const summary = Summary.create('要約文', now);
  const generatedAt = summary.getGeneratedAt();

  assertEquals(generatedAt.getTime(), now.getTime());
});

Deno.test('Summary - 生成日時を省略すると現在時刻が設定される', () => {
  const before = Date.now();
  const summary = Summary.create('要約文');
  const after = Date.now();

  const generatedAt = summary.getGeneratedAt().getTime();
  assert(generatedAt >= before && generatedAt <= after);
});

Deno.test('Summary - 最大文字数ちょうどの要約を生成できる', () => {
  const maxLengthText = 'x'.repeat(Summary.MAX_LENGTH);
  const summary = Summary.create(maxLengthText);

  assertEquals(summary.getLength(), Summary.MAX_LENGTH);
});

Deno.test('Summary - 日本語の要約を正しく処理できる', () => {
  const japaneseSummary = Summary.create('これは日本語の要約です。絵文字も含みます😀');
  assertEquals(japaneseSummary.getText(), 'これは日本語の要約です。絵文字も含みます😀');
});
