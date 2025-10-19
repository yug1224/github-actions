/**
 * Timestamp Value Object のテスト
 */
import { assertEquals, assertThrows } from 'jsr:@std/assert';
import { InvalidTimestampError, Timestamp } from '../../../src/domain/models/Timestamp.ts';

Deno.test('Timestamp.now() は現在時刻のタイムスタンプを生成する', () => {
  const now = Timestamp.now();
  const expected = Date.now();
  // 実行時間の誤差を考慮して100ms以内であることを確認
  assertEquals(Math.abs(now.toMillis() - expected) < 100, true);
});

Deno.test('Timestamp.fromMillis() は有効なミリ秒からタイムスタンプを生成する', () => {
  const millis = 1704067200000; // 2024-01-01 00:00:00 UTC
  const timestamp = Timestamp.fromMillis(millis);
  assertEquals(timestamp.toMillis(), millis);
});

Deno.test('Timestamp.fromMillis() は負の値でInvalidTimestampErrorをスローする', () => {
  assertThrows(
    () => Timestamp.fromMillis(-1),
    InvalidTimestampError,
    '無効なタイムスタンプ: -1',
  );
});

Deno.test('Timestamp.fromMillis() はNaNでInvalidTimestampErrorをスローする', () => {
  assertThrows(
    () => Timestamp.fromMillis(NaN),
    InvalidTimestampError,
    '無効なタイムスタンプ: NaN',
  );
});

Deno.test('Timestamp.fromMillis() はInfinityでInvalidTimestampErrorをスローする', () => {
  assertThrows(
    () => Timestamp.fromMillis(Infinity),
    InvalidTimestampError,
  );
});

Deno.test('Timestamp.toMillis() はミリ秒を返す', () => {
  const millis = 1704067200000;
  const timestamp = Timestamp.fromMillis(millis);
  assertEquals(timestamp.toMillis(), millis);
});

Deno.test('Timestamp.toDate() はDateオブジェクトを返す', () => {
  const millis = 1704067200000;
  const timestamp = Timestamp.fromMillis(millis);
  const date = timestamp.toDate();
  assertEquals(date instanceof Date, true);
  assertEquals(date.getTime(), millis);
});

Deno.test('Timestamp.isAfter() は後の時刻の場合trueを返す', () => {
  const earlier = Timestamp.fromMillis(1000);
  const later = Timestamp.fromMillis(2000);
  assertEquals(later.isAfter(earlier), true);
  assertEquals(earlier.isAfter(later), false);
});

Deno.test('Timestamp.isBefore() は前の時刻の場合trueを返す', () => {
  const earlier = Timestamp.fromMillis(1000);
  const later = Timestamp.fromMillis(2000);
  assertEquals(earlier.isBefore(later), true);
  assertEquals(later.isBefore(earlier), false);
});

Deno.test('Timestamp.equals() は同じ時刻の場合trueを返す', () => {
  const timestamp1 = Timestamp.fromMillis(1000);
  const timestamp2 = Timestamp.fromMillis(1000);
  assertEquals(timestamp1.equals(timestamp2), true);
});

Deno.test('Timestamp.equals() は異なる時刻の場合falseを返す', () => {
  const timestamp1 = Timestamp.fromMillis(1000);
  const timestamp2 = Timestamp.fromMillis(2000);
  assertEquals(timestamp1.equals(timestamp2), false);
});
