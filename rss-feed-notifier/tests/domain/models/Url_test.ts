/**
 * Url Value Object のテスト
 */
import { assertEquals, assertThrows } from 'jsr:@std/assert';
import { InvalidUrlError, Url } from '../../../src/domain/models/Url.ts';

Deno.test('Url.create() は有効なURLからUrlを生成する', () => {
  const url = Url.create('https://example.com');
  assertEquals(url.toString(), 'https://example.com/');
});

Deno.test('Url.create() は無効なURLでInvalidUrlErrorをスローする', () => {
  assertThrows(
    () => Url.create('invalid-url'),
    InvalidUrlError,
    '無効なURL',
  );
});

Deno.test('Url.create() は空文字列でInvalidUrlErrorをスローする', () => {
  assertThrows(
    () => Url.create(''),
    InvalidUrlError,
    '無効なURL',
  );
});

Deno.test('Url.toString() はURL文字列を返す', () => {
  const url = Url.create('https://example.com/path?query=1');
  assertEquals(url.toString().startsWith('https://example.com'), true);
});

Deno.test('Url.getHostname() はホスト名を返す', () => {
  const url = Url.create('https://example.com:8080/path');
  assertEquals(url.getHostname(), 'example.com');
});

Deno.test('Url.getPathname() はパス名を返す', () => {
  const url = Url.create('https://example.com/path/to/resource');
  assertEquals(url.getPathname(), '/path/to/resource');
});

Deno.test('Url.equals() は同じURLの場合trueを返す', () => {
  const url1 = Url.create('https://example.com/');
  const url2 = Url.create('https://example.com');
  assertEquals(url1.equals(url2), true);
});

Deno.test('Url.equals() は異なるURLの場合falseを返す', () => {
  const url1 = Url.create('https://example.com/');
  const url2 = Url.create('https://example.org/');
  assertEquals(url1.equals(url2), false);
});

Deno.test('Url は有効なURL文字列を持つ', () => {
  const url = Url.create('https://example.com');
  assertEquals(typeof url.toString(), 'string');
  assertEquals(url.toString().startsWith('https://'), true);
});
