/**
 * Url Value Object のテスト
 */
import { expect, test } from 'vitest';
import { InvalidUrlError, Url } from '../../../src/domain/models/Url.ts';

test('Url.create() は有効なURLからUrlを生成する', () => {
  const url = Url.create('https://example.com');
  expect(url.toString()).toBe('https://example.com/');
});

test('Url.create() は無効なURLでInvalidUrlErrorをスローする', () => {
  expect(() => Url.create('invalid-url')).toThrow(InvalidUrlError);
  expect(() => Url.create('invalid-url')).toThrow('無効なURL');
});

test('Url.create() は空文字列でInvalidUrlErrorをスローする', () => {
  expect(() => Url.create('')).toThrow(InvalidUrlError);
  expect(() => Url.create('')).toThrow('無効なURL');
});

test('Url.toString() はURL文字列を返す', () => {
  const url = Url.create('https://example.com/path?query=1');
  expect(url.toString().startsWith('https://example.com')).toBe(true);
});

test('Url.getHostname() はホスト名を返す', () => {
  const url = Url.create('https://example.com:8080/path');
  expect(url.getHostname()).toBe('example.com');
});

test('Url.getPathname() はパス名を返す', () => {
  const url = Url.create('https://example.com/path/to/resource');
  expect(url.getPathname()).toBe('/path/to/resource');
});

test('Url.equals() は同じURLの場合trueを返す', () => {
  const url1 = Url.create('https://example.com/');
  const url2 = Url.create('https://example.com');
  expect(url1.equals(url2)).toBe(true);
});

test('Url.equals() は異なるURLの場合falseを返す', () => {
  const url1 = Url.create('https://example.com/');
  const url2 = Url.create('https://example.org/');
  expect(url1.equals(url2)).toBe(false);
});

test('Url は有効なURL文字列を持つ', () => {
  const url = Url.create('https://example.com');
  expect(typeof url.toString()).toBe('string');
  expect(url.toString().startsWith('https://')).toBe(true);
});
