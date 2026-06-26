/**
 * アプリケーション全体で使用する定数定義
 */

// Bluesky関連
export const BLUESKY_SERVICE_URL = 'https://bsky.social';
export const BLUESKY_LANGUAGE = 'ja';

// 投稿設定
/** 1回の実行で投稿処理に使う時間予算（ミリ秒）。ジョブ timeout 15分に対しセットアップ・in-flight 余裕を確保 */
export const PROCESSING_TIME_BUDGET_MS = 10 * 60 * 1000;

// テキスト制限
export const TEXT_LIMITS = {
  BLUESKY_MAX_LENGTH: 300,
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
