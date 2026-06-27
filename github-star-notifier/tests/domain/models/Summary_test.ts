/**
 * Summary Value Object のテスト
 */

import { test, expect } from 'vitest';
import { InvalidSummaryError, Summary } from '../../../src/domain/models/Summary.ts';

test('Summary - 有効な要約文から生成できる', () => {
  const summary = Summary.create('これは記事の要約です。');
  expect(summary.getText()).toBe('これは記事の要約です。');
});

test('Summary - 空文字の場合はエラーをスローする', () => {
  expect(() => Summary.create('')).toThrow(InvalidSummaryError);
  expect(() => Summary.create('')).toThrow('要約文は空にできません');
});

test('Summary - 空白のみの場合はエラーをスローする', () => {
  expect(() => Summary.create('   ')).toThrow(InvalidSummaryError);
  expect(() => Summary.create('   ')).toThrow('要約文は空にできません');
});

test('Summary - 最大文字数を超える場合はエラーをスローする', () => {
  const longText = 'x'.repeat(Summary.MAX_LENGTH + 1);
  expect(() => Summary.create(longText)).toThrow(InvalidSummaryError);
  expect(() => Summary.create(longText)).toThrow(`要約文は${Summary.MAX_LENGTH}文字以内にしてください`);
});

test('Summary - 前後の空白は自動的にトリムされる', () => {
  const summary = Summary.create('  要約文  ');
  expect(summary.getText()).toBe('要約文');
});

test('Summary - createForBluesky() で短縮された要約を生成できる', () => {
  const longText = 'あ'.repeat(250);
  const summary = Summary.createForBluesky(longText);

  expect(summary.isSuitableForBluesky()).toBeTruthy();
  expect(summary.getLength()).toBe(Summary.BLUESKY_RECOMMENDED_LENGTH);
  expect(summary.getText().endsWith('...')).toBeTruthy();
});

test('Summary - createForBluesky() で短い要約はそのまま生成される', () => {
  const shortText = '短い要約文です。';
  const summary = Summary.createForBluesky(shortText);

  expect(summary.getText()).toBe(shortText);
  expect(summary.isSuitableForBluesky()).toBeTruthy();
});

test('Summary - equals() で等価性を判定できる', () => {
  const summary1 = Summary.create('同じ要約文');
  const summary2 = Summary.create('同じ要約文');
  const summary3 = Summary.create('異なる要約文');

  expect(summary1.equals(summary2)).toBeTruthy();
  expect(summary1.equals(summary3)).toBeFalsy();
});

test('Summary - getLength() で文字数を取得できる', () => {
  const summary = Summary.create('12345');
  expect(summary.getLength()).toBe(5);
});

test('Summary - isSuitableForBluesky() でBluesky投稿に適しているか判定できる', () => {
  const shortSummary = Summary.create('短い要約');
  const longSummary = Summary.create('あ'.repeat(Summary.BLUESKY_RECOMMENDED_LENGTH + 1));

  expect(shortSummary.isSuitableForBluesky()).toBeTruthy();
  expect(longSummary.isSuitableForBluesky()).toBeFalsy();
});

test('Summary - truncate() で指定した文字数に切り詰められる', () => {
  const summary = Summary.create('これは長い要約文です。');
  const truncated = summary.truncate(10);

  expect(truncated.getLength()).toBe(10);
  expect(truncated.getText()).toBe('これは長い要約...');
});

test('Summary - truncate() で短い要約はそのまま返される', () => {
  const summary = Summary.create('短い要約');
  const truncated = summary.truncate(100);

  expect(truncated).toBe(summary);
});

test('Summary - toString() で文字列表現を取得できる', () => {
  const summary = Summary.create('要約文');
  expect(summary.toString()).toBe('要約文');
});

test('Summary - toJSON() でJSON表現を取得できる', () => {
  const now = new Date();
  const summary = Summary.create('要約文', now);
  const json = summary.toJSON();

  expect(json.text).toBe('要約文');
  expect(json.generatedAt).toBe(now.toISOString());
});

test('Summary - getGeneratedAt() で生成日時を取得できる', () => {
  const now = new Date();
  const summary = Summary.create('要約文', now);
  const generatedAt = summary.getGeneratedAt();

  expect(generatedAt.getTime()).toBe(now.getTime());
});

test('Summary - 生成日時を省略すると現在時刻が設定される', () => {
  const before = Date.now();
  const summary = Summary.create('要約文');
  const after = Date.now();

  const generatedAt = summary.getGeneratedAt().getTime();
  expect(generatedAt >= before && generatedAt <= after).toBeTruthy();
});

test('Summary - 最大文字数ちょうどの要約を生成できる', () => {
  const maxLengthText = 'x'.repeat(Summary.MAX_LENGTH);
  const summary = Summary.create(maxLengthText);

  expect(summary.getLength()).toBe(Summary.MAX_LENGTH);
});

test('Summary - 日本語の要約を正しく処理できる', () => {
  const japaneseSummary = Summary.create('これは日本語の要約です。絵文字も含みます😀');
  expect(japaneseSummary.getText()).toBe('これは日本語の要約です。絵文字も含みます😀');
});
