/**
 * Url Value Object のテスト
 */

import { test, expect } from 'vitest';
import { InvalidUrlError, Url } from '../../../src/domain/models/Url.ts';

test('Url - 有効なURLから生成できる', () => {
  const url = Url.create('https://example.com');
  expect(url.toString()).toBe('https://example.com/');
});

test('Url - 無効なURLの場合はエラーをスローする', () => {
  expect(() => Url.create('invalid-url')).toThrow(InvalidUrlError);
  expect(() => Url.create('invalid-url')).toThrow('無効なURL');
});

test('Url - 空文字の場合はエラーをスローする', () => {
  expect(() => Url.create('')).toThrow(InvalidUrlError);
  expect(() => Url.create('')).toThrow('無効なURL');
});

test('Url - fromString() で生成できる', () => {
  const url = Url.fromString('https://example.com/path');
  expect(url.toString()).toBe('https://example.com/path');
});

test('Url - fromRelative() で相対URLから絶対URLを生成できる', () => {
  const url = Url.fromRelative('/path/to/page', 'https://example.com');
  expect(url.toString()).toBe('https://example.com/path/to/page');
});

test('Url - fromRelative() で無効な相対URLの場合はエラーをスローする', () => {
  expect(() => Url.fromRelative('invalid', 'invalid-base')).toThrow(InvalidUrlError);
});

test('Url - isValid() で有効なURLを判定できる', () => {
  expect(Url.isValid('https://example.com')).toBeTruthy();
  expect(Url.isValid('http://localhost:3000')).toBeTruthy();
  expect(Url.isValid('invalid-url')).toBeFalsy();
  expect(Url.isValid('')).toBeFalsy();
});

test('Url - equals() で等価性を判定できる', () => {
  const url1 = Url.create('https://example.com');
  const url2 = Url.create('https://example.com');
  const url3 = Url.create('https://other.com');

  expect(url1.equals(url2)).toBeTruthy();
  expect(url1.equals(url3)).toBeFalsy();
});

test('Url - getDomain() でドメイン名を取得できる', () => {
  const url = Url.create('https://example.com/path');
  expect(url.getDomain()).toBe('example.com');
});

test('Url - getProtocol() でプロトコルを取得できる', () => {
  const url = Url.create('https://example.com');
  expect(url.getProtocol()).toBe('https:');
});

test('Url - getPath() でパスを取得できる', () => {
  const url = Url.create('https://example.com/path/to/page');
  expect(url.getPath()).toBe('/path/to/page');
});

test('Url - toJSON() でJSON表現を取得できる', () => {
  const url = Url.create('https://example.com');
  expect(url.toJSON()).toBe('https://example.com/');
});

test('Url - URLが正規化される', () => {
  const url = Url.create('https://example.com');
  // トレイリングスラッシュが追加される
  expect(url.toString()).toBe('https://example.com/');
});

test('Url - クエリパラメータを含むURLを処理できる', () => {
  const url = Url.create('https://example.com/path?foo=bar&baz=qux');
  expect(url.toString()).toBe('https://example.com/path?foo=bar&baz=qux');
});

test('Url - フラグメントを含むURLを処理できる', () => {
  const url = Url.create('https://example.com/path#section');
  expect(url.toString()).toBe('https://example.com/path#section');
});

test('Url - ポート番号を含むURLを処理できる', () => {
  const url = Url.create('http://localhost:3000/path');
  expect(url.toString()).toBe('http://localhost:3000/path');
  expect(url.getDomain()).toBe('localhost');
});
