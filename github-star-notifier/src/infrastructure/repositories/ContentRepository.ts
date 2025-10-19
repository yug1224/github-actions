/**
 * Content Repository Implementation
 *
 * Webページのコンテンツ取得の実装。
 */

import type { IContentRepository } from '../../domain/repositories/index.ts';
import type { OpenGraphData, Url } from '../../domain/models/index.ts';
import extractArticleContent from '../external/ArticleExtractor.ts';
import fetchOpenGraphData from '../external/OgpFetcher.ts';

/**
 * コンテンツリポジトリの実装
 */
export class ContentRepository implements IContentRepository {
  /**
   * URLから記事の本文を抽出する
   */
  async extractArticleContent(url: Url): Promise<string> {
    return await extractArticleContent(url.toString());
  }

  /**
   * URLからOGPデータを取得する
   */
  async fetchOpenGraphData(url: Url): Promise<OpenGraphData> {
    return await fetchOpenGraphData(url);
  }
}
