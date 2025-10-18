/**
 * 定数のテスト
 */

import { assertEquals } from 'jsr:@std/assert';
import {
  BLUESKY_SERVICE_URL,
  GEMINI_CONFIG,
  IMAGE_CONFIG,
  MAX_FEED_ITEMS,
  MAX_POST_COUNT,
  PATTERNS,
  RETRY_CONFIG,
  USER_AGENT,
} from '../../src/config/constants.ts';

Deno.test('BLUESKY_SERVICE_URL - 正しい値', () => {
  assertEquals(BLUESKY_SERVICE_URL, 'https://bsky.social');
});

Deno.test('MAX_POST_COUNT - 正の整数', () => {
  assertEquals(MAX_POST_COUNT, 3);
  assertEquals(typeof MAX_POST_COUNT, 'number');
});

Deno.test('MAX_FEED_ITEMS - 正の整数', () => {
  assertEquals(MAX_FEED_ITEMS, 20);
  assertEquals(typeof MAX_FEED_ITEMS, 'number');
});

Deno.test('IMAGE_CONFIG - 必須プロパティが存在', () => {
  assertEquals(typeof IMAGE_CONFIG.MAX_WIDTH, 'number');
  assertEquals(typeof IMAGE_CONFIG.MAX_HEIGHT, 'number');
  assertEquals(typeof IMAGE_CONFIG.MAX_BYTE_LENGTH, 'number');
  assertEquals(IMAGE_CONFIG.MIME_TYPE, 'image/avif');
});

Deno.test('RETRY_CONFIG - 必須プロパティが存在', () => {
  assertEquals(typeof RETRY_CONFIG.SUMMARY_MAX_RETRIES, 'number');
  assertEquals(typeof RETRY_CONFIG.IMAGE_UPLOAD_MAX_RETRIES, 'number');
  assertEquals(typeof RETRY_CONFIG.IMAGE_FETCH_MAX_RETRIES, 'number');
  assertEquals(typeof RETRY_CONFIG.IMAGE_UPLOAD_TIMEOUT_MS, 'number');
});

Deno.test('GEMINI_CONFIG - 必須プロパティが存在', () => {
  assertEquals(typeof GEMINI_CONFIG.TEMPERATURE, 'number');
  assertEquals(typeof GEMINI_CONFIG.TOP_P, 'number');
  assertEquals(typeof GEMINI_CONFIG.TOP_K, 'number');
  assertEquals(typeof GEMINI_CONFIG.MAX_OUTPUT_TOKENS, 'number');
  assertEquals(GEMINI_CONFIG.RESPONSE_MIME_TYPE, 'text/plain');
});

Deno.test('USER_AGENT - 正しい値', () => {
  assertEquals(USER_AGENT.OGP_FETCH, 'Twitterbot');
});

Deno.test('PATTERNS.STARRED_FILTER - 正規表現', () => {
  assertEquals(PATTERNS.STARRED_FILTER instanceof RegExp, true);
  assertEquals(PATTERNS.STARRED_FILTER.test('yug1224 starred repo'), true);
  assertEquals(PATTERNS.STARRED_FILTER.test('yug1224 forked repo'), false);
});
