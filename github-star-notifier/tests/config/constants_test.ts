/**
 * 定数のテスト
 */

import { test, expect } from 'vitest';
import {
  BLUESKY_SERVICE_URL,
  GEMINI_CONFIG,
  IMAGE_CONFIG,
  MAX_FEED_ITEMS,
  PATTERNS,
  PROCESSING_TIME_BUDGET_MS,
  RETRY_CONFIG,
  USER_AGENT,
} from '../../src/config/constants.ts';

test('BLUESKY_SERVICE_URL - 正しい値', () => {
  expect(BLUESKY_SERVICE_URL).toBe('https://bsky.social');
});

test('PROCESSING_TIME_BUDGET_MS - 10分（ミリ秒）', () => {
  expect(PROCESSING_TIME_BUDGET_MS).toBe(10 * 60 * 1000);
  expect(typeof PROCESSING_TIME_BUDGET_MS).toBe('number');
});

test('MAX_FEED_ITEMS - 正の整数', () => {
  expect(MAX_FEED_ITEMS).toBe(20);
  expect(typeof MAX_FEED_ITEMS).toBe('number');
});

test('IMAGE_CONFIG - 必須プロパティが存在', () => {
  expect(typeof IMAGE_CONFIG.MAX_WIDTH).toBe('number');
  expect(typeof IMAGE_CONFIG.MAX_HEIGHT).toBe('number');
  expect(typeof IMAGE_CONFIG.MAX_BYTE_LENGTH).toBe('number');
  expect(IMAGE_CONFIG.MIME_TYPE).toBe('image/avif');
});

test('RETRY_CONFIG - 必須プロパティが存在', () => {
  expect(typeof RETRY_CONFIG.SUMMARY_MAX_RETRIES).toBe('number');
  expect(typeof RETRY_CONFIG.IMAGE_UPLOAD_MAX_RETRIES).toBe('number');
  expect(typeof RETRY_CONFIG.IMAGE_FETCH_MAX_RETRIES).toBe('number');
  expect(typeof RETRY_CONFIG.IMAGE_UPLOAD_TIMEOUT_MS).toBe('number');
});

test('GEMINI_CONFIG - 必須プロパティが存在', () => {
  expect(typeof GEMINI_CONFIG.TEMPERATURE).toBe('number');
  expect(typeof GEMINI_CONFIG.TOP_P).toBe('number');
  expect(typeof GEMINI_CONFIG.TOP_K).toBe('number');
  expect(typeof GEMINI_CONFIG.MAX_OUTPUT_TOKENS).toBe('number');
  expect(GEMINI_CONFIG.RESPONSE_MIME_TYPE).toBe('text/plain');
});

test('USER_AGENT - 正しい値', () => {
  expect(USER_AGENT.OGP_FETCH).toBe('Twitterbot');
});

test('PATTERNS.STARRED_FILTER - 正規表現', () => {
  expect(PATTERNS.STARRED_FILTER instanceof RegExp).toBe(true);
  expect(PATTERNS.STARRED_FILTER.test('yug1224 starred repo')).toBe(true);
  expect(PATTERNS.STARRED_FILTER.test('yug1224 forked repo')).toBe(false);
});
