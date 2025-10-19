/**
 * Url Value Object のテスト
 */

import { assert, assertEquals, assertThrows } from 'https://deno.land/std@0.218.0/assert/mod.ts';
import { InvalidUrlError, Url } from '../../../src/domain/models/Url.ts';

Deno.test('Url - 有効なURLから生成できる', () => {
  const url = Url.create('https://example.com');
  assertEquals(url.toString(), 'https://example.com/');
});

Deno.test('Url - 無効なURLの場合はエラーをスローする', () => {
  assertThrows(
    () => Url.create('invalid-url'),
    InvalidUrlError,
    '無効なURL',
  );
});

Deno.test('Url - 空文字の場合はエラーをスローする', () => {
  assertThrows(
    () => Url.create(''),
    InvalidUrlError,
    '無効なURL',
  );
});

Deno.test('Url - fromString() で生成できる', () => {
  const url = Url.fromString('https://example.com/path');
  assertEquals(url.toString(), 'https://example.com/path');
});

Deno.test('Url - fromRelative() で相対URLから絶対URLを生成できる', () => {
  const url = Url.fromRelative('/path/to/page', 'https://example.com');
  assertEquals(url.toString(), 'https://example.com/path/to/page');
});

Deno.test('Url - fromRelative() で無効な相対URLの場合はエラーをスローする', () => {
  assertThrows(
    () => Url.fromRelative('invalid', 'invalid-base'),
    InvalidUrlError,
  );
});

Deno.test('Url - isValid() で有効なURLを判定できる', () => {
  assert(Url.isValid('https://example.com'));
  assert(Url.isValid('http://localhost:3000'));
  assert(!Url.isValid('invalid-url'));
  assert(!Url.isValid(''));
});

Deno.test('Url - equals() で等価性を判定できる', () => {
  const url1 = Url.create('https://example.com');
  const url2 = Url.create('https://example.com');
  const url3 = Url.create('https://other.com');

  assert(url1.equals(url2));
  assert(!url1.equals(url3));
});

Deno.test('Url - getDomain() でドメイン名を取得できる', () => {
  const url = Url.create('https://example.com/path');
  assertEquals(url.getDomain(), 'example.com');
});

Deno.test('Url - getProtocol() でプロトコルを取得できる', () => {
  const url = Url.create('https://example.com');
  assertEquals(url.getProtocol(), 'https:');
});

Deno.test('Url - getPath() でパスを取得できる', () => {
  const url = Url.create('https://example.com/path/to/page');
  assertEquals(url.getPath(), '/path/to/page');
});

Deno.test('Url - toJSON() でJSON表現を取得できる', () => {
  const url = Url.create('https://example.com');
  assertEquals(url.toJSON(), 'https://example.com/');
});

Deno.test('Url - URLが正規化される', () => {
  const url = Url.create('https://example.com');
  // トレイリングスラッシュが追加される
  assertEquals(url.toString(), 'https://example.com/');
});

Deno.test('Url - クエリパラメータを含むURLを処理できる', () => {
  const url = Url.create('https://example.com/path?foo=bar&baz=qux');
  assertEquals(url.toString(), 'https://example.com/path?foo=bar&baz=qux');
});

Deno.test('Url - フラグメントを含むURLを処理できる', () => {
  const url = Url.create('https://example.com/path#section');
  assertEquals(url.toString(), 'https://example.com/path#section');
});

Deno.test('Url - ポート番号を含むURLを処理できる', () => {
  const url = Url.create('http://localhost:3000/path');
  assertEquals(url.toString(), 'http://localhost:3000/path');
  assertEquals(url.getDomain(), 'localhost');
});
