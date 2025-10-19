/**
 * アプリケーション全体で使用する定数定義
 */

// Bluesky関連
export const BLUESKY_SERVICE_URL = 'https://bsky.social';
export const BLUESKY_LANGUAGE = 'ja';

// 投稿設定
export const MAX_POST_COUNT = 3; // 1回の実行で投稿する最大数
export const POST_TIME_START_HOUR_UTC = 1; // 投稿可能時間帯の開始（UTC）
export const POST_TIME_END_HOUR_UTC = 15; // 投稿可能時間帯の終了（UTC）

// テキスト制限
export const TEXT_LIMITS = {
  BLUESKY_MAX_LENGTH: 300,
  X_MAX_LENGTH: 280,
  LINK_DISPLAY_MAX_LENGTH: 30,
  LINK_DISPLAY_ELLIPSIS_LENGTH: 26,
  TITLE_MAX_LENGTH: 100,
  TITLE_ELLIPSIS_LENGTH: 96,
} as const;

// 画像設定
export const IMAGE_CONFIG = {
  MAX_WIDTH: 2000,
  MAX_HEIGHT: 2000,
  MAX_BYTE_LENGTH: 976.56 * 1000,
  MIME_TYPE: 'image/avif',
  FORMAT: 'avif',
} as const;

// リトライ設定
export const RETRY_CONFIG = {
  IMAGE_FETCH_MAX_RETRIES: 5,
  IMAGE_UPLOAD_MAX_RETRIES: 5,
  IMAGE_UPLOAD_BASE_TIMEOUT_MS: 10000,
} as const;

// User Agent
export const USER_AGENT = {
  OGP_FETCH: 'Twitterbot',
} as const;

// ファイルパス
export const FILE_PATHS = {
  TIMESTAMP: 'data/.timestamp',
  ITEM_LIST: 'data/.itemList.json',
  TEMP_DIR: 'temp/',
} as const;
