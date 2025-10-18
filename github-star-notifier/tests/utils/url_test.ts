/**
 * URLユーティリティのテスト
 */

import { assertEquals, assertThrows } from 'jsr:@std/assert';
import { getDomain, isValidUrl, toAbsoluteUrl, validateAndNormalizeUrl } from '../../src/utils/url.ts';

Deno.test('validateAndNormalizeUrl - 有効な絶対URL', () => {
  const result = validateAndNormalizeUrl('https://example.com/path');
  assertEquals(result, 'https://example.com/path');
});

Deno.test('validateAndNormalizeUrl - 相対URLとベースURL', () => {
  const result = validateAndNormalizeUrl('/path', 'https://example.com');
  assertEquals(result, 'https://example.com/path');
});

Deno.test('validateAndNormalizeUrl - 無効なURL', () => {
  assertThrows(
    () => validateAndNormalizeUrl('not a url'),
    Error,
    'Invalid URL',
  );
});

Deno.test('isValidUrl - 有効なURL', () => {
  assertEquals(isValidUrl('https://example.com'), true);
  assertEquals(isValidUrl('http://localhost:3000'), true);
});

Deno.test('isValidUrl - 無効なURL', () => {
  assertEquals(isValidUrl('not a url'), false);
  assertEquals(isValidUrl(''), false);
});

Deno.test('toAbsoluteUrl - 相対URLを絶対URLに変換', () => {
  const result = toAbsoluteUrl('/api/data', 'https://api.example.com');
  assertEquals(result, 'https://api.example.com/api/data');
});

Deno.test('getDomain - ドメイン抽出', () => {
  assertEquals(getDomain('https://example.com/path'), 'example.com');
  assertEquals(getDomain('http://sub.example.com:3000/path'), 'sub.example.com');
});

Deno.test('getDomain - 無効なURL', () => {
  assertEquals(getDomain('not a url'), '');
});
