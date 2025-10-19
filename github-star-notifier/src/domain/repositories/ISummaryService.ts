/**
 * Summary Service Interface
 *
 * AI要約生成サービスを抽象化します。
 */

import type { Summary } from '../models/index.ts';
import type { Url } from '../models/index.ts';

/**
 * 要約サービスのインターフェース
 */
export interface ISummaryService {
  /**
   * テキストコンテンツから要約を生成する
   *
   * @param textContent - 要約対象のテキスト
   * @param url - 元のURL（コンテキスト情報として使用）
   * @returns 生成された要約、失敗時はnull
   */
  generateSummary(textContent: string, url?: Url): Promise<Summary | null>;
}
