/**
 * アプリケーション全体で使用する定数定義
 */

// Bluesky関連
export const BLUESKY_SERVICE_URL = 'https://bsky.social';

// 投稿設定
/** 1回の実行で投稿処理に使う時間予算（ミリ秒）。ジョブ timeout 15分に対しセットアップ・in-flight 余裕を確保 */
export const PROCESSING_TIME_BUDGET_MS = 10 * 60 * 1000;
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

// サマリールール定義（Single Source of Truth）
// プロンプト生成・ルールベース検証・LLM検証のすべてがここを参照する
export const SUMMARY_RULES = {
  MAX_LENGTH: 100,
  MAX_VALIDATION_RETRIES: 3,
  // カテゴリ別の文末パターン（プロンプトとバリデーションで共用）
  FIRST_SENTENCE_ENDINGS: {
    伝聞系: ['らしい', 'やつ', 'ツール'],
    推測系: ['かも', 'っぽい', 'みたい'],
    印象系: ['そう', '印象', 'ところ'],
  },
  SECOND_SENTENCE_ENDINGS: {
    期待系: ['期待', '楽しみ', '試したい'],
    感想系: ['良いな', 'かも', '気になる', '使えそう', '使えそうかな', '便利そう', '刺さりそうかも'],
  },
} as const;

// User Agent
export const USER_AGENT = {
  OGP_FETCH: 'Twitterbot',
} as const;

// 正規表現パターン
export const PATTERNS = {
  STARRED_FILTER: /starred/g,
} as const;
