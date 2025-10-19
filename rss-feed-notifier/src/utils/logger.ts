/**
 * ロギングユーティリティ
 *
 * アプリケーション全体で一貫したログ出力を提供します。
 */

// ログレベルの型定義
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

// ログメッセージの構造
interface LogMessage {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

/**
 * ログフォーマッター
 */
function formatLog(msg: LogMessage): string {
  const contextStr = msg.context ? ` ${JSON.stringify(msg.context)}` : '';
  return `[${msg.timestamp}] ${msg.level}: ${msg.message}${contextStr}`;
}

/**
 * アプリケーションロガー
 */
export class Logger {
  /**
   * デバッグレベルのログ出力
   */
  debug(message: string, context?: Record<string, unknown>): void {
    const logMsg: LogMessage = {
      level: 'DEBUG',
      message,
      context,
      timestamp: new Date().toISOString(),
    };
    console.debug(formatLog(logMsg));
  }

  /**
   * 情報レベルのログ出力
   */
  info(message: string, context?: Record<string, unknown>): void {
    const logMsg: LogMessage = {
      level: 'INFO',
      message,
      context,
      timestamp: new Date().toISOString(),
    };
    console.log(formatLog(logMsg));
  }

  /**
   * 警告レベルのログ出力
   */
  warn(message: string, context?: Record<string, unknown>): void {
    const logMsg: LogMessage = {
      level: 'WARN',
      message,
      context,
      timestamp: new Date().toISOString(),
    };
    console.warn(formatLog(logMsg));
  }

  /**
   * エラーレベルのログ出力
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorContext = error instanceof Error
      ? { ...context, error: error.message, stack: error.stack }
      : { ...context, error: String(error) };

    const logMsg: LogMessage = {
      level: 'ERROR',
      message,
      context: errorContext,
      timestamp: new Date().toISOString(),
    };
    console.error(formatLog(logMsg));
  }
}

// シングルトンインスタンス
export const logger = new Logger();
