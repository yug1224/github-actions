/**
 * 汎用リトライヘルパー関数
 */

export interface RetryOptions {
  maxRetries: number;
  onRetry?: (error: unknown, attempt: number) => void;
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * 非同期関数をリトライ機能付きで実行する
 * @param fn 実行する非同期関数
 * @param options リトライオプション
 * @returns 関数の実行結果
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const { maxRetries, onRetry, shouldRetry } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // リトライ判定
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }

      // 最大リトライ回数に達した場合
      if (attempt >= maxRetries) {
        break;
      }

      // リトライコールバック実行
      if (onRetry) {
        onRetry(error, attempt + 1);
      }
    }
  }

  throw lastError;
}

/**
 * Exponential backoffでリトライする
 * @param fn 実行する非同期関数
 * @param options リトライオプション
 * @param initialDelayMs 初回遅延時間（ミリ秒）
 * @param maxDelayMs 最大遅延時間（ミリ秒）
 * @returns 関数の実行結果
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  initialDelayMs = 1000,
  maxDelayMs = 30000,
): Promise<T> {
  const { maxRetries, onRetry, shouldRetry } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // リトライ判定
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }

      // 最大リトライ回数に達した場合
      if (attempt >= maxRetries) {
        break;
      }

      // リトライコールバック実行
      if (onRetry) {
        onRetry(error, attempt + 1);
      }

      // Exponential backoff: 2^attempt * initialDelay
      const delay = Math.min(
        initialDelayMs * Math.pow(2, attempt),
        maxDelayMs,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
