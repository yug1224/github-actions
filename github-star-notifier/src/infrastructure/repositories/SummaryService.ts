/**
 * Summary Service Implementation
 *
 * AI要約生成サービスの実装。
 * SummaryGenerator に処理を委譲する。
 */

import type { ISummaryService } from '../../domain/repositories/index.ts';
import type { Summary, Url } from '../../domain/models/index.ts';
import { SummaryGenerator } from '../external/SummaryGenerator.ts';

/**
 * 要約サービスの実装
 */
export class SummaryService implements ISummaryService {
  private readonly generator: SummaryGenerator;

  constructor(apiKey: string, modelName: string) {
    this.generator = new SummaryGenerator(apiKey, modelName);
  }

  /**
   * テキストコンテンツから要約を生成する
   */
  async generateSummary(textContent: string, url?: Url): Promise<Summary | null> {
    return await this.generator.generate(textContent, url?.toString());
  }
}
