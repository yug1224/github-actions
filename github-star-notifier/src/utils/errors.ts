/**
 * アプリケーション固有のエラークラス
 */

/**
 * エラーコードの型定義
 */
export type ErrorCode =
  | 'ENV_MISSING'
  | 'FILE_NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'UPLOAD_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * アプリケーションエラークラス
 *
 * エラーコードとコンテキスト情報を含む拡張エラー
 */
export class AppError extends Error {
  /**
   * @param message - エラーメッセージ
   * @param code - エラーコード
   * @param context - 追加のコンテキスト情報
   * @param cause - 元のエラー（あれば）
   */
  constructor(
    message: string,
    public code: ErrorCode,
    public context?: Record<string, unknown>,
    cause?: Error,
  ) {
    super(message);
    this.name = 'AppError';
    if (cause) {
      this.cause = cause;
    }
  }

  /**
   * エラー情報を構造化されたオブジェクトとして返す
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
      cause: this.cause instanceof Error ? this.cause.message : this.cause,
    };
  }
}

/**
 * ファイルが見つからないエラー
 */
export class FileNotFoundError extends AppError {
  constructor(filePath: string, cause?: Error) {
    super(
      `File not found: ${filePath}`,
      'FILE_NOT_FOUND',
      { filePath },
      cause,
    );
    this.name = 'FileNotFoundError';
  }
}

/**
 * ネットワークエラー
 */
export class NetworkError extends AppError {
  constructor(url: string, statusCode?: number, cause?: Error) {
    super(
      `Network request failed: ${url}`,
      'NETWORK_ERROR',
      { url, statusCode },
      cause,
    );
    this.name = 'NetworkError';
  }
}

/**
 * 認証エラー
 */
export class AuthError extends AppError {
  constructor(service: string, cause?: Error) {
    super(
      `Authentication failed for ${service}`,
      'AUTH_ERROR',
      { service },
      cause,
    );
    this.name = 'AuthError';
  }
}

/**
 * アップロードエラー
 */
export class UploadError extends AppError {
  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(
      message,
      'UPLOAD_ERROR',
      context,
      cause,
    );
    this.name = 'UploadError';
  }
}
