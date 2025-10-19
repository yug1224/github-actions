/**
 * Content Repository Interface
 *
 * Webページのコンテンツ取得を抽象化します。
 */

import type { Url } from '../models/index.ts';
import type { OpenGraphData } from '../models/index.ts';

/**
 * コンテンツリポジトリのインターフェース
 */
export interface IContentRepository {
  /**
   * URLから記事の本文を抽出する
   *
   * @param url - 記事のURL
   * @returns 抽出されたテキストコンテンツ、失敗時は空文字列
   */
  extractArticleContent(url: Url): Promise<string>;

  /**
   * URLからOGPデータを取得する
   *
   * @param url - OGPデータを取得するURL
   * @returns Open Graph データ、失敗時は空のOpenGraphData
   */
  fetchOpenGraphData(url: Url): Promise<OpenGraphData>;
}
