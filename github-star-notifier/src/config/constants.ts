/**
 * アプリケーション全体で使用する定数定義
 */

// Bluesky関連
export const BLUESKY_SERVICE_URL = 'https://bsky.social';

// 投稿設定
export const MAX_POST_COUNT = 3;
export const MAX_FEED_ITEMS = 20;

// 画像設定
export const IMAGE_CONFIG = {
  MAX_WIDTH: 2000,
  MAX_HEIGHT: 2000,
  MAX_BYTE_LENGTH: 976.56 * 1000,
  MIME_TYPE: 'image/avif',
} as const;

// リトライ設定
export const RETRY_CONFIG = {
  SUMMARY_MAX_RETRIES: 5,
  IMAGE_UPLOAD_MAX_RETRIES: 3,
  IMAGE_FETCH_MAX_RETRIES: 5,
  IMAGE_UPLOAD_TIMEOUT_MS: 10000,
} as const;

// Gemini AI設定
export const GEMINI_CONFIG = {
  TEMPERATURE: 1,
  TOP_P: 0.95,
  TOP_K: 64,
  MAX_OUTPUT_TOKENS: 8192,
  RESPONSE_MIME_TYPE: 'text/plain',
} as const;

// User Agent
export const USER_AGENT = {
  OGP_FETCH: 'Twitterbot',
} as const;

// 正規表現パターン
export const PATTERNS = {
  STARRED_FILTER: /starred/g,
} as const;
