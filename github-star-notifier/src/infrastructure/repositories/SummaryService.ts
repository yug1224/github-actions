/**
 * Summary Service Implementation
 *
 * AI要約生成サービスの実装。
 */

import type { ISummaryService } from '../../domain/repositories/index.ts';
import type { Summary, Url } from '../../domain/models/index.ts';
import generateSummary from '../external/SummaryGenerator.ts';

/**
 * 要約サービスの実装
 */
export class SummaryService implements ISummaryService {
  constructor(
    private readonly apiKey: string,
    private readonly modelName: string,
  ) {}

  /**
   * テキストコンテンツから要約を生成する
   */
  async generateSummary(textContent: string, url?: Url): Promise<Summary | null> {
    return await generateSummary(
      textContent,
      this.apiKey,
      this.modelName,
      url?.toString(),
    );
  }
}
