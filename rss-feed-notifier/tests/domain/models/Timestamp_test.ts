/**
 * Timestamp Value Object のテスト
 */
import { expect, test } from 'vitest';
import { InvalidTimestampError, Timestamp } from '../../../src/domain/models/Timestamp.ts';

test('Timestamp.now() は現在時刻のタイムスタンプを生成する', () => {
  const now = Timestamp.now();
  const expected = Date.now();
  // 実行時間の誤差を考慮して100ms以内であることを確認
  expect(Math.abs(now.toMillis() - expected) < 100).toBe(true);
});

test('Timestamp.fromMillis() は有効なミリ秒からタイムスタンプを生成する', () => {
  const millis = 1704067200000; // 2024-01-01 00:00:00 UTC
  const timestamp = Timestamp.fromMillis(millis);
  expect(timestamp.toMillis()).toBe(millis);
});

test('Timestamp.fromMillis() は負の値でInvalidTimestampErrorをスローする', () => {
  expect(() => Timestamp.fromMillis(-1)).toThrow(InvalidTimestampError);
  expect(() => Timestamp.fromMillis(-1)).toThrow('無効なタイムスタンプ: -1');
});

test('Timestamp.fromMillis() はNaNでInvalidTimestampErrorをスローする', () => {
  expect(() => Timestamp.fromMillis(NaN)).toThrow(InvalidTimestampError);
  expect(() => Timestamp.fromMillis(NaN)).toThrow('無効なタイムスタンプ: NaN');
});

test('Timestamp.fromMillis() はInfinityでInvalidTimestampErrorをスローする', () => {
  expect(() => Timestamp.fromMillis(Infinity)).toThrow(InvalidTimestampError);
});

test('Timestamp.toMillis() はミリ秒を返す', () => {
  const millis = 1704067200000;
  const timestamp = Timestamp.fromMillis(millis);
  expect(timestamp.toMillis()).toBe(millis);
});

test('Timestamp.toDate() はDateオブジェクトを返す', () => {
  const millis = 1704067200000;
  const timestamp = Timestamp.fromMillis(millis);
  const date = timestamp.toDate();
  expect(date instanceof Date).toBe(true);
  expect(date.getTime()).toBe(millis);
});

test('Timestamp.isAfter() は後の時刻の場合trueを返す', () => {
  const earlier = Timestamp.fromMillis(1000);
  const later = Timestamp.fromMillis(2000);
  expect(later.isAfter(earlier)).toBe(true);
  expect(earlier.isAfter(later)).toBe(false);
});

test('Timestamp.isBefore() は前の時刻の場合trueを返す', () => {
  const earlier = Timestamp.fromMillis(1000);
  const later = Timestamp.fromMillis(2000);
  expect(earlier.isBefore(later)).toBe(true);
  expect(later.isBefore(earlier)).toBe(false);
});

test('Timestamp.equals() は同じ時刻の場合trueを返す', () => {
  const timestamp1 = Timestamp.fromMillis(1000);
  const timestamp2 = Timestamp.fromMillis(1000);
  expect(timestamp1.equals(timestamp2)).toBe(true);
});

test('Timestamp.equals() は異なる時刻の場合falseを返す', () => {
  const timestamp1 = Timestamp.fromMillis(1000);
  const timestamp2 = Timestamp.fromMillis(2000);
  expect(timestamp1.equals(timestamp2)).toBe(false);
});
